import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../../lib/supabase'
import { useGrades } from '../../../hooks/useGrades'
import toast from 'react-hot-toast'
import { Loader2, Sparkles, Save } from 'lucide-react'

const TYPE_LABEL = {
  multiple_choice: 'Trắc nghiệm', true_false: 'Đúng/Sai', fill_blank: 'Điền từ', drag_word: 'Kéo thả',
  ordering: 'Sắp xếp', matching: 'Nối đôi', word_order: 'Sắp xếp từ',
}
const BATCH = 20

// Mô tả lựa chọn của câu hỏi thành 1 dòng cho AI hiểu ngữ cảnh
function describeOptions(q) {
  const opts = Array.isArray(q.options) ? q.options.filter(o => o?.text) : []
  if (q.type === 'matching') return opts.map((o, i) => `${o.text} ↔ ${q.match_options?.[i]?.text || ''}`).join(' | ')
  if (q.type === 'ordering') return opts.map(o => o.text).join(' → ')
  return opts.map(o => `${o.key}. ${o.text}`).join(' | ')
}

export default function HintsTab() {
  const { grades } = useGrades()
  const [pickedGrade, setPickedGrade] = useState('')
  const grade = pickedGrade || grades[0] || ''
  const [total, setTotal] = useState(null)
  const [questions, setQuestions] = useState(null)
  const [drafts, setDrafts] = useState({})   // questionId -> gợi ý nháp
  const [busy, setBusy] = useState(false)
  const [saving, setSaving] = useState(false)

  const missing = q => q.or('hint.is.null,hint.eq.').neq('type', 'essay')

  const load = useCallback(async () => {
    if (!grade) return
    const [{ count }, { data }] = await Promise.all([
      missing(supabase.from('questions').select('id', { count: 'exact', head: true }).eq('grade', grade)),
      missing(supabase.from('questions').select('id, type, question, options, match_options, correct_answer').eq('grade', grade))
        .order('created_at', { ascending: false }).limit(BATCH),
    ])
    setTotal(count ?? 0); setQuestions(data || []); setDrafts({})
  }, [grade])

  useEffect(() => { load() }, [load])

  async function generate() {
    setBusy(true)
    try {
      const items = questions.map(q => ({
        id: q.id, type: q.type, question: q.question,
        options: describeOptions(q) || undefined, correct_answer: q.correct_answer || undefined,
      }))
      const res = await fetch('/api/teacher-ai', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'hints', items }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { toast.error(res.status === 429 ? 'AI đang hết lượt, thử lại sau' : 'AI chưa soạn được, thử lại'); return }
      const ids = new Set(questions.map(q => q.id))
      const next = {}
      for (const h of data.hints || []) if (ids.has(h.id) && String(h.hint || '').trim()) next[h.id] = String(h.hint).trim()
      setDrafts(next)
      toast.success(`AI đã soạn ${Object.keys(next).length} gợi ý — đọc lại rồi bấm Lưu`)
    } catch { toast.error('Lỗi kết nối') }
    finally { setBusy(false) }
  }

  async function saveAll() {
    const entries = Object.entries(drafts).filter(([, h]) => h.trim())
    if (!entries.length) return
    setSaving(true)
    const results = await Promise.all(entries.map(([id, hint]) => supabase.from('questions').update({ hint: hint.trim() }).eq('id', id)))
    setSaving(false)
    const failed = results.filter(r => r.error).length
    if (failed) toast.error(`${failed} câu lưu thất bại`)
    toast.success(`Đã lưu ${entries.length - failed} gợi ý`)
    load()
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Khi học sinh làm sai, app hiện <b>gợi ý</b> của câu đó — nhưng nhiều câu chưa có gợi ý nên em không được hướng dẫn gì.
        AI soạn gợi ý theo từng lô {BATCH} câu (hướng suy nghĩ, không nói thẳng đáp án). Thầy/cô sửa nếu cần, xoá trống câu nào không muốn lưu, rồi bấm Lưu.
      </p>
      <div className="flex flex-wrap items-center gap-3 bg-white border border-gray-200 rounded-xl p-3">
        <select value={grade} onChange={e => { setPickedGrade(e.target.value); setQuestions(null) }}
          className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm">
          {grades.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        <span className="text-sm">{total === null ? '...' : <><b>{total}</b> câu chưa có gợi ý</>}</span>
        <div className="ml-auto flex gap-2">
          <button onClick={generate} disabled={busy || !questions?.length}
            className="flex items-center gap-1 text-sm font-semibold bg-violet-600 hover:bg-violet-700 text-white px-3 py-1.5 rounded-lg disabled:opacity-50">
            {busy ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />} AI soạn gợi ý cho {questions?.length || 0} câu
          </button>
          {Object.keys(drafts).length > 0 && (
            <button onClick={saveAll} disabled={saving}
              className="flex items-center gap-1 text-sm font-semibold bg-green-600 text-white px-3 py-1.5 rounded-lg disabled:opacity-50">
              <Save size={13} /> Lưu {Object.values(drafts).filter(h => h.trim()).length} gợi ý
            </button>
          )}
        </div>
      </div>

      {questions === null ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-indigo-400" /></div>
      ) : questions.length === 0 ? (
        <p className="text-center text-gray-400 py-10">Khoá này mọi câu đã có gợi ý 🎉</p>
      ) : (
        <div className="space-y-2">
          {questions.map((q, i) => (
            <div key={q.id} className="bg-white border border-gray-200 rounded-xl p-3 space-y-1.5">
              <div className="flex gap-2 items-start">
                <span className="text-[11px] font-semibold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full shrink-0">{i + 1}. {TYPE_LABEL[q.type] || q.type}</span>
                <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans flex-1 min-w-0 max-h-32 overflow-y-auto">{q.question}</pre>
              </div>
              <p className="text-xs text-gray-500">Đáp án: <b>{q.correct_answer}</b>{describeOptions(q) && <> · {describeOptions(q).slice(0, 160)}</>}</p>
              {drafts[q.id] !== undefined && (
                <input value={drafts[q.id]} onChange={e => setDrafts(d => ({ ...d, [q.id]: e.target.value }))}
                  className="w-full border border-violet-300 bg-violet-50/40 rounded-lg px-2 py-1.5 text-sm" placeholder="(để trống = không lưu)" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
