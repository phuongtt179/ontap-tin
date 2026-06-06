import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import { useTopics } from '../../hooks/useTopics'
import { useGrades } from '../../hooks/useGrades'
import QuestionImportModal from '../../components/teacher/QuestionImportModal'
import QuestionCard from '../../components/teacher/QuestionCard'
import QuestionFormModal from '../../components/teacher/QuestionFormModal'
import toast from 'react-hot-toast'
import { Upload, Plus, BookOpen } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function QuestionsPage() {
  const { canDelete } = useAuth()
  const { topics, loading: topicsLoading } = useTopics()
  const { grades: GRADES } = useGrades()

  const [selectedGrade, setSelectedGrade] = useState('')
  const [selectedTopic, setSelectedTopic] = useState('')
  const [allQuestions, setAllQuestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [showCreate, setShowCreate] = useState(false)

  // Chọn mặc định khi dữ liệu sẵn sàng
  useEffect(() => {
    if (GRADES.length > 0 && topics.length > 0 && !selectedGrade) {
      const g = GRADES[0]
      const t = topics.find(t => t.grade === g || t.grade === 'all')
      setSelectedGrade(g)
      if (t) setSelectedTopic(t.name)
    }
  }, [GRADES, topics])

  useEffect(() => { if (selectedGrade) fetchQuestions() }, [selectedGrade])

  async function fetchQuestions() {
    setLoading(true)
    const { data, error } = await supabase
      .from('questions').select('*')
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
  }

  const gradeTopics = useMemo(
    () => topics.filter(t => t.grade === selectedGrade || t.grade === 'all'),
    [topics, selectedGrade]
  )

  const countByTopic = useMemo(() => {
    const map = {}
    allQuestions.forEach(q => { map[q.topic] = (map[q.topic] || 0) + 1 })
    return map
  }, [allQuestions])

  const displayedQuestions = useMemo(
    () => selectedTopic ? allQuestions.filter(q => q.topic === selectedTopic) : allQuestions,
    [allQuestions, selectedTopic]
  )

  async function handleDelete(id) {
    const { error } = await supabase.from('questions').delete().eq('id', id)
    if (error) toast.error('Xóa thất bại')
    else { toast.success('Đã xóa'); fetchQuestions() }
  }

  return (
    <div className="flex h-full min-h-0">

      {/* ── Sidebar ─────────────────────────────── */}
      <aside className="w-64 shrink-0 bg-white border-r border-gray-200 flex flex-col min-h-0">

        {/* Title + grade selector */}
        <div className="px-4 pt-5 pb-4 border-b border-gray-100">
          <h1 className="text-lg font-bold text-gray-800 mb-3">Ngân hàng câu hỏi</h1>
          <select
            value={selectedGrade}
            onChange={e => handleGradeChange(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {GRADES.length === 0 && <option value="">-- Chọn khoá --</option>}
            {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        {/* Topic list */}
        <nav className="flex-1 overflow-y-auto py-2 px-2">
          {topicsLoading ? (
            <div className="space-y-1 px-1 pt-1">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="h-9 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : gradeTopics.length === 0 ? (
            <p className="text-xs text-gray-400 text-center px-4 pt-6">Chưa có chủ đề nào</p>
          ) : (
            gradeTopics.map(t => {
              const count = countByTopic[t.name] || 0
              const active = selectedTopic === t.name
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedTopic(t.name)}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-left text-sm mb-0.5 transition
                    ${active
                      ? 'bg-indigo-600 text-white font-medium'
                      : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  <span className="leading-tight line-clamp-2">{t.name}</span>
                  <span className={`shrink-0 min-w-[20px] text-center text-xs px-1.5 py-0.5 rounded-full font-semibold
                    ${active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    {loading ? '·' : count}
                  </span>
                </button>
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
            <h2 className="font-semibold text-gray-800 truncate">
              {selectedTopic || 'Tất cả câu hỏi'}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {loading ? '...' : `${displayedQuestions.length} câu hỏi`}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              <Plus size={15} /> Tạo câu hỏi
            </button>
            <button
              onClick={() => setShowImport(true)}
              className="flex items-center gap-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium transition"
            >
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
              <p className="text-sm">Chưa có câu hỏi nào cho chủ đề này</p>
              <button
                onClick={() => setShowCreate(true)}
                className="mt-3 text-sm text-indigo-500 hover:text-indigo-700 font-medium"
              >
                + Tạo câu hỏi đầu tiên
              </button>
            </div>
          ) : (
            <div className="space-y-3 max-w-4xl">
              {displayedQuestions.map((q, i) => (
                <QuestionCard
                  key={q.id}
                  question={q}
                  index={i + 1}
                  onDelete={canDelete ? () => handleDelete(q.id) : undefined}
                  onUpdate={fetchQuestions}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {showCreate && (
        <QuestionFormModal
          onClose={() => setShowCreate(false)}
          onDone={() => { setShowCreate(false); fetchQuestions() }}
        />
      )}
      {showImport && (
        <QuestionImportModal
          onClose={() => setShowImport(false)}
          onSaved={() => { setShowImport(false); fetchQuestions() }}
          grades={GRADES}
          topics={topics}
        />
      )}
    </div>
  )
}
