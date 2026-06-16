import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { useSelectedGrade } from '../../hooks/useEnrollments'
import { CheckCircle, Zap, ChevronLeft, ChevronRight } from 'lucide-react'

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
  if (t.includes('scratch')) return '🐱'
  if (t.includes('python')) return '🐍'
  if (t.includes('game')) return '🎮'
  if (t.includes('animation') || t.includes('hoạt hình')) return '🎬'
  if (t.includes('âm thanh') || t.includes('sound')) return '🎵'
  if (t.includes('vòng lặp') || t.includes('loop')) return '🔁'
  if (t.includes('điều kiện') || t.includes('condition')) return '🔀'
  if (t.includes('event') || t.includes('sự kiện')) return '⚡'
  if (t.includes('sprite') || t.includes('nhân vật')) return '🦸'
  if (t.includes('backdrop') || t.includes('cảnh')) return '🌄'
  if (t.includes('chuyển động') || t.includes('motion')) return '🚀'
  if (t.includes('ngoại hình') || t.includes('looks')) return '👀'
  if (t.includes('cảm biến') || t.includes('sensing')) return '📡'
  if (t.includes('project') || t.includes('dự án')) return '🏆'
  if (t.includes('ôn tập') || t.includes('tổng hợp')) return '📚'
  if (t.includes('kiểm tra') || t.includes('luyện thi')) return '📋'
  if (t.includes('làm quen') || t.includes('giới thiệu')) return '👋'
  if (t.includes('broadcast')) return '📣'
  if (t.includes('glide') || t.includes('mượt')) return '🎯'
  return '💻'
}

const COLS = 4

// One node in the map
function LessonNode({ lesson, globalIdx, prog, navigate }) {
  const { total, done, completed } = getProgress(lesson, prog)
  const inProgress = done > 0 && !completed
  const emoji = getLessonEmoji(lesson)

  return (
    <button
      onClick={() => navigate(`/student/learn/${lesson.id}`)}
      className="flex flex-col items-center group w-14 md:w-16 shrink-0"
    >
      {/* Circle */}
      <div className={`relative w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center text-xl md:text-2xl
        border-[3px] shadow-sm transition-all duration-200 group-hover:scale-110 group-active:scale-95
        ${completed
          ? 'border-emerald-400 bg-emerald-50 shadow-emerald-100'
          : inProgress
            ? 'border-blue-400 bg-blue-50 shadow-blue-100'
            : 'border-gray-200 bg-white'
        }`}>
        <span className="select-none">{completed ? '✅' : emoji}</span>
        {/* Number badge */}
        <span className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-[9px] font-black
          flex items-center justify-center border-2 border-white shadow-sm
          ${completed ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
          {globalIdx + 1}
        </span>
        {/* Pulse ring when in progress */}
        {inProgress && (
          <span className="absolute inset-0 rounded-full border-4 border-blue-400 animate-ping opacity-20 pointer-events-none" />
        )}
      </div>

      {/* Title */}
      <p className={`text-[9px] md:text-[10px] text-center font-medium mt-1.5 leading-tight line-clamp-2
        w-14 md:w-16
        ${completed ? 'text-emerald-700' : inProgress ? 'text-blue-700' : 'text-gray-500'}`}>
        {lesson.title}
      </p>

      {/* Progress dots */}
      {total > 0 && (
        <div className="flex gap-0.5 mt-1">
          {Array.from({ length: total }).map((_, i) => (
            <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < done ? 'bg-blue-400' : 'bg-gray-200'}`} />
          ))}
        </div>
      )}
    </button>
  )
}

// Zigzag path for lessons in a unit
function UnitPath({ lessons, progressMap, navigate, globalStart }) {
  const rows = []
  for (let i = 0; i < lessons.length; i += COLS) {
    rows.push(lessons.slice(i, i + COLS))
  }

  // Find current lesson in this unit
  const currentLocalIdx = (() => {
    const ip = lessons.findIndex(l => { const p = progressMap[l.id]; return p && !p.completed })
    if (ip !== -1) return ip
    return lessons.findIndex(l => !progressMap[l.id])
  })()

  return (
    <div className="space-y-0">
      {rows.map((row, rowIdx) => {
        const isLTR = rowIdx % 2 === 0
        const displayRow = isLTR ? row : [...row].reverse()

        return (
          <div key={rowIdx}>
            {/* Node row */}
            <div className="flex items-start">
              {displayRow.map((lesson, colIdx) => {
                const realColIdx = isLTR ? colIdx : (row.length - 1 - colIdx)
                const localIdx = rowIdx * COLS + realColIdx
                const globalIdx = globalStart + localIdx
                const prog = progressMap[lesson.id]
                const isLastInRow = colIdx === displayRow.length - 1

                return (
                  <div key={lesson.id} className="flex items-center flex-1 min-w-0">
                    <LessonNode
                      lesson={lesson}
                      globalIdx={globalIdx}
                      prog={prog}
                      navigate={navigate}
                    />
                    {!isLastInRow && (
                      <div className="flex-1 h-1 mx-0.5 rounded-full min-w-[8px]">
                        <div className={`h-full rounded-full ${
                          prog?.completed && displayRow[colIdx + 1] && progressMap[displayRow[colIdx + 1].id]?.completed
                            ? 'bg-emerald-200' : 'bg-gray-200'
                        }`} />
                      </div>
                    )}
                  </div>
                )
              })}
              {/* Pad remaining columns if last row is short */}
              {row.length < COLS && Array.from({ length: COLS - row.length }).map((_, i) => (
                <div key={`pad-${i}`} className="flex-1" />
              ))}
            </div>

            {/* Vertical connector */}
            {rowIdx < rows.length - 1 && (
              <div className={`flex ${isLTR ? 'justify-end pr-5 md:pr-6' : 'justify-start pl-5 md:pl-6'}`}>
                <div className="flex flex-col gap-0.5 py-0.5">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-1 h-1.5 rounded-full bg-gray-200" />
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// One unit card
function UnitCard({ unit, lessons, progressMap, navigate, unitIndex, globalStart }) {
  const doneCount = lessons.filter(l => progressMap[l.id]?.completed).length
  const allDone = doneCount === lessons.length
  const anyStarted = doneCount > 0 || lessons.some(l => { const p = progressMap[l.id]; return p && !p.completed })

  return (
    <div className={`mx-3 md:mx-4 rounded-2xl border-2 overflow-hidden shadow-sm
      ${allDone
        ? 'border-emerald-200 bg-emerald-50/60'
        : anyStarted
          ? 'border-blue-100 bg-blue-50/40'
          : 'border-gray-100 bg-white'}`}>

      {/* Unit header */}
      <div className={`flex items-center gap-2.5 px-4 py-2.5 border-b
        ${allDone ? 'border-emerald-200 bg-emerald-100/60' : anyStarted ? 'border-blue-100 bg-blue-100/40' : 'border-gray-100 bg-gray-50'}`}>
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0
          ${allDone ? 'bg-emerald-500 text-white' : anyStarted ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
          {allDone ? '✓' : unitIndex + 1}
        </div>
        <span className={`font-bold text-sm flex-1 ${allDone ? 'text-emerald-800' : anyStarted ? 'text-blue-800' : 'text-gray-700'}`}>
          {unit?.name || 'Bài học'}
        </span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
          ${allDone ? 'bg-emerald-200 text-emerald-700' : anyStarted ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
          {doneCount}/{lessons.length}
        </span>
      </div>

      {/* Path */}
      <div className="p-3 md:p-4">
        <UnitPath
          lessons={lessons}
          progressMap={progressMap}
          navigate={navigate}
          globalStart={globalStart}
        />
      </div>
    </div>
  )
}

// Full learning map grouped by unit
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
          <div key={group.unit?.id || `__no_unit_${i}`}>
            <UnitCard
              unit={group.unit}
              lessons={group.lessons}
              progressMap={progressMap}
              navigate={navigate}
              unitIndex={i}
              globalStart={start}
            />
          </div>
        )
      })}

      {/* Finish flag */}
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

// Chip scroll row
function ChipRow({ items, selected, onSelect, getKey, getLabel, getCount }) {
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
  }, [items])

  return (
    <div className="relative flex items-center gap-1">
      {canLeft && (
        <button onClick={() => ref.current?.scrollBy({ left: -160, behavior: 'smooth' })}
          className="shrink-0 w-6 h-6 rounded-full bg-white shadow border border-gray-200 flex items-center justify-center text-gray-500">
          <ChevronLeft size={13} />
        </button>
      )}
      <div ref={ref} className="flex gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
        {items.map(item => {
          const key = getKey(item)
          const active = selected === key
          return (
            <button key={key} onClick={() => onSelect(key)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap
                ${active
                  ? 'bg-[#0066CC] text-white shadow-md shadow-blue-200'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:text-blue-600'}`}>
              {getLabel(item)}
              {getCount && (
                <span className={`text-[10px] px-1 py-0.5 rounded-full font-bold
                  ${active ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-400'}`}>
                  {getCount(item)}
                </span>
              )}
            </button>
          )
        })}
      </div>
      {canRight && (
        <button onClick={() => ref.current?.scrollBy({ left: 160, behavior: 'smooth' })}
          className="shrink-0 w-6 h-6 rounded-full bg-white shadow border border-gray-200 flex items-center justify-center text-gray-500">
          <ChevronRight size={13} />
        </button>
      )}
    </div>
  )
}

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

  useEffect(() => {
    if (selectedGrade && user) { setSelectedTopic('__all__'); loadData() }
  }, [selectedGrade, user?.id])

  async function loadData() {
    setLoading(true)
    const [{ data: topicsData }, { data: lessonsData }, { data: progressData }, { data: unitsData }] = await Promise.all([
      supabase.from('topics').select('*').in('grade', [selectedGrade, 'all']),
      supabase.from('lessons').select('*').eq('is_published', true).eq('grade', selectedGrade).order('order', { ascending: true }).order('created_at', { ascending: true }),
      supabase.from('lesson_progress').select('*').eq('user_id', user.id),
      supabase.from('units').select('*').eq('grade', selectedGrade).order('sort_order').order('name'),
    ])
    setLessons(lessonsData || [])
    setUnits(unitsData || [])
    setTopics((topicsData || []).sort((a, b) => a.name.localeCompare(b.name, 'vi', { numeric: true })))
    const map = {}
    ;(progressData || []).forEach(p => { map[p.lesson_id] = p })
    setProgressMap(map)
    setLoading(false)
  }

  // Group lessons by topic for chip counts
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

  // Filter lessons then group by unit
  const displayedLessons = useMemo(() => {
    if (selectedTopic === '__all__') return lessons
    return lessons.filter(l => (l.topic || '__no_topic__') === selectedTopic)
  }, [lessons, selectedTopic])

  const groups = useMemo(() => {
    // Gom tất cả lesson theo unit_id (không phụ thuộc thứ tự)
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
    // Sắp xếp nhóm theo sort_order của unit
    const result = units
      .filter(u => unitMap[u.id])
      .map(u => ({ unit: u, lessons: unitMap[u.id] }))
    if (noUnit.length) result.push({ unit: null, lessons: noUnit })
    return result
  }, [displayedLessons, units])

  const totalLessons = lessons.length
  const completedLessons = lessons.filter(l => progressMap[l.id]?.completed).length

  if (enrollLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-sky-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
          <p className="text-blue-600 text-sm font-medium">Đang tải...</p>
        </div>
      </div>
    )
  }

  if (grades.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-sky-100 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">📚</div>
          <p className="text-xl font-bold text-gray-700">Bạn chưa tham gia khoá học nào</p>
          <p className="text-gray-400 mt-2">Liên hệ giáo viên để được thêm vào khoá học</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-[#003d8f] via-[#0055bb] to-[#0077dd] text-white px-5 py-5 md:px-8 md:py-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 flex items-center pr-6 opacity-10 select-none pointer-events-none text-9xl">🗺️</div>
        <div className="relative max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-1">
            <img src="/logo-bnp.png" alt="BNP" className="w-7 h-7 object-contain rounded hidden md:block"
              onError={e => { e.target.style.display = 'none' }} />
            <p className="text-blue-200 text-sm">Bản đồ học tập 🗺️</p>
          </div>
          <h2 className="text-xl md:text-2xl font-bold">{profile?.full_name || 'Học sinh'}</h2>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {grades.map(g => (
              <button key={g} onClick={() => setSelectedGrade(g)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition
                  ${selectedGrade === g ? 'bg-white text-blue-700' : 'bg-white/20 text-white hover:bg-white/30'}`}>
                {g}
              </button>
            ))}
            {totalLessons > 0 && (
              <div className="flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1">
                <CheckCircle size={13} className="text-yellow-300" />
                <span className="text-xs font-semibold">{completedLessons}/{totalLessons} bài hoàn thành</span>
              </div>
            )}
            {totalLessons > 0 && (
              <div className="flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1">
                <Zap size={13} className="text-yellow-300" />
                <span className="text-xs font-semibold">{Math.round((completedLessons / totalLessons) * 100)}%</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Topic filter chips — sticky */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-2.5">
          <ChipRow
            items={['__all__', ...topicChips]}
            selected={selectedTopic}
            onSelect={k => setSelectedTopic(k)}
            getKey={k => k}
            getLabel={k => k === '__all__' ? '🏠 Tất cả' : (k === '__no_topic__' ? 'Chưa phân loại' : k)}
            getCount={k => k === '__all__' ? lessons.length : (grouped[k] || []).length}
          />
        </div>
      </div>

      {/* Legend */}
      <div className="max-w-2xl mx-auto px-4 pt-3 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <div className="w-3.5 h-3.5 rounded-full bg-emerald-100 border-2 border-emerald-400" /> Hoàn thành
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <div className="w-3.5 h-3.5 rounded-full bg-blue-50 border-2 border-blue-400" /> Đang học
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <div className="w-3.5 h-3.5 rounded-full bg-white border-2 border-gray-200" /> Chưa học
        </div>
      </div>

      {/* Map */}
      <LearningMap
        groups={groups}
        progressMap={progressMap}
        navigate={navigate}
        allLessonsCount={displayedLessons.length}
        completedCount={displayedLessons.filter(l => progressMap[l.id]?.completed).length}
      />
    </div>
  )
}
