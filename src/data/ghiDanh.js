// Tầng dữ liệu — bảng student_enrollments (ghi danh học sinh ↔ khoá / lớp, cần giáo viên duyệt).
// Mỗi hàm trả { data, error } như supabase. Học sinh chỉ đọc được ghi danh của mình: RLS trên Neon quyết định.
// Khoá ngoại user_id → profiles ON DELETE CASCADE nên mọi ghi danh đều có hồ sơ (nối profiles!inner không mất dòng).
import { supabase } from '../lib/supabase'

const BANG = 'student_enrollments'
const GIOI_HAN = 5000   // hiện ~230 dòng

// ───────── học sinh ─────────

/** các khoá em đã được duyệt */
export function layKhoaCuaEm(userId) {
  return supabase.from(BANG).select('*').eq('user_id', userId).eq('is_approved', true)
}

/** lớp của em trong 1 khoá (null nếu chưa có lớp) */
export function layLopCuaEm(userId, grade) {
  return supabase.from(BANG).select('class_name').eq('user_id', userId).eq('grade', grade).eq('is_approved', true).maybeSingle()
}

// ───────── giáo viên: danh sách ─────────

/**
 * Học sinh đã duyệt kèm hồ sơ — điểm danh, chấm bài, dạy, giới hạn người xem bài…
 * @param grade khoá (bỏ trống = mọi khoá) · @param lop lớp (bỏ trống = cả khoá)
 * Mỗi dòng: { user_id, class_name, grade, profiles: { id, full_name, username, is_active, notes_warning } }
 */
export function layHocSinhKemHoSo({ grade, lop } = {}) {
  let q = supabase.from(BANG)
    .select('user_id, class_name, grade, profiles!inner(id, full_name, username, is_active, notes_warning)')
    .eq('is_approved', true)
  if (grade) q = q.eq('grade', grade)
  if (lop) q = q.eq('class_name', lop)
  return q.limit(GIOI_HAN)
}

/** tên học sinh đã duyệt của 1 khoá, xếp theo tên → [{ id, full_name }] (chọn người xem bài) */
export async function layTenHocSinhCuaKhoa(grade) {
  const { data, error } = await layHocSinhKemHoSo({ grade })
  const ds = (data || []).map(e => ({ id: e.user_id, full_name: e.profiles.full_name }))
  ds.sort((a, b) => a.full_name.localeCompare(b.full_name))
  return { data: ds, error }
}

/**
 * Ghi danh (không kèm hồ sơ) — đếm sĩ số, tìm học sinh của lớp…
 * @param daDuyet true (mặc định) = đã duyệt · false = đang chờ duyệt · null = tất cả
 * @param cacLop  danh sách tên lớp (lọc nhiều lớp một lúc)
 */
export function layGhiDanh({ grade, lop, cacLop, daDuyet = true } = {}) {
  let q = supabase.from(BANG).select('user_id, class_name, grade')
  if (daDuyet !== null) q = q.eq('is_approved', daDuyet)
  if (grade) q = q.eq('grade', grade)
  if (lop) q = q.eq('class_name', lop)
  if (cacLop) q = q.in('class_name', cacLop)
  return q.limit(GIOI_HAN)
}

/** lớp của một nhóm học sinh (gắn tên lớp vào tin nhắn, bài thi, yêu cầu đổi quà…) */
export function layLopCuaCacHs(userIds, { grade, chiDaDuyet = false } = {}) {
  let q = supabase.from(BANG).select('user_id, class_name, grade').in('user_id', userIds)
  if (grade) q = q.eq('grade', grade)
  if (chiDaDuyet) q = q.eq('is_approved', true)
  return q
}

/** trang Học sinh: mọi ghi danh (kể cả chờ duyệt) của các học sinh đang xem */
export function layGhiDanhDayDuCuaCacHs(userIds) {
  return supabase.from(BANG).select('*').in('user_id', userIds)
}

// ───────── giáo viên: ghi ─────────

/** thêm / cập nhật ghi danh (đã duyệt). `dong` là 1 dòng hoặc mảng; trùng (học sinh, khoá) thì ghi đè */
export function ghiDanhHocSinh(dong) {
  return supabase.from(BANG).upsert(dong, { onConflict: 'user_id,grade' }).select()
}

export function xoaGhiDanh(id) {
  return supabase.from(BANG).delete().eq('id', id)
}

/** duyệt mọi ghi danh đang chờ của 1 học sinh */
export function duyetGhiDanhCuaHs(userId) {
  return supabase.from(BANG).update({ is_approved: true }).eq('user_id', userId).eq('is_approved', false)
}

/** từ chối: xoá các ghi danh đang chờ của 1 học sinh */
export function tuChoiGhiDanhCuaHs(userId) {
  return supabase.from(BANG).delete().eq('user_id', userId).eq('is_approved', false)
}

export function doiKhoaCuaGhiDanh(khoaCu, khoaMoi) {
  return supabase.from(BANG).update({ grade: khoaMoi }).eq('grade', khoaCu)
}

export function xoaGhiDanhCuaKhoa(grade) {
  return supabase.from(BANG).delete().eq('grade', grade)
}
