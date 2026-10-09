import { useState, useMemo, useRef, useLayoutEffect, useEffect, useCallback } from 'react'

// Câu nối đôi kiểu "nối bằng đường thẳng": bấm 1 ô bên trái rồi bấm 1 ô bên phải để nối (hoặc ngược lại),
// bấm lại ô đã nối để gỡ. Dùng được cả chuột lẫn màn hình cảm ứng (không dùng kéo-thả HTML5).
// Đáp án giữ nguyên định dạng cũ "A-1,B-2,..." nên không ảnh hưởng chấm điểm và câu hỏi đã có.

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ec4899', '#0ea5e9', '#8b5cf6', '#f97316', '#14b8a6']

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
  // tránh trường hợp xáo xong vẫn y nguyên thứ tự đúng (học sinh khỏi cần nghĩ)
  if (a.length > 1 && a.every((x, i) => x === arr[i])) a.push(a.shift())
  return a
}

function parsePairs(value) {
  const m = new Map()
  String(value || '').split(',').forEach(p => {
    const [l, r] = p.split('-').map(s => s?.trim())
    if (l && r) m.set(l, r)
  })
  return m
}

export default function MatchingLines({ q, value, onChange, disabled = false, showResult = false }) {
  const left = useMemo(() => q.options || [], [q.options])
  const rightOrig = useMemo(() => q.match_options || [], [q.match_options])
  // Thứ tự cột phải xáo 1 lần khi hiện câu hỏi (component được gắn key theo câu nên mỗi câu xáo riêng)
  const [right] = useState(() => shuffle(rightOrig))
  // Cặp đúng theo vị trí: options[i] ↔ match_options[i]
  const correct = useMemo(() => new Map(left.map((o, i) => [o.key, rightOrig[i]?.key])), [left, rightOrig])

  const [pairs, setPairs] = useState(() => {
    const m = parsePairs(value)
    const lk = new Set(left.map(o => o.key)), rk = new Set(rightOrig.map(o => o.key))
    for (const [l, r] of [...m]) if (!lk.has(l) || !rk.has(r)) m.delete(l)
    return m
  })
  const [sel, setSel] = useState(null)   // { side: 'L' | 'R', key }
  const [lines, setLines] = useState([])
  const box = useRef(null)
  const leftEls = useRef({})
  const rightEls = useRef({})

  // Vẽ lại các đường nối theo vị trí thật của các ô
  const measure = useCallback(() => {
    const c = box.current
    if (!c) return
    const b = c.getBoundingClientRect()
    const next = []
    for (const [l, r] of pairs) {
      const a = leftEls.current[l]?.getBoundingClientRect()
      const z = rightEls.current[r]?.getBoundingClientRect()
      if (!a || !z) continue
      next.push({ l, r, x1: a.right - b.left, y1: a.top + a.height / 2 - b.top, x2: z.left - b.left, y2: z.top + z.height / 2 - b.top })
    }
    setLines(next)
  }, [pairs])

  // Đo NGAY sau khi giao diện cập nhật (trước khi trình duyệt vẽ) để đường nối luôn khớp cặp vừa nối.
  // Đây đúng là trường hợp dùng của useLayoutEffect (đo kích thước/vị trí DOM) — từng thử dời sang
  // requestAnimationFrame thì đường nối có lúc vẽ theo trạng thái cũ.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useLayoutEffect(() => { measure() }, [measure])
  useEffect(() => {
    const c = box.current
    if (!c || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => measure())
    ro.observe(c)
    return () => ro.disconnect()
  }, [measure])

  function commit(next) {
    setPairs(next)
    if (next.size < left.length) { onChange(null); return }   // phải nối đủ mới tính là đã trả lời
    const allRight = left.every(o => next.get(o.key) === correct.get(o.key))
    // Nối đúng hết → trả đúng chuỗi đáp án đã lưu (phòng khi đáp án lưu theo định dạng khác)
    onChange(allRight ? q.correct_answer : left.map(o => `${o.key}-${next.get(o.key)}`).join(','))
  }

  function connect(l, r) {
    const next = new Map(pairs)
    for (const [k, v] of [...next]) if (v === r) next.delete(k)   // mỗi ô phải chỉ nối 1 lần
    next.set(l, r)
    setSel(null)
    commit(next)
  }

  function clickLeft(key) {
    if (disabled) return
    if (sel?.side === 'R') return connect(key, sel.key)
    if (pairs.has(key)) {           // gỡ nối rồi chọn lại ô này
      const next = new Map(pairs); next.delete(key); commit(next)
      return setSel({ side: 'L', key })
    }
    setSel(sel?.side === 'L' && sel.key === key ? null : { side: 'L', key })
  }

  function clickRight(key) {
    if (disabled) return
    if (sel?.side === 'L') return connect(sel.key, key)
    const owner = [...pairs].find(([, v]) => v === key)?.[0]
    if (owner) {
      const next = new Map(pairs); next.delete(owner); commit(next)
      return setSel({ side: 'R', key })
    }
    setSel(sel?.side === 'R' && sel.key === key ? null : { side: 'R', key })
  }

  const colorOf = l => COLORS[Math.max(0, left.findIndex(o => o.key === l)) % COLORS.length]
  const resultOf = (l, r) => (showResult ? (correct.get(l) === r ? 'ok' : 'bad') : null)
  const owners = new Map([...pairs].map(([l, r]) => [r, l]))

  const cellBase = 'w-full text-left px-3 py-2 rounded-lg border-2 text-sm min-h-[44px] flex items-center gap-2 transition select-none'
  function cellClass(paired, selected, res) {
    if (res === 'ok') return 'border-green-400 bg-green-50 text-green-800'
    if (res === 'bad') return 'border-red-300 bg-red-50 text-red-800'
    if (selected) return 'border-indigo-500 bg-indigo-50 text-indigo-800 ring-2 ring-indigo-200'
    if (paired) return 'border-gray-300 bg-white text-gray-800'
    return `border-gray-200 bg-white text-gray-700 ${disabled ? '' : 'hover:border-indigo-300 cursor-pointer'}`
  }

  return (
    <div className="bg-gray-50 rounded-xl border border-gray-200 p-3 sm:p-4">
      {!disabled && (
        <p className="text-xs text-gray-400 mb-3">Bấm 1 ô bên trái rồi bấm ô bên phải tương ứng để nối. Bấm lại ô đã nối để gỡ ra.</p>
      )}
      <div ref={box} className="relative flex gap-8 sm:gap-14 items-start">
        <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" aria-hidden="true">
          {lines.map(({ l, r, x1, y1, x2, y2 }) => {
            const res = resultOf(l, r)
            const color = res === 'ok' ? '#16a34a' : res === 'bad' ? '#dc2626' : colorOf(l)
            return (
              <g key={l}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="3" strokeLinecap="round" strokeDasharray={res === 'bad' ? '6 4' : undefined} />
                <circle cx={x1} cy={y1} r="4" fill={color} />
                <circle cx={x2} cy={y2} r="4" fill={color} />
              </g>
            )
          })}
        </svg>
        <div className="flex-1 space-y-2 min-w-0">
          {left.map(o => {
            const r = pairs.get(o.key)
            return (
              <button key={o.key} type="button" ref={el => { leftEls.current[o.key] = el }} onClick={() => clickLeft(o.key)} disabled={disabled}
                className={`${cellBase} ${cellClass(!!r, sel?.side === 'L' && sel.key === o.key, r ? resultOf(o.key, r) : null)}`}>
                {r && !showResult && <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: colorOf(o.key) }} />}
                {o.image_url && <img src={o.image_url} alt="" className="h-12 w-auto rounded" onLoad={measure} />}
                <span className="min-w-0 break-words"><b className="mr-1">{o.key}.</b>{o.text}</span>
              </button>
            )
          })}
        </div>
        <div className="flex-1 space-y-2 min-w-0">
          {right.map(o => {
            const l = owners.get(o.key)
            return (
              <button key={o.key} type="button" ref={el => { rightEls.current[o.key] = el }} onClick={() => clickRight(o.key)} disabled={disabled}
                className={`${cellBase} ${cellClass(!!l, sel?.side === 'R' && sel.key === o.key, l ? resultOf(l, o.key) : null)}`}>
                {l && !showResult && <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: colorOf(l) }} />}
                {o.image_url && <img src={o.image_url} alt="" className="h-12 w-auto rounded" onLoad={measure} />}
                <span className="min-w-0 break-words">{o.text}</span>
              </button>
            )
          })}
        </div>
      </div>
      {/* Không hiện đáp án đúng khi sai — quy tắc của app: sai thì chỉ hiện gợi ý rồi làm lại */}
    </div>
  )
}
