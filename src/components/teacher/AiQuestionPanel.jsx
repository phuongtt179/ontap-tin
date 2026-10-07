import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { getLessonSource } from '../../utils/lessonSource'
import { parseQuestions } from '../../utils/questionParser'
import { checkParsedQuestions } from '../../utils/questionCheck'
import toast from 'react-hot-toast'
import { Sparkles, Loader2 } from 'lucide-react'
import { apiFetch } from '../../lib/apiFetch'

const TYPES = [
  ['multiple_choice', 'Trắc nghiệm'], ['true_false', 'Đúng/Sai'], ['fill_blank', 'Điền từ'], ['drag_word', 'Kéo thả'],
  ['ordering', 'Sắp xếp'], ['matching', 'Nối đôi'], ['word_order', 'Sắp xếp từ'], ['essay', 'Tự luận'],
]
const DEFAULT_TYPES = ['multiple_choice', 'true_false', 'fill_blank', 'drag_word', 'ordering', 'matching']

// Khung "AI soạn câu hỏi" trong cửa sổ Nhập câu hỏi: AI viết văn bản đúng định dạng nhập,
// đổ vào ô dán → giáo viên dùng luồng Phân tích → Xem trước → Sửa → Lưu như bình thường.
export default function AiQuestionPanel({ grade, difficulty, onText }) {
  const [lessons, setLessons] = useState([])
  const [lessonId, setLessonId] = useState('')
  const [count, setCount] = useState(8)
  const [types, setTypes] = useState(DEFAULT_TYPES)
  const [extra, setExtra] = useState('')
  const [busy, setBusy] = useState(false)
  const [report, setReport] = useState(null)

  useEffect(() => {
    if (!grade) return
    supabase.from('lessons').select('id, title, topic, grade, ai_context, ai_tutor_notes, pptx_url')
      .eq('grade', grade).order('order')
      .then(({ data }) => { setLessons(data || []); setLessonId('') })
  }, [grade])

  const toggleType = t => setTypes(ts => ts.includes(t) ? ts.filter(x => x !== t) : [...ts, t])

  async function generate() {
    const lesson = lessons.find(l => l.id === lessonId)
    if (!lesson) { toast.error('Chọn bài học để AI dựa vào'); return }
    if (!types.length) { toast.error('Chọn ít nhất 1 loại câu hỏi'); return }
    setBusy(true); setReport(null)
    try {
      const { text, pdfUrl } = await getLessonSource(lesson)
      if (text.trim().length < 40 && !pdfUrl) { toast.error('Bài này chưa có lý thuyết, ghi chú gia sư hay slide để AI dựa vào'); return }
      const res = await apiFetch('/api/teacher-ai', {
          action: 'questions', lessonTitle: lesson.title, grade: lesson.grade, topic: lesson.topic,
          sourceText: text, ...(pdfUrl && { pdfUrl }), count, types, difficulty, extra,
        })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.text) { toast.error(res.status === 429 ? 'AI đang hết lượt, thử lại sau' : 'AI chưa soạn được, thử lại'); return }
      const parsed = parseQuestions(data.text)
      setReport({ total: parsed.length, issues: checkParsedQuestions(parsed) })
      onText(data.text)
      toast.success(`AI đã soạn ${parsed.length} câu — bấm "Phân tích" để xem trước và sửa`)
    } catch {
      toast.error('Có lỗi khi đọc nội dung bài hoặc gọi AI')
    } finally {
      setBusy(false)
    }
  }

  return (
    <details className="bg-violet-50 border border-violet-200 rounded-xl overflow-hidden" open>
      <summary className="px-4 py-2.5 text-sm font-semibold text-violet-800 cursor-pointer select-none flex items-center gap-1.5">
        <Sparkles size={14} /> AI soạn câu hỏi từ nội dung bài học
      </summary>
      <div className="px-4 pb-4 pt-1 space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <select value={lessonId} onChange={e => setLessonId(e.target.value)}
            className="col-span-2 border rounded-lg px-2 py-1.5 text-sm bg-white">
            <option value="">-- Chọn bài học ({grade || 'chọn khoá trước'}) --</option>
            {lessons.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
          </select>
          <select value={count} onChange={e => setCount(Number(e.target.value))} className="border rounded-lg px-2 py-1.5 text-sm bg-white">
            {[5, 8, 10, 15].map(n => <option key={n} value={n}>{n} câu</option>)}
          </select>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {TYPES.map(([k, label]) => (
            <button key={k} type="button" onClick={() => toggleType(k)}
              className={`text-xs px-2.5 py-1 rounded-full border ${types.includes(k) ? 'bg-violet-600 border-violet-600 text-white' : 'bg-white border-gray-300 text-gray-600'}`}>
              {label}
            </button>
          ))}
        </div>
        <input value={extra} onChange={e => setExtra(e.target.value)}
          placeholder="Yêu cầu thêm (tuỳ chọn) — vd: tập trung phần khối cảm biến âm thanh, có 2 câu đọc code"
          className="w-full border rounded-lg px-2 py-1.5 text-sm bg-white" />
        <div className="flex items-center gap-3">
          <button type="button" onClick={generate} disabled={busy || !lessonId}
            className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white px-3 py-1.5 rounded-lg text-sm font-semibold disabled:opacity-50">
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} {busy ? 'Đang soạn...' : 'AI soạn'}
          </button>
          <p className="text-[11px] text-gray-500 flex-1">Mức độ theo ô "Mức độ" phía trên. AI chỉ dựa vào lý thuyết / ghi chú gia sư / slide của bài. Luôn đọc lại trước khi lưu.</p>
        </div>
        {report && (
          <div className={`text-xs rounded-lg px-3 py-2 ${report.issues.length ? 'bg-amber-50 text-amber-800' : 'bg-green-50 text-green-700'}`}>
            Đã đưa {report.total} câu vào ô bên dưới.
            {report.issues.length > 0
              ? <> {report.issues.length} chỗ cần sửa: {report.issues.map(x => `Câu ${x.index + 1} ${x.msg}`).join('; ')}.</>
              : ' Không thấy lỗi cấu trúc — vẫn nên đọc lại nội dung.'}
          </div>
        )}
      </div>
    </details>
  )
}
