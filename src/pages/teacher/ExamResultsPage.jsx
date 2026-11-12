// Kết quả 1 đề thi (/teacher/exams/:id/results): học sinh theo điểm cao nhất, từng lượt làm, xoá lượt. Chấm thực hành: components/teacher/deThi/ChamThucHanhThi.
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { layDeThi } from '../../data/deThi'
import { layLuotThiCuaDe, xoaLuotThi } from '../../data/baiLam'
import { diemTongLuot, diemCaoNhat } from '../../domain/deThi'
import { layTenLopCuaKhoa } from '../../data/khoaHoc'
import { layTenCacHs } from '../../data/hoSo'
import { layLopCuaCacHs } from '../../data/ghiDanh'
import { layCauHoiKemDapAn } from '../../data/cauHoi'
import { ArrowLeft, ChevronRight, CheckCircle, Trash2 } from 'lucide-react'
import ChamThucHanhThi from '../../components/teacher/deThi/ChamThucHanhThi'
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

  useEffect(() => { loadData() }, [id])

  async function loadData() {
    setLoading(true)
    const [{ data: examData }, { data: sessionData }] = await Promise.all([
      layDeThi(id),
      layLuotThiCuaDe(id),   // lượt bỏ dở (chưa nộp) xếp cuối
    ])
    if (!examData) { navigate('/teacher/exams'); return }

    const userIds = [...new Set((sessionData || []).map(s => s.user_id))]
    let profileMap = {}
    if (userIds.length > 0) {
      // lớp lấy từ ghi danh của khoá đề thi (bảng profiles không còn cột class_name)
      const [{ data: profiles }, { data: lops }] = await Promise.all([layTenCacHs(userIds), layLopCuaCacHs(userIds, { grade: examData.grade })])
      const lopCua = Object.fromEntries((lops || []).map(e => [e.user_id, e.class_name || '']))
      profiles?.forEach(p => { profileMap[p.id] = { ...p, class_name: lopCua[p.id] || '' } })
    }

    const { data: qData } = await layCauHoiKemDapAn(examData.question_ids)
    const ordered = qData || []

    const tenLop = await layTenLopCuaKhoa(examData.grade)

    setExam(examData)
    setSessions((sessionData || []).map(s => ({ ...s, profile: profileMap[s.user_id] })))
    setQuestions(ordered)
    setClasses(tenLop)
    setLoading(false)
  }

// Điểm cao nhất trong các lượt ĐÃ NỘP (bỏ qua lượt bỏ dở, submitted_at null — xem
  // migration_exam_session_start.sql) — trả về null nếu chưa lượt nào nộp xong.
  const bestScoreOf = cacLuot => diemCaoNhat(exam, cacLuot)
  const diemTong = luot => diemTongLuot(exam, luot)

  // Group by student
  const studentMap = {}
  sessions.forEach(s => {
    if (!studentMap[s.user_id]) studentMap[s.user_id] = { profile: s.profile, sessions: [] }
    studentMap[s.user_id].sessions.push(s)
  })

  const students = Object.values(studentMap)
    .filter(st => !filterClass || st.profile?.class_name === filterClass)
    .sort((a, b) => (bestScoreOf(b.sessions) ?? -1) - (bestScoreOf(a.sessions) ?? -1))

  async function deleteSession(session) {
    if (!confirm('Xoá lượt làm bài này? Học sinh sẽ được tính lại số lần làm (vd nếu bị đóng tab do sự cố), không thể hoàn tác.')) return
    const { error } = await xoaLuotThi(session.id)
    if (error) { toast.error('Xoá thất bại: ' + error.message); return }
    toast.success('Đã xoá lượt làm bài')
    setSessions(prev => prev.filter(s => s.id !== session.id))
    if (selectedSession?.id === session.id) setSelectedSession(null)
    if (selectedStudent) {
      const remaining = selectedStudent.sessions.filter(s => s.id !== session.id)
      if (remaining.length === 0) { setSelectedStudent(null) }
      else setSelectedStudent({ ...selectedStudent, sessions: remaining })
    }
  }

  /** lượt vừa chấm / AI chấm nháp → cập nhật tại chỗ */
  function capNhatLuot(moi) {
    setSelectedSession(moi)
    setSessions(prev => prev.map(x => (x.id === moi.id ? moi : x)))
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
          {exam.grade}{exam.class_names?.length > 0 ? ` · ${exam.class_names.join(', ')}` : ''} · {exam.question_ids?.length} câu
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
                      }}
                      className={`text-xs px-3 py-1 rounded-full border transition ${
                        selectedSession?.id === s.id
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : s.submitted_at == null
                            ? 'bg-white border-amber-300 text-amber-600 hover:border-amber-400'
                            : 'bg-white border-gray-300 text-gray-600 hover:border-indigo-400'
                      }`}
                    >
                      Lần {s.attempt_number}: {s.submitted_at == null ? 'Bỏ dở' : `${diemTong(s)} điểm`}
                    </button>
                  ))}
              </div>
            )}
          </div>

          {selectedSession && selectedSession.submitted_at == null && (
            <div className="p-5">
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold mb-1">Lượt này chưa hoàn thành</p>
                  <p>Học sinh đã bắt đầu làm bài (đóng tab/trình duyệt giữa chừng hoặc chưa nộp) — không có đáp án/điểm để xem. Lượt này vẫn tính vào số lần làm.</p>
                  <p className="text-xs text-amber-500 mt-1">
                    Bắt đầu lúc: {new Date(selectedSession.started_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <button onClick={() => deleteSession(selectedSession)}
                  className="flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-600 shrink-0">
                  <Trash2 size={13} /> Xoá, trả lại lượt
                </button>
              </div>
            </div>
          )}

          {selectedSession && selectedSession.submitted_at != null && (
            <div className="p-5 space-y-4">
              {/* Session summary */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 pb-3 border-b border-gray-100">
                <span>Lý thuyết: <strong className="text-indigo-700 text-base">{selectedSession.score}</strong>/10</span>
                <span>{selectedSession.correct}/{selectedSession.total} câu đúng</span>
                {selectedSession.practical_score != null && (
                  <span>Thực hành: <strong className="text-orange-600 text-base">{selectedSession.practical_score}</strong>/10</span>
                )}
                {exam.has_practical && exam.theory_weight != null && (
                  <span className="text-gray-400">
                    Tổng: {diemTongLuot(exam, selectedSession)}/10
                  </span>
                )}
                <span className="text-gray-400">
                  {new Date(selectedSession.submitted_at).toLocaleDateString('vi-VN', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </span>
                <button onClick={() => deleteSession(selectedSession)}
                  className="ml-auto flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-red-500 shrink-0">
                  <Trash2 size={13} /> Xoá lượt này
                </button>
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

              <ChamThucHanhThi key={selectedSession.id} exam={exam} luot={selectedSession} onCapNhat={capNhatLuot} />
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
                // Lượt "bỏ dở" (chưa nộp, submitted_at null) không tính vào điểm cao nhất/TB
                // nhưng vẫn tính vào "X lần làm" (đúng mục đích: tốn 1 lượt dù không hoàn thành).
                const scores = st.sessions.filter(s => s.submitted_at != null).map(diemTong)
                const best = scores.length > 0 ? Math.max(...scores) : null
                const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10 : null
                const colorClass = best == null ? 'text-gray-400' : best >= 8 ? 'text-green-600' : best >= 5 ? 'text-orange-500' : 'text-red-500'
                const latest = st.sessions[0]
                const date = new Date(latest.submitted_at ?? latest.started_at).toLocaleDateString('vi-VN', {
                  day: '2-digit', month: '2-digit',
                })
                return (
                  <button
                    key={st.profile?.id || i}
                    onClick={() => {
                      const latest = st.sessions.sort((a, b) => a.attempt_number - b.attempt_number).slice(-1)[0]
                      setSelectedStudent(st)
                      setSelectedSession(latest)
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
                      <div className={`text-lg font-bold ${colorClass}`}>{best ?? '—'}</div>
                      <div className="text-xs text-gray-400">{best == null ? 'Chưa hoàn thành' : 'Cao nhất'}</div>
                    </div>
                    {st.sessions.length > 1 && avg != null && (
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
