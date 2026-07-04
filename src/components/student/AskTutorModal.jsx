import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { X, Sparkles, Loader2, Send, GraduationCap, BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'

const HEADER = {
  quiz: { title: 'Hỏi trợ giảng về câu này', hint: 'Trợ giảng sẽ gợi ý, không nói thẳng đáp án nhé!' },
  practice: { title: 'Hỏi trợ giảng về bài thực hành', hint: 'Trợ giảng sẽ hướng dẫn con cách làm.' },
  theory: { title: 'Hỏi trợ giảng', hint: 'Con thắc mắc gì trong bài cứ hỏi nhé!' },
}

export default function AskTutorModal({ open, onClose, mode = 'theory', context = {}, studentId }) {
  const [input, setInput] = useState('')
  const [chat, setChat] = useState([])        // [{ role:'student'|'ai', content }]
  const [loading, setLoading] = useState(false)
  const [escalated, setEscalated] = useState(false)
  const [escalating, setEscalating] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  function autoGrow(el) {
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 140) + 'px'
  }

  // Reset khi mở modal mới (ngữ cảnh mới)
  useEffect(() => {
    if (open) { setChat([]); setInput(''); setEscalated(false) }
  }, [open])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chat, loading])

  if (!open) return null

  const head = HEADER[mode] || HEADER.theory

  async function send() {
    const q = input.trim()
    if (!q || loading) return
    const newChat = [...chat, { role: 'student', content: q }]
    setChat(newChat)
    setInput('')
    if (inputRef.current) inputRef.current.style.height = 'auto'
    setLoading(true)
    try {
      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, context, messages: newChat }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.answer) {
        toast.error(res.status === 429
          ? 'Trợ giảng đang bận, con thử lại sau chút nhé 🙏'
          : 'Chưa hỏi được trợ giảng, con thử lại nhé')
        return
      }
      setChat([...newChat, { role: 'ai', content: data.answer }])
      // Lưu mọi lần hỏi AI (kênh 'ai') để giáo viên xem lại — KHÔNG lưu đáp án/hint
      const { correctAnswer, hint, ...safeContext } = context
      const ctxPayload = { ...safeContext, mode }
      supabase.from('messages').insert([
        { student_id: studentId, sender_role: 'student', channel: 'ai', content: q, context: ctxPayload, is_read: true },
        { student_id: studentId, sender_role: 'ai', channel: 'ai', content: data.answer, context: ctxPayload, is_read: true },
      ]).then(() => {})
    } catch {
      toast.error('Có lỗi xảy ra, con thử lại nhé')
    } finally {
      setLoading(false)
    }
  }

  async function askTeacher() {
    if (escalating) return
    setEscalating(true)
    const { correctAnswer, hint, ...safeContext } = context
    const lastStudent = [...chat].reverse().find(m => m.role === 'student')
    const lastAi = [...chat].reverse().find(m => m.role === 'ai')
    const ctxPayload = { ...safeContext, mode, aiAnswer: lastAi?.content || null }
    const { error } = await supabase.from('messages').insert({
      student_id: studentId,
      sender_role: 'student',
      channel: 'teacher',
      content: lastStudent?.content || '(Con cần thầy/cô giúp câu này ạ)',
      context: ctxPayload,
      is_read: false,
    })
    setEscalating(false)
    if (error) { toast.error('Chưa gửi được cho thầy/cô, con thử lại nhé'); return }
    setEscalated(true)
    toast.success('Đã gửi câu hỏi cho thầy/cô! 👩‍🏫')
  }

  function handleClose() {
    setChat([]); setInput(''); setEscalated(false)
    onClose?.()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md h-[85vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="bg-gradient-to-r from-violet-500 via-indigo-500 to-blue-500 px-5 py-4 text-white relative shrink-0">
          <button onClick={handleClose} className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30">
            <X size={15} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="font-black text-base leading-tight">{head.title}</h2>
              <p className="text-white/80 text-xs">{head.hint}</p>
            </div>
          </div>
        </div>

        {/* Ngữ cảnh */}
        {(context.lessonTitle || context.questionText) && (
          <div className="bg-indigo-50 border-b border-indigo-100 px-4 py-2 text-xs space-y-0.5 shrink-0">
            {context.lessonTitle && (
              <div className="flex items-center gap-1.5 text-indigo-700 font-semibold">
                <BookOpen size={13} className="shrink-0" /> {context.lessonTitle}
              </div>
            )}
            {context.questionText && (
              <div className="text-gray-500 leading-snug line-clamp-2">❓ {context.questionText}</div>
            )}
          </div>
        )}

        {/* Hội thoại */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50/50">
          {chat.length === 0 && !loading && (
            <div className="text-center text-gray-400 text-sm py-8">
              <div className="text-4xl mb-2">🤖</div>
              Con muốn hỏi gì nào? Gõ câu hỏi bên dưới nhé!
            </div>
          )}
          {chat.map((m, i) => {
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
                    ? 'bg-white text-gray-800 border border-indigo-100 rounded-bl-md shadow-sm'
                    : 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white rounded-br-md shadow-md'}`}>
                  {m.content}
                </div>
              </div>
            )
          })}
          {loading && (
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

        {/* Escalate */}
        {escalated ? (
          <div className="mx-4 mb-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2 text-center text-xs text-green-700 font-semibold shrink-0">
            ✅ Đã gửi cho thầy/cô. Con xem trả lời ở mục “Hỏi giáo viên” nhé!
          </div>
        ) : chat.some(m => m.role === 'ai') && (
          <button onClick={askTeacher} disabled={escalating}
            className="mx-4 mb-2 py-2 rounded-xl text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition flex items-center justify-center gap-2 disabled:opacity-50 shrink-0">
            {escalating ? <Loader2 size={14} className="animate-spin" /> : <GraduationCap size={15} />}
            Vẫn chưa hiểu → Hỏi thầy/cô
          </button>
        )}

        {/* Input */}
        <div className="border-t border-gray-200 bg-white px-3 py-3 flex gap-2 items-end shrink-0">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => { setInput(e.target.value); autoGrow(e.target) }}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            disabled={loading}
            rows={1}
            placeholder={chat.length ? 'Hỏi tiếp câu khác...' : 'Con muốn hỏi gì?'}
            className="flex-1 border border-gray-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50 resize-none overflow-y-auto leading-snug"
            style={{ maxHeight: 140 }}
          />
          <button onClick={send} disabled={!input.trim() || loading}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:scale-100 shadow-md shrink-0">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </div>
  )
}
