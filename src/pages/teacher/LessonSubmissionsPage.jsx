import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { ArrowLeft, MessageSquare, CheckCircle, Loader2, PlayCircle, BookOpen, Upload, Users, FileText, FileImage, File, ExternalLink, Code, Play, TerminalSquare, Search, Wifi, RefreshCw, Bot } from 'lucide-react'
import MarkdownContent from '../../components/ui/MarkdownContent'
import Sb3Viewer from '../../components/ui/Sb3Viewer'
import { gradeStudent } from '../../utils/aiGrader'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'

function parseTasks(instructions) {
  if (!instructions) return [{ instructions: '' }]
  try {
    const arr = JSON.parse(instructions)
    if (Array.isArray(arr) && arr.length > 0) return arr
  } catch {}
  return [{ instructions }]
}

function CodeViewer({ url, ext }) {
  const [content, setContent] = useState(null)
  const [shown, setShown] = useState(false)
  const [loading, setLoading] = useState(false)
  const [stdin, setStdin] = useState('')
  const [running, setRunning] = useState(false)
  const [output, setOutput] = useState(null) // { stdout, stderr, ok }

  async function toggle() {
    if (shown) { setShown(false); return }
    if (content !== null) { setShown(true); return }
    setLoading(true)
    try {
      const res = await fetch(url)
      setContent(await res.text())
    } catch {
      setContent('(Không thể tải nội dung file)')
    }
    setLoading(false)
    setShown(true)
  }

  async function runCode() {
    if (!content) return
    setRunning(true)
    setOutput(null)
    try {
      const res = await fetch('https://emkc.org/api/v2/piston/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: 'python',
          version: '3.10',
          files: [{ content }],
          stdin: stdin,
        }),
      })
      const data = await res.json()
      const run = data.run || {}
      setOutput({
        stdout: run.stdout || '',
        stderr: run.stderr || '',
        ok: !run.stderr,
      })
    } catch (err) {
      setOutput({ stdout: '', stderr: 'Lỗi kết nối: ' + err.message, ok: false })
    }
    setRunning(false)
  }

  const needsInput = content && /input\s*\(/.test(content)

  return (
    <div className="space-y-2">
      <button onClick={toggle} disabled={loading}
        className="text-xs text-indigo-600 hover:underline disabled:opacity-50">
        {loading ? 'Đang tải...' : shown ? 'Ẩn nội dung' : 'Xem nội dung'}
      </button>

      {shown && content !== null && (
        <div className="space-y-2">
          {ext === 'py'
            ? <SyntaxHighlighter language="python" style={oneLight}
                customStyle={{ borderRadius: '8px', fontSize: '12px', margin: 0 }}>
                {content}
              </SyntaxHighlighter>
            : <pre className="bg-gray-50 border rounded-lg p-3 text-xs text-gray-700 whitespace-pre-wrap overflow-auto max-h-64">{content}</pre>
          }

          {ext === 'py' && (
            <div className="space-y-2">
              {needsInput && (
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">
                    Input (stdin) — mỗi dòng một giá trị
                  </label>
                  <textarea
                    value={stdin}
                    onChange={e => setStdin(e.target.value)}
                    rows={3}
                    placeholder="Nhập dữ liệu đầu vào..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  />
                </div>
              )}
              <button
                onClick={runCode}
                disabled={running}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition disabled:opacity-50"
              >
                {running ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
                {running ? 'Đang chạy...' : 'Chạy code'}
              </button>

              {output !== null && (
                <div className="rounded-lg border overflow-hidden text-xs font-mono">
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium ${output.ok && !output.stderr ? 'bg-green-50 text-green-700 border-b border-green-200' : 'bg-red-50 text-red-700 border-b border-red-200'}`}>
                    <TerminalSquare size={13} />
                    Kết quả
                  </div>
                  {output.stdout && (
                    <pre className="px-3 py-2 bg-gray-900 text-green-300 whitespace-pre-wrap overflow-auto max-h-48">{output.stdout}</pre>
                  )}
                  {output.stderr && (
                    <pre className="px-3 py-2 bg-red-950 text-red-300 whitespace-pre-wrap overflow-auto max-h-48">{output.stderr}</pre>
                  )}
                  {!output.stdout && !output.stderr && (
                    <pre className="px-3 py-2 bg-gray-900 text-gray-500 italic">(Không có output)</pre>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function LessonSubmissionsPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [lesson, setLesson] = useState(null)
  const [students, setStudents] = useState([])
  const [progressMap, setProgressMap] = useState({})   // userId -> lesson_progress
  const [submissionMap, setSubmissionMap] = useState({}) // userId -> lesson_submission
  const [classes, setClasses] = useState([])
  const [filterClass, setFilterClass] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [realtimeConnected, setRealtimeConnected] = useState(false)
  const [loading, setLoading] = useState(true)

  const [selected, setSelected] = useState(null) // { student, submissions }
  const [taskComments, setTaskComments] = useState({}) // subId -> string
  const [taskScores, setTaskScores] = useState({})     // subId -> string
  const [taskSaving, setTaskSaving] = useState({})     // subId -> bool
  const [gradeModal, setGradeModal] = useState(null)  // { student, taskIdx } — popup chấm nhanh
  const [aiGrading, setAiGrading] = useState({ active: false, done: 0, total: 0, countdown: 0 })
  const [showAiReview, setShowAiReview] = useState(false)
  const [approvingAll, setApprovingAll] = useState(false)

  useEffect(() => { loadAll() }, [id])

  // Realtime: tự cập nhật khi học sinh nộp bài hoặc hoàn thành
  useEffect(() => {
    const channel = supabase
      .channel(`lesson-submissions-${id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'lesson_submissions',
        filter: `lesson_id=eq.${id}`,
      }, payload => {
        const newSub = payload.new
        setSubmissionMap(prev => {
          const existing = prev[newSub.user_id] || []
          if (existing.find(s => s.id === newSub.id)) return prev
          toast.success('Học sinh vừa nộp bài!', { icon: '📩' })
          return { ...prev, [newSub.user_id]: [...existing, newSub] }
        })
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'lesson_submissions',
        filter: `lesson_id=eq.${id}`,
      }, payload => {
        const updated = payload.new
        setSubmissionMap(prev => {
          const subs = prev[updated.user_id] || []
          return { ...prev, [updated.user_id]: subs.map(s => s.id === updated.id ? updated : s) }
        })
        setSelected(prev => {
          if (!prev || prev.student.id !== updated.user_id) return prev
          return { ...prev, submissions: prev.submissions.map(s => s.id === updated.id ? updated : s) }
        })
        // Thông báo khi học sinh nộp lại (cleared reviewed_at)
        if (!updated.allow_resubmit && !updated.reviewed_at && updated.submitted_at) {
          toast('Học sinh vừa nộp lại bài!', { icon: '🔄' })
        }
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'lesson_progress',
        filter: `lesson_id=eq.${id}`,
      }, payload => {
        const p = payload.new
        setProgressMap(prev => ({ ...prev, [p.user_id]: p }))
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'lesson_progress',
        filter: `lesson_id=eq.${id}`,
      }, payload => {
        const p = payload.new
        setProgressMap(prev => ({ ...prev, [p.user_id]: p }))
      })
      .subscribe(status => {
        setRealtimeConnected(status === 'SUBSCRIBED')
      })

    return () => { supabase.removeChannel(channel) }
  }, [id])

  async function loadAll() {
    setLoading(true)

    const { data: lessonData } = await supabase
      .from('lessons').select('*').eq('id', id).single()

    if (!lessonData) { toast.error('Không tìm thấy bài học'); navigate(-1); return }
    setLesson(lessonData)

    // Fetch students enrolled in lesson's grade (via student_enrollments)
    const { data: enrollData } = await supabase
      .from('student_enrollments')
      .select('user_id, class_name, grade, profiles(id, full_name)')
      .eq('grade', lessonData.grade)
      .eq('is_approved', true)

    const studentData = (enrollData || []).map(e => ({
      id: e.profiles?.id || e.user_id,
      full_name: e.profiles?.full_name || '',
      class_name: e.class_name,
      grade: e.grade,
    })).sort((a, b) => (a.class_name || '').localeCompare(b.class_name || '') || a.full_name.localeCompare(b.full_name))

    const allStudents = studentData || []
    setStudents(allStudents)

    // Unique classes
    const cls = [...new Set(allStudents.map(s => s.class_name).filter(Boolean))].sort()
    setClasses(cls)

    // Fetch progress + submissions for all students
    const userIds = allStudents.map(s => s.id)
    if (userIds.length > 0) {
      const [{ data: progData }, { data: subData }] = await Promise.all([
        supabase.from('lesson_progress').select('*').eq('lesson_id', id).in('user_id', userIds),
        supabase.from('lesson_submissions').select('*').eq('lesson_id', id).in('user_id', userIds),
      ])
      const pm = {}; (progData || []).forEach(p => { pm[p.user_id] = p })
      const sm = {}
      ;(subData || []).forEach(s => { if (!sm[s.user_id]) sm[s.user_id] = []; sm[s.user_id].push(s) })
      setProgressMap(pm)
      setSubmissionMap(sm)
    }

    setLoading(false)
  }

  function scoreToBonus(score) {
    if (score >= 10) return 3
    if (score >= 8) return 2
    if (score >= 5) return 1
    return 0
  }

  async function saveTaskComment(sub, student) {
    const theStudent = student || selected?.student
    if (!theStudent) return
    setTaskSaving(prev => ({ ...prev, [sub.id]: true }))
    const scoreRaw = taskScores[sub.id]
    const scoreVal = (scoreRaw !== '' && scoreRaw != null) ? parseFloat(scoreRaw) : null
    const awardSticker = !sub.sticker_awarded && scoreVal != null && !isNaN(scoreVal)
    const updates = {
      teacher_comment: taskComments[sub.id] ?? '',
      reviewed_at: new Date().toISOString(),
      score: (scoreVal != null && !isNaN(scoreVal)) ? scoreVal : null,
      graded_by: 'teacher',
      ...(awardSticker && { sticker_awarded: true }),
    }
    const { error } = await supabase.from('lesson_submissions').update(updates).eq('id', sub.id)
    setTaskSaving(prev => ({ ...prev, [sub.id]: false }))
    if (error) { toast.error('Lưu thất bại: ' + error.message); return }

    if (awardSticker) {
      const bonus = scoreToBonus(scoreVal)
      if (bonus > 0) {
        const { data: prof } = await supabase
          .from('profiles').select('sticker_count, sticker_total').eq('id', theStudent.id).single()
        const { error: stickerErr } = await supabase.from('profiles').update({
          sticker_count: (prof?.sticker_count ?? 0) + bonus,
          sticker_total: (prof?.sticker_total ?? 0) + bonus,
        }).eq('id', theStudent.id)
        if (stickerErr) toast.error('Không cập nhật được sticker: ' + stickerErr.message)
        else toast.success(`Đã cộng +${bonus} ⭐ cho ${theStudent.full_name}`)
      }
    }

    const taskIdx = sub.content_json?.task_index ?? 0
    toast.success(`Đã lưu nhận xét bài ${taskIdx + 1}`)

    // Cập nhật submissionMap
    setSubmissionMap(prev => {
      const oldSubs = prev[theStudent.id] || []
      return { ...prev, [theStudent.id]: oldSubs.map(s => s.id === sub.id ? { ...s, ...updates } : s) }
    })
    // Cập nhật selected (nếu đang mở trang chi tiết)
    setSelected(prev => prev?.student.id === theStudent.id
      ? { ...prev, submissions: prev.submissions.map(s => s.id === sub.id ? { ...s, ...updates } : s) }
      : prev)
    // Cập nhật gradeModal
    setGradeModal(prev => prev?.student.id === theStudent.id ? { ...prev } : prev)
  }

  async function allowResubmit(sub, student) {
    const theStudent = student || selected?.student
    if (!theStudent) return
    const isAllow = !sub.allow_resubmit
    const { error } = await supabase.from('lesson_submissions')
      .update({ allow_resubmit: isAllow })
      .eq('id', sub.id)
    if (error) { toast.error('Thất bại: ' + error.message); return }
    toast.success(isAllow ? `Đã cho phép ${theStudent.full_name} nộp lại` : 'Đã hủy cho phép nộp lại')
    const updates = { allow_resubmit: isAllow }
    setSubmissionMap(prev => {
      const oldSubs = prev[theStudent.id] || []
      return { ...prev, [theStudent.id]: oldSubs.map(s => s.id === sub.id ? { ...s, ...updates } : s) }
    })
    setSelected(prev => prev?.student.id === theStudent.id
      ? { ...prev, submissions: prev.submissions.map(s => s.id === sub.id ? { ...s, ...updates } : s) }
      : prev)
    setGradeModal(prev => prev?.student.id === theStudent.id ? { ...prev } : prev)
  }

  async function gradeOneStudent(student) {
    const subs = submissionMap[student.id] || []
    const taskDefs = parseTasks(lesson?.practice_instructions)
    const taskSubs = taskDefs.map((_, i) => subs.find(s => (s.content_json?.task_index ?? 0) === i) || null)
    const { results } = await gradeStudent(taskSubs, taskDefs)
    const now = new Date().toISOString()
    for (const { taskIndex, score, comment } of results) {
      const sub = taskSubs[taskIndex]
      if (!sub) continue
      const updates = { score, teacher_comment: comment, graded_by: 'ai', ai_graded_at: now }
      await supabase.from('lesson_submissions').update(updates).eq('id', sub.id)
      setSubmissionMap(prev => ({
        ...prev,
        [student.id]: (prev[student.id] || []).map(s => s.id === sub.id ? { ...s, ...updates } : s),
      }))
      setTaskScores(prev => ({ ...prev, [sub.id]: String(score) }))
      setTaskComments(prev => ({ ...prev, [sub.id]: comment }))
    }
  }

  async function gradeAllWithAI() {
    const taskDefs = parseTasks(lesson?.practice_instructions)
    const toGrade = displayedStudents.filter(s => {
      const subs = submissionMap[s.id] || []
      return subs.some(sub => sub && !sub.reviewed_at && sub.graded_by !== 'ai')
    })
    if (toGrade.length === 0) { toast('Không có bài mới nào cần chấm'); return }

    setAiGrading({ active: true, done: 0, total: toGrade.length, countdown: 0 })
    for (let i = 0; i < toGrade.length; i++) {
      try {
        await gradeOneStudent(toGrade[i])
        setAiGrading(prev => ({ ...prev, done: i + 1 }))
      } catch (err) {
        if (err.quotaType === 'quota_rpm') {
          for (let s = 60; s > 0; s--) {
            setAiGrading(prev => ({ ...prev, countdown: s }))
            await new Promise(r => setTimeout(r, 1000))
          }
          setAiGrading(prev => ({ ...prev, countdown: 0 }))
          i--; continue
        }
        if (err.quotaType === 'quota_rpd') {
          toast.error(`Hết quota hôm nay! Đã chấm ${i}/${toGrade.length} học sinh.`)
          break
        }
        toast.error(`Lỗi: ${toGrade[i].full_name} — ${err.message}`)
      }
      if (i < toGrade.length - 1) await new Promise(r => setTimeout(r, 4000))
    }
    setAiGrading({ active: false, done: 0, total: 0, countdown: 0 })
    toast.success('AI đã chấm xong!')
  }

  async function approveAiGrade(sub, student) {
    const awardSticker = !sub.sticker_awarded && sub.score != null
    const updates = { reviewed_at: new Date().toISOString(), ...(awardSticker && { sticker_awarded: true }) }
    await supabase.from('lesson_submissions').update(updates).eq('id', sub.id)
    setSubmissionMap(prev => ({
      ...prev,
      [student.id]: (prev[student.id] || []).map(s => s.id === sub.id ? { ...s, ...updates } : s),
    }))
    if (awardSticker) {
      const bonus = scoreToBonus(sub.score)
      if (bonus > 0) {
        const { data: prof } = await supabase.from('profiles').select('sticker_count, sticker_total').eq('id', student.id).single()
        await supabase.from('profiles').update({
          sticker_count: (prof?.sticker_count ?? 0) + bonus,
          sticker_total: (prof?.sticker_total ?? 0) + bonus,
        }).eq('id', student.id)
        toast.success(`Đã cộng +${bonus} ⭐ cho ${student.full_name}`)
      }
    }
  }

  async function approveAllAiGrades() {
    const now = new Date().toISOString()
    const toApprove = displayedStudents.flatMap(s =>
      (submissionMap[s.id] || [])
        .filter(sub => sub.graded_by === 'ai' && !sub.reviewed_at)
        .map(sub => ({ sub, student: s }))
    )
    if (toApprove.length === 0) { toast('Không có bài AI nào chưa duyệt'); return }
    setApprovingAll(true)
    await Promise.all(toApprove.map(({ sub }) => {
      const upd = { reviewed_at: now, ...(!sub.sticker_awarded && sub.score != null && { sticker_awarded: true }) }
      return supabase.from('lesson_submissions').update(upd).eq('id', sub.id)
    }))
    setSubmissionMap(prev => {
      const next = { ...prev }
      toApprove.forEach(({ sub, student }) => {
        const upd = { reviewed_at: now, ...(!sub.sticker_awarded && sub.score != null && { sticker_awarded: true }) }
        next[student.id] = (next[student.id] || []).map(s => s.id === sub.id ? { ...s, ...upd } : s)
      })
      return next
    })
    // Cộng sticker — chỉ những bài chưa từng được cộng
    const studentBonusMap = {}
    toApprove.forEach(({ sub, student }) => {
      if (!sub.sticker_awarded && sub.score != null) {
        const bonus = scoreToBonus(sub.score)
        if (bonus > 0) {
          if (!studentBonusMap[student.id]) studentBonusMap[student.id] = { student, bonus: 0 }
          studentBonusMap[student.id].bonus += bonus
        }
      }
    })
    await Promise.all(Object.values(studentBonusMap).map(async ({ student, bonus }) => {
      if (bonus <= 0) return
      const { data: prof } = await supabase.from('profiles').select('sticker_count, sticker_total').eq('id', student.id).single()
      await supabase.from('profiles').update({
        sticker_count: (prof?.sticker_count ?? 0) + bonus,
        sticker_total: (prof?.sticker_total ?? 0) + bonus,
      }).eq('id', student.id)
    }))
    setApprovingAll(false)
    toast.success(`Đã duyệt ${toApprove.length} bài AI!`)
    setShowAiReview(false)
  }

  function openGradeModal(e, student, taskIdx) {
    e.stopPropagation()
    const subs = submissionMap[student.id] || []
    const sub = subs.find(s => (s.content_json?.task_index ?? 0) === taskIdx)
    if (!sub) return // chưa nộp, không mở
    setGradeModal({ student, taskIdx })
    setTaskComments(prev => ({ ...prev, [sub.id]: sub.teacher_comment || '' }))
    setTaskScores(prev => ({ ...prev, [sub.id]: sub.score != null ? String(sub.score) : '' }))
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    )
  }

  const hasVideo = !!lesson?.video_url
  const hasQuiz = (lesson?.question_ids?.length || 0) > 0
  const hasPractice = lesson?.has_practice

  const displayedStudents = students.filter(s => {
    if (filterClass && s.class_name !== filterClass) return false
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      if (!s.full_name.toLowerCase().includes(q)) return false
    }
    return true
  }).sort((a, b) => {
    const aCount = (submissionMap[a.id] || []).length
    const bCount = (submissionMap[b.id] || []).length
    if (bCount !== aCount) return bCount - aCount
    return (a.class_name || '').localeCompare(b.class_name || '') || a.full_name.localeCompare(b.full_name)
  })

  // Stats
  const total = displayedStudents.length
  const videoCount = hasVideo ? displayedStudents.filter(s => progressMap[s.id]?.video_watched).length : null
  const quizCount = hasQuiz ? displayedStudents.filter(s => progressMap[s.id]?.quiz_passed).length : null
  const taskCount = parseTasks(lesson?.practice_instructions).length
  const practiceCount = hasPractice ? displayedStudents.filter(s => (submissionMap[s.id] || []).length >= taskCount).length : null
  const completedCount = displayedStudents.filter(s => progressMap[s.id]?.completed).length

  return (
    <div className={selected ? 'p-4 md:p-6 max-w-4xl mx-auto' : 'p-4 md:p-6'}>
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4 transition"
      >
        <ArrowLeft size={16} /> Bài học
      </button>

      <h1 className="text-xl font-bold text-gray-800 mb-1">{lesson?.title}</h1>
      <p className="text-sm text-gray-500 mb-5">{lesson?.grade} · Tiến độ học sinh</p>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap items-center">
        <select
          value={filterClass}
          onChange={e => setFilterClass(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Tất cả lớp</option>
          {classes.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Tìm học sinh..."
            className="border border-gray-300 rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-44"
          />
        </div>
        <span className="text-sm text-gray-500">{total} học sinh</span>
        {hasPractice && (
          <>
            <button
              onClick={gradeAllWithAI}
              disabled={aiGrading.active}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition"
            >
              {aiGrading.active ? (
                aiGrading.countdown > 0
                  ? <><Loader2 size={12} className="animate-spin" /> Đợi {aiGrading.countdown}s...</>
                  : <><Loader2 size={12} className="animate-spin" /> {aiGrading.done}/{aiGrading.total}...</>
              ) : (
                <><Bot size={13} /> AI Chấm tất cả</>
              )}
            </button>
            {(() => {
              const aiCount = displayedStudents.reduce((n, s) =>
                n + (submissionMap[s.id] || []).filter(sub => sub.graded_by === 'ai').length, 0)
              return aiCount > 0 ? (
                <button
                  onClick={() => setShowAiReview(true)}
                  className="flex items-center gap-1.5 bg-amber-50 border border-amber-300 text-amber-700 hover:bg-amber-100 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                >
                  <Bot size={13} /> Xem AI đã chấm ({aiCount})
                </button>
              ) : null
            })()}
          </>
        )}
        <div className={`ml-auto flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${realtimeConnected ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
          <Wifi size={11} className={realtimeConnected ? 'animate-pulse' : ''} />
          {realtimeConnected ? 'Đang cập nhật tự động' : 'Đang kết nối...'}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-indigo-700">{completedCount}/{total}</div>
          <div className="text-xs text-indigo-500 mt-0.5">Hoàn thành</div>
        </div>
        {hasVideo && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-blue-700">{videoCount}/{total}</div>
            <div className="text-xs text-blue-500 mt-0.5 flex items-center justify-center gap-1"><PlayCircle size={10} />Xem video</div>
          </div>
        )}
        {hasQuiz && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-green-700">{quizCount}/{total}</div>
            <div className="text-xs text-green-500 mt-0.5 flex items-center justify-center gap-1"><BookOpen size={10} />Đạt bài tập</div>
          </div>
        )}
        {hasPractice && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-orange-700">{practiceCount}/{total}</div>
            <div className="text-xs text-orange-500 mt-0.5 flex items-center justify-center gap-1"><Upload size={10} />Nộp thực hành</div>
          </div>
        )}
      </div>

      {selected ? (
        /* ── Submission detail ── */
        <div>
          <button
            onClick={() => { setSelected(null) }}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4 transition"
          >
            <ArrowLeft size={14} /> Danh sách
          </button>
          <div className="bg-indigo-600 text-white rounded-xl px-5 py-4 mb-5">
            <p className="font-semibold text-base">{selected.student.full_name}</p>
            <p className="text-indigo-200 text-sm mt-0.5">
              {selected.student.class_name ? `Lớp ${selected.student.class_name}` : selected.student.grade}
              {' · '}{selected.submissions.length}/{taskCount} bài đã nộp
            </p>
          </div>

          <div className="space-y-4 mb-6">
            {/* Per-task submissions */}
            {parseTasks(lesson?.practice_instructions).map((task, i) => {
              const sub = selected.submissions.find(s => (s.content_json?.task_index ?? 0) === i)
              return (
                <div key={i} className={`rounded-xl border p-4 space-y-3 ${sub ? 'border-gray-200' : 'border-dashed border-gray-200 bg-gray-50'}`}>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-700 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                    <span className="text-sm font-semibold text-gray-700">Bài {i + 1}</span>
                  </div>
                  {task.instructions && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                      <p className="text-xs font-semibold text-amber-700 mb-1">Đề bài:</p>
                      <MarkdownContent text={task.instructions} className="text-amber-900 text-sm" />
                    </div>
                  )}
                  {sub ? (() => {
                    const url = sub.file_url
                    const ext = url ? url.split('.').pop().toLowerCase().split('?')[0] : ''
                    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)
                    const isWord = ['doc', 'docx'].includes(ext)
                    const isPpt = ['ppt', 'pptx'].includes(ext)
                    const isSb3 = ext === 'sb3'
                    const isOffice = isWord || isPpt
                    const isCode = ext === 'py' || ext === 'txt'
                    const fileName = url ? decodeURIComponent(url.split('/').pop().split('?')[0]) : ''
                    return (
                      <div className="space-y-2">
                        <p className="text-xs text-gray-400">Nộp lúc {new Date(sub.submitted_at).toLocaleString('vi-VN')}</p>
                        {url && (
                          <div className="rounded-xl border border-gray-200 bg-gray-50 overflow-hidden">
                            {isImage && <img src={url} alt="" className="w-full max-h-60 object-contain bg-white border-b border-gray-200" />}
                            <div className="flex items-center gap-3 px-4 py-3">
                              {isImage ? <FileImage size={18} className="text-blue-400 shrink-0" />
                                : isWord ? <FileText size={18} className="text-blue-600 shrink-0" />
                                : isPpt ? <FileText size={18} className="text-orange-500 shrink-0" />
                                : isSb3 ? <File size={18} className="text-yellow-500 shrink-0" />
                                : ext === 'py' ? <Code size={18} className="text-green-600 shrink-0" />
                                : ext === 'txt' ? <FileText size={18} className="text-gray-500 shrink-0" />
                                : <File size={18} className="text-gray-400 shrink-0" />}
                              <span className="flex-1 text-sm text-gray-700 truncate">{fileName}</span>
                              <a href={url} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-indigo-600 hover:underline font-medium shrink-0">
                                <ExternalLink size={12} /> Tải xuống
                              </a>
                            </div>
                            {isCode && (
                              <div className="border-t border-gray-200 px-4 py-3">
                                <CodeViewer url={url} ext={ext} />
                              </div>
                            )}
                          </div>
                        )}
                        {isOffice && url && (
                          <div className="rounded-xl border border-gray-200 overflow-hidden bg-gray-100">
                            <iframe src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`}
                              width="100%" height="480" frameBorder="0" title="Xem file" className="w-full block" />
                          </div>
                        )}
                        {isSb3 && url && (
                          <Sb3Viewer url={url} />
                        )}
                        {sub.text_content && (
                          <div className="bg-gray-50 rounded-lg p-2 text-xs text-gray-600 whitespace-pre-wrap border">{sub.text_content}</div>
                        )}
                      </div>
                    )
                  })() : (
                    <p className="text-sm text-gray-400 italic">Học sinh chưa nộp bài này</p>
                  )}
                  {sub && (() => {
                    const subItem = selected.submissions.find(s => (s.content_json?.task_index ?? 0) === i)
                    if (!subItem) return null
                    return (
                      <div className="border-t border-gray-100 pt-3">
                        <p className="text-xs font-semibold text-indigo-600 mb-2 flex items-center gap-1.5">
                          <MessageSquare size={12} /> Nhận xét & điểm — Bài {i + 1}
                        </p>
                        <div className="flex items-center gap-2 mb-2">
                          <label className="text-xs text-gray-500 shrink-0">Điểm:</label>
                          <input type="number" min={0} max={10} step={0.5}
                            value={taskScores[subItem.id] ?? ''}
                            onChange={e => setTaskScores(prev => ({ ...prev, [subItem.id]: e.target.value }))}
                            placeholder="0–10"
                            className="w-20 border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          {subItem.score != null && (
                            <span className="text-xs text-gray-400">Hiện tại: <b className="text-indigo-600">{subItem.score}</b></span>
                          )}
                        </div>
                        <textarea
                          value={taskComments[subItem.id] ?? ''}
                          onChange={e => setTaskComments(prev => ({ ...prev, [subItem.id]: e.target.value }))}
                          rows={3}
                          placeholder={`Nhận xét bài ${i + 1}...`}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none mb-2"
                        />
                        <div className="flex gap-2">
                          <button onClick={() => saveTaskComment(subItem, selected.student)} disabled={!!taskSaving[subItem.id]}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50 transition">
                            {taskSaving[subItem.id] ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                            Lưu nhận xét bài {i + 1}
                          </button>
                          {subItem.reviewed_at && (
                            <button
                              onClick={() => allowResubmit(subItem, selected.student)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition
                                ${subItem.allow_resubmit
                                  ? 'border-orange-300 bg-orange-50 text-orange-600 hover:bg-orange-100'
                                  : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                            >
                              <RefreshCw size={11} />
                              {subItem.allow_resubmit ? 'Đã cho phép nộp lại' : 'Cho phép nộp lại'}
                            </button>
                          )}
                        </div>
                        {subItem.reviewed_at && (
                          <p className="text-xs text-gray-400 mt-1.5">Đã nhận xét lúc {new Date(subItem.reviewed_at).toLocaleString('vi-VN')}</p>
                        )}
                      </div>
                    )
                  })()}
                </div>
              )
            })}

            {selected.submissions.length === 0 && (
              <div className="text-center py-10 text-gray-400">
                <Upload size={32} className="mx-auto mb-2 opacity-30" />
                <p>Học sinh chưa nộp bài nào</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ── Student progress table ── */
        displayedStudents.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Users size={40} className="mx-auto mb-3 opacity-30" />
            <p>Không có học sinh nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="sticky left-0 z-10 bg-gray-50 text-left px-4 py-3 font-semibold text-gray-600 border-r border-gray-200 min-w-[220px] whitespace-nowrap">
                    Họ và tên
                  </th>
                  {hasVideo && (
                    <th className="px-3 py-3 font-semibold text-gray-600 text-center min-w-[80px] border-r border-gray-100 whitespace-nowrap">
                      Video
                    </th>
                  )}
                  {hasQuiz && (
                    <th className="px-3 py-3 font-semibold text-gray-600 text-center min-w-[110px] border-r border-gray-100 whitespace-nowrap">
                      Câu hỏi
                    </th>
                  )}
                  {hasPractice && Array.from({ length: taskCount }, (_, i) => (
                    <th key={i} className="px-3 py-3 font-semibold text-gray-600 text-center min-w-[90px] border-r border-gray-100 whitespace-nowrap">
                      Bài {i + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayedStudents.map((student, rowIdx) => {
                  const prog = progressMap[student.id]
                  const subs = submissionMap[student.id] || []
                  const completed = prog?.completed
                  return (
                    <tr key={student.id} className={`border-b border-gray-100 transition-colors ${rowIdx % 2 === 1 ? 'bg-gray-50/40' : 'bg-white'} hover:bg-indigo-50/30`}>
                      {/* Tên học sinh */}
                      <td className={`sticky left-0 z-10 px-4 py-3 border-r border-gray-200 ${rowIdx % 2 === 1 ? 'bg-gray-50/40' : 'bg-white'} hover:bg-indigo-50/30`}>
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0
                            ${completed ? 'bg-green-500 text-white' : 'bg-indigo-100 text-indigo-600'}`}>
                            {student.full_name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div className="min-w-0">
                            <button
                              onClick={() => {
                                if (!hasPractice) return
                                setSelected({ student, submissions: subs })
                                const comments = {}; const scores = {}
                                subs.forEach(s => { comments[s.id] = s.teacher_comment || ''; scores[s.id] = s.score != null ? String(s.score) : '' })
                                setTaskComments(comments); setTaskScores(scores)
                              }}
                              className={`font-medium text-gray-800 text-left leading-tight truncate block max-w-[160px] ${hasPractice ? 'hover:text-indigo-600 cursor-pointer' : 'cursor-default'}`}
                            >
                              {student.full_name}
                            </button>
                            <span className="text-xs text-gray-400">{student.class_name || student.grade}</span>
                          </div>
                        </div>
                      </td>

                      {/* Video */}
                      {hasVideo && (
                        <td className="px-3 py-3 text-center border-r border-gray-100">
                          {prog?.video_watched
                            ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full"><PlayCircle size={10} />✓</span>
                            : <span className="text-gray-300 text-sm">—</span>}
                        </td>
                      )}

                      {/* Câu hỏi */}
                      {hasQuiz && (
                        <td className="px-3 py-3 text-center border-r border-gray-100">
                          {prog?.quiz_passed
                            ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                                ✓ {prog.quiz_correct ?? 0}/{prog.quiz_total ?? lesson?.question_ids?.length ?? 0}
                              </span>
                            : (prog?.quiz_correct > 0)
                            ? <span className="text-xs text-gray-500">{prog.quiz_correct}/{lesson?.question_ids?.length ?? 0}</span>
                            : <span className="text-gray-300 text-sm">—</span>}
                        </td>
                      )}

                      {/* Các bài thực hành */}
                      {hasPractice && Array.from({ length: taskCount }, (_, i) => {
                        const sub = subs.find(s => (s.content_json?.task_index ?? 0) === i)
                        const reviewed = !!sub?.reviewed_at
                        const waiting = !!sub?.allow_resubmit
                        const aiGraded = sub?.graded_by === 'ai'
                        return (
                          <td key={i} className="px-3 py-3 text-center border-r border-gray-100">
                            {sub ? (
                              <button
                                onClick={e => openGradeModal(e, student, i)}
                                className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg transition
                                  ${waiting ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                                    : aiGraded ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                    : reviewed ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                                    : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                              >
                                {waiting ? <><RefreshCw size={10} /> chờ</>
                                  : aiGraded ? <>🤖 {sub.score != null ? `${sub.score}đ` : '?'}</>
                                  : reviewed ? (sub.score != null ? `${sub.score}đ` : '✓ chấm')
                                  : '✓ nộp'}
                              </button>
                            ) : (
                              <span className="text-gray-300 text-sm">—</span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* ── AI Review panel ── */}
      {showAiReview && (() => {
        const tasks = parseTasks(lesson?.practice_instructions)
        const rows = displayedStudents.flatMap(student =>
          (submissionMap[student.id] || [])
            .filter(sub => sub.graded_by === 'ai')
            .sort((a, b) => (a.content_json?.task_index ?? 0) - (b.content_json?.task_index ?? 0))
            .map(sub => ({ student, sub, taskIdx: sub.content_json?.task_index ?? 0 }))
        )
        const pendingCount = rows.filter(r => !r.sub.reviewed_at).length
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowAiReview(false)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
              onClick={e => e.stopPropagation()}>
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-5 py-4 rounded-t-2xl flex items-center justify-between shrink-0">
                <div>
                  <p className="font-black text-base flex items-center gap-2"><Bot size={16} /> Tổng hợp AI chấm ({rows.length} bài)</p>
                  <p className="text-amber-100 text-sm mt-0.5">{pendingCount} bài chưa duyệt · {rows.length - pendingCount} đã duyệt</p>
                </div>
                <div className="flex items-center gap-2">
                  {pendingCount > 0 && (
                    <button
                      onClick={approveAllAiGrades}
                      disabled={approvingAll}
                      className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition disabled:opacity-60"
                    >
                      {approvingAll ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                      Duyệt tất cả ({pendingCount})
                    </button>
                  )}
                  <button onClick={() => setShowAiReview(false)} className="text-white/70 hover:text-white text-xl leading-none ml-2">✕</button>
                </div>
              </div>
              <div className="overflow-y-auto flex-1">
                {rows.length === 0 ? (
                  <div className="text-center py-16 text-gray-400">
                    <Bot size={36} className="mx-auto mb-3 opacity-30" />
                    <p>Chưa có bài nào được AI chấm</p>
                  </div>
                ) : (
                  <table className="w-full text-sm border-collapse">
                    <thead className="sticky top-0 bg-gray-50 border-b border-gray-200 z-10">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600 min-w-[160px]">Học sinh</th>
                        <th className="text-left px-3 py-3 font-semibold text-gray-600 w-20">Lớp</th>
                        <th className="text-center px-3 py-3 font-semibold text-gray-600 w-16">Bài</th>
                        <th className="text-center px-3 py-3 font-semibold text-gray-600 w-20">Điểm AI</th>
                        <th className="text-left px-3 py-3 font-semibold text-gray-600">Nhận xét AI</th>
                        <th className="text-center px-3 py-3 font-semibold text-gray-600 w-32">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map(({ student, sub, taskIdx }, i) => (
                        <tr key={sub.id} className={`border-b border-gray-100 ${i % 2 === 1 ? 'bg-gray-50/40' : 'bg-white'}`}>
                          <td className="px-4 py-3 font-medium text-gray-800">{student.full_name}</td>
                          <td className="px-3 py-3 text-xs text-gray-500">{student.class_name || student.grade}</td>
                          <td className="px-3 py-3 text-center">
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-700 text-xs font-bold">{taskIdx + 1}</span>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span className={`text-sm font-bold ${sub.score >= 8 ? 'text-green-600' : sub.score >= 5 ? 'text-amber-600' : 'text-red-500'}`}>
                              {sub.score != null ? `${sub.score}đ` : '?'}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-xs text-gray-600 max-w-xs">
                            <span className="line-clamp-2">{sub.teacher_comment || <span className="text-gray-300 italic">Không có nhận xét</span>}</span>
                            {sub.ai_breakdown?.length > 0 && (
                              <table className="mt-1.5 w-full border-collapse">
                                <tbody>
                                  {sub.ai_breakdown.map((row, ri) => (
                                    <tr key={ri}>
                                      <td className="py-0.5 pr-2 text-[11px] text-gray-500 leading-snug">{row.criterion}</td>
                                      <td className="py-0.5 text-right whitespace-nowrap text-[11px] font-bold">
                                        <span className={row.earned >= row.max ? 'text-green-600' : 'text-red-500'}>
                                          {row.earned}/{row.max}đ
                                        </span>
                                      </td>
                                      {row.note && (
                                        <td className="py-0.5 pl-1.5 text-[10px] text-gray-400 italic">{row.note}</td>
                                      )}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {sub.reviewed_at ? (
                                <span className="text-xs text-green-600 font-semibold flex items-center gap-1"><CheckCircle size={11} />Đã duyệt</span>
                              ) : (
                                <button
                                  onClick={() => approveAiGrade(sub, student)}
                                  className="text-xs bg-green-100 hover:bg-green-200 text-green-700 font-semibold px-2.5 py-1 rounded-lg transition"
                                >
                                  Duyệt
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setShowAiReview(false)
                                  setTimeout(() => {
                                    setGradeModal({ student, taskIdx })
                                    setTaskComments(prev => ({ ...prev, [sub.id]: sub.teacher_comment || '' }))
                                    setTaskScores(prev => ({ ...prev, [sub.id]: sub.score != null ? String(sub.score) : '' }))
                                  }, 100)
                                }}
                                className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-semibold px-2.5 py-1 rounded-lg transition"
                              >
                                Sửa
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── Grade modal popup ── */}
      {gradeModal && (() => {
        const { student, taskIdx } = gradeModal
        const subs = submissionMap[student.id] || []
        const sub = subs.find(s => (s.content_json?.task_index ?? 0) === taskIdx)
        const tasks = parseTasks(lesson?.practice_instructions)
        const task = tasks[taskIdx]
        if (!sub) return null

        const url = sub.file_url
        const ext = url ? url.split('.').pop().toLowerCase().split('?')[0] : ''
        const isImage = ['jpg','jpeg','png','gif','webp'].includes(ext)
        const isWord = ['doc','docx'].includes(ext)
        const isPpt = ['ppt','pptx'].includes(ext)
        const isSb3 = ext === 'sb3'
        const isCode = ext === 'py' || ext === 'txt'
        const fileName = url ? decodeURIComponent(url.split('/').pop().split('?')[0]) : ''

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setGradeModal(null)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-5 py-4 rounded-t-2xl flex items-start justify-between">
                <div>
                  <p className="font-black text-base">{student.full_name}</p>
                  <p className="text-indigo-200 text-sm">{student.class_name || student.grade} · Bài thực hành {taskIdx + 1}</p>
                </div>
                <button onClick={() => setGradeModal(null)} className="text-white/70 hover:text-white text-xl leading-none ml-4">✕</button>
              </div>

              <div className="p-5 space-y-4">
                {/* Đề bài */}
                {(task?.instructions || task?.instruction_file_url) && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 space-y-2">
                    <p className="text-xs font-bold text-amber-700">Đề bài:</p>
                    {task.instructions && <MarkdownContent text={task.instructions} className="text-amber-900 text-sm" />}
                    {task.instruction_file_url && (() => {
                      const ext = task.instruction_file_url.split('.').pop().toLowerCase().split('?')[0]
                      const isOffice = ['doc','docx','ppt','pptx'].includes(ext)
                      const isPdf = ext === 'pdf'
                      return isPdf ? (
                        <a href={task.instruction_file_url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2 p-2 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 transition text-sm text-amber-800">
                          📄 <span className="truncate">{decodeURIComponent(task.instruction_file_url.split('/').pop().split('?')[0])}</span>
                          <span className="ml-auto shrink-0 text-xs">↗ Mở PDF</span>
                        </a>
                      ) : isOffice ? (
                        <iframe src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(task.instruction_file_url)}`}
                          width="100%" height="400" frameBorder="0" className="rounded-lg border border-amber-200 block w-full" />
                      ) : null
                    })()}
                  </div>
                )}

                {/* File nộp */}
                <div>
                  <p className="text-xs text-gray-400 mb-2">Nộp lúc {new Date(sub.submitted_at).toLocaleString('vi-VN')}</p>
                  {url && (
                    <div className="rounded-xl border border-gray-200 bg-gray-50 overflow-hidden">
                      {isImage && <img src={url} alt="" className="w-full max-h-64 object-contain bg-white border-b border-gray-200" />}
                      <div className="flex items-center gap-3 px-4 py-3">
                        {isImage ? <FileImage size={18} className="text-blue-400 shrink-0" />
                          : isWord ? <FileText size={18} className="text-blue-600 shrink-0" />
                          : isPpt ? <FileText size={18} className="text-orange-500 shrink-0" />
                          : isSb3 ? <File size={18} className="text-yellow-500 shrink-0" />
                          : ext === 'py' ? <Code size={18} className="text-green-600 shrink-0" />
                          : <File size={18} className="text-gray-400 shrink-0" />}
                        <span className="flex-1 text-sm text-gray-700 truncate">{fileName}</span>
                        <a href={url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-indigo-600 hover:underline font-medium shrink-0">
                          <ExternalLink size={12} /> Tải xuống
                        </a>
                      </div>
                      {isCode && (
                        <div className="border-t border-gray-200 px-4 py-3">
                          <CodeViewer url={url} ext={ext} />
                        </div>
                      )}
                    </div>
                  )}
                  {(isWord || isPpt) && url && (
                    <div className="rounded-xl border border-gray-200 overflow-hidden bg-gray-100 mt-2">
                      <iframe src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`}
                        width="100%" height="400" frameBorder="0" title="Xem file" className="w-full block" />
                    </div>
                  )}
                  {isSb3 && url && (
                    <div className="mt-2">
                      <Sb3Viewer url={url} />
                    </div>
                  )}
                  {sub.text_content && (
                    <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 whitespace-pre-wrap border mt-2">{sub.text_content}</div>
                  )}
                </div>

                {/* Chấm điểm */}
                <div className="border-t border-gray-100 pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-indigo-600 flex items-center gap-1.5">
                      <MessageSquare size={12} />
                      {sub.graded_by === 'ai' ? '🤖 AI đã chấm — kiểm tra & lưu' : 'Nhận xét & điểm'}
                    </p>
                    {!sub.reviewed_at && (
                      <button
                        onClick={async e => {
                          e.stopPropagation()
                          try {
                            await gradeOneStudent(student)
                            toast.success('AI đã chấm xong!')
                          } catch (err) {
                            toast.error(err.quotaType === 'quota_rpd' ? 'Hết quota hôm nay' : 'Lỗi AI: ' + err.message)
                          }
                        }}
                        className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-semibold"
                      >
                        <Bot size={12} /> AI chấm lại
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-500 shrink-0">Điểm:</label>
                    <input type="number" min={0} max={10} step={0.5}
                      value={taskScores[sub.id] ?? ''}
                      onChange={e => setTaskScores(prev => ({ ...prev, [sub.id]: e.target.value }))}
                      placeholder="0–10"
                      className="w-24 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    {sub.score != null && (
                      <span className="text-xs text-gray-400">Hiện tại: <b className="text-indigo-600">{sub.score}</b></span>
                    )}
                  </div>
                  <textarea
                    value={taskComments[sub.id] ?? ''}
                    onChange={e => setTaskComments(prev => ({ ...prev, [sub.id]: e.target.value }))}
                    rows={3} placeholder="Nhận xét cho học sinh..."
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                  <div className="flex gap-2">
                    <button onClick={() => saveTaskComment(sub, student)} disabled={!!taskSaving[sub.id]}
                      className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition">
                      {taskSaving[sub.id] ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                      Lưu nhận xét
                    </button>
                    <button onClick={() => setGradeModal(null)}
                      className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition">
                      Đóng
                    </button>
                  </div>
                  {sub.reviewed_at && (
                    <p className="text-xs text-gray-400">Đã nhận xét lúc {new Date(sub.reviewed_at).toLocaleString('vi-VN')}</p>
                  )}
                  {sub.reviewed_at && (
                    <button
                      onClick={() => allowResubmit(sub, student)}
                      className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl border text-sm font-medium transition
                        ${sub.allow_resubmit
                          ? 'border-orange-300 bg-orange-50 text-orange-600 hover:bg-orange-100'
                          : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                    >
                      <RefreshCw size={13} />
                      {sub.allow_resubmit ? '✓ Đã cho phép nộp lại — bấm để hủy' : 'Cho phép nộp lại'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
