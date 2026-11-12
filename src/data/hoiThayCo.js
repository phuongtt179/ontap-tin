// Tầng dữ liệu — bảng student_questions (học sinh hỏi thầy cô trong bài, chế độ giáo viên trung gian).
import { supabase } from '../lib/supabase'

/** số câu thầy cô đã trả lời mà em chưa xem, trong 1 bài (chỉ đếm) */
export function demTraLoiChuaXem(studentId, lessonId) {
  return supabase.from('student_questions').select('id', { count: 'exact', head: true })
    .eq('student_id', studentId).eq('lesson_id', lessonId).eq('status', 'answered').is('seen_at', null)
}
