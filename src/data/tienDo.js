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

const COT_TIEN_DO_LOP = 'id, user_id, video_watched, quiz_passed, quiz_correct, quiz_total, completed, updated_at'

/** tiến độ cả lớp ở 1 bài (trang chấm bài của giáo viên) — chỉ các cột trang dùng */
export function layTienDoCuaLop(lessonId, userIds) {
  return supabase.from(BANG).select(COT_TIEN_DO_LOP).eq('lesson_id', lessonId).in('user_id', userIds)
}

/** dấu vết nhẹ (id + giờ sửa) để biết tiến độ cả lớp có đổi không trước khi tải đầy đủ */
export function layDauVetTienDo(lessonId, userIds) {
  return supabase.from(BANG).select('id, updated_at').eq('lesson_id', lessonId).in('user_id', userIds)
}
