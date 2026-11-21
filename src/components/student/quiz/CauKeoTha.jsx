// Câu kéo thả từ vào chỗ trống — bấm hoặc kéo; ô có thể nằm trong khối code.
import { useState, useMemo } from 'react'
import { CodeBlock, CodeBlockWithBlanks } from '../../ui/CodeBlock'
import { xaoTron } from '../../../utils/xaoTron'
import { tachChoTrong } from '../../../domain/dinhDangCauHoi'

// Kéo thả từ vào chỗ trống — hỗ trợ cả click lẫn drag-and-drop
export default function DragWordQuestion({ q, value, onChange, disabled }) {
  const { tokens, soCho: blankCount } = useMemo(() => tachChoTrong(q.question), [q.question])
  const wordBank = useMemo(() => xaoTron(q.options || []), [q.id])

  const [filled, setFilled] = useState(() => {
    if (value) return value.split(',').map(w => w.trim())
    return Array(blankCount).fill(null)
  })

  const [activeWord, setActiveWord] = useState(null)
  const [dragSrc, setDragSrc] = useState(null)

  const usedWords = new Set(filled.filter(Boolean))

  function commit(newFilled) {
    setFilled(newFilled)
    const hasAny = newFilled.some(Boolean)
    onChange(hasAny ? newFilled.map(w => w || '').join(',') : null)
  }

  function handleWordClick(word) {
    if (disabled || usedWords.has(word)) return
    setActiveWord(prev => prev === word ? null : word)
  }

  function handleBlankClick(idx) {
    if (disabled) return
    if (activeWord) {
      const newFilled = [...filled]
      newFilled[idx] = activeWord
      setActiveWord(null)
      commit(newFilled)
    } else if (filled[idx]) {
      const word = filled[idx]
      const newFilled = [...filled]
      newFilled[idx] = null
      commit(newFilled)
      setActiveWord(word)
    }
  }

  function onDragStartBank(e, word) {
    setDragSrc({ type: 'bank', word })
    e.dataTransfer.effectAllowed = 'move'
  }

  function onDragStartBlank(e, idx) {
    if (!filled[idx]) return
    setDragSrc({ type: 'blank', word: filled[idx], index: idx })
    e.dataTransfer.effectAllowed = 'move'
  }

  function onDropBlank(e, idx) {
    e.preventDefault()
    if (!dragSrc) return
    const newFilled = [...filled]
    if (dragSrc.type === 'blank') {
      newFilled[idx] = dragSrc.word
      newFilled[dragSrc.index] = filled[idx] || null
    } else {
      newFilled[idx] = dragSrc.word
    }
    setDragSrc(null)
    commit(newFilled)
  }

  function onDropBank(e) {
    e.preventDefault()
    if (!dragSrc || dragSrc.type === 'bank') return
    const newFilled = [...filled]
    newFilled[dragSrc.index] = null
    setDragSrc(null)
    commit(newFilled)
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-200 p-5 text-base leading-loose text-gray-800 whitespace-pre-wrap">
        {tokens.map((token, ti) => {
          if (token.type === 'text') return <span key={ti}>{token.content}</span>

          if (token.type === 'blank') {
            const idx = token.index
            return (
              <span key={ti}
                onDragOver={e => e.preventDefault()}
                onDrop={e => onDropBlank(e, idx)}
                onClick={() => handleBlankClick(idx)}
                className={`inline-flex items-center mx-1 px-3 py-0.5 rounded-lg border-2 min-w-16 text-sm font-semibold transition cursor-pointer select-none
                  ${filled[idx]
                    ? 'border-indigo-400 bg-indigo-50 text-indigo-800 hover:border-red-300 hover:bg-red-50'
                    : activeWord
                      ? 'border-dashed border-indigo-400 bg-indigo-50/60 text-indigo-300 animate-pulse'
                      : 'border-dashed border-gray-300 text-gray-300'
                  }`}
              >
                {filled[idx]
                  ? <span draggable={!disabled} onDragStart={e => onDragStartBlank(e, idx)} className="cursor-grab">{filled[idx]}</span>
                  : <span className="select-none text-gray-300">{'____'}</span>
                }
              </span>
            )
          }

          if (token.type === 'code') {
            return <CodeBlock key={ti} lang={token.lang} code={token.content} />
          }

          if (token.type === 'code-with-blanks') {
            return (
              <CodeBlockWithBlanks
                key={ti}
                lang={token.lang}
                segs={token.segs}
                startIdx={token.startIdx}
                renderBlank={idx => (
                  <span
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => onDropBlank(e, idx)}
                    onClick={() => handleBlankClick(idx)}
                    className={`inline-flex items-center mx-1 px-2 py-0.5 rounded border-2 min-w-12 font-semibold transition cursor-pointer select-none
                      ${filled[idx]
                        ? 'border-indigo-400 bg-indigo-50 text-indigo-800 hover:border-red-300 hover:bg-red-50'
                        : activeWord
                          ? 'border-dashed border-indigo-400 bg-indigo-50/60 text-indigo-300 animate-pulse'
                          : 'border-dashed border-gray-300 text-gray-300'
                      }`}
                  >
                    {filled[idx]
                      ? <span draggable={!disabled} onDragStart={e => onDragStartBlank(e, idx)} className="cursor-grab">{filled[idx]}</span>
                      : <span className="select-none text-gray-300">{'____'}</span>
                    }
                  </span>
                )}
              />
            )
          }

          return null
        })}
      </div>

      <div onDragOver={e => e.preventDefault()} onDrop={onDropBank}>
        <p className="text-xs text-gray-400 mb-2">
          Kéo thả từ vào ô · hoặc bấm từ rồi bấm ô để điền · bấm ô đã điền để lấy lại
        </p>
        <div className="flex flex-wrap gap-2 min-h-12 p-3 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50">
          {wordBank.map(opt => {
            const isUsed = usedWords.has(opt.text)
            const isActive = activeWord === opt.text
            return (
              <span
                key={opt.key}
                draggable={!disabled && !isUsed}
                onDragStart={e => onDragStartBank(e, opt.text)}
                onClick={() => handleWordClick(opt.text)}
                className={`px-3 py-1.5 rounded-lg border-2 text-sm font-medium transition select-none
                  ${isUsed
                    ? 'border-gray-200 bg-gray-100 text-gray-300 cursor-not-allowed opacity-40'
                    : isActive
                      ? 'border-indigo-500 bg-indigo-600 text-white cursor-pointer shadow-md scale-105'
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
