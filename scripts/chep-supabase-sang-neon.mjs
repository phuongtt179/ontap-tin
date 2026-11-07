// Chép cấu trúc + dữ liệu Supabase sang Neon — dùng cho đêm CHUYỂN NHÀ (và để làm mới bản thử).
//   node scripts/chep-supabase-sang-neon.mjs            kiểm tra điều kiện, không ghi gì
//   node scripts/chep-supabase-sang-neon.mjs --that-su  LÀM TRỐNG schema public của Neon rồi dựng lại + nạp dữ liệu
// Đọc cấu trúc từ Supabase (Management API), dữ liệu từ bản sao lưu mới nhất SaoLuu/<ngày-giờ> (phải trong 1 giờ qua:
// chạy `node scripts/sao-luu-supabase.mjs` ngay trước). KHÔNG ghi gì vào Supabase. Không đụng schema auth / neon_auth
// do Data API của Neon tạo. Sau khi chạy: bấm "Refresh schema cache" ở Neon → Data API.
// Cần trong .env: SUPABASE_PAT, NEON_DATABASE_URL (kết nối trực tiếp, không -pooler).
import pg from 'pg'
import { readFileSync, readdirSync, statSync, writeFileSync } from 'fs'
import { gunzipSync } from 'zlib'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..')
const REF = 'waalvhrutfugmwhmbhqd'
const THAT_SU = process.argv.includes('--that-su')
const env = readFileSync(join(GOC, '.env'), 'utf8')
const layEnv = k => env.match(new RegExp(`^\\s*${k}\\s*=\\s*['"]?([^'"\\s]+)`, 'm'))?.[1]
const PAT = layEnv('SUPABASE_PAT'), url = layEnv('NEON_DATABASE_URL')
if (!PAT || !url) { console.error('Thiếu SUPABASE_PAT hoặc NEON_DATABASE_URL trong .env'); process.exit(1) }
if (url.includes('-pooler')) { console.error('NEON_DATABASE_URL phải là kết nối trực tiếp (không -pooler)'); process.exit(1) }

async function sb(query) {
  const r = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: 'POST', headers: { Authorization: `Bearer ${PAT}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ query }),
  })
  const j = await r.json()
  if (!r.ok || j.message) throw new Error(j.message || `HTTP ${r.status}`)
  return j
}

const tenSaoLuu = readdirSync(join(GOC, 'SaoLuu')).filter(t => /^\d{4}-\d{2}-\d{2}_\d{4}$/.test(t)).sort().pop()
const thuMuc = tenSaoLuu && join(GOC, 'SaoLuu', tenSaoLuu)
const tuoi = thuMuc ? (Date.now() - statSync(join(thuMuc, 'kiem-tra.json')).mtimeMs) / 60000 : Infinity
const kiemTra = JSON.parse(readFileSync(join(thuMuc, 'kiem-tra.json'), 'utf8'))
console.log(`Bản sao lưu: ${tenSaoLuu} (${Math.round(tuoi)} phút trước, ${kiemTra.so_loi} lỗi)`)
if (tuoi > 60 || kiemTra.so_loi) { console.error('Cần bản sao lưu Supabase trong 1 giờ qua và không lỗi: chạy `node scripts/sao-luu-supabase.mjs` trước.'); process.exit(1) }

const c = new pg.Client({ connectionString: url.replace('sslmode=require', 'sslmode=verify-full') })
await c.connect()
const nx = async (s, p) => (await c.query(s, p)).rows
const log = []
const chay = async (ten, s) => {
  try { await c.query(s) } catch (e) { log.push({ ten, loi: e.message, s: (s.text || s).slice(0, 300) }); console.log('  LỖI', ten, '-', e.message) }
}
const q = s => `"${s}"`

const [{ n: soBang }] = await nx(`select count(*)::int n from information_schema.tables where table_schema='public'`)
console.log('Neon hiện có', soBang, 'bảng trong public.')
if (!THAT_SU) { console.log('Chưa ghi gì. Chạy lại với --that-su để làm trống Neon và chép.'); await c.end(); process.exit(0) }

// Làm trống public của Neon: bảng (kéo theo policy, trigger, khoá ngoại, chỉ mục), view, hàm, sequence, kiểu.
// Giữ nguyên schema public và quyền của Data API trên schema.
console.log('Làm trống schema public của Neon…')
for (const r of await nx(`select viewname n from pg_views where schemaname='public'`)) await chay('drop view ' + r.n, `drop view if exists public.${q(r.n)} cascade`)
for (const r of await nx(`select tablename n from pg_tables where schemaname='public'`)) await chay('drop bang ' + r.n, `drop table if exists public.${q(r.n)} cascade`)
for (const r of await nx(`select p.oid::regprocedure::text f from pg_proc p where p.pronamespace='public'::regnamespace and p.prokind in ('f','p')`)) await chay('drop ham ' + r.f, `drop function if exists ${r.f.startsWith('public.') ? r.f : 'public.' + r.f} cascade`)
for (const r of await nx(`select sequencename n from pg_sequences where schemaname='public'`)) await chay('drop seq ' + r.n, `drop sequence if exists public.${q(r.n)} cascade`)
for (const r of await nx(`select t.typname n from pg_type t where t.typnamespace='public'::regnamespace and t.typtype in ('e','d','c') and not exists (select 1 from pg_class c where c.reltype=t.oid)`)) await chay('drop kieu ' + r.n, `drop type if exists public.${q(r.n)} cascade`)

// 0. extension trong schema extensions (giống Supabase)
await chay('schema extensions', `create schema if not exists extensions`)
await chay('uuid-ossp', `create extension if not exists "uuid-ossp" with schema extensions`)
await chay('pgcrypto', `create extension if not exists pgcrypto with schema extensions`)
await chay('grant extensions', `grant usage on schema extensions to authenticated, anonymous`)

// 1. sequence
const seqs = await sb(`select sequencename s, data_type t, start_value, increment_by from pg_sequences where schemaname='public'`)
for (const s of seqs) await chay('seq ' + s.s, `create sequence if not exists public.${q(s.s)} as ${s.t} start ${s.start_value} increment ${s.increment_by}`)

// 2. bảng + cột
const cot = await sb(`select c.relname b, a.attname ten, format_type(a.atttypid, a.atttypmod) kieu, a.attnotnull nn,
  pg_get_expr(d.adbin, d.adrelid) mac_dinh, a.attidentity id, a.attgenerated gen
  from pg_attribute a join pg_class c on c.oid=a.attrelid left join pg_attrdef d on d.adrelid=a.attrelid and d.adnum=a.attnum
  where c.relnamespace='public'::regnamespace and c.relkind='r' and a.attnum>0 and not a.attisdropped order by c.relname, a.attnum`)
const bang = [...new Set(cot.map(x => x.b))]
for (const b of bang) {
  const dong = cot.filter(x => x.b === b).map(x => {
    let s = `${q(x.ten)} ${x.kieu}`
    if (x.gen === 's') s += ` generated always as (${x.mac_dinh}) stored`
    else if (x.id) s += ` generated ${x.id === 'a' ? 'always' : 'by default'} as identity`
    else if (x.mac_dinh) s += ` default ${x.mac_dinh}`
    if (x.nn) s += ' not null'
    return s
  })
  await chay('bang ' + b, `create table public.${q(b)} (${dong.join(', ')})`)
}
console.log('Da tao', bang.length, 'bang')

// 3. hàm (sau bảng vì hàm SQL kiểm tra bảng lúc tạo)
const ham = await sb(`select p.proname ten, pg_get_functiondef(p.oid) d from pg_proc p where p.pronamespace='public'::regnamespace and p.prokind='f'`)
for (const h of ham) await chay('ham ' + h.ten, h.d)

// 4. khoá chính / duy nhất / kiểm tra (chưa có khoá ngoại)
const rb = await sb(`select conrelid::regclass::text b, conname ten, contype loai, pg_get_constraintdef(oid) d from pg_constraint
  where connamespace='public'::regnamespace and conrelid<>0 order by case contype when 'p' then 0 when 'u' then 1 when 'c' then 2 else 3 end`)
for (const r of rb.filter(r => r.loai !== 'f')) await chay('rb ' + r.ten, `alter table ${r.b} add constraint ${q(r.ten)} ${r.d}`)

// 5. dữ liệu từ bản sao lưu (chưa có trigger nên không bị chặn / ghi lịch sử)
const cotGen = new Set(cot.filter(x => x.gen === 's').map(x => `${x.b}.${x.ten}`))
const kq = []
for (const b of bang) {
  let rows = []
  try { rows = JSON.parse(gunzipSync(readFileSync(`${thuMuc}/public.${b}.json.gz`))) } catch { kq.push({ b, loi: 'khong co tep' }); continue }
  const cols = cot.filter(x => x.b === b && !cotGen.has(`${b}.${x.ten}`) && x.id !== 'a').map(x => q(x.ten)).join(', ')
  for (let i = 0; i < rows.length; i += 500) {
    await chay(`nap ${b} ${i}`, { text: `insert into public.${q(b)} (${cols}) select ${cols} from jsonb_populate_recordset(null::public.${q(b)}, $1::jsonb)`, values: [JSON.stringify(rows.slice(i, i + 500))] })
  }
  const [{ n }] = await nx(`select count(*)::int n from public.${q(b)}`)
  kq.push({ b, sao_luu: rows.length, neon: n, khop: rows.length === n })
}
console.table(kq.filter(k => !k.khop))
console.log('Bang khop so dong:', kq.filter(k => k.khop).length, '/', kq.length, '| tong dong:', kq.reduce((x, k) => x + (k.neon || 0), 0))

// 6. khoá ngoại (bỏ các khoá trỏ tới auth.users: bảng tài khoản vẫn ở Supabase)
const fk = rb.filter(r => r.loai === 'f')
const boQua = fk.filter(r => /REFERENCES auth\./.test(r.d))
for (const r of fk.filter(r => !/REFERENCES auth\./.test(r.d))) await chay('fk ' + r.ten, `alter table ${r.b} add constraint ${q(r.ten)} ${r.d}`)
console.log('Khoa ngoai:', fk.length - boQua.length, 'da tao,', boQua.length, 'bo qua (tro toi auth.users)')

// 7. chỉ mục không thuộc ràng buộc
const cm = await sb(`select i.indexdef d, i.indexname ten from pg_indexes i where i.schemaname='public'
  and not exists (select 1 from pg_constraint k where k.conindid = (quote_ident(i.schemaname)||'.'||quote_ident(i.indexname))::regclass)`)
for (const x of cm) await chay('cm ' + x.ten, x.d)

// 8. trigger trên bảng public
const tg = await sb(`select t.tgname ten, pg_get_triggerdef(t.oid) d from pg_trigger t join pg_class c on c.oid=t.tgrelid
  where c.relnamespace='public'::regnamespace and not t.tgisinternal`)
for (const x of tg) await chay('trigger ' + x.ten, x.d)

// 9. RLS + policy
const rls = await sb(`select relname b, relrowsecurity bat, relforcerowsecurity ep from pg_class where relnamespace='public'::regnamespace and relkind='r'`)
for (const r of rls) {
  if (r.bat) await chay('rls ' + r.b, `alter table public.${q(r.b)} enable row level security`)
  if (r.ep) await chay('force ' + r.b, `alter table public.${q(r.b)} force row level security`)
}
const pol = await sb(`select tablename b, policyname ten, permissive, roles::text[] roles, cmd, qual, with_check from pg_policies where schemaname='public'`)
const vai = r => (r === 'anon' ? 'anonymous' : r)
for (const p of pol) {
  let s = `create policy ${q(p.ten)} on public.${q(p.b)} as ${p.permissive} for ${p.cmd} to ${p.roles.map(vai).join(', ')}`
  if (p.qual) s += ` using (${p.qual})`
  if (p.with_check) s += ` with check (${p.with_check})`
  await chay('policy ' + p.ten, s)
}

// 10. quyền bảng / hàm giống Supabase (anon -> anonymous)
const gr = await sb(`select table_name b, grantee, string_agg(privilege_type, ', ') quyen from information_schema.role_table_grants
  where table_schema='public' and grantee in ('anon','authenticated') group by 1, 2`)
for (const g of gr) await chay(`grant ${g.b} ${g.grantee}`, `grant ${g.quyen} on public.${q(g.b)} to ${vai(g.grantee)}`)
await chay('usage public', `grant usage on schema public to authenticated, anonymous`)
await chay('seq grant', `grant usage, select on all sequences in schema public to authenticated, anonymous`)
const hq = await sb(`select p.oid::regprocedure::text f, has_function_privilege('anon', p.oid, 'execute') anon, has_function_privilege('authenticated', p.oid, 'execute') au
  from pg_proc p where p.pronamespace='public'::regnamespace and p.prokind='f'`)
for (const h of hq) {
  await chay('revoke ' + h.f, `revoke execute on function public.${h.f} from public`)
  if (h.au) await chay('grant au ' + h.f, `grant execute on function public.${h.f} to authenticated`)
  if (h.anon) await chay('grant anon ' + h.f, `grant execute on function public.${h.f} to anonymous`)
}

// 11. sequence theo số lớn nhất + thống kê
for (const s of await sb(`select s.sequencename sq, d.refobjid::regclass::text b, a.attname col from pg_sequences s
  join pg_class sc on sc.relname=s.sequencename and sc.relnamespace='public'::regnamespace
  join pg_depend d on d.objid=sc.oid and d.deptype in ('a','i') join pg_attribute a on a.attrelid=d.refobjid and a.attnum=d.refobjsubid where s.schemaname='public'`))
  await chay('setval ' + s.sq, `select setval('public.${q(s.sq)}', coalesce((select max(${q(s.col)}) from ${s.b}), 1))`)
await chay('analyze', 'analyze')

const dem = (await nx(`select (select count(*)::int from pg_policies where schemaname='public') pol, (select count(*)::int from pg_proc where pronamespace='public'::regnamespace) ham,
  (select count(*)::int from pg_trigger t join pg_class c on c.oid=t.tgrelid where c.relnamespace='public'::regnamespace and not t.tgisinternal) trg,
  (select count(*)::int from pg_indexes where schemaname='public') cm, pg_size_pretty(pg_database_size(current_database())) co`))[0]
console.log('Neon:', JSON.stringify(dem), '| Supabase co: 95 policy, 18 ham, 6 trigger public')
console.log('Bo qua khoa ngoai:', boQua.map(r => r.ten).join(', '))
await chay('ham rieng Neon', readFileSync(join(GOC, 'migration_neon_tai_khoan.sql'), 'utf8'))
await chay('nap lai schema Data API', `notify pgrst, 'reload schema'`)
writeFileSync(join(thuMuc, 'chep-sang-neon.json'), JSON.stringify({ log, kq, boQua }, null, 1))
console.log('So loi:', log.length)
await c.end()
