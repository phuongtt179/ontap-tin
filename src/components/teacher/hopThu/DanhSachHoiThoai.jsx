// Hộp thư giáo viên — cột trái: tìm, lọc lớp / chưa đọc, danh sách cuộc trò chuyện.
import { Loader2, MessageCircle, Search, Users, PenSquare } from 'lucide-react'

export default function DanhSachHoiThoai({ h }) {
  const { threads, selected, loading, search, setSearch, filterClass, setFilterClass, filterUnread, setFilterUnread, setShowGroup, classes, setShowNew, openThread, filteredThreads, totalUnread } = h
  return (
    <>
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

    </>
  )
}
