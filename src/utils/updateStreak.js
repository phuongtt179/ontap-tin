import { supabase } from '../lib/supabase'

export const STREAK_MILESTONES = {
  3:  { stickers: 3,  emoji: '🔥',  label: '3 ngày liên tiếp!' },
  7:  { stickers: 7,  emoji: '🔥🔥', label: '1 tuần liên tiếp!' },
  14: { stickers: 14, emoji: '🔥🔥🔥', label: '2 tuần liên tiếp!' },
  30: { stickers: 30, emoji: '🏆',  label: '1 tháng liên tiếp!' },
}

// Ghi nhận hoạt động học hôm nay qua hàm máy chủ record_activity (migration_secure_profiles.sql):
// tính chuỗi ngày học + cộng sticker mốc chuỗi trong 1 giao dịch có khoá dòng → mở nhiều tab cũng chỉ tính 1 lần,
// học sinh không tự sửa được chuỗi/sticker. `userId` giữ để tương thích, máy chủ tự lấy từ phiên đăng nhập.
// eslint-disable-next-line no-unused-vars
export async function updateStreak(userId) {
  const { data, error } = await supabase.rpc('record_activity')
  if (error || !data) return null
  if (!data.isNew) return { streakDays: data.streakDays ?? 0, isNew: false }
  const milestone = data.bonus > 0 ? (STREAK_MILESTONES[data.streakDays] ?? { stickers: data.bonus, emoji: '🔥', label: '' }) : null
  return { streakDays: data.streakDays, isNew: true, milestone, stickerCount: data.sticker_count, stickerTotal: data.sticker_total }
}
