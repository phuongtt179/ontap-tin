// Tầng dữ liệu — bảng student_questions (học sinh hỏi thầy cô trong bài, chế độ giáo viên trung gian)
// + student_question_drafts (nháp AI soạn cho giáo viên — học sinh KHÔNG đọc được). Mỗi hàm trả { data, error } như supabase.
import { supabase } from '../lib/supabase'

const COT_CAU_HOI_EM = 'id, question, answer, status, created_at, answered_at, seen_at, context'
const KHONG_AI = '00000000-0000-0000-0000-000000000000'   // lọc "lớp không có em nào" → không ra dòng nào

// ───────── học sinh ─────────

/** số câu thầy cô đã trả lời mà em chưa xem, trong 1 bài (chỉ đếm) */
export function demTraLoiChuaXem(studentId, lessonId) {
  return supabase.from('student_questions').select('id', { count: 'exact', head: true })
    .eq('student_id', studentId).eq('lesson_id', lessonId).eq('status', 'answered').is('seen_at', null)
}

/** 50 câu em đã hỏi trong 1 bài (lessonId rỗng = câu hỏi chung), cũ → mới */
export function layCauHoiCuaEm(studentId, lessonId) {
  const q = supabase.from('student_questions').select(COT_CAU_HOI_EM).eq('student_id', studentId).order('created_at', { ascending: true }).limit(50)
  return lessonId ? q.eq('lesson_id', lessonId) : q.is('lesson_id', null)
}

/** em đã xem câu trả lời */
export function danhDauDaXem(ids) {
  return supabase.from('student_questions').update({ seen_at: new Date().toISOString() }).in('id', ids)
}

/** em gửi câu hỏi → { data: câu vừa gửi } */
export function guiCauHoi({ studentId, lessonId, mode, cauHoi, context }) {
  return supabase.from('student_questions')
    .insert({ student_id: studentId, lesson_id: lessonId || null, mode, question: cauHoi.slice(0, 1000), context })
    .select(COT_CAU_HOI_EM).single()
}

// ───────── giáo viên ─────────

/** câu chờ trả lời (cũ trước), kèm tên em + bài; lọc khoá / danh sách em của lớp nếu có */
export function layCauHoiChoTraLoi({ grade, hocSinh } = {}) {
  let q = supabase.from('student_questions')
    .select(`id, student_id, lesson_id, mode, question, context, created_at, profiles!student_questions_student_id_fkey(full_name), lessons${grade ? '!inner' : ''}(title, grade, description, ai_context, ai_tutor_notes)`)
    .eq('status', 'pending')
  if (grade) q = q.eq('lessons.grade', grade)
  if (hocSinh) q = q.in('student_id', hocSinh.length ? hocSinh : [KHONG_AI])
  return q.order('created_at', { ascending: true }).limit(100)
}

/** nháp AI của các câu → { questionId: { text, skip } } */
export async function layNhapTraLoi(ids) {
  if (!ids.length) return {}
  const { data } = await supabase.from('student_question_drafts').select('question_id, draft, skip_reason').in('question_id', ids).limit(1000)
  return Object.fromEntries((data || []).map(x => [x.question_id, { text: x.draft || '', skip: x.skip_reason }]))
}

/** lưu nháp AI (dòng { question_id, draft, skip_reason }) */
export function luuNhapTraLoi(dong) {
  return supabase.from('student_question_drafts').upsert(dong)
}

/** giáo viên trả lời ('answered', kèm câu trả lời) hoặc bỏ qua câu hỏi */
export function traLoiCauHoi(id, { status, traLoi, nguoiTraLoi }) {
  return supabase.from('student_questions').update({
    status, answer: status === 'answered' ? traLoi : null, answered_by: nguoiTraLoi, answered_at: new Date().toISOString(),
  }).eq('id', id)
}

// ───────── công cụ AI của giáo viên (hàm máy chủ) ─────────

/** số liệu tóm tắt trang Công cụ AI theo khoá / lớp */
export function layTongQuanCongCuAi(grade, lop) {
  return supabase.rpc('ai_tools_summary', { p_grade: grade || null, p_class: lop || null })
}

/** hàng đợi bài AI chấm cần giáo viên duyệt */
export function layHangDoiDuyet({ lyDo, soDong, grade, lop, muc }) {
  return supabase.rpc('ai_review_queue', { p_reason: lyDo, p_limit: soDong, p_grade: grade, p_class: lop, p_muc: muc })
}
