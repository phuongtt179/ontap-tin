import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { Trophy, BookOpen, Users, ClipboardCheck, CheckSquare, Activity } from 'lucide-react'

export default function TeacherDashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState({ questions: null, exams: null, students: null })
  const [actions, setActions] = useState(null)   // { pendingStudents, pendingSubmissions, openSessions, openAttendees }
  const [todayData, setTodayData] = useState(null) // { attended, active }
  const [examRanking, setExamRanking] = useState(null)
  const [practiceRanking, setPracticeRanking] = useState(null)

  useEffect(() => {
    fetchStats()
    fetchActions()
    fetchToday()
    fetchExamRanking()
    fetchPracticeRanking()
  }, [])

  async function fetchStats() {
    const [q, e, s] = await Promise.all([
      supabase.from('questions').select('id', { count: 'exact', head: true }),
      supabase.from('exams').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
    ])
    setStats({ questions: q.count ?? 0, exams: e.count ?? 0, students: s.count ?? 0 })
  }

  async function fetchActions() {
    const [
      { count: pendingStudents },
      { count: pendingSubmissions },
      { data: openSessions, error: sessErr },
    ] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true })
        .eq('role', 'student').eq('is_approved', false),
      supabase.from('lesson_submissions').select('id', { count: 'exact', head: true })
        .is('reviewed_at', null),
      supabase.from('attendance_sessions').select('id, grade, class_name, opened_at')
        .is('closed_at', null),
    ])

    let openAttendees = 0
    if (!sessErr && openSessions?.length > 0) {
      const { count } = await supabase.from('attendance_records')
        .select('id', { count: 'exact', head: true })
        .in('session_id', openSessions.map(s => s.id))
      openAttendees = count || 0
    }

    setActions({
      pendingStudents: pendingStudents ?? 0,
      pendingSubmissions: pendingSubmissions ?? 0,
      openSessions: sessErr ? [] : (openSessions || []),
      openAttendees,
    })
  }

  async function fetchToday() {
    const todayStr = new Date().toISOString().split('T')[0]
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0)
    const since = startOfDay.toISOString()

    const [
      { data: todaySessions },
      { count: examToday },
      { count: practiceToday },
    ] = await Promise.all([
      supabase.from('attendance_sessions').select('id').eq('session_date', todayStr),
      supabase.from('exam_sessions').select('id', { count: 'exact', head: true }).gte('created_at', since),
      supabase.from('quiz_sessions').select('id', { count: 'exact', head: true }).gte('created_at', since),
    ])

    let attended = 0
    if (todaySessions?.length > 0) {
      const { count } = await supabase.from('attendance_records')
        .select('id', { count: 'exact', head: true })
        .in('session_id', todaySessions.map(s => s.id))
      attended = count || 0
    }

    setTodayData({ attended, active: (examToday || 0) + (practiceToday || 0) })
  }

  async function buildRanking(sessions) {
    if (!sessions?.length) return []
    const userIds = [...new Set(sessions.map(s => s.user_id))]
    const [{ data: profiles }, { data: enrollments }] = await Promise.all([
      supabase.from('profiles').select('id, full_name').in('id', userIds),
      supabase.from('student_enrollments').select('user_id, class_name, grade')
        .in('user_id', userIds).eq('is_approved', true),
    ])
    const pm = {}; profiles?.forEach(p => { pm[p.id] = p })
    const em = {}; enrollments?.forEach(e => { if (!em[e.user_id]) em[e.user_id] = e })
    const map = {}
    sessions.forEach(s => {
      const p = pm[s.user_id]; const e = em[s.user_id]
      if (!map[s.user_id]) {
        map[s.user_id] = { full_name: p?.full_name || '—', class_name: e?.class_name || e?.grade || '—', scores: [] }
      }
      map[s.user_id].scores.push(s.score)
    })
    return Object.values(map).map(u => ({
      ...u,
      count: u.scores.length,
      avg: Math.round(u.scores.reduce((a, b) => a + b, 0) / u.scores.length * 10) / 10,
      best: Math.max(...u.scores),
    }))
  }

  async function fetchExamRanking() {
    const { data } = await supabase.from('exam_sessions').select('user_id, score')
    const ranked = await buildRanking(data)
    setExamRanking(ranked.sort((a, b) => b.avg - a.avg))
  }

  async function fetchPracticeRanking() {
    const { data, error } = await supabase.from('quiz_sessions').select('user_id, score')
    if (error) { setPracticeRanking([]); return }
    const ranked = await buildRanking(data)
    setPracticeRanking(ranked.sort((a, b) => b.count - a.count))
  }

  const openSession = actions?.openSessions?.[0]

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Xin chào, {profile?.full_name}!</h1>
        <p className="text-gray-400 text-sm">{new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>

      {/* ── Action items ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Chờ duyệt học sinh */}
        <Link to="/teacher/students" className="group relative bg-white border-2 rounded-xl p-4 flex items-center gap-4 hover:shadow-md transition
          border-amber-200 hover:border-amber-400">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0 group-hover:bg-amber-200 transition">
            <Users size={18} className="text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400">Chờ duyệt học sinh</p>
            <p className="text-xl font-bold text-gray-800 leading-tight">
              {actions === null
                ? <span className="inline-block w-8 h-5 bg-gray-100 rounded animate-pulse" />
                : actions.pendingStudents}
            </p>
          </div>
          {actions !== null && actions.pendingStudents > 0 && (
            <span className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
          )}
        </Link>

        {/* Bài nộp chưa chấm */}
        <Link to="/teacher/lessons" className="group relative bg-white border-2 rounded-xl p-4 flex items-center gap-4 hover:shadow-md transition
          border-orange-200 hover:border-orange-400">
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0 group-hover:bg-orange-200 transition">
            <ClipboardCheck size={18} className="text-orange-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400">Bài nộp chưa chấm</p>
            <p className="text-xl font-bold text-gray-800 leading-tight">
              {actions === null
                ? <span className="inline-block w-8 h-5 bg-gray-100 rounded animate-pulse" />
                : actions.pendingSubmissions}
            </p>
          </div>
          {actions !== null && actions.pendingSubmissions > 0 && (
            <span className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-orange-400 animate-pulse" />
          )}
        </Link>

        {/* Điểm danh */}
        <Link to="/teacher/attendance" className={`group relative bg-white border-2 rounded-xl p-4 flex items-center gap-4 hover:shadow-md transition
          ${openSession ? 'border-green-300 hover:border-green-500' : 'border-gray-200 hover:border-gray-300'}`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition
            ${openSession ? 'bg-green-100 group-hover:bg-green-200' : 'bg-gray-100 group-hover:bg-gray-200'}`}>
            <CheckSquare size={18} className={openSession ? 'text-green-600' : 'text-gray-400'} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400">Điểm danh hôm nay</p>
            {actions === null ? (
              <span className="inline-block w-12 h-5 bg-gray-100 rounded animate-pulse mt-1" />
            ) : openSession ? (
              <>
                <p className="text-sm font-semibold text-green-700 leading-tight truncate">
                  {openSession.class_name || openSession.grade} — đang mở
                </p>
                <p className="text-xs text-gray-400">{actions.openAttendees} học sinh đã điểm danh</p>
              </>
            ) : (
              <p className="text-sm font-medium text-gray-400">Chưa mở buổi nào</p>
            )}
          </div>
          {openSession && (
            <span className="absolute top-3 right-3 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
            </span>
          )}
        </Link>
      </div>

      {/* ── Hôm nay ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-indigo-50 rounded-xl p-4 flex items-center gap-3">
          <CheckSquare size={20} className="text-indigo-500 shrink-0" />
          <div>
            <p className="text-xs text-indigo-400">Đã điểm danh hôm nay</p>
            <p className="text-xl font-bold text-indigo-700">
              {todayData === null
                ? <span className="inline-block w-8 h-5 bg-indigo-100 rounded animate-pulse" />
                : todayData.attended}
              <span className="text-sm font-normal text-indigo-400 ml-1">lượt</span>
            </p>
          </div>
        </div>
        <div className="bg-purple-50 rounded-xl p-4 flex items-center gap-3">
          <Activity size={20} className="text-purple-500 shrink-0" />
          <div>
            <p className="text-xs text-purple-400">Làm bài hôm nay</p>
            <p className="text-xl font-bold text-purple-700">
              {todayData === null
                ? <span className="inline-block w-8 h-5 bg-purple-100 rounded animate-pulse" />
                : todayData.active}
              <span className="text-sm font-normal text-purple-400 ml-1">lượt</span>
            </p>
          </div>
        </div>
      </div>

      {/* ── Tổng (nhỏ hơn) ───────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <SmallStat label="Câu hỏi" value={stats.questions} />
        <SmallStat label="Đề thi" value={stats.exams} />
        <SmallStat label="Học sinh" value={stats.students} />
      </div>

      {/* ── Rankings ─────────────────────────────────────────── */}
      <div className="space-y-4">
        <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
            <Trophy size={16} className="text-yellow-500" />
            <h2 className="font-semibold text-gray-800 text-sm">Xếp hạng đề thi</h2>
            <span className="ml-auto text-xs text-gray-400">Theo điểm trung bình</span>
          </div>
          {examRanking === null ? <LoadingRows /> : examRanking.length === 0 ? (
            <Empty text="Chưa có học sinh nào nộp bài" />
          ) : (
            <div className="divide-y divide-gray-50">
              {examRanking.slice(0, 10).map((s, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3">
                  <RankBadge rank={i + 1} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">{s.full_name}</div>
                    <div className="text-xs text-gray-400">Lớp {s.class_name} · {s.count} lần thi</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`text-base font-bold ${s.avg >= 8 ? 'text-green-600' : s.avg >= 5 ? 'text-orange-500' : 'text-red-500'}`}>{s.avg}</div>
                    <div className="text-xs text-gray-400">TB</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-semibold text-indigo-600">{s.best}</div>
                    <div className="text-xs text-gray-400">Cao nhất</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
            <BookOpen size={16} className="text-indigo-500" />
            <h2 className="font-semibold text-gray-800 text-sm">Luyện tập</h2>
            <span className="ml-auto text-xs text-gray-400">Theo số lần luyện</span>
          </div>
          <div className="px-5 py-2.5 bg-indigo-50 border-b border-indigo-100">
            <p className="text-xs text-indigo-600">Học sinh tự chọn chủ đề và mức độ để luyện tập ngẫu nhiên.</p>
          </div>
          {practiceRanking === null ? <LoadingRows /> : practiceRanking.length === 0 ? (
            <Empty text="Chưa có học sinh nào luyện tập" />
          ) : (
            <div className="divide-y divide-gray-50">
              {practiceRanking.slice(0, 10).map((s, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3">
                  <RankBadge rank={i + 1} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">{s.full_name}</div>
                    <div className="text-xs text-gray-400">Lớp {s.class_name}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-base font-bold text-indigo-600">{s.count}</div>
                    <div className="text-xs text-gray-400">lần</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`text-sm font-semibold ${s.avg >= 8 ? 'text-green-600' : s.avg >= 5 ? 'text-orange-500' : 'text-red-500'}`}>{s.avg}</div>
                    <div className="text-xs text-gray-400">TB</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function SmallStat({ label, value }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between gap-2">
      <span className="text-xs text-gray-400">{label}</span>
      <span className="text-lg font-bold text-gray-700">
        {value === null ? <span className="inline-block w-6 h-4 bg-gray-100 rounded animate-pulse" /> : value}
      </span>
    </div>
  )
}

function RankBadge({ rank }) {
  const colors = ['bg-yellow-400 text-white', 'bg-gray-300 text-white', 'bg-orange-300 text-white']
  return (
    <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${colors[rank - 1] || 'bg-gray-100 text-gray-500'}`}>
      {rank}
    </span>
  )
}

function LoadingRows() {
  return (
    <div className="p-5 space-y-3">
      {[1, 2, 3].map(i => <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />)}
    </div>
  )
}

function Empty({ text }) {
  return <div className="px-5 py-10 text-center text-sm text-gray-400">{text}</div>
}
