// Tầng dữ liệu — bảng lesson_progress (tiến độ học từng bài của học sinh). Mỗi hàm trả { data, error } (hoặc { count }).
// Học sinh chỉ đọc / ghi tiến độ của mình: RLS trên Neon quyết định. Quy tắc hoàn thành bài: domain/tienDoBaiHoc.js.
import { supabase } from '../lib/supabase'

const BANG = 'lesson_progress'

/** tiến độ của em ở 1 bài (null nếu chưa học) */
export function layTienDoBai(userId, lessonId) {
  return supabase.from(BANG).select('*').eq('user_id', userId).eq('lesson_id', lessonId).maybeSingle()
}

/** tiến độ của em ở mọi bài (ít dòng: 1 dòng / bài đã học) */
export function layTienDoCuaEm(userId) {
  return supabase.from(BANG).select('*').eq('user_id', userId).limit(5000)
}

/** tiến độ của 1 em kèm tên bài (báo cáo thành tích của giáo viên) */
export function layTienDoChoBaoCao(userId) {
  return supabase.from(BANG).select('lesson_id, completed, quiz_passed, quiz_total, lessons(title)').eq('user_id', userId).limit(5000)
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

/** tiến độ của nhiều em ở nhiều bài (trợ lý AI của giáo viên) — chỉ cột cần */
export function layTienDoCuaCacHs(userIds, lessonIds) {
  return supabase.from(BANG).select('user_id, lesson_id, completed, quiz_passed, practice_submitted, updated_at')
    .in('user_id', userIds).in('lesson_id', lessonIds).limit(20000)
}
