import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { X, Sparkles, Loader2, Send, GraduationCap, BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'

const HEADER = {
  quiz: { title: 'Hỏi trợ giảng về câu này', hint: 'Trợ giảng sẽ gợi ý, không nói thẳng đáp án nhé!' },
  practice: { title: 'Hỏi trợ giảng về bài thực hành', hint: 'Trợ giảng sẽ hướng dẫn con cách làm.' },
  theory: { title: 'Hỏi trợ giảng', hint: 'Con thắc mắc gì trong bài cứ hỏi nhé!' },
}

export default function AskTutorModal({ open, onClose, mode = 'theory', context = {}, studentId }) {
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [answer, setAnswer] = useState(null)
  const [escalated, setEscalated] = useState(false)
  const [escalating, setEscalating] = useState(false)

  if (!open) return null

  const head = HEADER[mode] || HEADER.theory

  async function askAI() {
    const q = question.trim()
    if (!q || loading) return
    setLoading(true)
    setAnswer(null)
    try {
      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, studentQuestion: q, context }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.answer) {
        toast.error(res.status === 429
          ? 'Trợ giảng đang bận, con thử lại sau chút nhé 🙏'
          : 'Chưa hỏi được trợ giảng, con thử lại nhé')
        return
      }
      setAnswer(data.answer)
      // Lưu lại mọi lần hỏi AI (kênh 'ai') để giáo viên xem lại
      const ctxPayload = { ...context, mode }
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
    const ctxPayload = { ...context, mode, aiAnswer: answer || null }
    const { error } = await supabase.from('messages').insert({
      student_id: studentId,
      sender_role: 'student',
      channel: 'teacher',
      content: question.trim() || '(Con cần thầy/cô giúp câu này ạ)',
      context: ctxPayload,
      is_read: false,
    })
    setEscalating(false)
    if (error) { toast.error('Chưa gửi được cho thầy/cô, con thử lại nhé'); return }
    setEscalated(true)
    toast.success('Đã gửi câu hỏi cho thầy/cô! 👩‍🏫')
  }

  function handleClose() {
    setQuestion(''); setAnswer(null); setEscalated(false)
    onClose?.()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[88vh] flex flex-col overflow-hidden"
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

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {/* Ngữ cảnh */}
          {(context.lessonTitle || context.questionText) && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl px-3.5 py-2.5 text-xs space-y-1">
              {context.lessonTitle && (
                <div className="flex items-center gap-1.5 text-indigo-700 font-semibold">
                  <BookOpen size={13} className="shrink-0" /> {context.lessonTitle}
                </div>
              )}
              {context.questionText && (
                <div className="text-gray-600 leading-snug line-clamp-3">❓ {context.questionText}</div>
              )}
            </div>
          )}

          {/* Ô nhập câu hỏi */}
          <textarea
            value={question}
            onChange={e => setQuestion(e.target.value)}
            disabled={loading}
            rows={3}
            placeholder="Con muốn hỏi gì? VD: em không hiểu chỗ này, hướng dẫn em với..."
            className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-400 resize-none disabled:bg-gray-50"
          />

          {!answer && (
            <button onClick={askAI} disabled={!question.trim() || loading}
              className="w-full py-3 rounded-2xl font-black text-white text-sm bg-gradient-to-r from-violet-500 to-indigo-500 shadow-lg shadow-indigo-200 disabled:opacity-40 transition hover:opacity-90 active:scale-95 flex items-center justify-center gap-2">
              {loading ? <><Loader2 size={16} className="animate-spin" /> Trợ giảng đang nghĩ...</> : <><Sparkles size={16} /> Hỏi trợ giảng</>}
            </button>
          )}

          {/* Câu trả lời AI */}
          {answer && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white shrink-0">
                  <Sparkles size={15} />
                </div>
                <div className="flex-1 bg-white border border-indigo-100 rounded-2xl rounded-tl-md px-4 py-3 text-sm text-gray-800 leading-relaxed shadow-sm whitespace-pre-wrap">
                  {answer}
                </div>
              </div>

              <button onClick={() => { setAnswer(null) }}
                className="w-full py-2 rounded-xl text-sm font-semibold text-indigo-600 border border-indigo-200 hover:bg-indigo-50 transition">
                Hỏi tiếp câu khác
              </button>
            </div>
          )}

          {/* Escalate lên thầy */}
          {escalated ? (
            <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-3 text-center text-sm text-green-700 font-semibold">
              ✅ Đã gửi cho thầy/cô. Con quay lại xem trả lời ở mục “Hỏi giáo viên” nhé!
            </div>
          ) : (
            <button onClick={askTeacher} disabled={escalating}
              className="w-full py-2.5 rounded-xl text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition flex items-center justify-center gap-2 disabled:opacity-50">
              {escalating ? <Loader2 size={15} className="animate-spin" /> : <GraduationCap size={16} />}
              {answer ? 'Vẫn chưa hiểu → Hỏi thầy/cô' : 'Hỏi thẳng thầy/cô'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
