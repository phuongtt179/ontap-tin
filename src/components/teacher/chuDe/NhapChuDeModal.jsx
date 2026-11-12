// Nhập nhiều chủ đề một lần cho 1 khoá (mỗi dòng 1 tên, bỏ tên đã có / lặp).
import { useState } from 'react'
import toast from 'react-hot-toast'
import { Check, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { themChuDe } from '../../../data/chuDe'
import { docDanhSachTen, dongSeThem } from '../../../domain/cayNoiDung'

export default function NhapChuDeModal({ grades, existingTopics, defaultGrade, user, onClose, onDone }) {
  const [grade, setGrade] = useState(defaultGrade || grades[0] || '')
  const [text, setText] = useState('')
  const [rows, setRows] = useState(null)
  const [saving, setSaving] = useState(false)

  function handleParse() {
    const parsed = docDanhSachTen(text, existingTopics.filter(t => t.grade === grade).map(t => t.name))
    if (!parsed.length) { toast.error('Chưa nhập chủ đề nào'); return }
    setRows(parsed)
  }

  const newRows = dongSeThem(rows)

  async function handleSave() {
    if (!newRows.length) return
    setSaving(true)
    const { error } = await themChuDe(newRows.map(r => ({ name: r.name, grade, created_by: user.id })))
    setSaving(false)
    if (error) toast.error('Lưu thất bại: ' + error.message)
    else { toast.success(`Đã thêm ${newRows.length} chủ đề`); onDone() }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-base font-bold text-gray-800">Nhập chủ đề hàng loạt</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-auto p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Khoá học</label>
            <select value={grade} onChange={e => { setGrade(e.target.value); setRows(null) }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {grades.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          {rows === null ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Danh sách chủ đề <span className="text-xs font-normal text-gray-400">mỗi dòng 1 tên</span>
              </label>
              <textarea autoFocus value={text} onChange={e => setText(e.target.value)} rows={10}
                placeholder={"1. Nhập môn Python\n2. Biến và kiểu dữ liệu\n3. Câu lệnh điều kiện"}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2 flex-wrap">
                <span className="flex items-center gap-1 text-sm bg-green-50 text-green-700 border border-green-200 px-3 py-1 rounded-full">
                  <CheckCircle2 size={14} /> {newRows.length} sẽ thêm
                </span>
                {rows.filter(r => r.isDup || r.isRepeat).length > 0 && (
                  <span className="flex items-center gap-1 text-sm bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full">
                    <AlertCircle size={14} /> {rows.filter(r => r.isDup || r.isRepeat).length} bỏ qua
                  </span>
                )}
              </div>
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                {rows.map((r, i) => (
                  <div key={i} className={`flex items-center gap-3 px-4 py-2.5 text-sm ${i > 0 ? 'border-t border-gray-100' : ''} ${r.isDup || r.isRepeat ? 'bg-amber-50' : 'bg-white'}`}>
                    {r.isDup || r.isRepeat ? <AlertCircle size={14} className="text-amber-500 shrink-0" /> : <CheckCircle2 size={14} className="text-green-500 shrink-0" />}
                    <span className={`flex-1 ${r.isDup || r.isRepeat ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{r.name}</span>
                    {r.isDup && <span className="text-xs text-amber-600">đã tồn tại</span>}
                    {r.isRepeat && !r.isDup && <span className="text-xs text-amber-600">trùng</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
          {rows !== null
            ? <button onClick={() => setRows(null)} className="text-sm text-gray-500 hover:text-gray-700">← Sửa lại</button>
            : <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700">Hủy</button>}
          {rows === null
            ? <button onClick={handleParse} disabled={!text.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition">
                Xem trước →
              </button>
            : <button onClick={handleSave} disabled={saving || newRows.length === 0}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Thêm {newRows.length} chủ đề
              </button>}
        </div>
      </div>
    </div>
  )
}
