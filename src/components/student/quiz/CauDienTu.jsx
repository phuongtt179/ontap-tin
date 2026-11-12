// Câu điền chỗ trống (gõ chữ vào ô; ô có thể nằm trong khối code).
import { useMemo } from 'react'
import { CodeBlock, CodeBlockWithBlanks } from '../../ui/CodeBlock'
import { tachChoTrong } from '../../../domain/dinhDangCauHoi'

export default function FillBlankQuestion({ q, value, onChange, disabled, showResult }) {
  const correctAnswers = useMemo(() => (q.correct_answer || '').split(',').map(s => s.trim()), [q.id])

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
    const val = vals[idx] || ''
    const correct = correctAnswers[idx] || ''
    const isCorrect = showResult && val.trim().toLowerCase() === correct.toLowerCase()
    const isWrong = showResult && val.trim().toLowerCase() !== correct.toLowerCase()
    return (
      <span key={`b${idx}`} className="inline-flex items-center gap-1">
        <input
          value={val}
          onChange={e => handleChange(idx, e.target.value)}
          disabled={disabled}
          placeholder="..."
          className={`border-b-2 bg-transparent focus:outline-none text-center transition px-1
            ${isCode ? 'font-mono text-sm w-20' : 'text-base w-24'}
            ${isCorrect ? 'border-green-500 text-green-700'
              : isWrong ? 'border-red-400 text-red-700'
              : 'border-indigo-400 focus:border-indigo-600 text-indigo-800'
            }`}
        />
        {isWrong && <span className="text-xs text-green-600 font-medium">→{correct}</span>}
      </span>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 text-base leading-loose text-gray-800 whitespace-pre-wrap">
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
