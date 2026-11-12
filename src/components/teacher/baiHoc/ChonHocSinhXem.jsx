// Danh sách tích chọn học sinh được xem 1 bài (giới hạn người xem) — dùng ở form bài học và hộp "Ai được xem".
import { useState } from 'react'

export default function ChonHocSinhXem({ roster, chon, onDoi, cao = 'max-h-48' }) {
  const [tim, setTim] = useState('')
  const tu = tim.trim().toLowerCase()
  return (
    <>
      <input
        value={tim}
        onChange={e => setTim(e.target.value)}
        placeholder="Tìm tên học sinh..."
        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <div className={`${cao} overflow-y-auto border border-gray-100 rounded-lg divide-y`}>
        {roster.length === 0 && (
          <p className="text-xs text-gray-400 px-3 py-2">Chưa có học sinh nào ghi danh khoá này</p>
        )}
        {roster
          .filter(s => s.full_name.toLowerCase().includes(tu))
          .map(s => (
            <label key={s.id} className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-50 cursor-pointer">
              <input type="checkbox" checked={chon.includes(s.id)} onChange={() => onDoi(s.id)}
                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
              {s.full_name}
            </label>
          ))}
      </div>
      <p className="text-[11px] text-gray-400 mt-1">Đã chọn {chon.length} học sinh</p>
    </>
  )
}
