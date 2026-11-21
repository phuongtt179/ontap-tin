// Quản lý đơn vị (bài lớn) của 1 chủ đề: thêm 1 / nhập hàng loạt, sửa tên, xoá, chuyển lên / xuống, mở tiêu đề nhỏ.
import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, Check, X, Upload, CheckCircle2, AlertCircle, Loader2, List, ChevronUp, ChevronDown } from 'lucide-react'
import { layDonVi, demTieuDeTheoDonVi, themDonVi, suaDonVi, xoaDonVi, ghiThuTu } from '../../../data/chuDe'
import { docDanhSachTen, dongSeThem, doiCho } from '../../../domain/cayNoiDung'
import LessonTitleManagerModal from './QuanLyTieuDeModal'

export default function QuanLyDonViModal({ topic, user, canDelete, onClose }) {
  const [units, setUnits] = useState([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [editId, setEditId] = useState(null)
  const [editName, setEditName] = useState('')
  const [importText, setImportText] = useState('')
  const [importRows, setImportRows] = useState(null)
  const [showImport, setShowImport] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedUnit, setSelectedUnit] = useState(null) // for LessonTitleManagerModal
  const [titleCounts, setTitleCounts] = useState({}) // unitId → count

  useEffect(() => { fetchUnits() }, [])

  // Chỉ hiện vòng xoay khi đổi bộ lọc; lưu / xoá xong thì tải ngầm để giữ nguyên danh sách và vị trí đang xem
  const daTai = useRef(false)
  async function fetchUnits() {
    if (!daTai.current) { daTai.current = true; setLoading(true) }
    const { data } = await layDonVi(topic.grade, topic.name)
    setUnits(data || [])
    setLoading(false)
    // fetch lesson_title counts
    if (data?.length) {
      const ids = data.map(u => u.id)
      demTieuDeTheoDonVi(ids).then(({ data: dem }) => setTitleCounts(dem))
    }
  }

  async function handleAdd() {
    if (!newName.trim()) return
    const { error } = await themDonVi({
      name: newName.trim(), grade: topic.grade, topic: topic.name,
      sort_order: units.length, created_by: user.id,
    })
    if (error) toast.error(error.message.includes('unique') ? 'Bài đã tồn tại' : 'Thêm thất bại')
    else { toast.success('Đã thêm'); setNewName(''); setAdding(false); fetchUnits() }
  }

  async function handleUpdate(id) {
    if (!editName.trim()) return
    const { error } = await suaDonVi(id, { name: editName.trim() })
    if (error) toast.error('Cập nhật thất bại')
    else { toast.success('Đã cập nhật'); setEditId(null); fetchUnits() }
  }

  async function handleDelete(id, name) {
    if (!confirm(`Xóa bài "${name}"? Câu hỏi và bài học thuộc bài này sẽ không bị xóa.`)) return
    const { error } = await xoaDonVi(id)
    if (error) toast.error('Xóa thất bại')
    else { toast.success('Đã xóa'); fetchUnits() }
  }

  // Di chuyển lên/xuống (chèn giữa) — gán lại sort_order theo thứ tự mới
  async function handleMove(idx, dir) {
    const arr = doiCho(units, idx, dir)
    if (!arr) return
    setUnits(arr)
    await ghiThuTu('units', arr)
  }

  // Bulk import
  function handleParse() {
    const rows = docDanhSachTen(importText, units.map(u => u.name))
    if (!rows.length) { toast.error('Chưa nhập tên bài nào'); return }
    setImportRows(rows)
  }

  const newImportRows = dongSeThem(importRows)

  async function handleBulkSave() {
    if (!newImportRows.length) return
    setSaving(true)
    const inserts = newImportRows.map((r, i) => ({
      name: r.name, grade: topic.grade, topic: topic.name,
      sort_order: units.length + i, created_by: user.id,
    }))
    const { error } = await themDonVi(inserts)
    setSaving(false)
    if (error) toast.error('Lưu thất bại: ' + error.message)
    else {
      toast.success(`Đã thêm ${newImportRows.length} bài`)
      setShowImport(false); setImportText(''); setImportRows(null)
      fetchUnits()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-base font-bold text-gray-800">Danh sách bài — {topic.name}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{topic.grade} · {units.length} bài</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-auto p-5 space-y-4">
          {/* Toolbar */}
          {!showImport && (
            <div className="flex gap-2">
              <button onClick={() => setAdding(true)}
                className="flex items-center gap-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg transition">
                <Plus size={14} /> Thêm bài
              </button>
              <button onClick={() => setShowImport(true)}
                className="flex items-center gap-1.5 text-sm border border-gray-300 hover:bg-gray-50 text-gray-600 px-3 py-1.5 rounded-lg transition">
                <Upload size={14} /> Nhập hàng loạt
              </button>
            </div>
          )}

          {/* Add single */}
          {adding && (
            <div className="flex gap-2 items-center bg-indigo-50 border border-indigo-200 rounded-xl px-3 py-2">
              <input autoFocus value={newName} onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                placeholder="Tên bài (vd: Bài 1 - Nhân vật)..."
                className="flex-1 bg-transparent text-sm focus:outline-none" />
              <button onClick={handleAdd} className="text-green-600 hover:text-green-700 p-1"><Check size={15} /></button>
              <button onClick={() => { setAdding(false); setNewName('') }} className="text-gray-400 p-1"><X size={15} /></button>
            </div>
          )}

          {/* Bulk import */}
          {showImport && (
            <div className="space-y-3">
              {importRows === null ? (
                <>
                  <textarea autoFocus value={importText} onChange={e => setImportText(e.target.value)}
                    rows={8} placeholder={"Bài 1 - Nhân vật\nBài 2 - Sân khấu\nBài 3 - Chuyển động\nBài 4 - Âm thanh"}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => { setShowImport(false); setImportText('') }}
                      className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5">Hủy</button>
                    <button onClick={handleParse} disabled={!importText.trim()}
                      className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg disabled:opacity-50 transition">
                      Xem trước →
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex gap-2 flex-wrap">
                    <span className="flex items-center gap-1 text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded-full">
                      <CheckCircle2 size={12} /> {newImportRows.length} sẽ thêm
                    </span>
                    {importRows.filter(r => r.isDup || r.isRepeat).length > 0 && (
                      <span className="flex items-center gap-1 text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-1 rounded-full">
                        <AlertCircle size={12} /> {importRows.filter(r => r.isDup || r.isRepeat).length} bỏ qua
                      </span>
                    )}
                  </div>
                  <div className="border border-gray-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                    {importRows.map((r, i) => (
                      <div key={i} className={`flex items-center gap-2 px-3 py-2 text-sm ${i > 0 ? 'border-t border-gray-100' : ''} ${r.isDup || r.isRepeat ? 'bg-amber-50' : ''}`}>
                        {r.isDup || r.isRepeat
                          ? <AlertCircle size={13} className="text-amber-500 shrink-0" />
                          : <CheckCircle2 size={13} className="text-green-500 shrink-0" />}
                        <span className={`flex-1 ${r.isDup || r.isRepeat ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{r.name}</span>
                        {r.isDup && <span className="text-xs text-amber-600">đã tồn tại</span>}
                        {r.isRepeat && !r.isDup && <span className="text-xs text-amber-600">trùng</span>}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setImportRows(null)} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5">← Sửa lại</button>
                    <button onClick={handleBulkSave} disabled={saving || newImportRows.length === 0}
                      className="flex items-center gap-2 text-sm bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-lg disabled:opacity-50 transition">
                      {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                      Thêm {newImportRows.length} bài
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Unit list */}
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 size={22} className="animate-spin text-indigo-600" /></div>
          ) : units.length === 0 && !showImport && !adding ? (
            <div className="text-center py-8 text-gray-400 text-sm">Chưa có bài nào — bấm "Thêm bài" để bắt đầu</div>
          ) : (
            <div className="space-y-1.5">
              {units.map((u, idx) => (
                <div key={u.id} className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-5 shrink-0">{idx + 1}</span>
                  {editId === u.id ? (
                    <>
                      <input autoFocus value={editName} onChange={e => setEditName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleUpdate(u.id)}
                        className="flex-1 border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                      <button onClick={() => handleUpdate(u.id)} className="text-green-600 p-1"><Check size={14} /></button>
                      <button onClick={() => setEditId(null)} className="text-gray-400 p-1"><X size={14} /></button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-sm font-medium text-gray-800">{u.name}</span>
                      <div className="flex flex-col shrink-0 border border-gray-300 rounded-md overflow-hidden bg-white">
                        <button onClick={() => handleMove(idx, -1)} disabled={idx === 0}
                          className="px-1.5 py-0.5 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-30 leading-none" title="Chuyển lên"><ChevronUp size={14} /></button>
                        <button onClick={() => handleMove(idx, 1)} disabled={idx === units.length - 1}
                          className="px-1.5 py-0.5 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-30 leading-none border-t border-gray-200" title="Chuyển xuống"><ChevronDown size={14} /></button>
                      </div>
                      <button
                        onClick={() => setSelectedUnit(u)}
                        className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg border border-gray-200 text-gray-500 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 transition shrink-0"
                        title="Quản lý tiêu đề bài học"
                      >
                        <List size={11} />
                        {titleCounts[u.id] > 0 ? `${titleCounts[u.id]} tiêu đề` : 'Tiêu đề'}
                      </button>
                      <button onClick={() => { setEditId(u.id); setEditName(u.name) }}
                        className="text-gray-400 hover:text-indigo-600 p-1 transition"><Pencil size={13} /></button>
                      {canDelete && (
                        <button onClick={() => handleDelete(u.id, u.name)}
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
      {selectedUnit && (
        <LessonTitleManagerModal
          unit={selectedUnit} user={user} canDelete={canDelete}
          onClose={() => { setSelectedUnit(null); fetchUnits() }}
        />
      )}
    </div>
  )
}
