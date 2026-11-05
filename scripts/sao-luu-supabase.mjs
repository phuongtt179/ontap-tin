// Sao lưu toàn bộ dữ liệu Supabase về máy (gói miễn phí không có bản sao lưu tự động).
//   node scripts/sao-luu-supabase.mjs              sao lưu đầy đủ vào SaoLuu/<ngày-giờ>/
//   node scripts/sao-luu-supabase.mjs --thu        chỉ lấy cấu trúc + vài bảng nhỏ vào SaoLuu/thu/ để kiểm tra
// Cần SUPABASE_PAT trong .env (Personal Access Token). Tải từng trang rồi nghỉ để máy nano không quá tải: chạy lúc không có lớp.
// Mỗi bảng 1 tệp .json.gz + cau-truc.json (cột, ràng buộc, chỉ mục, hàm, trigger, RLS) + kiem-tra.json (số dòng đã đối chiếu).
// ⚠ Thư mục SaoLuu/ có mật khẩu đã mã hoá và dữ liệu học sinh: giữ riêng tư, KHÔNG đưa lên Git.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync, existsSync } from 'fs'
import { gzipSync } from 'zlib'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..')
const REF = 'waalvhrutfugmwhmbhqd'
const CO_DONG_TRANG = 500
const NGHI_MS = 400
const GIU_LAI = 8   // giữ 8 bản đầy đủ gần nhất
const THU = process.argv.includes('--thu')
const BANG_THU = ['public.grades', 'public.classes', 'auth.identities']

const env = readFileSync(join(GOC, '.env'), 'utf8')
const PAT = env.match(/^\s*SUPABASE_PAT\s*=\s*(\S+)/m)?.[1]
if (!PAT) { console.error('Thiếu SUPABASE_PAT trong .env'); process.exit(1) }

const nghi = ms => new Promise(r => setTimeout(r, ms))

async function sql(query) {
  for (let lan = 1; ; lan++) {
    try {
      const r = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${PAT}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })
      const j = await r.json()
      if (r.ok && !j.message) return j
      throw new Error(j.message || `HTTP ${r.status}`)
    } catch (e) {
      if (lan >= 4) throw e
      console.log(`  lỗi tạm (${String(e.message).slice(0, 80)}), thử lại sau ${lan * 10} giây`)
      await nghi(lan * 10000)
    }
  }
}

const tenDayDu = (s, b) => `"${s}"."${b}"`

async function layCauTruc() {
  return {
    cot: await sql(`select table_schema, table_name, ordinal_position, column_name, data_type, udt_name, is_nullable, column_default
      from information_schema.columns where table_schema = 'public' order by 1, 2, 3`),
    rang_buoc: await sql(`select conrelid::regclass::text bang, conname ten, contype loai, pg_get_constraintdef(oid) dinh_nghia
      from pg_constraint where connamespace = 'public'::regnamespace and conrelid <> 0 order by 1, 2`),
    chi_muc: await sql(`select tablename bang, indexname ten, indexdef dinh_nghia from pg_indexes where schemaname = 'public' order by 1, 2`),
    ham: await sql(`select p.proname ten, pg_get_functiondef(p.oid) dinh_nghia from pg_proc p
      where p.pronamespace = 'public'::regnamespace and p.prokind = 'f' order by 1`),
    trigger: await sql(`select c.oid::regclass::text bang, t.tgname ten, pg_get_triggerdef(t.oid) dinh_nghia from pg_trigger t
      join pg_class c on c.oid = t.tgrelid join pg_namespace n on n.oid = c.relnamespace
      where not t.tgisinternal and (n.nspname = 'public' or (n.nspname = 'auth' and c.relname = 'users')) order by 1, 2`),
    rls: await sql(`select tablename bang, policyname ten, permissive, roles::text, cmd, qual, with_check from pg_policies where schemaname = 'public' order by 1, 2`),
    rls_bat: await sql(`select c.relname bang, c.relrowsecurity bat from pg_class c where c.relnamespace = 'public'::regnamespace and c.relkind = 'r' order by 1`),
    kieu_enum: await sql(`select t.typname ten, array_agg(e.enumlabel order by e.enumsortorder)::text gia_tri from pg_type t
      join pg_enum e on e.enumtypid = t.oid join pg_namespace n on n.oid = t.typnamespace where n.nspname = 'public' group by 1`),
    view: await sql(`select viewname ten, definition dinh_nghia from pg_views where schemaname = 'public'`),
  }
}

async function danhSachBang() {
  const ds = await sql(`select table_schema s, table_name b from information_schema.tables
    where table_schema = 'public' and table_type = 'BASE TABLE' order by 2`)
  const tatCa = [...ds, { s: 'auth', b: 'users' }, { s: 'auth', b: 'identities' }]
  return THU ? tatCa.filter(t => BANG_THU.includes(`${t.s}.${t.b}`)) : tatCa
}

async function cotKhoaChinh(s, b) {
  const r = await sql(`select a.attname c from pg_index i
    join pg_attribute a on a.attrelid = i.indrelid and a.attnum = any(i.indkey)
    where i.indrelid = '${tenDayDu(s, b)}'::regclass and i.indisprimary order by array_position(i.indkey, a.attnum)`)
  return r.map(x => x.c)
}

async function saoLuuBang(s, b, thuMuc) {
  const khoa = await cotKhoaChinh(s, b)
  const orderBy = khoa.length ? khoa.map(c => `t."${c}"`).join(', ') : 't.ctid'
  const dong = []
  for (let offset = 0; ; offset += CO_DONG_TRANG) {
    const trang = await sql(`select to_jsonb(t) r from ${tenDayDu(s, b)} t order by ${orderBy} limit ${CO_DONG_TRANG} offset ${offset}`)
    dong.push(...trang.map(x => x.r))
    if (trang.length < CO_DONG_TRANG) break
    await nghi(NGHI_MS)
  }
  const [{ n }] = await sql(`select count(*)::int n from ${tenDayDu(s, b)}`)
  const tep = `${s}.${b}.json.gz`
  writeFileSync(join(thuMuc, tep), gzipSync(JSON.stringify(dong)))
  await nghi(NGHI_MS)
  return { bang: `${s}.${b}`, tep, da_luu: dong.length, trong_db: n, khop: dong.length === n, khoa_chinh: khoa }
}

function donBanCu(goc) {
  const cu = readdirSync(goc).filter(t => /^\d{4}-\d{2}-\d{2}_\d{4}$/.test(t)).sort().reverse().slice(GIU_LAI)
  for (const t of cu) { rmSync(join(goc, t), { recursive: true }); console.log('Đã xoá bản cũ:', t) }
}

const bd = new Date()
const dau = n => String(n).padStart(2, '0')
const ten = THU ? 'thu' : `${bd.getFullYear()}-${dau(bd.getMonth() + 1)}-${dau(bd.getDate())}_${dau(bd.getHours())}${dau(bd.getMinutes())}`
const gocSaoLuu = join(GOC, 'SaoLuu')
const thuMuc = join(gocSaoLuu, ten)
if (!existsSync(thuMuc)) mkdirSync(thuMuc, { recursive: true })

console.log('Lấy cấu trúc…')
writeFileSync(join(thuMuc, 'cau-truc.json'), JSON.stringify(await layCauTruc(), null, 1))

const ketQua = []
let loi = 0
for (const { s, b } of await danhSachBang()) {
  try {
    const kq = await saoLuuBang(s, b, thuMuc)
    ketQua.push(kq)
    console.log(`${kq.khop ? 'OK ' : 'LỆCH'} ${kq.bang}: ${kq.da_luu}/${kq.trong_db} dòng`)
    if (!kq.khop) loi++
  } catch (e) {
    loi++
    ketQua.push({ bang: `${s}.${b}`, loi: e.message })
    console.log(`LỖI ${s}.${b}: ${e.message}`)
  }
}

writeFileSync(join(thuMuc, 'kiem-tra.json'), JSON.stringify({ bat_dau: bd.toISOString(), ket_thuc: new Date().toISOString(), thu: THU, so_loi: loi, bang: ketQua }, null, 1))
const tongDong = ketQua.reduce((x, k) => x + (k.da_luu || 0), 0)
console.log(`\nXong: ${ketQua.length} bảng, ${tongDong} dòng, ${loi} lỗi → ${thuMuc}`)
if (loi) {
  // Có thể lệch vài dòng nếu đang có người nộp bài trong lúc sao lưu; lỗi thì không xoá bản cũ
  console.log('⚠ Bản này chưa trọn vẹn, xem kiem-tra.json và chạy lại lúc không có lớp.')
  process.exit(1)
}
if (!THU) donBanCu(gocSaoLuu)
