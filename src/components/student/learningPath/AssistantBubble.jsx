import { useState, useEffect, useMemo, useRef } from 'react'
import { ChevronRight, X, Send, Loader2, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../../../lib/supabase'
import { topicKeyOf } from '../../../utils/lessonSteps'

// Bong bóng trợ lý AI nổi góc dưới phải — bóc nguyên khối chat mascot từ LearnPage.jsx.
// Hành vi giữ nguyên 100%: tự mở 1 lần/ngày, gợi ý bài mới/chưa xong, chat trực tiếp /api/tutor.
//
// `unlockedTopics`/`unlockedLessonMap`: dùng để lọc bỏ bài CHƯA MỞ KHOÁ khỏi
// mọi gợi ý/link (nudge lẫn nút "Vào học" trong câu trả lời AI) — trước đây
// dùng thẳng `lessons`/`displayedLessons` không lọc khoá, khiến học sinh bấm
// được vào bài bị khoá qua trợ lý AI dù con đường bài học đã ẩn/khoá nút đó.
export default function AssistantBubble({
  user, profile, lessons, displayedLessons, progressMap,
  selectedGrade, courseScope, courseRoadmap, lessonsCompleted, navigate,
  unlockedTopics, unlockedLessonMap,
}) {
  const isUnlockedLesson = l => {
    if (unlockedTopics == null || unlockedLessonMap == null) return true // không thuộc lớp nào -> không giới hạn
    return unlockedTopics.has(topicKeyOf(l)) && unlockedLessonMap.has(l.id)
  }
  const unlockedLessons = useMemo(() => lessons.filter(isUnlockedLesson), [lessons, unlockedTopics, unlockedLessonMap])
  const unlockedDisplayedLessons = useMemo(() => displayedLessons.filter(isUnlockedLesson), [displayedLessons, unlockedTopics, unlockedLessonMap])
  const [nudgeOpen, setNudgeOpen] = useState(() => {
    try { return localStorage.getItem('nudge_' + (user?.id || '')) !== new Date().toDateString() } catch { return true }
  })

  function closeNudge() {
    setNudgeOpen(false)
    try { localStorage.setItem('nudge_' + (user?.id || ''), new Date().toDateString()) } catch {}
  }

  const [chatMsgs, setChatMsgs] = useState([])       // [{role:'student'|'ai', content}]
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef(null)

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatMsgs, chatLoading])

  async function sendChat() {
    const q = chatInput.trim()
    if (!q || chatLoading) return
    const newMsgs = [...chatMsgs, { role: 'student', content: q }]
    setChatMsgs(newMsgs)
    setChatInput('')
    setChatLoading(true)
    try {
      await new Promise(r => setTimeout(r, 500 + Math.random() * 1500))
      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'theory',
          context: { courseScope, courseRoadmap, studentName: profile?.full_name || '', lessonsCompleted },
          messages: newMsgs,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.answer) {
        toast.error(res.status === 429
          ? (data.error === 'quota_rpd' ? 'Trợ lý đã hết lượt hỏi hôm nay, mai con hỏi tiếp nhé 🙏' : 'Nhiều bạn đang hỏi cùng lúc, con chờ chút rồi hỏi lại nhé 🙏')
          : 'Chưa hỏi được trợ lý, con thử lại nhé')
        return
      }
      setChatMsgs([...newMsgs, { role: 'ai', content: data.answer }])
      supabase.from('messages').insert([
        { student_id: user.id, sender_role: 'student', channel: 'ai', content: q, context: { from: 'home', grade: selectedGrade }, is_read: true },
        { student_id: user.id, sender_role: 'ai', channel: 'ai', content: data.answer, context: { from: 'home', grade: selectedGrade }, is_read: true },
      ]).then(() => {})
    } catch {
      toast.error('Có lỗi xảy ra, con thử lại nhé')
    } finally {
      setChatLoading(false)
    }
  }

  // Tách marker [[BÀI: tên]] trong câu trả lời AI → nút bấm vào bài
  function parseLessonLinks(content) {
    const re = /\[\[\s*BÀI\s*:\s*(.+?)\s*\]\]/gi
    const buttons = []
    const seen = new Set()
    let m
    while ((m = re.exec(content)) !== null) {
      const q = m[1].trim().toLowerCase()
      const lesson = unlockedLessons.find(l => l.title.trim().toLowerCase() === q)
        || unlockedLessons.find(l => { const t = l.title.trim().toLowerCase(); return t.includes(q) || q.includes(t) })
      if (lesson && !seen.has(lesson.id)) { seen.add(lesson.id); buttons.push({ id: lesson.id, title: lesson.title }) }
    }
    const text = content.replace(re, '').replace(/\n{3,}/g, '\n\n').trim()
    return { text, buttons }
  }

  // Mascot chào khi vào: giới thiệu bài mới / nhắc bài chưa hoàn thành
  const nudge = useMemo(() => {
    if (unlockedDisplayedLessons.length === 0) return null
    const firstName = (profile?.full_name || '').trim().split(/\s+/).slice(-1)[0] || 'em'
    const incomplete = unlockedDisplayedLessons.filter(l => !progressMap[l.id]?.completed)
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    const fresh = unlockedDisplayedLessons.filter(l =>
      !progressMap[l.id] && l.created_at && new Date(l.created_at).getTime() > weekAgo)
    const MAX = 5
    const toItems = arr => arr.slice(0, MAX).map(l => ({ id: l.id, title: l.title }))
    if (fresh.length > 0) return {
      kind: 'new', emoji: '🎉', firstName, badge: fresh.length,
      greeting: `Chào ${firstName}! 👋`,
      message: fresh.length === 1 ? 'Hôm nay có 1 bài mới nè, con học nhé!' : `Hôm nay có ${fresh.length} bài mới nè, con chọn bài để học nhé:`,
      items: toItems(fresh), more: Math.max(0, fresh.length - MAX),
    }
    if (incomplete.length > 0) return {
      kind: 'incomplete', emoji: '💪', firstName, badge: incomplete.length,
      greeting: `Chào ${firstName}! 👋`,
      message: incomplete.length === 1 ? 'Con còn 1 bài chưa hoàn thành, mình học tiếp nhé!' : `Con còn ${incomplete.length} bài chưa hoàn thành, con chọn bài để học tiếp nhé:`,
      items: toItems(incomplete), more: Math.max(0, incomplete.length - MAX),
    }
    return {
      kind: 'done', emoji: '🌟', firstName, badge: 0,
      greeting: `Chào ${firstName}! 🌟`,
      message: 'Con đã hoàn thành hết bài rồi, giỏi ghê! Chờ bài mới nha.',
      items: [], more: 0,
    }
  }, [unlockedDisplayedLessons, progressMap, profile?.full_name])

  if (!nudge) return null

  return (
    <>
      {/* Khung chat mascot — nổi góc phải dưới */}
      {nudgeOpen && (
        <div className="fixed bottom-4 right-4 z-50 w-[min(94vw,370px)]">
          <div className="rounded-3xl shadow-2xl overflow-hidden flex flex-col" style={{ height: 'min(78vh, 560px)', background: 'var(--card)', border: '2px solid var(--stone)' }}>
            {/* Header */}
            <div className="flex items-center gap-2.5 px-4 py-3 text-white shrink-0" style={{ background: 'linear-gradient(135deg, var(--grape), #5b3fe0)' }}>
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-2xl animate-bounce select-none" style={{ animationDuration: '2.5s' }}>
                🤖
              </div>
              <div className="flex-1 min-w-0 leading-tight">
                <div className="font-display font-black text-sm">Trợ lý học tập</div>
                <div className="text-white/80 text-[11px]">hỏi bài, hỏi chương trình, cách dùng app...</div>
              </div>
              <button onClick={closeNudge} className="w-7 h-7 rounded-full hover:bg-white/20 flex items-center justify-center" title="Thu gọn">
                <X size={16} />
              </button>
            </div>

            {/* Hội thoại */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ background: 'var(--sky)' }}>
              {/* Lời chào + chọn bài */}
              <div className="rounded-2xl rounded-tl-md px-3.5 py-3 shadow-sm" style={{ background: 'var(--card)', border: '1px solid var(--stone)' }}>
                <div className="font-display font-black text-[15px] leading-tight" style={{ color: 'var(--ink)' }}>{nudge.greeting}</div>
                <p className="text-sm mt-0.5 leading-snug" style={{ color: 'var(--ink-soft)' }}>{nudge.message}</p>
                {nudge.items.length > 0 && (
                  <div className="mt-2.5 space-y-1.5">
                    {nudge.items.map(it => (
                      <button
                        key={it.id}
                        onClick={() => navigate(`/student/learn/${it.id}`)}
                        className="w-full flex items-center gap-2 text-left rounded-xl px-2.5 py-2 transition group hover:brightness-95"
                        style={{ background: 'var(--sky)', border: '1px solid var(--stone)' }}
                      >
                        <span className="w-6 h-6 rounded-lg flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform" style={{ background: 'linear-gradient(135deg, var(--grape), #5b3fe0)' }}>
                          <ChevronRight size={14} />
                        </span>
                        <span className="flex-1 min-w-0 text-[13px] font-bold truncate" style={{ color: 'var(--grape)' }}>{it.title}</span>
                      </button>
                    ))}
                    {nudge.more > 0 && <p className="text-xs pt-0.5" style={{ color: 'var(--ink-soft)' }}>…và {nudge.more} bài khác ở danh sách</p>}
                  </div>
                )}
              </div>

              {/* Tin nhắn hội thoại */}
              {chatMsgs.map((m, i) => {
                const isAi = m.role === 'ai'
                const parsed = isAi ? parseLessonLinks(m.content) : null
                return (
                  <div key={i} className={`flex ${isAi ? 'justify-start' : 'justify-end'}`}>
                    {isAi && (
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white shrink-0 mr-2 mt-auto mb-0.5" style={{ background: 'linear-gradient(135deg, var(--grape), #5b3fe0)' }}>
                        <Sparkles size={13} />
                      </div>
                    )}
                    {isAi ? (
                      <div className="max-w-[82%] flex flex-col gap-1.5 items-start">
                        {parsed.text && (
                          <div className="px-3.5 py-2 rounded-2xl rounded-bl-md text-sm leading-relaxed whitespace-pre-wrap shadow-sm" style={{ background: 'var(--card)', color: 'var(--ink)', border: '1px solid var(--stone)' }}>
                            {parsed.text}
                          </div>
                        )}
                        {parsed.buttons.map(b => (
                          <button
                            key={b.id}
                            onClick={() => navigate(`/student/learn/${b.id}`)}
                            className="w-full flex items-center gap-2 text-left rounded-xl px-2.5 py-2 transition group hover:brightness-95"
                            style={{ background: 'var(--sky)', border: '1px solid var(--stone)' }}
                          >
                            <span className="w-6 h-6 rounded-lg flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform" style={{ background: 'linear-gradient(135deg, var(--grape), #5b3fe0)' }}>
                              <ChevronRight size={14} />
                            </span>
                            <span className="flex-1 min-w-0 text-[13px] font-bold truncate" style={{ color: 'var(--grape)' }}>Vào học: {b.title}</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="max-w-[82%] px-3.5 py-2 rounded-2xl rounded-br-md text-sm leading-relaxed whitespace-pre-wrap text-white shadow" style={{ background: 'linear-gradient(135deg, var(--grape), #3b5fe0)' }}>
                        {m.content}
                      </div>
                    )}
                  </div>
                )
              })}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white shrink-0 mr-2" style={{ background: 'linear-gradient(135deg, var(--grape), #5b3fe0)' }}>
                    <Sparkles size={13} />
                  </div>
                  <div className="rounded-2xl rounded-bl-md px-4 py-2.5 shadow-sm" style={{ background: 'var(--card)', border: '1px solid var(--stone)' }}>
                    <Loader2 size={15} className="animate-spin" style={{ color: 'var(--grape)' }} />
                  </div>
                </div>
              )}

              {/* Gợi ý câu hỏi (chỉ khi chưa chat) */}
              {chatMsgs.length === 0 && !chatLoading && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {['Khóa này học những gì?', 'Làm sao nộp bài?', 'Sticker để làm gì?'].map(s => (
                    <button
                      key={s}
                      onClick={() => { setChatInput(s); setTimeout(sendChat, 0) }}
                      className="text-xs font-semibold rounded-full px-3 py-1.5 transition hover:brightness-95"
                      style={{ color: 'var(--grape)', background: 'var(--sky)', border: '1px solid var(--stone)' }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Ô nhập */}
            <div className="px-3 py-2.5 flex gap-2 items-end shrink-0" style={{ background: 'var(--card)', borderTop: '1px solid var(--stone)' }}>
              <textarea
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat() } }}
                disabled={chatLoading}
                rows={1}
                placeholder="Hỏi trợ lý bất cứ điều gì..."
                className="flex-1 rounded-2xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 resize-none max-h-20"
                style={{ background: 'var(--sky)', border: '1px solid var(--stone)', color: 'var(--ink)' }}
              />
              <button
                onClick={sendChat}
                disabled={!chatInput.trim() || chatLoading}
                className="w-9 h-9 rounded-full flex items-center justify-center text-white transition hover:scale-105 active:scale-95 disabled:opacity-40 disabled:scale-100 shadow shrink-0"
                style={{ background: 'linear-gradient(135deg, var(--grape), #5b3fe0)' }}
              >
                {chatLoading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Nút nổi mở lại khung chat (khi đã thu gọn) */}
      {!nudgeOpen && (
        <button
          onClick={() => setNudgeOpen(true)}
          className="fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-3xl select-none hover:scale-110 active:scale-95 transition-transform animate-bounce"
          style={{ animationDuration: '2.5s', background: 'linear-gradient(135deg, var(--grape), #5b3fe0)' }}
          title="Trợ lý học tập"
        >
          🤖
          {nudge.badge > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-rose-500 text-white text-[11px] font-bold flex items-center justify-center border-2 border-white">
              {nudge.badge}
            </span>
          )}
        </button>
      )}
    </>
  )
}
