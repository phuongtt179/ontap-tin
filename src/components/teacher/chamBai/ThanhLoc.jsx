// Thanh lọc lớp / tìm tên + nút AI chấm tất cả, xem bài AI đã chấm + giờ tự làm mới.
import { Loader2, Search, Wifi, Bot } from 'lucide-react'

export default function ThanhLoc({ classes, lop, onLop, tim, onTim, soHs, coThucHanh, aiDangCham, soBaiAi, onAiCham, onXemAi, lanLamMoi }) {
  return (
    <div className="flex gap-3 mb-5 flex-wrap items-center">
      <select value={lop} onChange={e => onLop(e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
        <option value="">Tất cả lớp</option>
        {classes.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input value={tim} onChange={e => onTim(e.target.value)} placeholder="Tìm học sinh..."
          className="border border-gray-300 rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-44" />
      </div>
      <span className="text-sm text-gray-500">{soHs} học sinh</span>
      {coThucHanh && (
        <>
          <button onClick={onAiCham} disabled={aiDangCham.active}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition">
            {aiDangCham.active ? (
              aiDangCham.countdown > 0
                ? <><Loader2 size={12} className="animate-spin" /> Đợi {aiDangCham.countdown}s...</>
                : <><Loader2 size={12} className="animate-spin" /> {aiDangCham.done}/{aiDangCham.total}...</>
            ) : (
              <><Bot size={13} /> AI Chấm tất cả</>
            )}
          </button>
          {soBaiAi > 0 && (
            <button onClick={onXemAi}
              className="flex items-center gap-1.5 bg-amber-50 border border-amber-300 text-amber-700 hover:bg-amber-100 px-3 py-1.5 rounded-lg text-xs font-semibold transition">
              <Bot size={13} /> Xem AI đã chấm ({soBaiAi})
            </button>
          )}
        </>
      )}
      <div className="ml-auto flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-green-50 text-green-600" title="Bài nộp mới tự hiện sau tối đa 2 phút">
        <Wifi size={11} />
        Tự làm mới{lanLamMoi ? ` · ${lanLamMoi.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}` : ''}
      </div>
    </div>
  )
}
