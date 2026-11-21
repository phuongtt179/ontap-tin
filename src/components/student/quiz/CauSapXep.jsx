// Câu sắp xếp thứ tự (kéo thả hoặc bấm ↑ ↓).
import { useState, useEffect } from 'react'
import { ArrowUp, ArrowDown } from 'lucide-react'
import { xaoTron } from '../../../utils/xaoTron'

export default function OrderingQuestion({ q, value, onChange, disabled }) {
  const [items, setItems] = useState(() => {
    if (value) {
      const keyOrder = value.split(',')
      return keyOrder.map(k => q.options?.find(o => o.key === k)).filter(Boolean)
    }
    return xaoTron(q.options || [])
  })
  const [dragIdx, setDragIdx] = useState(null)
  const [overIdx, setOverIdx] = useState(null)

  function move(index, dir) {
    if (disabled) return
    const newItems = [...items]
    const target = index + dir
    if (target < 0 || target >= newItems.length) return
    ;[newItems[index], newItems[target]] = [newItems[target], newItems[index]]
    setItems(newItems)
    onChange(newItems.map(o => o.key).join(','))
  }

  function onDragStart(i) { setDragIdx(i) }
  function onDragOver(e, i) { e.preventDefault(); setOverIdx(i) }
  function onDrop(i) {
    if (dragIdx === null || dragIdx === i) { setDragIdx(null); setOverIdx(null); return }
    const next = [...items]
    const [moved] = next.splice(dragIdx, 1)
    next.splice(i, 0, moved)
    setItems(next)
    onChange(next.map(o => o.key).join(','))
    setDragIdx(null); setOverIdx(null)
  }

  useEffect(() => {
    if (!value) onChange(items.map(o => o.key).join(','))
  }, [])

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4">
      <p className="text-xs text-gray-400 mb-3">Kéo thả hoặc bấm ↑ ↓ để sắp xếp đúng thứ tự</p>
      <div className="space-y-2">
        {items.map((opt, i) => (
          <div
            key={opt.key}
            draggable={!disabled}
            onDragStart={() => onDragStart(i)}
            onDragOver={e => onDragOver(e, i)}
            onDrop={() => onDrop(i)}
            onDragEnd={() => { setDragIdx(null); setOverIdx(null) }}
            className={`flex items-center gap-2 rounded-lg border transition select-none
              ${disabled ? 'border-gray-200'
                : dragIdx === i ? 'border-indigo-300 bg-indigo-50 opacity-40'
                : overIdx === i ? 'border-indigo-400 border-dashed bg-indigo-50/50'
                : 'border-gray-200 bg-gray-50 cursor-grab hover:border-indigo-300 hover:bg-white'
              }`}
          >
            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0 ml-3 my-2">
              {i + 1}
            </span>
            <span className="flex-1 py-2 pr-2 text-sm text-gray-800">{opt.text}</span>
            {!disabled && (
              <div className="flex flex-col gap-0.5 mr-2 shrink-0">
                <button onClick={() => move(i, -1)} disabled={i === 0}
                  className="text-gray-400 hover:text-indigo-600 disabled:opacity-20 transition">
                  <ArrowUp size={14} />
                </button>
                <button onClick={() => move(i, 1)} disabled={i === items.length - 1}
                  className="text-gray-400 hover:text-indigo-600 disabled:opacity-20 transition">
                  <ArrowDown size={14} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
