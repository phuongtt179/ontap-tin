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

  const classesInGrade = classes.filter(c => c.grade === grade)

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
        : 'Thầy/cô cho em biết đang hỏi về khoá/lớp nào ạ (vd: "lớp KN46 ..." hoặc "khoá KN-Tiểu học ..."), hoặc chọn ở ô phía trên.'
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

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto flex flex-col h-full">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles size={22} className="text-indigo-600" />
        <h1 className="text-xl font-bold text-gray-800">Hỏi AI về tiến độ lớp</h1>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        Ghi tên khoá hoặc lớp thẳng trong câu hỏi (vd: "lớp KN46 ..." hoặc "khoá KN-Tiểu học ...") hoặc chọn ở dưới để khỏi phải gõ lại mỗi lần. AI trả lời dựa trên dữ liệu tiến độ học bài / nộp bài thực hành thực tế — không dùng cho điểm danh hay đề thi.
      </p>

      <div className="flex gap-2 mb-4">
        <select value={grade} onChange={e => { setGrade(e.target.value); setClassName('') }}
          className="border rounded-lg px-3 py-2 text-sm flex-1">
          <option value="">-- Khoá (tuỳ chọn) --</option>
          {grades.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        <select value={className} onChange={e => setClassName(e.target.value)} disabled={!grade}
          className="border rounded-lg px-3 py-2 text-sm flex-1 disabled:bg-gray-100">
          <option value="">-- Lớp (tuỳ chọn) --</option>
          {classesInGrade.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto border rounded-xl bg-gray-50 p-4 space-y-3 min-h-[300px]">
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-sm text-gray-400 text-center py-2">Gõ câu hỏi có tên lớp, hoặc thử gợi ý:</p>
            {SUGGESTIONS.map(s => (
              <button key={s} onClick={() => handleAsk(s)}
                className="block w-full text-left text-sm bg-white border rounded-lg px-3 py-2 hover:bg-indigo-50">
                {s}
              </button>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap
              ${m.role === 'user' ? 'bg-indigo-600 text-white' : m.error ? 'bg-red-50 text-red-600' : 'bg-white border text-gray-700'}`}>
              {m.content}
            </div>
          </div>
        ))}
        {asking && (
          <div className="flex justify-start">
            <div className="bg-white border rounded-xl px-3 py-2 text-sm text-gray-400 flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" /> Đang lấy dữ liệu & trả lời...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 mt-3">
        <input
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAsk()}
          placeholder='Nhập câu hỏi (vd: "lớp KN46 tiến độ mới nhất")...'
          className="flex-1 border rounded-lg px-3 py-2 text-sm"
        />
        <button onClick={() => handleAsk()} disabled={asking || !question.trim()}
          className="bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50 flex items-center gap-1.5">
          <Send size={15} /> Gửi
        </button>
      </div>
    </div>
  )
}
