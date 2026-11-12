// Tầng dữ liệu — bảng lesson_faq: hỏi đáp mẫu của từng bài (giáo viên / AI soạn, giáo viên duyệt; học sinh chỉ thấy câu đã duyệt).
// Mỗi hàm trả { data, error } như supabase.
import { supabase } from '../lib/supabase'

const COT = 'id, lesson_id, question, answer, approved, approved_at, source, sort_order, use_count, created_at'

/** mọi câu của 1 bài: chưa duyệt trước, rồi theo thứ tự */
export function layHoiDapCuaBai(lessonId) {
  return supabase.from('lesson_faq').select(COT).eq('lesson_id', lessonId).order('approved').order('sort_order').order('created_at').limit(500)
}

/** câu đã duyệt cho học sinh xem (hay được hỏi trước) */
export function layHoiDapMauChoEm(lessonId) {
  return supabase.from('lesson_faq').select('id, question, answer').eq('lesson_id', lessonId).eq('approved', true)
    .order('use_count', { ascending: false }).order('sort_order').limit(30)
}

/** số câu đã duyệt của từng bài → { lessonId: số } */
export async function demHoiDapDaDuyet(lessonIds) {
  const { data, error } = await supabase.from('lesson_faq').select('lesson_id').eq('approved', true).in('lesson_id', lessonIds).limit(10000)
  const dem = {}
  ;(data || []).forEach(r => { dem[r.lesson_id] = (dem[r.lesson_id] || 0) + 1 })
  return { data: dem, error }
}

/** thêm 1 hoặc nhiều câu → { data: dòng vừa thêm } */
export function themHoiDap(dong) {
  return supabase.from('lesson_faq').insert(dong).select(COT)
}

/** sửa 1 câu → { data: dòng sau khi sửa } */
export function suaHoiDap(id, thayDoi) {
  return supabase.from('lesson_faq').update(thayDoi).eq('id', id).select(COT).single()
}

/** duyệt nhiều câu một lần */
export function duyetHoiDap(ids) {
  return supabase.from('lesson_faq').update({ approved: true, approved_at: new Date().toISOString() }).in('id', ids)
}

export function xoaHoiDap(id) {
  return supabase.from('lesson_faq').delete().eq('id', id)
}
