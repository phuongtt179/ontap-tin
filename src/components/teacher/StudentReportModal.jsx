import { useState, useEffect, useMemo, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { toPng } from 'html-to-image'
import toast from 'react-hot-toast'
import { X, Loader2, Flame, Star, GraduationCap, CheckCircle2, ClipboardList, FileText, Medal, Bot, User, CalendarCheck, Download, Sparkles } from 'lucide-react'

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
    <div className="bg-gray-50 border border-gray-200 rounded-xl px-2 py-2.5 flex flex-col items-center text-center">
      <div className={color}>{icon}</div>
      <div className="text-lg font-black text-gray-800 leading-tight mt-0.5">{value}</div>
      <div className="text-[10px] text-gray-500 leading-tight">{label}</div>
      {sub && <div className="text-[9px] text-gray-400">{sub}</div>}
    </div>
  )
}

export default function StudentReportModal({ student, onClose }) {
  const [loading, setLoading] = useState(true)
  const [d, setD] = useState(null)
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7)) // YYYY-MM
  const [allTime, setAllTime] = useState(false)
  const [note, setNote] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const reportRef = useRef(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const grades = [...new Set((student.enrollments || []).map(e => e.grade).filter(Boolean))]
    const [prof, prog, subs, exams, rewards, allLessons, attRec, attSess] = await Promise.all([
      supabase.from('profiles').select('sticker_count, sticker_total, streak_days, streak_max').eq('id', student.id).single(),
      supabase.from('lesson_progress').select('lesson_id, completed, quiz_passed, quiz_total, lessons(title)').eq('user_id', student.id),
      supabase.from('lesson_submissions').select('score, teacher_comment, graded_by, submitted_at, lessons(title)').eq('user_id', student.id).order('submitted_at', { ascending: false }),
      supabase.from('exam_sessions').select('score, correct, total, submitted_at, exams(title)').eq('user_id', student.id).order('submitted_at', { ascending: false }),
      supabase.from('reward_requests').select('status').eq('student_id', student.id),
      grades.length ? supabase.from('lessons').select('id', { count: 'exact', head: true }).in('grade', grades).eq('is_published', true) : Promise.resolve({ count: 0 }),
      supabase.from('attendance_records').select('checked_at, attendance_sessions(session_date, grade, class_name)').eq('user_id', student.id),
      grades.length ? supabase.from('attendance_sessions').select('session_date, grade, class_name').in('grade', grades) : Promise.resolve({ data: [] }),
    ])
    setD({
      profile: prof.data || {},
      progress: prog.data || [],
      submissions: subs.data || [],
      exams: exams.data || [],
      hasReward: (rewards.data || []).some(r => r.status === 'fulfilled'),
      totalLessons: allLessons.count || 0,
      attRecords: attRec.data || [],
      attSessions: attSess.data || [],
      grades,
    })
    setLoading(false)
  }

  const inPeriod = s => allTime || (s && String(s).slice(0, 7) === month)
  const periodLabel = allTime ? 'Toàn bộ' : `Tháng ${month.slice(5, 7)}/${month.slice(0, 4)}`

  const view = useMemo(() => {
    if (!d) return null
    const p = d.profile
    const completed = d.progress.filter(x => x.completed)
    const quizzesTaken = d.progress.filter(x => (x.quiz_total || 0) > 0)
    const quizzesPassed = quizzesTaken.filter(x => x.quiz_passed)
    const subs = d.submissions.filter(x => x.score != null && inPeriod(x.submitted_at))
    const exams = d.exams.filter(x => inPeriod(x.submitted_at))
    const avgPractice = subs.length ? subs.reduce((s, x) => s + Number(x.score), 0) / subs.length : null
    // Chuyên cần theo kỳ
    const classes = new Set((student.enrollments || []).map(e => e.class_name).filter(Boolean))
    const relevant = s => s && d.grades.includes(s.grade) && (classes.size === 0 || classes.has(s.class_name))
    const totalSessions = d.attSessions.filter(s => relevant(s) && inPeriod(s.session_date)).length
    const attended = d.attRecords.filter(r => relevant(r.attendance_sessions) && inPeriod(r.attendance_sessions?.session_date)).length
    const badges = computeBadges({ streakMax: p.streak_max ?? 0, stickerTotal: p.sticker_total ?? 0, lessonsDone: completed.length, hasReward: d.hasReward })
    // Xếp loại tổng quan
    const basis = avgPractice != null ? avgPractice : (d.totalLessons ? (completed.length / d.totalLessons) * 10 : 0)
    const rating = basis >= 8 ? { label: 'Tốt', cls: 'bg-green-100 text-green-700' } : basis >= 6.5 ? { label: 'Khá', cls: 'bg-blue-100 text-blue-700' } : { label: 'Cần cố gắng', cls: 'bg-amber-100 text-amber-700' }
    return { p, completed, quizzesTaken, quizzesPassed, subs, exams, avgPractice, totalSessions, attended, badges, rating }
  }, [d, month, allTime])

  const summary = view ? [
    `- Bài học hoàn thành: ${view.completed.length}/${d.totalLessons || '?'}`,
    `- Quiz đạt: ${view.quizzesPassed.length}/${view.quizzesTaken.length}`,
    `- Điểm thực hành trung bình (${periodLabel}): ${view.avgPractice != null ? view.avgPractice.toFixed(1) + '/10' : 'chưa có'}`,
    `- Chuyên cần (${periodLabel}): đi ${view.attended}/${view.totalSessions} buổi`,
    `- Chuỗi ngày học liên tục: ${view.p.streak_days ?? 0} (cao nhất ${view.p.streak_max ?? 0})`,
    `- Sticker tích lũy: ${view.p.sticker_total ?? 0}`,
    view.exams.length ? `- Kết quả thi (${periodLabel}): ${view.exams.map(e => `${e.exams?.title || 'Bài thi'} đúng ${e.correct}/${e.total}`).join('; ')}` : '',
  ].filter(Boolean).join('\n') : ''

  async function suggestNote() {
    setAiLoading(true)
    try {
      const res = await fetch('/api/report-note', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentName: student.full_name, summary }),
      })
      const data = await res.json().catch(() => ({}))
      if (data.note) setNote(data.note)
      else toast.error(res.status === 429 ? 'AI đang bận, thử lại sau nhé' : 'Chưa gợi ý được, thử lại')
    } catch { toast.error('Lỗi gợi ý nhận xét') }
    setAiLoading(false)
  }

  async function exportImage() {
    if (!reportRef.current) return
    setExporting(true)
    try {
      const url = await toPng(reportRef.current, { pixelRatio: 2, backgroundColor: '#ffffff', cacheBust: true })
      const a = document.createElement('a')
      a.download = `bao-cao-${(student.full_name || 'hoc-sinh').replace(/\s+/g, '-')}-${allTime ? 'toanbo' : month}.png`
      a.href = url
      a.click()
      toast.success('Đã xuất ảnh — gửi phụ huynh qua Zalo nhé!')
    } catch { toast.error('Xuất ảnh thất bại') }
    setExporting(false)
  }

  const today = new Date().toLocaleDateString('vi-VN')

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-gray-100 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Toolbar — KHÔNG nằm trong ảnh xuất */}
        <div className="flex items-center gap-2 px-3 py-2.5 bg-white border-b border-gray-200 shrink-0 flex-wrap">
          <span className="text-sm font-bold text-gray-700 mr-1">Kỳ:</span>
          <input type="month" value={month} disabled={allTime}
            onChange={e => setMonth(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1 text-sm disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          <button onClick={() => setAllTime(v => !v)}
            className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition ${allTime ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
            Toàn bộ
          </button>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={exportImage} disabled={exporting || loading}
              className="flex items-center gap-1.5 text-sm font-bold bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg transition disabled:opacity-50">
              {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} Xuất ảnh
            </button>
            <button onClick={onClose} className="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500"><X size={16} /></button>
          </div>
        </div>

        {loading || !view ? (
          <div className="flex justify-center py-16"><Loader2 size={30} className="animate-spin text-indigo-400" /></div>
        ) : (
          <div className="flex-1 overflow-y-auto p-3">
            {/* ===== VÙNG XUẤT ẢNH ===== */}
            <div ref={reportRef} className="bg-white rounded-xl p-5 space-y-4">
              {/* Brand header */}
              <div className="flex items-center gap-3 border-b-2 border-indigo-500 pb-3">
                <img src="/logo-bnp.png" alt="BNP" className="w-14 h-14 object-contain shrink-0" />
                <div className="min-w-0">
                  <div className="text-lg font-black text-indigo-700 leading-tight">LẬP TRÌNH SÁNG TẠO BNP</div>
                  <div className="text-xs text-gray-500">Báo cáo học tập học sinh</div>
                </div>
                <div className="ml-auto text-right text-[11px] text-gray-400 leading-snug shrink-0">
                  Kỳ: <b className="text-gray-600">{periodLabel}</b><br />Ngày xuất: {today}
                </div>
              </div>

              {/* Student + rating */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xl font-black text-gray-800">{student.full_name}</span>
                {(student.enrollments || []).length > 0 && (
                  <span className="text-sm text-gray-500">· {(student.enrollments || []).map(e => e.grade + (e.class_name ? `/${e.class_name}` : '')).join(', ')}</span>
                )}
                <span className={`ml-auto text-xs font-bold px-2.5 py-1 rounded-full ${view.rating.cls}`}>Xếp loại: {view.rating.label}</span>
              </div>

              {/* KPI */}
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                <Kpi icon={<GraduationCap size={18} />} color="text-indigo-500" value={`${view.completed.length}${d.totalLessons ? `/${d.totalLessons}` : ''}`} label="Bài hoàn thành" sub="tổng" />
                <Kpi icon={<CalendarCheck size={18} />} color="text-teal-500" value={`${view.attended}/${view.totalSessions}`} label="Chuyên cần" sub={periodLabel} />
                <Kpi icon={<FileText size={18} />} color="text-amber-500" value={view.avgPractice != null ? view.avgPractice.toFixed(1) : '—'} label="Điểm TH TB" sub={view.subs.length ? `${view.subs.length} bài` : periodLabel} />
                <Kpi icon={<Flame size={18} />} color="text-orange-500" value={view.p.streak_days ?? 0} label="Chuỗi ngày" sub={`cao nhất ${view.p.streak_max ?? 0}`} />
                <Kpi icon={<Star size={18} />} color="text-yellow-500" value={view.p.sticker_total ?? 0} label="Sticker" sub="tổng" />
              </div>

              {/* Nhận xét thầy/cô */}
              <div className="border border-indigo-100 bg-indigo-50/40 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-indigo-700">💬 Nhận xét của thầy/cô</span>
                  <button onClick={suggestNote} disabled={aiLoading}
                    className="flex items-center gap-1 text-[11px] font-semibold text-violet-600 bg-white border border-violet-200 rounded-lg px-2 py-1 hover:bg-violet-50 disabled:opacity-50">
                    {aiLoading ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />} AI gợi ý
                  </button>
                </div>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  rows={3}
                  placeholder="Nhập nhận xét gửi phụ huynh (hoặc bấm 'AI gợi ý' rồi chỉnh lại)..."
                  className="w-full bg-transparent text-sm text-gray-700 leading-relaxed focus:outline-none resize-none placeholder-gray-400"
                />
              </div>

              {/* Bài thực hành đã chấm */}
              <Section icon={<FileText size={14} className="text-amber-500" />} title={`Bài thực hành đã chấm — ${periodLabel} (${view.subs.length})`}>
                {view.subs.length === 0 ? <Empty text="Không có bài thực hành nào trong kỳ này." /> : (
                  <div className="space-y-1.5">
                    {view.subs.map((s, i) => (
                      <div key={i} className="flex items-start gap-2 bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5">
                        <span className="shrink-0 mt-0.5">{s.graded_by === 'ai' ? <Bot size={13} className="text-violet-500" /> : <User size={13} className="text-indigo-500" />}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-gray-800 truncate">{s.lessons?.title || 'Bài thực hành'}</div>
                          {s.teacher_comment && <div className="text-[11px] text-gray-500 line-clamp-2 leading-snug">{s.teacher_comment}</div>}
                        </div>
                        <span className={`shrink-0 text-sm font-black ${s.score >= 8 ? 'text-green-600' : s.score >= 5 ? 'text-amber-600' : 'text-red-500'}`}>{s.score}/10</span>
                      </div>
                    ))}
                  </div>
                )}
              </Section>

              {/* Kết quả thi */}
              <Section icon={<ClipboardList size={14} className="text-indigo-500" />} title={`Kết quả thi — ${periodLabel} (${view.exams.length})`}>
                {view.exams.length === 0 ? <Empty text="Không có bài thi nào trong kỳ này." /> : (
                  <div className="space-y-1.5">
                    {view.exams.map((e, i) => (
                      <div key={i} className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-gray-800 truncate">{e.exams?.title || 'Bài thi'}</div>
                          <div className="text-[10px] text-gray-400">{e.submitted_at ? new Date(e.submitted_at).toLocaleDateString('vi-VN') : ''}</div>
                        </div>
                        <span className="shrink-0 text-sm font-bold text-indigo-600">đúng {e.correct ?? '?'}/{e.total ?? '?'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Section>

              {/* Huy hiệu */}
              <Section icon={<Medal size={14} className="text-amber-500" />} title={`Huy hiệu đạt được (${view.badges.filter(b => b.earned).length}/${view.badges.length})`}>
                <div className="flex flex-wrap gap-1.5">
                  {view.badges.map(b => (
                    <span key={b.id} className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${b.earned ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-gray-50 border-gray-100 text-gray-300'}`}>
                      <span className={b.earned ? '' : 'grayscale opacity-50'}>{b.icon}</span> {b.name}
                    </span>
                  ))}
                </div>
              </Section>

              <div className="text-center text-[10px] text-gray-400 pt-1 border-t border-gray-100">
                Lập Trình Sáng Tạo BNP · laptrinhsangtao.vercel.app
              </div>
            </div>
            {/* ===== HẾT VÙNG XUẤT ẢNH ===== */}
          </div>
        )}
      </div>
    </div>
  )
}

function Section({ icon, title, children }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5 font-bold text-sm text-gray-700">{icon} {title}</div>
      {children}
    </div>
  )
}
function Empty({ text }) {
  return <p className="text-xs text-gray-400 italic px-1">{text}</p>
}
