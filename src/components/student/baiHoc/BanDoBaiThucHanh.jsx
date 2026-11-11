// Bản đồ các bài thực hành (vòng tròn Bài 1, Bài 2…): trạng thái từng bài, bấm để mở chi tiết.
import { feedbackVisible } from '../../../lib/aiMode'
import { mucCua } from '../../../utils/muc'
import { MAU_BAI } from './mauBai'

export default function BanDoBaiThucHanh({ practiceTasks, taskSubmissions, activeTaskIdx, leftPanelHidden, onChon }) {
  return (
    <div className={activeTaskIdx !== null ? 'md:hidden' : ''}>
    {(() => {
      // Khung này thường chỉ chiếm nửa màn hình nên bớt số bài/hàng lại; khi ẩn cột
      // trái (khung bung full-width) thì cho nhiều bài/hàng hơn để đỡ phí chỗ.
      const TASKS_PER_ROW = window.innerWidth < 768 ? 3
        : leftPanelHidden ? 6
        : window.innerWidth < 1400 ? 3 : 4
      const nodeIcons = ['⚡','🎯','🔥','⭐','🚀']
      const rows = []
      for (let r = 0; r < practiceTasks.length; r += TASKS_PER_ROW)
        rows.push(practiceTasks.slice(r, r + TASKS_PER_ROW))
      return (
        <div className="py-4 px-2 space-y-6">
          {rows.map((row, rowIdx) => (
            <div key={rowIdx} className="flex items-end justify-center gap-0">
              {row.map((task, colIdx) => {
                const i = rowIdx * TASKS_PER_ROW + colIdx
                const sub = taskSubmissions[i]
                const p = MAU_BAI[i % MAU_BAI.length]
                const canSee = feedbackVisible(sub)
                const hasScore = canSee && sub?.score != null
                const hasComment = canSee && !!sub?.teacher_comment
                return (
                  <div key={i} className="flex items-center">
                    <div className="flex flex-col items-center gap-2" style={{ minWidth: window.innerWidth < 768 ? 70 : 88 }}>
                      {/* Badge */}
                      <div className={`text-[10px] font-black px-3 py-1 rounded-full flex items-center gap-1 shadow-sm whitespace-nowrap
                        ${sub
                          ? hasScore ? 'bg-indigo-600 text-white' : 'bg-green-500 text-white'
                          : 'bg-orange-500 text-white'}`}
                        style={!sub ? { animation: 'indicator-bounce 1.4s ease-in-out infinite' } : {}}>
                        {sub ? (hasScore && mucCua(sub) ? `⭐ Mức ${mucCua(sub)}` : '✅ Đã nộp') : task?.optional ? '📖 Đọc thêm' : '▶ Làm bài!'}
                      </div>
                      {/* Circle */}
                      <button onClick={() => onChon(i)}
                        className="relative w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl shadow-lg transition-all hover:scale-110 active:scale-95 overflow-hidden"
                        style={{
                          background: sub ? 'linear-gradient(135deg, #16a34a, #059669)' : `linear-gradient(135deg, ${p.from}, ${p.to})`,
                          animation: !sub ? 'node-breathe 2s ease-in-out infinite' : undefined,
                        }}>
                        {!sub && (
                          <div className="absolute inset-0 pointer-events-none"
                            style={{ background: 'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.42) 50%, transparent 65%)', animation: 'node-shimmer 2.4s ease-in-out infinite' }} />
                        )}
                        {sub ? '✓' : nodeIcons[i % nodeIcons.length]}
                      </button>
                      {/* Label */}
                      <span className="text-xs font-bold text-gray-600 text-center leading-tight">Bài {i + 1}</span>
                      {hasComment && <span className="text-[9px] text-indigo-500 font-bold">💬 Có nhận xét</span>}
                    </div>
                    {/* Connector — chỉ trong cùng dòng */}
                    {colIdx < row.length - 1 && (
                      <div className="h-1 rounded-full shrink-0 mb-8" style={{
                        width: 28,
                        background: sub ? 'linear-gradient(90deg, #4ade80, #86efac)' : '#e5e7eb'
                      }} />
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )
    })()}
    </div>
  )
}
