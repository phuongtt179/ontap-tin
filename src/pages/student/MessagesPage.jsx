import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Send, Loader2, MessageCircle, Trash2 } from 'lucide-react'

export default function MessagesPage() {
  const { user, profile } = useAuth()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const lastCreatedAtRef = useRef(null)

  useEffect(() => {
    loadMessages()

    // Realtime (nếu Supabase có bật)
    const channel = supabase.channel('student_messages_' + user.id)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `student_id=eq.${user.id}`
      }, payload => {
        setMessages(prev => prev.some(m => m.id === payload.new.id) ? prev : [...prev, payload.new])
        lastCreatedAtRef.current = payload.new.created_at
      })
      .subscribe()

    // Polling fallback mỗi 4 giây — chỉ lấy tin mới hơn tin cuối
    const interval = setInterval(async () => {
      if (!lastCreatedAtRef.current) return
      const { data } = await supabase
        .from('messages').select('*')
        .eq('student_id', user.id)
        .gt('created_at', lastCreatedAtRef.current)
        .order('created_at', { ascending: true })
      if (data?.length) {
        setMessages(prev => {
          const ids = new Set(prev.map(m => m.id))
          const newMsgs = data.filter(m => !ids.has(m.id))
          if (!newMsgs.length) return prev
          lastCreatedAtRef.current = data[data.length - 1].created_at
          return [...prev, ...newMsgs]
        })
      }
    }, 4000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [user.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadMessages() {
    const { data } = await supabase
      .from('messages').select('*')
      .eq('student_id', user.id)
      .order('created_at', { ascending: true })
    setMessages(data || [])
    if (data?.length) lastCreatedAtRef.current = data[data.length - 1].created_at
    else lastCreatedAtRef.current = new Date().toISOString()
    setLoading(false)
    // Đánh dấu đã đọc các tin nhắn từ giáo viên
    supabase.from('messages').update({ is_read: true })
      .eq('student_id', user.id).eq('sender_role', 'teacher').eq('is_read', false)
  }

  async function sendMessage() {
    const text = input.trim()
    if (!text || sending) return
    setSending(true)
    setInput('')
    const { data, error } = await supabase.from('messages').insert({
      student_id: user.id,
      content: text,
      sender_role: 'student',
    }).select().single()
    if (error) {
      setInput(text)
    } else if (data) {
      setMessages(prev => [...prev, data])
      lastCreatedAtRef.current = data.created_at
    }
    setSending(false)
    inputRef.current?.focus()
  }

  async function deleteMessage(msgId) {
    if (!window.confirm('Xóa tin nhắn này?')) return
    await supabase.from('messages').delete().eq('id', msgId)
    setMessages(prev => prev.filter(m => m.id !== msgId))
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#003d8f] via-[#0055bb] to-[#0077dd] text-white px-5 py-4 shrink-0">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <MessageCircle size={20} />
          </div>
          <div>
            <h1 className="font-black text-base">Hỏi giáo viên</h1>
            <p className="text-blue-200 text-xs">Giáo viên sẽ trả lời sớm nhất có thể</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
        <div className="max-w-2xl mx-auto space-y-3">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={28} className="animate-spin text-indigo-400" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
                <MessageCircle size={36} className="text-indigo-400" />
              </div>
              <p className="text-gray-600 font-semibold">Chưa có tin nhắn nào</p>
              <p className="text-gray-400 text-sm mt-1">Hãy hỏi giáo viên bất kỳ điều gì bạn thắc mắc!</p>
            </div>
          ) : (
            messages.map((msg, i) => {
              const isStudent = msg.sender_role === 'student'
              const time = new Date(msg.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
              const date = new Date(msg.created_at).toLocaleDateString('vi-VN')
              // Hiện nhãn ngày khi ngày thay đổi
              const prevDate = i > 0 ? new Date(messages[i-1].created_at).toLocaleDateString('vi-VN') : null
              const showDate = date !== prevDate
              return (
                <div key={msg.id}>
                  {showDate && (
                    <div className="flex justify-center my-3">
                      <span className="text-[11px] text-gray-400 bg-white border border-gray-100 px-3 py-1 rounded-full shadow-sm">
                        {date}
                      </span>
                    </div>
                  )}
                  <div className={`flex group ${isStudent ? 'justify-end' : 'justify-start'}`}>
                    {!isStudent && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-black shrink-0 mr-2 mt-auto mb-1">
                        GV
                      </div>
                    )}
                    <div className={`max-w-[75%] ${isStudent ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                      <div className="flex items-end gap-1.5">
                        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          isStudent
                            ? 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white rounded-br-md shadow-md shadow-indigo-100'
                            : 'bg-white text-gray-800 rounded-bl-md border border-gray-100 shadow-sm'
                        }`}>
                          {msg.content}
                        </div>
                        {isStudent && (
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
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-gray-200 bg-white px-4 py-3">
        <div className="max-w-2xl mx-auto flex gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Nhập câu hỏi của bạn..."
            className="flex-1 border border-gray-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50"
          />
          <button onClick={sendMessage} disabled={!input.trim() || sending}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:scale-100 shadow-md shadow-indigo-200 shrink-0">
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </div>
  )
}
