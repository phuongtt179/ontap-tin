// Cửa sổ tạo / sửa đề thi 2 bước: thông tin + thực hành (BuocThongTinDe) → chọn câu hỏi (BuocChonCauHoiDe).
// Kiểm tra + dữ liệu lưu: domain/deThi.js · ghi: data/deThi.js.
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { X, Loader2 } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { layTestPython, luuDeThi, ghiTestPython } from '../../../data/deThi'
import { loiDeThi, duLieuDeThi, testHopLe } from '../../../domain/deThi'
import BuocThongTinDe from './BuocThongTinDe'
import BuocChonCauHoiDe from './BuocChonCauHoiDe'

export default function DeThiFormModal({ exam, onClose, onDone }) {
  const { user } = useAuth()
  const isEdit = !!exam
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    title: exam?.title || '',
    grade: exam?.grade || '3',
    class_names: exam?.class_names || [],
    time_limit: exam?.time_limit ?? 30,
    max_attempts: exam?.max_attempts ?? 1,
    is_active: exam?.is_active ?? false,
    show_answer: exam?.show_answer ?? true,
    show_score: exam?.show_score ?? true,
    question_ids: exam?.question_ids || [],
    has_practical: exam?.has_practical ?? false,
    practical_type: exam?.practical_type || 'word',
    practical_instructions: exam?.practical_instructions || '',
    theory_weight: exam?.theory_weight ?? 60,
    practical_weight: exam?.practical_weight ?? 40,
    practical_rubric: exam?.practical_rubric || '',
  })
  const [tests, setTests] = useState([])
  useEffect(() => {
    if (!exam?.id) return
    layTestPython(exam.id)
      .then(({ data }) => setTests((data || []).map(t => ({ ...t, diem: Number(t.diem) }))))
  }, [exam?.id])
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    const loi = loiDeThi(form, tests)
    if (loi) { toast.error(loi); return }
    setSaving(true)
    const duLieu = duLieuDeThi(form)
    const { data: luu, error } = await luuDeThi(isEdit ? exam.id : null, isEdit ? duLieu : { ...duLieu, created_by: user.id })
    if (!error && luu?.id) {
      // test đề Python: thay toàn bộ bằng danh sách đang sửa (đề không phải Python → xoá hết test cũ)
      const laPython = form.has_practical && form.practical_type === 'python'
      const { error: loiTest } = await ghiTestPython(luu.id, laPython ? testHopLe(tests) : [])
      if (loiTest) toast.error('Đã lưu đề nhưng lưu test lỗi: ' + loiTest.message)
    }
    setSaving(false)
    if (error) toast.error('Lưu thất bại: ' + error.message)
    else { toast.success(isEdit ? 'Đã cập nhật' : 'Đã tạo đề thi'); onDone() }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-800">{isEdit ? 'Sửa đề thi' : 'Tạo đề thi mới'}</h2>
            <div className="flex gap-2 mt-1.5">
              {[1, 2].map(s => (
                <button key={s}
                  onClick={() => { if (s === 2 && !form.title.trim()) return; setStep(s) }}
                  className={`text-xs px-3 py-0.5 rounded-full font-medium transition ${step === s ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                >
                  {s === 1 ? '1. Thông tin' : `2. Câu hỏi${form.question_ids.length > 0 ? ` (${form.question_ids.length})` : ''}`}
                </button>
              ))}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-6">
          {step === 1
            ? <BuocThongTinDe form={form} setForm={setForm} tests={tests} setTests={setTests} />
            : <BuocChonCauHoiDe form={form} setForm={setForm} />}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t shrink-0">
          {step === 2
            ? <button onClick={() => setStep(1)} className="text-sm text-gray-500 hover:text-gray-700">← Quay lại</button>
            : <span />
          }
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Hủy</button>
            {step === 1 ? (
              <button onClick={() => { if (!form.title.trim()) { toast.error('Nhập tên đề'); return } setStep(2) }}
                className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition">
                Tiếp theo →
              </button>
            ) : (
              <button onClick={handleSave} disabled={saving || (form.question_ids.length === 0 && !form.has_practical)}
                className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 transition">
                {saving && <Loader2 size={14} className="animate-spin" />}
                {isEdit ? 'Lưu thay đổi' : 'Tạo đề thi'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
