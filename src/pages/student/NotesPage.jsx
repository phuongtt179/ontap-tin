import { useState, useEffect, useMemo } from 'react'
import { layGhiChuCuaEm, themGhiChu, suaGhiChu, xoaGhiChu } from '../../data/ghiChu'
import { layChuDe } from '../../data/chuDe'
import { layKhoaCuaEm } from '../../data/ghiDanh'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { Plus, Pin, PinOff, Pencil, Trash2, Search, X, Loader2, AlertTriangle, BookOpen } from 'lucide-react'
import { layBaiDaXuatBanCuaCacKhoa } from '../../data/baiHoc'

import NoteModal from '../../components/student/GhiChuModal'
import { colorOf } from '../../components/student/mauGhiChu'


// ── NoteCard ─────────────────────────────────────────────────
function NoteCard({ note, lessonsMap, onEdit, onDelete, onTogglePin }) {
  const c = colorOf(note.color)
  const lessonTitle = note.lesson_id ? lessonsMap[note.lesson_id] : null
  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-2 relative group ${c.bg} ${c.border}`}>
      {note.is_pinned && (
        <span className="absolute top-2 right-2 text-orange-500"><Pin size={14} /></span>
      )}
      {note.title && (
        <p className="font-semibold text-gray-800 text-sm pr-5 leading-snug">{note.title}</p>
      )}
      <p className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-6 flex-1">{note.content}</p>
      <div className="flex items-center gap-1.5 flex-wrap mt-1">
        {note.grade && (
          <span className="text-xs bg-indigo-100 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full font-medium">
            {note.grade}
          </span>
        )}
        {note.topic && (
          <span className="text-xs bg-white/60 border border-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
            {note.topic}
          </span>
        )}
        {lessonTitle && (
          <span className="text-xs bg-white/60 border border-indigo-200 text-indigo-600 px-2 py-0.5 rounded-full flex items-center gap-0.5">
            <BookOpen size={10} /> {lessonTitle}
          </span>
        )}
        <span className="text-xs text-gray-400 ml-auto">
          {new Date(note.updated_at).toLocaleDateString('vi-VN')}
        </span>
      </div>
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
  const [enrollments, setEnrollments] = useState([])
  const [topicsByGrade, setTopicsByGrade] = useState({})
  const [lessonsMap, setLessonsMap] = useState({})     // { lesson_id: title }
  const [filterLessons, setFilterLessons] = useState([]) // bài học cho filter
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterGrade, setFilterGrade] = useState('')
  const [filterTopic, setFilterTopic] = useState('')
  const [filterLesson, setFilterLesson] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editNote, setEditNote] = useState(null)

  useEffect(() => { loadNotes(); loadEnrollmentsAndTopics() }, [])

  async function loadNotes() {
    setLoading(true)
    const { data } = await layGhiChuCuaEm(user.id)
    setNotes(data || [])
    setLoading(false)
  }

  async function loadEnrollmentsAndTopics() {
    const { data: enrollData } = await layKhoaCuaEm(user.id)
    const enr = (enrollData || []).sort((a, b) => a.grade.localeCompare(b.grade, 'vi', { numeric: true }))
    setEnrollments(enr)

    const grades = enr.map(e => e.grade)
    if (!grades.length) return

    const [{ data: topicData }, { data: lessonData }] = await Promise.all([
      layChuDe(grades),
      layBaiDaXuatBanCuaCacKhoa(grades),
    ])

    const topicMap = {}
    ;(topicData || []).forEach(t => {
      if (!topicMap[t.grade]) topicMap[t.grade] = []
      topicMap[t.grade].push(t.name)
    })
    Object.keys(topicMap).forEach(g => topicMap[g].sort((a, b) => a.localeCompare(b, 'vi', { numeric: true })))
    setTopicsByGrade(topicMap)

    const lMap = {}
    ;(lessonData || []).forEach(l => { lMap[l.id] = l.title })
    setLessonsMap(lMap)
    setFilterLessons(lessonData || [])
  }

  async function handleSave(form) {
    if (editNote) {
      const { error } = await suaGhiChu(editNote.id, form)
      if (error) { toast.error('Lưu thất bại'); return }
      toast.success('Đã cập nhật')
    } else {
      const { error } = await themGhiChu({ ...form, user_id: user.id })
      if (error) { toast.error('Lưu thất bại'); return }
      toast.success('Đã thêm ghi chú')
    }
    setShowModal(false); setEditNote(null); loadNotes()
  }

  async function handleDelete(note) {
    if (!confirm('Xóa ghi chú này?')) return
    const { error } = await xoaGhiChu(note.id)
    if (error) { toast.error('Xóa thất bại'); return }
    setNotes(prev => prev.filter(n => n.id !== note.id))
  }

  async function handleTogglePin(note) {
    await suaGhiChu(note.id, { is_pinned: !note.is_pinned })
    loadNotes()
  }

  // Options cho filter chủ đề
  const filterTopicOptions = filterGrade
    ? (topicsByGrade[filterGrade] || [])
    : Object.values(topicsByGrade).flat().filter((v, i, a) => a.indexOf(v) === i)
        .sort((a, b) => a.localeCompare(b, 'vi', { numeric: true }))

  // Options cho filter bài học (lọc theo grade + topic nếu đã chọn)
  const filterLessonOptions = useMemo(() => {
    let list = filterLessons
    if (filterGrade) list = list.filter(l => l.grade === filterGrade)
    if (filterTopic) list = list.filter(l => l.topic === filterTopic)
    return list
  }, [filterLessons, filterGrade, filterTopic])

  const displayed = useMemo(() => {
    let list = notes
    if (filterGrade) list = list.filter(n => n.grade === filterGrade)
    if (filterTopic) list = list.filter(n => n.topic === filterTopic)
    if (filterLesson) list = list.filter(n => n.lesson_id === filterLesson)
    if (search) list = list.filter(n =>
      n.title?.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase())
    )
    return list
  }, [notes, search, filterGrade, filterTopic, filterLesson])

  const pinnedCount = notes.filter(n => n.is_pinned).length
  const hasFilter = search || filterGrade || filterTopic || filterLesson

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
        <button onClick={() => { setEditNote(null); setShowModal(true) }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
          <Plus size={16} /> Thêm ghi chú
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative w-full sm:w-auto">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm ghi chú..."
            className="pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-44" />
        </div>
        {enrollments.length > 1 && (
          <select value={filterGrade}
            onChange={e => { setFilterGrade(e.target.value); setFilterTopic(''); setFilterLesson('') }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">Tất cả khoá</option>
            {enrollments.map(e => <option key={e.grade} value={e.grade}>{e.grade}</option>)}
          </select>
        )}
        {filterTopicOptions.length > 0 && (
          <select value={filterTopic} onChange={e => { setFilterTopic(e.target.value); setFilterLesson('') }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">Tất cả chủ đề</option>
            {filterTopicOptions.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        )}
        {filterLessonOptions.length > 0 && (
          <select value={filterLesson} onChange={e => setFilterLesson(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">Tất cả bài học</option>
            {filterLessonOptions.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
          </select>
        )}
        {hasFilter && (
          <button onClick={() => { setSearch(''); setFilterGrade(''); setFilterTopic(''); setFilterLesson('') }}
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
            <NoteCard key={note.id} note={note} lessonsMap={lessonsMap}
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
          enrollments={enrollments}
          topicsByGrade={topicsByGrade}
          onClose={() => { setShowModal(false); setEditNote(null) }}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
