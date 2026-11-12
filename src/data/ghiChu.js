// Tầng dữ liệu — bảng student_notes (ghi chú học tập của học sinh). Em chỉ đọc / sửa ghi chú của mình; giáo viên xem / xoá được.
import { supabase } from '../lib/supabase'

const COT = 'id, user_id, title, content, color, topic, is_pinned, created_at, updated_at, grade, lesson_id'

/** ghi chú của em: ghim trước, mới sửa trước */
export function layGhiChuCuaEm(userId) {
  return supabase.from('student_notes').select(COT).eq('user_id', userId)
    .order('is_pinned', { ascending: false }).order('updated_at', { ascending: false }).limit(1000)
}

/** ghi chú của nhiều em (trang giáo viên), mới sửa trước */
export function layGhiChuCuaCacHs(userIds) {
  return supabase.from('student_notes').select(COT).in('user_id', userIds).order('updated_at', { ascending: false }).limit(5000)
}

export function themGhiChu(dong) {
  return supabase.from('student_notes').insert(dong)
}

/** sửa (tự đặt giờ sửa) */
export function suaGhiChu(id, thayDoi) {
  return supabase.from('student_notes').update({ ...thayDoi, updated_at: new Date().toISOString() }).eq('id', id)
}

export function xoaGhiChu(id) {
  return supabase.from('student_notes').delete().eq('id', id)
}
