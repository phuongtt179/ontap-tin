// Sao lưu toàn bộ dữ liệu về máy (từ 07/11/2026 dữ liệu ở Neon; gói miễn phí chỉ khôi phục được 6 giờ gần nhất).
//   node scripts/sao-luu-neon.mjs        sao lưu đầy đủ vào SaoLuu/neon_<ngày-giờ>/
//   node scripts/sao-luu-neon.mjs --thu  chỉ lấy cấu trúc + vài bảng nhỏ vào SaoLuu/neon_thu/ để kiểm tra
// Dữ liệu public và cấu trúc lấy từ Neon; tài khoản đăng nhập (auth.users, auth.identities) lấy từ Supabase.
// Mỗi bảng 1 tệp .json.gz (cùng dạng với sao-luu-supabase.mjs) + cau-truc.json + kiem-tra.json (số dòng đã đối chiếu).
// Cần trong .env: NEON_DATABASE_URL, SUPABASE_PAT. Chạy lúc không có lớp.
// ⚠ Thư mục SaoLuu/ có mật khẩu đã mã hoá và dữ liệu học sinh: giữ riêng tư, KHÔNG đưa lên Git.
import pg from 'pg'
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync, existsSync } from 'fs'
import { gzipSync } from 'zlib'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..')
const REF = 'waalvhrutfugmwhmbhqd'
const CO_DONG_TRANG = 1000
const GIU_LAI = 8   // giữ 8 bản đầy đủ gần nhất
const THU = process.argv.includes('--thu')
const BANG_THU = ['grades', 'classes']

const env = readFileSync(join(GOC, '.env'), 'utf8')
const lay = k => env.match(new RegExp(`^\\s*${k}\\s*=\\s*['"]?([^'"\\s]+)`, 'm'))?.[1]
const NEON_URL = lay('NEON_DATABASE_URL'), PAT = lay('SUPABASE_PAT')
if (!NEON_URL || !PAT) { console.error('Thiếu NEON_DATABASE_URL hoặc SUPABASE_PAT trong .env'); process.exit(1) }

const c = new pg.Client({ connectionString: NEON_URL.replace('sslmode=require', 'sslmode=verify-full') })
await c.connect()
const nx = async s => (await c.query(s)).rows

async function sb(query) {
  const r = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: 'POST', headers: { Authorization: `Bearer ${PAT}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ query }),
  })
  const j = await r.json()
  if (!r.ok || j.message) throw new Error(j.message || `HTTP ${r.status}`)
  return j
}

const layCauTruc = async () => ({
  cot: await nx(`select c.relname b, a.attname ten, format_type(a.atttypid, a.atttypmod) kieu, a.attnotnull nn, pg_get_expr(d.adbin, d.adrelid) mac_dinh, a.attidentity id, a.attgenerated gen
    from pg_attribute a join pg_class c on c.oid=a.attrelid left join pg_attrdef d on d.adrelid=a.attrelid and d.adnum=a.attnum
    where c.relnamespace='public'::regnamespace and c.relkind='r' and a.attnum>0 and not a.attisdropped order by 1, a.attnum`),
  rang_buoc: await nx(`select conrelid::regclass::text b, conname ten, contype::text loai, pg_get_constraintdef(oid) d from pg_constraint where connamespace='public'::regnamespace and conrelid<>0 order by 1, 2`),
  chi_muc: await nx(`select tablename b, indexname ten, indexdef d from pg_indexes where schemaname='public' order by 1, 2`),
  ham: await nx(`select p.proname ten, pg_get_functiondef(p.oid) d from pg_proc p where p.pronamespace='public'::regnamespace and p.prokind='f' order by 1`),
  trigger: await nx(`select c.relname b, t.tgname ten, pg_get_triggerdef(t.oid) d from pg_trigger t join pg_class c on c.oid=t.tgrelid where c.relnamespace='public'::regnamespace and not t.tgisinternal order by 1, 2`),
  rls: await nx(`select tablename b, policyname ten, permissive, roles::text, cmd, qual, with_check from pg_policies where schemaname='public' order by 1, 2`),
  rls_bat: await nx(`select relname b, relrowsecurity bat from pg_class where relnamespace='public'::regnamespace and relkind='r' order by 1`),
  quyen: await nx(`select table_name b, grantee, string_agg(privilege_type, ', ') quyen from information_schema.role_table_grants where table_schema='public' and grantee in ('anonymous','authenticated') group by 1, 2 order by 1, 2`),
})

const bd = new Date()
const dau = n => String(n).padStart(2, '0')
const ten = THU ? 'neon_thu' : `neon_${bd.getFullYear()}-${dau(bd.getMonth() + 1)}-${dau(bd.getDate())}_${dau(bd.getHours())}${dau(bd.getMinutes())}`
const gocSaoLuu = join(GOC, 'SaoLuu')
const thuMuc = join(gocSaoLuu, ten)
if (!existsSync(thuMuc)) mkdirSync(thuMuc, { recursive: true })

console.log('Lấy cấu trúc từ Neon…')
writeFileSync(join(thuMuc, 'cau-truc.json'), JSON.stringify(await layCauTruc(), null, 1))

const ketQua = []
let loi = 0
const ghi = (bang, dong, n, khoa) => {
  const tep = `${bang}.json.gz`
  writeFileSync(join(thuMuc, tep), gzipSync(JSON.stringify(dong)))
  const kq = { bang, tep, da_luu: dong.length, trong_db: n, khop: dong.length === n, khoa_chinh: khoa }
  ketQua.push(kq)
  console.log(`${kq.khop ? 'OK ' : 'LỆCH'} ${bang}: ${dong.length}/${n} dòng`)
  if (!kq.khop) loi++
}

const bang = (await nx(`select table_name b from information_schema.tables where table_schema='public' and table_type='BASE TABLE' order by 1`))
  .map(r => r.b).filter(b => !THU || BANG_THU.includes(b))
for (const b of bang) {
  try {
    const khoa = (await nx(`select a.attname c from pg_index i join pg_attribute a on a.attrelid=i.indrelid and a.attnum=any(i.indkey)
      where i.indrelid='public."${b}"'::regclass and i.indisprimary order by array_position(i.indkey, a.attnum)`)).map(r => r.c)
    const orderBy = khoa.length ? khoa.map(k => `"${k}"`).join(', ') : 'ctid'
    // Cùng một giao dịch để các trang nhất quán khi có người đang ghi
    await c.query('begin isolation level repeatable read read only')
    const dong = []
    for (let offset = 0; ; offset += CO_DONG_TRANG) {
      const trang = (await c.query(`select to_jsonb(t) r from public."${b}" t order by ${orderBy} limit ${CO_DONG_TRANG} offset ${offset}`)).rows
      dong.push(...trang.map(x => x.r))
      if (trang.length < CO_DONG_TRANG) break
    }
    const [{ n }] = (await c.query(`select count(*)::int n from public."${b}"`)).rows
    await c.query('commit')
    ghi(`public.${b}`, dong, n, khoa)
  } catch (e) {
    await c.query('rollback').catch(() => {})
    loi++
    ketQua.push({ bang: `public.${b}`, loi: e.message })
    console.log(`LỖI public.${b}: ${e.message}`)
  }
}

if (!THU) {
  for (const b of ['users', 'identities']) {
    try {
      const dong = []
      for (let offset = 0; ; offset += 500) {
        const trang = await sb(`select to_jsonb(t) r from auth."${b}" t order by t.id limit 500 offset ${offset}`)
        dong.push(...trang.map(x => x.r))
        if (trang.length < 500) break
      }
      const [{ n }] = await sb(`select count(*)::int n from auth."${b}"`)
      ghi(`auth.${b}`, dong, n, ['id'])
    } catch (e) {
      loi++
      ketQua.push({ bang: `auth.${b}`, loi: e.message })
      console.log(`LỖI auth.${b}: ${e.message}`)
    }
  }
}

await c.end()
writeFileSync(join(thuMuc, 'kiem-tra.json'), JSON.stringify({ bat_dau: bd.toISOString(), ket_thuc: new Date().toISOString(), nguon: 'neon + auth supabase', thu: THU, so_loi: loi, bang: ketQua }, null, 1))
console.log(`\nXong: ${ketQua.length} bảng, ${ketQua.reduce((x, k) => x + (k.da_luu || 0), 0)} dòng, ${loi} lỗi → ${thuMuc}`)
if (loi) { console.log('⚠ Bản này chưa trọn vẹn, xem kiem-tra.json và chạy lại.'); process.exit(1) }
if (!THU) {
  const cu = readdirSync(gocSaoLuu).filter(t => /^neon_\d{4}-\d{2}-\d{2}_\d{4}$/.test(t)).sort().reverse().slice(GIU_LAI)
  for (const t of cu) { rmSync(join(gocSaoLuu, t), { recursive: true }); console.log('Đã xoá bản cũ:', t) }
}
