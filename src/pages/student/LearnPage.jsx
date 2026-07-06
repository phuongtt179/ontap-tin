import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { useSelectedGrade } from '../../hooks/useEnrollments'
import { CheckCircle, Zap, ChevronLeft, ChevronRight, Gift, Trophy, X, Send, Loader2, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import RewardModal from '../../components/student/RewardModal'
import AchievementsModal from '../../components/student/AchievementsModal'

// ── Helpers ──────────────────────────────────────────────────────

function getProgress(lesson, progress) {
  const hasVideo = !!lesson.video_url
  const hasQuiz = lesson.question_ids?.length > 0
  const hasPractice = lesson.has_practice
  const videoOk = !hasVideo || progress?.video_watched
  const quizOk = !hasQuiz || progress?.quiz_passed
  const practiceOk = !hasPractice || progress?.practice_submitted
  const total = [hasVideo, hasQuiz, hasPractice].filter(Boolean).length
  const done = [videoOk && hasVideo, quizOk && hasQuiz, practiceOk && hasPractice].filter(Boolean).length
  return { total, done, completed: progress?.completed }
}

function getLessonEmoji(lesson) {
  const t = (lesson.title + ' ' + (lesson.topic || '')).toLowerCase()
  if (t.includes('làm quen') || t.includes('giới thiệu')) return '👋'
  if (t.includes('chuyển động') || t.includes('motion')) return '🚀'
  if (t.includes('ngoại hình') || t.includes('looks') || t.includes('trang phục')) return '🎨'
  if (t.includes('âm thanh') || t.includes('sound') || t.includes('nhạc')) return '🎵'
  if (t.includes('broadcast') || t.includes('tin nhắn')) return '📣'
  if (t.includes('sự kiện') || t.includes('event')) return '⚡'
  if (t.includes('vòng lặp') || t.includes('loop') || t.includes('lặp lại')) return '🔁'
  if (t.includes('điều kiện') || t.includes('if') || t.includes('rẽ nhánh')) return '🔀'
  if (t.includes('biến') || t.includes('variable')) return '📦'
  if (t.includes('toán tử') || t.includes('phép tính') || t.includes('operator')) return '🔢'
  if (t.includes('danh sách') || t.includes('list')) return '📋'
  if (t.includes('bút') || t.includes('pen') || t.includes('vẽ đường')) return '🖊️'
  if (t.includes('nhân vật') || t.includes('sprite')) return '🦸'
  if (t.includes('backdrop') || t.includes('cảnh nền') || t.includes('sân khấu')) return '🌄'
  if (t.includes('game') || t.includes('trò chơi')) return '🎮'
  if (t.includes('animation') || t.includes('hoạt hình')) return '🎬'
  if (t.includes('cảm biến') || t.includes('sensing')) return '📡'
  if (t.includes('clone') || t.includes('nhân bản')) return '🪞'
  if (t.includes('project') || t.includes('dự án') || t.includes('sản phẩm')) return '🏆'
  if (t.includes('ôn tập') || t.includes('tổng hợp') || t.includes('tổng kết')) return '📚'
  if (t.includes('bài tập') || t.includes('luyện tập')) return '✏️'
  if (t.includes('kiểm tra') || t.includes('test')) return '📝'
  if (t.includes('gõ phím') || t.includes('typing')) return '⌨️'
  if (t.includes('chuột') || t.includes('mouse')) return '🖱️'
  if (t.includes('paint') || t.includes('vẽ')) return '🎨'
  if (t.includes('internet') || t.includes('web')) return '🌐'
  if (t.includes('an toàn')) return '🛡️'
  if (t.includes('word') || t.includes('văn bản')) return '📝'
  if (t.includes('excel') || t.includes('bảng tính')) return '📊'
  if (t.includes('glide') || t.includes('trượt')) return '⛷️'
  if (t.includes('python')) return '🐍'
  if (t.includes('scratch')) return '🐱'
  // Deterministic fallback per lesson title
  const hash = lesson.title.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return ['💡', '🔧', '⚙️', '🎯', '🌟', '🧩', '🔬', '🎪', '🖥️', '🏅', '🎁', '🌈'][hash % 12]
}

function getTopicEmoji(topic) {
  const t = topic.toLowerCase()
  if (t.includes('scratch')) return '🐱'
  if (t.includes('gõ phím') || t.includes('bàn phím') || t.includes('typing')) return '⌨️'
  if (t.includes('paint') || t.includes('vẽ')) return '🎨'
  if (t.includes('python')) return '🐍'
  if (t.includes('máy tính') || t.includes('computer')) return '🖥️'
  if (t.includes('internet') || t.includes('mạng') || t.includes('web')) return '🌐'
  if (t.includes('word') || t.includes('văn bản')) return '📝'
  if (t.includes('excel') || t.includes('bảng tính')) return '📊'
  if (t.includes('game')) return '🎮'
  if (t.includes('an toàn')) return '🛡️'
  if (t.includes('nền tảng')) return '🏗️'
  if (t.includes('sự kiện') || t.includes('event')) return '⚡'
  if (t.includes('chuyển động') || t.includes('motion')) return '🚀'
  if (t.includes('animation') || t.includes('hoạt hình')) return '🎬'
  if (t.includes('âm thanh') || t.includes('sound')) return '🎵'
  const hash = topic.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return ['📚', '💡', '🎯', '🏆', '🧩', '🌟', '🔬', '🎪'][hash % 8]
}

// ── Node color palette ────────────────────────────────────────────
const NODE_PALETTE = [
  { from: '#f472b6', to: '#db2777', shadow: 'rgba(244,114,182,0.45)' }, // pink
  { from: '#fb923c', to: '#ea580c', shadow: 'rgba(251,146,60,0.45)' },  // orange
  { from: '#a3e635', to: '#65a30d', shadow: 'rgba(163,230,53,0.45)' },  // lime
  { from: '#34d399', to: '#059669', shadow: 'rgba(52,211,153,0.45)' },  // emerald
  { from: '#38bdf8', to: '#0284c7', shadow: 'rgba(56,189,248,0.45)' },  // sky
  { from: '#818cf8', to: '#4338ca', shadow: 'rgba(129,140,248,0.45)' }, // indigo
  { from: '#c084fc', to: '#7c3aed', shadow: 'rgba(192,132,252,0.45)' }, // violet
  { from: '#f9a8d4', to: '#be185d', shadow: 'rgba(249,168,212,0.45)' }, // rose
  { from: '#fcd34d', to: '#d97706', shadow: 'rgba(252,211,77,0.45)' },  // amber
]

// ── Topic card colors ─────────────────────────────────────────────
const CARD_COLORS = [
  { gradient: 'from-blue-500 to-blue-600', border: 'border-blue-200', bg: 'bg-blue-50', text: 'text-blue-700', badge: 'bg-blue-100', bar: 'bg-blue-500' },
  { gradient: 'from-violet-500 to-violet-600', border: 'border-violet-200', bg: 'bg-violet-50', text: 'text-violet-700', badge: 'bg-violet-100', bar: 'bg-violet-500' },
  { gradient: 'from-emerald-500 to-emerald-600', border: 'border-emerald-200', bg: 'bg-emerald-50', text: 'text-emerald-700', badge: 'bg-emerald-100', bar: 'bg-emerald-500' },
  { gradient: 'from-orange-500 to-orange-600', border: 'border-orange-200', bg: 'bg-orange-50', text: 'text-orange-700', badge: 'bg-orange-100', bar: 'bg-orange-500' },
  { gradient: 'from-pink-500 to-pink-600', border: 'border-pink-200', bg: 'bg-pink-50', text: 'text-pink-700', badge: 'bg-pink-100', bar: 'bg-pink-500' },
  { gradient: 'from-cyan-500 to-cyan-600', border: 'border-cyan-200', bg: 'bg-cyan-50', text: 'text-cyan-700', badge: 'bg-cyan-100', bar: 'bg-cyan-500' },
  { gradient: 'from-amber-500 to-amber-600', border: 'border-amber-200', bg: 'bg-amber-50', text: 'text-amber-700', badge: 'bg-amber-100', bar: 'bg-amber-500' },
  { gradient: 'from-teal-500 to-teal-600', border: 'border-teal-200', bg: 'bg-teal-50', text: 'text-teal-700', badge: 'bg-teal-100', bar: 'bg-teal-500' },
  { gradient: 'from-rose-500 to-rose-600', border: 'border-rose-200', bg: 'bg-rose-50', text: 'text-rose-700', badge: 'bg-rose-100', bar: 'bg-rose-500' },
]

// ── Topic cards scrollable row ────────────────────────────────────
function TopicCards({ topicKeys, lessons, progressMap, grouped, selected, onSelect }) {
  const ref = useRef(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(false)

  function checkScroll() {
    const el = ref.current; if (!el) return
    setCanLeft(el.scrollLeft > 4)
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }
  useEffect(() => {
    checkScroll()
    const el = ref.current; if (!el) return
    el.addEventListener('scroll', checkScroll, { passive: true })
    return () => el.removeEventListener('scroll', checkScroll)
  }, [topicKeys])

  const items = [
    { key: '__all__', label: 'Tất cả', emoji: '🏠', list: lessons, colorIdx: -1 },
    ...topicKeys.map((k, i) => ({
      key: k,
      label: k === '__no_topic__' ? 'Chưa phân loại' : k,
      emoji: getTopicEmoji(k),
      list: grouped[k] || [],
      colorIdx: i,
    }))
  ]

  return (
    <div className="relative flex items-center">
      {canLeft && (
        <button onClick={() => ref.current?.scrollBy({ left: -200, behavior: 'smooth' })}
          className="absolute left-1 z-10 w-7 h-7 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50">
          <ChevronLeft size={14} />
        </button>
      )}

      <div ref={ref} onScroll={checkScroll}
        className="flex-1 overflow-x-auto px-4 py-3"
        style={{ scrollbarWidth: 'none' }}>
        <div className="flex gap-3 justify-center min-w-full w-max">
        {items.map(({ key, label, emoji, list, colorIdx }) => {
          const active = selected === key
          const done = list.filter(l => progressMap[l.id]?.completed).length
          const pct = list.length ? (done / list.length) * 100 : 0
          const c = colorIdx >= 0 ? CARD_COLORS[colorIdx % CARD_COLORS.length] : CARD_COLORS[0]

          return (
            <button key={key} onClick={() => onSelect(key)}
              className={`shrink-0 w-36 rounded-2xl p-3 text-left transition-all duration-200 border-2
                ${active
                  ? `bg-gradient-to-br ${c.gradient} border-transparent shadow-xl shadow-black/15 scale-[1.05]`
                  : `bg-white ${c.border} hover:shadow-md hover:${c.bg} hover:scale-[1.02] hover:border-opacity-60`
                }`}>

              {/* Emoji + count */}
              <div className="flex items-start justify-between mb-2">
                <span className="text-2xl leading-none">{emoji}</span>
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full leading-tight
                  ${active ? 'bg-white/25 text-white' : `${c.badge} ${c.text}`}`}>
                  {list.length}
                </span>
              </div>

              {/* Topic name */}
              <p className={`text-[11px] font-bold leading-tight line-clamp-2 min-h-[2rem]
                ${active ? 'text-white' : 'text-gray-700'}`}>
                {label}
              </p>

              {/* Progress */}
              {list.length > 0 && (
                <div className="mt-2.5">
                  <div className={`h-1.5 rounded-full overflow-hidden ${active ? 'bg-white/25' : 'bg-gray-100'}`}>
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${active ? 'bg-white' : c.bar}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className={`text-[9px] mt-1 font-medium ${active ? 'text-white/80' : 'text-gray-400'}`}>
                    {done > 0 ? `✓ ${done}/${list.length} hoàn thành` : `${list.length} bài học`}
                  </p>
                </div>
              )}
            </button>
          )
        })}
        </div>
      </div>

      {canRight && (
        <button onClick={() => ref.current?.scrollBy({ left: 200, behavior: 'smooth' })}
          className="absolute right-1 z-10 w-7 h-7 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50">
          <ChevronRight size={14} />
        </button>
      )}
    </div>
  )
}

// ── Lesson node ───────────────────────────────────────────────────
function LessonNode({ lesson, globalIdx, prog, navigate }) {
  const { total, done, completed } = getProgress(lesson, prog)
  const inProgress = done > 0 && !completed
  const notCompleted = !completed
  const emoji = getLessonEmoji(lesson)
  const c = NODE_PALETTE[globalIdx % NODE_PALETTE.length]

  const circleStyle = completed
    ? { background: `linear-gradient(135deg, ${c.from}, ${c.to})`, boxShadow: `0 4px 14px ${c.shadow}` }
    : inProgress
    ? { background: `linear-gradient(135deg, ${c.from}, ${c.to})`, boxShadow: `0 4px 18px ${c.shadow}`,
        animation: 'node-breathe 1.6s ease-in-out infinite' }
    : { background: `linear-gradient(135deg, ${c.from}cc, ${c.to}cc)`, border: `2.5px dashed ${c.from}`,
        animation: 'node-breathe 1.6s ease-in-out infinite' }

  return (
    <button
      onClick={() => navigate(`/student/learn/${lesson.id}`)}
      className="relative flex flex-col items-center group w-14 md:w-16 shrink-0"
      style={{ paddingTop: notCompleted ? '26px' : undefined }}
    >
      {/* "Học thôi!" badge — tất cả bài chưa hoàn thành */}
      {notCompleted && (
        <span className="absolute top-0 left-1/2 whitespace-nowrap z-10
          bg-gradient-to-r from-orange-400 to-pink-500 text-white text-[9px] font-black
          px-2 py-0.5 rounded-full shadow-lg"
          style={{ animation: 'indicator-bounce 1s ease-in-out infinite' }}>
          ▶ Học thôi!
        </span>
      )}

      {/* Circle */}
      <div className="relative w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center text-xl md:text-2xl
        transition-transform duration-200 group-hover:scale-110 group-active:scale-95 overflow-hidden"
        style={circleStyle}>

        {/* Shimmer sweep */}
        {notCompleted && (
          <span className="absolute top-0 bottom-0 w-8 bg-white/40 pointer-events-none rounded-full"
            style={{ animation: 'node-shimmer 2s ease-in-out infinite' }} />
        )}

        <span className="select-none relative z-10 drop-shadow-sm">
          {completed ? '✅' : emoji}
        </span>

        {/* Number badge */}
        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-[9px] font-black
          flex items-center justify-center border-2 border-white shadow-sm z-10"
          style={{ background: c.to, color: '#fff' }}>
          {globalIdx + 1}
        </span>
      </div>

      {/* Title */}
      <p className="text-[9px] md:text-[10px] text-center font-semibold mt-1.5 leading-tight line-clamp-2 w-14 md:w-16"
        style={{ color: c.to }}>
        {lesson.title}
      </p>

      {/* Progress dots */}
      {total > 0 && (
        <div className="flex gap-0.5 mt-1">
          {Array.from({ length: total }).map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full"
              style={{ background: i < done ? c.from : '#e5e7eb' }} />
          ))}
        </div>
      )}
    </button>
  )
}

// ── Zigzag path inside a unit ─────────────────────────────────────
function UnitPath({ lessons, progressMap, navigate, globalStart }) {
  const [cols, setCols] = useState(() => window.innerWidth < 768 ? 2 : 4)
  useEffect(() => {
    const h = () => setCols(window.innerWidth < 768 ? 2 : 4)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])
  const COLS = cols
  const rows = []
  for (let i = 0; i < lessons.length; i += COLS) {
    rows.push(lessons.slice(i, i + COLS))
  }

  return (
    <div className="space-y-0">
      {rows.map((row, rowIdx) => {
        const isLTR = rowIdx % 2 === 0
        const displayRow = isLTR ? row : [...row].reverse()

        return (
          <div key={rowIdx}>
            <div className="flex items-start">
              {displayRow.map((lesson, colIdx) => {
                const realColIdx = isLTR ? colIdx : (row.length - 1 - colIdx)
                const globalIdx = globalStart + rowIdx * COLS + realColIdx
                const prog = progressMap[lesson.id]
                const isLastInRow = colIdx === displayRow.length - 1

                return (
                  <div key={lesson.id} className="flex items-center flex-1 min-w-0">
                    <LessonNode lesson={lesson} globalIdx={globalIdx} prog={prog} navigate={navigate} />
                    {!isLastInRow && (
                      <div className="flex-1 h-1 mx-0.5 rounded-full min-w-[6px]">
                        <div className={`h-full rounded-full
                          ${prog?.completed && displayRow[colIdx + 1] && progressMap[displayRow[colIdx + 1].id]?.completed
                            ? 'bg-emerald-200' : 'bg-gray-200'}`} />
                      </div>
                    )}
                  </div>
                )
              })}
              {row.length < COLS && Array.from({ length: COLS - row.length }).map((_, i) => (
                <div key={`pad-${i}`} className="flex-1" />
              ))}
            </div>

            {rowIdx < rows.length - 1 && (
              <div className={`flex ${isLTR ? 'justify-end pr-5 md:pr-6' : 'justify-start pl-5 md:pl-6'}`}>
                <div className="flex flex-col gap-0.5 py-0.5">
                  {[0, 1, 2].map(i => <div key={i} className="w-1 h-1.5 rounded-full bg-gray-200" />)}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Unit card ─────────────────────────────────────────────────────
function UnitCard({ unit, lessons, progressMap, navigate, unitIndex, globalStart }) {
  const doneCount = lessons.filter(l => progressMap[l.id]?.completed).length
  const allDone = doneCount === lessons.length
  const anyStarted = doneCount > 0 || lessons.some(l => { const p = progressMap[l.id]; return p && !p.completed })

  return (
    <div className={`mx-3 md:mx-4 rounded-2xl border-2 overflow-hidden shadow-sm
      ${allDone ? 'border-emerald-200 bg-emerald-50/60'
        : anyStarted ? 'border-blue-100 bg-blue-50/40'
        : 'border-gray-100 bg-white'}`}>

      <div className={`flex items-center gap-2.5 px-4 py-2.5 border-b
        ${allDone ? 'border-emerald-200 bg-emerald-100/60'
          : anyStarted ? 'border-blue-100 bg-blue-100/40'
          : 'border-gray-100 bg-gray-50'}`}>
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0
          ${allDone ? 'bg-emerald-500 text-white'
            : anyStarted ? 'bg-blue-500 text-white'
            : 'bg-gray-200 text-gray-500'}`}>
          {allDone ? '✓' : unitIndex + 1}
        </div>
        <span className={`font-bold text-sm flex-1
          ${allDone ? 'text-emerald-800' : anyStarted ? 'text-blue-800' : 'text-gray-700'}`}>
          {unit?.name || 'Bài học'}
        </span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
          ${allDone ? 'bg-emerald-200 text-emerald-700'
            : anyStarted ? 'bg-blue-100 text-blue-600'
            : 'bg-gray-100 text-gray-400'}`}>
          {doneCount}/{lessons.length}
        </span>
      </div>

      <div className="p-3 md:p-4">
        <UnitPath lessons={lessons} progressMap={progressMap} navigate={navigate} globalStart={globalStart} />
      </div>
    </div>
  )
}

// ── Full learning map ─────────────────────────────────────────────
function LearningMap({ groups, progressMap, navigate, allLessonsCount, completedCount }) {
  if (!allLessonsCount) return (
    <div className="text-center py-20">
      <div className="text-6xl mb-4">📖</div>
      <p className="text-gray-500 font-medium">Chưa có bài học nào</p>
    </div>
  )

  let globalStart = 0

  return (
    <div className="py-4 space-y-3 max-w-2xl mx-auto">
      {groups.map((group, i) => {
        const start = globalStart
        globalStart += group.lessons.length
        return (
          <UnitCard
            key={group.unit?.id || `__no_unit_${i}`}
            unit={group.unit}
            lessons={group.lessons}
            progressMap={progressMap}
            navigate={navigate}
            unitIndex={i}
            globalStart={start}
          />
        )
      })}

      <div className="flex justify-center pt-4 pb-6">
        <div className={`flex flex-col items-center gap-1.5 transition-all duration-500
          ${completedCount === allLessonsCount ? 'opacity-100 scale-110' : 'opacity-20 scale-100'}`}>
          <div className="text-5xl">🏁</div>
          <p className="text-xs font-black text-gray-500 tracking-widest">HOÀN THÀNH!</p>
          {completedCount === allLessonsCount && (
            <p className="text-emerald-600 text-xs font-semibold mt-1">🎉 Xuất sắc!</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────
export default function LearnPage() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const { grades, selectedGrade, setSelectedGrade, loading: enrollLoading } = useSelectedGrade(user?.id)
  const [lessons, setLessons] = useState([])
  const [topics, setTopics] = useState([])
  const [units, setUnits] = useState([])
  const [progressMap, setProgressMap] = useState({})
  const [loading, setLoading] = useState(false)
  const [selectedTopic, setSelectedTopic] = useState('__all__')
  const [stickerCount, setStickerCount] = useState(0)
  const [streakDays, setStreakDays] = useState(0)
  const [showReward, setShowReward] = useState(false)
  const [stickerThreshold, setStickerThreshold] = useState(50)
  const [showAchievements, setShowAchievements] = useState(false)
  const [rewardNotif, setRewardNotif] = useState(false)   // có quà mới được trao chưa xem
  // Khung chat mascot: tự mở lần đầu trong ngày, đóng thì thu về nút nổi để mở lại
  const [nudgeOpen, setNudgeOpen] = useState(() => {
    try { return localStorage.getItem('nudge_' + (user?.id || '')) !== new Date().toDateString() } catch { return true }
  })

  function closeNudge() {
    setNudgeOpen(false)
    try { localStorage.setItem('nudge_' + (user?.id || ''), new Date().toDateString()) } catch {}
  }

  // Chat với AI ngay trong khung mascot
  const [courseScope, setCourseScope] = useState('')
  const [chatMsgs, setChatMsgs] = useState([])       // [{role:'student'|'ai', content}]
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef(null)

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatMsgs, chatLoading])

  async function sendChat() {
    const q = chatInput.trim()
    if (!q || chatLoading) return
    const newMsgs = [...chatMsgs, { role: 'student', content: q }]
    setChatMsgs(newMsgs)
    setChatInput('')
    setChatLoading(true)
    try {
      await new Promise(r => setTimeout(r, 500 + Math.random() * 1500))
      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'theory',
          context: { courseScope, courseRoadmap, studentName: profile?.full_name || '', lessonsCompleted },
          messages: newMsgs,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.answer) {
        toast.error(res.status === 429
          ? (data.error === 'quota_rpd' ? 'Trợ lý đã hết lượt hỏi hôm nay, mai con hỏi tiếp nhé 🙏' : 'Nhiều bạn đang hỏi cùng lúc, con chờ chút rồi hỏi lại nhé 🙏')
          : 'Chưa hỏi được trợ lý, con thử lại nhé')
        return
      }
      setChatMsgs([...newMsgs, { role: 'ai', content: data.answer }])
      supabase.from('messages').insert([
        { student_id: user.id, sender_role: 'student', channel: 'ai', content: q, context: { from: 'home', grade: selectedGrade }, is_read: true },
        { student_id: user.id, sender_role: 'ai', channel: 'ai', content: data.answer, context: { from: 'home', grade: selectedGrade }, is_read: true },
      ]).then(() => {})
    } catch {
      toast.error('Có lỗi xảy ra, con thử lại nhé')
    } finally {
      setChatLoading(false)
    }
  }

  // Kiểm tra quà mới được trao (thông báo chấm đỏ)
  useEffect(() => {
    if (!user?.id) return
    async function checkRewardNotif() {
      const { data } = await supabase.from('reward_requests')
        .select('fulfilled_at').eq('student_id', user.id).eq('status', 'fulfilled')
        .not('fulfilled_at', 'is', null).order('fulfilled_at', { ascending: false }).limit(1)
      if (!data?.length) return
      const lastSeen = localStorage.getItem(`rewards_seen_${user.id}`)
      if (!lastSeen || new Date(data[0].fulfilled_at) > new Date(lastSeen)) setRewardNotif(true)
    }
    checkRewardNotif()
  }, [user?.id])

  useEffect(() => {
    if (selectedGrade && user) { setSelectedTopic('__all__'); loadData() }
  }, [selectedGrade, user?.id])

  async function loadData() {
    setLoading(true)
    const [{ data: topicsData }, { data: lessonsData }, { data: progressData }, { data: unitsData }, { data: profData }, { data: cfgData }, { data: scopeData }] = await Promise.all([
      supabase.from('topics').select('*').in('grade', [selectedGrade, 'all']),
      supabase.from('lessons').select('*').eq('is_published', true).eq('grade', selectedGrade)
        .order('order', { ascending: true }).order('created_at', { ascending: true }),
      supabase.from('lesson_progress').select('*').eq('user_id', user.id),
      supabase.from('units').select('*').eq('grade', selectedGrade).order('sort_order').order('name'),
      supabase.from('profiles').select('sticker_count, streak_days').eq('id', user.id).single(),
      supabase.from('reward_configs').select('sticker_threshold').eq('grade', selectedGrade).maybeSingle(),
      supabase.from('grades').select('ai_scope').eq('value', selectedGrade).maybeSingle(),
    ])
    setCourseScope(scopeData?.ai_scope || '')
    setLessons(lessonsData || [])
    setUnits(unitsData || [])
    setTopics((topicsData || []).sort((a, b) => a.name.localeCompare(b.name, 'vi', { numeric: true })))
    const map = {}
    ;(progressData || []).forEach(p => { map[p.lesson_id] = p })
    setProgressMap(map)
    setStickerCount(profData?.sticker_count ?? 0)
    setStreakDays(profData?.streak_days ?? 0)
    setStickerThreshold(cfgData?.sticker_threshold ?? 50)
    setLoading(false)
  }

  const grouped = useMemo(() => {
    const g = {}
    lessons.forEach(l => { const k = l.topic || '__no_topic__'; if (!g[k]) g[k] = []; g[k].push(l) })
    return g
  }, [lessons])

  const topicChips = useMemo(() => {
    const from = topics.map(t => t.name)
    lessons.forEach(l => { const k = l.topic || '__no_topic__'; if (!from.includes(k)) from.push(k) })
    return from
  }, [topics, lessons])

  const displayedLessons = useMemo(() => {
    if (selectedTopic === '__all__') return lessons
    return lessons.filter(l => (l.topic || '__no_topic__') === selectedTopic)
  }, [lessons, selectedTopic])

  // Lộ trình khóa (đơn vị → bài) cho AI trả lời câu hỏi chương trình học
  const courseRoadmap = useMemo(() => {
    const lines = []
    units.forEach(u => {
      const titles = lessons.filter(l => l.unit_id === u.id).map(l => l.title)
      if (titles.length) lines.push(`• ${u.name}: ${titles.join(', ')}`)
    })
    const noUnit = lessons.filter(l => !l.unit_id).map(l => l.title)
    if (noUnit.length) lines.push(`• Bài khác: ${noUnit.join(', ')}`)
    return lines.join('\n')
  }, [units, lessons])

  const lessonsCompleted = useMemo(
    () => lessons.filter(l => progressMap[l.id]?.completed).length,
    [lessons, progressMap]
  )

  // Tách marker [[BÀI: tên]] trong câu trả lời AI → nút bấm vào bài
  function parseLessonLinks(content) {
    const re = /\[\[\s*BÀI\s*:\s*(.+?)\s*\]\]/gi
    const buttons = []
    const seen = new Set()
    let m
    while ((m = re.exec(content)) !== null) {
      const q = m[1].trim().toLowerCase()
      const lesson = lessons.find(l => l.title.trim().toLowerCase() === q)
        || lessons.find(l => { const t = l.title.trim().toLowerCase(); return t.includes(q) || q.includes(t) })
      if (lesson && !seen.has(lesson.id)) { seen.add(lesson.id); buttons.push({ id: lesson.id, title: lesson.title }) }
    }
    const text = content.replace(re, '').replace(/\n{3,}/g, '\n\n').trim()
    return { text, buttons }
  }

  // Mascot chào khi vào: giới thiệu bài mới / nhắc bài chưa hoàn thành
  const nudge = useMemo(() => {
    if (displayedLessons.length === 0) return null
    const firstName = (profile?.full_name || '').trim().split(/\s+/).slice(-1)[0] || 'em'
    const incomplete = displayedLessons.filter(l => !progressMap[l.id]?.completed)
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    const fresh = displayedLessons.filter(l =>
      !progressMap[l.id] && l.created_at && new Date(l.created_at).getTime() > weekAgo)
    const MAX = 5
    const toItems = arr => arr.slice(0, MAX).map(l => ({ id: l.id, title: l.title }))
    if (fresh.length > 0) return {
      kind: 'new', emoji: '🎉', firstName, badge: fresh.length,
      greeting: `Chào ${firstName}! 👋`,
      message: fresh.length === 1 ? 'Hôm nay có 1 bài mới nè, con học nhé!' : `Hôm nay có ${fresh.length} bài mới nè, con chọn bài để học nhé:`,
      items: toItems(fresh), more: Math.max(0, fresh.length - MAX),
    }
    if (incomplete.length > 0) return {
      kind: 'incomplete', emoji: '💪', firstName, badge: incomplete.length,
      greeting: `Chào ${firstName}! 👋`,
      message: incomplete.length === 1 ? 'Con còn 1 bài chưa hoàn thành, mình học tiếp nhé!' : `Con còn ${incomplete.length} bài chưa hoàn thành, con chọn bài để học tiếp nhé:`,
      items: toItems(incomplete), more: Math.max(0, incomplete.length - MAX),
    }
    return {
      kind: 'done', emoji: '🌟', firstName, badge: 0,
      greeting: `Chào ${firstName}! 🌟`,
      message: 'Con đã hoàn thành hết bài rồi, giỏi ghê! Chờ bài mới nha.',
      items: [], more: 0,
    }
  }, [displayedLessons, progressMap, profile?.full_name])

  const groups = useMemo(() => {
    const unitMap = {}
    const noUnit = []
    displayedLessons.forEach(l => {
      if (l.unit_id) {
        if (!unitMap[l.unit_id]) unitMap[l.unit_id] = []
        unitMap[l.unit_id].push(l)
      } else {
        noUnit.push(l)
      }
    })
    const result = units.filter(u => unitMap[u.id]).map(u => ({ unit: u, lessons: unitMap[u.id] }))
    if (noUnit.length) result.push({ unit: null, lessons: noUnit })
    return result
  }, [displayedLessons, units])

  const totalLessons = lessons.length
  const completedLessons = lessons.filter(l => progressMap[l.id]?.completed).length

  if (enrollLoading || loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-sky-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
          <p className="text-blue-600 text-sm font-medium">Đang tải...</p>
        </div>
      </div>
    )
  }

  if (grades.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-sky-100 p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">📚</div>
          <p className="text-xl font-bold text-gray-700">Bạn chưa tham gia khoá học nào</p>
          <p className="text-gray-400 mt-2">Liên hệ giáo viên để được thêm vào khoá học</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50">

      {/* ① Hero — cố định, không cuộn */}
      {/* Reward modal */}
      {showReward && (
        <RewardModal
          stickerCount={stickerCount}
          threshold={stickerThreshold}
          grade={selectedGrade}
          onClose={() => setShowReward(false)}
          onRedeemed={newCount => setStickerCount(newCount)}
        />
      )}

      {/* Achievements modal */}
      <AchievementsModal
        open={showAchievements}
        onClose={() => setShowAchievements(false)}
        userId={user.id}
        userName={profile?.full_name}
      />

      {/* ① Hero */}
      <div className="shrink-0 bg-gradient-to-r from-[#003d8f] via-[#0055bb] to-[#0077dd] text-white px-5 py-4 md:px-8 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 flex items-center pr-6 opacity-10 select-none pointer-events-none text-8xl">🗺️</div>
        <div className="relative max-w-4xl mx-auto">
          <div className="flex items-center gap-3">

            {/* Left: tên + badges khóa học — tối đa 4 khoá/hàng */}
            <div className="flex-1 min-w-0 flex flex-col gap-1.5">
              {/* Hàng tên + tiến độ */}
              <div className="flex items-center gap-2">
                <h2 className="font-black text-base whitespace-nowrap">{profile?.full_name || 'Học sinh'}</h2>
                {totalLessons > 0 && (
                  <div className="flex items-center gap-1 bg-white/15 rounded-full px-2.5 py-0.5">
                    <CheckCircle size={11} className="text-yellow-300" />
                    <span className="text-xs font-semibold">{completedLessons}/{totalLessons}</span>
                  </div>
                )}
              </div>
              {/* Grade buttons: 4 khoá/hàng */}
              {[...Array(Math.ceil(grades.length / 4))].map((_, rowIdx) => (
                <div key={rowIdx} className="flex items-center gap-1.5 flex-wrap">
                  {grades.slice(rowIdx * 4, rowIdx * 4 + 4).map(g => (
                    <button key={g} onClick={() => setSelectedGrade(g)}
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold transition whitespace-nowrap
                        ${selectedGrade === g ? 'bg-white text-blue-700' : 'bg-white/20 text-white hover:bg-white/30'}`}>
                      {g}
                    </button>
                  ))}
                </div>
              ))}
            </div>

            {/* Right: Streak + Sticker widgets compact */}
            <div className="flex items-center gap-2 shrink-0">

              {/* Streak */}
              <div className="flex items-center gap-2 bg-white/15 rounded-xl px-2.5 py-2">
                <span className="text-2xl select-none leading-none"
                  style={{ display: 'inline-block', animation: streakDays > 0 ? 'sticker-float 2.8s ease-in-out infinite' : undefined }}>
                  🔥
                </span>
                <div className="flex flex-col gap-0.5">
                  <span className="text-white font-black text-lg leading-none">{streakDays}</span>
                  <div className="w-12 h-1.5 bg-white/25 rounded-full overflow-hidden">
                    {(() => {
                      const milestones = [3, 7, 14, 30]
                      const next = milestones.find(m => m > streakDays) || 30
                      const prev = milestones.filter(m => m <= streakDays).pop() || 0
                      const pct = Math.min(((streakDays - prev) / (next - prev)) * 100, 100)
                      return (
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#fb923c,#f97316)' }} />
                      )
                    })()}
                  </div>
                  <span className="text-[9px] font-bold leading-none text-white/50">
                    {streakDays >= 30 ? 'Pro!' : streakDays >= 14 ? 'Xuất sắc' : streakDays >= 7 ? 'Tuyệt!' : streakDays >= 3 ? 'Cố lên' : 'ngày'}
                  </span>
                </div>
              </div>

              {/* Sticker */}
              <button
                onClick={() => setShowReward(true)}
                className="flex items-center gap-2 rounded-xl px-2.5 py-2 shrink-0 transition-all duration-300 bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg cursor-pointer hover:scale-105 active:scale-95">
                <span className="text-2xl select-none leading-none"
                  style={{ filter: 'drop-shadow(0 0 6px rgba(255,220,0,0.9))', display: 'inline-block', animation: 'sticker-float 2.5s ease-in-out infinite' }}>
                  🏆
                </span>
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-baseline gap-0.5 leading-none">
                    <span className="text-white font-black text-lg">{stickerCount}</span>
                    <span className="text-white/70 text-[10px]">/{stickerThreshold}</span>
                  </div>
                  <div className="w-12 h-1.5 bg-white/25 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min((stickerCount / stickerThreshold) * 100, 100)}%`,
                        background: 'linear-gradient(90deg,#fde68a,white)'
                      }} />
                  </div>
                  <span className="text-[9px] font-bold leading-none text-white/80">
                    🎁 Đổi quà
                  </span>
                </div>
              </button>

              {/* Thành tích */}
              <button
                onClick={() => { setShowAchievements(true); setRewardNotif(false) }}
                className="relative flex flex-col items-center justify-center gap-0.5 rounded-xl px-2.5 py-2 shrink-0 bg-white/15 hover:bg-white/25 transition-all hover:scale-105 active:scale-95">
                {rewardNotif && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 border-2 border-[#0055bb]" />
                )}
                <Trophy size={20} className="text-yellow-300" />
                <span className="text-[9px] font-bold leading-none text-white/80">Thành tích</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ② Topic cards — cố định */}
      <div className="shrink-0 bg-white border-b border-gray-100 shadow-sm">
        <TopicCards
          topicKeys={topicChips}
          lessons={lessons}
          progressMap={progressMap}
          grouped={grouped}
          selected={selectedTopic}
          onSelect={k => setSelectedTopic(k)}
        />
      </div>

      {/* ③ Unit cards — CHỈ phần này cuộn */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {/* Legend */}
        <div className="max-w-2xl mx-auto px-4 pt-3 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <div className="w-3.5 h-3.5 rounded-full" style={{ background: 'linear-gradient(135deg,#f472b6,#db2777)' }} /> Hoàn thành / Đang học
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <div className="w-3.5 h-3.5 rounded-full border-2 border-dashed border-pink-400" style={{ background: 'rgba(244,114,182,0.3)' }} /> Chưa học
          </div>
        </div>

        <LearningMap
          groups={groups}
          progressMap={progressMap}
          navigate={navigate}
          allLessonsCount={displayedLessons.length}
          completedCount={displayedLessons.filter(l => progressMap[l.id]?.completed).length}
        />
      </div>

      {/* Khung chat mascot — nổi góc phải dưới */}
      {nudge && nudgeOpen && (
        <div className="fixed bottom-4 right-4 z-50 w-[min(94vw,370px)]">
          <div className="bg-white rounded-3xl shadow-2xl border-2 border-violet-200 overflow-hidden flex flex-col" style={{ height: 'min(78vh, 560px)' }}>
            {/* Header */}
            <div className="flex items-center gap-2.5 bg-gradient-to-r from-violet-500 to-indigo-500 px-4 py-3 text-white shrink-0">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-2xl animate-bounce select-none" style={{ animationDuration: '2.5s' }}>
                🤖
              </div>
              <div className="flex-1 min-w-0 leading-tight">
                <div className="font-black text-sm">Trợ lý học tập</div>
                <div className="text-white/80 text-[11px]">hỏi bài, hỏi chương trình, cách dùng app...</div>
              </div>
              <button onClick={closeNudge} className="w-7 h-7 rounded-full hover:bg-white/20 flex items-center justify-center" title="Thu gọn">
                <X size={16} />
              </button>
            </div>

            {/* Hội thoại */}
            <div className="flex-1 overflow-y-auto px-4 py-3 bg-gray-50/50 space-y-3">
              {/* Lời chào + chọn bài */}
              <div className="bg-white border border-violet-100 rounded-2xl rounded-tl-md px-3.5 py-3 shadow-sm">
                <div className="font-black text-indigo-800 text-[15px] leading-tight">{nudge.greeting}</div>
                <p className="text-sm text-gray-600 mt-0.5 leading-snug">{nudge.message}</p>
                {nudge.items.length > 0 && (
                  <div className="mt-2.5 space-y-1.5">
                    {nudge.items.map(it => (
                      <button
                        key={it.id}
                        onClick={() => navigate(`/student/learn/${it.id}`)}
                        className="w-full flex items-center gap-2 text-left bg-violet-50 hover:bg-violet-100 border border-violet-100 rounded-xl px-2.5 py-2 transition group"
                      >
                        <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform">
                          <ChevronRight size={14} />
                        </span>
                        <span className="flex-1 min-w-0 text-[13px] font-bold text-violet-800 truncate">{it.title}</span>
                      </button>
                    ))}
                    {nudge.more > 0 && <p className="text-xs text-gray-400 pt-0.5">…và {nudge.more} bài khác ở danh sách</p>}
                  </div>
                )}
              </div>

              {/* Tin nhắn hội thoại */}
              {chatMsgs.map((m, i) => {
                const isAi = m.role === 'ai'
                const parsed = isAi ? parseLessonLinks(m.content) : null
                return (
                  <div key={i} className={`flex ${isAi ? 'justify-start' : 'justify-end'}`}>
                    {isAi && (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white shrink-0 mr-2 mt-auto mb-0.5">
                        <Sparkles size={13} />
                      </div>
                    )}
                    {isAi ? (
                      <div className="max-w-[82%] flex flex-col gap-1.5 items-start">
                        {parsed.text && (
                          <div className="px-3.5 py-2 rounded-2xl rounded-bl-md text-sm leading-relaxed whitespace-pre-wrap bg-white text-gray-800 border border-indigo-100 shadow-sm">
                            {parsed.text}
                          </div>
                        )}
                        {parsed.buttons.map(b => (
                          <button
                            key={b.id}
                            onClick={() => navigate(`/student/learn/${b.id}`)}
                            className="w-full flex items-center gap-2 text-left bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded-xl px-2.5 py-2 transition group"
                          >
                            <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform">
                              <ChevronRight size={14} />
                            </span>
                            <span className="flex-1 min-w-0 text-[13px] font-bold text-violet-800 truncate">Vào học: {b.title}</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="max-w-[82%] px-3.5 py-2 rounded-2xl rounded-br-md text-sm leading-relaxed whitespace-pre-wrap bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow">
                        {m.content}
                      </div>
                    )}
                  </div>
                )
              })}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white shrink-0 mr-2">
                    <Sparkles size={13} />
                  </div>
                  <div className="bg-white border border-indigo-100 rounded-2xl rounded-bl-md px-4 py-2.5 shadow-sm">
                    <Loader2 size={15} className="animate-spin text-indigo-400" />
                  </div>
                </div>
              )}

              {/* Gợi ý câu hỏi (chỉ khi chưa chat) */}
              {chatMsgs.length === 0 && !chatLoading && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {['Khóa này học những gì?', 'Làm sao nộp bài?', 'Sticker để làm gì?'].map(s => (
                    <button
                      key={s}
                      onClick={() => { setChatInput(s); setTimeout(sendChat, 0) }}
                      className="text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-full px-3 py-1.5 transition"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Ô nhập */}
            <div className="border-t border-gray-200 bg-white px-3 py-2.5 flex gap-2 items-end shrink-0">
              <textarea
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat() } }}
                disabled={chatLoading}
                rows={1}
                placeholder="Hỏi trợ lý bất cứ điều gì..."
                className="flex-1 border border-gray-200 rounded-2xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50 resize-none max-h-20"
              />
              <button
                onClick={sendChat}
                disabled={!chatInput.trim() || chatLoading}
                className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white transition hover:scale-105 active:scale-95 disabled:opacity-40 disabled:scale-100 shadow shrink-0"
              >
                {chatLoading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Nút nổi mở lại khung chat (khi đã thu gọn) */}
      {nudge && !nudgeOpen && (
        <button
          onClick={() => setNudgeOpen(true)}
          className="fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 shadow-xl flex items-center justify-center text-3xl select-none hover:scale-110 active:scale-95 transition-transform animate-bounce"
          style={{ animationDuration: '2.5s' }}
          title="Trợ lý học tập"
        >
          🤖
          {nudge.badge > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-rose-500 text-white text-[11px] font-bold flex items-center justify-center border-2 border-white">
              {nudge.badge}
            </span>
          )}
        </button>
      )}
    </div>
  )
}
