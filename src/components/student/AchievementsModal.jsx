import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { X, Trophy, Medal, Award, Loader2, Flame, Star, GraduationCap, Gift } from 'lucide-react'

const TABS = [
  { key: 'rank', label: 'Vinh danh', icon: Trophy },
  { key: 'badges', label: 'Huy hiệu', icon: Medal },
  { key: 'rewards', label: 'Quà của tôi', icon: Gift },
]

// Định nghĩa huy hiệu — suy ra từ dữ liệu sẵn có
function computeBadges({ streakMax, stickerTotal, lessonsDone, hasReward }) {
  const badges = []
  ;[3, 7, 14, 30].forEach(n => badges.push({
    id: `streak${n}`, icon: '🔥', name: `Chăm ${n} ngày`,
    desc: `Học liên tục ${n} ngày`, earned: streakMax >= n, cur: streakMax, goal: n,
  }))
  ;[10, 50, 100, 200].forEach(n => badges.push({
    id: `sticker${n}`, icon: '⭐', name: `${n} sticker`,
    desc: `Tích lũy ${n} sticker`, earned: stickerTotal >= n, cur: stickerTotal, goal: n,
  }))
  ;[1, 5, 10, 20].forEach(n => badges.push({
    id: `lesson${n}`, icon: '🎓', name: `${n} bài học`,
    desc: `Hoàn thành ${n} bài học`, earned: lessonsDone >= n, cur: lessonsDone, goal: n,
  }))
  badges.push({
    id: 'reward1', icon: '🎁', name: 'Đổi quà',
    desc: 'Đổi phần thưởng đầu tiên', earned: hasReward, cur: hasReward ? 1 : 0, goal: 1,
  })
  return badges
}

export default function AchievementsModal({ open, onClose, userId, userName }) {
  const [tab, setTab] = useState('rank')
  const [loading, setLoading] = useState(true)
  const [leaderboard, setLeaderboard] = useState([])
  const [profile, setProfile] = useState(null)
  const [lessonsDone, setLessonsDone] = useState(0)
  const [rewards, setRewards] = useState([])
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!open) return
    setVisible(false)
    setTimeout(() => setVisible(true), 20)
    loadAll()
  }, [open])

  async function loadAll() {
    setLoading(true)
    const [{ data: lb }, { data: prof }, { count }, { data: rw }] = await Promise.all([
      supabase.rpc('get_class_leaderboard'),
      supabase.from('profiles').select('sticker_total, streak_days, streak_max, sticker_count').eq('id', userId).single(),
      supabase.from('lesson_progress').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('completed', true),
      supabase.from('reward_requests').select('*, reward_items(name, emoji)').eq('student_id', userId).order('created_at', { ascending: false }),
    ])
    setLeaderboard(lb || [])
    setProfile(prof || { sticker_total: 0, streak_max: 0 })
    setLessonsDone(count || 0)
    setRewards(rw || [])
    setLoading(false)
    // đánh dấu đã xem quà
    try { localStorage.setItem(`rewards_seen_${userId}`, new Date().toISOString()) } catch {}
  }

  if (!open) return null

  const badges = profile ? computeBadges({
    streakMax: profile.streak_max ?? 0,
    stickerTotal: profile.sticker_total ?? 0,
    lessonsDone,
    hasReward: rewards.some(r => r.status === 'fulfilled'),
  }) : []
  const earnedCount = badges.filter(b => b.earned).length

  function handleClose() { setVisible(false); setTimeout(onClose, 250) }

  return (
    <div className={`fixed inset-0 z-[60] flex items-center justify-center p-4 transition-all duration-250
      ${visible ? 'bg-black/50 backdrop-blur-sm' : 'bg-transparent'}`} onClick={handleClose}>
      <div className={`bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[88vh] flex flex-col overflow-hidden transition-all duration-300
        ${visible ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-pink-400 px-5 py-4 text-white relative shrink-0">
          <button onClick={handleClose} className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30">
            <X size={15} />
          </button>
          <div className="flex items-center gap-2">
            <Trophy size={22} />
            <h2 className="font-black text-lg">Thành tích của con</h2>
          </div>
          <p className="text-white/85 text-xs mt-0.5">{userName}</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-3 pt-3 shrink-0">
          {TABS.map(t => {
            const Icon = t.icon
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition
                  ${tab === t.key ? 'bg-orange-100 text-orange-600' : 'text-gray-400 hover:bg-gray-50'}`}>
                <Icon size={14} /> {t.label}
              </button>
            )
          })}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 size={28} className="animate-spin text-orange-400" /></div>
          ) : tab === 'rank' ? (
            <RankTab leaderboard={leaderboard} userId={userId} />
          ) : tab === 'badges' ? (
            <BadgesTab badges={badges} earnedCount={earnedCount} />
          ) : (
            <RewardsTab rewards={rewards} />
          )}
        </div>
      </div>
    </div>
  )
}

function RankTab({ leaderboard, userId }) {
  if (leaderboard.length === 0)
    return <Empty emoji="🏆" text="Chưa có dữ liệu xếp hạng" />
  const medals = ['🥇', '🥈', '🥉']
  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-400 text-center mb-1">Xếp hạng theo tổng sticker trong lớp</p>
      {leaderboard.map((s, i) => {
        const isMe = s.user_id === userId
        return (
          <div key={s.user_id}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl border transition
              ${isMe ? 'border-orange-300 bg-orange-50 shadow-sm' : 'border-gray-100 bg-white'}`}>
            <span className="w-7 text-center shrink-0 font-black text-sm">
              {i < 3 ? <span className="text-lg">{medals[i]}</span> : <span className="text-gray-400">{i + 1}</span>}
            </span>
            <div className="flex-1 min-w-0">
              <div className={`text-sm truncate ${isMe ? 'font-black text-orange-700' : 'font-semibold text-gray-700'}`}>
                {s.full_name} {isMe && <span className="text-[10px] bg-orange-500 text-white px-1.5 py-0.5 rounded-full ml-1">Con</span>}
              </div>
              <div className="text-[11px] text-gray-400 flex items-center gap-2">
                <span className="flex items-center gap-0.5"><Flame size={10} className="text-orange-400" /> {s.streak_days} ngày</span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-base font-black text-amber-500">⭐ {s.sticker_total}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function BadgesTab({ badges, earnedCount }) {
  return (
    <div>
      <div className="text-center mb-3">
        <span className="text-sm font-bold text-gray-700">Đã đạt {earnedCount}/{badges.length} huy hiệu</span>
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        {badges.map(b => (
          <div key={b.id}
            className={`flex flex-col items-center gap-1 p-2.5 rounded-2xl border-2 text-center transition
              ${b.earned ? 'border-amber-200 bg-amber-50' : 'border-gray-100 bg-gray-50 opacity-60'}`}>
            <span className={`text-3xl ${b.earned ? '' : 'grayscale opacity-50'}`}>{b.icon}</span>
            <span className={`text-[11px] font-bold leading-tight ${b.earned ? 'text-gray-700' : 'text-gray-400'}`}>{b.name}</span>
            {b.earned ? (
              <span className="text-[9px] text-amber-600 font-bold">✓ Đạt</span>
            ) : (
              <span className="text-[9px] text-gray-400">{Math.min(b.cur, b.goal)}/{b.goal}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function RewardsTab({ rewards }) {
  if (rewards.length === 0)
    return <Empty emoji="🎁" text="Con chưa đổi quà nào. Tích đủ sticker để đổi nhé!" />
  const STATUS = {
    pending: { label: '⏳ Chờ trao', cls: 'bg-yellow-100 text-yellow-700' },
    fulfilled: { label: '✅ Đã nhận', cls: 'bg-green-100 text-green-700' },
    cancelled: { label: '✕ Từ chối', cls: 'bg-gray-100 text-gray-500' },
  }
  return (
    <div className="space-y-2">
      {rewards.map(r => {
        const st = STATUS[r.status] || STATUS.pending
        return (
          <div key={r.id} className="flex items-center gap-3 px-3 py-2.5 rounded-2xl border border-gray-100 bg-white">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-100 to-yellow-100 flex items-center justify-center text-xl shrink-0">
              {r.reward_items?.emoji || '🎁'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-gray-700 truncate">{r.reward_items?.name || 'Phần thưởng'}</div>
              <div className="text-[11px] text-gray-400">⭐ {r.sticker_cost} · {new Date(r.created_at).toLocaleDateString('vi-VN')}</div>
            </div>
            <span className={`text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${st.cls}`}>{st.label}</span>
          </div>
        )
      })}
    </div>
  )
}

function Empty({ emoji, text }) {
  return (
    <div className="text-center py-12">
      <div className="text-5xl mb-3">{emoji}</div>
      <p className="text-gray-400 text-sm px-6">{text}</p>
    </div>
  )
}
