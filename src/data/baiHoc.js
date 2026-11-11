// Tầng dữ liệu — bảng lessons (bài học). Trang không gọi thẳng supabase.from('lessons'), mà gọi các hàm ở đây
// (chọn sẵn đúng cột, có giới hạn dòng). Đổi cơ sở dữ liệu chỉ sửa tệp này.
// Mỗi hàm trả { data, error } (hoặc { count }) như supabase. Học sinh chỉ thấy bài đã xuất bản: RLS trên Neon quyết định.
import { supabase } from '../lib/supabase'

const BANG = 'lessons'
const GIOI_HAN = 1000   // 1 khoá hiện ~100–200 bài

/** cột nhẹ cho danh sách bài (không kèm đề thực hành / tài liệu AI — vài trăm KB) */
const COT_DANH_SACH = 'id, title, grade, topic, unit_id, "order", created_at, is_published, restricted_audience'

// ───────── đọc ─────────

/** 1 bài, đủ cột (trang Học bài, trang Bài nộp) */
export function layBaiHocTheoId(id) {
  return supabase.from(BANG).select('*').eq('id', id).single()
}

/** tên bài (chế độ Dạy) */
export function layTenBaiHoc(id) {
  return supabase.from(BANG).select('id, title, grade').eq('id', id).single()
}

/** nội dung bài làm nguồn cho AI soạn (slide, hỏi đáp mẫu) */
export function layNguonAiCuaBai(id) {
  return supabase.from(BANG)
    .select('id, title, grade, topic, description, ai_context, ai_tutor_notes, practice_instructions, question_ids')
    .eq('id', id).single()
}

/**
 * Danh sách bài của 1 khoá, theo thứ tự bài.
 * @param xuatBan true = chỉ bài đã xuất bản · false = chỉ bài chưa xuất bản · bỏ trống = tất cả
 * @param topic   lọc theo chủ đề (không bắt buộc)
 */
export function layDanhSachBai(grade, { xuatBan, topic } = {}) {
  let q = supabase.from(BANG).select(COT_DANH_SACH).eq('grade', grade)
  if (xuatBan !== undefined) q = q.eq('is_published', xuatBan)
  if (topic) q = q.eq('topic', topic)
  return q.order('order', { ascending: true }).order('created_at', { ascending: true }).limit(GIOI_HAN)
}

/** bài đã xuất bản của nhiều khoá */
export function layBaiDaXuatBanCuaCacKhoa(grades) {
  return supabase.from(BANG).select(COT_DANH_SACH).in('grade', grades).eq('is_published', true)
    .order('order', { ascending: true }).limit(GIOI_HAN)
}

export function demBaiDaXuatBan(grades) {
  return supabase.from(BANG).select('id', { count: 'exact', head: true }).in('grade', grades).eq('is_published', true)
}

/** trang Quản lý bài học: mọi bài của khoá, đủ cột (để sửa) */
export function layBaiHocDeSua(grade) {
  return supabase.from(BANG).select('*').eq('grade', grade)
    .order('order', { ascending: true }).order('created_at', { ascending: true }).limit(GIOI_HAN)
}

/** bài kèm tài liệu AI (soạn câu hỏi bằng AI) — mọi bài của khoá */
export function layBaiKemTaiLieuAi(grade) {
  return supabase.from(BANG).select('id, title, topic, grade, ai_context, ai_tutor_notes, pptx_url')
    .eq('grade', grade).order('order').limit(GIOI_HAN)
}

/** bài đã xuất bản có file PPTX/PDF (ghi chú cho gia sư AI) */
export function layBaiCoFileBaiGiang(grade) {
  return supabase.from(BANG).select('id, title, grade, topic, pptx_url, ai_context, ai_tutor_notes')
    .eq('grade', grade).eq('is_published', true).not('pptx_url', 'is', null).order('order').limit(GIOI_HAN)
}

/** đề thực hành của vài bài (trang Chấm bài, theo học sinh) */
export function layDeThucHanhTheoIds(ids) {
  return supabase.from(BANG).select('id, title, "order", practice_instructions').in('id', ids)
}

/** bài có phần thực hành của một khoá + đơn vị của khoá đó (để xếp thứ tự) — dùng ở trang Chấm bài */
export async function layBaiThucHanhTheoKhoa(grade) {
  const [bai, donVi] = await Promise.all([
    supabase.from(BANG).select('id, title, topic, unit_id, "order", created_at, practice_instructions')
      .eq('grade', grade).eq('has_practice', true).limit(GIOI_HAN),
    supabase.from('units').select('id, name, sort_order').eq('grade', grade).limit(500),
  ])
  if (bai.error) throw bai.error
  return { baiHoc: bai.data || [], donVi: donVi.data || [] }
}

// ───────── ghi (giáo viên) ─────────

export function taoBaiHoc(dong) {
  return supabase.from(BANG).insert(dong).select().single()
}

/** sửa cả bài, trả dòng mới */
export function luuBaiHoc(id, thayDoi) {
  return supabase.from(BANG).update(thayDoi).eq('id', id).select().single()
}

/** sửa vài cột (xuất bản, giới hạn người xem, ghi chú AI…) */
export function capNhatBaiHoc(id, thayDoi) {
  return supabase.from(BANG).update(thayDoi).eq('id', id)
}

export function xoaBaiHoc(id) {
  return supabase.from(BANG).delete().eq('id', id)
}

/** đổi tên khoá → chuyển mọi bài sang tên mới */
export function doiKhoaCuaBaiHoc(khoaCu, khoaMoi) {
  return supabase.from(BANG).update({ grade: khoaMoi }).eq('grade', khoaCu)
}

/** đổi tên chủ đề trong 1 khoá → chuyển mọi bài sang tên mới */
export function doiChuDeCuaBaiHoc(grade, chuDeCu, chuDeMoi) {
  return supabase.from(BANG).update({ topic: chuDeMoi }).eq('topic', chuDeCu).eq('grade', grade)
}
