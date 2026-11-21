// Tầng dữ liệu — cấu hình của một khoá: grades (mô tả cho AI), units (đơn vị), reward_configs (ngưỡng đổi quà),
// class_topic_unlock + class_lesson_unlock (chủ đề / bài đã mở cho từng lớp). Mỗi hàm chọn sẵn cột, có giới hạn dòng.
import { supabase } from '../lib/supabase'

const GIOI_HAN = 1000

/** mô tả khoá cho AI trợ giảng ('' nếu chưa có) */
export async function layMoTaKhoaChoAi(grade) {
  const { data } = await supabase.from('grades').select('ai_scope').eq('value', grade).maybeSingle()
  return data?.ai_scope || ''
}

/** ngưỡng sticker đổi quà của khoá (null = chưa đặt → dùng mặc định) */
export async function layNguongDoiQua(grade) {
  const { data } = await supabase.from('reward_configs').select('sticker_threshold').eq('grade', grade).maybeSingle()
  return data?.sticker_threshold ?? null
}

/**
 * Chủ đề / bài đã mở cho 1 lớp — đưa vào domain/moKhoaBai.js.
 * @returns null nếu không có lớp (coi như mở hết) · { chuDe: Set<topic>, bai: Map<lesson_id, lúc mở> }
 */
export async function layMoKhoaCuaLop(grade, className) {
  if (!className) return null
  const [chuDe, bai] = await Promise.all([
    supabase.from('class_topic_unlock').select('topic').eq('grade', grade).eq('class_name', className).limit(GIOI_HAN),
    supabase.from('class_lesson_unlock').select('lesson_id, created_at').eq('grade', grade).eq('class_name', className).limit(GIOI_HAN),
  ])
  return {
    chuDe: new Set((chuDe.data || []).map(r => r.topic)),
    bai: new Map((bai.data || []).map(r => [r.lesson_id, r.created_at])),
  }
}

/** mọi lớp (ca học) của mọi khoá, xếp theo khoá rồi tên */
export function layCacLop() {
  return supabase.from('classes').select('name, grade').order('grade').order('name').limit(GIOI_HAN)
}

// ───────── khoá (bảng grades) ─────────

/** tên các khoá (value) theo thứ tự */
export function layCacKhoa() {
  return supabase.from('grades').select('value, ai_scope').order('value').limit(GIOI_HAN)
}

export function themKhoa(value) {
  return supabase.from('grades').insert({ value })
}

/** mô tả phạm vi khoá cho AI trợ giảng ('' → xoá) */
export function luuMoTaKhoaChoAi(value, moTa) {
  return supabase.from('grades').update({ ai_scope: moTa || null }).eq('value', value)
}

// mọi bảng có cột grade gắn với tên khoá (kiểm tra trên Neon 12/11/2026) — đổi tên khoá phải đổi theo cả 12 bảng,
// thiếu bảng nào thì dữ liệu bảng đó "mồ côi" (vd lớp mất hết bài đã mở khi khoá đổi tên)
const BANG_THEO_KHOA = ['classes', 'student_enrollments', 'questions', 'exams', 'lessons', 'topics', 'units',
  'class_topic_unlock', 'class_lesson_unlock', 'attendance_sessions', 'reward_configs', 'reward_items', 'student_notes']

/** đổi tên khoá + mọi dữ liệu gắn với khoá. Trả { error } của bước đổi tên, { loiBang: [tên bảng lỗi] } nếu bảng nào lỗi */
export async function doiTenKhoa(cu, moi) {
  const { error } = await supabase.from('grades').update({ value: moi }).eq('value', cu)
  if (error) return { error }
  const kq = await Promise.all(BANG_THEO_KHOA.map(b => supabase.from(b).update({ grade: moi }).eq('grade', cu)))
  return { error: null, loiBang: BANG_THEO_KHOA.filter((_, i) => kq[i].error) }
}

/** xoá khoá + lớp và ghi danh của khoá (bài học / câu hỏi / đề thi giữ lại). Trả { error } */
export async function xoaKhoa(value) {
  const { error } = await supabase.from('grades').delete().eq('value', value)
  if (error) return { error }
  const kq = await Promise.all([
    supabase.from('classes').delete().eq('grade', value),
    supabase.from('student_enrollments').delete().eq('grade', value),
  ])
  return { error: kq.find(r => r.error)?.error || null }
}

// ───────── lớp (bảng classes) ─────────

/** lớp đầy đủ (trang Lớp), lọc theo khoá nếu có */
export function layLopDayDu(grade) {
  let q = supabase.from('classes').select('id, name, grade').order('grade').order('name').limit(GIOI_HAN)
  if (grade) q = q.eq('grade', grade)
  return q
}

/** tên các lớp của 1 khoá → mảng tên (lỗi → mảng rỗng) */
export async function layTenLopCuaKhoa(grade) {
  const { data } = await supabase.from('classes').select('name').eq('grade', grade).order('name').limit(GIOI_HAN)
  return (data || []).map(c => c.name)
}

export function themLop(dong) {
  return supabase.from('classes').insert(dong)
}

export function suaLop(id, thayDoi) {
  return supabase.from('classes').update(thayDoi).eq('id', id)
}

export function xoaLop(id) {
  return supabase.from('classes').delete().eq('id', id)
}

// ───────── mở khoá chủ đề / bài cho lớp ─────────

/** mở (moKhoa=true) hoặc khoá 1 chủ đề cho lớp; mở trùng không tính là lỗi */
export async function datMoChuDe(grade, className, topic, moKhoa) {
  const r = moKhoa
    ? await supabase.from('class_topic_unlock').insert({ grade, class_name: className, topic })
    : await supabase.from('class_topic_unlock').delete().eq('grade', grade).eq('class_name', className).eq('topic', topic)
  return r.error?.code === '23505' ? { ...r, error: null } : r
}

/** mở hoặc khoá 1 bài cho lớp; mở trùng không tính là lỗi */
export async function datMoBai(grade, className, lessonId, moKhoa) {
  const r = moKhoa
    ? await supabase.from('class_lesson_unlock').insert({ grade, class_name: className, lesson_id: lessonId })
    : await supabase.from('class_lesson_unlock').delete().eq('grade', grade).eq('class_name', className).eq('lesson_id', lessonId)
  return r.error?.code === '23505' ? { ...r, error: null } : r
}
