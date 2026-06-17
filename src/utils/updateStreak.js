import { supabase } from '../lib/supabase'

export const STREAK_MILESTONES = {
  3:  { stickers: 3,  emoji: '🔥',  label: '3 ngày liên tiếp!' },
  7:  { stickers: 7,  emoji: '🔥🔥', label: '1 tuần liên tiếp!' },
  14: { stickers: 14, emoji: '🔥🔥🔥', label: '2 tuần liên tiếp!' },
  30: { stickers: 30, emoji: '🏆',  label: '1 tháng liên tiếp!' },
}

export async function updateStreak(userId) {
  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD

  const { data: prof } = await supabase
    .from('profiles')
    .select('streak_days, last_active_date, streak_max')
    .eq('id', userId)
    .single()

  if (!prof) return null

  // Đã học hôm nay rồi → không tính thêm
  if (prof.last_active_date === today) {
    return { streakDays: prof.streak_days ?? 0, isNew: false }
  }

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().slice(0, 10)

  const newStreak = prof.last_active_date === yesterdayStr
    ? (prof.streak_days ?? 0) + 1
    : 1

  const newMax = Math.max(prof.streak_max ?? 0, newStreak)

  await supabase.from('profiles').update({
    streak_days: newStreak,
    last_active_date: today,
    streak_max: newMax,
  }).eq('id', userId)

  const milestone = STREAK_MILESTONES[newStreak] ?? null
  return { streakDays: newStreak, isNew: true, milestone }
}
