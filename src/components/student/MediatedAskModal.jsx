import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { X, Loader2, Send, BookOpen, MessageCircleQuestion } from 'lucide-react'
import toast from 'react-hot-toast'

const HEADER = {
  quiz: 'Hỏi thầy cô về câu này',
  practice: 'Hỏi thầy cô về bài thực hành',
  theory: 'Hỏi thầy cô',
}
const MAX_PENDING = 5   // tối đa số câu đang chờ trả lời trong một bài, tránh spam

// Khung hỏi ở chế độ "giáo viên làm trung gian": câu hỏi được gửi cho thầy cô;
// AI chỉ soạn nháp cho giáo viên, học sinh chỉ thấy câu trả lời SAU KHI giáo viên duyệt.
export default function MediatedAskModal({ open, onClose, mode = 'theory', context = {}, studentId }) {
  const [input, setInput] = useState('')
  const [items, setItems] = useState(null)   // câu hỏi của em trong bài này
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)
  const lessonId = context.lessonId

  useEffect(() => {
    if (!open || !studentId) return
    let alive = true
    let q = supabase.from('student_questions').select('id, question, answer, status, created_at, answered_at, seen_at, context')
      .eq('student_id', studentId).order('created_at', { ascending: true }).limit(50)
    q = lessonId ? q.eq('lesson_id', lessonId) : q.is('lesson_id', null)
    q.then(({ data }) => {
      if (!alive) return
      setItems(data || [])
      // đánh dấu đã xem các câu trả lời mới
      const unseen = (data || []).filter(x => x.status === 'answered' && !x.seen_at).map(x => x.id)
      if (unseen.length) supabase.from('student_questions').update({ seen_at: new Date().toISOString() }).in('id', unseen).then(() => {})
    })
    return () => { alive = false }
  }, [open, studentId, lessonId])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [items])

  if (!open) return null

  async function send() {
    const q = input.trim()
    if (!q || sending) return
    if ((items || []).filter(x => x.status === 'pending').length >= MAX_PENDING) {
      toast('Em đã có nhiều câu đang chờ thầy cô trả lời, em đợi thầy cô trả lời rồi hỏi tiếp nhé 🙏')
      return
    }
    setSending(true)
    // Chỉ lưu ngữ cảnh cần thiết — KHÔNG lưu đáp án đúng / gợi ý của câu hỏi
    const safeContext = {
      lessonTitle: context.lessonTitle || null,
      questionId: context.questionId || null,
      questionText: context.questionText || null,
      options: context.options || null,
      studentAnswer: context.studentAnswer || null,
      taskInstructions: context.taskInstructions ? String(context.taskInstructions).slice(0, 2000) : null,
    }
    const { data, error } = await supabase.from('student_questions')
      .insert({ student_id: studentId, lesson_id: lessonId || null, mode, question: q.slice(0, 1000), context: safeContext })
      .select('id, question, answer, status, created_at, answered_at, seen_at, context').single()
    setSending(false)
    if (error) { toast.error('Chưa gửi được câu hỏi, em thử lại nhé'); return }
    setItems(prev => [...(prev || []), data])
    setInput('')
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md h-[85vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-indigo-500 to-blue-500 px-5 py-4 text-white relative shrink-0">
          <button onClick={onClose} className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30">
            <X size={15} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center"><MessageCircleQuestion size={18} /></div>
            <div>
              <h2 className="font-black text-base leading-tight">{HEADER[mode] || HEADER.theory}</h2>
              <p className="text-white/80 text-xs">Thầy cô sẽ đọc và trả lời em sớm nhé!</p>
            </div>
          </div>
        </div>

        {(context.lessonTitle || context.questionText) && (
          <div className="bg-indigo-50 border-b border-indigo-100 px-4 py-2 text-xs space-y-0.5 shrink-0">
            {context.lessonTitle && (
              <div className="flex items-center gap-1.5 text-indigo-700 font-semibold"><BookOpen size={13} className="shrink-0" /> {context.lessonTitle}</div>
            )}
            {context.questionText && <div className="text-gray-500 leading-snug line-clamp-2">❓ {context.questionText}</div>}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50/50">
          {items === null ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-indigo-400" /></div>
          ) : items.length === 0 ? (
            <div className="text-center text-gray-400 text-sm py-8">
              <div className="text-4xl mb-2">🙋</div>
              Em chưa hiểu chỗ nào? Gõ câu hỏi bên dưới,<br />thầy cô sẽ trả lời em nhé!
            </div>
          ) : items.map(it => (
            <div key={it.id} className="space-y-2">
              <div className="flex justify-end">
                <div className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-br-md text-sm bg-gradient-to-br from-indigo-500 to-blue-600 text-white whitespace-pre-wrap shadow-md">
                  {it.question}
                  {it.context?.questionText && it.context.questionText !== context.questionText && (
                    <div className="text-[11px] text-white/70 mt-1 line-clamp-1">❓ {it.context.questionText}</div>
                  )}
                </div>
              </div>
              {it.status === 'answered' ? (
                <div className="flex justify-start">
                  <div className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-bl-md text-sm bg-white text-gray-800 border border-indigo-100 shadow-sm whitespace-pre-wrap">
                    <div className="text-[11px] font-bold text-indigo-600 mb-1">👩‍🏫 Thầy cô trả lời</div>
                    {it.answer}
                  </div>
                </div>
              ) : it.status === 'pending' ? (
                <p className="text-[11px] text-gray-400 italic pl-1">⏳ Đang chờ thầy cô trả lời…</p>
              ) : null}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-gray-200 bg-white px-3 py-3 flex gap-2 items-end shrink-0">
          <textarea value={input} onChange={e => setInput(e.target.value)} rows={2} maxLength={1000} disabled={sending}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder="Em muốn hỏi thầy cô điều gì?"
            className="flex-1 border border-gray-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50 resize-none leading-snug" />
          <button onClick={send} disabled={!input.trim() || sending}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center text-white hover:scale-105 active:scale-95 disabled:opacity-40 shadow-md shrink-0">
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </div>
  )
}
