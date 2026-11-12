// Tầng dữ liệu — bài làm: exam_sessions (lượt thi), quiz_sessions (luyện tập), exam_nop_python (lần nộp chấm Python). Đề: data/deThi.js.
// Mỗi hàm trả { data, error } như supabase (trừ khi ghi khác). Học sinh chỉ ghi bài của mình: RLS trên Neon quyết định.
// ⚠ Điểm hiện do trình duyệt tính rồi gửi lên — bước 5 (vá bảo mật đợt 3) sẽ chuyển cho máy chủ tự chấm.
import { supabase } from '../lib/supabase'

const GIOI_HAN = 1000

// ───────── học sinh ─────────

/** bắt đầu làm đề: ghi lượt NGAY (chưa có điểm) để đếm đúng số lần làm kể cả khi em đóng tab giữa chừng → { data: lượt } */
export function batDauLuotThi({ examId, userId, total, attemptNumber }) {
  return supabase.from('exam_sessions').insert({ exam_id: examId, user_id: userId, total, attempt_number: attemptNumber }).select().single()
}

/** nộp đề thi: cập nhật dòng đã tạo sẵn lúc bắt đầu làm (không tạo dòng mới). practical_content: bài Word / PPT soạn ngay trong trang */
export function nopBaiThi(sessionId, { correct, score, answers, practical_content }) {
  return supabase.from('exam_sessions')
    .update({ correct, score, answers, submitted_at: new Date().toISOString(), ...(practical_content !== undefined && { practical_content }) })
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

/** số lượt em đã làm từng đề → { exam_id: số } */
export async function demLuotThiCuaEm(userId, examIds) {
  if (!examIds.length) return {}
  const { data } = await supabase.from('exam_sessions').select('exam_id').eq('user_id', userId).in('exam_id', examIds).limit(GIOI_HAN)
  const dem = {}
  ;(data || []).forEach(s => { dem[s.exam_id] = (dem[s.exam_id] || 0) + 1 })
  return dem
}

/** tên tệp thực hành đã nộp của lượt thi (null nếu chưa) */
export async function layTepThucHanh(sessionId) {
  const { data } = await supabase.from('exam_sessions').select('practical_file_name').eq('id', sessionId).single()
  return data?.practical_file_name || null
}

/** nộp tệp thực hành (Scratch …) vào lượt thi */
export function nopTepThucHanh(sessionId, url, ten) {
  return supabase.from('exam_sessions').update({ practical_file_url: url, practical_file_name: ten }).eq('id', sessionId)
}

/** các lần nộp chấm Python của 1 lượt thi; kemCode = giáo viên xem cả code */
export function layLanNopPython(sessionId, { kemCode = false } = {}) {
  return supabase.from('exam_nop_python').select(kemCode ? 'lan, ket_qua, diem, code, created_at' : 'lan, ket_qua, diem')
    .eq('session_id', sessionId).order('lan').limit(GIOI_HAN)
}

/** lịch sử: 50 lượt thi gần nhất của em */
export function layLuotThiCuaEm(userId) {
  return supabase.from('exam_sessions').select('id, exam_id, user_id, score, correct, total, attempt_number, submitted_at')
    .eq('user_id', userId).order('submitted_at', { ascending: false }).limit(50)
}

/** lịch sử: 50 lượt luyện tập gần nhất của em */
export function layLuotLuyenTapCuaEm(userId) {
  return supabase.from('quiz_sessions').select('id, mode, total, correct, score, created_at')
    .eq('user_id', userId).order('created_at', { ascending: false }).limit(50)
}

// ───────── giáo viên ─────────

/** mọi lượt của 1 đề (trang kết quả): lượt đã nộp mới nhất trước, lượt bỏ dở (chưa nộp) xếp cuối */
export function layLuotThiCuaDe(examId) {
  return supabase.from('exam_sessions').select('*').eq('exam_id', examId)
    .order('submitted_at', { ascending: false, nullsFirst: false }).limit(5000)
}

/** lượt của nhiều đề — bảng thống kê (kèm đáp án để xem chi tiết) */
export function layLuotThiCuaCacDe(examIds) {
  return supabase.from('exam_sessions').select('id, user_id, exam_id, score, correct, total, attempt_number, submitted_at, answers')
    .in('exam_id', examIds).limit(10000)
}

/** điểm thi của 1 em kèm tên đề (báo cáo thành tích) */
export function layDiemThiCuaEm(userId) {
  return supabase.from('exam_sessions').select('score, correct, total, submitted_at, exams(title)')
    .eq('user_id', userId).order('submitted_at', { ascending: false }).limit(GIOI_HAN)
}

/** giáo viên chấm / AI chấm nháp phần thực hành của 1 lượt */
export function suaLuotThi(sessionId, thayDoi) {
  return supabase.from('exam_sessions').update(thayDoi).eq('id', sessionId)
}

/** xoá lượt (vd đóng tab do sự cố) — em được tính lại số lần làm */
export function xoaLuotThi(sessionId) {
  return supabase.from('exam_sessions').delete().eq('id', sessionId)
}
