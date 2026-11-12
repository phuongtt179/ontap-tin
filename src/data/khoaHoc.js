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

/** đơn vị của khoá theo thứ tự (lộ trình cho AI) */
export function layDonViCuaKhoa(grade) {
  return supabase.from('units').select('id, name, sort_order').eq('grade', grade)
    .order('sort_order').order('name').limit(GIOI_HAN)
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
