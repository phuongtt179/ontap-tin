// Quản lý khoá học của 1 học sinh: xem / huỷ ghi danh đang có, thêm vào khoá khác (chọn ca nếu có).
import { useState } from 'react'
import toast from 'react-hot-toast'
import { X, Loader2, UserCheck } from 'lucide-react'
import { ghiDanhHocSinh, xoaGhiDanh } from '../../../data/ghiDanh'

export default function GhiDanhModal({ student, classes, gradeValues, onDone }) {
  const [enrollments, setEnrollments] = useState(student.enrollments || [])
  const [selected, setSelected] = useState({}) // grade → className
  const [saving, setSaving] = useState(false)
  const [removingId, setRemovingId] = useState(null)

  const enrolledGrades = new Set(enrollments.map(e => e.grade))
  const unenrolledGrades = gradeValues.filter(g => !enrolledGrades.has(g))

  function toggleGrade(grade) {
    setSelected(prev => {
      const next = { ...prev }
      if (next[grade] !== undefined) delete next[grade]
      else next[grade] = ''
      return next
    })
  }

  async function handleRemove(enrollment) {
    if (!confirm(`Hủy khoá "${enrollment.grade}" của ${student.full_name}?`)) return
    setRemovingId(enrollment.id)
    const { error } = await xoaGhiDanh(enrollment.id)
    setRemovingId(null)
    if (error) { toast.error('Hủy thất bại: ' + error.message); return }
    setEnrollments(prev => prev.filter(e => e.id !== enrollment.id))
    toast.success(`Đã hủy khoá ${enrollment.grade}`)
  }

  async function handleAdd() {
    const toAdd = Object.entries(selected)
    if (!toAdd.length) return
    setSaving(true)
    const rows = toAdd.map(([grade, className]) => ({
      user_id: student.id, grade,
      class_name: className || null,
      is_approved: true,
    }))
    const { data, error } = await ghiDanhHocSinh(rows)
    setSaving(false)
    if (error) { toast.error('Thêm thất bại: ' + error.message); return }
    setEnrollments(prev => [...prev, ...(data || [])])
    setSelected({})
    toast.success(`Đã thêm ${toAdd.length} khoá cho ${student.full_name}`)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
          <h2 className="text-base font-bold text-gray-800">Quản lý khoá học</h2>
          <button onClick={onDone} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          <p className="text-sm text-gray-600">Học sinh: <strong>{student.full_name}</strong></p>

          {/* Current enrollments */}
          {enrollments.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Đang tham gia</p>
              <div className="space-y-2">
                {enrollments.map(e => (
                  <div key={e.id}
                    className="flex items-center justify-between px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-gray-800">{e.grade}</span>
                      {e.class_name && <span className="text-xs text-gray-400 ml-1.5">· {e.class_name}</span>}
                      {!e.is_approved && (
                        <span className="text-xs text-amber-500 ml-1.5">(chờ duyệt)</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemove(e)}
                      disabled={removingId === e.id}
                      className="shrink-0 ml-2 text-gray-300 hover:text-red-500 transition p-1"
                      title="Hủy khoá này"
                    >
                      {removingId === e.id
                        ? <Loader2 size={14} className="animate-spin" />
                        : <X size={14} />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add to more courses */}
          {unenrolledGrades.length > 0 ? (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Thêm vào khoá</p>
              <div className="space-y-2">
                {unenrolledGrades.map(g => {
                  const isChecked = selected[g] !== undefined
                  const gradeClasses = classes.filter(c => c.grade === g)
                  return (
                    <div key={g}>
                      <label className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border cursor-pointer transition
                        ${isChecked ? 'bg-indigo-50 border-indigo-300' : 'bg-gray-50 border-gray-200 hover:border-indigo-200 hover:bg-indigo-50/50'}`}>
                        <input type="checkbox" checked={isChecked} onChange={() => toggleGrade(g)}
                          className="w-4 h-4 accent-indigo-600 shrink-0" />
                        <span className="text-sm font-medium text-gray-800">{g}</span>
                      </label>
                      {isChecked && gradeClasses.length > 0 && (
                        <select
                          value={selected[g]}
                          onChange={e => setSelected(prev => ({ ...prev, [g]: e.target.value }))}
                          className="mt-1 w-full border border-indigo-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white pl-8"
                        >
                          <option value="">-- Không chọn ca --</option>
                          {gradeClasses.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                        </select>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ) : enrollments.length > 0 ? (
            <p className="text-xs text-gray-400 text-center py-2">Đã tham gia tất cả khoá học</p>
          ) : (
            <p className="text-xs text-gray-400 text-center py-4">Chưa có khoá học nào trong hệ thống</p>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t shrink-0">
          <button onClick={onDone} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">
            Đóng
          </button>
          {Object.keys(selected).length > 0 && (
            <button onClick={handleAdd} disabled={saving}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 transition">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <UserCheck size={14} />}
              Thêm {Object.keys(selected).length} khoá
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
