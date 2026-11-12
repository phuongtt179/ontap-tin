// Tầng dữ liệu — phần thưởng: reward_items (quà), reward_requests (yêu cầu đổi quà), reward_configs (ngưỡng theo khoá).
// Học sinh đổi quà qua hàm máy chủ redeem_reward (trừ sticker có khoá), không ghi thẳng reward_requests.
import { supabase } from '../lib/supabase'

const GIOI_HAN = 1000

/** trạng thái các yêu cầu đổi quà của 1 em (báo cáo thành tích) */
export function layTrangThaiDoiQuaCuaEm(userId) {
  return supabase.from('reward_requests').select('status').eq('student_id', userId).limit(GIOI_HAN)
}
