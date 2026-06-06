import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useGrades } from '../../hooks/useGrades'
import toast from 'react-hot-toast'
import {
  CheckSquare, Clock, Users, X, Loader2,
  CheckCircle2, XCircle, PlayCircle, StopCircle,
  ChevronRight, Calendar,
} from 'lucide-react'

// ─── Chi tiết điểm danh một học sinh ─────────────────────────────────────────
function StudentDetailModal({ student, sessions, records, onClose }) {
  const myRecords = records.filter(r => r.user_id === student.id)
  const mySessionIds = new Set(myRecords.map(r => r.session_id))
  const attended = myRecords.length

  function checkedAt(sessionId) {
    const r = myRecords.find(r => r.session_id === sessionId)
    if (!r) return null
    return new Date(r.checked_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-base font-bold text-gray-800">{student.full_name}</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Tham dự <strong className="text-indigo-600">{attended}</strong> / {sessions.length} buổi
              {sessions.length > 0 && (
                <span className="ml-1">
                  ({Math.round(attended / sessions.length * 100)}%)
                </span>
              )}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4 space-y-1.5">
          {sessions.length === 0 && (
            <p className="text-center text-gray-400 py-10 text-sm">Chưa có buổi học nào</p>
          )}
          {sessions.map((s, i) => {
            const ok = mySessionIds.has(s.id)
            const time = checkedAt(s.id)
            return (
              <div
                key={s.id}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${ok ? 'bg-green-50' : 'bg-gray-50'}`}
              >
                {ok
                  ? <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                  : <XCircle size={16} className="text-gray-300 shrink-0" />
                }
                <span className="text-sm text-gray-700 flex-1">
                  Buổi {sessions.length - i} — {new Date(s.session_date + 'T00:00:00').toLocaleDateString('vi-VN')}
                </span>
                {!s.closed_at && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Đang mở</span>
                )}
                {time && (
                  <span className="text-xs text-gray-400">{time}</span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AttendancePage() {
  const { user } = useAuth()
  const { grades: gradeValues } = useGrades()
  const [filterGrade, setFilterGrade] = useState('')
  const [filterClass, setFilterClass] = useState('')
  const [classes, setClasses] = useState([])
  const [sessions, setSessions] = useState([])
  const [students, setStudents] = useState([])
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)

  useEffect(() => { fetchClasses() }, [])
  useEffect(() => {
    if (filterGrade) fetchData()
    else { setSessions([]); setStudents([]); setRecords([]) }
  }, [filterGrade, filterClass])

  async function fetchClasses() {
    const { data } = await supabase.from('classes').select('name, grade').order('grade').order('name')
    setClasses(data || [])
  }

  async function fetchData() {
    setLoading(true)

    // Sessions
    let sq = supabase
      .from('attendance_sessions')
      .select('*')
      .eq('grade', filterGrade)
      .order('opened_at', { ascending: false })
    if (filterClass) sq = sq.eq('class_name', filterClass)
    const { data: sessData, error: sessErr } = await sq
    if (sessErr) { toast.error('Lỗi tải dữ liệu'); setLoading(false); return }
    setSessions(sessData || [])

    // Students
    let enrQ = supabase
      .from('student_enrollments')
      .select('user_id, class_name, profiles!inner(id, full_name, username)')
      .eq('grade', filterGrade)
      .eq('is_approved', true)
    if (filterClass) enrQ = enrQ.eq('class_name', filterClass)
    const { data: enrollData } = await enrQ
    const studs = (enrollData || []).map(e => ({
      id: e.user_id,
      full_name: e.profiles.full_name,
      username: e.profiles.username,
      class_name: e.class_name,
    }))
    studs.sort((a, b) =>
      (a.class_name || '').localeCompare(b.class_name || '') || a.full_name.localeCompare(b.full_name)
    )
    setStudents(studs)

    // Records
    const sessionIds = (sessData || []).map(s => s.id)
    if (sessionIds.length > 0) {
      const { data: recData } = await supabase
        .from('attendance_records')
        .select('*')
        .in('session_id', sessionIds)
      setRecords(recData || [])
    } else {
      setRecords([])
    }

    setLoading(false)
  }

  async function handleOpenSession() {
    setActionLoading(true)
    const { error } = await supabase.from('attendance_sessions').insert({
      grade: filterGrade,
      class_name: filterClass || null,
      created_by: user.id,
    })
    setActionLoading(false)
    if (error) toast.error('Mở buổi thất bại: ' + error.message)
    else { toast.success('Đã mở buổi điểm danh'); fetchData() }
  }

  async function handleCloseSession() {
    if (!openSession) return
    setActionLoading(true)
    const { error } = await supabase
      .from('attendance_sessions')
      .update({ closed_at: new Date().toISOString() })
      .eq('id', openSession.id)
    setActionLoading(false)
    if (error) toast.error('Đóng buổi thất bại: ' + error.message)
    else { toast.success('Đã đóng buổi điểm danh'); fetchData() }
  }

  const filteredClasses = filterGrade ? classes.filter(c => c.grade === filterGrade) : []
  const openSession = sessions.find(s => !s.closed_at)

  const attendCountByStudent = useMemo(() => {
    const map = {}
    records.forEach(r => { map[r.user_id] = (map[r.user_id] || 0) + 1 })
    return map
  }, [records])

  const attendCountBySession = useMemo(() => {
    const map = {}
    records.forEach(r => { map[r.session_id] = (map[r.session_id] || 0) + 1 })
    return map
  }, [records])

  const totalSessions = sessions.length

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Điểm danh</h1>
        <p className="text-gray-400 text-sm mt-0.5">Mở/đóng buổi và theo dõi chuyên cần học sinh</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={filterGrade}
          onChange={e => { setFilterGrade(e.target.value); setFilterClass('') }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">-- Chọn khoá học --</option>
          {gradeValues.map(g => <option key={g} value={g}>{g}</option>)}
        </select>

        {filteredClasses.length > 0 && (
          <select
            value={filterClass}
            onChange={e => setFilterClass(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Tất cả lớp</option>
            {filteredClasses.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>
        )}
      </div>

      {!filterGrade && (
        <div className="text-center py-20 text-gray-400">
          <CheckSquare size={40} className="mx-auto mb-3 opacity-30" />
          <p>Chọn khoá học để bắt đầu</p>
        </div>
      )}

      {filterGrade && loading && (
        <div className="flex justify-center py-16">
          <Loader2 size={28} className="animate-spin text-indigo-600" />
        </div>
      )}

      {filterGrade && !loading && (
        <div className="space-y-6">
          {/* Session control panel */}
          <div className={`rounded-xl border-2 p-5 flex flex-col sm:flex-row sm:items-center gap-4
            ${openSession ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-white'}`}
          >
            <div className="flex-1">
              {openSession ? (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                    </span>
                    <span className="font-semibold text-green-800">Buổi đang mở</span>
                  </div>
                  <p className="text-sm text-green-700">
                    Mở lúc {new Date(openSession.opened_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    {' · '}
                    <strong>{attendCountBySession[openSession.id] || 0}</strong> học sinh đã điểm danh
                  </p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-gray-700">Chưa có buổi nào đang mở</p>
                  <p className="text-sm text-gray-400 mt-0.5">
                    {filterClass ? `${filterGrade} — ${filterClass}` : filterGrade}
                  </p>
                </>
              )}
            </div>

            <div className="flex gap-2">
              {openSession ? (
                <button
                  onClick={handleCloseSession}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <StopCircle size={15} />}
                  Đóng buổi
                </button>
              ) : (
                <button
                  onClick={handleOpenSession}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <PlayCircle size={15} />}
                  Mở buổi điểm danh
                </button>
              )}
              {filterGrade && (
                <button
                  onClick={fetchData}
                  className="px-3 py-2 border border-gray-300 text-gray-500 hover:bg-gray-50 text-sm rounded-lg transition"
                  title="Tải lại"
                >
                  ↺
                </button>
              )}
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">Tổng số buổi</p>
              <p className="text-2xl font-bold text-indigo-600">{totalSessions}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">Học sinh</p>
              <p className="text-2xl font-bold text-gray-800">{students.length}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">Tỉ lệ chuyên cần TB</p>
              <p className="text-2xl font-bold text-green-600">
                {totalSessions > 0 && students.length > 0
                  ? Math.round(
                      students.reduce((acc, s) => acc + (attendCountByStudent[s.id] || 0), 0) /
                      (totalSessions * students.length) * 100
                    )
                  : 0}%
              </p>
            </div>
          </div>

          {/* Students table */}
          {students.length > 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                <Users size={15} className="text-gray-400" />
                <span className="text-sm font-semibold text-gray-700">Danh sách học sinh</span>
              </div>
              <table className="w-full text-sm min-w-[400px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 w-10">#</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Họ và tên</th>
                    {!filterClass && (
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Lớp</th>
                    )}
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500">Đã điểm danh</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500">Tỉ lệ</th>
                    <th className="px-4 py-3 w-10" />
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, i) => {
                    const count = attendCountByStudent[s.id] || 0
                    const pct = totalSessions > 0 ? Math.round(count / totalSessions * 100) : 0
                    return (
                      <tr key={s.id} className="border-t border-gray-100 hover:bg-gray-50 transition">
                        <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                        <td className="px-4 py-3 font-medium text-gray-800">{s.full_name}</td>
                        {!filterClass && (
                          <td className="px-4 py-3 text-gray-500 text-xs">{s.class_name || '—'}</td>
                        )}
                        <td className="px-4 py-3 text-center">
                          <span className="font-semibold text-indigo-600">{count}</span>
                          <span className="text-gray-400 text-xs"> / {totalSessions}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-100 rounded-full h-1.5 min-w-[60px]">
                              <div
                                className={`h-1.5 rounded-full transition-all ${pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-400' : 'bg-red-400'}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className={`text-xs font-medium w-8 text-right ${pct >= 80 ? 'text-green-600' : pct >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
                              {pct}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setSelectedStudent(s)}
                            className="text-gray-300 hover:text-indigo-500 transition p-1"
                            title="Xem chi tiết"
                          >
                            <ChevronRight size={16} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10 text-gray-400 bg-white border border-gray-200 rounded-xl">
              <p>Không có học sinh nào trong khoá/lớp này</p>
            </div>
          )}

          {/* Session history */}
          {sessions.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                <Calendar size={15} className="text-gray-400" />
                <span className="text-sm font-semibold text-gray-700">Lịch sử các buổi</span>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Ngày</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Mở lúc</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Đóng lúc</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500">Điểm danh</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map(s => (
                    <tr key={s.id} className="border-t border-gray-100">
                      <td className="px-4 py-3 text-gray-700">
                        {new Date(s.session_date + 'T00:00:00').toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {new Date(s.opened_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {s.closed_at
                          ? new Date(s.closed_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                          : '—'
                        }
                      </td>
                      <td className="px-4 py-3 text-center font-medium text-indigo-600">
                        {attendCountBySession[s.id] || 0}
                        <span className="text-gray-400 font-normal text-xs"> / {students.length}</span>
                      </td>
                      <td className="px-4 py-3">
                        {s.closed_at
                          ? <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">Đã đóng</span>
                          : <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">Đang mở</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {selectedStudent && (
        <StudentDetailModal
          student={selectedStudent}
          sessions={sessions}
          records={records}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  )
}
