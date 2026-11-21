// Tầng dữ liệu — điểm danh: attendance_sessions (buổi, giáo viên mở / đóng), attendance_records (lượt em điểm danh).
// RLS trên Neon: học sinh chỉ thấy buổi ĐANG MỞ của khoá mình và chỉ ghi lượt của chính mình.
import { supabase } from '../lib/supabase'

const GIOI_HAN = 1000
const COT_BUOI = 'id, grade, class_name, session_date, opened_at, closed_at'

// ───────── giáo viên ─────────

/** các buổi của 1 khoá (1 lớp nếu có), mới nhất trước */
export function layBuoiDiemDanh(grade, className) {
  let q = supabase.from('attendance_sessions').select(COT_BUOI).eq('grade', grade).order('opened_at', { ascending: false }).limit(GIOI_HAN)
  if (className) q = q.eq('class_name', className)
  return q
}

/** lượt điểm danh của các buổi */
export function layLuotDiemDanh(sessionIds) {
  return supabase.from('attendance_records').select('id, session_id, user_id, checked_at').in('session_id', sessionIds).limit(20000)
}

export function moBuoiDiemDanh({ grade, className, userId }) {
  return supabase.from('attendance_sessions').insert({ grade, class_name: className || null, created_by: userId })
}

export function dongBuoiDiemDanh(id) {
  return supabase.from('attendance_sessions').update({ closed_at: new Date().toISOString() }).eq('id', id)
}

/** các buổi đang mở (trang tổng quan) */
export function layBuoiDangMo() {
  return supabase.from('attendance_sessions').select('id, grade, class_name, opened_at').is('closed_at', null).limit(GIOI_HAN)
}

/** id các buổi của 1 ngày (YYYY-MM-DD) */
export async function layIdBuoiTrongNgay(ngay) {
  const { data } = await supabase.from('attendance_sessions').select('id').eq('session_date', ngay).limit(GIOI_HAN)
  return (data || []).map(s => s.id)
}

/** số lượt điểm danh của các buổi (chỉ đếm) */
export async function demLuotDiemDanh(sessionIds) {
  if (!sessionIds.length) return 0
  const { count } = await supabase.from('attendance_records').select('id', { count: 'exact', head: true }).in('session_id', sessionIds)
  return count || 0
}

// ───────── học sinh ─────────

/** 1 buổi đang mở mà em thấy được (RLS: đúng khoá của em) → buổi hoặc null */
export async function layBuoiDangMoCuaEm() {
  const { data } = await supabase.from('attendance_sessions').select(COT_BUOI).is('closed_at', null).limit(1)
  return data?.[0] || null
}

/** em đã điểm danh buổi này chưa */
export async function daDiemDanh(sessionId, userId) {
  const { data } = await supabase.from('attendance_records').select('id').eq('session_id', sessionId).eq('user_id', userId).maybeSingle()
  return !!data
}

export function diemDanh(sessionId, userId) {
  return supabase.from('attendance_records').insert({ session_id: sessionId, user_id: userId })
}
