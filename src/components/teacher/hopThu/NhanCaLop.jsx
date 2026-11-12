// Hộp thư giáo viên — cửa sổ nhắn cả lớp (mỗi em nhận 1 tin).
import { Send, Loader2, Users, X } from 'lucide-react'

export default function NhanCaLop({ h }) {
  const { showGroup, setShowGroup, classes, groupClass, setGroupClass, groupInput, setGroupInput, groupSending, sendGroupMessage } = h
  return (
    <>
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
