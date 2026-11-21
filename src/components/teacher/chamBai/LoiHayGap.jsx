// Lỗi hay gặp của lớp — tổng hợp từ bảng điểm AI, gợi ý phần nên dạy lại.
import { Bot } from 'lucide-react'
import { summarizeClassErrors } from '../../../utils/weakness'

export default function LoiHayGap({ baiNop }) {
  const errs = summarizeClassErrors(baiNop).slice(0, 5)
  if (!errs.length) return null
  return (
    <details className="mb-5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3" open>
      <summary className="cursor-pointer text-sm font-bold text-amber-800 flex items-center gap-1.5">
        <Bot size={14} /> Lỗi hay gặp của lớp (từ bảng điểm AI)
      </summary>
      <div className="mt-3 space-y-2.5">
        {errs.map(e => (
          <div key={e.criterion}>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold text-gray-800 flex-1 min-w-0 truncate">{e.criterion}</span>
              <span className={`text-xs font-bold ${e.lostPct >= 40 ? 'text-red-600' : 'text-amber-700'}`}>
                {e.lostCount}/{e.graded} em mất điểm ({e.lostPct}%)
              </span>
            </div>
            <div className="h-1.5 bg-amber-100 rounded-full overflow-hidden mt-1">
              <div className={`h-full rounded-full ${e.lostPct >= 40 ? 'bg-red-400' : 'bg-amber-400'}`} style={{ width: `${e.lostPct}%` }} />
            </div>
            {e.notes.map(n => <p key={n} className="text-xs text-gray-500 mt-1">• {n}</p>)}
          </div>
        ))}
        {errs.some(e => e.lostPct >= 40) && (
          <p className="text-xs text-red-600 font-semibold pt-1">Tiêu chí đỏ: từ 40% học sinh mất điểm — nên cân nhắc giảng lại phần này.</p>
        )}
      </div>
    </details>
  )
}
