// Tầng dữ liệu — bảng lesson_progress (tiến độ học từng bài của học sinh). Mỗi hàm trả { data, error } (hoặc { count }).
// Học sinh chỉ đọc / ghi tiến độ của mình: RLS trên Neon quyết định. Quy tắc hoàn thành bài: domain/tienDoBaiHoc.js.
import { supabase } from '../lib/supabase'

const BANG = 'lesson_progress'

/** tiến độ của em ở 1 bài (null nếu chưa học) */
export function layTienDoBai(userId, lessonId) {
  return supabase.from(BANG).select('*').eq('user_id', userId).eq('lesson_id', lessonId).maybeSingle()
}

/** số bài em đã hoàn thành (chỉ đếm, không tải dòng) */
export function demBaiHoanThanh(userId) {
  return supabase.from(BANG).select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('completed', true)
}

/** ghi tiến độ 1 bài (tạo mới hoặc sửa), trả dòng sau khi ghi */
export function luuTienDo(dong) {
  return supabase.from(BANG).upsert(dong, { onConflict: 'user_id,lesson_id' }).select().single()
}
