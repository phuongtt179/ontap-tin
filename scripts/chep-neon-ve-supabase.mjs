// Chép dữ liệu từ Neon về Supabase — dùng khi đã chuyển dữ liệu sang Neon mà muốn QUAY LẠI Supabase.
// Bảng tài khoản (auth.users) luôn ở Supabase nên không đụng tới; chỉ chép các bảng public có ở cả hai bên.
//
//   node scripts/chep-neon-ve-supabase.mjs              so sánh số dòng hai bên (chỉ đọc)
//   node scripts/chep-neon-ve-supabase.mjs --thu        thử nạp 50 dòng mỗi bảng vào Supabase rồi HOÀN TÁC (không đổi gì)
//   node scripts/chep-neon-ve-supabase.mjs --that-su    XOÁ dữ liệu public ở Supabase và nạp lại toàn bộ từ Neon
//
// Trước khi chạy --that-su: tạm dừng app (không ai ghi vào Neon), chạy `node scripts/sao-luu-supabase.mjs`
// (lệnh này từ chối nếu không có bản sao lưu Supabase trong 2 giờ qua), rồi xoá biến VITE_NEON_DATA_URL trên Vercel.
// Cần trong .env: NEON_DATABASE_URL (kết nối trực tiếp), SUPABASE_PAT.
import pg from 'pg'
import { readFileSync, readdirSync, statSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..')
const REF = 'waalvhrutfugmwhmbhqd'
const CO_LO = 200
const CHE_DO = process.argv.includes('--that-su') ? 'that-su' : process.argv.includes('--thu') ? 'thu' : 'so-sanh'

const env = readFileSync(join(GOC, '.env'), 'utf8')
const lay = k => env.match(new RegExp(`^\\s*${k}\\s*=\\s*['"]?([^'"\\s]+)`, 'm'))?.[1]
const PAT = lay('SUPABASE_PAT'), NEON_URL = lay('NEON_DATABASE_URL')
if (!PAT || !NEON_URL) { console.error('Thiếu SUPABASE_PAT hoặc NEON_DATABASE_URL trong .env'); process.exit(1) }

const nghi = ms => new Promise(r => setTimeout(r, ms))
async function sb(query) {
  for (let lan = 1; ; lan++) {
    try {
      const r = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
        method: 'POST', headers: { Authorization: `Bearer ${PAT}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ query }),
      })
      const j = await r.json()
      if (r.ok && !j.message) return j
      throw new Error(j.message || `HTTP ${r.status}`)
    } catch (e) {
      if (lan >= 3 || /ERROR:/.test(e.message)) throw e   // lỗi SQL thì không thử lại
      await nghi(lan * 5000)
    }
  }
}

const neon = new pg.Client({ connectionString: NEON_URL.replace('sslmode=require', 'sslmode=verify-full') })
await neon.connect()
const nx = async (s, p) => (await neon.query(s, p)).rows
const q = s => `"${s}"`

// Cột chép được: có ở cả hai bên, bỏ cột generated / identity always
const cotCua = async (ben, b) => {
  const sqlCot = `select a.attname c from pg_attribute a join pg_class c on c.oid=a.attrelid
    where c.relnamespace='public'::regnamespace and c.relname='${b}' and a.attnum>0 and not a.attisdropped
      and a.attgenerated = '' and a.attidentity <> 'a' order by a.attnum`
  return (ben === 'neon' ? await nx(sqlCot) : await sb(sqlCot)).map(r => r.c)
}
const bangSb = new Set((await sb(`select table_name b from information_schema.tables where table_schema='public' and table_type='BASE TABLE'`)).map(r => r.b))
const bangNeon = (await nx(`select table_name b from information_schema.tables where table_schema='public' and table_type='BASE TABLE' order by 1`)).map(r => r.b)
const bang = bangNeon.filter(b => bangSb.has(b))
const chiNeon = bangNeon.filter(b => !bangSb.has(b))
if (chiNeon.length) console.log('⚠ Bảng chỉ có ở Neon (không chép):', chiNeon.join(', '))

function goiJson(rows) {
  const s = JSON.stringify(rows)
  let tag = 'cnv'
  while (s.includes(`$${tag}$`)) tag += 'x'
  return `$${tag}$${s}$${tag}$::jsonb`
}

if (CHE_DO === 'so-sanh') {
  const kq = []
  for (const b of bang) {
    const [{ n: nNeon }] = await nx(`select count(*)::int n from public.${q(b)}`)
    const [{ n: nSb }] = await sb(`select count(*)::int n from public.${q(b)}`)
    kq.push({ bang: b, neon: nNeon, supabase: nSb, chenh: nNeon - nSb })
  }
  console.table(kq.filter(k => k.chenh !== 0))
  console.log(`${kq.filter(k => k.chenh === 0).length}/${kq.length} bảng bằng số dòng. Chạy --thu để thử, --that-su để chép thật.`)
}

if (CHE_DO === 'thu') {
  let loi = 0
  for (const b of bang) {
    const cotSb = new Set(await cotCua('sb', b))
    const cot = (await cotCua('neon', b)).filter(c => cotSb.has(c))
    const rows = await nx(`select ${cot.map(q).join(', ')} from public.${q(b)} limit 50`)
    if (!rows.length) { console.log('trống', b); continue }
    const ds = cot.map(q).join(', ')
    try {
      await sb(`begin; set local session_replication_role = replica;
        insert into public.${q(b)} (${ds}) select ${ds} from jsonb_populate_recordset(null::public.${q(b)}, ${goiJson(rows)}) on conflict do nothing;
        rollback;`)
      console.log('OK ', b, rows.length, 'dòng (đã hoàn tác)')
    } catch (e) { loi++; console.log('LỖI', b, e.message.split('\n')[0]) }
    await nghi(300)
  }
  console.log(loi ? `⚠ ${loi} bảng lỗi — sửa trước khi chép thật` : 'Thử xong, không lỗi, Supabase không thay đổi gì.')
}

if (CHE_DO === 'that-su') {
  const thuMuc = join(GOC, 'SaoLuu')
  const moi = readdirSync(thuMuc).filter(t => /^\d{4}-\d{2}-\d{2}_\d{4}$/.test(t)).map(t => statSync(join(thuMuc, t)).mtimeMs).sort().pop()
  if (!moi || Date.now() - moi > 2 * 3600e3) {
    console.error('Chưa có bản sao lưu Supabase trong 2 giờ qua. Chạy `node scripts/sao-luu-supabase.mjs` trước.')
    process.exit(1)
  }
  console.log('Chép Neon → Supabase cho', bang.length, 'bảng. Dữ liệu public cũ ở Supabase sẽ bị thay.')
  const kq = []
  for (const b of bang) {
    const cotSb = new Set(await cotCua('sb', b))
    const cot = (await cotCua('neon', b)).filter(c => cotSb.has(c))
    const ds = cot.map(q).join(', ')
    const [{ n: tong }] = await nx(`select count(*)::int n from public.${q(b)}`)
    // replica: không chạy trigger (chặn sửa điểm, ghi lịch sử, chặn nộp trùng) và không kiểm khoá ngoại khi nạp lại
    await sb(`begin; set local session_replication_role = replica; delete from public.${q(b)}; commit;`)
    for (let i = 0; i < tong; i += CO_LO) {
      const rows = await nx(`select ${ds} from public.${q(b)} order by ctid limit ${CO_LO} offset ${i}`)
      await sb(`begin; set local session_replication_role = replica;
        insert into public.${q(b)} (${ds}) select ${ds} from jsonb_populate_recordset(null::public.${q(b)}, ${goiJson(rows)});
        commit;`)
      await nghi(250)
    }
    const [{ n: sau }] = await sb(`select count(*)::int n from public.${q(b)}`)
    kq.push({ bang: b, neon: tong, supabase: sau, khop: tong === sau })
    console.log(`${tong === sau ? 'OK  ' : 'LỆCH'} ${b}: ${sau}/${tong}`)
  }
  // Sequence theo số lớn nhất, rồi cập nhật thống kê
  const seqs = await sb(`select s.sequencename sq, d.refobjid::regclass::text b, a.attname col from pg_sequences s
    join pg_class sc on sc.relname=s.sequencename and sc.relnamespace='public'::regnamespace
    join pg_depend d on d.objid=sc.oid and d.deptype in ('a','i') join pg_attribute a on a.attrelid=d.refobjid and a.attnum=d.refobjsubid
    where s.schemaname='public'`)
  for (const s of seqs) await sb(`select setval('public.${q(s.sq)}', coalesce((select max(${q(s.col)}) from ${s.b}), 1))`)
  await sb(`analyze`)
  const lech = kq.filter(k => !k.khop)
  console.log(lech.length ? `⚠ ${lech.length} bảng lệch số dòng — chạy lại lệnh này` : `Xong: ${kq.length} bảng khớp. Nhớ xoá VITE_NEON_DATA_URL trên Vercel rồi Redeploy.`)
}

await neon.end()
