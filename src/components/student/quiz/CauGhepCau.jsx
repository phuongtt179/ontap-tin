// Câu sắp xếp từ / cụm từ thành câu hoàn chỉnh.
import { useState, useMemo } from 'react'
import { phraseBank } from '../../../utils/wordOrder'
import { xaoTron } from '../../../utils/xaoTron'
import { chuanHoaLuaChon } from '../../../domain/dinhDangCauHoi'

// Sắp xếp từ thành câu hoàn chỉnh
export default function WordOrderQuestion({ q, value, onChange, disabled }) {
  // Thẻ theo CỤM TỪ (không tách lẻ từng tiếng) — xem utils/wordOrder.js
  const resolvedOptions = useMemo(
    () => phraseBank({ ...q, options: chuanHoaLuaChon(q.options) }).map((text, i) => ({ key: String.fromCharCode(65 + i), text })),
    [q.id])
  const wordBank = useMemo(() => xaoTron(resolvedOptions), [q.id])
  const [ordered, setOrdered] = useState(() => {
    if (value) return value.split(',').map(w => w.trim()).filter(Boolean)
    return []
  })
  const [dragSrc, setDragSrc] = useState(null)
  const usedWords = useMemo(() => new Set(ordered), [ordered])

  function commit(newOrdered) {
    setOrdered(newOrdered)
    onChange(newOrdered.length > 0 ? newOrdered.join(',') : null)
  }

  function handleBankClick(word) {
    if (disabled || usedWords.has(word)) return
    commit([...ordered, word])
  }

  function handleOrderedClick(idx) {
    if (disabled) return
    commit(ordered.filter((_, i) => i !== idx))
  }

  function onDragStartBank(e, word) {
    setDragSrc({ type: 'bank', word })
    e.dataTransfer.effectAllowed = 'move'
  }

  function onDragStartOrdered(e, idx) {
    setDragSrc({ type: 'ordered', word: ordered[idx], index: idx })
    e.dataTransfer.effectAllowed = 'move'
  }

  function onDropAt(e, targetIdx) {
    e.preventDefault()
    e.stopPropagation()
    if (!dragSrc) return
    const newOrdered = [...ordered]
    if (dragSrc.type === 'ordered') {
      newOrdered.splice(dragSrc.index, 1)
      const insertIdx = dragSrc.index < targetIdx ? targetIdx - 1 : targetIdx
      newOrdered.splice(insertIdx, 0, dragSrc.word)
    } else {
      newOrdered.splice(targetIdx, 0, dragSrc.word)
    }
    setDragSrc(null)
    commit(newOrdered)
  }

  function onDropEnd(e) {
    e.preventDefault()
    if (!dragSrc || dragSrc.type === 'ordered') { setDragSrc(null); return }
    commit([...ordered, dragSrc.word])
    setDragSrc(null)
  }

  function onDropBank(e) {
    e.preventDefault()
    if (!dragSrc || dragSrc.type === 'bank') return
    commit(ordered.filter((_, i) => i !== dragSrc.index))
    setDragSrc(null)
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={e => e.preventDefault()}
        onDrop={onDropEnd}
        className="bg-white rounded-2xl border-2 border-indigo-200 p-5 min-h-16 flex flex-wrap gap-2 items-center"
      >
        {ordered.length === 0 ? (
          <span className="text-gray-300 text-sm select-none">Kéo hoặc bấm từ để ghép thành câu...</span>
        ) : (
          ordered.map((word, i) => (
            <span
              key={i}
              draggable={!disabled}
              onDragStart={e => onDragStartOrdered(e, i)}
              onDragOver={e => e.preventDefault()}
              onDrop={e => onDropAt(e, i)}
              onClick={() => handleOrderedClick(i)}
              className="px-3 py-1.5 rounded-lg border-2 border-indigo-400 bg-indigo-50 text-indigo-800 text-sm font-medium cursor-pointer select-none hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition"
            >
              {word}
            </span>
          ))
        )}
      </div>

      <div onDragOver={e => e.preventDefault()} onDrop={onDropBank}>
        <p className="text-xs text-gray-400 mb-2">
          Bấm từ để thêm vào câu · bấm từ đã xếp để xóa · kéo để chèn vào vị trí cụ thể
        </p>
        <div className="flex flex-wrap gap-2 min-h-12 p-3 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50">
          {wordBank.map(opt => {
            const isUsed = usedWords.has(opt.text)
            return (
              <span
                key={opt.key}
                draggable={!disabled && !isUsed}
                onDragStart={e => onDragStartBank(e, opt.text)}
                onClick={() => handleBankClick(opt.text)}
                className={`px-3 py-1.5 rounded-lg border-2 text-sm font-medium transition select-none
                  ${isUsed
                    ? 'border-gray-200 bg-gray-100 text-gray-300 cursor-not-allowed opacity-40'
                    : 'border-indigo-300 bg-white text-indigo-700 hover:bg-indigo-50 cursor-grab'
                  }`}
              >
                {opt.text}
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}
