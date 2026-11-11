// Quy tắc chấm bài thực hành. Hàm thuần: không gọi mạng, không giao diện. Dùng cả ở trang web lẫn máy chủ (api/).

/**
 * Kết quả AI chấm 1 bài ({ score, comment, breakdown, ai_suspect, ai_suspect_reason })
 * → các cột ghi vào lesson_submissions. Điểm AI chỉ là NHÁP: giáo viên duyệt mới thành mức T/H/C cho học sinh thấy.
 */
export function capNhatTuKetQuaAi(r, luc = new Date().toISOString()) {
  return {
    score: r.score, ai_score: r.score, teacher_comment: r.comment, graded_by: 'ai',
    ai_graded_at: luc, ai_breakdown: r.breakdown || null,
    ai_suspect: !!r.ai_suspect, ai_suspect_reason: r.ai_suspect_reason || null,
  }
}
