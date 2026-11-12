// Trang Đề thi của giáo viên (/teacher/exams): danh sách đề, bật / tắt, xoá, mở kết quả. Soạn đề: components/teacher/deThi/.
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, BarChart2, Clock, ToggleLeft, ToggleRight, Eye } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { layTatCaDeThi, xoaDeThi, datMoDeThi } from '../../data/deThi'
import DeThiFormModal from '../../components/teacher/deThi/DeThiFormModal'

/* ── ExamsPage ────────────────────────────────────────────── */
export default function ExamsPage() {
  const { canDelete } = useAuth()
  const navigate = useNavigate()
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editExam, setEditExam] = useState(null)

  useEffect(() => { fetchExams() }, [])

  // Chỉ hiện vòng xoay khi đổi bộ lọc; lưu / xoá xong thì tải ngầm để giữ nguyên danh sách và vị trí đang xem
  const daTai = useRef(false)
  async function fetchExams() {
    if (!daTai.current) { daTai.current = true; setLoading(true) }
    const { data } = await layTatCaDeThi()
    setExams(data || [])
    setLoading(false)
  }

  async function handleDelete(id, title) {
    if (!confirm(`Xóa đề thi "${title}"?`)) return
    const { error } = await xoaDeThi(id)
    if (error) toast.error('Xóa thất bại')
    else { toast.success('Đã xóa'); fetchExams() }
  }

  async function handleToggle(exam) {
    const { error } = await datMoDeThi(exam.id, !exam.is_active)
    if (error) toast.error('Cập nhật thất bại')
    else fetchExams()
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Đề thi</h1>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
          <Plus size={16} /> Tạo đề thi
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      ) : exams.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">Chưa có đề thi nào</p>
          <p className="text-sm mt-1">Bấm "Tạo đề thi" để bắt đầu</p>
        </div>
      ) : (
        <div className="space-y-3">
          {exams.map(exam => (
            <div key={exam.id} className="bg-white border border-gray-200 rounded-xl px-5 py-4 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-gray-800">{exam.title}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${exam.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {exam.is_active ? 'Đang mở' : 'Tắt'}
                  </span>
                </div>
                <div className="flex gap-3 mt-1 text-xs text-gray-400 flex-wrap">
                  <span>{exam.grade}</span>
                  {exam.class_names?.length > 0 && <span>· Lớp {exam.class_names.join(', ')}</span>}
                  <span>· {exam.question_ids?.length || 0} câu</span>
                  <span>· {exam.time_limit ? `${exam.time_limit} phút` : 'Không giới hạn giờ'}</span>
                  <span>· {exam.max_attempts === 0 ? 'Không giới hạn lần' : `${exam.max_attempts} lần làm`}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => handleToggle(exam)} title={exam.is_active ? 'Tắt đề' : 'Mở đề'}
                  className={`p-2 rounded-lg transition ${exam.is_active ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}>
                  {exam.is_active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                </button>
                <button onClick={() => navigate(`/teacher/exams/${exam.id}/results`)} className="p-2 text-gray-400 hover:text-indigo-600 transition" title="Thống kê kết quả">
                  <BarChart2 size={16} />
                </button>
                <button onClick={() => setEditExam(exam)} className="p-2 text-gray-400 hover:text-indigo-600 transition">
                  <Pencil size={14} />
                </button>
                {canDelete && (
                  <button onClick={() => handleDelete(exam.id, exam.title)} className="p-2 text-red-400 hover:text-red-600 transition">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {(showCreate || editExam) && (
        <DeThiFormModal
          exam={editExam}
          onClose={() => { setShowCreate(false); setEditExam(null) }}
          onDone={() => { setShowCreate(false); setEditExam(null); fetchExams() }}
        />
      )}
    </div>
  )
}
