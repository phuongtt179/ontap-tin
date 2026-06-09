import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useEnrollments } from '../../hooks/useEnrollments'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { PenSquare, BarChart2, BookOpen, FileText, LibraryBig, ArrowRight, CheckSquare, Loader2 } from 'lucide-react'

export default function StudentDashboard() {
  const { profile, user } = useAuth()
  const { enrollments, grades, loading } = useEnrollments(user?.id)
  const [attendance, setAttendance] = useState(null) // null | { session, checkedIn }
  const [checkingIn, setCheckingIn] = useState(false)

  useEffect(() => {
    if (user?.id && enrollments.length > 0) checkAttendance()
  }, [user?.id, enrollments.length])

  async function checkAttendance() {
    const { data: sessions } = await supabase
      .from('attendance_sessions')
      .select('*')
      .is('closed_at', null)
      .limit(1)
    if (!sessions?.length) { setAttendance(null); return }
    const session = sessions[0]
    const { data: record } = await supabase
      .from('attendance_records')
      .select('id')
      .eq('session_id', session.id)
      .eq('user_id', user.id)
      .maybeSingle()
    setAttendance({ session, checkedIn: !!record })
  }

  async function handleCheckIn() {
    if (!attendance?.session) return
    setCheckingIn(true)
    const { error } = await supabase.from('attendance_records').insert({
      session_id: attendance.session.id,
      user_id: user.id,
    })
    setCheckingIn(false)
    if (error) {
      toast.error('Điểm danh thất bại')
    } else {
      toast.success('Đã điểm danh thành công!')
      setAttendance(prev => ({ ...prev, checkedIn: true }))
    }
  }

  const pendingCount = enrollments.filter(e => !e.is_approved).length
  const hasApproved = grades.length > 0

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-1">
        Xin chào, {profile?.full_name}!
      </h1>

      {/* Enrollment status */}
      {!loading && !hasApproved && (
        <div className="mt-3 mb-6 bg-amber-50 border border-amber-300 rounded-xl px-4 py-3">
          <p className="text-sm font-semibold text-amber-800">Bạn chưa tham gia khoá học nào</p>
          <p className="text-xs text-amber-600 mt-0.5">
            {pendingCount > 0
              ? `${pendingCount} khoá đang chờ giáo viên duyệt`
              : 'Liên hệ giáo viên để được thêm vào khoá học'}
          </p>
        </div>
      )}

      {!loading && hasApproved && (
        <p className="text-gray-500 text-sm mb-6">
          {grades.join(' · ')} — Hôm nay ôn bài gì nhỉ?
        </p>
      )}

      {(loading || hasApproved) && !(!loading && !hasApproved) && (
        <p className="text-gray-500 text-sm mb-6 invisible">placeholder</p>
      )}

      {/* Attendance widget */}
      {attendance && (
        <div className={`mb-6 max-w-xl rounded-xl border-2 px-5 py-4 flex items-center gap-4
          ${attendance.checkedIn ? 'border-green-300 bg-green-50' : 'border-indigo-300 bg-indigo-50'}`}
        >
          <CheckSquare size={24} className={attendance.checkedIn ? 'text-green-600 shrink-0' : 'text-indigo-600 shrink-0'} />
          <div className="flex-1 min-w-0">
            <p className={`font-semibold text-sm ${attendance.checkedIn ? 'text-green-800' : 'text-indigo-800'}`}>
              {attendance.checkedIn ? 'Đã điểm danh hôm nay' : 'Có buổi học đang diễn ra'}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {attendance.session.class_name || attendance.session.grade}
            </p>
          </div>
          {!attendance.checkedIn && (
            <button
              onClick={handleCheckIn}
              disabled={checkingIn}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50 shrink-0"
            >
              {checkingIn ? <Loader2 size={14} className="animate-spin" /> : null}
              Điểm danh
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:gap-4 max-w-xl">
        <Link to="/student/courses"
          className="flex flex-col items-center justify-center gap-2 md:gap-3 bg-white hover:bg-gray-50 text-gray-700 rounded-2xl p-4 md:p-8 transition shadow border border-gray-200"
        >
          <LibraryBig size={28} className="text-indigo-600 md:hidden" />
          <LibraryBig size={36} className="text-indigo-600 hidden md:block" />
          <span className="text-base md:text-lg font-semibold">Khoá học</span>
          <span className="text-gray-400 text-xs md:text-sm text-center">Tham gia khoá học</span>
        </Link>

        <Link to="/student/learn"
          className="flex flex-col items-center justify-center gap-2 md:gap-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl p-4 md:p-8 transition shadow"
        >
          <BookOpen size={28} className="md:hidden" />
          <BookOpen size={36} className="hidden md:block" />
          <span className="text-base md:text-lg font-semibold">Học tập</span>
          <span className="text-indigo-200 text-xs md:text-sm text-center">Xem bài học theo chủ đề</span>
        </Link>

        <Link to="/student/exams"
          className="flex flex-col items-center justify-center gap-2 md:gap-3 bg-white hover:bg-gray-50 text-gray-700 rounded-2xl p-4 md:p-8 transition shadow border border-gray-200"
        >
          <FileText size={28} className="text-indigo-600 md:hidden" />
          <FileText size={36} className="text-indigo-600 hidden md:block" />
          <span className="text-base md:text-lg font-semibold">Đề thi</span>
          <span className="text-gray-400 text-xs md:text-sm text-center">Làm bài kiểm tra</span>
        </Link>

        <Link to="/student/practice"
          className="flex flex-col items-center justify-center gap-2 md:gap-3 bg-white hover:bg-gray-50 text-gray-700 rounded-2xl p-4 md:p-8 transition shadow border border-gray-200"
        >
          <PenSquare size={28} className="text-indigo-600 md:hidden" />
          <PenSquare size={36} className="text-indigo-600 hidden md:block" />
          <span className="text-base md:text-lg font-semibold">Luyện tập</span>
          <span className="text-gray-400 text-xs md:text-sm text-center">Ôn bài theo chủ đề</span>
        </Link>

        <Link to="/student/history"
          className="flex flex-col items-center justify-center gap-2 md:gap-3 bg-white hover:bg-gray-50 text-gray-700 rounded-2xl p-4 md:p-8 transition shadow border border-gray-200"
        >
          <BarChart2 size={28} className="text-indigo-600 md:hidden" />
          <BarChart2 size={36} className="text-indigo-600 hidden md:block" />
          <span className="text-base md:text-lg font-semibold">Kết quả</span>
          <span className="text-gray-400 text-xs md:text-sm text-center">Xem lại lần làm bài</span>
        </Link>
      </div>
    </div>
  )
}
