import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useEnrollments } from '../../hooks/useEnrollments'
import { useSelectedGradeContext } from '../../context/SelectedGradeContext'
import { useHeaderStats } from '../../context/HeaderStatsContext'
import { BookOpen, LogOut, LayoutDashboard, PenSquare, ClipboardList, BarChart2, Tags, GraduationCap, School, Users, Menu, X, TableProperties, BookMarked, LibraryBig, NotebookPen, CheckSquare, Gift, MessageCircle, Sparkles, Check, ChevronDown, CheckCircle, Trophy } from 'lucide-react'

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
        { to: '/teacher/rewards', icon: <Gift size={18} />, label: 'Phần thưởng' },
        { to: '/teacher/messages', icon: <MessageCircle size={18} />, label: 'Tin nhắn' },
        ...(profile?.role === 'teacher' ? [
          { to: '/teacher/ai-assistant', icon: <Sparkles size={18} />, label: 'Hỏi AI' },
          { to: '/teacher/assistants', icon: <Users size={18} />, label: 'Trợ giảng' },
        ] : []),
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
              {item.badge > 0 && (
                <span className="ml-auto bg-red-500 text-white text-[10px] font-black min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </Link>
          )
        )}
      </nav>
    )
  }

  // Widget streak/sticker/tiến độ/thành tích — LearnPage "gửi" số liệu qua
  // HeaderStatsContext (setStats), trang khác không gọi thì không hiện gì.
  // Gộp vào ngay thanh điều hướng để chỉ còn 1 dòng thay vì 2 thanh xếp chồng.
  function HeroWidgets() {
    const { stats } = useHeaderStats()
    if (!stats) return null
    const { totalLessons, completedLessons, streakDays, stickerCount, stickerThreshold, rewardNotif, onOpenReward, onOpenAchievements } = stats

    return (
      <div className="flex items-center gap-1.5">
        {totalLessons > 0 && (
          <div className="hidden lg:flex items-center gap-1 bg-white/15 rounded-full px-2.5 py-1.5">
            <CheckCircle size={12} className="text-yellow-300" />
            <span className="text-xs font-semibold text-white">{completedLessons}/{totalLessons}</span>
          </div>
        )}
        <div className="flex items-center gap-1 bg-white/15 rounded-full px-2.5 py-1.5">
          <span className="text-sm leading-none select-none">🔥</span>
          <span className="text-white font-black text-sm leading-none">{streakDays}</span>
        </div>
        <button
          onClick={onOpenReward}
          className="flex items-center gap-1 rounded-full px-2.5 py-1.5 bg-gradient-to-br from-yellow-400 to-orange-500 hover:scale-105 active:scale-95 transition-transform"
          title="Đổi quà"
        >
          <span className="text-sm leading-none select-none">🏆</span>
          <span className="text-white font-black text-sm leading-none">{stickerCount}</span>
          <span className="text-white/70 text-[10px] leading-none">/{stickerThreshold}</span>
        </button>
        <button
          onClick={onOpenAchievements}
          className="relative w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition"
          title="Thành tích"
        >
          {rewardNotif && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-[#0055bb]" />
          )}
          <Trophy size={15} className="text-yellow-300" />
        </button>
      </div>
    )
  }

  // Menu dưới avatar (chỉ học sinh) — tên + khoá đang chọn + chuyển khoá + Đăng xuất.
  // Trước đây dải nút chọn khoá nằm trong Hero của LearnPage, dời về đây để
  // dùng chung được ở mọi trang học sinh, không chỉ riêng trang Bài học.
  function AvatarMenu() {
    const [open, setOpen] = useState(false)
    const { selectedGrade, grades, setSelectedGrade } = useSelectedGradeContext()

    return (
      <div className="relative">
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-2 bg-white/15 hover:bg-white/25 rounded-xl pl-2 pr-3 py-1.5 transition"
        >
          <div className="w-8 h-8 rounded-full bg-white/25 flex items-center justify-center text-sm font-black shrink-0">
            {(profile?.full_name || 'H').trim().charAt(0).toUpperCase()}
          </div>
          <div className="text-left hidden lg:block">
            <div className="text-white text-sm font-semibold leading-tight">{profile?.full_name}</div>
            <div className="text-blue-200 text-xs">{selectedGrade || 'Học sinh'}</div>
          </div>
          <ChevronDown size={14} className="text-white/70" />
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 text-gray-700">
              {grades.length > 0 && (
                <>
                  <div className="px-3 py-1 text-[11px] font-bold text-gray-400 uppercase tracking-wide">Chuyển khoá</div>
                  {grades.map(g => (
                    <button
                      key={g}
                      onClick={() => { setSelectedGrade(g); setOpen(false) }}
                      className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-gray-50 transition
                        ${g === selectedGrade ? 'text-indigo-600 font-semibold' : 'text-gray-700'}`}
                    >
                      <Check size={14} className={g === selectedGrade ? 'opacity-100' : 'opacity-0'} />
                      {g}
                    </button>
                  ))}
                  <div className="my-1 border-t border-gray-100" />
                </>
              )}
              <button
                onClick={handleSignOut}
                className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2 transition"
              >
                <LogOut size={14} /> Đăng xuất
              </button>
            </div>
          </>
        )}
      </div>
    )
  }

  // Chuyển khoá trong sidebar mobile (bản thu gọn của AvatarMenu — mobile
  // không có chỗ cho dropdown nổi, liệt kê thẳng thành nút bấm).
  function MobileGradeSwitcher() {
    const { selectedGrade, grades, setSelectedGrade } = useSelectedGradeContext()
    if (grades.length === 0) return null
    return (
      <div className="px-3 mb-3 flex flex-wrap gap-1.5">
        {grades.map(g => (
          <button key={g} onClick={() => setSelectedGrade(g)}
            className={`px-2.5 py-1 rounded-full text-xs font-semibold transition
              ${g === selectedGrade ? 'bg-white text-blue-700' : 'bg-white/15 text-white hover:bg-white/25'}`}>
            {g}
          </button>
        ))}
      </div>
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
        {!isTeacher && <MobileGradeSwitcher />}
        {!isTeacher && (
          <div className="px-3 mb-3 flex flex-wrap gap-1.5">
            <HeroWidgets />
          </div>
        )}
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
        <span className="font-bold text-lg">Lập Trình Sáng Tạo BNP</span>
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

  function LogoBlock({ size = 9 }) {
    return (
      <div className="flex items-center gap-3">
        <div className={`w-${size} h-${size} bg-white rounded-xl flex items-center justify-center shadow-md shrink-0`}>
          <img src="/logo-bnp.png" alt="BNP" className={`w-${size - 2} h-${size - 2} object-contain`}
            onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='block' }} />
          <span className="text-blue-700 font-black text-xs hidden">BNP</span>
        </div>
        <div>
          <div className="text-white font-bold text-sm leading-tight">Lập Trình Sáng Tạo</div>
          <div className="text-blue-200 text-xs">BNP</div>
        </div>
      </div>
    )
  }

  return (
    <div className={`h-screen overflow-hidden bg-gray-50 flex flex-col ${isTeacher ? 'md:flex-row' : ''}`}>

      {/* ── Mobile top bar (all users) ── */}
      <header className={`md:hidden ${sidebarBg} text-white flex items-center justify-between px-4 py-3 shrink-0`}>
        <div className="flex items-center gap-2">
          {isTeacher ? <BookOpen size={20} /> : (
            <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center shadow-sm shrink-0">
              <img src="/logo-bnp.png" alt="BNP" className="w-5 h-5 object-contain"
                onError={e => { e.target.style.display='none' }} />
            </div>
          )}
          <span className="font-bold">Lập Trình Sáng Tạo BNP</span>
        </div>
        <button onClick={() => setSidebarOpen(true)} className="text-white/70 hover:text-white p-1">
          <Menu size={22} />
        </button>
      </header>

      {/* ── Student desktop top bar (thay sidebar) ── */}
      {!isTeacher && (
        <header className={`hidden md:flex ${sidebarBg} text-white items-center justify-between px-6 py-3 shrink-0 border-b border-white/10`}>
          <LogoBlock size={9} />
          {/* Nav links giữa */}
          <nav className="flex items-center gap-1">
            {navItems.filter(Boolean).map(item => (
              <Link key={item.to} to={item.to}
                className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition
                  ${location.pathname === item.to || location.pathname.startsWith(item.to + '/')
                    ? 'bg-white/25 text-white'
                    : 'text-white/75 hover:bg-white/15 hover:text-white'}`}>
                {item.icon}
                {item.label}
                {item.badge > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-black min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <HeroWidgets />
            <AvatarMenu />
          </div>
        </header>
      )}

      {/* ── Teacher desktop sidebar ── */}
      {isTeacher && (
        <aside className={`hidden md:flex w-56 ${sidebarBg} text-white flex-col shrink-0`}>
          <SidebarHeader />
          <NavLinks />
          <UserFooter />
        </aside>
      )}

      {/* ── Mobile sidebar overlay ── */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <aside className={`w-64 ${sidebarBg} text-white flex flex-col h-full`}>
            <div className={`flex items-center justify-between px-4 py-4 border-b ${sidebarBorder}`}>
              {isTeacher ? <SidebarHeader /> : <LogoBlock size={8} />}
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

      {/* ── Main content ── */}
      <main className="flex-1 overflow-auto min-h-0">
        {children}
      </main>
    </div>
  )
}
