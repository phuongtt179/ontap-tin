// Tầng dữ liệu — cây nội dung: topics (chủ đề) → units (đơn vị) → lesson_titles (tiêu đề nhỏ).
// Mỗi hàm trả { data, error } như supabase (trừ khi ghi khác). Chỉ giáo viên / trợ giảng sửa được: RLS trên Neon quyết định.
import { supabase } from '../lib/supabase'
import { doiChuDeCuaBaiHoc } from './baiHoc'
import { doiChuDeCuaCauHoi } from './cauHoi'

const GIOI_HAN = 5000
const COT_CHU_DE = 'id, name, grade'
const COT_DON_VI = 'id, name, grade, topic, sort_order'
const COT_TIEU_DE = 'id, unit_id, name, sort_order'

/** xếp tên theo kiểu người đọc: "Chủ đề 2" trước "Chủ đề 10" */
export const xepTheoTen = (a, b) => a.name.localeCompare(b.name, 'vi', { numeric: true })

// ───────── chủ đề ─────────

/** chủ đề (mọi khoá, hoặc các khoá trong danh sách — thường kèm 'all' = dùng chung), đã xếp theo tên */
export async function layChuDe(cacKhoa) {
  let q = supabase.from('topics').select(COT_CHU_DE).limit(GIOI_HAN)
  if (cacKhoa) q = q.in('grade', cacKhoa)
  const kq = await q
  return { ...kq, data: kq.data ? [...kq.data].sort(xepTheoTen) : kq.data }
}

/** thêm 1 hoặc nhiều chủ đề */
export function themChuDe(dong) {
  return supabase.from('topics').insert(dong)
}

export function suaChuDe(id, thayDoi) {
  return supabase.from('topics').update(thayDoi).eq('id', id)
}

export function xoaChuDe(id) {
  return supabase.from('topics').delete().eq('id', id)
}

// ───────── đơn vị ─────────

/** đơn vị của 1 khoá (1 chủ đề nếu có), theo chủ đề → thứ tự → tên */
export function layDonVi(grade, topic) {
  let q = supabase.from('units').select(COT_DON_VI).eq('grade', grade)
  if (topic) q = q.eq('topic', topic)
  else q = q.order('topic')
  return q.order('sort_order').order('name').limit(GIOI_HAN)
}

/** đơn vị của cả khoá theo thứ tự đơn vị (không gom theo chủ đề) — lộ trình bài cho AI (domain/moKhoaBai.loTrinhKhoa) */
export function layDonViCuaKhoa(grade) {
  return supabase.from('units').select(COT_DON_VI).eq('grade', grade).order('sort_order').order('name').limit(GIOI_HAN)
}

/** số đơn vị theo từng "khoá||chủ đề" (cột nhẹ) */
export async function demDonViTheoChuDe() {
  const { data, error } = await supabase.from('units').select('grade, topic').limit(GIOI_HAN)
  const dem = {}
  ;(data || []).forEach(u => { const k = `${u.grade}||${u.topic}`; dem[k] = (dem[k] || 0) + 1 })
  return { data: dem, error }
}

/** thêm 1 hoặc nhiều đơn vị */
export function themDonVi(dong) {
  return supabase.from('units').insert(dong)
}

export function suaDonVi(id, thayDoi) {
  return supabase.from('units').update(thayDoi).eq('id', id)
}

export function xoaDonVi(id) {
  return supabase.from('units').delete().eq('id', id)
}

/** chủ đề đổi tên → đơn vị thuộc chủ đề đó (trong khoá) đổi theo */
export function doiChuDeCuaDonVi(grade, tenCu, tenMoi) {
  return supabase.from('units').update({ topic: tenMoi }).eq('topic', tenCu).eq('grade', grade)
}

/** chủ đề chuyển khoá → đơn vị của chủ đề chuyển theo */
export function doiKhoaDonViCuaChuDe(topic, khoaCu, khoaMoi) {
  return supabase.from('units').update({ grade: khoaMoi }).eq('topic', topic).eq('grade', khoaCu)
}

// ───────── tiêu đề nhỏ ─────────

/** tiêu đề nhỏ của 1 đơn vị theo thứ tự */
export function layTieuDe(unitId) {
  return supabase.from('lesson_titles').select(COT_TIEU_DE).eq('unit_id', unitId).order('sort_order').order('name').limit(GIOI_HAN)
}

/** số tiêu đề nhỏ của từng đơn vị → { unitId: số } */
export async function demTieuDeTheoDonVi(unitIds) {
  const { data, error } = await supabase.from('lesson_titles').select('unit_id').in('unit_id', unitIds).limit(GIOI_HAN)
  const dem = {}
  ;(data || []).forEach(r => { dem[r.unit_id] = (dem[r.unit_id] || 0) + 1 })
  return { data: dem, error }
}

export function themTieuDe(dong) {
  return supabase.from('lesson_titles').insert(dong)
}

export function suaTieuDe(id, thayDoi) {
  return supabase.from('lesson_titles').update(thayDoi).eq('id', id)
}

export function xoaTieuDe(id) {
  return supabase.from('lesson_titles').delete().eq('id', id)
}

// ───────── thứ tự ─────────

/** ghi lại thứ tự sau khi kéo / bấm lên xuống: chỉ ghi dòng có thứ tự đổi */
export function ghiThuTu(bang, ds) {
  if (!['units', 'lesson_titles'].includes(bang)) throw new Error('bảng không xếp thứ tự được: ' + bang)
  return Promise.all(ds.map((d, i) => d.sort_order === i ? null : supabase.from(bang).update({ sort_order: i }).eq('id', d.id)).filter(Boolean))
}

// ───────── sửa chủ đề kèm dữ liệu liên quan ─────────

/**
 * Sửa tên / khoá của chủ đề + kéo theo: đổi tên → bài học, câu hỏi, đơn vị đổi theo; đổi khoá → đơn vị chuyển khoá.
 * Đổi tên đơn vị TRƯỚC rồi mới chuyển khoá (bước sau tìm đơn vị theo tên mới — chạy song song thì có thể sót).
 * Trả { error } của bước sửa chủ đề.
 */
export async function suaChuDeVaLienQuan(id, { tenCu, khoaCu, tenMoi, khoaMoi }) {
  const { error } = await suaChuDe(id, { name: tenMoi, grade: khoaMoi })
  if (error) return { error }
  if (tenMoi !== tenCu) {
    await Promise.all([
      doiChuDeCuaBaiHoc(khoaCu, tenCu, tenMoi),
      doiChuDeCuaCauHoi(khoaCu, tenCu, tenMoi),
      doiChuDeCuaDonVi(khoaCu, tenCu, tenMoi),
    ])
  }
  if (khoaMoi !== khoaCu) await doiKhoaDonViCuaChuDe(tenMoi, khoaCu, khoaMoi)
  return { error: null }
}
