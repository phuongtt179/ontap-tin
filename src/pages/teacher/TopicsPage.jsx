import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useTopics } from '../../hooks/useTopics'
import { useGrades } from '../../hooks/useGrades'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, Check, X, Upload, CheckCircle2, AlertCircle, Loader2, BookOpen, List, ChevronUp, ChevronDown } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

// ─── Modal quản lý tiêu đề bài học nhỏ bên trong 1 bài (unit) ────────────────
function LessonTitleManagerModal({ unit, user, canDelete, onClose }) {
  const [titles, setTitles] = useState([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [editId, setEditId] = useState(null)
  const [editName, setEditName] = useState('')

  useEffect(() => { fetchTitles() }, [])

  async function fetchTitles() {
    setLoading(true)
    const { data } = await supabase
      .from('lesson_titles')
      .select('*')
      .eq('unit_id', unit.id)
      .order('sort_order')
      .order('name')
    setTitles(data || [])
    setLoading(false)
  }

  async function handleAdd() {
    if (!newName.trim()) return
    const { error } = await supabase.from('lesson_titles').insert({
      name: newName.trim(), unit_id: unit.id,
      sort_order: titles.length, created_by: user.id,
    })
    if (error) toast.error(error.message.includes('unique') ? 'Tiêu đề đã tồn tại' : 'Thêm thất bại')
    else { toast.success('Đã thêm'); setNewName(''); setAdding(false); fetchTitles() }
  }

  async function handleUpdate(id) {
    if (!editName.trim()) return
    const { error } = await supabase.from('lesson_titles').update({ name: editName.trim() }).eq('id', id)
    if (error) toast.error('Cập nhật thất bại')
    else { toast.success('Đã cập nhật'); setEditId(null); fetchTitles() }
  }

  async function handleDelete(id, name) {
    if (!confirm(`Xóa tiêu đề "${name}"? Câu hỏi và bài học liên kết sẽ không bị xóa.`)) return
    const { error } = await supabase.from('lesson_titles').delete().eq('id', id)
    if (error) toast.error('Xóa thất bại')
    else { toast.success('Đã xóa'); fetchTitles() }
  }

  // Di chuyển lên/xuống (chèn giữa) — gán lại sort_order theo thứ tự mới
  async function handleMove(idx, dir) {
    const j = idx + dir
    if (j < 0 || j >= titles.length) return
    const arr = [...titles]
    ;[arr[idx], arr[j]] = [arr[j], arr[idx]]
    setTitles(arr)
    await Promise.all(
      arr.map((t, i) => t.sort_order === i ? null : supabase.from('lesson_titles').update({ sort_order: i }).eq('id', t.id)).filter(Boolean)
    )
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

// ─── Modal quản lý bài (units) của 1 chủ đề ──────────────────────────────────
function UnitManagerModal({ topic, user, canDelete, onClose }) {
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

  async function fetchUnits() {
    setLoading(true)
    const { data } = await supabase
      .from('units')
      .select('*')
      .eq('grade', topic.grade)
      .eq('topic', topic.name)
      .order('sort_order')
      .order('name')
    setUnits(data || [])
    setLoading(false)
    // fetch lesson_title counts
    if (data?.length) {
      const ids = data.map(u => u.id)
      supabase.from('lesson_titles').select('unit_id').in('unit_id', ids).then(({ data: lt }) => {
        const counts = {}
        ;(lt || []).forEach(r => { counts[r.unit_id] = (counts[r.unit_id] || 0) + 1 })
        setTitleCounts(counts)
      })
    }
  }

  async function handleAdd() {
    if (!newName.trim()) return
    const { error } = await supabase.from('units').insert({
      name: newName.trim(), grade: topic.grade, topic: topic.name,
      sort_order: units.length, created_by: user.id,
    })
    if (error) toast.error(error.message.includes('unique') ? 'Bài đã tồn tại' : 'Thêm thất bại')
    else { toast.success('Đã thêm'); setNewName(''); setAdding(false); fetchUnits() }
  }

  async function handleUpdate(id) {
    if (!editName.trim()) return
    const { error } = await supabase.from('units').update({ name: editName.trim() }).eq('id', id)
    if (error) toast.error('Cập nhật thất bại')
    else { toast.success('Đã cập nhật'); setEditId(null); fetchUnits() }
  }

  async function handleDelete(id, name) {
    if (!confirm(`Xóa bài "${name}"? Câu hỏi và bài học thuộc bài này sẽ không bị xóa.`)) return
    const { error } = await supabase.from('units').delete().eq('id', id)
    if (error) toast.error('Xóa thất bại')
    else { toast.success('Đã xóa'); fetchUnits() }
  }

  // Di chuyển lên/xuống (chèn giữa) — gán lại sort_order theo thứ tự mới
  async function handleMove(idx, dir) {
    const j = idx + dir
    if (j < 0 || j >= units.length) return
    const arr = [...units]
    ;[arr[idx], arr[j]] = [arr[j], arr[idx]]
    setUnits(arr)
    await Promise.all(
      arr.map((u, i) => u.sort_order === i ? null : supabase.from('units').update({ sort_order: i }).eq('id', u.id)).filter(Boolean)
    )
  }

  // Bulk import
  function handleParse() {
    const lines = importText.split('\n').map(l => l.trim()).filter(Boolean)
    if (!lines.length) { toast.error('Chưa nhập tên bài nào'); return }
    const existingSet = new Set(units.map(u => u.name.toLowerCase()))
    const seen = new Set()
    const rows = lines.map(name => {
      const lower = name.toLowerCase()
      const isDup = existingSet.has(lower)
      const isRepeat = seen.has(lower)
      seen.add(lower)
      return { name, isDup, isRepeat }
    })
    setImportRows(rows)
  }

  const newImportRows = importRows?.filter(r => !r.isDup && !r.isRepeat) || []

  async function handleBulkSave() {
    if (!newImportRows.length) return
    setSaving(true)
    const inserts = newImportRows.map((r, i) => ({
      name: r.name, grade: topic.grade, topic: topic.name,
      sort_order: units.length + i, created_by: user.id,
    }))
    const { error } = await supabase.from('units').insert(inserts)
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

// ─── Modal nhập chủ đề hàng loạt ─────────────────────────────────────────────
function TopicImportModal({ grades, existingTopics, defaultGrade, user, onClose, onDone }) {
  const [grade, setGrade] = useState(defaultGrade || grades[0] || '')
  const [text, setText] = useState('')
  const [rows, setRows] = useState(null)
  const [saving, setSaving] = useState(false)

  function handleParse() {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
    if (!lines.length) { toast.error('Chưa nhập chủ đề nào'); return }
    const existingNames = new Set(existingTopics.filter(t => t.grade === grade).map(t => t.name.toLowerCase()))
    const seen = new Set()
    const parsed = lines.map(name => {
      const lower = name.toLowerCase()
      const isDup = existingNames.has(lower)
      const isRepeat = seen.has(lower)
      seen.add(lower)
      return { name, isDup, isRepeat }
    })
    setRows(parsed)
  }

  const newRows = rows?.filter(r => !r.isDup && !r.isRepeat) || []

  async function handleSave() {
    if (!newRows.length) return
    setSaving(true)
    const { error } = await supabase.from('topics').insert(newRows.map(r => ({ name: r.name, grade, created_by: user.id })))
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

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function TopicsPage() {
  const { canDelete, user } = useAuth()
  const { topics, loading, refetch } = useTopics()
  const { grades: gradeValues } = useGrades()
  const GRADES = [{ value: 'all', label: 'Tất cả khoá' }, ...gradeValues.map(g => ({ value: g, label: g }))]

  const [filterGrade, setFilterGrade] = useState('all')
  const [newName, setNewName] = useState('')
  const [newGrade, setNewGrade] = useState('')
  const [adding, setAdding] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [editId, setEditId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editGrade, setEditGrade] = useState('')
  const [editOldName, setEditOldName] = useState('')
  const [editOldGrade, setEditOldGrade] = useState('')
  const [unitTopic, setUnitTopic] = useState(null) // topic object for UnitManagerModal
  const [unitCounts, setUnitCounts] = useState({}) // topicName+grade → count

  useEffect(() => { if (gradeValues.length && !newGrade) setNewGrade(gradeValues[0]) }, [gradeValues])

  // Fetch unit counts for all topics
  useEffect(() => {
    if (topics.length === 0) return
    supabase.from('units').select('grade, topic').then(({ data }) => {
      const counts = {}
      ;(data || []).forEach(u => {
        const key = `${u.grade}||${u.topic}`
        counts[key] = (counts[key] || 0) + 1
      })
      setUnitCounts(counts)
    })
  }, [topics])

  const displayed = filterGrade === 'all' ? topics : topics.filter(t => t.grade === filterGrade)

  async function handleAdd() {
    if (!newName.trim()) return
    const { error } = await supabase.from('topics').insert({ name: newName.trim(), grade: newGrade, created_by: user.id })
    if (error) toast.error(error.message.includes('unique') ? 'Chủ đề đã tồn tại' : 'Thêm thất bại')
    else { toast.success('Đã thêm chủ đề'); setNewName(''); setAdding(false); refetch() }
  }

  async function handleUpdate(id) {
    if (!editName.trim()) return
    const newName = editName.trim()
    const newGrade = editGrade
    const { error } = await supabase.from('topics').update({ name: newName, grade: newGrade }).eq('id', id)
    if (error) { toast.error('Cập nhật thất bại'); return }
    const cascades = []
    if (newName !== editOldName) {
      cascades.push(
        supabase.from('lessons').update({ topic: newName }).eq('topic', editOldName).eq('grade', editOldGrade),
        supabase.from('units').update({ topic: newName }).eq('topic', editOldName).eq('grade', editOldGrade),
        supabase.from('questions').update({ topic: newName }).eq('topic', editOldName).eq('grade', editOldGrade),
      )
    }
    if (newGrade !== editOldGrade) {
      cascades.push(
        supabase.from('units').update({ grade: newGrade }).eq('topic', newName).eq('grade', editOldGrade),
      )
    }
    if (cascades.length) await Promise.all(cascades)
    toast.success('Đã cập nhật')
    setEditId(null)
    refetch()
  }

  async function handleDelete(id, name) {
    if (!confirm(`Xóa chủ đề "${name}"? Các câu hỏi và bài học thuộc chủ đề này sẽ không bị xóa.`)) return
    const { error } = await supabase.from('topics').delete().eq('id', id)
    if (error) toast.error('Xóa thất bại')
    else { toast.success('Đã xóa'); refetch() }
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Chủ đề</h1>
          <p className="text-gray-400 text-sm mt-0.5">{displayed.length} chủ đề</p>
        </div>
        {!adding && (
          <div className="flex gap-2">
            <button onClick={() => setShowImport(true)}
              className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium transition">
              <Upload size={15} /> Nhập hàng loạt
            </button>
            <button onClick={() => setAdding(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
              <Plus size={16} /> Thêm chủ đề
            </button>
          </div>
        )}
      </div>

      {/* Grade filter tabs */}
      <div className="flex flex-wrap gap-2 mb-5">
        {GRADES.map(g => (
          <button key={g.value} onClick={() => setFilterGrade(g.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition ${filterGrade === g.value ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {g.label}
          </button>
        ))}
      </div>

      {/* Add single topic */}
      {adding && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-4 flex items-center gap-3">
          <input autoFocus value={newName} onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="Tên chủ đề..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <select value={newGrade} onChange={e => setNewGrade(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            {GRADES.slice(1).map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
          </select>
          <button onClick={handleAdd} className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-lg"><Check size={16} /></button>
          <button onClick={() => { setAdding(false); setNewName('') }} className="text-gray-400 hover:text-gray-600 p-2"><X size={16} /></button>
        </div>
      )}

      {/* Topic list */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-7 w-7 border-b-2 border-indigo-600" /></div>
      ) : (
        <div className="space-y-2">
          {displayed.map(topic => {
            const unitCount = unitCounts[`${topic.grade}||${topic.name}`] || 0
            return (
              <div key={topic.id} className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3">
                {editId === topic.id ? (
                  <>
                    <input autoFocus value={editName} onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleUpdate(topic.id, topic.name, topic.grade)}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    <select value={editGrade} onChange={e => setEditGrade(e.target.value)}
                      className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      {GRADES.slice(1).map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                    </select>
                    <button onClick={() => handleUpdate(topic.id, topic.name, topic.grade)} className="text-green-600 hover:text-green-700 p-1"><Check size={16} /></button>
                    <button onClick={() => setEditId(null)} className="text-gray-400 hover:text-gray-600 p-1"><X size={16} /></button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm font-medium text-gray-800">{topic.name}</span>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{topic.grade}</span>
                    {/* Unit count badge + manage button */}
                    <button
                      onClick={() => setUnitTopic(topic)}
                      className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border transition
                        hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 border-gray-200 text-gray-500"
                      title="Quản lý danh sách bài"
                    >
                      <BookOpen size={12} />
                      {unitCount > 0 ? `${unitCount} bài` : 'Thêm bài'}
                    </button>
                    <button onClick={() => { setEditId(topic.id); setEditName(topic.name); setEditGrade(topic.grade); setEditOldName(topic.name); setEditOldGrade(topic.grade) }}
                      className="text-gray-400 hover:text-indigo-600 p-1 transition"><Pencil size={15} /></button>
                    {canDelete && (
                      <button onClick={() => handleDelete(topic.id, topic.name)}
                        className="text-gray-400 hover:text-red-500 p-1 transition"><Trash2 size={15} /></button>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}

      {showImport && (
        <TopicImportModal grades={gradeValues} existingTopics={topics}
          defaultGrade={filterGrade !== 'all' ? filterGrade : gradeValues[0]}
          user={user} onClose={() => setShowImport(false)}
          onDone={() => { setShowImport(false); refetch() }} />
      )}

      {unitTopic && (
        <UnitManagerModal topic={unitTopic} user={user} canDelete={canDelete}
          onClose={() => { setUnitTopic(null); /* refresh unit counts */ supabase.from('units').select('grade, topic').then(({ data }) => {
            const counts = {}
            ;(data || []).forEach(u => { const key = `${u.grade}||${u.topic}`; counts[key] = (counts[key] || 0) + 1 })
            setUnitCounts(counts)
          }) }} />
      )}
    </div>
  )
}
