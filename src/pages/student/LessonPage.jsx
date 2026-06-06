import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { ArrowLeft, ArrowUp, ArrowDown, CheckCircle, PlayCircle, BookOpen, Upload, Loader2, Send, FileText, FileImage, File, Code } from 'lucide-react'
import { uploadFile } from '../../lib/cloudinary'
import QuestionText from '../../components/ui/QuestionText'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { CodeBlock, CodeBlockWithBlanks } from '../../components/ui/CodeBlock'

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5) }

/* ── DragWordInput ─────────────────────────────────────────── */
function DragWordInput({ q, value, onChange, disabled }) {
  const tokens = useMemo(() => {
    const result = []; let blankIdx = 0
    const codeBlockRe = /```(\w*)\n?([\s\S]*?)```/g
    let last = 0, m
    function pushText(txt) {
      txt.split('___').forEach((seg, i, arr) => {
        if (seg) result.push({ type: 'text', content: seg })
        if (i < arr.length - 1) result.push({ type: 'blank', index: blankIdx++ })
      })
    }
    while ((m = codeBlockRe.exec(q.question)) !== null) {
      if (m.index > last) pushText(q.question.slice(last, m.index))
      const code = m[2].replace(/\n$/, '')
      if (code.includes('___')) {
        const segs = code.split('___')
        result.push({ type: 'code-with-blanks', lang: m[1] || '', segs, startIdx: blankIdx })
        blankIdx += segs.length - 1
      } else {
        result.push({ type: 'code', lang: m[1] || '', content: code })
      }
      last = m.index + m[0].length
    }
    if (last < q.question.length) pushText(q.question.slice(last))
    return result
  }, [q.id, q.question])

  const blankCount = tokens.filter(t => t.type === 'blank').length +
    tokens.filter(t => t.type === 'code-with-blanks').reduce((a, t) => a + t.segs.length - 1, 0)

  const wordBank = useMemo(() => shuffle(q.options || []), [q.id])
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
function MatchingInput({ q, value, onChange, disabled }) {
  const [rightItems, setRightItems] = useState(() => {
    if (value) {
      const pairs = {}
      value.split(',').forEach(p => { const [l, r] = p.split('-'); if (l && r) pairs[l] = r })
      const allRight = q.match_options || []
      const used = new Set()
      const ordered = (q.options || []).map(o => {
        const rk = pairs[o.key]; if (!rk) return null
        used.add(rk); return allRight.find(m => m.key === rk)
      }).filter(Boolean)
      const remaining = allRight.filter(m => !used.has(m.key))
      return [...ordered, ...remaining]
    }
    return shuffle(q.match_options || [])
  })
  const [dragIdx, setDragIdx] = useState(null)
  const [overIdx, setOverIdx] = useState(null)

  function buildAnswer(items) {
    const matchOpts = q.match_options || []
    if (matchOpts.length > 0 && matchOpts.every((m, i) => items[i]?.key === m.key)) {
      return q.correct_answer
    }
    return (q.options || []).map((o, i) => items[i] ? `${o.key}-${items[i].key}` : null).filter(Boolean).join(',')
  }
  useEffect(() => { if (!value) onChange(buildAnswer(rightItems)) }, [])

  function onDragStart(i) { setDragIdx(i) }
  function onDragOver(e, i) { e.preventDefault(); setOverIdx(i) }
  function onDrop(i) {
    if (dragIdx === null || dragIdx === i) { setDragIdx(null); setOverIdx(null); return }
    const next = [...rightItems]
    const [moved] = next.splice(dragIdx, 1)
    next.splice(i, 0, moved)
    setRightItems(next); setDragIdx(null); setOverIdx(null)
    onChange(buildAnswer(next))
  }
  function onDragEnd() { setDragIdx(null); setOverIdx(null) }

  const correctPairs = new Set(
    (q.options || []).map((o, i) => {
      const r = (q.match_options || [])[i]
      return r ? `${o.key}-${r.key}` : null
    }).filter(Boolean)
  )

  return (
    <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
      <p className="text-xs text-gray-400 mb-3">Kéo cột phải để sắp xếp tương ứng với cột trái</p>
      <div className="flex gap-3 items-start">
        <div className="flex-1 space-y-2">
          {(q.options || []).map(opt => (
            <div key={opt.key} className="px-3 py-2 rounded-lg border-2 border-gray-200 bg-white text-sm text-gray-800 min-h-[40px] flex items-center">
              <span className="font-bold mr-1">{opt.key}.</span>{opt.text}
            </div>
          ))}
        </div>
        <div className="flex flex-col text-gray-300 text-lg select-none">
          {(q.options || []).map((_, i) => (
            <div key={i} className="min-h-[40px] mb-2 flex items-center">→</div>
          ))}
        </div>
        <div className="flex-1 space-y-2">
          {rightItems.map((opt, i) => {
            const pairKey = `${(q.options || [])[i]?.key}-${opt.key}`
            const isCorrect = disabled && correctPairs.has(pairKey)
            const isWrong = disabled && !correctPairs.has(pairKey)
            return (
              <div key={opt.key}
                draggable={!disabled}
                onDragStart={() => onDragStart(i)}
                onDragOver={e => onDragOver(e, i)}
                onDrop={() => onDrop(i)}
                onDragEnd={onDragEnd}
                className={`px-3 py-2 rounded-lg border-2 text-sm min-h-[40px] flex items-center gap-2 transition
                  ${disabled
                    ? isCorrect ? 'border-green-400 bg-green-50 text-green-800'
                    : isWrong ? 'border-red-300 bg-red-50 text-red-800'
                    : 'border-gray-200 bg-white'
                    : dragIdx === i ? 'border-indigo-400 bg-indigo-50 opacity-50'
                    : overIdx === i ? 'border-indigo-400 border-dashed bg-indigo-50/40'
                    : 'border-gray-200 bg-white text-gray-700 cursor-grab hover:border-indigo-300'
                  }`}
              >
                {!disabled && <span className="text-gray-300 shrink-0 select-none">⠿</span>}
                {opt.text}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ── FillBlankInput ─────────────────────────────────────────── */
function FillBlankInput({ q, value, onChange, disabled }) {
  const tokens = useMemo(() => {
    const result = []; let blankIdx = 0
    const codeBlockRe = /```(\w*)\n?([\s\S]*?)```/g
    let last = 0, m
    function pushText(txt) {
      txt.split('___').forEach((seg, i, arr) => {
        if (seg) result.push({ type: 'text', content: seg })
        if (i < arr.length - 1) result.push({ type: 'blank', index: blankIdx++ })
      })
    }
    while ((m = codeBlockRe.exec(q.question)) !== null) {
      if (m.index > last) pushText(q.question.slice(last, m.index))
      const code = m[2].replace(/\n$/, '')
      if (code.includes('___')) {
        const segs = code.split('___')
        result.push({ type: 'code-with-blanks', lang: m[1] || '', segs, startIdx: blankIdx })
        blankIdx += segs.length - 1
      } else {
        result.push({ type: 'code', lang: m[1] || '', content: code })
      }
      last = m.index + m[0].length
    }
    if (last < q.question.length) pushText(q.question.slice(last))
    return result
  }, [q.id, q.question])

  const blankCount = tokens.filter(t => t.type === 'blank').length +
    tokens.filter(t => t.type === 'code-with-blanks').reduce((a, t) => a + t.segs.length - 1, 0)

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
function OrderingInput({ q, value, onChange, disabled }) {
  const [items, setItems] = useState(() => {
    if (value) {
      const keyOrder = value.split(',')
      return keyOrder.map(k => q.options?.find(o => o.key === k)).filter(Boolean)
    }
    return shuffle(q.options || [])
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
function WordOrderInput({ q, value, onChange, disabled }) {
  // Nếu options rỗng, tách từ correct_answer làm ngân hàng từ
  const bankWords = useMemo(() => {
    const opts = (q.options || []).filter(o => o && o.text)
    if (opts.length > 0) return shuffle(opts.map(o => o.text))
    if (q.correct_answer) {
      const words = q.correct_answer.trim().split(/\s+/).filter(Boolean)
      return shuffle(words)
    }
    return []
  }, [q.id])

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

/* ── Helpers ───────────────────────────────────────────────── */
function parseTasks(instructions) {
  if (!instructions) return [{ instructions: '' }]
  try {
    const arr = JSON.parse(instructions)
    if (Array.isArray(arr) && arr.length > 0) return arr
  } catch {}
  return [{ instructions }]
}

function getEmbedUrl(url) {
  if (!url) return null
  const m = url.match(/(?:youtu\.be\/|[?&]v=)([a-zA-Z0-9_-]{11})/)
  if (m) return `https://www.youtube.com/embed/${m[1]}`
  if (url.includes('/embed/')) return url
  return null
}

function checkAnswer(type, ans, correct) {
  if (type === 'essay') return true // không chấm tự động
  if (!ans || !correct) return false
  if (type === 'matching') {
    const norm = s => s.split(',').map(p => p.trim()).sort().join(',')
    return norm(ans) === norm(correct)
  }
  if (type === 'word_order') {
    const sentence = ans.split(',').map(w => w.trim()).join(' ')
    return sentence.toLowerCase() === correct.trim().toLowerCase()
  }
  if (type === 'drag_word' || (type === 'fill_blank' && correct.includes(','))) {
    const a = ans.split(',').map(w => w.trim().toLowerCase())
    const c = correct.split(',').map(w => w.trim().toLowerCase())
    return a.length === c.length && a.every((w, i) => w === c[i])
  }
  return ans.trim().toLowerCase() === correct.trim().toLowerCase()
}

function calcCompleted(prog, les) {
  const videoOk = !les.video_url || prog.video_watched
  const pptxOk = !les.pptx_url || prog.pptx_viewed
  const quizOk = !(les.question_ids?.length > 0) || prog.quiz_passed
  const practiceOk = !les.has_practice || prog.practice_submitted
  return videoOk && pptxOk && quizOk && practiceOk
}

/* ── FileIcon ──────────────────────────────────────────────── */
function FileIcon({ url, size = 20 }) {
  const ext = (url || '').split('.').pop().toLowerCase()
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return <FileImage size={size} className="text-blue-400" />
  if (ext === 'docx' || ext === 'doc') return <FileText size={size} className="text-blue-600" />
  if (ext === 'pptx' || ext === 'ppt') return <FileText size={size} className="text-orange-500" />
  if (ext === 'sb3') return <File size={size} className="text-yellow-500" />
  if (ext === 'pdf') return <FileText size={size} className="text-red-500" />
  if (ext === 'py') return <Code size={size} className="text-green-600" />
  if (ext === 'txt') return <FileText size={size} className="text-gray-500" />
  return <File size={size} className="text-gray-400" />
}

function CodeViewer({ url, ext }) {
  const [content, setContent] = useState(null)
  const [shown, setShown] = useState(false)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    if (shown) { setShown(false); return }
    if (content !== null) { setShown(true); return }
    setLoading(true)
    try {
      const res = await fetch(url)
      setContent(await res.text())
    } catch {
      setContent('(Không thể tải nội dung file)')
    }
    setLoading(false)
    setShown(true)
  }

  return (
    <div className="space-y-2">
      <button onClick={toggle} disabled={loading}
        className="text-xs text-indigo-600 hover:underline disabled:opacity-50">
        {loading ? 'Đang tải...' : shown ? 'Ẩn nội dung' : 'Xem nội dung'}
      </button>
      {shown && content !== null && (
        ext === 'py'
          ? <SyntaxHighlighter language="python" style={oneLight}
              customStyle={{ borderRadius: '8px', fontSize: '12px', margin: 0 }}>
              {content}
            </SyntaxHighlighter>
          : <pre className="bg-gray-50 border rounded-lg p-3 text-xs text-gray-700 whitespace-pre-wrap overflow-auto max-h-64">{content}</pre>
      )}
    </div>
  )
}

/* ── SubmittedFile ──────────────────────────────────────────── */
function SubmittedFile({ url }) {
  const ext = (url || '').split('.').pop().toLowerCase().split('?')[0]
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)
  const isOffice = ['doc', 'docx', 'ppt', 'pptx'].includes(ext)
  const isCode = ext === 'py' || ext === 'txt'
  const fileName = decodeURIComponent(url.split('/').pop().split('?')[0])

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 overflow-hidden">
      {isImage && (
        <img src={url} alt="Bài nộp" className="w-full max-h-64 object-contain bg-white border-b border-gray-200" />
      )}
      <div className="flex items-center gap-3 px-4 py-3">
        <FileIcon url={url} size={22} />
        <span className="flex-1 text-sm text-gray-700 truncate">{fileName}</span>
        <a href={url} target="_blank" rel="noopener noreferrer"
          className="text-xs text-indigo-600 hover:underline font-medium shrink-0">
          Tải xuống
        </a>
      </div>
      {isOffice && (
        <div className="border-t border-gray-200 bg-gray-100 overflow-hidden">
          <iframe
            src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`}
            width="100%" height="480" frameBorder="0" title="Xem file" className="w-full block"
          />
        </div>
      )}
      {isCode && (
        <div className="border-t border-gray-200 px-4 py-3">
          <CodeViewer url={url} ext={ext} />
        </div>
      )}
    </div>
  )
}

/* ── LessonQuiz ────────────────────────────────────────────── */
function LessonQuiz({ questions, onSubmit }) {
  const [current, setCurrent] = useState(0)
  const [answer, setAnswer] = useState(null)
  const [confirmed, setConfirmed] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [done, setDone] = useState(false)

  const q = questions[current]
  const opts = Array.isArray(q?.options) ? q.options : []
  const optText = (opt) => (opt && typeof opt === 'object') ? opt.text : String(opt)
  const isCorrect = confirmed && checkAnswer(q.type, answer, q.correct_answer)
  const isLast = current === questions.length - 1

  function handleConfirm() {
    if (!answer && q.type !== 'essay') return
    if (q.type === 'essay' && !answer?.trim()) return
    setConfirmed(true)
  }

  function handleNext() {
    const correct = checkAnswer(q.type, answer, q.correct_answer)
    const newCorrect = correctCount + (correct ? 1 : 0)
    if (isLast) {
      const total = questions.length
      const passed = newCorrect / total >= 2 / 3
      setCorrectCount(newCorrect)
      setDone(true)
      onSubmit({ correct: newCorrect, total, passed })
    } else {
      setCorrectCount(newCorrect)
      setCurrent(c => c + 1)
      setAnswer(null)
      setConfirmed(false)
    }
  }

  function handleRetry() {
    setAnswer(null)
    setConfirmed(false)
  }

  function handleRestartAll() {
    setCurrent(0)
    setAnswer(null)
    setConfirmed(false)
    setCorrectCount(0)
    setDone(false)
  }

  if (done) {
    const total = questions.length
    const passed = correctCount / total >= 2 / 3
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-5 text-center space-y-3">
        <p className="text-3xl font-bold text-gray-800">{correctCount}/{total}</p>
        <p className="text-sm text-gray-500">câu đúng</p>
        <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold ${passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {passed ? 'Đạt ✓ (≥ 2/3 đúng)' : 'Chưa đạt'}
        </span>
        {!passed && (
          <div>
            <button onClick={handleRestartAll}
              className="mt-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition">
              Làm lại từ đầu
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Progress */}
      <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
        <span>Câu {current + 1} / {questions.length}</span>
        <span>{correctCount} đúng</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full">
        <div className="h-1.5 bg-indigo-500 rounded-full transition-all" style={{ width: `${(current / questions.length) * 100}%` }} />
      </div>

      {/* Question card */}
      <div className={`rounded-xl border p-4 transition ${confirmed ? isCorrect ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'}`}>
        {q.type !== 'drag_word' && q.type !== 'fill_blank' && (
          <div className="text-sm font-medium text-gray-800 mb-3">
            <QuestionText text={q.question} />
          </div>
        )}
        {q.image_url && (
          <img src={q.image_url} alt="" className="mb-3 rounded-lg max-h-40 object-contain border" />
        )}

        {/* Answer inputs — disabled after confirm */}
        {q.type === 'multiple_choice' && (
          <div className="grid grid-cols-1 gap-2">
            {opts.map((opt, oi) => {
              const label = String.fromCharCode(65 + oi)
              const val = optText(opt)
              const selected = answer === label
              const showCorrect = confirmed && label === q.correct_answer
              const showWrong = confirmed && selected && label !== q.correct_answer
              return (
                <button key={oi} onClick={() => !confirmed && setAnswer(label)}
                  disabled={confirmed}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-left text-sm transition
                    ${showCorrect ? 'border-green-500 bg-green-100 text-green-800'
                    : showWrong ? 'border-red-400 bg-red-100 text-red-700'
                    : selected ? 'border-indigo-500 bg-indigo-50 text-indigo-800'
                    : 'border-gray-200 hover:border-indigo-200'}`}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                    ${showCorrect ? 'bg-green-500 text-white' : showWrong ? 'bg-red-400 text-white' : selected ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                    {label}
                  </span>
                  {val}
                </button>
              )
            })}
          </div>
        )}

        {q.type === 'true_false' && (
          <div className="flex gap-3">
            {['Đúng', 'Sai'].map(val => {
              const selected = answer === val
              const showCorrect = confirmed && val === q.correct_answer
              const showWrong = confirmed && selected && val !== q.correct_answer
              return (
                <button key={val} onClick={() => !confirmed && setAnswer(val)}
                  disabled={confirmed}
                  className={`flex-1 py-2 rounded-lg border-2 text-sm font-medium transition
                    ${showCorrect ? 'border-green-500 bg-green-100 text-green-800'
                    : showWrong ? 'border-red-400 bg-red-100 text-red-700'
                    : selected ? 'border-indigo-500 bg-indigo-50 text-indigo-800'
                    : 'border-gray-200 hover:border-indigo-200'}`}>
                  {val}
                </button>
              )
            })}
          </div>
        )}

        {q.type === 'fill_blank' && (
          <FillBlankInput key={current} q={q} value={answer || ''} onChange={setAnswer} disabled={confirmed} />
        )}

        {q.type === 'drag_word' && (
          <DragWordInput key={current} q={q} value={answer || ''} onChange={setAnswer} disabled={confirmed} />
        )}
        {q.type === 'matching' && (
          <MatchingInput key={current} q={q} value={answer || ''} onChange={setAnswer} disabled={confirmed} />
        )}
        {q.type === 'ordering' && (
          <OrderingInput key={current} q={q} value={answer || ''} onChange={setAnswer} disabled={confirmed} />
        )}
        {q.type === 'word_order' && (
          <WordOrderInput key={current} q={q} value={answer || ''} onChange={setAnswer} disabled={confirmed} />
        )}

        {q.type === 'essay' && (
          <div className="space-y-2">
            <textarea
              value={answer || ''}
              onChange={e => setAnswer(e.target.value || null)}
              disabled={confirmed}
              rows={4}
              placeholder="Nhập câu trả lời của bạn..."
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none disabled:bg-gray-50"
            />
            {confirmed && q.correct_answer && (
              <div className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                <strong>Đáp án mẫu:</strong> {q.correct_answer}
              </div>
            )}
            {!confirmed && <p className="text-xs text-gray-400">Câu tự luận — giáo viên sẽ xem xét sau</p>}
          </div>
        )}

        {/* Feedback */}
        {confirmed && q.type !== 'essay' && (
          <div className={`mt-3 flex items-center gap-2 text-sm font-medium rounded-lg px-3 py-2 ${isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {isCorrect
              ? <><CheckCircle size={15} /> Chính xác!</>
              : <>
                  <span>✗</span> Sai rồi! Đáp án đúng:{' '}
                  <strong>
                    {q.type === 'word_order'
                      ? q.correct_answer
                      : q.correct_answer}
                  </strong>
                </>
            }
          </div>
        )}
        {confirmed && q.type === 'essay' && (
          <div className="mt-3 flex items-center gap-2 text-sm font-medium rounded-lg px-3 py-2 bg-blue-50 text-blue-700">
            <CheckCircle size={15} /> Đã ghi nhận câu trả lời
          </div>
        )}

        {/* Hint */}
        {confirmed && !isCorrect && q.hint && (
          <div className="mt-2 flex items-start gap-2 text-sm rounded-lg px-3 py-2 bg-amber-50 border border-amber-200 text-amber-800">
            <span className="shrink-0">💡</span>
            <span><strong>Gợi ý:</strong> {q.hint}</span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      {!confirmed ? (
        <button onClick={handleConfirm} disabled={!answer}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-50">
          Xác nhận
        </button>
      ) : isCorrect ? (
        <button onClick={handleNext}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl text-sm font-medium transition">
          {isLast ? 'Xem kết quả' : 'Câu tiếp theo →'}
        </button>
      ) : (
        <button onClick={handleRetry}
          className="w-full bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl text-sm font-medium transition">
          Thử lại
        </button>
      )}
    </div>
  )
}

/* ── LessonPage ────────────────────────────────────────────── */
export default function LessonPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [lesson, setLesson] = useState(null)
  const [questions, setQuestions] = useState([])
  const [progress, setProgress] = useState(null)
  const [taskSubmissions, setTaskSubmissions] = useState([])   // submission|null per task
  const [taskFiles, setTaskFiles] = useState([])               // File|null per task
  const [taskNotes, setTaskNotes] = useState([])               // string per task
  const [taskSubmitting, setTaskSubmitting] = useState(null)   // task index being submitted
  const [resubmitTask, setResubmitTask] = useState(null)       // task index in resubmit mode
  const [loading, setLoading] = useState(true)
  const [quizActive, setQuizActive] = useState(false)
  const [videoMarking, setVideoMarking] = useState(false)
  const [pptxMarking, setPptxMarking] = useState(false)

  useEffect(() => {
    if (user) loadAll()
  }, [id, user?.id])

  async function loadAll() {
    setLoading(true)
    // 1. Fetch lesson
    const { data: lessonData } = await supabase.from('lessons').select('*').eq('id', id).single()
    if (!lessonData) { toast.error('Không tìm thấy bài học'); navigate(-1); return }
    setLesson(lessonData)

    // 2. Fetch questions if any
    if (lessonData.question_ids?.length > 0) {
      const { data: qData } = await supabase.from('questions').select('*').in('id', lessonData.question_ids)
      const ordered = lessonData.question_ids.map(qid => qData?.find(q => q.id === qid)).filter(Boolean)
      setQuestions(ordered)
    }

    // 3. Fetch progress
    const { data: progData } = await supabase.from('lesson_progress')
      .select('*').eq('user_id', user.id).eq('lesson_id', id).maybeSingle()
    setProgress(progData || null)

    // 4. Fetch all task submissions
    const tasks = parseTasks(lessonData.practice_instructions)
    const { data: subData } = await supabase.from('lesson_submissions')
      .select('*').eq('user_id', user.id).eq('lesson_id', id)
      .order('submitted_at', { ascending: true })
    const subs = Array(tasks.length).fill(null)
    ;(subData || []).forEach(s => {
      const tidx = s.content_json?.task_index ?? 0
      if (tidx >= 0 && tidx < tasks.length) subs[tidx] = s
    })
    setTaskSubmissions(subs)
    setTaskFiles(Array(tasks.length).fill(null))
    setTaskNotes(Array(tasks.length).fill(''))

    setLoading(false)
  }

  async function upsertProgress(updates) {
    const current = progress || {}
    const newData = { ...current, ...updates, user_id: user.id, lesson_id: id }
    const completed = calcCompleted(newData, lesson)
    const { data, error } = await supabase.from('lesson_progress').upsert(
      { ...newData, completed, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,lesson_id' }
    ).select().single()
    if (!error && data) setProgress(data)
    return { data, error }
  }

  async function handleMarkVideoWatched() {
    setVideoMarking(true)
    const { error } = await upsertProgress({ video_watched: true })
    setVideoMarking(false)
    if (error) toast.error('Có lỗi xảy ra')
    else toast.success('Đã đánh dấu xem video')
  }

  async function handleMarkPptxViewed() {
    setPptxMarking(true)
    const { error } = await upsertProgress({ pptx_viewed: true })
    setPptxMarking(false)
    if (error) toast.error('Có lỗi xảy ra')
    else toast.success('Đã đánh dấu xem bài giảng')
  }

  async function handleQuizSubmit({ correct, total, passed }) {
    await upsertProgress({ quiz_correct: correct, quiz_total: total, quiz_passed: passed })
    if (passed) toast.success('Chúc mừng! Bạn đã đạt bài tập')
    else toast('Chưa đạt, hãy thử lại nhé!', { icon: '📖' })
  }

  async function handleTaskResubmit(taskIdx) {
    const file = taskFiles[taskIdx]
    const note = taskNotes[taskIdx] || ''
    const existingSub = taskSubmissions[taskIdx]
    setTaskSubmitting(taskIdx)
    try {
      let fileUrl = existingSub?.file_url ?? null
      if (file) fileUrl = await uploadFile(file)
      const { data: updated, error } = await supabase
        .from('lesson_submissions')
        .update({ file_url: fileUrl, text_content: note.trim() || null, submitted_at: new Date().toISOString() })
        .eq('id', existingSub.id)
        .select().single()
      if (error) throw error
      const newSubs = [...taskSubmissions]; newSubs[taskIdx] = updated; setTaskSubmissions(newSubs)
      setResubmitTask(null)
      const nf = [...taskFiles]; nf[taskIdx] = null; setTaskFiles(nf)
      const nn = [...taskNotes]; nn[taskIdx] = ''; setTaskNotes(nn)
      toast.success(`Đã cập nhật bài ${taskIdx + 1}`)
    } catch (err) {
      toast.error('Nộp lại thất bại: ' + err.message)
    } finally {
      setTaskSubmitting(null)
    }
  }

  async function handleTaskSubmit(taskIdx) {
    const file = taskFiles[taskIdx]
    const note = taskNotes[taskIdx] || ''
    if (!file && !note.trim()) {
      toast.error('Vui lòng chọn file hoặc nhập ghi chú')
      return
    }
    setTaskSubmitting(taskIdx)
    try {
      let fileUrl = null
      if (file) fileUrl = await uploadFile(file)
      const { data: subInserted, error } = await supabase.from('lesson_submissions').insert({
        user_id: user.id,
        lesson_id: id,
        file_url: fileUrl,
        text_content: note.trim() || null,
        content_json: { task_index: taskIdx },
        submitted_at: new Date().toISOString(),
      }).select().single()
      if (error) throw error
      const newSubs = [...taskSubmissions]
      newSubs[taskIdx] = subInserted
      setTaskSubmissions(newSubs)
      if (newSubs.every(s => s !== null)) {
        await upsertProgress({ practice_submitted: true })
      }
      toast.success(`Đã nộp bài ${taskIdx + 1}`)
    } catch (err) {
      toast.error('Nộp bài thất bại: ' + err.message)
    } finally {
      setTaskSubmitting(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    )
  }

  if (!lesson) return null

  const hasVideo = !!lesson.video_url
  const hasPptx = !!lesson.pptx_url
  const hasQuiz = questions.length > 0
  const hasPractice = lesson.has_practice
  const embedUrl = getEmbedUrl(lesson.video_url)
  const practiceTasks = parseTasks(lesson.practice_instructions)
  const submittedCount = taskSubmissions.filter(Boolean).length

  const videoOk = !hasVideo || progress?.video_watched
  const pptxOk = !hasPptx || progress?.pptx_viewed
  const quizOk = !hasQuiz || progress?.quiz_passed
  const practiceOk = !hasPractice || progress?.practice_submitted
  const totalSteps = [hasVideo, hasPptx, hasQuiz, hasPractice].filter(Boolean).length
  const doneSteps = [videoOk && hasVideo, pptxOk && hasPptx, quizOk && hasQuiz, practiceOk && hasPractice].filter(Boolean).length

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => navigate('/student/learn')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-5 transition"
      >
        <ArrowLeft size={16} /> Học tập
      </button>

      {/* Header */}
      <h1 className="text-xl font-bold text-gray-800 mb-1">{lesson.title}</h1>
      {lesson.description && <p className="text-gray-500 text-sm mb-4">{lesson.description}</p>}

      {/* Progress bar */}
      {totalSteps > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Tiến độ: {doneSteps}/{totalSteps} bước hoàn thành</span>
            {doneSteps === totalSteps && (
              <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">Hoàn thành ✓</span>
            )}
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
            <div
              className="bg-indigo-500 h-2 rounded-full transition-all"
              style={{ width: totalSteps > 0 ? `${(doneSteps / totalSteps) * 100}%` : '0%' }}
            />
          </div>
          <div className="flex gap-4 flex-wrap">
            {hasVideo && (
              <div className={`flex items-center gap-1.5 text-xs font-medium ${videoOk ? 'text-green-600' : 'text-gray-400'}`}>
                <PlayCircle size={13} />
                <span>Video {videoOk ? '✓' : '○'}</span>
              </div>
            )}
            {hasPptx && (
              <div className={`flex items-center gap-1.5 text-xs font-medium ${pptxOk ? 'text-green-600' : 'text-gray-400'}`}>
                <FileText size={13} />
                <span>Bài giảng {pptxOk ? '✓' : '○'}</span>
              </div>
            )}
            {hasQuiz && (
              <div className={`flex items-center gap-1.5 text-xs font-medium ${quizOk ? 'text-green-600' : 'text-gray-400'}`}>
                <BookOpen size={13} />
                <span>Bài tập {quizOk ? '✓' : '○'}</span>
              </div>
            )}
            {hasPractice && (
              <div className={`flex items-center gap-1.5 text-xs font-medium ${practiceOk ? 'text-green-600' : 'text-gray-400'}`}>
                <Upload size={13} />
                <span>Thực hành {practiceOk ? '✓' : `${submittedCount}/${practiceTasks.length}`}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Section - Video */}
        {hasVideo && (
          <section className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
              <PlayCircle size={16} className="text-blue-500" />
              <h2 className="font-semibold text-gray-800 text-sm">Video bài giảng</h2>
            </div>
            <div className="p-4">
              {embedUrl ? (
                <div className="w-full aspect-video rounded-lg overflow-hidden bg-black mb-3">
                  <iframe
                    src={embedUrl}
                    title="Lesson video"
                    className="w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="mb-3">
                  <a href={lesson.video_url} target="_blank" rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline text-sm">{lesson.video_url}</a>
                </div>
              )}
              {progress?.video_watched ? (
                <span className="inline-flex items-center gap-1.5 text-sm text-green-600 font-medium bg-green-50 px-3 py-1.5 rounded-lg">
                  <CheckCircle size={15} /> Đã xem ✓
                </span>
              ) : (
                <button
                  onClick={handleMarkVideoWatched}
                  disabled={videoMarking}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
                >
                  {videoMarking ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={15} />}
                  Đánh dấu đã xem video
                </button>
              )}
            </div>
          </section>
        )}

        {/* Section - PPTX bài giảng */}
        {hasPptx && (
          <section className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
              <FileText size={16} className="text-orange-500" />
              <h2 className="font-semibold text-gray-800 text-sm">Bài giảng (PowerPoint)</h2>
            </div>
            <div className="p-4">
              <div className="w-full rounded-lg overflow-hidden border border-gray-200 mb-3" style={{ aspectRatio: '16/9' }}>
                <iframe
                  src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(lesson.pptx_url)}`}
                  width="100%" height="100%" frameBorder="0"
                  title="Bài giảng PPTX" className="w-full h-full block"
                  allowFullScreen
                />
              </div>
              {pptxOk ? (
                <span className="inline-flex items-center gap-1.5 text-sm text-green-600 font-medium bg-green-50 px-3 py-1.5 rounded-lg">
                  <CheckCircle size={15} /> Đã xem ✓
                </span>
              ) : (
                <button
                  onClick={handleMarkPptxViewed}
                  disabled={pptxMarking}
                  className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
                >
                  {pptxMarking ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={15} />}
                  Đánh dấu đã xem bài giảng
                </button>
              )}
            </div>
          </section>
        )}

        {/* Section - Quiz */}
        {hasQuiz && (
          <section className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
              <BookOpen size={16} className="text-indigo-500" />
              <h2 className="font-semibold text-gray-800 text-sm">Bài tập</h2>
              <span className="ml-auto text-xs text-gray-400">{questions.length} câu</span>
            </div>
            <div className="p-4">
              {quizOk && !quizActive ? (
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <span className="inline-flex items-center gap-1.5 text-sm text-green-600 font-medium bg-green-50 px-3 py-1.5 rounded-lg">
                    <CheckCircle size={15} /> Đạt ✓
                  </span>
                  <span className="text-sm text-gray-500">
                    {progress?.quiz_correct ?? 0}/{progress?.quiz_total ?? questions.length} câu đúng
                  </span>
                  <button
                    onClick={() => setQuizActive(true)}
                    className="text-xs text-indigo-600 hover:underline"
                  >
                    Làm lại
                  </button>
                </div>
              ) : !quizActive ? (
                <button
                  onClick={() => setQuizActive(true)}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                >
                  <BookOpen size={15} /> Bắt đầu làm bài
                </button>
              ) : (
                <LessonQuiz
                  questions={questions}
                  onSubmit={({ correct, total, passed }) => {
                    handleQuizSubmit({ correct, total, passed })
                    if (passed) setQuizActive(false)
                  }}
                />
              )}
            </div>
          </section>
        )}

        {/* Section - Practice submission */}
        {hasPractice && (
          <section className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
              <Upload size={16} className="text-orange-500" />
              <h2 className="font-semibold text-gray-800 text-sm">Nộp bài thực hành</h2>
              <span className="ml-auto text-xs text-gray-400">{submittedCount}/{practiceTasks.length} bài đã nộp</span>
            </div>
            <div className="p-4 space-y-4">
              {practiceTasks.map((task, i) => {
                const sub = taskSubmissions[i]
                const file = taskFiles[i]
                const note = taskNotes[i] || ''
                const isSubmitting = taskSubmitting === i
                return (
                  <div key={i} className={`rounded-xl border p-4 space-y-3 ${
                    resubmitTask === i ? 'border-orange-200 bg-orange-50/30'
                    : sub ? 'border-green-200 bg-green-50/40'
                    : 'border-gray-200'
                  }`}>
                    {/* Task header */}
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-700 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                      <span className="text-sm font-semibold text-gray-700">Bài {i + 1}</span>
                      {sub && resubmitTask !== i && <CheckCircle size={14} className="text-green-500 ml-auto" />}
                    </div>

                    {/* Instructions */}
                    {task.instructions && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <p className="text-xs font-semibold text-amber-700 mb-1">Đề bài:</p>
                        <p className="text-sm text-gray-800 whitespace-pre-wrap">{task.instructions}</p>
                      </div>
                    )}

                    {sub && resubmitTask !== i ? (
                      /* ── Đã nộp ── */
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                            <CheckCircle size={12} /> Đã nộp · {new Date(sub.submitted_at).toLocaleString('vi-VN')}
                          </span>
                          {sub.score != null && (
                            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">Điểm: {sub.score}</span>
                          )}
                          {!sub.reviewed_at && (
                            <button
                              onClick={() => {
                                const nn = [...taskNotes]; nn[i] = sub.text_content || ''; setTaskNotes(nn)
                                setResubmitTask(i)
                              }}
                              className="ml-auto text-xs text-orange-600 hover:text-orange-800 font-medium hover:underline"
                            >
                              Nộp lại
                            </button>
                          )}
                        </div>
                        {sub.file_url && <SubmittedFile url={sub.file_url} />}
                        {sub.text_content && (
                          <div className="bg-white rounded-lg border p-2 text-xs text-gray-600 whitespace-pre-wrap">{sub.text_content}</div>
                        )}
                        {sub.teacher_comment ? (
                          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                            <p className="text-xs font-semibold text-indigo-600 mb-1">Nhận xét của giáo viên:</p>
                            <p className="text-sm text-gray-800">{sub.teacher_comment}</p>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 italic">Giáo viên chưa nhận xét</p>
                        )}
                      </div>
                    ) : (
                      /* ── Form nộp / nộp lại ── */
                      <div className="space-y-3">
                        {resubmitTask === i && (
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-orange-600 font-medium">Nộp lại · file cũ sẽ được thay thế</p>
                            <button
                              onClick={() => {
                                setResubmitTask(null)
                                const nf = [...taskFiles]; nf[i] = null; setTaskFiles(nf)
                                const nn = [...taskNotes]; nn[i] = ''; setTaskNotes(nn)
                              }}
                              className="text-xs text-gray-400 hover:text-gray-600"
                            >
                              Hủy
                            </button>
                          </div>
                        )}
                        <label className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl px-4 py-5 cursor-pointer transition
                          ${file ? 'border-orange-400 bg-orange-50' : 'border-gray-300 hover:border-orange-400 hover:bg-orange-50'}`}>
                          {file ? (
                            <>
                              <FileIcon url={file.name} size={26} />
                              <span className="text-sm font-medium text-gray-800 text-center break-all max-w-xs">{file.name}</span>
                              <span className="text-xs text-gray-400">{(file.size / 1024).toFixed(0)} KB · Bấm để đổi</span>
                            </>
                          ) : (
                            <>
                              <Upload size={22} className="text-gray-300" />
                              <span className="text-sm text-gray-500">
                                {resubmitTask === i ? 'Chọn file mới (bỏ trống để giữ file cũ)' : 'Bấm để chọn file'}
                              </span>
                              <span className="text-xs text-gray-400">.pptx · .docx · .sb3 · .py · .txt</span>
                            </>
                          )}
                          <input type="file" className="hidden" accept=".pptx,.docx,.sb3,.py,.txt"
                            onChange={e => {
                              if (!e.target.files?.[0]) return
                              const next = [...taskFiles]; next[i] = e.target.files[0]; setTaskFiles(next)
                            }} />
                        </label>
                        <textarea
                          value={note}
                          onChange={e => { const next = [...taskNotes]; next[i] = e.target.value; setTaskNotes(next) }}
                          rows={2}
                          placeholder="Ghi chú thêm (tuỳ chọn)..."
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                        />
                        <button
                          onClick={() => resubmitTask === i ? handleTaskResubmit(i) : handleTaskSubmit(i)}
                          disabled={isSubmitting || (resubmitTask !== i && !file && !note.trim())}
                          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
                        >
                          {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                          {isSubmitting ? 'Đang nộp...' : resubmitTask === i ? `Cập nhật bài ${i + 1}` : `Nộp bài ${i + 1}`}
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
