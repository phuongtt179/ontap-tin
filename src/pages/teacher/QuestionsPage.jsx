import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import { useTopics } from '../../hooks/useTopics'
import { useGrades } from '../../hooks/useGrades'
import { useUnitsByGrade } from '../../hooks/useUnits'
import QuestionImportModal from '../../components/teacher/QuestionImportModal'
import QuestionCard from '../../components/teacher/QuestionCard'
import QuestionFormModal from '../../components/teacher/QuestionFormModal'
import QuizSession from '../../components/student/QuizSession'
import toast from 'react-hot-toast'
import { Upload, Plus, BookOpen, ChevronDown, ChevronRight, Play, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function QuestionsPage() {
  const { canDelete } = useAuth()
  const { topics, loading: topicsLoading } = useTopics()
  const { grades: GRADES } = useGrades()

  const [selectedGrade, setSelectedGrade] = useState('')
  const [selectedTopic, setSelectedTopic] = useState('')
  const [selectedUnit, setSelectedUnit] = useState(null) // null = tất cả, unit object = lọc theo bài
  const [expandedTopics, setExpandedTopics] = useState({}) // topicName → bool
  const [allQuestions, setAllQuestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [previewIds, setPreviewIds] = useState(new Set())
  const [showPreview, setShowPreview] = useState(false)

  const { units: gradeUnits } = useUnitsByGrade(selectedGrade)

  // Chọn mặc định khi tải xong
  useEffect(() => {
    if (GRADES.length > 0 && topics.length > 0 && !selectedGrade) {
      const g = GRADES[0]
      const t = topics.find(t => t.grade === g || t.grade === 'all')
      setSelectedGrade(g)
      if (t) {
        setSelectedTopic(t.name)
        setExpandedTopics({ [t.name]: true })
      }
    }
  }, [GRADES, topics])

  useEffect(() => { if (selectedGrade) fetchQuestions() }, [selectedGrade])

  async function fetchQuestions() {
    setLoading(true)
    const { data, error } = await supabase
      .from('questions')
      .select('*, units(id,name)')
      .eq('grade', selectedGrade)
      .order('created_at', { ascending: false })
    if (error) toast.error('Lỗi tải câu hỏi')
    else setAllQuestions(data || [])
    setLoading(false)
  }

  function handleGradeChange(grade) {
    setSelectedGrade(grade)
    const first = topics.find(t => t.grade === grade || t.grade === 'all')
    setSelectedTopic(first?.name || '')
    setSelectedUnit(null)
    setExpandedTopics(first ? { [first.name]: true } : {})
  }

  function handleTopicClick(topicName) {
    if (selectedTopic === topicName) {
      // toggle expand
      setExpandedTopics(prev => ({ ...prev, [topicName]: !prev[topicName] }))
    } else {
      setSelectedTopic(topicName)
      setSelectedUnit(null)
      setExpandedTopics(prev => ({ ...prev, [topicName]: true }))
    }
  }

  function handleUnitClick(unit) {
    setSelectedUnit(prev => prev?.id === unit.id ? null : unit)
  }

  const gradeTopics = useMemo(
    () => topics.filter(t => t.grade === selectedGrade || t.grade === 'all'),
    [topics, selectedGrade]
  )

  // units grouped by topic
  const unitsByTopic = useMemo(() => {
    const map = {}
    gradeUnits.forEach(u => {
      if (!map[u.topic]) map[u.topic] = []
      map[u.topic].push(u)
    })
    return map
  }, [gradeUnits])

  const countByTopic = useMemo(() => {
    const map = {}
    allQuestions.forEach(q => { map[q.topic] = (map[q.topic] || 0) + 1 })
    return map
  }, [allQuestions])

  const countByUnit = useMemo(() => {
    const map = {}
    allQuestions.forEach(q => {
      if (q.unit_id) map[q.unit_id] = (map[q.unit_id] || 0) + 1
    })
    return map
  }, [allQuestions])

  const displayedQuestions = useMemo(() => {
    let qs = allQuestions
    if (selectedTopic) qs = qs.filter(q => q.topic === selectedTopic)
    if (selectedUnit) qs = qs.filter(q => q.unit_id === selectedUnit.id)
    return qs
  }, [allQuestions, selectedTopic, selectedUnit])

  const previewQuestions = useMemo(
    () => allQuestions.filter(q => previewIds.has(q.id)),
    [allQuestions, previewIds]
  )

  function togglePreview(id) {
    setPreviewIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  async function handleDelete(id) {
    const { error } = await supabase.from('questions').delete().eq('id', id)
    if (error) toast.error('Xóa thất bại')
    else { toast.success('Đã xóa'); fetchQuestions() }
  }

  const panelTitle = selectedUnit
    ? selectedUnit.name
    : selectedTopic || 'Tất cả câu hỏi'

  return (
    <div className="flex h-full min-h-0">

      {/* ── Sidebar ─────────────────────────────── */}
      <aside className="w-64 shrink-0 bg-white border-r border-gray-200 flex flex-col min-h-0">
        {/* Grade selector */}
        <div className="px-4 pt-5 pb-4 border-b border-gray-100">
          <h1 className="text-lg font-bold text-gray-800 mb-3">Ngân hàng câu hỏi</h1>
          <select value={selectedGrade} onChange={e => handleGradeChange(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
            {GRADES.length === 0 && <option value="">-- Chọn khoá --</option>}
            {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        {/* Topic + Unit tree */}
        <nav className="flex-1 overflow-y-auto py-2 px-2">
          {topicsLoading ? (
            <div className="space-y-1 pt-1">
              {[1,2,3,4].map(i => <div key={i} className="h-9 bg-gray-100 rounded-lg animate-pulse" />)}
            </div>
          ) : gradeTopics.length === 0 ? (
            <p className="text-xs text-gray-400 text-center px-4 pt-6">Chưa có chủ đề nào</p>
          ) : (
            gradeTopics.map(t => {
              const topicCount = countByTopic[t.name] || 0
              const topicActive = selectedTopic === t.name && !selectedUnit
              const isExpanded = !!expandedTopics[t.name]
              const topicUnits = unitsByTopic[t.name] || []

              return (
                <div key={t.id} className="mb-0.5">
                  {/* Topic row */}
                  <button
                    onClick={() => handleTopicClick(t.name)}
                    className={`w-full flex items-center gap-1.5 px-2 py-2.5 rounded-lg text-left text-sm transition
                      ${topicActive
                        ? 'bg-indigo-600 text-white font-medium'
                        : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    {topicUnits.length > 0 ? (
                      isExpanded
                        ? <ChevronDown size={13} className="shrink-0 opacity-60" />
                        : <ChevronRight size={13} className="shrink-0 opacity-60" />
                    ) : <span className="w-[13px] shrink-0" />}
                    <span className="flex-1 leading-tight line-clamp-2 text-xs">{t.name}</span>
                    <span className={`shrink-0 text-xs px-1.5 py-0.5 rounded-full font-semibold
                      ${topicActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                      {loading ? '·' : topicCount}
                    </span>
                  </button>

                  {/* Unit rows (expanded) */}
                  {isExpanded && topicUnits.length > 0 && (
                    <div className="ml-4 mt-0.5 space-y-0.5 border-l-2 border-gray-100 pl-2">
                      {topicUnits.map(u => {
                        const uCount = countByUnit[u.id] || 0
                        const uActive = selectedUnit?.id === u.id
                        return (
                          <button
                            key={u.id}
                            onClick={() => { setSelectedTopic(t.name); handleUnitClick(u) }}
                            className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left text-xs transition
                              ${uActive
                                ? 'bg-indigo-100 text-indigo-800 font-medium'
                                : 'text-gray-600 hover:bg-gray-100'}`}
                          >
                            <BookOpen size={11} className="shrink-0 opacity-50" />
                            <span className="flex-1 leading-tight line-clamp-2">{u.name}</span>
                            <span className={`shrink-0 text-xs px-1 py-0.5 rounded-full
                              ${uActive ? 'bg-indigo-200 text-indigo-700' : 'bg-gray-100 text-gray-400'}`}>
                              {uCount}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </nav>
      </aside>

      {/* ── Main panel ──────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-0 bg-gray-50">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4 px-6 py-4 bg-white border-b border-gray-200 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {selectedUnit && (
                <span className="text-xs text-gray-400">{selectedTopic} /</span>
              )}
              <h2 className="font-semibold text-gray-800 truncate">{panelTitle}</h2>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              {loading ? '...' : `${displayedQuestions.length} câu hỏi`}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
              <Plus size={15} /> Tạo câu hỏi
            </button>
            <button onClick={() => setShowImport(true)}
              className="flex items-center gap-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium transition">
              <Upload size={15} /> Nhập
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
          ) : displayedQuestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
              <BookOpen size={40} className="mb-3 opacity-20" />
              <p className="text-sm">Chưa có câu hỏi nào</p>
              <button onClick={() => setShowCreate(true)}
                className="mt-3 text-sm text-indigo-500 hover:text-indigo-700 font-medium">
                + Tạo câu hỏi đầu tiên
              </button>
            </div>
          ) : (
            <div className="space-y-3 max-w-4xl">
              {displayedQuestions.map((q, i) => (
                <QuestionCard key={q.id} question={q} index={i + 1}
                  onDelete={canDelete ? () => handleDelete(q.id) : undefined}
                  onUpdate={fetchQuestions}
                  selected={previewIds.has(q.id)}
                  onSelect={() => togglePreview(q.id)} />
              ))}
            </div>
          )}
        </div>
      </div>

      {showCreate && (
        <QuestionFormModal
          defaultGrade={selectedGrade}
          defaultTopic={selectedTopic}
          defaultUnitId={selectedUnit?.id || null}
          onClose={() => setShowCreate(false)}
          onDone={() => { setShowCreate(false); fetchQuestions() }} />
      )}
      {showImport && (
        <QuestionImportModal
          onClose={() => setShowImport(false)}
          onSaved={() => { setShowImport(false); fetchQuestions() }}
          grades={GRADES}
          topics={topics}
          defaultGrade={selectedGrade}
          defaultTopic={selectedTopic}
          defaultUnitId={selectedUnit?.id || null} />
      )}

      {/* Floating preview bar */}
      {previewIds.size > 0 && !showPreview && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 bg-white border border-gray-200 shadow-2xl rounded-2xl px-5 py-3">
          <span className="text-sm font-medium text-gray-700">Đã chọn <strong>{previewIds.size}</strong> câu</span>
          <button onClick={() => setPreviewIds(new Set())}
            className="text-xs text-gray-400 hover:text-gray-600 underline">Bỏ chọn</button>
          <button onClick={() => setShowPreview(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition">
            <Play size={14} /> Chạy thử
          </button>
        </div>
      )}

      {/* Preview modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/70 z-50 flex flex-col">
          <div className="bg-white flex items-center justify-between px-6 py-3 border-b shrink-0">
            <div>
              <h2 className="font-bold text-gray-800">Chạy thử câu hỏi</h2>
              <p className="text-xs text-gray-400">{previewQuestions.length} câu · chế độ luyện tập · không lưu kết quả</p>
            </div>
            <button onClick={() => setShowPreview(false)} className="text-gray-400 hover:text-gray-600 p-1">
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto bg-gray-50">
            <QuizSession
              key={previewQuestions.map(q => q.id).join(',')}
              questions={previewQuestions}
              mode="preview"
              preview={true}
              showAnswer={true}
              showScore={true}
              examMode={false}
              onFinish={() => setShowPreview(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
