import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { useSelectedGrade } from '../../hooks/useEnrollments'
import { CheckCircle, Clock, Zap, ChevronLeft, ChevronRight } from 'lucide-react'

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
  if (t.includes('backdrop') || t.includes('cảnh nền')) return '🌄'
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

function ChipRow({ items, selected, onSelect, getLabel, getKey, getCount }) {
  const ref = useRef(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(false)

  function checkScroll() {
    const el = ref.current
    if (!el) return
    setCanLeft(el.scrollLeft > 4)
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }

  useEffect(() => {
    checkScroll()
    const el = ref.current
    if (!el) return
    el.addEventListener('scroll', checkScroll, { passive: true })
    return () => el.removeEventListener('scroll', checkScroll)
  }, [items])

  function scroll(dir) {
    ref.current?.scrollBy({ left: dir * 200, behavior: 'smooth' })
  }

  return (
    <div className="relative flex items-center gap-1">
      {canLeft && (
        <button onClick={() => scroll(-1)}
          className="shrink-0 w-7 h-7 rounded-full bg-white shadow border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 z-10">
          <ChevronLeft size={14} />
        </button>
      )}
      <div ref={ref}
        className="flex gap-2 overflow-x-auto scroll-smooth pb-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {items.map(item => {
          const key = getKey(item)
          const label = getLabel(item)
          const count = getCount?.(item)
          const active = selected === key
          return (
            <button key={key} onClick={() => onSelect(key)}
              className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap
                ${active
                  ? 'bg-[#0066CC] text-white shadow-md shadow-blue-200'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:text-blue-600'}`}>
              {label}
              {count != null && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold
                  ${active ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-400'}`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>
      {canRight && (
        <button onClick={() => scroll(1)}
          className="shrink-0 w-7 h-7 rounded-full bg-white shadow border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 z-10">
          <ChevronRight size={14} />
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
  const [selectedUnit, setSelectedUnit] = useState('__all__')

  useEffect(() => {
    if (selectedGrade && user) {
      setSelectedTopic('__all__')
      setSelectedUnit('__all__')
      loadData()
    }
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

  // Group by topic
  const grouped = useMemo(() => {
    const g = {}
    lessons.forEach(l => {
      const k = l.topic || '__no_topic__'
      if (!g[k]) g[k] = []
      g[k].push(l)
    })
    return g
  }, [lessons])

  // Topic chips list
  const topicChips = useMemo(() => {
    const fromDB = topics.map(t => t.name)
    lessons.forEach(l => {
      const k = l.topic || '__no_topic__'
      if (!fromDB.includes(k)) fromDB.push(k)
    })
    return fromDB
  }, [topics, lessons])

  // Units for selected topic
  const unitsByTopic = useMemo(() => {
    const map = {}
    units.forEach(u => {
      if (!map[u.topic]) map[u.topic] = []
      map[u.topic].push(u)
    })
    return map
  }, [units])

  const currentUnits = selectedTopic !== '__all__' ? (unitsByTopic[selectedTopic] || []) : []

  const countByUnit = useMemo(() => {
    const map = {}
    lessons.forEach(l => { if (l.unit_id) map[l.unit_id] = (map[l.unit_id] || 0) + 1 })
    return map
  }, [lessons])

  // Filtered lessons
  const displayedLessons = useMemo(() => {
    let list = lessons
    if (selectedTopic !== '__all__') list = list.filter(l => (l.topic || '__no_topic__') === selectedTopic)
    if (selectedUnit !== '__all__') list = list.filter(l => l.unit_id === selectedUnit)
    return list
  }, [lessons, selectedTopic, selectedUnit])

  const totalLessons = lessons.length
  const completedLessons = lessons.filter(l => progressMap[l.id]?.completed).length

  function handleTopicSelect(key) {
    setSelectedTopic(key)
    setSelectedUnit('__all__')
  }

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
      {/* Hero banner */}
      <div className="bg-gradient-to-r from-[#003d8f] via-[#0055bb] to-[#0077dd] text-white px-5 py-5 md:px-8 md:py-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 flex items-center pr-6 opacity-10 select-none pointer-events-none text-9xl">
          💻
        </div>
        <div className="relative max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <img src="/logo-bnp.png" alt="BNP" className="w-8 h-8 object-contain rounded-lg hidden md:block"
              onError={e => { e.target.style.display = 'none' }} />
            <p className="text-blue-200 text-sm">Xin chào 👋</p>
          </div>
          <h2 className="text-xl md:text-2xl font-bold">{profile?.full_name || 'Học sinh'}</h2>

          <div className="flex items-center gap-3 mt-3 flex-wrap">
            {/* Grade pills */}
            {grades.map(g => (
              <button key={g} onClick={() => setSelectedGrade(g)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition
                  ${selectedGrade === g ? 'bg-white text-blue-700' : 'bg-white/20 text-white hover:bg-white/30'}`}>
                {g}
              </button>
            ))}
            {totalLessons > 0 && (
              <>
                <div className="flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1">
                  <CheckCircle size={13} className="text-yellow-300" />
                  <span className="text-xs font-semibold">{completedLessons}/{totalLessons} bài</span>
                </div>
                {completedLessons > 0 && (
                  <div className="flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1">
                    <Zap size={13} className="text-yellow-300" />
                    <span className="text-xs font-semibold">{Math.round((completedLessons / totalLessons) * 100)}%</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 space-y-2">
          {/* Topic chips */}
          <ChipRow
            items={['__all__', ...topicChips]}
            selected={selectedTopic}
            onSelect={handleTopicSelect}
            getKey={k => k}
            getLabel={k => k === '__all__' ? '🏠 Tất cả' : (k === '__no_topic__' ? 'Chưa phân loại' : k)}
            getCount={k => {
              if (k === '__all__') return lessons.length
              return (grouped[k] || []).length
            }}
          />

          {/* Unit chips — only when topic selected and has units */}
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

      {/* Cards */}
      <div className="max-w-4xl mx-auto px-4 py-5">
        {displayedLessons.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📖</div>
            <p className="text-gray-500 font-medium">Chưa có bài học nào</p>
            <p className="text-gray-400 text-sm mt-1">Giáo viên chưa xuất bản bài học cho mục này</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-400 mb-3">{displayedLessons.length} bài học</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              {displayedLessons.map((lesson, idx) => {
                const prog = progressMap[lesson.id]
                const { total, done, completed } = getProgress(lesson, prog)
                const inProgress = done > 0 && !completed
                const emoji = getLessonEmoji(lesson)

                const headerBg = completed
                  ? 'from-emerald-400 to-green-500'
                  : inProgress
                    ? 'from-orange-400 to-amber-500'
                    : 'from-[#0066CC] to-[#00AAFF]'

                return (
                  <div key={lesson.id}
                    onClick={() => navigate(`/student/learn/${lesson.id}`)}
                    className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer group border border-blue-100 hover:border-blue-300 hover:-translate-y-0.5 active:scale-95">

                    {/* Card header */}
                    <div className={`bg-gradient-to-br ${headerBg} h-24 md:h-28 flex items-center justify-between px-3 md:px-4 relative`}>
                      <span className="text-4xl md:text-5xl group-hover:scale-110 transition-transform duration-200 select-none">
                        {emoji}
                      </span>
                      <div className="flex flex-col items-end gap-1">
                        <span className="bg-white/25 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                          #{idx + 1}
                        </span>
                        {completed && (
                          <span className="bg-white text-emerald-600 text-xs font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                            <CheckCircle size={9} /> Xong
                          </span>
                        )}
                        {inProgress && (
                          <span className="bg-white text-orange-500 text-xs font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                            <Clock size={9} /> Đang học
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card body */}
                    <div className="p-3 md:p-4">
                      <h3 className="font-bold text-gray-800 leading-snug line-clamp-2 text-xs md:text-sm group-hover:text-blue-700 transition-colors">
                        {lesson.title}
                      </h3>

                      {/* Tags */}
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {lesson.video_url && (
                          <span className="text-xs bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded-full">📹</span>
                        )}
                        {lesson.question_ids?.length > 0 && (
                          <span className="text-xs bg-purple-50 text-purple-500 px-1.5 py-0.5 rounded-full">
                            📝 {lesson.question_ids.length}
                          </span>
                        )}
                        {lesson.has_practice && (
                          <span className="text-xs bg-orange-50 text-orange-500 px-1.5 py-0.5 rounded-full">🎯</span>
                        )}
                      </div>

                      {/* Progress bar */}
                      {total > 0 && (
                        <div className="mt-2.5">
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full transition-all duration-500 ${completed ? 'bg-emerald-500' : 'bg-blue-500'}`}
                              style={{ width: `${(done / total) * 100}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-400 mt-1">{done}/{total} bước</p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
