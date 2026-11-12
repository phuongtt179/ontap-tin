// Tầng dữ liệu — bảng messages: chat học sinh ↔ giáo viên (channel 'teacher' / null cũ) và nhật ký hỏi đáp AI (channel 'ai').
// Mỗi hàm trả { data, error } như supabase. Ai đọc / ghi được tin nào: RLS trên Neon quyết định.
import { supabase } from '../lib/supabase'

const COT_TIN = 'id, student_id, sender_role, content, is_read, created_at, context, channel'

// ───────── giáo viên ─────────

/** hộp thư: 2000 tin thầy–trò GẦN NHẤT + mốc giờ 1000 lượt hỏi AI gần nhất (log AI rất nhiều — nội dung tải riêng khi mở 1 em) */
export async function layHopThu() {
  const [tin, ai] = await Promise.all([
    supabase.from('messages').select(COT_TIN).or('channel.eq.teacher,channel.is.null').order('created_at', { ascending: false }).limit(2000),
    supabase.from('messages').select('student_id, created_at').eq('channel', 'ai').order('created_at', { ascending: false }).limit(1000),
  ])
  return { tinGiaoVien: (tin.data || []).reverse(), mocAi: (ai.data || []).reverse(), error: tin.error || ai.error }
}

/** tin thầy–trò mới của 1 em sau mốc giờ (hỏi định kỳ khi đang mở cuộc trò chuyện) */
export function layTinMoi(studentId, sauLuc) {
  return supabase.from('messages').select(COT_TIN).eq('student_id', studentId).eq('channel', 'teacher')
    .gt('created_at', sauLuc).order('created_at', { ascending: true }).limit(200)
}

/** nhật ký hỏi đáp AI của 1 em (500 lượt gần nhất theo thứ tự thời gian) */
export function layNhatKyAi(studentId) {
  return supabase.from('messages').select(COT_TIN).eq('student_id', studentId).eq('channel', 'ai')
    .order('created_at', { ascending: true }).limit(500)
}

/** câu học sinh hỏi AI trong các bài (thống kê câu hay hỏi), trong `soNgay` ngày gần nhất nếu có */
export function layCauHoiAiTheoBai(lessonIds, soNgay) {
  let q = supabase.from('messages').select('id, student_id, content, created_at, context')
    .eq('channel', 'ai').eq('sender_role', 'student').in('context->>lessonId', lessonIds)
    .order('created_at', { ascending: false }).limit(300)
  if (soNgay) q = q.gte('created_at', new Date(Date.now() - soNgay * 864e5).toISOString())
  return q
}

/** đánh dấu đã đọc mọi tin học sinh gửi trong cuộc trò chuyện */
export function danhDauDaDoc(studentId) {
  return supabase.from('messages').update({ is_read: true }).eq('student_id', studentId).eq('sender_role', 'student').eq('is_read', false)
}

/** giáo viên nhắn 1 em → { data: tin vừa gửi } */
export function guiTinGiaoVien(studentId, noiDung) {
  return supabase.from('messages').insert({ student_id: studentId, content: noiDung, sender_role: 'teacher' }).select(COT_TIN).single()
}

/** giáo viên nhắn cả lớp: 1 tin cho từng em */
export function guiTinNhieuEm(studentIds, noiDung) {
  return supabase.from('messages').insert(studentIds.map(id => ({ student_id: id, sender_role: 'teacher', content: noiDung, is_read: false })))
}

export function xoaTin(id) {
  return supabase.from('messages').delete().eq('id', id)
}

// ───────── học sinh ─────────

/** ghi nhật ký 1 lượt hỏi AI (câu hỏi + câu trả lời) để giáo viên xem lại. Không chờ, lỗi không chặn em học tiếp */
export function ghiNhatKyAi(studentId, cauHoi, traLoi, context) {
  return supabase.from('messages').insert([
    { student_id: studentId, sender_role: 'student', channel: 'ai', content: cauHoi, context, is_read: true },
    { student_id: studentId, sender_role: 'ai', channel: 'ai', content: traLoi, context, is_read: true },
  ])
}
