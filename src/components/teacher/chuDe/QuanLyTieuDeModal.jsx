// Quản lý tiêu đề bài học nhỏ trong 1 đơn vị: thêm, sửa tên, xoá, chuyển lên / xuống.
import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, Check, X, Loader2, ChevronUp, ChevronDown } from 'lucide-react'
import { layTieuDe, themTieuDe, suaTieuDe, xoaTieuDe, ghiThuTu } from '../../../data/chuDe'
import { doiCho } from '../../../domain/cayNoiDung'

export default function QuanLyTieuDeModal({ unit, user, canDelete, onClose }) {
  const [titles, setTitles] = useState([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [editId, setEditId] = useState(null)
  const [editName, setEditName] = useState('')

  useEffect(() => { fetchTitles() }, [])

  // Chỉ hiện vòng xoay khi đổi bộ lọc; lưu / xoá xong thì tải ngầm để giữ nguyên danh sách và vị trí đang xem
  const daTai = useRef(false)
  async function fetchTitles() {
    if (!daTai.current) { daTai.current = true; setLoading(true) }
    const { data } = await layTieuDe(unit.id)
    setTitles(data || [])
    setLoading(false)
  }

  async function handleAdd() {
    if (!newName.trim()) return
    const { error } = await themTieuDe({
      name: newName.trim(), unit_id: unit.id,
      sort_order: titles.length, created_by: user.id,
    })
    if (error) toast.error(error.message.includes('unique') ? 'Tiêu đề đã tồn tại' : 'Thêm thất bại')
    else { toast.success('Đã thêm'); setNewName(''); setAdding(false); fetchTitles() }
  }

  async function handleUpdate(id) {
    if (!editName.trim()) return
    const { error } = await suaTieuDe(id, { name: editName.trim() })
    if (error) toast.error('Cập nhật thất bại')
    else { toast.success('Đã cập nhật'); setEditId(null); fetchTitles() }
  }

  async function handleDelete(id, name) {
    if (!confirm(`Xóa tiêu đề "${name}"? Câu hỏi và bài học liên kết sẽ không bị xóa.`)) return
    const { error } = await xoaTieuDe(id)
    if (error) toast.error('Xóa thất bại')
    else { toast.success('Đã xóa'); fetchTitles() }
  }

  // Di chuyển lên/xuống (chèn giữa) — gán lại sort_order theo thứ tự mới
  async function handleMove(idx, dir) {
    const arr = doiCho(titles, idx, dir)
    if (!arr) return
    setTitles(arr)
    await ghiThuTu('lesson_titles', arr)
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-base font-bold text-gray-800">Tiêu đề bài học — {unit.name}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{titles.length} tiêu đề</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-auto p-5 space-y-3">
          {!adding && (
            <button onClick={() => setAdding(true)}
              className="flex items-center gap-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg transition">
              <Plus size={14} /> Thêm tiêu đề
            </button>
          )}

          {adding && (
            <div className="flex gap-2 items-center bg-indigo-50 border border-indigo-200 rounded-xl px-3 py-2">
              <input autoFocus value={newName} onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                placeholder="Tên tiêu đề bài học..."
                className="flex-1 bg-transparent text-sm focus:outline-none" />
              <button onClick={handleAdd} className="text-green-600 hover:text-green-700 p-1"><Check size={15} /></button>
              <button onClick={() => { setAdding(false); setNewName('') }} className="text-gray-400 p-1"><X size={15} /></button>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-8"><Loader2 size={22} className="animate-spin text-indigo-600" /></div>
          ) : titles.length === 0 && !adding ? (
            <div className="text-center py-8 text-gray-400 text-sm">Chưa có tiêu đề — bấm "Thêm tiêu đề"</div>
          ) : (
            <div className="space-y-1.5">
              {titles.map((t, idx) => (
                <div key={t.id} className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-5 shrink-0">{idx + 1}</span>
                  {editId === t.id ? (
                    <>
                      <input autoFocus value={editName} onChange={e => setEditName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleUpdate(t.id)}
                        className="flex-1 border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                      <button onClick={() => handleUpdate(t.id)} className="text-green-600 p-1"><Check size={14} /></button>
                      <button onClick={() => setEditId(null)} className="text-gray-400 p-1"><X size={14} /></button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-sm font-medium text-gray-800">{t.name}</span>
                      <div className="flex flex-col shrink-0 border border-gray-300 rounded-md overflow-hidden bg-white">
                        <button onClick={() => handleMove(idx, -1)} disabled={idx === 0}
                          className="px-1.5 py-0.5 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-30 leading-none" title="Chuyển lên"><ChevronUp size={14} /></button>
                        <button onClick={() => handleMove(idx, 1)} disabled={idx === titles.length - 1}
                          className="px-1.5 py-0.5 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-30 leading-none border-t border-gray-200" title="Chuyển xuống"><ChevronDown size={14} /></button>
                      </div>
                      <button onClick={() => { setEditId(t.id); setEditName(t.name) }}
                        className="text-gray-400 hover:text-indigo-600 p-1 transition"><Pencil size={13} /></button>
                      {canDelete && (
                        <button onClick={() => handleDelete(t.id, t.name)}
                          className="text-gray-400 hover:text-red-500 p-1 transition"><Trash2 size={13} /></button>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
