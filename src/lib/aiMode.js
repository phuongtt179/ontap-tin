// Chế độ AI phía học sinh — đồng bộ với api/_auth.js.
// TẮT CỐ ĐỊNH từ 27/10/2026 (mô hình "giáo viên làm trung gian"): học sinh không tương tác trực tiếp với AI
// (điều khoản Gemini API không cho dùng trong ứng dụng hướng tới người dưới 18 tuổi); AI chỉ chấm nháp /
// soạn nháp trả lời cho giáo viên, học sinh nhận nội dung SAU KHI giáo viên duyệt.
// Biến môi trường VITE_STUDENT_AI_DIRECT không còn tác dụng — muốn bật lại phải sửa code ở đây và api/_auth.js.
export const STUDENT_AI_DIRECT = false

// Mốc chuyển sang mô hình giáo viên làm trung gian. Bài AI chấm TRƯỚC mốc này học sinh đã xem rồi
// (giai đoạn AI trả lời trực tiếp 11/10–27/10/2026), vẫn để hiện như cũ; bài AI chấm SAU mốc này chỉ hiện
// khi giáo viên đã duyệt. (Lần chuyển đầu 07/10/2026; dời mốc khi chuyển lại 27/10/2026 để không ẩn
// lại ~1.300 bài học sinh đã xem điểm.)
export const MEDIATED_SINCE = new Date('2026-10-27T11:12:00Z')   // = 18:12 giờ Việt Nam, lúc đưa lên

// Học sinh có được thấy điểm/nhận xét của bài nộp này không
export function feedbackVisible(sub) {
  if (!sub || (sub.score == null && !sub.teacher_comment)) return false
  if (STUDENT_AI_DIRECT || sub.graded_by !== 'ai' || sub.reviewed_at) return true
  return !!sub.ai_graded_at && new Date(sub.ai_graded_at) < MEDIATED_SINCE
}
