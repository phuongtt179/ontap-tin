// Tầng dữ liệu — bài làm quiz / đề thi lý thuyết của học sinh: exam_sessions (đề thi), quiz_sessions (luyện tập).
// Mỗi hàm trả { data, error } như supabase. Học sinh chỉ ghi bài của mình: RLS trên Neon quyết định.
// ⚠ Điểm hiện do trình duyệt tính rồi gửi lên — bước 5 (vá bảo mật đợt 3) sẽ chuyển cho máy chủ tự chấm.
import { supabase } from '../lib/supabase'

/** nộp đề thi: cập nhật dòng đã tạo sẵn lúc bắt đầu làm (không tạo dòng mới) */
export function nopBaiThi(sessionId, { correct, score, answers }) {
  return supabase.from('exam_sessions')
    .update({ correct, score, answers, submitted_at: new Date().toISOString() })
    .eq('id', sessionId)
}

/** lưu 1 lượt luyện tập / ôn tập */
export function luuLuotLuyenTap({ userId, mode, questions, correct, score, answers }) {
  return supabase.from('quiz_sessions').insert({
    user_id: userId,
    mode,
    total: questions.length,
    correct,
    score,
    answers,
    question_ids: questions.map(q => q.id),
  })
}
