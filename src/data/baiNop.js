// Tầng dữ liệu — bảng lesson_submissions (bài nộp thực hành). Mọi đọc / ghi bài nộp đi qua đây.
// Mỗi hàm trả { data, error } (hoặc { count }) như supabase. Quyền thật do RLS + trigger trên Neon quyết định.
import { supabase } from '../lib/supabase'

const BANG = 'lesson_submissions'
const KHONG_AI = '00000000-0000-0000-0000-000000000000'   // .in() rỗng → lọc ra 0 dòng

/** cột trang Chấm bài cần */
const COT_CHAM = 'id,user_id,lesson_id,file_url,file_name,text_content,content_json,submitted_at,score,ai_score,muc,teacher_comment,graded_by,reviewed_at,ai_breakdown,ai_suspect,ai_suspect_reason,sticker_awarded,allow_resubmit,ra_soat'

// ───────── học sinh ─────────

/** mọi bài em đã nộp trong 1 bài học (mỗi bài tập 1 dòng) */
export function layBaiNopCuaEm(userId, lessonId) {
  return supabase.from(BANG).select('*').eq('user_id', userId).eq('lesson_id', lessonId)
    .order('submitted_at', { ascending: true })
}

/** bảng tiêu chí AI của 15 bài gần nhất → hồ sơ lỗi hay gặp cho gia sư AI */
export function layTieuChiGanDay(userId) {
  return supabase.from(BANG).select('ai_breakdown, lessons(title)')
    .eq('user_id', userId).not('ai_breakdown', 'is', null)
    .order('submitted_at', { ascending: false }).limit(15)
}

/** cột nhẹ để hỏi định kỳ "bài đang chờ đã chấm xong chưa" */
export function layTrangThaiCham(ids) {
  return supabase.from(BANG).select('id, score, teacher_comment, graded_by, reviewed_at, ai_graded_at').in('id', ids)
}

export function layBaiNopTheoIds(ids) {
  return supabase.from(BANG).select('*').in('id', ids)
}

/** nộp lần đầu 1 bài tập — máy chủ chặn nộp trùng (lỗi 23505 / duplicate_submission) */
export function nopBaiMoi(dong) {
  return supabase.from(BANG).insert(dong).select().single()
}

/** nộp lại: ghi đè bài cũ, trả dòng mới */
export function nopLaiBai(id, thayDoi) {
  return supabase.from(BANG).update(thayDoi).eq('id', id).select().single()
}

// ───────── giáo viên ─────────

/** sửa 1 bài nộp (chấm, duyệt, cho nộp lại, lưu kết quả AI…) */
export function capNhatBaiNop(id, thayDoi) {
  return supabase.from(BANG).update(thayDoi).eq('id', id)
}

/** bài nộp của 1 nhóm học sinh trong 1 bài học — trang Bài nộp (đủ cột) */
export function layBaiNopCuaLop(lessonId, userIds) {
  return supabase.from(BANG).select('*').eq('lesson_id', lessonId).in('user_id', userIds)
}

/** cột nhẹ để trang Bài nộp hỏi định kỳ "có gì mới không" */
export function layDauVetBaiNop(lessonId, userIds) {
  return supabase.from(BANG).select('id, submitted_at, score, muc, graded_by, reviewed_at, ai_graded_at, allow_resubmit')
    .eq('lesson_id', lessonId).in('user_id', userIds)
}

/** trang Chấm bài — theo bài: bài nộp của các học sinh đang xem */
export function layBaiNopDeChamTheoBai(lessonId, userIds) {
  return supabase.from(BANG).select(COT_CHAM).eq('lesson_id', lessonId).in('user_id', userIds)
}

/** trang Chấm bài — theo học sinh: 100 bài gần nhất */
export function layBaiNopDeChamTheoHs(userId) {
  return supabase.from(BANG).select(COT_CHAM).eq('user_id', userId).order('submitted_at', { ascending: false }).limit(100)
}

/** đã nộp / đã duyệt chưa — trang Trợ lý giáo viên */
export function layTrangThaiDuyet(userIds, lessonIds) {
  return supabase.from(BANG).select('user_id, reviewed_at').in('user_id', userIds).in('lesson_id', lessonIds)
}

/** bài nộp của 1 học sinh cho báo cáo cá nhân */
export function layBaiNopChoBaoCao(userId) {
  return supabase.from(BANG).select('score, teacher_comment, graded_by, submitted_at, lessons(title)')
    .eq('user_id', userId).order('submitted_at', { ascending: false })
}

// ───────── sticker thưởng theo mức (cột sticker_thuong) ─────────

export function laySoStickerDaThuong(id) {
  return supabase.from(BANG).select('sticker_thuong').eq('id', id).single()
}

/** ghi số sticker đã thưởng CHỈ KHI số cũ chưa đổi (2 tab / duyệt trùng không cộng 2 lần); data rỗng = có người ghi trước */
export function ghiStickerDaThuong(id, cu, moi) {
  return supabase.from(BANG).update({ sticker_thuong: moi }).eq('id', id).eq('sticker_thuong', cu).select('id')
}

// ───────── bài chưa chấm (công cụ AI chấm bù) ─────────
// dk: { grade, userIds (null = mọi học sinh), tuNgay (ISO, null = mọi lúc) }

function locChuaCham(q, { grade, userIds, tuNgay } = {}) {
  q = q.is('score', null).is('graded_by', null).is('reviewed_at', null)
  if (grade) q = q.eq('lessons.grade', grade)
  if (userIds) q = q.in('user_id', userIds.length ? userIds : [KHONG_AI])
  return tuNgay ? q.gte('submitted_at', tuNgay) : q
}

export function demBaiChuaCham(dk) {
  return locChuaCham(supabase.from(BANG).select('id, lessons!inner(grade)', { count: 'exact', head: true }), dk)
}

/** 200 bài chưa chấm mới nhất (để liệt kê) */
export function layBaiChuaCham(dk) {
  return locChuaCham(supabase.from(BANG).select('id, user_id, lesson_id, submitted_at, content_json, lessons!inner(title, grade)'), dk)
    .order('submitted_at', { ascending: false }).limit(200)
}

/** bài chưa chấm kèm file + đề (để đưa AI chấm), tối đa `gioiHan` bài */
export function layBaiChuaChamDeCham(dk, gioiHan) {
  return locChuaCham(supabase.from(BANG)
    .select('id, user_id, lesson_id, file_url, file_name, text_content, content_json, submitted_at, lessons!inner(title, grade, practice_instructions)'), dk)
    .order('submitted_at', { ascending: false }).limit(gioiHan)
}

/** số lần em đã dùng "rà soát lỗi" cho 1 phần thực hành (hàm máy chủ ra_soat_dem) */
export async function demLuotRaSoat(lessonId, taskIdx) {
  const { data } = await supabase.rpc('ra_soat_dem', { p_lesson: lessonId, p_task: taskIdx })
  return Number(data) || 0
}
