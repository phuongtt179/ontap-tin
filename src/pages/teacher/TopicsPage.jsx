import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useTopics } from '../../hooks/useTopics'
import { useGrades } from '../../hooks/useGrades'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, Check, X, Upload, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

// ─── Modal nhập hàng loạt ────────────────────────────────────────────────────
function TopicImportModal({ grades, existingTopics, defaultGrade, user, onClose, onDone }) {
  const [grade, setGrade] = useState(defaultGrade || grades[0] || '')
  const [text, setText] = useState('')
  const [rows, setRows] = useState(null)  // null = chưa parse, [] = đã parse
  const [saving, setSaving] = useState(false)

  function handleParse() {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
    if (!lines.length) { toast.error('Chưa nhập chủ đề nào'); return }
    const existingNames = new Set(
      existingTopics.filter(t => t.grade === grade).map(t => t.name.toLowerCase())
    )
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
  const dupRows = rows?.filter(r => r.isDup || r.isRepeat) || []

  async function handleSave() {
    if (!newRows.length) return
    setSaving(true)
    const inserts = newRows.map(r => ({ name: r.name, grade, created_by: user.id }))
    const { error } = await supabase.from('topics').insert(inserts)
    setSaving(false)
    if (error) toast.error('Lưu thất bại: ' + error.message)
    else { toast.success(`Đã thêm ${newRows.length} chủ đề`); onDone() }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-base font-bold text-gray-800">Nhập chủ đề hàng loạt</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-4">
          {/* Grade selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Khoá học</label>
            <select
              value={grade}
              onChange={e => { setGrade(e.target.value); setRows(null) }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {grades.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          {/* Textarea */}
          {rows === null ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Danh sách chủ đề
                <span className="ml-2 text-xs font-normal text-gray-400">mỗi dòng 1 chủ đề</span>
              </label>
              <textarea
                autoFocus
                value={text}
                onChange={e => setText(e.target.value)}
                rows={12}
                placeholder={`1. Nhập môn Python\n2. Biến và kiểu dữ liệu\n3. Câu lệnh điều kiện\n4. Vòng lặp\n5. Hàm`}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">
                Số thứ tự đầu dòng (1. 2. 3.) sẽ được giữ nguyên nếu bạn muốn, hoặc bỏ đi cũng được.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Summary */}
              <div className="flex gap-2 flex-wrap">
                <span className="flex items-center gap-1 text-sm bg-green-50 text-green-700 border border-green-200 px-3 py-1 rounded-full">
                  <CheckCircle2 size={14} /> {newRows.length} sẽ thêm
                </span>
                {dupRows.length > 0 && (
                  <span className="flex items-center gap-1 text-sm bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full">
                    <AlertCircle size={14} /> {dupRows.length} bỏ qua (trùng)
                  </span>
                )}
              </div>

              {/* Preview list */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                {rows.map((r, i) => (
                  <div key={i} className={`flex items-center gap-3 px-4 py-2.5 text-sm ${i > 0 ? 'border-t border-gray-100' : ''} ${r.isDup || r.isRepeat ? 'bg-amber-50' : 'bg-white'}`}>
                    {r.isDup || r.isRepeat
                      ? <AlertCircle size={14} className="text-amber-500 shrink-0" />
                      : <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                    }
                    <span className={`flex-1 ${r.isDup || r.isRepeat ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                      {r.name}
                    </span>
                    {r.isDup && <span className="text-xs text-amber-600">đã tồn tại</span>}
                    {r.isRepeat && !r.isDup && <span className="text-xs text-amber-600">trùng trong danh sách</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
          {rows !== null ? (
            <button onClick={() => setRows(null)} className="text-sm text-gray-500 hover:text-gray-700">
              ← Sửa lại
            </button>
          ) : (
            <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700">Hủy</button>
          )}

          {rows === null ? (
            <button
              onClick={handleParse}
              disabled={!text.trim()}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
            >
              Xem trước →
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving || newRows.length === 0}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Thêm {newRows.length} chủ đề
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

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

  useEffect(() => { if (gradeValues.length && !newGrade) setNewGrade(gradeValues[0]) }, [gradeValues])

  const displayed = filterGrade === 'all' ? topics : topics.filter(t => t.grade === filterGrade)

  async function handleAdd() {
    if (!newName.trim()) return
    const { error } = await supabase.from('topics').insert({ name: newName.trim(), grade: newGrade, created_by: user.id })
    if (error) {
      toast.error(error.message.includes('unique') ? 'Chủ đề đã tồn tại' : 'Thêm thất bại')
    } else {
      toast.success('Đã thêm chủ đề')
      setNewName('')
      setNewGrade('all')
      setAdding(false)
      refetch()
    }
  }

  async function handleUpdate(id) {
    if (!editName.trim()) return
    const { error } = await supabase.from('topics').update({ name: editName.trim(), grade: editGrade }).eq('id', id)
    if (error) toast.error('Cập nhật thất bại')
    else { toast.success('Đã cập nhật'); setEditId(null); refetch() }
  }

  async function handleDelete(id, name) {
    if (!confirm(`Xóa chủ đề "${name}"? Các câu hỏi thuộc chủ đề này sẽ không bị xóa.`)) return
    const { error } = await supabase.from('topics').delete().eq('id', id)
    if (error) toast.error('Xóa thất bại')
    else { toast.success('Đã xóa'); refetch() }
  }

  function startEdit(topic) {
    setEditId(topic.id)
    setEditName(topic.name)
    setEditGrade(topic.grade)
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
            <button
              onClick={() => setShowImport(true)}
              className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              <Upload size={15} /> Nhập hàng loạt
            </button>
            <button
              onClick={() => setAdding(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              <Plus size={16} /> Thêm chủ đề
            </button>
          </div>
        )}
      </div>

      {/* Grade filter tabs */}
      <div className="flex flex-wrap gap-2 mb-5">
        {GRADES.map(g => (
          <button
            key={g.value}
            onClick={() => setFilterGrade(g.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition ${
              filterGrade === g.value
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>

      {/* Add form */}
      {adding && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-4 flex items-center gap-3">
          <input
            autoFocus
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="Tên chủ đề..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <select
            value={newGrade}
            onChange={e => setNewGrade(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {GRADES.slice(1).map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
          </select>
          <button onClick={handleAdd} className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-lg transition">
            <Check size={16} />
          </button>
          <button onClick={() => { setAdding(false); setNewName('') }} className="text-gray-400 hover:text-gray-600 p-2">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Topic list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-indigo-600" />
        </div>
      ) : (
        <div className="space-y-2">
          {displayed.map(topic => (
            <div key={topic.id} className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3">
              {editId === topic.id ? (
                <>
                  <input
                    autoFocus
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleUpdate(topic.id)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <select
                    value={editGrade}
                    onChange={e => setEditGrade(e.target.value)}
                    className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {GRADES.slice(1).map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                  </select>
                  <button onClick={() => handleUpdate(topic.id)} className="text-green-600 hover:text-green-700 p-1">
                    <Check size={16} />
                  </button>
                  <button onClick={() => setEditId(null)} className="text-gray-400 hover:text-gray-600 p-1">
                    <X size={16} />
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm font-medium text-gray-800">{topic.name}</span>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    {topic.grade || '—'}
                  </span>
                  <button onClick={() => startEdit(topic)} className="text-gray-400 hover:text-indigo-600 p-1 transition">
                    <Pencil size={15} />
                  </button>
                  {canDelete && (
                    <button onClick={() => handleDelete(topic.id, topic.name)} className="text-gray-400 hover:text-red-500 p-1 transition">
                      <Trash2 size={15} />
                    </button>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {showImport && (
        <TopicImportModal
          grades={gradeValues}
          existingTopics={topics}
          defaultGrade={filterGrade !== 'all' ? filterGrade : gradeValues[0]}
          user={user}
          onClose={() => setShowImport(false)}
          onDone={() => { setShowImport(false); refetch() }}
        />
      )}
    </div>
  )
}
