import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { parseQuestions } from '../../utils/questionParser'
import { checkParsedQuestions } from '../../utils/questionCheck'
import { splitPhrases } from '../../utils/wordOrder'
import { apiFetch } from '../../lib/apiFetch'
import toast from 'react-hot-toast'
import { Sparkles, Loader2 } from 'lucide-react'

const TYPES = [
  ['multiple_choice', 'Trắc nghiệm'], ['true_false', 'Đúng/Sai'], ['fill_blank', 'Điền từ'], ['drag_word', 'Kéo thả'],
  ['ordering', 'Sắp xếp'], ['matching', 'Nối đôi'], ['word_order', 'Sắp xếp thành câu'], ['essay', 'Tự luận'],
]
const DEFAULT_TYPES = ['multiple_choice', 'true_false', 'drag_word', 'ordering', 'matching', 'word_order']

// Lỗi cấu trúc khiến câu hỏi không chấm được → không lưu. Riêng "thiếu gợi ý" vẫn lưu (giáo viên bổ sung sau).
const isBlocking = msg => !/gợi ý/.test(msg)

// Khung "AI tạo câu hỏi mới" ở bước 2 khi tạo/sửa bài học: AI soạn từ lý thuyết + bài thực hành của chính bài này,
// lưu thẳng vào ngân hàng câu hỏi (đúng khoá/chủ đề/đơn vị của bài) rồi trả id để tự tích chọn cho bài học.
export default function AiNewQuestionsPanel({ form, userId, onCreated }) {
  const [count, setCount] = useState(10)
  const [types, setTypes] = useState(DEFAULT_TYPES)
  const [difficulty, setDifficulty] = useState('easy')
  const [extra, setExtra] = useState('')
  const [busy, setBusy] = useState(false)

  const toggleType = t => setTypes(ts => ts.includes(t) ? ts.filter(x => x !== t) : [...ts, t])

  function lessonSource() {
    const tasks = (form.practice_tasks || [])
      .filter(t => !t.optional && String(t.instructions || '').trim())
      .map((t, i) => `Bài thực hành ${i + 1}:\n${t.instructions}`).join('\n\n')
    return [form.description, form.ai_context, tasks].filter(s => String(s || '').trim()).join('\n\n')
  }

  async function generate() {
    if (!form.title?.trim()) { toast.error('Nhập tiêu đề bài học ở bước 1 trước'); return }
    if (!form.grade || !form.topic) { toast.error('Chọn khoá học và chủ đề ở bước 1 trước'); return }
    if (!types.length) { toast.error('Chọn ít nhất 1 loại câu hỏi'); return }
    const sourceText = lessonSource()
    if (sourceText.trim().length < 40) { toast.error('Bài chưa có lý thuyết để AI dựa vào — soạn lý thuyết ở bước 1 trước'); return }

    setBusy(true)
    try {
      const res = await apiFetch('/api/teacher-ai', {
        action: 'questions', lessonTitle: form.title, grade: form.grade, topic: form.topic,
        sourceText, count, types, difficulty, extra,
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.text) {
        toast.error(res.status === 429 ? 'AI đang hết lượt, thầy/cô thử lại sau ít phút'
          : res.status === 504 ? 'AI soạn quá lâu, thầy/cô thử lại với ít câu hơn' : 'AI chưa soạn được, thử lại nhé')
        return
      }
      const parsed = parseQuestions(data.text)
      const bad = new Set(checkParsedQuestions(parsed).filter(i => isBlocking(i.msg)).map(i => i.index))
      const good = parsed.filter((_, i) => !bad.has(i))
      if (!good.length) { toast.error('Câu hỏi AI soạn bị lỗi định dạng, thầy/cô bấm tạo lại nhé'); return }

      const rows = good.map(q => ({
        question: q.question,
        type: q.type,
        options: q.type === 'essay' ? [{ allow_file: false, max_score: 1 }] : q.options,
        match_options: q.match_options?.length ? q.match_options : null,
        correct_answer: q.type === 'essay' ? (q.correct_answer || null)
          : q.type === 'word_order' ? splitPhrases(q.correct_answer).sentence   // bỏ dấu "/" ngăn cụm
          : q.correct_answer,
        hint: q.hint || null,
        image_url: null,
        audio_url: null,
        grade: form.grade,
        topic: form.topic,
        unit_id: form.unit_id || null,
        lesson_title_id: form.lesson_title_id || null,
        difficulty,
        created_by: userId,
      }))
      const { data: inserted, error } = await supabase.from('questions').insert(rows).select('id')
      if (error) throw error
      onCreated((inserted || []).map(q => q.id))
      toast.success(`Đã tạo và lưu ${rows.length} câu hỏi mới vào ngân hàng, đã chọn cho bài này`
        + (bad.size ? ` (bỏ ${bad.size} câu AI soạn lỗi)` : ''))
    } catch (err) {
      toast.error('Có lỗi khi tạo câu hỏi: ' + (err.message || 'thử lại sau'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <details className="bg-violet-50 border border-violet-200 rounded-xl overflow-hidden mb-3">
      <summary className="px-4 py-2.5 text-sm font-semibold text-violet-800 cursor-pointer select-none flex items-center gap-1.5">
        <Sparkles size={14} /> AI tạo câu hỏi mới từ nội dung bài này (tự lưu vào ngân hàng câu hỏi)
      </summary>
      <div className="px-4 pb-4 pt-1 space-y-3">
        <p className="text-xs text-violet-700">
          AI đọc lý thuyết và bài thực hành ở bước 1 để soạn câu hỏi. Câu hỏi được lưu vào ngân hàng (khoá {form.grade || '—'}, chủ đề {form.topic || '—'})
          và tự tích chọn cho bài học. Thầy/cô sửa từng câu sau ở trang Câu hỏi nếu cần.
        </p>
        <div className="flex flex-wrap gap-2">
          <select value={count} onChange={e => setCount(Number(e.target.value))} disabled={busy}
            className="border rounded-lg px-2 py-1.5 text-sm bg-white">
            {[5, 8, 10, 15].map(n => <option key={n} value={n}>{n} câu</option>)}
          </select>
          <select value={difficulty} onChange={e => setDifficulty(e.target.value)} disabled={busy}
            className="border rounded-lg px-2 py-1.5 text-sm bg-white">
            <option value="easy">Dễ</option>
            <option value="medium">Trung bình</option>
            <option value="hard">Khó</option>
          </select>
          <input value={extra} onChange={e => setExtra(e.target.value)} disabled={busy} maxLength={500}
            placeholder="Yêu cầu thêm (tuỳ chọn), ví dụ: tập trung vào hiệu ứng Exit"
            className="flex-1 min-w-[200px] border rounded-lg px-2 py-1.5 text-sm bg-white" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {TYPES.map(([k, label]) => (
            <button key={k} type="button" onClick={() => toggleType(k)} disabled={busy}
              className={`text-xs px-2.5 py-1 rounded-full border ${types.includes(k) ? 'bg-violet-600 border-violet-600 text-white' : 'bg-white border-gray-300 text-gray-600'}`}>
              {label}
            </button>
          ))}
        </div>
        <div className="flex justify-end">
          <button type="button" onClick={generate} disabled={busy}
            className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-4 py-1.5 rounded-lg disabled:opacity-50">
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {busy ? 'AI đang soạn (khoảng 20–40 giây)...' : `Tạo ${count} câu hỏi mới`}
          </button>
        </div>
      </div>
    </details>
  )
}
