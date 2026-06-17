import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Send, Loader2, MessageCircle, Search } from 'lucide-react'

export default function MessagesInboxPage() {
  const { user } = useAuth()
  const [threads, setThreads] = useState([])   // { student, messages, unread }
  const [selected, setSelected] = useState(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [search, setSearch] = useState('')
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => { loadAll() }, [])

  useEffect(() => {
    if (!selected) return
    const channel = supabase.channel('teacher_inbox_' + selected.student.id)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `student_id=eq.${selected.student.id}`
      }, payload => {
        setSelected(prev => {
          if (!prev) return prev
          if (prev.messages.some(m => m.id === payload.new.id)) return prev
          return { ...prev, messages: [...prev.messages, payload.new] }
        })
        setThreads(prev => prev.map(t =>
          t.student.id === selected.student.id && !t.messages.some(m => m.id === payload.new.id)
            ? { ...t, messages: [...t.messages, payload.new], lastMsg: payload.new }
            : t
        ))
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [selected?.student?.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selected?.messages])

  async function loadAll() {
    setLoading(true)
    // Lấy tất cả messages
    const { data: msgs } = await supabase.from('messages').select('*').order('created_at', { ascending: true })
    if (!msgs || msgs.length === 0) { setLoading(false); return }

    // Lấy thông tin học sinh
    const studentIds = [...new Set(msgs.map(m => m.student_id))]
    const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', studentIds)
    const { data: enrollments } = await supabase.from('student_enrollments').select('user_id, class_name').in('user_id', studentIds)
    const classMap = {}
    ;(enrollments || []).forEach(e => { classMap[e.user_id] = e.class_name })

    const profileMap = {}
    ;(profiles || []).forEach(p => { profileMap[p.id] = { ...p, class_name: classMap[p.id] || '' } })

    // Nhóm theo student
    const map = {}
    msgs.forEach(m => {
      if (!map[m.student_id]) map[m.student_id] = []
      map[m.student_id].push(m)
    })

    const result = Object.entries(map).map(([sid, messages]) => ({
      student: profileMap[sid] || { id: sid, full_name: 'Học sinh', class_name: '' },
      messages,
      lastMsg: messages[messages.length - 1],
      unread: messages.filter(m => m.sender_role === 'student' && !m.is_read).length,
    })).sort((a, b) => new Date(b.lastMsg.created_at) - new Date(a.lastMsg.created_at))

    setThreads(result)
    setLoading(false)
  }

  async function openThread(thread) {
    setSelected(thread)
    setInput('')
    // Đánh dấu đã đọc
    await supabase.from('messages').update({ is_read: true })
      .eq('student_id', thread.student.id).eq('sender_role', 'student').eq('is_read', false)
    setThreads(prev => prev.map(t =>
      t.student.id === thread.student.id ? { ...t, unread: 0 } : t
    ))
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'auto' }), 50)
  }

  async function sendReply() {
    const text = input.trim()
    if (!text || sending || !selected) return
    setSending(true)
    setInput('')
    const { data } = await supabase.from('messages').insert({
      student_id: selected.student.id,
      content: text,
      sender_role: 'teacher',
    }).select().single()
    if (data) {
      setSelected(prev => prev ? { ...prev, messages: [...prev.messages, data] } : prev)
      setThreads(prev => prev.map(t =>
        t.student.id === selected.student.id
          ? { ...t, messages: [...t.messages, data], lastMsg: data }
          : t
      ))
    }
    setSending(false)
    inputRef.current?.focus()
  }

  const filteredThreads = threads.filter(t =>
    t.student.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (t.student.class_name || '').toLowerCase().includes(search.toLowerCase())
  )
  const totalUnread = threads.reduce((s, t) => s + t.unread, 0)

  return (
    <div className="flex h-full overflow-hidden bg-gray-50">

      {/* ── Left: danh sách học sinh ── */}
      <div className={`flex flex-col border-r border-gray-200 bg-white shrink-0 transition-all
        ${selected ? 'hidden md:flex md:w-72' : 'flex w-full md:w-72'}`}>
        <div className="px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="font-black text-gray-800 text-base flex-1">Tin nhắn</h2>
            {totalUnread > 0 && (
              <span className="bg-red-500 text-white text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                {totalUnread > 9 ? '9+' : totalUnread}
              </span>
            )}
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Tìm học sinh..."
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={24} className="animate-spin text-indigo-400" />
            </div>
          ) : filteredThreads.length === 0 ? (
            <div className="text-center py-14">
              <MessageCircle size={36} className="text-gray-200 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">Chưa có tin nhắn</p>
            </div>
          ) : filteredThreads.map(t => (
            <button key={t.student.id} onClick={() => openThread(t)}
              className={`w-full px-4 py-3 text-left flex items-center gap-3 border-b border-gray-50 transition-all hover:bg-indigo-50/50
                ${selected?.student.id === t.student.id ? 'bg-indigo-50 border-l-2 border-l-indigo-500' : ''}`}>
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-sm font-black shrink-0">
                {t.student.full_name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={`text-sm leading-tight truncate ${t.unread > 0 ? 'font-black text-gray-900' : 'font-semibold text-gray-700'}`}>
                    {t.student.full_name}
                  </span>
                  <span className="text-[10px] text-gray-400 shrink-0 ml-1">
                    {new Date(t.lastMsg.created_at).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                {t.student.class_name && (
                  <span className="text-[10px] text-indigo-400 font-medium">{t.student.class_name} · </span>
                )}
                <span className={`text-xs truncate block ${t.unread > 0 ? 'text-gray-600 font-medium' : 'text-gray-400'}`}>
                  {t.lastMsg.sender_role === 'teacher' ? 'Bạn: ' : ''}{t.lastMsg.content}
                </span>
              </div>
              {t.unread > 0 && (
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center shrink-0">
                  {t.unread}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Right: chat thread ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
              <MessageCircle size={36} className="text-indigo-400" />
            </div>
            <p className="text-gray-600 font-semibold">Chọn một học sinh</p>
            <p className="text-gray-400 text-sm mt-1">để xem và trả lời tin nhắn</p>
          </div>
        ) : (
          <>
            {/* Thread header */}
            <div className="bg-white border-b border-gray-200 px-5 py-3 flex items-center gap-3 shrink-0">
              <button onClick={() => setSelected(null)}
                className="md:hidden text-gray-400 hover:text-gray-600 mr-1 text-sm font-medium">← Quay lại</button>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-sm font-black shrink-0">
                {selected.student.full_name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-gray-800 text-sm">{selected.student.full_name}</p>
                {selected.student.class_name && (
                  <p className="text-xs text-gray-400">{selected.student.class_name}</p>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {selected.messages.map((msg, i) => {
                const isTeacher = msg.sender_role === 'teacher'
                const time = new Date(msg.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                const date = new Date(msg.created_at).toLocaleDateString('vi-VN')
                const prevDate = i > 0 ? new Date(selected.messages[i-1].created_at).toLocaleDateString('vi-VN') : null
                return (
                  <div key={msg.id}>
                    {date !== prevDate && (
                      <div className="flex justify-center my-2">
                        <span className="text-[11px] text-gray-400 bg-white border border-gray-100 px-3 py-1 rounded-full shadow-sm">{date}</span>
                      </div>
                    )}
                    <div className={`flex ${isTeacher ? 'justify-end' : 'justify-start'}`}>
                      {!isTeacher && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-black shrink-0 mr-2 mt-auto mb-1">
                          {selected.student.full_name.charAt(0)}
                        </div>
                      )}
                      <div className={`max-w-[70%] flex flex-col gap-1 ${isTeacher ? 'items-end' : 'items-start'}`}>
                        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          isTeacher
                            ? 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white rounded-br-md shadow-md shadow-indigo-100'
                            : 'bg-white text-gray-800 rounded-bl-md border border-gray-100 shadow-sm'
                        }`}>
                          {msg.content}
                        </div>
                        <span className="text-[10px] text-gray-400 px-1">{time}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>

            {/* Reply input */}
            <div className="shrink-0 border-t border-gray-200 bg-white px-4 py-3">
              <div className="flex gap-2">
                <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendReply()}
                  placeholder={`Trả lời ${selected.student.full_name}...`}
                  className="flex-1 border border-gray-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50" />
                <button onClick={sendReply} disabled={!input.trim() || sending}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:scale-100 shadow-md shadow-indigo-200 shrink-0">
                  {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
