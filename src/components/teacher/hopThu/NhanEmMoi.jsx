// Hộp thư giáo viên — cửa sổ chọn 1 em để bắt đầu nhắn.
import { Loader2, Search, X, PenSquare } from 'lucide-react'

export default function NhanEmMoi({ h }) {
  const { threads, showNew, setShowNew, allStudents, newSearch, setNewSearch, openNewThread } = h
  return (
    <>
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

    </>
  )
}
