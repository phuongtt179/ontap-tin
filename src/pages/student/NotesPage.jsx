import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { Plus, Pin, PinOff, Pencil, Trash2, Search, X, Loader2, AlertTriangle, BookOpen } from 'lucide-react'

const COLORS = [
  { key: 'yellow',  bg: 'bg-yellow-100',  border: 'border-yellow-300',  ring: 'ring-yellow-400',  label: 'Vàng' },
  { key: 'green',   bg: 'bg-green-100',   border: 'border-green-300',   ring: 'ring-green-400',   label: 'Xanh lá' },
  { key: 'blue',    bg: 'bg-blue-100',    border: 'border-blue-300',    ring: 'ring-blue-400',    label: 'Xanh dương' },
  { key: 'pink',    bg: 'bg-pink-100',    border: 'border-pink-300',    ring: 'ring-pink-400',    label: 'Hồng' },
  { key: 'purple',  bg: 'bg-purple-100',  border: 'border-purple-300',  ring: 'ring-purple-400',  label: 'Tím' },
  { key: 'white',   bg: 'bg-white',       border: 'border-gray-300',    ring: 'ring-gray-400',    label: 'Trắng' },
]

function colorOf(key) {
  return COLORS.find(c => c.key === key) || COLORS[0]
}

// ── NoteModal ────────────────────────────────────────────────
function NoteModal({ note, topics, onClose, onSave }) {
  const [form, setForm] = useState({
    title: note?.title || '',
    content: note?.content || '',
    color: note?.color || 'yellow',
    topic: note?.topic || '',
  })
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!form.content.trim()) { toast.error('Nội dung không được trống'); return }
    setSaving(true)
    await onSave({ ...form, title: form.title.trim(), content: form.content.trim() })
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
            <input
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="Nhập tiêu đề..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          {/* Nội dung */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung</label>
            <textarea
              autoFocus={!note}
              value={form.content}
              onChange={e => setForm({ ...form, content: e.target.value })}
              placeholder="Ghi chú của bạn..."
              rows={6}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>
          {/* Chủ đề */}
          {topics.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chủ đề <span className="text-gray-400 font-normal">(tuỳ chọn)</span></label>
              <select
                value={form.topic}
                onChange={e => setForm({ ...form, topic: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- Không gắn chủ đề --</option>
                {topics.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          )}
          {/* Màu */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Màu thẻ</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button
                  key={c.key}
                  onClick={() => setForm({ ...form, color: c.key })}
                  title={c.label}
                  className={`w-8 h-8 rounded-full border-2 transition ${c.bg} ${form.color === c.key ? `ring-2 ring-offset-1 ${c.ring} border-transparent` : c.border}`}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Hủy</button>
          <button
            onClick={handleSave}
            disabled={saving || !form.content.trim()}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 transition"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            Lưu
          </button>
        </div>
      </div>
    </div>
  )
}

// ── NoteCard ─────────────────────────────────────────────────
function NoteCard({ note, onEdit, onDelete, onTogglePin }) {
  const c = colorOf(note.color)
  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-2 relative group ${c.bg} ${c.border}`}>
      {/* Pin badge */}
      {note.is_pinned && (
        <span className="absolute top-2 right-2 text-orange-500"><Pin size={14} /></span>
      )}
      {/* Title */}
      {note.title && (
        <p className="font-semibold text-gray-800 text-sm pr-5 leading-snug">{note.title}</p>
      )}
      {/* Content */}
      <p className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-6 flex-1">{note.content}</p>
      {/* Topic + date */}
      <div className="flex items-center gap-2 flex-wrap mt-1">
        {note.topic && (
          <span className="text-xs bg-white/60 border border-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
            {note.topic}
          </span>
        )}
        <span className="text-xs text-gray-400 ml-auto">
          {new Date(note.updated_at).toLocaleDateString('vi-VN')}
        </span>
      </div>
      {/* Actions — hiện khi hover */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition border-t border-black/10 pt-2 mt-1">
        <button onClick={() => onTogglePin(note)} title={note.is_pinned ? 'Bỏ ghim' : 'Ghim'}
          className="p-1.5 rounded-lg hover:bg-black/10 text-gray-500 hover:text-orange-500 transition">
          {note.is_pinned ? <PinOff size={14} /> : <Pin size={14} />}
        </button>
        <button onClick={() => onEdit(note)} title="Sửa"
          className="p-1.5 rounded-lg hover:bg-black/10 text-gray-500 hover:text-indigo-600 transition">
          <Pencil size={14} />
        </button>
        <button onClick={() => onDelete(note)} title="Xóa"
          className="p-1.5 rounded-lg hover:bg-black/10 text-gray-500 hover:text-red-500 transition ml-auto">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────
export default function NotesPage() {
  const { user, profile } = useAuth()
  const [notes, setNotes] = useState([])
  const [topics, setTopics] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterTopic, setFilterTopic] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editNote, setEditNote] = useState(null)

  useEffect(() => { loadNotes(); loadTopics() }, [])

  async function loadNotes() {
    setLoading(true)
    const { data } = await supabase
      .from('student_notes')
      .select('*')
      .eq('user_id', user.id)
      .order('is_pinned', { ascending: false })
      .order('updated_at', { ascending: false })
    setNotes(data || [])
    setLoading(false)
  }

  async function loadTopics() {
    const enrollments = await supabase
      .from('student_enrollments').select('grade').eq('user_id', user.id).eq('is_approved', true)
    const grades = (enrollments.data || []).map(e => e.grade)
    if (!grades.length) return
    const { data } = await supabase.from('topics').select('name').in('grade', grades)
    setTopics((data || []).map(t => t.name).sort((a, b) => a.localeCompare(b, 'vi', { numeric: true })))
  }

  async function handleSave(form) {
    if (editNote) {
      const { error } = await supabase.from('student_notes')
        .update({ ...form, updated_at: new Date().toISOString() })
        .eq('id', editNote.id)
      if (error) { toast.error('Lưu thất bại'); return }
      toast.success('Đã cập nhật')
    } else {
      const { error } = await supabase.from('student_notes')
        .insert({ ...form, user_id: user.id })
      if (error) { toast.error('Lưu thất bại'); return }
      toast.success('Đã thêm ghi chú')
    }
    setShowModal(false)
    setEditNote(null)
    loadNotes()
  }

  async function handleDelete(note) {
    if (!confirm('Xóa ghi chú này?')) return
    const { error } = await supabase.from('student_notes').delete().eq('id', note.id)
    if (error) { toast.error('Xóa thất bại'); return }
    setNotes(prev => prev.filter(n => n.id !== note.id))
  }

  async function handleTogglePin(note) {
    const { error } = await supabase.from('student_notes')
      .update({ is_pinned: !note.is_pinned, updated_at: new Date().toISOString() })
      .eq('id', note.id)
    if (error) return
    loadNotes()
  }

  const displayed = useMemo(() => {
    let list = notes
    if (filterTopic) list = list.filter(n => n.topic === filterTopic)
    if (search) list = list.filter(n =>
      n.title?.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase())
    )
    return list
  }, [notes, search, filterTopic])

  const pinnedCount = notes.filter(n => n.is_pinned).length

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      {/* Warning banner */}
      {profile?.notes_warning && (
        <div className="mb-6 flex items-start gap-3 bg-amber-50 border border-amber-300 rounded-xl px-5 py-4">
          <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Cảnh báo từ giáo viên</p>
            <p className="text-sm text-amber-700 mt-0.5">{profile.notes_warning}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Sổ ghi chú</h1>
          <p className="text-gray-400 text-sm mt-0.5">{notes.length} ghi chú{pinnedCount > 0 ? ` · ${pinnedCount} đã ghim` : ''}</p>
        </div>
        <button
          onClick={() => { setEditNote(null); setShowModal(true) }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          <Plus size={16} /> Thêm ghi chú
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm ghi chú..."
            className="pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-44"
          />
        </div>
        {topics.length > 0 && (
          <select
            value={filterTopic}
            onChange={e => setFilterTopic(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Tất cả chủ đề</option>
            {topics.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        )}
        {(search || filterTopic) && (
          <button onClick={() => { setSearch(''); setFilterTopic('') }}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
            <X size={14} /> Xóa bộ lọc
          </button>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-lg">{notes.length === 0 ? 'Chưa có ghi chú nào' : 'Không tìm thấy ghi chú'}</p>
          {notes.length === 0 && <p className="text-sm mt-1">Bấm "Thêm ghi chú" để bắt đầu</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayed.map(note => (
            <NoteCard
              key={note.id}
              note={note}
              onEdit={n => { setEditNote(n); setShowModal(true) }}
              onDelete={handleDelete}
              onTogglePin={handleTogglePin}
            />
          ))}
        </div>
      )}

      {showModal && (
        <NoteModal
          note={editNote}
          topics={topics}
          onClose={() => { setShowModal(false); setEditNote(null) }}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
