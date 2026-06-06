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
  const [allQuestions, setAllQuestions] = useState([])   // tất cả câu hỏi của grade đang chọn
  const [loading, setLoading] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [showCreate, setShowCreate] = useState(false)

  // Chọn grade + topic mặc định khi dữ liệu đã tải
  useEffect(() => {
    if (GRADES.length > 0 && topics.length > 0 && !selectedGrade) {
      const firstGrade = GRADES[0]
      const firstTopic = topics.find(t => t.grade === firstGrade || t.grade === 'all')
      setSelectedGrade(firstGrade)
      if (firstTopic) setSelectedTopic(firstTopic.name)
    }
  }, [GRADES, topics])

  // Tải câu hỏi khi grade thay đổi
  useEffect(() => {
    if (selectedGrade) fetchQuestions()
  }, [selectedGrade])

  async function fetchQuestions() {
    setLoading(true)
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('grade', selectedGrade)
      .order('created_at', { ascending: false })
    if (error) toast.error('Lỗi tải câu hỏi')
    else setAllQuestions(data || [])
    setLoading(false)
  }

  function handleGradeChange(grade) {
    setSelectedGrade(grade)
    const gradeTopics = topics.filter(t => t.grade === grade || t.grade === 'all')
    setSelectedTopic(gradeTopics[0]?.name || '')
  }

  // Topics của grade đang chọn
  const gradeTopics = useMemo(
    () => topics.filter(t => t.grade === selectedGrade || t.grade === 'all'),
    [topics, selectedGrade]
  )

  // Đếm câu hỏi theo chủ đề
  const countByTopic = useMemo(() => {
    const map = {}
    allQuestions.forEach(q => { map[q.topic] = (map[q.topic] || 0) + 1 })
    return map
  }, [allQuestions])

  // Câu hỏi hiện thị bên phải
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
    <div className="p-4 md:p-6 h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-gray-800">Ngân hàng câu hỏi</h1>
        <select
          value={selectedGrade}
          onChange={e => handleGradeChange(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        >
          {GRADES.length === 0 && <option value="">-- Chọn khoá --</option>}
          {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      {/* Two-panel layout */}
      <div className="flex gap-4 items-start">

        {/* ── Left: Topic sidebar ── */}
        <div className="w-52 shrink-0 bg-white border border-gray-200 rounded-xl overflow-hidden sticky top-4">
          <div className="px-3 py-3 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Chủ đề</p>
          </div>

          {topicsLoading ? (
            <div className="p-3 space-y-2">
              {[1,2,3,4].map(i => <div key={i} className="h-8 bg-gray-100 rounded-lg animate-pulse" />)}
            </div>
          ) : gradeTopics.length === 0 ? (
            <div className="p-4 text-xs text-gray-400 text-center">
              Chưa có chủ đề nào
            </div>
          ) : (
            <nav className="p-1.5 space-y-0.5 max-h-[calc(100vh-220px)] overflow-y-auto">
              {gradeTopics.map(t => {
                const count = countByTopic[t.name] || 0
                const active = selectedTopic === t.name
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTopic(t.name)}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-left text-sm transition
                      ${active
                        ? 'bg-indigo-600 text-white font-medium'
                        : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    <span className="truncate leading-tight">{t.name}</span>
                    <span className={`shrink-0 text-xs px-1.5 py-0.5 rounded-full font-medium
                      ${active ? 'bg-indigo-500 text-indigo-100' : 'bg-gray-100 text-gray-500'}`}>
                      {loading ? '…' : count}
                    </span>
                  </button>
                )
              })}
            </nav>
          )}
        </div>

        {/* ── Right: Questions panel ── */}
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2 min-w-0">
              {selectedTopic && (
                <h2 className="font-semibold text-gray-700 truncate">{selectedTopic}</h2>
              )}
              <span className="shrink-0 text-sm text-gray-400">
                {loading ? '...' : `${displayedQuestions.length} câu hỏi`}
              </span>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg transition text-sm font-medium"
              >
                <Plus size={15} /> Tạo câu hỏi
              </button>
              <button
                onClick={() => setShowImport(true)}
                className="flex items-center gap-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-3 py-2 rounded-lg transition text-sm font-medium"
              >
                <Upload size={15} /> Nhập
              </button>
            </div>
          </div>

          {/* Question list */}
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
          ) : displayedQuestions.length === 0 ? (
            <div className="text-center py-20 text-gray-400 bg-white border border-gray-200 rounded-xl">
              <BookOpen size={36} className="mx-auto mb-3 opacity-20" />
              <p>Chưa có câu hỏi nào cho chủ đề này</p>
              <button
                onClick={() => setShowCreate(true)}
                className="mt-3 text-sm text-indigo-500 hover:text-indigo-700"
              >
                + Tạo câu hỏi đầu tiên
              </button>
            </div>
          ) : (
            <div className="space-y-3">
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
