// Ghi chú học sinh: bảng màu + cửa sổ soạn / sửa 1 ghi chú (tiêu đề, nội dung, màu, khoá, chủ đề, bài).
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { X, Loader2 } from 'lucide-react'
import { layDanhSachBai } from '../../data/baiHoc'
import { COLORS } from './mauGhiChu'

export default function NoteModal({ note, enrollments, topicsByGrade, onClose, onSave }) {
  const [form, setForm] = useState({
    title:     note?.title     || '',
    content:   note?.content   || '',
    color:     note?.color     || 'yellow',
    grade:     note?.grade     || (enrollments.length === 1 ? enrollments[0].grade : ''),
    topic:     note?.topic     || '',
    lesson_id: note?.lesson_id || '',
  })
  const [saving, setSaving] = useState(false)
  const [availableLessons, setAvailableLessons] = useState([])

  // Fetch bài học theo khoá + chủ đề
  useEffect(() => {
    if (!form.grade) { setAvailableLessons([]); return }
    layDanhSachBai(form.grade, { xuatBan: true, topic: form.topic }).then(({ data }) => setAvailableLessons(data || []))
  }, [form.grade, form.topic])

  function handleGradeChange(g) {
    const validTopics = topicsByGrade[g] || []
    setForm(f => ({ ...f, grade: g, topic: validTopics.includes(f.topic) ? f.topic : '', lesson_id: '' }))
  }

  function handleTopicChange(t) {
    setForm(f => ({ ...f, topic: t, lesson_id: '' }))
  }

  const availableTopics = form.grade ? (topicsByGrade[form.grade] || []) : []

  async function handleSave() {
    if (!form.content.trim()) { toast.error('Nội dung không được trống'); return }
    setSaving(true)
    await onSave({
      ...form,
      title: form.title.trim(),
      content: form.content.trim(),
      lesson_id: form.lesson_id || null,
    })
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-base font-bold text-gray-800">{note ? 'Sửa ghi chú' : 'Thêm ghi chú'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-auto p-6 space-y-4">
          {/* Tiêu đề */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề <span className="text-gray-400 font-normal">(tuỳ chọn)</span></label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="Nhập tiêu đề..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          {/* Nội dung */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung</label>
            <textarea autoFocus={!note} value={form.content}
              onChange={e => setForm({ ...form, content: e.target.value })}
              placeholder="Ghi chú của bạn..." rows={5}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
          </div>
          {/* Khoá học + Chủ đề */}
          {enrollments.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Khoá học <span className="text-gray-400 font-normal">(tuỳ chọn)</span></label>
                <select value={form.grade} onChange={e => handleGradeChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">-- Không gắn --</option>
                  {enrollments.map(e => <option key={e.grade} value={e.grade}>{e.grade}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chủ đề <span className="text-gray-400 font-normal">(tuỳ chọn)</span></label>
                <select value={form.topic} onChange={e => handleTopicChange(e.target.value)}
                  disabled={!form.grade || availableTopics.length === 0}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50">
                  <option value="">-- Không gắn --</option>
                  {availableTopics.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              {/* Bài học — full width */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Bài học <span className="text-gray-400 font-normal">(tuỳ chọn)</span></label>
                <select value={form.lesson_id} onChange={e => setForm({ ...form, lesson_id: e.target.value })}
                  disabled={!form.grade || availableLessons.length === 0}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50">
                  <option value="">-- Không gắn --</option>
                  {availableLessons.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
                </select>
                {form.grade && availableLessons.length === 0 && (
                  <p className="text-xs text-gray-400 mt-1">Chưa có bài học nào cho khoá / chủ đề này</p>
                )}
              </div>
            </div>
          )}
          {/* Màu */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Màu thẻ</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button key={c.key} onClick={() => setForm({ ...form, color: c.key })} title={c.label}
                  className={`w-8 h-8 rounded-full border-2 transition ${c.bg} ${form.color === c.key ? `ring-2 ring-offset-1 ${c.ring} border-transparent` : c.border}`} />
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Hủy</button>
          <button onClick={handleSave} disabled={saving || !form.content.trim()}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 transition">
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            Lưu
          </button>
        </div>
      </div>
    </div>
  )
}
