// Tầng dữ liệu — ngân hàng bài (phòng thi): bai_luyen (đề, học sinh đọc bài được mở), bai_luyen_bi_mat + bai_luyen_test
// (chỉ giáo viên), bai_luyen_mo (mở cho khoá), bai_luyen_ket_qua / bai_luyen_nop (máy chấm ghi). Mỗi hàm trả { data, error } như supabase.
import { supabase } from '../lib/supabase'

const GIOI_HAN = 2000
const COT_BAI = 'id, ung_dung, cach_cham, ten, dang, do_kho, nguon, tu_khoa_hoc, created_at'

/** giáo viên: mọi bài của 1 ứng dụng (không kèm đề cho nhẹ) + các khoá được mở + số kỳ thi đang dùng */
export function layNganHang(ungDung = 'python') {
  return supabase.from('bai_luyen')
    .select(`${COT_BAI}, bai_luyen_mo(grade), exam_bai(exam_id)`)
    .eq('ung_dung', ungDung).order('created_at', { ascending: false }).limit(GIOI_HAN)
}

/** 1 bài đầy đủ cho giáo viên sửa: đề, phần bí mật (lời giải, tiêu chí), test */
export async function layBaiDayDu(id) {
  const [bai, biMat, test] = await Promise.all([
    supabase.from('bai_luyen').select(`${COT_BAI}, de_bai, bai_luyen_mo(grade)`).eq('id', id).maybeSingle(),
    supabase.from('bai_luyen_bi_mat').select('loi_giai, tieu_chi').eq('bai_id', id).maybeSingle(),
    supabase.from('bai_luyen_test').select('input, expected, diem').eq('bai_id', id).order('thu_tu').limit(GIOI_HAN),
  ])
  const error = bai.error || biMat.error || test.error
  return { error, data: bai.data && { ...bai.data, ...(biMat.data || { loi_giai: '', tieu_chi: '' }), tests: test.data || [] } }
}

/** thêm (id rỗng) hoặc sửa bài, ghi luôn phần bí mật, test, khoá được mở. Trả { data: { id }, error } */
export async function luuBaiDayDu(id, { bai, loi_giai = '', tieu_chi = '', tests = [], khoa = [] }) {
  const luu = id
    ? await supabase.from('bai_luyen').update(bai).eq('id', id).select('id').single()
    : await supabase.from('bai_luyen').insert(bai).select('id').single()
  if (luu.error) return luu
  const baiId = luu.data.id
  const bm = await supabase.from('bai_luyen_bi_mat').upsert({ bai_id: baiId, loi_giai, tieu_chi })
  if (bm.error) return bm
  const xoaTest = await supabase.from('bai_luyen_test').delete().eq('bai_id', baiId)
  if (xoaTest.error) return xoaTest
  if (tests.length) {
    const t = await supabase.from('bai_luyen_test').insert(tests.map((x, i) => ({ bai_id: baiId, thu_tu: i, input: x.input, expected: x.expected, diem: Number(x.diem) || 1 })))
    if (t.error) return t
  }
  const mo = await datMoChoKhoa(baiId, khoa)
  if (mo.error) return mo
  return { data: { id: baiId }, error: null }
}

/** thay danh sách khoá được mở của 1 bài */
export async function datMoChoKhoa(baiId, khoa) {
  const xoa = await supabase.from('bai_luyen_mo').delete().eq('bai_id', baiId)
  if (xoa.error || !khoa.length) return { error: xoa.error }
  return supabase.from('bai_luyen_mo').insert(khoa.map(grade => ({ bai_id: baiId, grade })))
}

/** xoá bài (bị chặn nếu kỳ thi còn dùng — khoá ngoại exam_bai.bai_luyen_id) */
export function xoaBaiLuyen(id) {
  return supabase.from('bai_luyen').delete().eq('id', id)
}

/** học sinh: các bài mở cho khoá (RLS chỉ cho thấy bài mở cho khoá em đã được duyệt) */
export function layBaiChoKhoa(grade) {
  return supabase.from('bai_luyen_mo').select(`bai_luyen(${COT_BAI})`).eq('grade', grade).limit(GIOI_HAN)
}

/** 1 bài để học sinh làm: chỉ đề, không có lời giải / test */
export function layDeBai(id) {
  return supabase.from('bai_luyen').select(`${COT_BAI}, de_bai`).eq('id', id).maybeSingle()
}

/** kết quả luyện của em (điểm cao nhất, số lần) theo từng bài */
export function layKetQuaCuaEm(userId) {
  return supabase.from('bai_luyen_ket_qua').select('bai_id, diem, so_lan').eq('user_id', userId).limit(GIOI_HAN)
}

/** các lần nộp của em ở 1 bài, mới nhất trước */
export function layLanNopLuyen(baiId, userId) {
  return supabase.from('bai_luyen_nop').select('id, ket_qua, diem, created_at').eq('bai_id', baiId).eq('user_id', userId)
    .order('created_at', { ascending: false }).limit(20)
}

/** giáo viên: kết quả luyện của mọi học sinh ở 1 bài */
export function layKetQuaTheoBai(baiId) {
  return supabase.from('bai_luyen_ket_qua').select('user_id, diem, so_lan, cap_nhat, profiles(full_name, username)').eq('bai_id', baiId)
    .order('diem', { ascending: false }).limit(GIOI_HAN)
}

/** mở nhiều bài cùng lúc cho 1 khoá (bài đã mở thì giữ nguyên) */
export function moNhieuBaiChoKhoa(ids, grade) {
  return supabase.from('bai_luyen_mo').upsert(ids.map(bai_id => ({ bai_id, grade })), { onConflict: 'bai_id,grade', ignoreDuplicates: true })
}

/** đóng nhiều bài với 1 khoá */
export function dongNhieuBaiVoiKhoa(ids, grade) {
  return supabase.from('bai_luyen_mo').delete().in('bai_id', ids).eq('grade', grade)
}
