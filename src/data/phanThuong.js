// Tầng dữ liệu — phần thưởng: reward_items (quà), reward_requests (yêu cầu đổi quà), reward_configs (ngưỡng theo khoá).
// Học sinh đổi quà qua hàm máy chủ redeem_reward (trừ sticker có khoá), không ghi thẳng reward_requests.
import { supabase } from '../lib/supabase'

const GIOI_HAN = 1000
const COT_QUA = 'id, name, emoji, description, is_active, grade, sticker_cost, created_at'

// ───────── quà ─────────

/** mọi quà (giáo viên) */
export function layQua() {
  return supabase.from('reward_items').select(COT_QUA).order('created_at').limit(GIOI_HAN)
}

/** quà đang mở cho em: quà chung (không gắn khoá) + quà của khoá em, rẻ trước */
export function layQuaChoEm(grade) {
  const q = supabase.from('reward_items').select(COT_QUA).eq('is_active', true).order('sticker_cost').limit(GIOI_HAN)
  return grade ? q.or(`grade.is.null,grade.eq.${grade}`) : q.is('grade', null)
}

export function themQua(dong) {
  return supabase.from('reward_items').insert(dong)
}

export function suaQua(id, thayDoi) {
  return supabase.from('reward_items').update(thayDoi).eq('id', id)
}

export function xoaQua(id) {
  return supabase.from('reward_items').delete().eq('id', id)
}

// ───────── yêu cầu đổi quà ─────────

/** 2000 yêu cầu gần nhất kèm tên + biểu tượng quà */
export function layYeuCauDoiQua() {
  return supabase.from('reward_requests')
    .select('id, student_id, reward_item_id, sticker_cost, status, requested_at, given_at, fulfilled_at, note, reward_items(name, emoji)')
    .order('id', { ascending: false }).limit(2000)
}

/** trạng thái các yêu cầu của 1 em (báo cáo thành tích) */
export function layTrangThaiDoiQuaCuaEm(userId) {
  return supabase.from('reward_requests').select('status').eq('student_id', userId).limit(GIOI_HAN)
}

/** lần gần nhất em được trao quà (null nếu chưa) — để báo "có quà mới" */
export async function layLanNhanQuaGanNhat(userId) {
  const { data } = await supabase.from('reward_requests').select('fulfilled_at').eq('student_id', userId).eq('status', 'fulfilled')
    .not('fulfilled_at', 'is', null).order('fulfilled_at', { ascending: false }).limit(1)
  return data?.[0]?.fulfilled_at || null
}

/**
 * Đổi trạng thái 1 yêu cầu CÒN ĐANG CHỜ ('fulfilled' = đã trao, 'cancelled' = từ chối).
 * Trả { doi: true } nếu đổi được; yêu cầu đã được xử lý trước đó (2 tab, bấm 2 lần) → { doi: false } — không hoàn sticker lần 2.
 */
export async function xuLyYeuCau(id, trangThai) {
  const thayDoi = trangThai === 'fulfilled' ? { status: 'fulfilled', fulfilled_at: new Date().toISOString() } : { status: trangThai }
  const { data, error } = await supabase.from('reward_requests').update(thayDoi).eq('id', id).eq('status', 'pending').select('id')
  return { doi: !!data?.length, error }
}

/** học sinh đổi quà: máy chủ tự lấy giá, kiểm đủ sticker, trừ + tạo yêu cầu trong 1 giao dịch → { data: { ok, reason } } */
export function doiQua(itemId) {
  return supabase.rpc('redeem_reward', { p_item: itemId })
}

// ───────── ngưỡng đổi quà theo khoá ─────────

/** ngưỡng của mọi khoá → { grade: số sticker } */
export async function layNguongCacKhoa() {
  const { data, error } = await supabase.from('reward_configs').select('grade, sticker_threshold').limit(GIOI_HAN)
  return { data: Object.fromEntries((data || []).map(c => [c.grade, c.sticker_threshold])), error }
}

export function luuNguong(grade, soSticker) {
  return supabase.from('reward_configs').upsert({ grade, sticker_threshold: soSticker, updated_at: new Date().toISOString() }, { onConflict: 'grade' })
}

/** các yêu cầu đổi quà của em kèm tên quà (thành tích của em) */
export function layYeuCauCuaEm(userId) {
  return supabase.from('reward_requests').select('id, status, sticker_cost, requested_at, fulfilled_at, given_at, reward_items(name, emoji)')
    .eq('student_id', userId).order('requested_at', { ascending: false }).limit(GIOI_HAN)
}
