import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { X, Loader2, Flame, Star, GraduationCap, CheckCircle2, ClipboardList, FileText, Medal, Bot, User } from 'lucide-react'

// Huy hiệu — cùng logic với AchievementsModal phía học sinh
function computeBadges({ streakMax, stickerTotal, lessonsDone, hasReward }) {
  const b = []
  ;[3, 7, 14, 30].forEach(n => b.push({ id: `s${n}`, icon: '🔥', name: `Chăm ${n} ngày`, earned: streakMax >= n }))
  ;[10, 50, 100, 200].forEach(n => b.push({ id: `st${n}`, icon: '⭐', name: `${n} sticker`, earned: stickerTotal >= n }))
  ;[1, 5, 10, 20].forEach(n => b.push({ id: `l${n}`, icon: '🎓', name: `${n} bài học`, earned: lessonsDone >= n }))
  b.push({ id: 'r1', icon: '🎁', name: 'Đổi quà', earned: hasReward })
  return b
}

function Kpi({ icon, label, value, sub, color }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl px-3 py-3 flex flex-col items-center text-center">
      <div className={`text-xl ${color}`}>{icon}</div>
      <div className="text-xl font-black text-gray-800 leading-tight mt-0.5">{value}</div>
      <div className="text-[11px] text-gray-500 leading-tight">{label}</div>
      {sub && <div className="text-[10px] text-gray-400">{sub}</div>}
    </div>
  )
}

export default function StudentReportModal({ student, onClose }) {
  const [loading, setLoading] = useState(true)
  const [d, setD] = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const grades = [...new Set((student.enrollments || []).map(e => e.grade).filter(Boolean))]
    const [prof, prog, subs, exams, rewards, allLessons] = await Promise.all([
      supabase.from('profiles').select('sticker_count, sticker_total, streak_days, streak_max').eq('id', student.id).single(),
      supabase.from('lesson_progress').select('lesson_id, completed, quiz_passed, quiz_correct, quiz_total, lessons(title)').eq('user_id', student.id),
      supabase.from('lesson_submissions').select('lesson_id, score, teacher_comment, graded_by, submitted_at, reviewed_at, lessons(title)').eq('user_id', student.id).order('submitted_at', { ascending: false }),
      supabase.from('exam_sessions').select('score, correct, total, submitted_at, exams(title)').eq('user_id', student.id).order('submitted_at', { ascending: false }),
      supabase.from('reward_requests').select('status').eq('student_id', student.id),
      grades.length ? supabase.from('lessons').select('id', { count: 'exact', head: true }).in('grade', grades).eq('is_published', true) : Promise.resolve({ count: 0 }),
    ])
    setD({
      profile: prof.data || {},
      progress: prog.data || [],
      submissions: subs.data || [],
      exams: exams.data || [],
      hasReward: (rewards.data || []).some(r => r.status === 'fulfilled'),
      totalLessons: allLessons.count || 0,
      grades,
    })
    setLoading(false)
  }

  const p = d?.profile || {}
  const completed = (d?.progress || []).filter(x => x.completed)
  const quizzesTaken = (d?.progress || []).filter(x => (x.quiz_total || 0) > 0)
  const quizzesPassed = quizzesTaken.filter(x => x.quiz_passed)
  const scored = (d?.submissions || []).filter(x => x.score != null)
  const avgPractice = scored.length ? (scored.reduce((s, x) => s + Number(x.score), 0) / scored.length) : null
  const badges = computeBadges({
    streakMax: p.streak_max ?? 0, stickerTotal: p.sticker_total ?? 0,
    lessonsDone: completed.length, hasReward: d?.hasReward,
  })
  const earnedBadges = badges.filter(b => b.earned)

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 px-5 py-4 text-white relative shrink-0">
          <button onClick={onClose} className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30"><X size={15} /></button>
          <h2 className="font-black text-lg">📋 Bảng thành tích học sinh</h2>
          <p className="text-white/85 text-sm mt-0.5">
            {student.full_name}
            {(student.enrollments || []).length > 0 && (
              <span className="text-white/70"> · {(student.enrollments || []).map(e => e.grade + (e.class_name ? `/${e.class_name}` : '')).join(', ')}</span>
            )}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 size={30} className="animate-spin text-indigo-400" /></div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {/* KPI */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              <Kpi icon={<GraduationCap size={20} />} color="text-indigo-500" value={`${completed.length}${d.totalLessons ? `/${d.totalLessons}` : ''}`} label="Bài hoàn thành" />
              <Kpi icon={<CheckCircle2 size={20} />} color="text-green-500" value={`${quizzesPassed.length}/${quizzesTaken.length}`} label="Quiz đạt" />
              <Kpi icon={<FileText size={20} />} color="text-amber-500" value={avgPractice != null ? avgPractice.toFixed(1) : '—'} label="Điểm thực hành TB" sub={scored.length ? `${scored.length} bài` : ''} />
              <Kpi icon={<Flame size={20} />} color="text-orange-500" value={p.streak_days ?? 0} label="Chuỗi ngày" sub={`cao nhất ${p.streak_max ?? 0}`} />
              <Kpi icon={<Star size={20} />} color="text-yellow-500" value={p.sticker_total ?? 0} label="Sticker tích lũy" />
            </div>

            {/* Huy hiệu */}
            <Section icon={<Medal size={15} className="text-amber-500" />} title={`Huy hiệu (${earnedBadges.length}/${badges.length})`}>
              <div className="flex flex-wrap gap-2">
                {badges.map(b => (
                  <span key={b.id} title={b.name}
                    className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full border ${b.earned ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-gray-50 border-gray-100 text-gray-300'}`}>
                    <span className={b.earned ? '' : 'grayscale opacity-50'}>{b.icon}</span> {b.name}
                  </span>
                ))}
              </div>
            </Section>

            {/* Bài thực hành đã chấm */}
            <Section icon={<FileText size={15} className="text-amber-500" />} title={`Bài thực hành đã chấm (${scored.length})`}>
              {scored.length === 0 ? <Empty text="Chưa có bài thực hành nào được chấm." /> : (
                <div className="space-y-1.5">
                  {scored.map((s, i) => (
                    <div key={i} className="flex items-start gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
                      <span className="shrink-0">{s.graded_by === 'ai' ? <Bot size={14} className="text-violet-500 mt-0.5" /> : <User size={14} className="text-indigo-500 mt-0.5" />}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-800 truncate">{s.lessons?.title || 'Bài thực hành'}</div>
                        {s.teacher_comment && <div className="text-xs text-gray-500 line-clamp-2 leading-snug">{s.teacher_comment}</div>}
                      </div>
                      <span className={`shrink-0 text-sm font-black ${s.score >= 8 ? 'text-green-600' : s.score >= 5 ? 'text-amber-600' : 'text-red-500'}`}>{s.score}/10</span>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            {/* Kết quả thi */}
            <Section icon={<ClipboardList size={15} className="text-indigo-500" />} title={`Kết quả thi (${d.exams.length})`}>
              {d.exams.length === 0 ? <Empty text="Chưa làm bài thi nào." /> : (
                <div className="space-y-1.5">
                  {d.exams.map((e, i) => (
                    <div key={i} className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-800 truncate">{e.exams?.title || 'Bài thi'}</div>
                        <div className="text-[11px] text-gray-400">{e.submitted_at ? new Date(e.submitted_at).toLocaleDateString('vi-VN') : ''}</div>
                      </div>
                      <span className="shrink-0 text-sm font-bold text-indigo-600">đúng {e.correct ?? '?'}/{e.total ?? '?'}</span>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            {/* Bài đã hoàn thành */}
            <Section icon={<GraduationCap size={15} className="text-green-500" />} title={`Bài học đã hoàn thành (${completed.length})`}>
              {completed.length === 0 ? <Empty text="Chưa hoàn thành bài học nào." /> : (
                <div className="flex flex-wrap gap-1.5">
                  {completed.map((c, i) => (
                    <span key={i} className="text-xs bg-green-50 border border-green-100 text-green-700 rounded-full px-2 py-0.5">✓ {c.lessons?.title || 'Bài học'}</span>
                  ))}
                </div>
              )}
            </Section>

            <p className="text-center text-[11px] text-gray-400 pt-1">💡 Chụp màn hình bảng này để gửi phụ huynh.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function Section({ icon, title, children }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2 font-bold text-sm text-gray-700">{icon} {title}</div>
      {children}
    </div>
  )
}
function Empty({ text }) {
  return <p className="text-xs text-gray-400 italic px-1">{text}</p>
}
