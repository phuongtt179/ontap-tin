import { useState, useEffect, useRef } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useGrades } from '../../hooks/useGrades'
import { Sparkles, Send, Loader2 } from 'lucide-react'

const SUGGESTIONS = [
  'Lớp KN46 tiến độ làm bài mới nhất thế nào?',
  'Khoá này có những bài học nào?',
  'Học sinh nào lâu rồi chưa học bài mới?',
  'Học sinh nào chưa hoàn thành bài nào cả?',
  'Còn bao nhiêu bài nộp chưa chấm?',
]

// Chuẩn hoá để so khớp gần đúng: bỏ dấu tiếng Việt, bỏ khoảng trắng/dấu câu, viết hoa.
// Nhờ vậy "lớp kn 46", "KN-46", "lop kn46" đều khớp được với tên lớp "KN46".
const DIACRITICS_RE = new RegExp('[̀-ͯ]', 'g')
function normalizeForMatch(s) {
  return (s || '')
    .normalize('NFD').replace(DIACRITICS_RE, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
}

// Tìm lớp được nhắc trong câu hỏi, khớp gần đúng với tên lớp.
function findMentionedClasses(text, classes) {
  const norm = normalizeForMatch(text)
  return classes.filter(c => c.name && norm.includes(normalizeForMatch(c.name)))
}

// Tìm khoá (grade) được nhắc trong câu hỏi, khớp gần đúng với tên khoá.
function findMentionedGrades(text, gradeValues) {
  const norm = normalizeForMatch(text)
  return gradeValues.filter(g => g && norm.includes(normalizeForMatch(g)))
}

// Chỉ lấy danh sách bài học của cả khoá — dùng khi câu hỏi không nhắm vào 1 lớp cụ thể
// (vd: "khoá KN-TIỂU HỌC có những bài nào").
async function buildCourseSnapshot(grade, classesInGrade) {
  const { data: lessonData, error } = await supabase
    .from('lessons')
    .select('title, "order"')
    .eq('grade', grade).eq('is_published', true)
    .order('order')
  if (error) throw error
  return {
    generatedAt: new Date().toISOString(),
    grade,
    lessons: (lessonData || []).map(l => l.title),
    totalLessonsInCourse: (lessonData || []).length,
    classesInThisCourse: classesInGrade.map(c => c.name),
  }
}

// Gom dữ liệu tiến độ của lớp thành 1 khối JSON gọn để gửi cho AI trả lời.
async function buildSnapshot(grade, className) {
  const { data: enrollData, error: enrollErr } = await supabase
    .from('student_enrollments')
    .select('user_id, profiles!inner(id, full_name)')
    .eq('grade', grade).eq('class_name', className).eq('is_approved', true)
  if (enrollErr) throw enrollErr
  const roster = (enrollData || []).map(e => ({ id: e.user_id, name: e.profiles.full_name }))
  const userIds = roster.map(s => s.id)

  const { data: lessonData, error: lessonErr } = await supabase
    .from('lessons')
    .select('id, title, "order"')
    .eq('grade', grade).eq('is_published', true)
    .order('order')
  if (lessonErr) throw lessonErr
  const lessons = lessonData || []
  const lessonIds = lessons.map(l => l.id)
  const lessonTitle = Object.fromEntries(lessons.map(l => [l.id, l.title]))

  let progress = [], submissions = []
  if (userIds.length && lessonIds.length) {
    const [{ data: pData }, { data: sData }] = await Promise.all([
      supabase.from('lesson_progress').select('*').in('user_id', userIds).in('lesson_id', lessonIds),
      supabase.from('lesson_submissions').select('*').in('user_id', userIds).in('lesson_id', lessonIds),
    ])
    progress = pData || []
    submissions = sData || []
  }

  const students = roster.map(s => {
    const myProgress = progress.filter(p => p.user_id === s.id)
    const mySubmissions = submissions.filter(sub => sub.user_id === s.id)
    const latest = myProgress.reduce((max, p) =>
      (!max || new Date(p.updated_at) > new Date(max.updated_at)) ? p : max, null)
    return {
      name: s.name,
      totalLessonsInCourse: lessons.length,
      lessonsCompleted: myProgress.filter(p => p.completed).length,
      latestLessonTitle: latest ? lessonTitle[latest.lesson_id] || null : null,
      latestUpdatedAt: latest ? latest.updated_at : null,
      practiceSubmissionsCount: mySubmissions.length,
      practiceSubmissionsPendingReview: mySubmissions.filter(sub => !sub.reviewed_at).length,
      // Chi tiết từng bài đã đụng tới — bài không có trong mảng này nghĩa là chưa bắt đầu.
      progressByLesson: myProgress.map(p => ({
        lesson: lessonTitle[p.lesson_id] || null,
        completed: !!p.completed,
        quizPassed: !!p.quiz_passed,
        practiceSubmitted: !!p.practice_submitted,
        updatedAt: p.updated_at,
      })),
    }
  })

  return {
    generatedAt: new Date().toISOString(),
    grade, className,
    // Danh sách đầy đủ tên bài trong khoá — dùng để đối chiếu khi giáo viên gõ tên bài
    // không chính xác 100% (thiếu số thứ tự, gõ tắt, thiếu dấu...).
    lessons: lessons.map(l => l.title),
    totalLessonsInCourse: lessons.length,
    studentCount: students.length,
    students,
  }
}

export default function AiAssistantPage() {
  const { profile } = useAuth()
  const { grades } = useGrades()
  const [classes, setClasses] = useState([])
  const [grade, setGrade] = useState('')
  const [className, setClassName] = useState('')
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState([])
  const [asking, setAsking] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    supabase.from('classes').select('name, grade').order('grade').order('name')
      .then(({ data }) => setClasses(data || []))
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, asking])

  // Chỉ giáo viên (không phải trợ giảng) được dùng tính năng này.
  if (profile && profile.role !== 'teacher') return <Navigate to="/teacher" replace />

  async function handleAsk(q) {
    const text = (q ?? question).trim()
    if (!text || asking) return

    // Ưu tiên LỚP được nhắc thẳng trong câu hỏi. Nếu không nhắc lớp mà có nhắc KHOÁ,
    // hoặc câu hỏi không cần đến 1 lớp cụ thể (vd hỏi danh sách bài học) → dùng phạm vi cả khoá.
    const mentionedClasses = findMentionedClasses(text, classes)
    const mentionedGrades = findMentionedGrades(text, grades)

    let target = null
    if (mentionedClasses.length === 1) {
      target = { kind: 'class', grade: mentionedClasses[0].grade, name: mentionedClasses[0].name }
    } else if (mentionedClasses.length === 0 && mentionedGrades.length === 1) {
      target = { kind: 'course', grade: mentionedGrades[0] }
    } else if (mentionedClasses.length === 0 && mentionedGrades.length === 0 && grade && className) {
      target = { kind: 'class', grade, name: className }
    } else if (mentionedClasses.length === 0 && mentionedGrades.length === 0 && grade) {
      target = { kind: 'course', grade }
    }

    setMessages(m => [...m, { role: 'user', content: text }])
    setQuestion('')

    if (!target) {
      const ambiguous = [...mentionedClasses.map(c => c.name), ...mentionedGrades]
      const msg = ambiguous.length > 1
        ? `Có nhiều lựa chọn khớp (${ambiguous.join(', ')}), thầy/cô ghi rõ hơn giúp em nhé.`
        : 'Thầy/cô cho em biết đang hỏi về khoá/lớp nào ạ (vd: "lớp KN46 ..." hoặc "khoá KN-Tiểu học ...").'
      setMessages(m => [...m, { role: 'ai', content: msg }])
      return
    }
    if (target.kind === 'class' && (target.grade !== grade || target.name !== className)) {
      setGrade(target.grade); setClassName(target.name)
    } else if (target.kind === 'course' && target.grade !== grade) {
      setGrade(target.grade); setClassName('')
    }

    setAsking(true)
    try {
      const snapshot = target.kind === 'class'
        ? await buildSnapshot(target.grade, target.name)
        : await buildCourseSnapshot(target.grade, classes.filter(c => c.grade === target.grade))
      const classLabel = target.kind === 'class' ? `${target.name} (${target.grade})` : `khoá "${target.grade}"`
      const res = await fetch('/api/teacher-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: text, classLabel, snapshot }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const msg = data.error === 'quota_rpd' || data.error === 'quota_rpm'
          ? 'AI đang quá tải, thầy/cô thử lại sau ít phút nhé.'
          : 'Có lỗi khi hỏi AI, thử lại sau.'
        setMessages(m => [...m, { role: 'ai', content: msg, error: true }])
        return
      }
      setMessages(m => [...m, { role: 'ai', content: data.answer }])
    } catch {
      setMessages(m => [...m, { role: 'ai', content: 'Không lấy được dữ liệu, thử lại sau.', error: true }])
    } finally {
      setAsking(false)
    }
  }

  function autoGrow(el) {
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 140) + 'px'
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto flex flex-col h-full">
      <div className="bg-white rounded-3xl shadow-lg flex-1 flex flex-col overflow-hidden min-h-[500px]">

        {/* Header */}
        <div className="bg-gradient-to-r from-violet-500 via-indigo-500 to-blue-500 px-5 py-4 text-white shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="font-black text-base leading-tight">Hỏi AI về tiến độ lớp</h2>
              <p className="text-white/80 text-xs">
                {grade && className ? `Đang hỏi về lớp ${className} (${grade})` : grade ? `Đang hỏi về khoá ${grade}` : 'Ghi tên khoá hoặc lớp trong câu hỏi nhé'}
              </p>
            </div>
          </div>
        </div>

        {/* Hội thoại */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50/50">
          {messages.length === 0 && !asking && (
            <div className="space-y-2">
              <div className="text-center text-gray-400 text-sm py-4">
                <div className="text-4xl mb-2">🤖</div>
                Thầy/cô muốn hỏi gì về tiến độ lớp nào?
              </div>
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => handleAsk(s)}
                  className="block w-full text-left text-sm bg-white border border-indigo-100 shadow-sm rounded-2xl px-4 py-2.5 hover:bg-indigo-50 transition">
                  {s}
                </button>
              ))}
            </div>
          )}
          {messages.map((m, i) => {
            const isAi = m.role === 'ai'
            return (
              <div key={i} className={`flex ${isAi ? 'justify-start' : 'justify-end'}`}>
                {isAi && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white shrink-0 mr-2 mt-auto mb-1">
                    <Sparkles size={14} />
                  </div>
                )}
                <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap
                  ${isAi
                    ? `bg-white text-gray-800 rounded-bl-md shadow-sm ${m.error ? 'border border-red-200 text-red-600' : 'border border-indigo-100'}`
                    : 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white rounded-br-md shadow-md'}`}>
                  {m.content}
                </div>
              </div>
            )
          })}
          {asking && (
            <div className="flex justify-start">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white shrink-0 mr-2">
                <Sparkles size={14} />
              </div>
              <div className="bg-white border border-indigo-100 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                <Loader2 size={16} className="animate-spin text-indigo-400" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 bg-white px-3 py-3 flex gap-2 items-end shrink-0">
          <textarea
            value={question}
            onChange={e => { setQuestion(e.target.value); autoGrow(e.target) }}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAsk() } }}
            disabled={asking}
            rows={1}
            placeholder='Nhập câu hỏi (vd: "lớp KN46 tiến độ mới nhất")...'
            className="flex-1 border border-gray-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50 resize-none overflow-y-auto leading-snug"
            style={{ maxHeight: 140 }}
          />
          <button onClick={() => handleAsk()} disabled={!question.trim() || asking}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:scale-100 shadow-md shrink-0">
            {asking ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </div>
  )
}
