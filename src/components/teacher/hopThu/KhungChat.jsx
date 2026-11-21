// Hộp thư giáo viên — cột phải: tin thầy–trò, log hỏi đáp AI của em, ô trả lời.
import { Send, Loader2, MessageCircle, Trash2, BookOpen, Sparkles } from 'lucide-react'

export default function KhungChat({ h }) {
  const { selected, setSelected, input, setInput, sending, showAiLog, setShowAiLog, bottomRef, inputRef, sendReply, deleteMessage } = h
  return (
    <>
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
    </>
  )
}
