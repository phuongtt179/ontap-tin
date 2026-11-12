// Cửa sổ thêm / sửa 1 câu hỏi (8 loại). Quy tắc form + dữ liệu lưu: domain/soanCauHoi.js · phần soạn: components/teacher/cauHoi/.
import { useState } from 'react'
import toast from 'react-hot-toast'
import { X, Loader2 } from 'lucide-react'
import { themCauHoi, capNhatCauHoi } from '../../data/cauHoi'
import { useAuth } from '../../context/AuthContext'
import { LOAI_CAU_HOI, formMoi, formTuCauHoi, duLieuCauHoi } from '../../domain/soanCauHoi'
import NoiDungCauHoi from './cauHoi/NoiDungCauHoi'
import DapAnLuaChon from './cauHoi/DapAnLuaChon'
import DapAnTuNgu from './cauHoi/DapAnTuNgu'

export default function QuestionFormModal({ onClose, onDone, defaultGrade, defaultTopic, defaultUnitId, question: editQuestion }) {
  const isEdit = !!editQuestion
  const { user } = useAuth()
  const [form, setForm] = useState(() => editQuestion ? formTuCauHoi(editQuestion) : formMoi({ grade: defaultGrade, topic: defaultTopic, unitId: defaultUnitId }))
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    const { duLieu, loi } = duLieuCauHoi(form)
    if (loi) { toast.error(loi); return }
    setSaving(true)
    const { error } = isEdit ? await capNhatCauHoi(editQuestion.id, duLieu) : await themCauHoi({ ...duLieu, created_by: user.id })
    setSaving(false)
    if (error) toast.error((isEdit ? 'Cập nhật' : 'Thêm') + ' thất bại: ' + error.message)
    else { toast.success(isEdit ? 'Đã cập nhật câu hỏi' : 'Đã thêm câu hỏi'); onDone() }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
          <h2 className="text-base font-bold text-gray-800">{isEdit ? 'Sửa câu hỏi' : 'Thêm câu hỏi'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-4">
          {/* Type */}
          <div className="flex flex-wrap gap-2">
            {LOAI_CAU_HOI.map(t => (
              <button key={t.value}
                onClick={() => !isEdit && setForm({ ...form, type: t.value, correct_answer: '' })}
                className={`px-3 py-1 rounded-full text-sm font-medium transition ${form.type === t.value ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} ${isEdit ? 'cursor-default' : ''}`}>
                {t.label}
              </button>
            ))}
          </div>
          <NoiDungCauHoi form={form} setForm={setForm} />
          <DapAnLuaChon form={form} setForm={setForm} />
          <DapAnTuNgu form={form} setForm={setForm} />
        </div>

        {/* Gợi ý khi sai */}
        <div className="px-6 pb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Gợi ý khi trả lời sai
            <span className="ml-2 text-xs font-normal text-gray-400">(tùy chọn — hiển thị cho học sinh khi sai)</span>
          </label>
          <textarea
            value={form.hint}
            onChange={e => setForm({ ...form, hint: e.target.value })}
            rows={2}
            placeholder="Ví dụ: Gợi ý: thiết bị nhập là thiết bị dùng để đưa dữ liệu vào máy..."
            className="w-full border border-amber-200 bg-amber-50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
          />
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Hủy</button>
          <button onClick={handleSave} disabled={saving || !form.question.trim()}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 transition">
            {saving && <Loader2 size={14} className="animate-spin" />}
            {isEdit ? 'Lưu thay đổi' : 'Thêm câu hỏi'}
          </button>
        </div>
      </div>
    </div>
  )
}
