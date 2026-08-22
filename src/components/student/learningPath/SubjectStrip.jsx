import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import { getTopicEmoji } from './lessonIcons'

/**
 * Dải chip chủ đề cuộn ngang — thay UnitCard/TopicCards cũ (Tailwind gradient
 * cứng, không đồng bộ màu). Dùng chung bộ token màu với con đường bài học
 * (--grape/--card/--stone/--ink...) + font-display cho đồng bộ giao diện.
 *
 * `unlockedTopics`: Set các chủ đề đã mở cho lớp học sinh — null = không giới
 * hạn (mở hết). Chủ đề chưa mở thì bấm không chuyển được, chỉ báo bằng toast —
 * "Tất cả" luôn bấm được (vẫn khoá từng bài bên trong theo chủ đề của nó).
 */
export default function SubjectStrip({ topicKeys, lessons, progressMap, grouped, selected, onSelect, unlockedTopics }) {
  const ref = useRef(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(false)

  function checkScroll() {
    const el = ref.current; if (!el) return
    setCanLeft(el.scrollLeft > 4)
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }
  useEffect(() => {
    checkScroll()
    const el = ref.current; if (!el) return
    el.addEventListener('scroll', checkScroll, { passive: true })
    return () => el.removeEventListener('scroll', checkScroll)
  }, [topicKeys])

  const items = [
    { key: '__all__', label: 'Tất cả', emoji: '🏠', list: lessons },
    ...topicKeys.map(k => ({
      key: k,
      label: k === '__no_topic__' ? 'Chưa phân loại' : k,
      emoji: getTopicEmoji(k),
      list: grouped[k] || [],
    })),
  ]

  return (
    <div className="relative flex items-center">
      {canLeft && (
        <button
          onClick={() => ref.current?.scrollBy({ left: -220, behavior: 'smooth' })}
          className="absolute left-1 z-10 w-7 h-7 rounded-full shadow-md flex items-center justify-center"
          style={{ background: 'var(--card)', color: 'var(--ink-soft)' }}
        >
          <ChevronLeft size={14} />
        </button>
      )}

      <div ref={ref} onScroll={checkScroll} className="flex-1 overflow-x-auto px-4 py-3" style={{ scrollbarWidth: 'none' }}>
        <div className="flex gap-2 justify-center min-w-full w-max">
          {items.map(({ key, label, emoji, list }) => {
            const active = selected === key
            const done = list.filter(l => progressMap[l.id]?.completed).length
            const isLocked = key !== '__all__' && unlockedTopics != null && !unlockedTopics.has(key)

            return (
              <button
                key={key}
                onClick={() => {
                  if (isLocked) { toast('Chủ đề này chưa được mở, hỏi giáo viên nhé', { icon: '🔒' }); return }
                  onSelect(key)
                }}
                aria-disabled={isLocked ? 'true' : undefined}
                className={`shrink-0 flex items-center gap-2 rounded-full pl-2 pr-3.5 py-1.5 font-display font-bold text-sm transition-all
                  ${isLocked ? 'cursor-not-allowed opacity-60' : 'hover:scale-[1.03] active:scale-95'}`}
                style={active
                  ? { background: 'linear-gradient(135deg, var(--grape), #5b3fe0)', color: '#fff', boxShadow: '0 4px 14px rgba(123,97,255,0.35)' }
                  : { background: 'var(--card)', color: 'var(--ink)', border: '2px solid var(--stone)' }}
              >
                <span
                  className="w-7 h-7 rounded-full flex items-center justify-center text-base shrink-0"
                  style={{ background: active ? 'rgba(255,255,255,0.22)' : 'var(--sky)' }}
                >
                  {isLocked ? <Lock size={14} style={{ color: 'var(--ink-soft)' }} /> : emoji}
                </span>
                <span className="whitespace-nowrap">{label}</span>
                {!isLocked && list.length > 0 && (
                  <span
                    className="text-[10px] font-black px-1.5 py-0.5 rounded-full"
                    style={{ background: active ? 'rgba(255,255,255,0.25)' : 'var(--sky)', color: active ? '#fff' : 'var(--ink-soft)' }}
                  >
                    {done}/{list.length}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {canRight && (
        <button
          onClick={() => ref.current?.scrollBy({ left: 220, behavior: 'smooth' })}
          className="absolute right-1 z-10 w-7 h-7 rounded-full shadow-md flex items-center justify-center"
          style={{ background: 'var(--card)', color: 'var(--ink-soft)' }}
        >
          <ChevronRight size={14} />
        </button>
      )}
    </div>
  )
}
