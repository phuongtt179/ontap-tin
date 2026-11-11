// Tầng dữ liệu — bảng questions (ngân hàng câu hỏi). Mỗi hàm trả { data, error } (hoặc { count }) như supabase.
// ⚠️ Bảo mật đợt 3 (chưa làm): học sinh đang đọc được cả đáp án (correct_answer) khi làm bài — sẽ chuyển chấm về máy chủ
//    và bỏ cột đáp án khỏi các hàm phía học sinh (layCauHoiTheoIds khi gọi từ trang học sinh, layCauHoiLuyenTap).
import { supabase } from '../lib/supabase'

const BANG = 'questions'
const GIOI_HAN = 5000   // cả ngân hàng hiện ~1.600 câu

/** giữ đúng thứ tự `ids` (thứ tự câu trong đề / bài học); mã không còn câu (đã xoá) thì bỏ */
async function theoThuTu(ids, truyVan) {
  const kq = await truyVan
  if (kq.error || !kq.data) return kq
  const theoId = new Map(kq.data.map(q => [q.id, q]))
  return { ...kq, data: ids.map(id => theoId.get(id)).filter(Boolean) }
}

// ───────── đọc ─────────

/** câu hỏi đầy đủ theo danh sách mã, đúng thứ tự — làm bài trong bài học / đề thi, xem lại câu của bài */
export function layCauHoiTheoIds(ids) {
  return theoThuTu(ids, supabase.from(BANG).select('*').in('id', ids))
}

/** câu hỏi + đáp án (xem chi tiết bài làm của học sinh), đúng thứ tự */
export function layCauHoiKemDapAn(ids) {
  return theoThuTu(ids, supabase.from(BANG).select('id, question, correct_answer, type').in('id', ids))
}

/** nội dung câu hỏi của bài làm nguồn cho AI / slide, đúng thứ tự */
export function layCauHoiTomTat(ids) {
  return theoThuTu(ids, supabase.from(BANG).select('id, question, type, options, correct_answer, hint').in('id', ids))
}

/** câu hỏi luyện tập tự chọn (học sinh) */
export function layCauHoiLuyenTap(grade, { topics = [], difficulty } = {}) {
  let q = supabase.from(BANG).select('*').eq('grade', grade)
  if (topics.length > 0) q = q.in('topic', topics)
  if (difficulty) q = q.eq('difficulty', difficulty)
  return q.limit(GIOI_HAN)
}

/** chọn câu cho đề thi / bài học: lọc theo chủ đề, đơn vị, tiêu đề nhỏ, độ khó — mới nhất trước */
export function locCauHoi(grade, { topic, unitId, lessonTitleId, difficulty } = {}) {
  let q = supabase.from(BANG).select('id, question, type, difficulty, topic, unit_id').eq('grade', grade)
  if (topic) q = q.eq('topic', topic)
  if (unitId) q = q.eq('unit_id', unitId)
  if (lessonTitleId) q = q.eq('lesson_title_id', lessonTitleId)
  if (difficulty) q = q.eq('difficulty', difficulty)
  return q.order('created_at', { ascending: false }).limit(GIOI_HAN)
}

/** trang Ngân hàng câu hỏi: cả khoá, đủ cột + tên đơn vị */
export function layNganHangCauHoi(grade) {
  return supabase.from(BANG).select('*, units(id,name)').eq('grade', grade)
    .order('created_at', { ascending: false }).limit(GIOI_HAN)
}

export function demCauHoi() {
  return supabase.from(BANG).select('id', { count: 'exact', head: true })
}

// câu chưa có gợi ý (bỏ câu tự luận) — công cụ AI viết gợi ý
const thieuGoiY = q => q.or('hint.is.null,hint.eq.').neq('type', 'essay')

export function demCauThieuGoiY(grade) {
  return thieuGoiY(supabase.from(BANG).select('id', { count: 'exact', head: true }).eq('grade', grade))
}

export function layCauThieuGoiY(grade, soCau) {
  return thieuGoiY(supabase.from(BANG).select('id, type, question, options, match_options, correct_answer').eq('grade', grade))
    .order('created_at', { ascending: false }).limit(soCau)
}

// ───────── ghi (giáo viên) ─────────

/** thêm 1 câu hoặc nhiều câu, trả mã các câu mới */
export function themCauHoi(dong) {
  return supabase.from(BANG).insert(dong).select('id')
}

export function capNhatCauHoi(id, thayDoi) {
  return supabase.from(BANG).update(thayDoi).eq('id', id)
}

export function xoaCauHoi(id) {
  return supabase.from(BANG).delete().eq('id', id)
}

export function doiKhoaCuaCauHoi(khoaCu, khoaMoi) {
  return supabase.from(BANG).update({ grade: khoaMoi }).eq('grade', khoaCu)
}

export function doiChuDeCuaCauHoi(grade, chuDeCu, chuDeMoi) {
  return supabase.from(BANG).update({ topic: chuDeMoi }).eq('topic', chuDeCu).eq('grade', grade)
}
