import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../../lib/supabase'
import { apiFetch } from '../../../lib/apiFetch'
import { useAuth } from '../../../context/AuthContext'
import { maskNames, unmaskNames } from '../../../utils/anonymize'
import toast from 'react-hot-toast'
import { Loader2, Sparkles, Send, X } from 'lucide-react'

const MODE_LABEL = { quiz: 'Câu trắc nghiệm', practice: 'Bài thực hành', theory: 'Lý thuyết' }
const BATCH = 15

// Câu hỏi học sinh gửi thầy cô (chế độ giáo viên làm trung gian): AI soạn NHÁP theo đúng quy tắc gia sư,
// giáo viên đọc/sửa rồi mới gửi. Học sinh không bao giờ đọc được bản nháp chưa duyệt.
export default function QuestionsTab({ onChanged }) {
  const { user } = useAuth()
  const [items, setItems] = useState(null)
  const [drafts, setDrafts] = useState({})    // id -> { text, skip }
  const [busy, setBusy] = useState(false)
  const [sending, setSending] = useState({})

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('student_questions')
      .select('id, student_id, lesson_id, mode, question, context, created_at, profiles!student_questions_student_id_fkey(full_name), lessons(title, grade, description, ai_context, ai_tutor_notes)')
      .eq('status', 'pending').order('created_at', { ascending: true }).limit(100)
    if (error) { toast.error('Không tải được câu hỏi'); setItems([]); return }
    setItems(data || [])
    const ids = (data || []).map(q => q.id)
    if (!ids.length) { setDrafts({}); return }
    const { data: d } = await supabase.from('student_question_drafts').select('question_id, draft, skip_reason').in('question_id', ids)
    setDrafts(Object.fromEntries((d || []).map(x => [x.question_id, { text: x.draft || '', skip: x.skip_reason }])))
  }, [])

  useEffect(() => { load() }, [load])

  async function generate() {
    const todo = items.filter(q => !drafts[q.id]).slice(0, BATCH)
    if (!todo.length) return
    setBusy(true)
    try {
      // Đáp án + gợi ý của câu trắc nghiệm: giáo viên tra ở đây (học sinh không lưu đáp án khi gửi câu hỏi)
      const qIds = todo.map(q => q.context?.questionId).filter(Boolean)
      const { data: qs } = qIds.length ? await supabase.from('questions').select('id, correct_answer, hint').in('id', qIds) : { data: [] }
      const qMap = Object.fromEntries((qs || []).map(x => [x.id, x]))
      const codeToName = {}
      const payloadItems = todo.map((q, i) => {
        const code = `HS${String(i + 1).padStart(2, '0')}`
        codeToName[code] = q.profiles?.full_name
        const qq = qMap[q.context?.questionId] || {}
        return {
          id: q.id, mode: q.mode,
          question: maskNames(q.question, { [code]: q.profiles?.full_name }),   // ẩn tên nếu em tự gõ tên mình
          context: {
            lessonTitle: q.lessons?.title, lessonDescription: q.lessons?.description || '',
            aiContext: [q.lessons?.ai_context, q.lessons?.ai_tutor_notes].filter(s => s?.trim()).join('\n\n').slice(0, 5000),
            questionText: q.context?.questionText, options: q.context?.options, studentAnswer: q.context?.studentAnswer,
            correctAnswer: qq.correct_answer || undefined, hint: qq.hint || undefined,
            taskInstructions: q.context?.taskInstructions,
          },
        }
      })
      const res = await apiFetch('/api/teacher-ai', { action: 'answer_drafts', items: payloadItems })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { toast.error(res.status === 429 ? 'AI đang hết lượt, thử lại sau' : 'AI chưa soạn được, thử lại'); return }
      const rows = (data.drafts || []).filter(d => !d.error).map(d => ({
        question_id: d.id, draft: d.draft ? unmaskNames(d.draft, codeToName) : null, skip_reason: d.skip_reason || null,
      }))
      if (rows.length) await supabase.from('student_question_drafts').upsert(rows)
      setDrafts(prev => ({ ...prev, ...Object.fromEntries(rows.map(r => [r.question_id, { text: r.draft || '', skip: r.skip_reason }])) }))
      if (data.quota) toast.error('AI hết lượt giữa chừng — đã soạn được ' + rows.length + ' câu')
      else toast.success(`AI đã soạn nháp ${rows.length} câu — thầy/cô đọc lại rồi gửi`)
    } finally {
      setBusy(false)
    }
  }

  async function finish(q, status) {
    const text = (drafts[q.id]?.text || '').trim()
    if (status === 'answered' && !text) { toast.error('Câu trả lời đang trống'); return false }
    setSending(s => ({ ...s, [q.id]: true }))
    const { error } = await supabase.from('student_questions').update({
      status, answer: status === 'answered' ? text : null, answered_by: user.id, answered_at: new Date().toISOString(),
    }).eq('id', q.id)
    setSending(s => ({ ...s, [q.id]: false }))
    if (error) { toast.error('Lưu thất bại: ' + error.message); return false }
    setItems(prev => prev.filter(x => x.id !== q.id))
    return true
  }

  async function sendAllDrafted() {
    const ready = items.filter(q => drafts[q.id]?.text?.trim() && !drafts[q.id]?.skip)
    if (!ready.length || !confirm(`Gửi ${ready.length} câu trả lời cho học sinh? Thầy/cô nên đọc qua trước khi gửi.`)) return
    let ok = 0
    for (const q of ready) if (await finish(q, 'answered')) ok++
    toast.success(`Đã gửi ${ok} câu trả lời`)
    onChanged?.()
  }

  const readyCount = (items || []).filter(q => drafts[q.id]?.text?.trim() && !drafts[q.id]?.skip).length
  const noDraft = (items || []).filter(q => !drafts[q.id]).length

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Học sinh gửi câu hỏi trong bài học. <b>AI soạn nháp</b> câu trả lời theo cách gợi mở, không đưa đáp án;
        thầy/cô đọc, sửa nếu cần rồi bấm <b>Gửi</b>. Học sinh chỉ thấy câu trả lời <b>đã được thầy/cô duyệt</b>.
      </p>
      <div className="flex flex-wrap items-center gap-3 bg-white border border-gray-200 rounded-xl p-3">
        <span className="text-sm">{items === null ? '...' : <><b>{items.length}</b> câu đang chờ</>}</span>
        <div className="ml-auto flex gap-2">
          <button onClick={generate} disabled={busy || !noDraft}
            className="flex items-center gap-1 text-sm font-semibold bg-violet-600 hover:bg-violet-700 text-white px-3 py-1.5 rounded-lg disabled:opacity-50">
            {busy ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />} AI soạn nháp {Math.min(noDraft, BATCH)} câu
          </button>
          {readyCount > 0 && (
            <button onClick={sendAllDrafted}
              className="flex items-center gap-1 text-sm font-semibold bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg">
              <Send size={13} /> Gửi tất cả {readyCount} câu đã soạn
            </button>
          )}
        </div>
      </div>

      {items === null ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-indigo-400" /></div>
      ) : items.length === 0 ? (
        <p className="text-center text-gray-400 py-10">Không có câu hỏi nào đang chờ 🎉</p>
      ) : (
        <div className="space-y-3">
          {items.map(q => {
            const d = drafts[q.id]
            return (
              <div key={q.id} className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
                <div className="flex items-start gap-2 flex-wrap text-xs text-gray-500">
                  <b className="text-gray-800 text-sm">{q.profiles?.full_name || '?'}</b>
                  <span>· {q.lessons?.title || 'Không rõ bài'} · {MODE_LABEL[q.mode] || q.mode} · {new Date(q.created_at).toLocaleString('vi-VN')}</span>
                </div>
                {q.context?.questionText && <p className="text-xs text-gray-500 bg-gray-50 rounded px-2 py-1 line-clamp-2">❓ {q.context.questionText}</p>}
                <p className="text-sm font-semibold text-gray-800 whitespace-pre-wrap">“{q.question}”</p>
                {d?.skip && <p className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1">AI đề xuất bỏ qua: {d.skip}</p>}
                {d !== undefined && (
                  <textarea value={d.text} rows={4}
                    onChange={e => setDrafts(prev => ({ ...prev, [q.id]: { ...prev[q.id], text: e.target.value, skip: null } }))}
                    placeholder="Câu trả lời gửi học sinh…"
                    className="w-full border border-violet-200 bg-violet-50/30 rounded-lg px-2 py-1.5 text-sm" />
                )}
                <div className="flex justify-end gap-2">
                  {d === undefined && (
                    <button onClick={() => setDrafts(prev => ({ ...prev, [q.id]: { text: '', skip: null } }))}
                      className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600">Tự trả lời</button>
                  )}
                  <button onClick={() => finish(q, 'dismissed').then(ok => ok && onChanged?.())} disabled={sending[q.id]}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 disabled:opacity-50"><X size={12} /> Bỏ qua</button>
                  <button onClick={() => finish(q, 'answered').then(ok => ok && onChanged?.())} disabled={sending[q.id] || !d?.text?.trim()}
                    className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-green-600 text-white disabled:opacity-50"><Send size={12} /> Gửi</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
