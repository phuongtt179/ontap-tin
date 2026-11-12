// Ô trả lời từng loại câu hỏi trong quiz của trang Học bài (kéo thả từ, ghép cặp, điền chỗ trống, sắp xếp, sắp xếp câu).
import { useState, useEffect, useMemo } from 'react'
import { phraseBank } from '../../../utils/wordOrder'
import MatchingLines from '../../ui/MatchingLines'
import { ArrowUp, ArrowDown } from 'lucide-react'
import { xaoTron } from '../../../utils/xaoTron'
import { CodeBlock, CodeBlockWithBlanks } from '../../ui/CodeBlock'
import { tachChoTrong } from '../../../domain/dinhDangCauHoi'

/* ── DragWordInput ─────────────────────────────────────────── */
export function DragWordInput({ q, value, onChange, disabled }) {
  const { tokens, soCho: blankCount } = useMemo(() => tachChoTrong(q.question), [q.question])

  const wordBank = useMemo(() => xaoTron(q.options || []), [q.id])
  const [filled, setFilled] = useState(() =>
    value ? value.split(',').map(w => w.trim()) : Array(blankCount).fill(null)
  )
  const usedWords = new Set(filled.filter(Boolean))

  function placeWord(word) {
    const idx = filled.findIndex(f => !f)
    if (idx === -1) return
    const next = [...filled]; next[idx] = word
    setFilled(next)
    onChange(next.map(w => w || '').join(','))
  }
  function removeWord(idx) {
    const next = [...filled]; next[idx] = null
    setFilled(next)
    const hasAny = next.some(Boolean)
    onChange(hasAny ? next.map(w => w || '').join(',') : null)
  }

  function renderBlank(idx) {
    return (
      <button key={`b${idx}`}
        onClick={() => !disabled && removeWord(idx)}
        disabled={disabled && !filled[idx]}
        className={`inline-flex items-center mx-1 px-3 py-0.5 rounded-lg border-2 min-w-12 text-sm font-semibold transition ${
          filled[idx]
            ? disabled ? 'border-indigo-300 bg-indigo-50 text-indigo-700 cursor-default'
              : 'border-indigo-400 bg-indigo-50 text-indigo-800 hover:bg-red-50 hover:border-red-300 hover:text-red-600'
            : 'border-dashed border-gray-300 text-gray-300 cursor-default'
        }`}
      >{filled[idx] || '___'}</button>
    )
  }

  return (
    <div className="space-y-3">
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 text-sm leading-relaxed text-gray-800 whitespace-pre-wrap">
        {tokens.map((token, ti) => {
          if (token.type === 'text') return <span key={ti}>{token.content}</span>
          if (token.type === 'blank') return renderBlank(token.index)
          if (token.type === 'code') return <CodeBlock key={ti} lang={token.lang} code={token.content} />
          if (token.type === 'code-with-blanks') return (
            <CodeBlockWithBlanks
              key={ti}
              lang={token.lang}
              segs={token.segs}
              startIdx={token.startIdx}
              renderBlank={idx => renderBlank(idx)}
            />
          )
          return null
        })}
      </div>
      <div>
        <p className="text-xs text-gray-400 mb-2">Bấm từ để điền · Bấm chỗ trống để xóa</p>
        <div className="flex flex-wrap gap-2">
          {wordBank.map(opt => {
            const word = opt && typeof opt === 'object' ? opt.text : String(opt)
            const isUsed = usedWords.has(word)
            return (
              <button key={word} onClick={() => !isUsed && !disabled && placeWord(word)} disabled={isUsed || disabled}
                className={`px-3 py-1.5 rounded-lg border-2 text-sm font-medium transition ${
                  isUsed ? 'border-gray-200 bg-gray-100 text-gray-300 cursor-not-allowed'
                  : 'border-indigo-300 bg-white text-indigo-700 hover:bg-indigo-50 hover:border-indigo-500'
                }`}
              >{word}</button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ── MatchingInput ──────────────────────────────────────────── */
export function MatchingInput({ q, value, onChange, disabled }) {
  // Nối bằng đường thẳng (bấm trái → bấm phải), chạy được trên cả màn hình cảm ứng — xem ui/MatchingLines.jsx
  return <MatchingLines q={q} value={value} onChange={onChange} disabled={disabled} showResult={disabled} />
}

/* ── FillBlankInput ─────────────────────────────────────────── */
export function FillBlankInput({ q, value, onChange, disabled }) {
  const { tokens, soCho: blankCount } = useMemo(() => tachChoTrong(q.question), [q.question])

  const vals = useMemo(() => {
    const arr = value ? value.split(',') : []
    return Array.from({ length: blankCount }, (_, i) => arr[i] || '')
  }, [value, blankCount])

  function handleChange(idx, v) {
    const next = [...vals]; next[idx] = v
    onChange(next.every(x => !x) ? null : next.join(','))
  }

  function renderBlank(idx, isCode = false) {
    return (
      <input key={`b${idx}`}
        value={vals[idx] || ''}
        onChange={e => handleChange(idx, e.target.value)}
        disabled={disabled}
        placeholder="..."
        className={`border-b-2 border-indigo-400 bg-transparent focus:outline-none focus:border-indigo-600 text-indigo-800 text-center transition px-1
          ${isCode ? 'font-mono text-sm w-20' : 'text-sm w-24'}`}
      />
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 text-sm leading-loose text-gray-800 whitespace-pre-wrap">
      {tokens.map((token, ti) => {
        if (token.type === 'text') return <span key={ti}>{token.content}</span>
        if (token.type === 'blank') return renderBlank(token.index)
        if (token.type === 'code') return <CodeBlock key={ti} lang={token.lang} code={token.content} />
        if (token.type === 'code-with-blanks') return (
          <CodeBlockWithBlanks
            key={ti}
            lang={token.lang}
            segs={token.segs}
            startIdx={token.startIdx}
            renderBlank={idx => renderBlank(idx, true)}
          />
        )
        return null
      })}
    </div>
  )
}

/* ── OrderingInput ──────────────────────────────────────────── */
export function OrderingInput({ q, value, onChange, disabled }) {
  const [items, setItems] = useState(() => {
    if (value) {
      const keyOrder = value.split(',')
      return keyOrder.map(k => q.options?.find(o => o.key === k)).filter(Boolean)
    }
    return xaoTron(q.options || [])
  })
  useEffect(() => { if (!value) onChange(items.map(o => o.key).join(',')) }, [])
  const [dragIdx, setDragIdx] = useState(null)
  const [overIdx, setOverIdx] = useState(null)

  function commit(next) { setItems(next); onChange(next.map(o => o.key).join(',')) }

  function move(index, dir) {
    const next = [...items]; const target = index + dir
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    commit(next)
  }

  function onDragStart(i) { setDragIdx(i) }
  function onDragOver(e, i) { e.preventDefault(); setOverIdx(i) }
  function onDrop(i) {
    if (dragIdx === null || dragIdx === i) { setDragIdx(null); setOverIdx(null); return }
    const next = [...items]
    const [moved] = next.splice(dragIdx, 1)
    next.splice(i, 0, moved)
    commit(next)
    setDragIdx(null); setOverIdx(null)
  }
  function onDragEnd() { setDragIdx(null); setOverIdx(null) }

  return (
    <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
      <p className="text-xs text-gray-400 mb-3">Kéo thả để sắp xếp · hoặc bấm ↑ ↓</p>
      <div className="space-y-2">
        {items.map((opt, i) => (
          <div
            key={opt.key}
            draggable={!disabled}
            onDragStart={() => onDragStart(i)}
            onDragOver={e => onDragOver(e, i)}
            onDrop={() => onDrop(i)}
            onDragEnd={onDragEnd}
            className={`flex items-center gap-2 rounded-xl border-2 transition cursor-grab active:cursor-grabbing
              ${dragIdx === i ? 'opacity-40 border-indigo-300 bg-indigo-50' :
                overIdx === i ? 'border-indigo-400 bg-indigo-50 scale-[1.01]' :
                'border-gray-200 bg-white hover:border-indigo-200'}`}
          >
            <span className="w-8 h-full flex items-center justify-center text-gray-300 px-2 py-3 shrink-0 select-none text-lg leading-none">⠿</span>
            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0 select-none">{i + 1}</span>
            <span className="flex-1 py-2 pr-2 text-sm text-gray-800 select-none">{opt.text}</span>
            {!disabled && (
              <div className="flex flex-col gap-0.5 pr-2 shrink-0">
                <button onClick={e => { e.stopPropagation(); move(i, -1) }} disabled={i === 0}
                  className="text-gray-300 hover:text-indigo-500 disabled:opacity-20 transition p-0.5">
                  <ArrowUp size={13} />
                </button>
                <button onClick={e => { e.stopPropagation(); move(i, 1) }} disabled={i === items.length - 1}
                  className="text-gray-300 hover:text-indigo-500 disabled:opacity-20 transition p-0.5">
                  <ArrowDown size={13} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── WordOrderInput ─────────────────────────────────────────── */
export function WordOrderInput({ q, value, onChange, disabled }) {
  // Thẻ theo CỤM TỪ (không tách lẻ từng tiếng) — xem utils/wordOrder.js
  const bankWords = useMemo(() => xaoTron(phraseBank(q)), [q.id])

  const [ordered, setOrdered] = useState(() =>
    value ? value.split(',').map(w => w.trim()).filter(Boolean) : []
  )
  const usedSet = useMemo(() => new Set(ordered), [ordered])

  function handleBankClick(word) {
    if (disabled || usedSet.has(word)) return
    const next = [...ordered, word]
    setOrdered(next)
    onChange(next.join(','))
  }

  function handleRemove(idx) {
    if (disabled) return
    const next = ordered.filter((_, i) => i !== idx)
    setOrdered(next)
    onChange(next.length ? next.join(',') : null)
  }

  return (
    <div className="space-y-3">
      {/* Ordered area */}
      <div className="min-h-12 p-3 rounded-xl border-2 border-indigo-200 bg-indigo-50/30 flex flex-wrap gap-2 items-center">
        {ordered.length === 0
          ? <span className="text-sm text-gray-300 select-none">Bấm từ bên dưới để ghép thành câu...</span>
          : ordered.map((word, i) => (
            <button key={i} onClick={() => handleRemove(i)} disabled={disabled}
              className="px-3 py-1.5 rounded-lg border-2 border-indigo-400 bg-white text-indigo-800 text-sm font-medium hover:bg-red-50 hover:border-red-300 transition select-none">
              {word}
            </button>
          ))
        }
      </div>

      {/* Word bank */}
      <div>
        <p className="text-xs text-gray-400 mb-2">Bấm từ để thêm · bấm từ đã chọn để xoá</p>
        <div className="flex flex-wrap gap-2 p-3 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50">
          {bankWords.map((word, i) => {
            const used = usedSet.has(word)
            return (
              <button key={i} onClick={() => handleBankClick(word)} disabled={disabled || used}
                className={`px-3 py-1.5 rounded-lg border-2 text-sm font-medium transition select-none
                  ${used ? 'border-gray-200 bg-gray-100 text-gray-300 cursor-not-allowed opacity-50'
                         : 'border-indigo-300 bg-white text-indigo-700 hover:bg-indigo-50 cursor-pointer'}`}>
                {word}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
