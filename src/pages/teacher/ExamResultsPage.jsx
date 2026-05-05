import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { ArrowLeft, ChevronRight, Loader2, CheckCircle } from 'lucide-react'
import WordEditor from '../../components/editor/WordEditor'
import PPTEditor from '../../components/editor/PPTEditor'
import toast from 'react-hot-toast'

export default function ExamResultsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [exam, setExam] = useState(null)
  const [sessions, setSessions] = useState([])
  const [questions, setQuestions] = useState([])
  const [filterClass, setFilterClass] = useState('')
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedStudent, setSelectedStudent] = useState(null) // { profile, sessions }
  const [selectedSession, setSelectedSession] = useState(null)
  const [practicalScore, setPracticalScore] = useState('')
  const [practicalComment, setPracticalComment] = useState('')
  const [savingPractical, setSavingPractical] = useState(false)

  useEffect(() => { loadData() }, [id])

  async function loadData() {
    setLoading(true)
    const [{ data: examData }, { data: sessionData }] = await Promise.all([
      supabase.from('exams').select('*').eq('id', id).single(),
      supabase.from('exam_sessions').select('*').eq('exam_id', id).order('submitted_at', { ascending: false }),
    ])
    if (!examData) { navigate('/teacher/exams'); return }

    const userIds = [...new Set((sessionData || []).map(s => s.user_id))]
    let profileMap = {}
    if (userIds.length > 0) {
      const { data: profiles } = await supabase.from('profiles')
        .select('id, full_name, class_name').in('id', userIds)
      profiles?.forEach(p => { profileMap[p.id] = p })
    }

    const { data: qData } = await supabase.from('questions')
      .select('id, question, correct_answer, type')
      .in('id', examData.question_ids)
    const ordered = examData.question_ids.map(qid => qData?.find(q => q.id === qid)).filter(Boolean)

    const { data: classData } = await supabase.from('classes').select('name').eq('grade', examData.grade).order('name')

    setExam(examData)
    setSessions((sessionData || []).map(s => ({ ...s, profile: profileMap[s.user_id] })))
    setQuestions(ordered)
    setClasses(classData?.map(c => c.name) || [])
    setLoading(false)
  }

  // Group by student
  const studentMap = {}
  sessions.forEach(s => {
    if (!studentMap[s.user_id]) studentMap[s.user_id] = { profile: s.profile, sessions: [] }
    studentMap[s.user_id].sessions.push(s)
  })

  const students = Object.values(studentMap)
    .filter(st => !filterClass || st.profile?.class_name === filterClass)
    .sort((a, b) => Math.max(...b.sessions.map(s => s.score)) - Math.max(...a.sessions.map(s => s.score)))

  async function savePractical() {
    if (!selectedSession) return
    setSavingPractical(true)
    const scoreVal = practicalScore !== '' ? parseFloat(practicalScore) : null
    const updates = {
      practical_comment: practicalComment,
      practical_reviewed_at: new Date().toISOString(),
      ...(scoreVal != null && !isNaN(scoreVal) ? { practical_score: scoreVal } : {}),
    }
    const { error } = await supabase.from('exam_sessions').update(updates).eq('id', selectedSession.id)
    setSavingPractical(false)
    if (error) { toast.error('Lưu thất bại: ' + error.message); return }
    toast.success('Đã lưu điểm thực hành')
    const updated = { ...selectedSession, ...updates }
    setSelectedSession(updated)
    setSessions(prev => prev.map(s => s.id === updated.id ? updated : s))
  }

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
    </div>
  )

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => selectedStudent ? (setSelectedStudent(null), setSelectedSession(null)) : navigate('/teacher/exams')}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3 transition"
        >
          <ArrowLeft size={15} />
          {selectedStudent ? 'Danh sách học sinh' : 'Đề thi'}
        </button>
        <h1 className="text-xl font-bold text-gray-800">{exam.title}</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Khối {exam.grade}{exam.class_names?.length > 0 ? ` · Lớp ${exam.class_names.join(', ')}` : ''} · {exam.question_ids?.length} câu
        </p>
      </div>

      {selectedStudent ? (
        /* ── Detail view ── */
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden max-w-2xl">
          {/* Student header + attempt tabs */}
          <div className="px-5 py-4 bg-indigo-50 border-b border-indigo-100">
            <p className="font-semibold text-gray-800">{selectedStudent.profile?.full_name}</p>
            <p className="text-sm text-gray-500">Lớp {selectedStudent.profile?.class_name} · {selectedStudent.sessions.length} lần làm</p>
            {selectedStudent.sessions.length > 1 && (
              <div className="flex gap-2 mt-2.5 flex-wrap">
                {selectedStudent.sessions
                  .sort((a, b) => a.attempt_number - b.attempt_number)
                  .map(s => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setSelectedSession(s)
                        setPracticalScore(s.practical_score ?? '')
                        setPracticalComment(s.practical_comment || '')
                      }}
                      className={`text-xs px-3 py-1 rounded-full border transition ${
                        selectedSession?.id === s.id
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'bg-white border-gray-300 text-gray-600 hover:border-indigo-400'
                      }`}
                    >
                      Lần {s.attempt_number}: {s.score} điểm
                    </button>
                  ))}
              </div>
            )}
          </div>

          {selectedSession && (
            <div className="p-5 space-y-4">
              {/* Session summary */}
              <div className="flex flex-wrap gap-4 text-sm text-gray-600 pb-3 border-b border-gray-100">
                <span>Lý thuyết: <strong className="text-indigo-700 text-base">{selectedSession.score}</strong>/10</span>
                <span>{selectedSession.correct}/{selectedSession.total} câu đúng</span>
                {selectedSession.practical_score != null && (
                  <span>Thực hành: <strong className="text-orange-600 text-base">{selectedSession.practical_score}</strong>/10</span>
                )}
                {exam.has_practical && exam.theory_weight != null && (
                  <span className="text-gray-400">
                    Tổng: {(() => {
                      const t = selectedSession.score * (exam.theory_weight / 100)
                      const p = (selectedSession.practical_score ?? 0) * (exam.practical_weight / 100)
                      return Math.round((t + p) * 10) / 10
                    })()}/10
                  </span>
                )}
                <span className="text-gray-400">
                  {new Date(selectedSession.submitted_at).toLocaleDateString('vi-VN', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </span>
              </div>

              {/* Theory questions */}
              {questions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Phần lý thuyết</p>
                  {questions.map((q, i) => {
                    const ans = selectedSession.answers?.[i]
                    const isOk = ans?.toLowerCase() === q.correct_answer?.toLowerCase()
                    return (
                      <div key={q.id} className={`rounded-xl border p-3 text-sm ${isOk ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                        <p className="font-medium text-gray-800 mb-1">{i + 1}. {q.question}</p>
                        {isOk
                          ? <p className="text-green-700">✓ {ans}</p>
                          : <p className="text-red-600">✗ Học sinh: <strong>{ans || '(bỏ qua)'}</strong> — Đúng: <strong>{q.correct_answer}</strong></p>
                        }
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Practical section */}
              {exam.has_practical && selectedSession.practical_content && (
                <div className="space-y-3 pt-2 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Phần thực hành {exam.practical_type === 'word' ? '📝 Word' : '📊 PowerPoint'}
                  </p>
                  {exam.practical_type === 'word' && (
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                      <WordEditor content={selectedSession.practical_content} readonly />
                    </div>
                  )}
                  {exam.practical_type === 'ppt' && (
                    <PPTEditor content={selectedSession.practical_content} readonly />
                  )}

                  {/* Grading form */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                    <p className="text-sm font-semibold text-gray-700">Chấm điểm thực hành</p>
                    <div className="flex items-center gap-3">
                      <label className="text-sm text-gray-600 shrink-0">Điểm (0–10):</label>
                      <input
                        type="number" min={0} max={10} step={0.5}
                        value={practicalScore}
                        onChange={e => setPracticalScore(e.target.value)}
                        placeholder="VD: 8.5"
                        className="w-24 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      {selectedSession.practical_score != null && (
                        <span className="text-sm text-gray-400">Hiện tại: <b className="text-orange-600">{selectedSession.practical_score}</b></span>
                      )}
                    </div>
                    <textarea
                      value={practicalComment}
                      onChange={e => setPracticalComment(e.target.value)}
                      rows={3}
                      placeholder="Nhận xét phần thực hành..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                    <button
                      onClick={savePractical}
                      disabled={savingPractical}
                      className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition"
                    >
                      {savingPractical ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                      Lưu điểm thực hành
                    </button>
                  </div>
                </div>
              )}

              {exam.has_practical && !selectedSession.practical_content && (
                <p className="text-sm text-gray-400 italic pt-2 border-t border-gray-100">Học sinh chưa nộp phần thực hành</p>
              )}
            </div>
          )}
        </div>
      ) : (
        /* ── Student list ── */
        <div>
          <div className="flex gap-3 mb-5">
            <select
              value={filterClass}
              onChange={e => setFilterClass(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Tất cả lớp</option>
              {classes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <span className="text-gray-500 text-sm self-center">
              {students.length} học sinh đã làm · {sessions.length} lượt
            </span>
          </div>

          {sessions.length === 0 ? (
            <div className="text-center py-16 text-gray-400">Chưa có học sinh nào nộp bài</div>
          ) : students.length === 0 ? (
            <div className="text-center py-16 text-gray-400">Không có học sinh nào trong lớp này</div>
          ) : (
            <div className="space-y-2 max-w-2xl">
              {students.map((st, i) => {
                const scores = st.sessions.map(s => s.score)
                const best = Math.max(...scores)
                const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10
                const colorClass = best >= 8 ? 'text-green-600' : best >= 5 ? 'text-orange-500' : 'text-red-500'
                const latest = st.sessions[0]
                const date = new Date(latest.submitted_at).toLocaleDateString('vi-VN', {
                  day: '2-digit', month: '2-digit',
                })
                return (
                  <button
                    key={st.profile?.id || i}
                    onClick={() => {
                      const latest = st.sessions.sort((a, b) => a.attempt_number - b.attempt_number).slice(-1)[0]
                      setSelectedStudent(st)
                      setSelectedSession(latest)
                      setPracticalScore(latest.practical_score ?? '')
                      setPracticalComment(latest.practical_comment || '')
                    }}
                    className="w-full flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 hover:border-indigo-300 hover:bg-indigo-50/30 transition text-left"
                  >
                    <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{st.profile?.full_name || '—'}</p>
                      <p className="text-xs text-gray-400">
                        Lớp {st.profile?.class_name} · {st.sessions.length} lần làm · {date}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`text-lg font-bold ${colorClass}`}>{best}</div>
                      <div className="text-xs text-gray-400">Cao nhất</div>
                    </div>
                    {st.sessions.length > 1 && (
                      <div className="text-right shrink-0">
                        <div className="text-sm font-semibold text-indigo-600">{avg}</div>
                        <div className="text-xs text-gray-400">TB</div>
                      </div>
                    )}
                    <ChevronRight size={16} className="text-gray-300 shrink-0" />
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
