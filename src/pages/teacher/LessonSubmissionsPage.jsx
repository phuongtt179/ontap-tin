import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { ArrowLeft, MessageSquare, CheckCircle, Loader2, PlayCircle, BookOpen, Upload, Users, FileText, FileImage, File, ExternalLink, Code, Play, TerminalSquare } from 'lucide-react'
import MarkdownContent from '../../components/ui/MarkdownContent'
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
  const [loading, setLoading] = useState(true)

  const [selected, setSelected] = useState(null) // { student, submissions }
  const [taskComments, setTaskComments] = useState({}) // subId -> string
  const [taskScores, setTaskScores] = useState({})     // subId -> string
  const [taskSaving, setTaskSaving] = useState({})     // subId -> bool
  const [gradeModal, setGradeModal] = useState(null)  // { student, taskIdx } — popup chấm nhanh

  useEffect(() => { loadAll() }, [id])

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
    const isFirstGrade = sub.score == null && scoreVal != null && !isNaN(scoreVal)
    const updates = {
      teacher_comment: taskComments[sub.id] ?? '',
      reviewed_at: new Date().toISOString(),
      score: (scoreVal != null && !isNaN(scoreVal)) ? scoreVal : null,
    }
    const { error } = await supabase.from('lesson_submissions').update(updates).eq('id', sub.id)
    setTaskSaving(prev => ({ ...prev, [sub.id]: false }))
    if (error) { toast.error('Lưu thất bại: ' + error.message); return }

    if (isFirstGrade) {
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

  const displayedStudents = filterClass
    ? students.filter(s => s.class_name === filterClass)
    : students

  // Stats
  const total = displayedStudents.length
  const videoCount = hasVideo ? displayedStudents.filter(s => progressMap[s.id]?.video_watched).length : null
  const quizCount = hasQuiz ? displayedStudents.filter(s => progressMap[s.id]?.quiz_passed).length : null
  const taskCount = parseTasks(lesson?.practice_instructions).length
  const practiceCount = hasPractice ? displayedStudents.filter(s => (submissionMap[s.id] || []).length >= taskCount).length : null
  const completedCount = displayedStudents.filter(s => progressMap[s.id]?.completed).length

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
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
        <span className="text-sm text-gray-500">{total} học sinh</span>
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
                          <a href={`https://turbowarp.org/editor?project_url=${encodeURIComponent(url)}`}
                            target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 justify-center w-full py-2.5 rounded-xl border-2 border-dashed border-yellow-300 bg-yellow-50 text-yellow-700 text-sm font-medium hover:bg-yellow-100 transition">
                            <ExternalLink size={14} /> Mở trong TurboWarp (tab mới)
                          </a>
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
                        <button onClick={() => saveTaskComment(subItem, selected.student)} disabled={!!taskSaving[subItem.id]}
                          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50 transition">
                          {taskSaving[subItem.id] ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                          Lưu nhận xét bài {i + 1}
                        </button>
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
        /* ── Student progress list ── */
        displayedStudents.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Users size={40} className="mx-auto mb-3 opacity-30" />
            <p>Không có học sinh nào</p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayedStudents.map(student => {
              const prog = progressMap[student.id]
              const subs = submissionMap[student.id] || []
              const completed = prog?.completed
              const videoOk = !hasVideo || prog?.video_watched
              const quizOk = !hasQuiz || prog?.quiz_passed
              const practiceOk = !hasPractice || subs.length >= taskCount

              const steps = [hasVideo, hasQuiz, hasPractice].filter(Boolean)
              const done = [videoOk && hasVideo, quizOk && hasQuiz, practiceOk && hasPractice].filter(Boolean)
              const pct = steps.length > 0 ? Math.round((done.length / steps.length) * 100) : 0

              return (
                <div
                  key={student.id}
                  onClick={() => {
                    if (!hasPractice) return
                    setSelected({ student, submissions: subs })
                    const comments = {}; const scores = {}
                    subs.forEach(s => {
                      comments[s.id] = s.teacher_comment || ''
                      scores[s.id] = s.score != null ? String(s.score) : ''
                    })
                    setTaskComments(comments); setTaskScores(scores)
                  }}
                  className={`bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3 ${hasPractice ? 'cursor-pointer hover:border-indigo-300 hover:shadow-sm transition' : ''}`}
                >
                  {/* Avatar */}
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${completed ? 'bg-green-500 text-white' : 'bg-indigo-100 text-indigo-600'}`}>
                    {student.full_name?.[0]?.toUpperCase() || '?'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-800 text-sm">{student.full_name}</span>
                      <span className="text-xs text-gray-400">{student.class_name || student.grade}</span>
                    </div>

                    {/* Progress bar */}
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all ${pct === 100 ? 'bg-green-500' : pct > 0 ? 'bg-indigo-400' : 'bg-gray-200'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 shrink-0 w-8 text-right">{pct}%</span>
                    </div>

                    {/* Step badges */}
                    <div className="flex gap-1.5 mt-1.5 flex-wrap">
                      {hasVideo && (
                        <span className={`text-xs px-1.5 py-0.5 rounded flex items-center gap-0.5 font-medium
                          ${prog?.video_watched ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'}`}>
                          <PlayCircle size={9} /> Video {prog?.video_watched ? '✓' : '○'}
                        </span>
                      )}
                      {hasQuiz && (
                        <span className={`text-xs px-1.5 py-0.5 rounded flex items-center gap-0.5 font-medium
                          ${prog?.quiz_passed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                          <BookOpen size={9} /> Bài tập {prog?.quiz_passed ? `✓ ${prog.quiz_correct ?? 0}/${prog.quiz_total ?? ''}` : `${prog?.quiz_correct ?? 0}/${lesson?.question_ids?.length ?? 0}`}
                        </span>
                      )}
                      {hasPractice && Array.from({ length: taskCount }, (_, i) => {
                        const sub = subs.find(s => (s.content_json?.task_index ?? 0) === i)
                        const submitted = !!sub
                        const reviewed = !!sub?.reviewed_at
                        return (
                          <div key={i} className="flex flex-col items-center gap-0.5">
                            <button
                              onClick={submitted ? (e) => openGradeModal(e, student, i) : e => e.stopPropagation()}
                              className={`text-xs px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5 transition
                                ${reviewed ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                                  : submitted ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                  : 'bg-gray-100 text-gray-400 cursor-default'}`}>
                              <Upload size={9} /> B{i + 1}{submitted ? ' ✓' : ''}
                            </button>
                            {reviewed && <span className="text-[10px] text-indigo-600 leading-tight font-medium">{sub?.score != null ? `${sub.score}đ` : 'đã chấm'}</span>}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}

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
                      return isOffice ? (
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
                    <a href={`https://turbowarp.org/editor?project_url=${encodeURIComponent(url)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 justify-center w-full py-2.5 rounded-xl border-2 border-dashed border-yellow-300 bg-yellow-50 text-yellow-700 text-sm font-medium hover:bg-yellow-100 transition mt-2">
                      <ExternalLink size={14} /> Mở trong TurboWarp
                    </a>
                  )}
                  {sub.text_content && (
                    <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 whitespace-pre-wrap border mt-2">{sub.text_content}</div>
                  )}
                </div>

                {/* Chấm điểm */}
                <div className="border-t border-gray-100 pt-4 space-y-3">
                  <p className="text-xs font-bold text-indigo-600 flex items-center gap-1.5">
                    <MessageSquare size={12} /> Nhận xét & điểm
                  </p>
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
                </div>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
