import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { Trash2, AlertTriangle, Search, X, BookOpen, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { useGrades } from '../../hooks/useGrades'

const COLOR_BG = {
  yellow: 'bg-yellow-100 border-yellow-300',
  green:  'bg-green-100 border-green-300',
  blue:   'bg-blue-100 border-blue-300',
  pink:   'bg-pink-100 border-pink-300',
  purple: 'bg-purple-100 border-purple-300',
  white:  'bg-white border-gray-200',
}

// ── WarnModal ────────────────────────────────────────────────
function WarnModal({ student, onClose, onSave }) {
  const [msg, setMsg] = useState(student.notes_warning || '')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    const { error } = await supabase.from('profiles')
      .update({ notes_warning: msg.trim() || null })
      .eq('id', student.id)
    setSaving(false)
    if (error) { toast.error('Lưu thất bại'); return }
    toast.success(msg.trim() ? 'Đã gửi cảnh báo' : 'Đã xóa cảnh báo')
    onSave()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-base font-bold text-gray-800">Gửi cảnh báo</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-3">
          <p className="text-sm text-gray-600">Học sinh: <strong>{student.full_name}</strong></p>
          <textarea
            autoFocus
            value={msg}
            onChange={e => setMsg(e.target.value)}
            rows={4}
            placeholder="Nhập nội dung cảnh báo... (để trống để xóa cảnh báo hiện tại)"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
          />
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Hủy</button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-amber-500 hover:bg-amber-600 text-white rounded-lg disabled:opacity-50 transition">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <AlertTriangle size={14} />}
            {msg.trim() ? 'Gửi cảnh báo' : 'Xóa cảnh báo'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────
export default function StudentNotesPage() {
  const { grades: gradeValues } = useGrades()
  const [notes, setNotes] = useState([])        // { ...note, student: { full_name, ... } }
  const [students, setStudents] = useState([])
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterGrade, setFilterGrade] = useState('')
  const [filterClass, setFilterClass] = useState('')
  const [search, setSearch] = useState('')
  const [warnTarget, setWarnTarget] = useState(null)
  const [expanded, setExpanded] = useState({})  // noteId → bool

  useEffect(() => { loadAll() }, [filterGrade, filterClass])

  async function loadAll() {
    setLoading(true)

    // Lấy danh sách học sinh (filter theo grade/class nếu có)
    let enrollQ = supabase.from('student_enrollments')
      .select('user_id, class_name, grade, profiles(id, full_name, notes_warning)')
      .eq('is_approved', true)
    if (filterGrade) enrollQ = enrollQ.eq('grade', filterGrade)
    if (filterClass) enrollQ = enrollQ.eq('class_name', filterClass)
    const { data: enrollData } = await enrollQ

    const studentMap = {}
    ;(enrollData || []).forEach(e => {
      if (!e.profiles) return
      studentMap[e.profiles.id] = {
        id: e.profiles.id,
        full_name: e.profiles.full_name,
        notes_warning: e.profiles.notes_warning,
        class_name: e.class_name,
        grade: e.grade,
      }
    })
    const studentList = Object.values(studentMap).sort((a, b) =>
      (a.class_name || '').localeCompare(b.class_name || '') || a.full_name.localeCompare(b.full_name)
    )
    setStudents(studentList)

    // Classes dropdown
    const cls = [...new Set((enrollData || []).map(e => e.class_name).filter(Boolean))].sort()
    setClasses(cls)

    // Lấy notes của học sinh này
    const ids = studentList.map(s => s.id)
    if (ids.length === 0) { setNotes([]); setLoading(false); return }

    const { data: notesData } = await supabase
      .from('student_notes').select('*').in('user_id', ids)
      .order('updated_at', { ascending: false })

    const enriched = (notesData || []).map(n => ({
      ...n,
      student: studentMap[n.user_id] || null,
    })).filter(n => n.student)

    setNotes(enriched)
    setLoading(false)
  }

  async function handleDelete(note) {
    if (!confirm(`Xóa ghi chú của "${note.student?.full_name}"?`)) return
    const { error } = await supabase.from('student_notes').delete().eq('id', note.id)
    if (error) { toast.error('Xóa thất bại'); return }
    toast.success('Đã xóa ghi chú')
    setNotes(prev => prev.filter(n => n.id !== note.id))
  }

  const filteredClasses = filterGrade
    ? classes.filter(c => {
        const s = students.find(st => st.class_name === c)
        return s?.grade === filterGrade
      })
    : classes

  const displayed = notes.filter(n => {
    if (!search) return true
    const q = search.toLowerCase()
    return n.title?.toLowerCase().includes(q) ||
      n.content.toLowerCase().includes(q) ||
      n.student?.full_name.toLowerCase().includes(q)
  })

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Sổ ghi chú học sinh</h1>
          <p className="text-gray-400 text-sm mt-0.5">{notes.length} ghi chú · {students.length} học sinh</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Tìm học sinh / nội dung..."
            className="pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-52" />
        </div>
        <select value={filterGrade} onChange={e => { setFilterGrade(e.target.value); setFilterClass('') }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">Tất cả khoá</option>
          {gradeValues.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        <select value={filterClass} onChange={e => setFilterClass(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">Tất cả lớp</option>
          {filteredClasses.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        {(search || filterGrade || filterClass) && (
          <button onClick={() => { setSearch(''); setFilterGrade(''); setFilterClass('') }}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
            <X size={14} /> Xóa bộ lọc
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-lg">Chưa có ghi chú nào</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map(note => {
            const colorClass = COLOR_BG[note.color] || COLOR_BG.white
            const isExpanded = expanded[note.id]
            const isLong = note.content.length > 200
            return (
              <div key={note.id} className={`rounded-xl border p-4 ${colorClass}`}>
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center shrink-0">
                    {note.student?.full_name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    {/* Student info */}
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-gray-800 text-sm">{note.student?.full_name}</span>
                      <span className="text-xs text-gray-400">{note.student?.class_name || note.student?.grade}</span>
                      {note.student?.notes_warning && (
                        <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                          <AlertTriangle size={10} /> Đang bị cảnh báo
                        </span>
                      )}
                      <span className="text-xs text-gray-400 ml-auto">
                        {new Date(note.updated_at).toLocaleString('vi-VN')}
                      </span>
                    </div>
                    {/* Title */}
                    {note.title && <p className="font-medium text-gray-800 text-sm mb-1">{note.title}</p>}
                    {/* Content */}
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {isLong && !isExpanded ? note.content.slice(0, 200) + '…' : note.content}
                    </p>
                    {isLong && (
                      <button onClick={() => setExpanded(p => ({ ...p, [note.id]: !isExpanded }))}
                        className="flex items-center gap-0.5 text-xs text-indigo-500 hover:underline mt-1">
                        {isExpanded ? <><ChevronUp size={12} /> Thu gọn</> : <><ChevronDown size={12} /> Xem thêm</>}
                      </button>
                    )}
                    {/* Topic */}
                    {note.topic && (
                      <span className="inline-block mt-2 text-xs bg-white/60 border border-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                        {note.topic}
                      </span>
                    )}
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => setWarnTarget(note.student)}
                      title="Gửi cảnh báo"
                      className="p-1.5 rounded-lg hover:bg-black/10 text-amber-500 hover:text-amber-700 transition">
                      <AlertTriangle size={15} />
                    </button>
                    <button onClick={() => handleDelete(note)}
                      title="Xóa ghi chú"
                      className="p-1.5 rounded-lg hover:bg-black/10 text-gray-400 hover:text-red-500 transition">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {warnTarget && (
        <WarnModal
          student={warnTarget}
          onClose={() => setWarnTarget(null)}
          onSave={() => { setWarnTarget(null); loadAll() }}
        />
      )}
    </div>
  )
}
