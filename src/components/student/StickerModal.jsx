import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'

// ── Confetti pieces ──────────────────────────────────────────────
const COLORS = ['#ff6b6b','#ffd93d','#6bcb77','#4d96ff','#ff922b','#cc5de8','#f06595','#20c997']
const SHAPES = ['circle', 'square', 'rect']
const PIECES = Array.from({ length: 60 }, (_, i) => ({
  id: i,
  color: COLORS[i % COLORS.length],
  shape: SHAPES[i % SHAPES.length],
  left: 5 + (i * 1.55) % 90,          // spread across width
  size: 7 + (i * 3) % 10,
  delay: (i * 0.07) % 2.5,
  duration: 2.5 + (i * 0.11) % 2,
  swayDuration: 1.2 + (i * 0.09) % 1.5,
}))

function Confetti({ active }) {
  if (!active) return null
  return (
    <div className="fixed inset-0 pointer-events-none z-[60] overflow-hidden">
      {PIECES.map(p => (
        <div key={p.id} style={{
          position: 'absolute',
          top: -16,
          left: `${p.left}%`,
          width: p.shape === 'rect' ? p.size * 2 : p.size,
          height: p.size,
          backgroundColor: p.color,
          borderRadius: p.shape === 'circle' ? '50%' : p.shape === 'square' ? '2px' : '2px',
          animation: `confetti-fall ${p.duration}s ${p.delay}s ease-in forwards,
                      confetti-sway ${p.swayDuration}s ${p.delay}s ease-in-out infinite`,
          opacity: 0,
        }} />
      ))}
    </div>
  )
}

// ── Sticker emojis (rotating set) ───────────────────────────────
const STICKER_SETS = ['⭐', '🌟', '🏅', '🎖️', '💎', '🔥', '🦋', '🌈']

export default function StickerModal({
  stickerCount = 1,
  stickerTotal = 1,
  threshold = 50,
  reason = 'Hoàn thành bài học',
  count = 1,
  onClose,
}) {
  const [visible, setVisible] = useState(false)
  const [confetti, setConfetti] = useState(false)
  const stickerEmoji = STICKER_SETS[(stickerTotal - 1) % STICKER_SETS.length]
  const pct = Math.min((stickerCount / threshold) * 100, 100)
  const remaining = threshold - stickerCount
  const rewardReached = stickerCount >= threshold

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 30)
    const t2 = setTimeout(() => setConfetti(true), 200)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  function handleClose() {
    setVisible(false)
    setTimeout(onClose, 300)
  }

  return (
    <>
      <Confetti active={confetti} />

      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300
          ${visible ? 'bg-black/50 backdrop-blur-sm' : 'bg-transparent'}`}
        onClick={handleClose}
      >
        {/* Card */}
        <div
          className={`relative bg-white rounded-3xl shadow-2xl w-full max-w-xs text-center overflow-hidden
            transition-all duration-400
            ${visible ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}
          style={{ animation: visible ? 'sticker-pop 0.5s ease forwards' : 'none' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Rainbow top strip */}
          <div className="h-2 bg-gradient-to-r from-pink-400 via-yellow-400 via-green-400 via-blue-400 to-violet-400" />

          {/* Close */}
          <button onClick={handleClose}
            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 transition">
            <X size={14} />
          </button>

          <div className="px-6 pt-5 pb-6">
            {/* Sticker big */}
            <div className="text-8xl mb-1 select-none"
              style={{ animation: 'sticker-float 2.5s ease-in-out infinite', display: 'inline-block' }}>
              {stickerEmoji}
            </div>

            {/* +1 badge */}
            <div className="inline-flex items-center gap-1 bg-yellow-400 text-yellow-900 font-black text-sm px-3 py-1 rounded-full mb-3 shadow-md">
              +{count} Sticker{count > 1 ? 's!' : '!'}
            </div>

            <h2 className="text-xl font-black text-gray-800 mb-1">Xuất sắc! 🎉</h2>
            <p className="text-sm text-gray-400 mb-5">{reason}</p>

            {/* Progress toward reward */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 mb-5 text-left">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Tiến độ nhận quà</span>
                <span className="text-sm font-black text-indigo-600">{stickerCount}/{threshold} ⭐</span>
              </div>

              {/* Bar */}
              <div className="h-3 bg-white rounded-full overflow-hidden border border-indigo-100 shadow-inner mb-2">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 transition-all duration-1000 ease-out relative"
                  style={{ width: `${pct}%` }}>
                  {pct > 15 && (
                    <div className="absolute inset-0 bg-white/30 rounded-full"
                      style={{ animation: 'shimmer-bar 1s ease' }} />
                  )}
                </div>
              </div>

              {/* Sticker dots */}
              <div className="flex gap-1 flex-wrap">
                {Array.from({ length: threshold }).map((_, i) => (
                  <span key={i} className={`text-base leading-none transition-all duration-300 ${i < stickerCount ? '' : 'opacity-20 grayscale'}`}
                    style={{ animationDelay: `${i * 0.05}s` }}>
                    {stickerEmoji}
                  </span>
                ))}
              </div>

              <p className={`text-xs mt-2 font-semibold ${rewardReached ? 'text-emerald-600' : 'text-gray-400'}`}>
                {rewardReached
                  ? '🎁 Đủ sticker! Hỏi giáo viên để nhận quà nhé!'
                  : `Còn ${remaining} sticker nữa → nhận quà 🎁`}
              </p>
            </div>

            {/* All-time count */}
            <p className="text-xs text-gray-300 mb-4">Tổng sticker đã nhận: <span className="font-bold text-gray-400">{stickerTotal} ⭐</span></p>

            <button onClick={handleClose}
              className="w-full py-3 rounded-2xl font-black text-white text-base shadow-lg transition-all active:scale-95
                bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 shadow-orange-200">
              Tuyệt vời! 🚀
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
