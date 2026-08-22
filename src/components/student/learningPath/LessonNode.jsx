import { Lock, Check } from 'lucide-react'
import { getLessonEmoji } from './lessonIcons'
import { STATE_COLOR, stateLabel } from './pathTheme'

const SIZE = 92 // px — trong khoảng 88-104 theo yêu cầu vùng bấm trẻ tiểu học

function Stars({ count }) {
  return (
    <div className="flex gap-0.5" aria-hidden="true">
      {[0, 1, 2].map(i => (
        <span key={i} className="text-xs leading-none" style={{ color: i < count ? 'var(--gold)' : '#E2E6F0' }}>★</span>
      ))}
    </div>
  )
}

/**
 * 1 node tròn trên con đường bài học. `point` = {x, y} do LessonPath tính sẵn
 * (từ pathGeometry.computePoints), node chỉ lo hiển thị + tương tác.
 *
 * Vòng tròn được định vị bằng CHÍNH khối bọc ngoài (đúng SIZE x SIZE, tâm ở
 * point.x/y) — nhãn "Học tiếp" phía trên và tên bài phía dưới là các phần tử
 * `absolute` NEO vào khối đó, không ảnh hưởng tới tâm. Trước đây dùng chung 1
 * `flex-col` + 1 transform cho cả khối (badge + tròn + sao + tên) nên badge/tên
 * càng dài thì tâm càng lệch khỏi đường thẳng nối các node.
 */
export default function LessonNode({ lesson, number, state, stars = 0, point, isNewest = false, onNavigate }) {
  const c = STATE_COLOR[state]
  const isLocked = state === 'locked'
  const isCurrent = state === 'current'
  const isDone = state === 'done'
  const emoji = isLocked ? null : getLessonEmoji(lesson)
  const labelWidth = SIZE + 44

  return (
    <div
      className="absolute"
      style={{ left: point.x, top: point.y, transform: 'translate(-50%, -50%)', width: SIZE, height: SIZE }}
    >
      {/* Bài mới nhất lớp vừa được mở — vòng sáng lan toả, tách biệt hoàn
          toàn với badge "Học tiếp" (current) vì đây là 2 khái niệm khác nhau:
          current = bài kế tiếp cần hoàn thành, isNewest = bài mới mở gần nhất. */}
      {isNewest && (
        <>
          <span className="absolute inset-0 rounded-full pointer-events-none" style={{ border: '3px solid var(--gold)', animation: 'node-glow-ring 1.8s ease-out infinite' }} />
          <span className="absolute inset-0 rounded-full pointer-events-none" style={{ border: '3px solid var(--gold)', animation: 'node-glow-ring 1.8s ease-out 0.6s infinite' }} />
        </>
      )}

      {isCurrent && (
        <span
          className="absolute left-1/2 -top-2 -translate-x-1/2 -translate-y-full whitespace-nowrap bg-gradient-to-r from-orange-400 to-pink-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-lg"
          style={{ animation: 'indicator-bounce 1.2s ease-in-out infinite' }}>
          🚩 Học tiếp
        </span>
      )}

      <button
        type="button"
        aria-disabled={isLocked ? 'true' : undefined}
        aria-label={`${lesson.title} — ${stateLabel(state)}`}
        onClick={isLocked ? undefined : onNavigate}
        className={`relative flex items-center justify-center rounded-full text-3xl font-display transition-transform
          focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--grape)]
          ${isLocked ? 'cursor-not-allowed grayscale opacity-55' : 'hover:scale-110 active:scale-95 cursor-pointer'}`}
        style={{
          width: SIZE, height: SIZE,
          background: `linear-gradient(135deg, ${c.from}, ${c.to})`,
          boxShadow: isLocked ? 'none' : `0 6px 18px ${c.from}55`,
          border: isCurrent ? '3px solid white' : 'none',
          animation: isCurrent ? 'node-breathe 1.8s ease-in-out infinite' : undefined,
        }}
      >
        <span className="select-none drop-shadow-sm">
          {isLocked ? <Lock size={30} className="text-white/90" /> : isDone ? <Check size={36} className="text-white" strokeWidth={3.5} /> : emoji}
        </span>
      </button>

      {isDone && (
        <div className="absolute left-1/2 -translate-x-1/2" style={{ top: SIZE + 2 }}>
          <Stars count={stars} />
        </div>
      )}

      <div
        className="absolute left-1/2 -translate-x-1/2 text-center"
        style={{ top: SIZE + (isDone ? 20 : 6), width: labelWidth }}
      >
        {number != null && (
          <p className={`text-xs font-bold uppercase tracking-wide leading-tight ${isLocked ? 'text-[var(--ink-soft)] opacity-60' : 'text-[var(--ink-soft)]'}`}>
            Bài số {number}
          </p>
        )}
        <p className={`text-base font-bold leading-tight line-clamp-2 ${isLocked ? 'text-[var(--ink-soft)] opacity-70' : 'text-[var(--ink)]'}`}>
          {lesson.title}
        </p>
      </div>
    </div>
  )
}
