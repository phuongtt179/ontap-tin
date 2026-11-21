// Quy tắc tiến độ một bài học của học sinh: quiz thế nào là đạt, bài có những bước nào, bước nào đã xong,
// khi nào cả bài tính là hoàn thành. Hàm thuần: không gọi mạng, không giao diện.
// ⚠️ Hiện máy chủ CHƯA tự kiểm tra các quy tắc này (vá bảo mật đợt 3) — trình duyệt tự tính rồi ghi lesson_progress.

/** Quiz trong bài học đạt khi đúng ít nhất 2/3 số câu */
export const NGUONG_DAT_QUIZ = 2 / 3

export function datQuiz(soDung, tongSo) {
  return tongSo > 0 && soDung / tongSo >= NGUONG_DAT_QUIZ
}

/**
 * Các bước của bài và bước nào đã xong.
 * @param lesson    { ai_context, video_url, pptx_url, has_slides, has_practice, question_ids }
 * @param progress  dòng lesson_progress (có thể null)
 * @param soCauQuiz số câu quiz của bài. Không truyền → đếm theo lesson.question_ids.
 *                  (Trang Học bài truyền số câu THỰC TẾ tải được — có thể ít hơn nếu câu hỏi đã bị xoá khỏi ngân hàng.)
 * @returns { co: {theory, video, pptx, quiz, practice}, xong: {...}, tongBuoc, soBuocXong, hoanThanh }
 */
export function trangThaiBuoc(lesson, progress, soCauQuiz) {
  const p = progress || {}
  const co = {
    theory: !!lesson?.ai_context,
    video: !!lesson?.video_url,
    pptx: !!(lesson?.pptx_url || lesson?.has_slides),
    quiz: (soCauQuiz ?? lesson?.question_ids?.length ?? 0) > 0,
    practice: !!lesson?.has_practice,
  }
  const daLam = {
    theory: !!p.theory_read,
    video: !!p.video_watched,
    pptx: !!p.pptx_viewed,
    quiz: !!p.quiz_passed,
    practice: !!p.practice_submitted,
  }
  // bước không có trong bài thì coi như đã xong
  const xong = Object.fromEntries(Object.keys(co).map(k => [k, !co[k] || daLam[k]]))
  const cacBuoc = Object.keys(co).filter(k => co[k])
  const soBuocXong = cacBuoc.filter(k => daLam[k]).length
  return { co, xong, tongBuoc: cacBuoc.length, soBuocXong, hoanThanh: Object.values(xong).every(Boolean) }
}
