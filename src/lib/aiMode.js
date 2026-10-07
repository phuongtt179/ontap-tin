// Chế độ AI phía học sinh — đồng bộ với api/_auth.js (cùng biến môi trường VITE_STUDENT_AI_DIRECT).
// Mặc định TẮT (mô hình "giáo viên làm trung gian"): học sinh không tương tác trực tiếp với AI;
// AI chỉ chấm nháp / soạn nháp trả lời cho giáo viên, học sinh nhận nội dung SAU KHI giáo viên duyệt.
export const STUDENT_AI_DIRECT = ['1', 'true', 'on'].includes(String(import.meta.env.VITE_STUDENT_AI_DIRECT || '').toLowerCase())

// Mốc chuyển sang mô hình giáo viên làm trung gian. Bài AI chấm TRƯỚC mốc này học sinh đã xem rồi,
// vẫn để hiện như cũ; bài AI chấm SAU mốc này chỉ hiện khi giáo viên đã duyệt.
export const MEDIATED_SINCE = new Date('2026-10-07T05:27:00+07:00')

// Học sinh có được thấy điểm/nhận xét của bài nộp này không
export function feedbackVisible(sub) {
  if (!sub || (sub.score == null && !sub.teacher_comment)) return false
  if (STUDENT_AI_DIRECT || sub.graded_by !== 'ai' || sub.reviewed_at) return true
  return !!sub.ai_graded_at && new Date(sub.ai_graded_at) < MEDIATED_SINCE
}
