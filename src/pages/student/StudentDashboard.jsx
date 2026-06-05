import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useEnrollments } from '../../hooks/useEnrollments'
import { PenSquare, BarChart2, BookOpen, FileText, LibraryBig, ArrowRight } from 'lucide-react'

export default function StudentDashboard() {
  const { profile, user } = useAuth()
  const { enrollments, grades, loading } = useEnrollments(user?.id)

  const pendingCount = enrollments.filter(e => !e.is_approved).length
  const hasApproved = grades.length > 0

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-1">
        Xin chào, {profile?.full_name}!
      </h1>

      {/* Enrollment status */}
      {!loading && !hasApproved && (
        <Link to="/student/courses"
          className="flex items-center justify-between gap-3 mt-3 mb-6 bg-amber-50 border border-amber-300 rounded-xl px-4 py-3 hover:bg-amber-100 transition"
        >
          <div>
            <p className="text-sm font-semibold text-amber-800">Bạn chưa tham gia khoá học nào</p>
            <p className="text-xs text-amber-600 mt-0.5">
              {pendingCount > 0
                ? `${pendingCount} yêu cầu đang chờ giáo viên duyệt`
                : 'Bấm vào đây để đăng ký khoá học'}
            </p>
          </div>
          <ArrowRight size={18} className="text-amber-600 shrink-0" />
        </Link>
      )}

      {!loading && hasApproved && (
        <p className="text-gray-500 text-sm mb-6">
          {grades.join(' · ')} — Hôm nay ôn bài gì nhỉ?
        </p>
      )}

      {(loading || hasApproved) && !(!loading && !hasApproved) && (
        <p className="text-gray-500 text-sm mb-6 invisible">placeholder</p>
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
