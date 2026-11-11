// Tầng dữ liệu — bảng profiles (hồ sơ: tên, vai trò, sticker, chuỗi ngày học…). Mỗi hàm trả { data, error } như supabase.
// Học sinh KHÔNG tự sửa được vai trò / sticker / chuỗi ngày (trigger trên Neon, xem sql/2026-10-13_secure_profiles.sql);
// sticker của học sinh được cộng qua hàm máy chủ (award_sticker_once, record_activity), không qua đây.
import { supabase } from '../lib/supabase'

const BANG = 'profiles'
const GIOI_HAN = 5000

// ───────── đọc ─────────

/** hồ sơ đầy đủ của người đang đăng nhập (dùng khi đăng nhập) */
export function layHoSo(userId) {
  return supabase.from(BANG).select('*').eq('id', userId).maybeSingle()
}

/** sticker + chuỗi ngày học của 1 học sinh */
export function laySticker(userId) {
  return supabase.from(BANG).select('sticker_count, sticker_total, streak_days, streak_max').eq('id', userId).single()
}

/** tên của một nhóm người — gắn tên vào bài nộp, tin nhắn, bài thi… (lớp: xem layLopCuaCacHs ở data/ghiDanh.js) */
export function layTenCacHs(ids) {
  return supabase.from(BANG).select('id, full_name').in('id', ids).order('full_name')
}

/** trang Học sinh: mọi tài khoản học sinh, đủ cột */
export function layTatCaHocSinh() {
  return supabase.from(BANG).select('*').eq('role', 'student').order('full_name').limit(GIOI_HAN)
}

/** học sinh đã duyệt (soạn tin nhắn mới) */
export function layHocSinhDaDuyet() {
  return supabase.from(BANG).select('id, full_name').eq('role', 'student').eq('is_approved', true).order('full_name').limit(GIOI_HAN)
}

/** học sinh đang chờ duyệt tài khoản */
export function layHocSinhChoDuyet() {
  return supabase.from(BANG).select('id').eq('role', 'student').eq('is_approved', false)
}

export function demHocSinh() {
  return supabase.from(BANG).select('id', { count: 'exact', head: true }).eq('role', 'student')
}

export function layTroGiang() {
  return supabase.from(BANG).select('id, full_name, username, created_at').eq('role', 'assistant').order('created_at', { ascending: false })
}

/** tên đăng nhập nào trong danh sách đã có người dùng (nhập học sinh hàng loạt) */
export function timTenDangNhapDaCo(usernames) {
  return supabase.from(BANG).select('username').in('username', usernames)
}

// ───────── ghi (giáo viên) ─────────

/** sửa tên, duyệt tài khoản, cảnh báo ghi chép… (RLS + trigger chặn cột không được phép) */
export function capNhatHoSo(id, thayDoi) {
  return supabase.from(BANG).update(thayDoi).eq('id', id)
}

// ───────── sticker: đọc rồi ghi có khoá (giáo viên cộng / trừ khi duyệt, hoàn quà) ─────────

export function docSoSticker(userId) {
  return supabase.from(BANG).select('sticker_count, sticker_total').eq('id', userId).single()
}

/** ghi số sticker mới CHỈ KHI sticker_count vẫn = `cu` (có người ghi xen giữa thì 0 dòng → gọi lại) */
export function ghiStickerNeuChuaDoi(userId, cu, soMoi, tongMoi) {
  return supabase.from(BANG).update({ sticker_count: soMoi, sticker_total: tongMoi })
    .eq('id', userId).eq('sticker_count', cu).select('sticker_count, sticker_total')
}
