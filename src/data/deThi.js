// Tầng dữ liệu — đề thi: exams (đề), exam_bai (bài của kỳ thi nhiều bài), exam_tests (test chấm Python, học sinh KHÔNG đọc được).
// Lượt làm bài (exam_sessions, quiz_sessions, exam_nop_python) ở data/baiLam.js. Mỗi hàm trả { data, error } như supabase.
import { supabase } from '../lib/supabase'

const GIOI_HAN = 1000
// đủ cột cho form sửa đề của giáo viên
const COT_DE = 'id, title, grade, class_names, time_limit, max_attempts, is_active, question_ids, created_at, show_answer, show_score, ' +
  'has_practical, practical_type, practical_instructions, theory_weight, practical_weight, practical_rubric'
// học sinh: KHÔNG lấy tiêu chí chấm (practical_rubric). ⚠ RLS hiện vẫn cho đọc — chặn hẳn ở bước 5 (vá bảo mật đợt 3)
const COT_DE_HOC_SINH = 'id, title, grade, class_names, time_limit, max_attempts, question_ids, created_at, show_answer, show_score, ' +
  'has_practical, practical_type, practical_instructions, theory_weight, practical_weight'

/** mọi đề (trang Đề thi của giáo viên), mới nhất trước */
export function layTatCaDeThi() {
  return supabase.from('exams').select(COT_DE).order('created_at', { ascending: false }).limit(GIOI_HAN)
}

/** 1 đề (trang kết quả) */
export function layDeThi(id) {
  return supabase.from('exams').select(COT_DE).eq('id', id).maybeSingle()
}

/** đề của khoá cho thống kê (cột nhẹ) */
export function layDeThiCuaKhoa(grade) {
  return supabase.from('exams').select('id, title, question_ids, class_names').eq('grade', grade).order('created_at').limit(GIOI_HAN)
}

/** tên đề theo id → { id: tên } */
export async function layTenDeThi(ids) {
  if (!ids.length) return {}
  const { data } = await supabase.from('exams').select('id, title').in('id', ids).limit(GIOI_HAN)
  return Object.fromEntries((data || []).map(e => [e.id, e.title]))
}

/** đề đang mở cho em: đúng khoá, dành cho cả khoá hoặc cho lớp của em */
export function layDeThiChoEm(grade, className) {
  let q = supabase.from('exams').select(COT_DE_HOC_SINH).eq('is_active', true).eq('grade', grade)
  q = className ? q.or(`class_names.is.null,class_names.cs.{"${className}"}`) : q.is('class_names', null)
  return q.order('created_at', { ascending: false }).limit(GIOI_HAN)
}

/** tạo (id rỗng) hoặc sửa đề → { data: { id } } */
export function luuDeThi(id, duLieu) {
  return id
    ? supabase.from('exams').update(duLieu).eq('id', id).select('id').single()
    : supabase.from('exams').insert(duLieu).select('id').single()
}

export function xoaDeThi(id) {
  return supabase.from('exams').delete().eq('id', id)
}

export function datMoDeThi(id, mo) {
  return supabase.from('exams').update({ is_active: mo }).eq('id', id)
}

/** kỳ thi nhiều bài: các bài (đề bài, trọng số) theo thứ tự. Bài liên kết ngân hàng lấy tên + đề từ ngân hàng. Đề 1 bài kiểu cũ → rỗng */
export async function layBaiCuaKyThi(examId) {
  const r = await supabase.from('exam_bai').select('id, thu_tu, ten, de_bai, diem, bai_luyen_id, bai_luyen(ten, de_bai)')
    .eq('exam_id', examId).order('thu_tu').limit(50)
  return { ...r, data: (r.data || []).map(({ bai_luyen, ...b }) => (bai_luyen ? { ...b, ten: bai_luyen.ten, de_bai: bai_luyen.de_bai } : b)) }
}

/** thêm các bài ngân hàng vào cuối kỳ thi (liên kết, mỗi bài 100 điểm). dsBai: [{ id, ten }] */
export function themBaiNganHangVaoKyThi(examId, dsBai, thuTuDau) {
  return supabase.from('exam_bai').insert(dsBai.map((b, i) => ({ exam_id: examId, thu_tu: thuTuDau + i, ten: b.ten, de_bai: '', diem: 100, bai_luyen_id: b.id })))
}

/** thêm (id rỗng) hoặc sửa 1 bài của kỳ thi → { data: { id } } */
export function luuBaiKyThi(id, duLieu) {
  return id
    ? supabase.from('exam_bai').update(duLieu).eq('id', id).select('id').single()
    : supabase.from('exam_bai').insert(duLieu).select('id').single()
}

/** xoá 1 bài của kỳ thi (test, điểm từng bài của bài đó xoá theo) */
export function xoaBaiKyThi(id) {
  return supabase.from('exam_bai').delete().eq('id', id)
}

/** test của 1 bài trong kỳ thi (thứ tự) */
export function layTestCuaBai(baiId) {
  return supabase.from('exam_tests').select('input, expected, diem').eq('bai_id', baiId).order('thu_tu').limit(GIOI_HAN)
}

/** thay toàn bộ test của 1 bài bằng danh sách mới. Trả { error } */
export async function ghiTestCuaBai(examId, baiId, tests) {
  const xoa = await supabase.from('exam_tests').delete().eq('bai_id', baiId)
  if (xoa.error || !tests.length) return { error: xoa.error }
  return supabase.from('exam_tests').insert(tests.map((t, i) => ({ exam_id: examId, bai_id: baiId, thu_tu: i, input: t.input, expected: t.expected, diem: Number(t.diem) || 1 })))
}

/** test chấm Python của đề (thứ tự) */
export function layTestPython(examId) {
  return supabase.from('exam_tests').select('input, expected, diem').eq('exam_id', examId).is('bai_id', null).order('thu_tu').limit(GIOI_HAN)
}

/** thay toàn bộ test của đề 1 bài bằng danh sách mới (rỗng = xoá hết). Không đụng test của kỳ thi nhiều bài. Trả { error } */
export async function ghiTestPython(examId, tests) {
  const xoa = await supabase.from('exam_tests').delete().eq('exam_id', examId).is('bai_id', null)
  if (xoa.error || !tests.length) return { error: xoa.error }
  return supabase.from('exam_tests').insert(tests.map((t, i) => ({ exam_id: examId, thu_tu: i, input: t.input, expected: t.expected, diem: Number(t.diem) || 1 })))
}

/** số đề thi (chỉ đếm) */
export function demDeThi() {
  return supabase.from('exams').select('id', { count: 'exact', head: true })
}
