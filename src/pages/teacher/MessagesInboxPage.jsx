import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Send, Loader2, MessageCircle, Search, Trash2, Users, X, PenSquare, BookOpen, Sparkles } from 'lucide-react'

export default function MessagesInboxPage() {
  const { user } = useAuth()
  const [threads, setThreads] = useState([])
  const [selected, setSelected] = useState(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [search, setSearch] = useState('')
  const [showAiLog, setShowAiLog] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const lastCreatedAtRef = useRef(null)

  // Nhắn tin nhóm lớp
  const [showGroup, setShowGroup] = useState(false)
  const [classes, setClasses] = useState([])
  const [groupClass, setGroupClass] = useState('')
  const [groupInput, setGroupInput] = useState('')
  const [groupSending, setGroupSending] = useState(false)

  // Filters
  const [filterClass, setFilterClass] = useState('')
  const [filterUnread, setFilterUnread] = useState(false)

  // Nhắn học sinh mới
  const [showNew, setShowNew] = useState(false)
  const [allStudents, setAllStudents] = useState([])
  const [newSearch, setNewSearch] = useState('')

  useEffect(() => { loadAll() }, [])

  useEffect(() => {
    if (!selected) return

    // Set mốc thời gian từ tin cuối cùng của thread hiện tại
    const msgs = selected.messages
    lastCreatedAtRef.current = msgs.length
      ? msgs[msgs.length - 1].created_at
      : new Date().toISOString()

    const channel = supabase.channel('teacher_inbox_' + selected.student.id)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `student_id=eq.${selected.student.id}`
      }, payload => {
        if ((payload.new.channel || 'teacher') !== 'teacher') return  // bỏ qua log AI
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
        lastCreatedAtRef.current = payload.new.created_at
      })
      .subscribe()

    // Polling fallback mỗi 4 giây
    const interval = setInterval(async () => {
      if (!lastCreatedAtRef.current) return
      const { data } = await supabase
        .from('messages').select('*')
        .eq('student_id', selected.student.id)
        .eq('channel', 'teacher')
        .gt('created_at', lastCreatedAtRef.current)
        .order('created_at', { ascending: true })
      if (data?.length) {
        setSelected(prev => {
          if (!prev) return prev
          const ids = new Set(prev.messages.map(m => m.id))
          const newMsgs = data.filter(m => !ids.has(m.id))
          return newMsgs.length ? { ...prev, messages: [...prev.messages, ...newMsgs] } : prev
        })
        setThreads(prev => prev.map(t => {
          if (t.student.id !== selected.student.id) return t
          const ids = new Set(t.messages.map(m => m.id))
          const newMsgs = data.filter(m => !ids.has(m.id))
          return newMsgs.length ? { ...t, messages: [...t.messages, ...newMsgs], lastMsg: data[data.length - 1] } : t
        }))
        lastCreatedAtRef.current = data[data.length - 1].created_at
      }
    }, 4000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [selected?.student?.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selected?.messages])

  useEffect(() => {
    supabase.from('student_enrollments').select('class_name').then(({ data }) => {
      const cls = [...new Set((data || []).map(e => e.class_name).filter(Boolean))].sort()
      setClasses(cls)
      if (cls.length) setGroupClass(cls[0])
    })
  }, [])

  useEffect(() => {
    if (!showNew || allStudents.length) return
    async function loadStudents() {
      const { data: profiles } = await supabase
        .from('profiles').select('id, full_name').eq('role', 'student').eq('is_approved', true)
      const { data: enrolls } = await supabase
        .from('student_enrollments').select('user_id, class_name').eq('is_approved', true)
      const classMap = {}
      ;(enrolls || []).forEach(e => { classMap[e.user_id] = e.class_name })
      setAllStudents((profiles || []).map(p => ({ ...p, class_name: classMap[p.id] || '' }))
        .sort((a, b) => (a.class_name || '').localeCompare(b.class_name || '') || a.full_name.localeCompare(b.full_name)))
    }
    loadStudents()
  }, [showNew])

  function openNewThread(student) {
    setShowNew(false)
    setNewSearch('')
    // Nếu đã có thread thì mở luôn
    const existing = threads.find(t => t.student.id === student.id)
    if (existing) { openThread(existing); return }
    // Tạo thread tạm (chưa có tin nhắn)
    setSelected({ student, messages: [], unread: 0, lastMsg: null })
    setInput('')
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  async function sendGroupMessage() {
    const text = groupInput.trim()
    if (!text || !groupClass || groupSending) return
    setGroupSending(true)
    // Lấy tất cả học sinh trong lớp
    const { data: enrolls } = await supabase
      .from('student_enrollments').select('user_id').eq('class_name', groupClass).eq('is_approved', true)
    if (!enrolls?.length) {
      setGroupSending(false)
      return
    }
    // Insert 1 message cho từng học sinh
    const rows = enrolls.map(e => ({
      student_id: e.user_id,
      sender_role: 'teacher',
      content: `📢 [Lớp ${groupClass}] ${text}`,
      is_read: false,
    }))
    await supabase.from('messages').insert(rows)
    setGroupInput('')
    setGroupSending(false)
    setShowGroup(false)
    // Reload danh sách thread
    loadAll()
  }

  async function loadAll() {
    setLoading(true)
    const { data: allMsgs } = await supabase.from('messages').select('*').order('created_at', { ascending: true })
    if (!allMsgs || allMsgs.length === 0) { setThreads([]); setLoading(false); return }

    // Tách kênh: 'teacher' = chat thật với giáo viên, 'ai' = log hỏi trợ giảng
    const teacherMsgs = allMsgs.filter(m => (m.channel || 'teacher') === 'teacher')
    const aiMsgs = allMsgs.filter(m => m.channel === 'ai')

    const studentIds = [...new Set(allMsgs.map(m => m.student_id))]
    const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', studentIds)
    const { data: enrollments } = await supabase.from('student_enrollments').select('user_id, class_name').in('user_id', studentIds)
    const classMap = {}
    ;(enrollments || []).forEach(e => { classMap[e.user_id] = e.class_name })
    const profileMap = {}
    ;(profiles || []).forEach(p => { profileMap[p.id] = { ...p, class_name: classMap[p.id] || '' } })

    const tMap = {}; teacherMsgs.forEach(m => { (tMap[m.student_id] ||= []).push(m) })
    const aMap = {}; aiMsgs.forEach(m => { (aMap[m.student_id] ||= []).push(m) })

    const result = studentIds.map(sid => {
      const messages = tMap[sid] || []
      const aiMessages = aMap[sid] || []
      const lastT = messages[messages.length - 1]
      const lastA = aiMessages[aiMessages.length - 1]
      const lastAt = Math.max(lastT ? +new Date(lastT.created_at) : 0, lastA ? +new Date(lastA.created_at) : 0)
      return {
        student: profileMap[sid] || { id: sid, full_name: 'Học sinh', class_name: '' },
        messages, aiMessages,
        lastMsg: lastT || lastA,
        lastAt,
        unread: messages.filter(m => m.sender_role === 'student' && !m.is_read).length,
      }
    }).sort((a, b) => b.lastAt - a.lastAt)

    setThreads(result)
    setLoading(false)
  }

  async function openThread(thread) {
    setSelected(thread)
    setInput('')
    setShowAiLog(false)
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

  async function deleteMessage(msgId) {
    if (!window.confirm('Xóa tin nhắn này?')) return
    await supabase.from('messages').delete().eq('id', msgId)
    setSelected(prev => prev ? { ...prev, messages: prev.messages.filter(m => m.id !== msgId) } : prev)
    setThreads(prev => prev.map(t => {
      if (!t.messages.some(m => m.id === msgId)) return t
      const remaining = t.messages.filter(m => m.id !== msgId)
      return { ...t, messages: remaining, lastMsg: remaining[remaining.length - 1] || t.lastMsg }
    }))
  }

  const filteredThreads = threads.filter(t => {
    const matchSearch = t.student.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (t.student.class_name || '').toLowerCase().includes(search.toLowerCase())
    const matchClass = !filterClass || t.student.class_name === filterClass
    const matchUnread = !filterUnread || t.unread > 0
    return matchSearch && matchClass && matchUnread
  })
  const totalUnread = threads.reduce((s, t) => s + t.unread, 0)

  return (
    <>
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
            <button onClick={() => setShowNew(true)}
              className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg transition">
              <PenSquare size={12} /> Nhắn mới
            </button>
            <button onClick={() => setShowGroup(true)}
              className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg transition">
              <Users size={12} /> Nhắn lớp
            </button>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Tìm học sinh..."
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50" />
          </div>

          {/* Filter chips */}
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <button onClick={() => setFilterUnread(v => !v)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition border
                ${filterUnread
                  ? 'bg-red-500 text-white border-red-500'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-red-300 hover:text-red-500'}`}>
              Chưa đọc
              {threads.filter(t => t.unread > 0).length > 0 && (
                <span className={`text-[10px] font-black ${filterUnread ? 'text-white/80' : 'text-red-400'}`}>
                  ({threads.filter(t => t.unread > 0).length})
                </span>
              )}
            </button>
            <button onClick={() => setFilterClass('')}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition border
                ${!filterClass
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-300 hover:text-indigo-500'}`}>
              Tất cả
            </button>
            {classes.map(c => (
              <button key={c} onClick={() => setFilterClass(filterClass === c ? '' : c)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition border whitespace-nowrap
                  ${filterClass === c
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-300 hover:text-indigo-500'}`}>
                {c}
              </button>
            ))}
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
                    {t.lastMsg ? new Date(t.lastMsg.created_at).toLocaleDateString('vi-VN') : ''}
                  </span>
                </div>
                {t.student.class_name && (
                  <span className="text-[10px] text-indigo-400 font-medium">{t.student.class_name} · </span>
                )}
                <span className={`text-xs truncate block ${t.unread > 0 ? 'text-gray-600 font-medium' : 'text-gray-400'}`}>
                  {t.lastMsg ? (t.lastMsg.sender_role === 'teacher' ? 'Bạn: ' : '') + t.lastMsg.content : 'Chưa có tin nhắn'}
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
              {selected.aiMessages?.length > 0 && (
                <button onClick={() => setShowAiLog(v => !v)}
                  className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg transition shrink-0
                    ${showAiLog ? 'bg-violet-600 text-white' : 'bg-violet-50 text-violet-600 hover:bg-violet-100'}`}>
                  <Sparkles size={12} /> Hỏi đáp AI ({selected.aiMessages.filter(m => m.sender_role === 'student').length})
                </button>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {showAiLog ? (
                <div className="space-y-3">
                  <div className="bg-violet-50 border border-violet-100 rounded-xl px-3 py-2 text-xs text-violet-700 flex items-center gap-1.5">
                    <Sparkles size={13} /> Lịch sử {selected.student.full_name} hỏi AI trợ giảng
                  </div>
                  {selected.aiMessages.map(msg => {
                    const isAi = msg.sender_role === 'ai'
                    return (
                      <div key={msg.id} className={`flex ${isAi ? 'justify-start' : 'justify-end'}`}>
                        {isAi && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white shrink-0 mr-2 mt-auto mb-1">
                            <Sparkles size={14} />
                          </div>
                        )}
                        <div className={`max-w-[75%] flex flex-col gap-1 ${isAi ? 'items-start' : 'items-end'}`}>
                          {!isAi && msg.context?.lessonTitle && (
                            <div className="bg-white border border-indigo-100 rounded-lg px-2.5 py-1.5 text-[11px] text-gray-500">
                              <span className="font-bold text-indigo-600 flex items-center gap-1"><BookOpen size={10} /> {msg.context.lessonTitle}</span>
                              {msg.context.questionText && <span className="block mt-0.5 line-clamp-2">❓ {msg.context.questionText}</span>}
                            </div>
                          )}
                          <div className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap
                            ${isAi ? 'bg-violet-50 text-gray-800 border border-violet-100 rounded-bl-md' : 'bg-indigo-500 text-white rounded-br-md'}`}>
                            {msg.content}
                          </div>
                          <span className="text-[10px] text-gray-400 px-1">
                            {new Date(msg.created_at).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
              selected.messages.map((msg, i) => {
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
                    <div className={`flex group ${isTeacher ? 'justify-end' : 'justify-start'}`}>
                      {!isTeacher && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-black shrink-0 mr-2 mt-auto mb-1">
                          {selected.student.full_name.charAt(0)}
                        </div>
                      )}
                      <div className={`max-w-[70%] flex flex-col gap-1 ${isTeacher ? 'items-end' : 'items-start'}`}>
                        {!isTeacher && msg.context && (msg.context.lessonTitle || msg.context.questionText) && (
                          <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2 text-[11px] text-gray-600 w-full">
                            {msg.context.lessonTitle && (
                              <div className="font-bold text-indigo-700 flex items-center gap-1"><BookOpen size={11} /> {msg.context.lessonTitle}</div>
                            )}
                            {msg.context.questionText && <div className="mt-0.5">❓ {msg.context.questionText}</div>}
                            {msg.context.studentAnswer && <div className="mt-0.5 text-gray-400">Con đang chọn: {msg.context.studentAnswer}</div>}
                            {msg.context.aiAnswer && (
                              <div className="mt-1 pt-1 border-t border-indigo-100 text-violet-700">
                                <span className="font-semibold">🤖 Trợ giảng đã gợi ý:</span> {msg.context.aiAnswer}
                              </div>
                            )}
                          </div>
                        )}
                        <div className="flex items-end gap-1.5">
                          {isTeacher && (
                            <button onClick={() => deleteMessage(msg.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-red-100 text-red-400 hover:text-red-600 shrink-0 mb-1">
                              <Trash2 size={13} />
                            </button>
                          )}
                          <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                            isTeacher
                              ? 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white rounded-br-md shadow-md shadow-indigo-100'
                              : 'bg-white text-gray-800 rounded-bl-md border border-gray-100 shadow-sm'
                          }`}>
                            {msg.content}
                          </div>
                          {!isTeacher && (
                            <button onClick={() => deleteMessage(msg.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-red-100 text-red-400 hover:text-red-600 shrink-0 mb-1">
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-400 px-1">{time}</span>
                      </div>
                    </div>
                  </div>
                )
              })
              )}
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

    {/* ── Modal nhắn học sinh mới ── */}
    {showNew && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={() => { setShowNew(false); setNewSearch('') }}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm max-h-[80vh] flex flex-col"
          onClick={e => e.stopPropagation()}>
          <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white px-5 py-4 rounded-t-2xl flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <PenSquare size={18} />
              <span className="font-black text-base">Nhắn tin học sinh</span>
            </div>
            <button onClick={() => { setShowNew(false); setNewSearch('') }} className="text-white/70 hover:text-white"><X size={18} /></button>
          </div>
          <div className="px-4 pt-3 pb-2 shrink-0">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={newSearch} onChange={e => setNewSearch(e.target.value)}
                autoFocus placeholder="Tìm tên học sinh..."
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-300 bg-gray-50" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-2 pb-3">
            {allStudents.length === 0 ? (
              <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-gray-300" /></div>
            ) : allStudents.filter(s =>
                s.full_name.toLowerCase().includes(newSearch.toLowerCase()) ||
                (s.class_name || '').toLowerCase().includes(newSearch.toLowerCase())
              ).map(s => (
              <button key={s.id} onClick={() => openNewThread(s)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-green-50 text-left transition">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center text-white text-sm font-black shrink-0">
                  {s.full_name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{s.full_name}</p>
                  {s.class_name && <p className="text-xs text-gray-400">{s.class_name}</p>}
                </div>
                {threads.find(t => t.student.id === s.id) && (
                  <span className="text-[10px] text-indigo-500 font-medium shrink-0">Đã nhắn</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    )}

    {/* ── Modal nhắn tin nhóm lớp ── */}
    {showGroup && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={() => setShowGroup(false)}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-5 py-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users size={18} />
              <span className="font-black text-base">Nhắn tin theo lớp</span>
            </div>
            <button onClick={() => setShowGroup(false)} className="text-white/70 hover:text-white"><X size={18} /></button>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Chọn lớp</label>
              <select value={groupClass} onChange={e => setGroupClass(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
                {classes.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Nội dung</label>
              <textarea value={groupInput} onChange={e => setGroupInput(e.target.value)}
                rows={4} placeholder="Nhập thông báo gửi đến cả lớp..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none" />
              <p className="text-[11px] text-gray-400 mt-1">Tin sẽ gửi đến tất cả học sinh trong lớp {groupClass}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={sendGroupMessage} disabled={!groupInput.trim() || groupSending}
                className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition">
                {groupSending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Gửi cho lớp {groupClass}
              </button>
              <button onClick={() => setShowGroup(false)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50">
                Hủy
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  )
}
