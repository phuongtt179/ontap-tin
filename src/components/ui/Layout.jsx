import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useEnrollments } from '../../hooks/useEnrollments'
import { BookOpen, LogOut, LayoutDashboard, PenSquare, ClipboardList, BarChart2, Tags, GraduationCap, School, Users, Menu, X, TableProperties, BookMarked, LibraryBig, NotebookPen, CheckSquare } from 'lucide-react'

export default function Layout({ children }) {
  const { profile, user, signOut, isTeacher } = useAuth()
  const { enrollments } = useEnrollments(!isTeacher ? user?.id : null)
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  const navItems = isTeacher
    ? [
        { to: '/teacher', icon: <LayoutDashboard size={18} />, label: 'Tổng quan' },
        { to: '/teacher/questions', icon: <PenSquare size={18} />, label: 'Câu hỏi' },
        { to: '/teacher/topics', icon: <Tags size={18} />, label: 'Chủ đề' },
        { to: '/teacher/exams', icon: <ClipboardList size={18} />, label: 'Đề thi' },
        { to: '/teacher/exam-stats', icon: <TableProperties size={18} />, label: 'Thống kê' },
        { to: '/teacher/lessons', icon: <BookMarked size={18} />, label: 'Bài học' },
        null,
        { to: '/teacher/grades', icon: <GraduationCap size={18} />, label: 'Khoá học' },
        { to: '/teacher/classes', icon: <School size={18} />, label: 'Lớp' },
        { to: '/teacher/students', icon: <Users size={18} />, label: 'Học sinh' },
        { to: '/teacher/notes', icon: <NotebookPen size={18} />, label: 'Ghi chú' },
        { to: '/teacher/attendance', icon: <CheckSquare size={18} />, label: 'Điểm danh' },
        ...(profile?.role === 'teacher' ? [{ to: '/teacher/assistants', icon: <Users size={18} />, label: 'Trợ giảng' }] : []),
      ]
    : [
        { to: '/student/learn', icon: <BookMarked size={18} />, label: 'Bài học' },
      ]

  function NavLinks({ onLinkClick }) {
    return (
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item, i) =>
          item === null ? (
            <div key={`sep-${i}`} className="my-2 border-t border-indigo-600 opacity-50" />
          ) : (
            <Link
              key={item.to}
              to={item.to}
              onClick={onLinkClick}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition
                ${location.pathname === item.to
                  ? 'bg-white text-indigo-700'
                  : 'text-indigo-100 hover:bg-indigo-600'}`}
            >
              {item.icon}
              {item.label}
            </Link>
          )
        )}
      </nav>
    )
  }

  function UserFooter() {
    return (
      <div className="px-3 py-4 border-t border-indigo-600">
        <div className="text-xs text-indigo-300 mb-1 px-3">{profile?.full_name}</div>
        <div className="text-xs text-indigo-400 mb-3 px-3">
          {profile?.role === 'teacher' ? 'Giáo viên'
            : profile?.role === 'assistant' ? 'Trợ giảng'
            : enrollments.length > 0
              ? enrollments.map(e => e.class_name || e.grade).join(' · ')
              : 'Học sinh'}
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-3 py-2 text-sm text-indigo-200 hover:text-white hover:bg-indigo-600 rounded-lg w-full transition"
        >
          <LogOut size={16} /> Đăng xuất
        </button>
      </div>
    )
  }

  const sidebarBg = isTeacher ? 'bg-indigo-700' : 'bg-gradient-to-b from-[#003d8f] to-[#0066cc]'
  const sidebarBorder = isTeacher ? 'border-indigo-600' : 'border-white/20'

  function SidebarHeader() {
    return isTeacher ? (
      <div className={`flex items-center gap-2 px-5 py-5 border-b ${sidebarBorder}`}>
        <BookOpen size={22} />
        <span className="font-bold text-lg">Ôn Tập Tin</span>
      </div>
    ) : (
      <div className={`flex items-center gap-3 px-4 py-4 border-b ${sidebarBorder}`}>
        <div className="w-9 h-9 shrink-0">
          <img src="/logo-bnp.png" alt="BNP" className="w-9 h-9 object-contain rounded-lg"
            onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex' }} />
          <div className="w-9 h-9 bg-white rounded-lg items-center justify-center hidden">
            <span className="text-blue-700 font-black text-xs">BNP</span>
          </div>
        </div>
        <div>
          <div className="text-white font-bold text-sm leading-tight">Lập Trình Sáng Tạo</div>
          <div className="text-blue-200 text-xs">BNP</div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen overflow-hidden bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile top bar */}
      <header className={`md:hidden ${sidebarBg} text-white flex items-center justify-between px-4 py-3 shrink-0`}>
        <div className="flex items-center gap-2">
          {isTeacher ? <BookOpen size={20} /> : (
            <img src="/logo-bnp.png" alt="BNP" className="w-6 h-6 object-contain rounded"
              onError={e => { e.target.style.display='none' }} />
          )}
          <span className="font-bold">{isTeacher ? 'Ôn Tập Tin' : 'Lập Trình Sáng Tạo BNP'}</span>
        </div>
        <button onClick={() => setSidebarOpen(true)} className="text-white/70 hover:text-white p-1">
          <Menu size={22} />
        </button>
      </header>

      {/* Desktop sidebar */}
      <aside className={`hidden md:flex w-56 ${sidebarBg} text-white flex-col shrink-0`}>
        <SidebarHeader />
        <NavLinks />
        <UserFooter />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <aside className={`w-64 ${sidebarBg} text-white flex flex-col h-full`}>
            <div className={`flex items-center justify-between px-5 py-5 border-b ${sidebarBorder}`}>
              <SidebarHeader />
              <button onClick={() => setSidebarOpen(false)} className="text-white/70 hover:text-white ml-2">
                <X size={20} />
              </button>
            </div>
            <NavLinks onLinkClick={() => setSidebarOpen(false)} />
            <UserFooter />
          </aside>
          <div className="flex-1 bg-black/50" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
