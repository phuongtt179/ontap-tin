import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { useSelectedGrade } from '../../hooks/useEnrollments'
import { BookOpen, CheckCircle, PlayCircle, Clock, FileText, ChevronRight, ChevronDown, Zap } from 'lucide-react'

function getProgress(lesson, progress) {
  const hasVideo = !!lesson.video_url
  const hasQuiz = lesson.question_ids?.length > 0
  const hasPractice = lesson.has_practice
  const videoOk = !hasVideo || progress?.video_watched
  const quizOk = !hasQuiz || progress?.quiz_passed
  const practiceOk = !hasPractice || progress?.practice_submitted
  const total = [hasVideo, hasQuiz, hasPractice].filter(Boolean).length
  const done = [videoOk && hasVideo, quizOk && hasQuiz, practiceOk && hasPractice].filter(Boolean).length
  return { videoOk, quizOk, practiceOk, total, done, completed: progress?.completed }
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

export default function LearnPage() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const { grades, selectedGrade, setSelectedGrade, loading: enrollLoading } = useSelectedGrade(user?.id)
  const [lessons, setLessons] = useState([])
  const [topics, setTopics] = useState([])
  const [units, setUnits] = useState([])
  const [progressMap, setProgressMap] = useState({})
  const [loading, setLoading] = useState(false)
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [selectedUnit, setSelectedUnit] = useState(null)
  const [expandedTopics, setExpandedTopics] = useState({})
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const touchStartX = { current: 0 }

  useEffect(() => {
    if (selectedGrade && user) { setSelectedTopic(null); setSelectedUnit(null); setExpandedTopics({}); loadData() }
  }, [selectedGrade, user?.id])

  async function loadData() {
    setLoading(true)
    const [{ data: topicsData }, { data: lessonsData }, { data: progressData }, { data: unitsData }] = await Promise.all([
      supabase.from('topics').select('*').in('grade', [selectedGrade, 'all']),
      supabase.from('lessons').select('*').eq('is_published', true).eq('grade', selectedGrade).order('order', { ascending: true }),
      supabase.from('lesson_progress').select('*').eq('user_id', user.id),
      supabase.from('units').select('*').eq('grade', selectedGrade).order('sort_order').order('name'),
    ])
    const list = lessonsData || []
    setLessons(list)
    setUnits(unitsData || [])
    const sortedTopics = (topicsData || []).sort((a, b) => a.name.localeCompare(b.name, 'vi', { numeric: true }))
    setTopics(sortedTopics)
    const map = {}
    ;(progressData || []).forEach(p => { map[p.lesson_id] = p })
    setProgressMap(map)
    const firstTopic = sortedTopics[0]?.name || list[0]?.topic || null
    setSelectedTopic(firstTopic)
    if (firstTopic) setExpandedTopics({ [firstTopic]: true })
    setLoading(false)
  }

  const grouped = {}
  ;(lessons || []).forEach(lesson => {
    const key = lesson.topic || '__no_topic__'
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(lesson)
  })

  const topicList = topics.map(t => t.name)
  ;(lessons || []).forEach(lesson => {
    const key = lesson.topic || '__no_topic__'
    if (!topicList.includes(key)) topicList.push(key)
  })

  const unitsByTopic = useMemo(() => {
    const map = {}
    units.forEach(u => {
      if (!map[u.topic]) map[u.topic] = []
      map[u.topic].push(u)
    })
    return map
  }, [units])

  const countByUnit = useMemo(() => {
    const map = {}
    lessons.forEach(l => { if (l.unit_id) map[l.unit_id] = (map[l.unit_id] || 0) + 1 })
    return map
  }, [lessons])

  // Stats
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

  let selectedLessons = selectedTopic ? (grouped[selectedTopic] || []) : []
  if (selectedUnit) selectedLessons = selectedLessons.filter(l => l.unit_id === selectedUnit.id)

  const selectedLabel = selectedUnit
    ? selectedUnit.name
    : (selectedTopic === '__no_topic__' ? 'Chưa phân loại' : selectedTopic)

  function handleTopicClick(topicKey) {
    if (selectedTopic === topicKey) {
      setExpandedTopics(prev => ({ ...prev, [topicKey]: !prev[topicKey] }))
    } else {
      setSelectedTopic(topicKey)
      setSelectedUnit(null)
      setExpandedTopics(prev => ({ ...prev, [topicKey]: true }))
    }
  }

  function handleUnitClick(topic, unit) {
    setSelectedTopic(topic)
    setSelectedUnit(prev => prev?.id === unit.id ? null : unit)
  }

  function TopicList({ onSelect }) {
    return (
      <div className="py-2 px-2 space-y-0.5">
        {topicList.map(topicKey => {
          const label = topicKey === '__no_topic__' ? 'Chưa phân loại' : topicKey
          const count = (grouped[topicKey] || []).length
          const topicActive = selectedTopic === topicKey && !selectedUnit
          const isExpanded = !!expandedTopics[topicKey]
          const topicUnits = unitsByTopic[topicKey] || []

          return (
            <div key={topicKey}>
              <button
                onClick={() => { handleTopicClick(topicKey); onSelect?.() }}
                className={`w-full flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-left text-sm transition
                  ${topicActive
                    ? 'bg-white text-blue-700 font-semibold shadow-sm'
                    : 'text-blue-100 hover:bg-white/10'}`}
              >
                {topicUnits.length > 0 ? (
                  isExpanded
                    ? <ChevronDown size={13} className="shrink-0 opacity-70" />
                    : <ChevronRight size={13} className="shrink-0 opacity-70" />
                ) : <span className="w-[13px] shrink-0" />}
                <span className="flex-1 line-clamp-2 leading-snug text-xs">{label}</span>
                <span className={`text-xs shrink-0 px-1.5 py-0.5 rounded-full font-medium
                  ${topicActive ? 'bg-blue-100 text-blue-700' : 'bg-white/20 text-white'}`}>
                  {count}
                </span>
              </button>

              {isExpanded && topicUnits.length > 0 && (
                <div className="ml-4 mt-0.5 space-y-0.5 border-l-2 border-white/20 pl-2">
                  {topicUnits.map(u => {
                    const uCount = countByUnit[u.id] || 0
                    const uActive = selectedUnit?.id === u.id
                    return (
                      <button
                        key={u.id}
                        onClick={() => { handleUnitClick(topicKey, u); onSelect?.() }}
                        className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left text-xs transition
                          ${uActive ? 'bg-white text-blue-700 font-semibold' : 'text-blue-200 hover:bg-white/10'}`}
                      >
                        <BookOpen size={11} className="shrink-0 opacity-70" />
                        <span className="flex-1 leading-tight line-clamp-2">{u.name}</span>
                        <span className={`shrink-0 text-xs px-1 py-0.5 rounded-full
                          ${uActive ? 'bg-blue-100 text-blue-600' : 'bg-white/20 text-white'}`}>
                          {uCount}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div
      className="flex md:flex-row h-full min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50"
      onTouchStart={e => { touchStartX.current = e.touches[0].clientX }}
      onTouchEnd={e => {
        const dx = e.changedTouches[0].clientX - touchStartX.current
        if (dx > 60 && touchStartX.current < 40) setMobileSidebarOpen(true)
        if (dx < -60) setMobileSidebarOpen(false)
      }}
    >
      {/* Mobile backdrop */}
      {mobileSidebarOpen && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-30" onClick={() => setMobileSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`
        fixed md:static top-0 left-0 h-full z-40 md:z-auto
        w-72 flex flex-col shrink-0
        bg-gradient-to-b from-[#003d8f] to-[#0066cc]
        transition-transform duration-300 ease-in-out
        ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        md:overflow-y-auto
      `}>
        {/* Logo */}
        <div className="px-4 py-4 border-b border-white/20">
          <div className="flex items-center gap-3">
            {/* Logo image — đặt file logo-bnp.png vào thư mục public/ */}
            <div className="w-10 h-10 shrink-0">
              <img src="/logo-bnp.png" alt="BNP" className="w-10 h-10 object-contain rounded-lg"
                onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }} />
              <div className="w-10 h-10 bg-white rounded-lg items-center justify-center hidden">
                <span className="text-blue-700 font-black text-xs">BNP</span>
              </div>
            </div>
            <div>
              <div className="text-white font-bold text-sm leading-tight">Lập Trình Sáng Tạo</div>
              <div className="text-blue-200 text-xs font-medium">BNP</div>
            </div>
          </div>

          {/* Grade selector */}
          {grades.length > 1 ? (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {grades.map(g => (
                <button key={g} onClick={() => setSelectedGrade(g)}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold transition
                    ${selectedGrade === g
                      ? 'bg-white text-blue-700'
                      : 'bg-white/20 text-white hover:bg-white/30'}`}
                >{g}</button>
              ))}
            </div>
          ) : (
            <div className="mt-2 inline-block bg-white/20 text-white text-xs px-2.5 py-1 rounded-full font-medium">
              {selectedGrade}
            </div>
          )}
        </div>

        {/* Student info */}
        <div className="px-4 py-3 border-b border-white/10">
          <p className="text-blue-200 text-xs">Học sinh</p>
          <p className="text-white font-semibold text-sm truncate">{profile?.full_name || 'Học sinh'}</p>
          {totalLessons > 0 && (
            <div className="mt-2">
              <div className="flex justify-between text-xs text-blue-200 mb-1">
                <span>Tiến độ</span>
                <span>{completedLessons}/{totalLessons} bài</span>
              </div>
              <div className="h-1.5 bg-white/20 rounded-full">
                <div
                  className="h-1.5 bg-yellow-400 rounded-full transition-all"
                  style={{ width: `${totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Topic list */}
        <div className="flex-1 overflow-y-auto">
          <p className="text-blue-300 text-xs font-semibold uppercase tracking-wider px-4 pt-3 pb-1">Chủ đề</p>
          <TopicList onSelect={() => setMobileSidebarOpen(false)} />
        </div>

        <button className="md:hidden absolute top-4 right-4 text-white/70 hover:text-white"
          onClick={() => setMobileSidebarOpen(false)}>✕</button>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-[#003d8f] to-[#0066cc] sticky top-0 z-20">
          <button onClick={() => setMobileSidebarOpen(true)}
            className="text-white/80 hover:text-white">
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round"/>
            </svg>
          </button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <img src="/logo-bnp.png" alt="BNP" className="w-6 h-6 object-contain rounded"
              onError={e => { e.target.style.display='none' }} />
            <span className="text-white font-bold text-sm truncate">{selectedLabel || 'Học tập'}</span>
          </div>
        </div>

        <div className="p-4 md:p-6 max-w-4xl mx-auto">
          {/* Hero banner */}
          <div className="hidden md:block bg-gradient-to-r from-[#003d8f] via-[#0055bb] to-[#0077dd] rounded-2xl p-6 mb-6 text-white shadow-lg relative overflow-hidden">
            <div className="absolute right-6 top-1/2 -translate-y-1/2 text-8xl opacity-10 select-none">💻</div>
            <p className="text-blue-200 text-sm mb-1">Xin chào 👋</p>
            <h2 className="text-2xl font-bold">{profile?.full_name || 'Học sinh'}</h2>
            <p className="text-blue-100 text-sm mt-1">Khoá học: <span className="font-semibold text-white">{selectedGrade}</span></p>
            {totalLessons > 0 && (
              <div className="mt-4 flex items-center gap-4">
                <div className="flex items-center gap-2 bg-white/15 rounded-xl px-4 py-2">
                  <CheckCircle size={16} className="text-yellow-300" />
                  <span className="text-sm font-semibold">{completedLessons}/{totalLessons} bài hoàn thành</span>
                </div>
                {completedLessons > 0 && (
                  <div className="flex items-center gap-2 bg-white/15 rounded-xl px-4 py-2">
                    <Zap size={16} className="text-yellow-300" />
                    <span className="text-sm font-semibold">{Math.round((completedLessons / totalLessons) * 100)}% tiến độ</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section title */}
          <div className="flex items-center gap-2 mb-4">
            {selectedUnit && (
              <span className="text-sm text-blue-400 font-medium">{selectedTopic === '__no_topic__' ? 'Chưa phân loại' : selectedTopic} /</span>
            )}
            <h3 className="text-lg font-bold text-gray-800">{selectedLabel}</h3>
            <span className="ml-auto text-sm text-gray-400">{selectedLessons.length} bài học</span>
          </div>

          {/* Lesson grid */}
          {selectedLessons.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📖</div>
              <p className="text-gray-500 font-medium">Chưa có bài học nào</p>
              <p className="text-gray-400 text-sm mt-1">Giáo viên chưa xuất bản bài học cho mục này</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {selectedLessons.map((lesson, idx) => {
                const prog = progressMap[lesson.id]
                const { videoOk, quizOk, practiceOk, total, done, completed } = getProgress(lesson, prog)
                const hasVideo = !!lesson.video_url
                const hasQuiz = lesson.question_ids?.length > 0
                const hasPractice = lesson.has_practice
                const inProgress = done > 0 && !completed
                const emoji = getLessonEmoji(lesson)

                const headerBg = completed
                  ? 'from-emerald-400 to-green-500'
                  : inProgress
                    ? 'from-orange-400 to-amber-500'
                    : 'from-[#0066CC] to-[#00AAFF]'

                return (
                  <div
                    key={lesson.id}
                    onClick={() => navigate(`/student/learn/${lesson.id}`)}
                    className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer group border border-blue-100 hover:border-blue-300 hover:-translate-y-0.5"
                  >
                    {/* Card header */}
                    <div className={`bg-gradient-to-br ${headerBg} h-28 flex items-center justify-between px-4 relative`}>
                      <span className="text-5xl group-hover:scale-110 transition-transform duration-200 select-none">
                        {emoji}
                      </span>
                      <div className="flex flex-col items-end gap-1.5">
                        <span className="bg-white/25 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                          #{idx + 1}
                        </span>
                        {completed && (
                          <span className="bg-white text-emerald-600 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle size={10} /> Hoàn thành
                          </span>
                        )}
                        {inProgress && !completed && (
                          <span className="bg-white text-orange-600 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Clock size={10} /> Đang học
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card body */}
                    <div className="p-4">
                      <h3 className="font-bold text-gray-800 leading-snug line-clamp-2 text-sm group-hover:text-blue-700 transition-colors">
                        {lesson.title}
                      </h3>
                      {lesson.description && (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-1">{lesson.description}</p>
                      )}

                      {/* Tags */}
                      <div className="flex gap-1.5 mt-2 flex-wrap">
                        {hasVideo && (
                          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                            📹 Video
                          </span>
                        )}
                        {hasQuiz && (
                          <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full font-medium">
                            📝 {lesson.question_ids.length} câu
                          </span>
                        )}
                        {hasPractice && (
                          <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full font-medium">
                            🎯 Thực hành
                          </span>
                        )}
                      </div>

                      {/* Progress bar */}
                      {total > 0 && (
                        <div className="mt-3">
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full transition-all duration-500 ${completed ? 'bg-emerald-500' : 'bg-blue-500'}`}
                              style={{ width: `${(done / total) * 100}%` }}
                            />
                          </div>
                          <div className="flex justify-between mt-1">
                            <span className="text-xs text-gray-400">{done}/{total} bước</span>
                            {hasQuiz && prog?.quiz_correct != null && (
                              <span className="text-xs text-gray-400">{prog.quiz_correct}/{prog.quiz_total ?? lesson.question_ids.length} câu đúng</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
