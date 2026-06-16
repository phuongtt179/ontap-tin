import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { useSelectedGrade } from '../../hooks/useEnrollments'
import { CheckCircle, Zap, ChevronLeft, ChevronRight, Lock } from 'lucide-react'

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
  if (t.includes('glide') || t.includes('mượt')) return '🎯'
  return '💻'
}

const COLS = 4

function LearningMap({ lessons, progressMap, navigate, allCompletedCount }) {
  if (!lessons.length) return (
    <div className="text-center py-20">
      <div className="text-6xl mb-4">📖</div>
      <p className="text-gray-500 font-medium">Chưa có bài học nào</p>
    </div>
  )

  // Split into rows of COLS
  const rows = []
  for (let i = 0; i < lessons.length; i += COLS) {
    rows.push(lessons.slice(i, i + COLS))
  }

  // Find current (first in-progress or first not-started)
  const currentIdx = (() => {
    const inProg = lessons.findIndex(l => {
      const p = progressMap[l.id]
      return p && !p.completed
    })
    if (inProg !== -1) return inProg
    const notStarted = lessons.findIndex(l => !progressMap[l.id])
    return notStarted
  })()

  return (
    <div className="py-6 px-4 max-w-2xl mx-auto">
      {rows.map((row, rowIdx) => {
        const isLTR = rowIdx % 2 === 0
        const globalStart = rowIdx * COLS

        // For RTL rows, reverse display order
        const displayRow = isLTR ? row : [...row].reverse()

        return (
          <div key={rowIdx}>
            {/* Row of nodes */}
            <div className="flex items-start justify-between gap-1 md:gap-2">
              {displayRow.map((lesson, colIdx) => {
                // Real index in original (non-reversed) order
                const realColIdx = isLTR ? colIdx : (row.length - 1 - colIdx)
                const globalIdx = globalStart + realColIdx
                const prog = progressMap[lesson.id]
                const { total, done, completed } = getProgress(lesson, prog)
                const inProgress = done > 0 && !completed
                const isCurrent = globalIdx === currentIdx
                const isLastInRow = colIdx === displayRow.length - 1
                const emoji = getLessonEmoji(lesson)

                return (
                  <div key={lesson.id} className="flex items-center flex-1 min-w-0">
                    {/* Node */}
                    <button
                      onClick={() => navigate(`/student/learn/${lesson.id}`)}
                      className="flex flex-col items-center flex-none w-16 md:w-20 group"
                    >
                      {/* Circle */}
                      <div className={`relative w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center text-2xl md:text-3xl
                        border-4 shadow-md transition-all duration-200 group-hover:scale-110 group-active:scale-95
                        ${completed
                          ? 'border-emerald-400 bg-emerald-50 shadow-emerald-100'
                          : inProgress
                            ? 'border-blue-400 bg-blue-50 shadow-blue-200'
                            : isCurrent
                              ? 'border-orange-400 bg-orange-50 shadow-orange-100'
                              : 'border-gray-200 bg-white shadow-gray-100'
                        }
                        ${isCurrent ? 'ring-4 ring-orange-200 ring-offset-2' : ''}
                      `}>
                        <span className="select-none">
                          {completed ? '✅' : emoji}
                        </span>
                        {/* Number badge */}
                        <span className={`absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] font-black
                          flex items-center justify-center border-2 border-white
                          ${completed ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                          {globalIdx + 1}
                        </span>
                        {/* In-progress pulse */}
                        {(inProgress || isCurrent) && !completed && (
                          <span className="absolute inset-0 rounded-full border-4 border-blue-400 animate-ping opacity-30" />
                        )}
                      </div>

                      {/* Title */}
                      <p className={`text-center text-[10px] md:text-xs font-medium mt-1.5 leading-tight line-clamp-2 w-16 md:w-20
                        ${completed ? 'text-emerald-700' : inProgress || isCurrent ? 'text-blue-700' : 'text-gray-500'}`}>
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

                    {/* Horizontal connector (not after last node) */}
                    {!isLastInRow && (
                      <div className="flex-1 flex items-center justify-center px-1 pb-6">
                        <div className={`w-full h-1.5 rounded-full
                          ${completed && displayRow[colIdx + 1] && getProgress(displayRow[colIdx + 1], progressMap[displayRow[colIdx + 1].id]).completed
                            ? 'bg-emerald-300'
                            : 'bg-gray-200'}`}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Vertical connector between rows */}
            {rowIdx < rows.length - 1 && (
              <div className={`flex ${isLTR ? 'justify-end pr-6 md:pr-8' : 'justify-start pl-6 md:pl-8'}`}>
                <div className="flex flex-col items-center gap-0.5 py-1">
                  {[0,1,2,3].map(i => (
                    <div key={i} className="w-1.5 h-2 rounded-full bg-gray-200" />
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })}

      {/* Finish flag */}
      <div className="flex justify-center mt-4">
        <div className={`flex flex-col items-center gap-1 ${allCompletedCount === lessons.length ? 'opacity-100' : 'opacity-30'}`}>
          <div className="text-3xl">🏁</div>
          <p className="text-xs font-bold text-gray-500">HOÀN THÀNH!</p>
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

let completedLessons = 0 // module-level for LearningMap access

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
  const [selectedUnit, setSelectedUnit] = useState('__all__')

  useEffect(() => {
    if (selectedGrade && user) { setSelectedTopic('__all__'); setSelectedUnit('__all__'); loadData() }
  }, [selectedGrade, user?.id])

  async function loadData() {
    setLoading(true)
    const [{ data: topicsData }, { data: lessonsData }, { data: progressData }, { data: unitsData }] = await Promise.all([
      supabase.from('topics').select('*').in('grade', [selectedGrade, 'all']),
      supabase.from('lessons').select('*').eq('is_published', true).eq('grade', selectedGrade).order('order', { ascending: true }),
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

  const unitsByTopic = useMemo(() => {
    const map = {}
    units.forEach(u => { if (!map[u.topic]) map[u.topic] = []; map[u.topic].push(u) })
    return map
  }, [units])

  const countByUnit = useMemo(() => {
    const map = {}
    lessons.forEach(l => { if (l.unit_id) map[l.unit_id] = (map[l.unit_id] || 0) + 1 })
    return map
  }, [lessons])

  const currentUnits = selectedTopic !== '__all__' ? (unitsByTopic[selectedTopic] || []) : []

  const displayedLessons = useMemo(() => {
    let list = lessons
    if (selectedTopic !== '__all__') list = list.filter(l => (l.topic || '__no_topic__') === selectedTopic)
    if (selectedUnit !== '__all__') list = list.filter(l => l.unit_id === selectedUnit)
    return list
  }, [lessons, selectedTopic, selectedUnit])

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
            {completedLessons > 0 && (
              <div className="flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1">
                <Zap size={13} className="text-yellow-300" />
                <span className="text-xs font-semibold">{Math.round((completedLessons / totalLessons) * 100)}%</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter chips — sticky */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-2.5 space-y-2">
          <ChipRow
            items={['__all__', ...topicChips]}
            selected={selectedTopic}
            onSelect={k => { setSelectedTopic(k); setSelectedUnit('__all__') }}
            getKey={k => k}
            getLabel={k => k === '__all__' ? '🏠 Tất cả' : (k === '__no_topic__' ? 'Chưa phân loại' : k)}
            getCount={k => k === '__all__' ? lessons.length : (grouped[k] || []).length}
          />
          {selectedTopic !== '__all__' && currentUnits.length > 0 && (
            <ChipRow
              items={[{ id: '__all__', name: 'Tất cả bài' }, ...currentUnits]}
              selected={selectedUnit}
              onSelect={k => setSelectedUnit(k)}
              getKey={u => u.id}
              getLabel={u => u.name}
              getCount={u => u.id === '__all__' ? (grouped[selectedTopic] || []).length : (countByUnit[u.id] || 0)}
            />
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="max-w-2xl mx-auto px-4 pt-4 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <div className="w-4 h-4 rounded-full bg-emerald-100 border-2 border-emerald-400" /> Hoàn thành
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <div className="w-4 h-4 rounded-full bg-blue-50 border-2 border-blue-400" /> Đang học
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <div className="w-4 h-4 rounded-full bg-orange-50 border-2 border-orange-400 ring-2 ring-orange-200" /> Tiếp theo
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <div className="w-4 h-4 rounded-full bg-white border-2 border-gray-200" /> Chưa học
        </div>
      </div>

      {/* Learning Map */}
      <LearningMap
        lessons={displayedLessons}
        progressMap={progressMap}
        navigate={navigate}
        allCompletedCount={completedLessons}
      />
    </div>
  )
}
