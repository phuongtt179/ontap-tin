import { useState, useEffect, useMemo, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { ArrowLeft, ArrowUp, ArrowDown, CheckCircle, PlayCircle, BookOpen, Upload, Loader2, Send, FileText, FileImage, File, Code, Lock } from 'lucide-react'
import { uploadFile } from '../../lib/cloudinary'
import QuestionText from '../../components/ui/QuestionText'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { CodeBlock, CodeBlockWithBlanks } from '../../components/ui/CodeBlock'
import StickerModal from '../../components/student/StickerModal'

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
function LessonQuiz({ questions, onSubmit, initialCurrent = 0, initialCorrectCount = 0, onProgress }) {
  const [current, setCurrent] = useState(initialCurrent)
  const [answer, setAnswer] = useState(null)
  const [confirmed, setConfirmed] = useState(false)
  const [correctCount, setCorrectCount] = useState(initialCorrectCount)
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
      const newIdx = current + 1
      setCorrectCount(newCorrect)
      setCurrent(newIdx)
      setAnswer(null)
      setConfirmed(false)
      onProgress?.(newIdx, newCorrect)
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
    onProgress?.(0, 0)
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
              : <><span>✗</span> Sai rồi!</>
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

/* ── Helper UI components ──────────────────────────────────── */
function DoneChip({ label }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-green-700 font-semibold bg-green-100 px-4 py-2 rounded-xl">
      <CheckCircle size={16} /> {label}
    </span>
  )
}

function ActionButton({ onClick, disabled, loading, color = 'indigo', children }) {
  const colors = {
    indigo: 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200',
    blue:   'bg-blue-500 hover:bg-blue-600 shadow-blue-200',
    orange: 'bg-orange-500 hover:bg-orange-600 shadow-orange-200',
    emerald:'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200',
  }
  return (
    <button onClick={onClick} disabled={disabled}
      className={`flex items-center gap-2 ${colors[color]} text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100`}>
      {loading && <Loader2 size={15} className="animate-spin" />}
      {children}
    </button>
  )
}

function SectionCard({ icon, iconBg, iconColor, title, badge, done, locked, lockMessage, children }) {
  return (
    <section className={`relative bg-white rounded-2xl shadow-sm border overflow-hidden transition-all duration-300
      ${done ? 'border-green-200' : locked ? 'border-gray-100' : 'border-indigo-100 shadow-indigo-50'}`}>
      {/* Header */}
      <div className={`flex items-center gap-3 px-5 py-4 border-b
        ${done ? 'border-green-100 bg-green-50/50' : locked ? 'border-gray-100 bg-gray-50/50' : 'border-indigo-50 bg-indigo-50/30'}`}>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${done ? 'bg-green-100' : locked ? 'bg-gray-100' : iconBg}`}>
          <span className={done ? 'text-green-600' : locked ? 'text-gray-300' : iconColor}>{icon}</span>
        </div>
        <h2 className={`font-bold text-sm flex-1 ${locked ? 'text-gray-400' : 'text-gray-800'}`}>{title}</h2>
        {badge && !done && !locked && (
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full font-medium">{badge}</span>
        )}
        {done && <CheckCircle size={18} className="text-green-500 shrink-0" />}
        {locked && <Lock size={16} className="text-gray-300 shrink-0" />}
      </div>
      {/* Body */}
      {locked ? (
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
            <Lock size={24} className="text-gray-300" />
          </div>
          <p className="text-sm text-gray-400 font-medium">{lockMessage}</p>
        </div>
      ) : (
        <div className="p-5">{children}</div>
      )}
    </section>
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
  const [activeTaskIdx, setActiveTaskIdx] = useState(null)     // task popup index
  const [loading, setLoading] = useState(true)
  const [quizActive, setQuizActive] = useState(false)
  const [quizInitIdx, setQuizInitIdx] = useState(0)
  const [quizInitCorrect, setQuizInitCorrect] = useState(0)
  const [videoMarking, setVideoMarking] = useState(false)
  const [stickerModal, setStickerModal] = useState(null) // { stickerCount, stickerTotal, threshold, reason }
  const wasCompleted = useRef(false)
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
    wasCompleted.current = !!progData?.completed // đánh dấu để không hiện modal lại

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

  async function awardSticker(count = 1, reason) {
    const { data: prof } = await supabase
      .from('profiles').select('sticker_count, sticker_total').eq('id', user.id).single()
    const threshold = 50
    const currentCount = (prof?.sticker_count ?? 0) + count
    const totalCount = (prof?.sticker_total ?? 0) + count
    await supabase.from('profiles').update({
      sticker_count: currentCount,
      sticker_total: totalCount,
    }).eq('id', user.id)
    setStickerModal({ stickerCount: currentCount, stickerTotal: totalCount, threshold, reason, count })
  }

  async function upsertProgress(updates) {
    const current = progress || {}
    const newData = { ...current, ...updates, user_id: user.id, lesson_id: id }
    const completed = calcCompleted(newData, lesson)
    const { data, error } = await supabase.from('lesson_progress').upsert(
      { ...newData, completed, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,lesson_id' }
    ).select().single()
    if (!error && data) {
      setProgress(data)
      if (completed) wasCompleted.current = true
    }
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

  function startQuiz(fromScratch = false) {
    if (!fromScratch && progress?.quiz_current_idx > 0 && !progress?.quiz_passed) {
      setQuizInitIdx(progress.quiz_current_idx)
      setQuizInitCorrect(progress.quiz_correct || 0)
    } else {
      setQuizInitIdx(0)
      setQuizInitCorrect(0)
      if (fromScratch) upsertProgress({ quiz_current_idx: 0, quiz_correct: 0 })
    }
    setQuizActive(true)
  }

  async function handleQuizSubmit({ correct, total, passed }) {
    const wasAlreadyPassed = progress?.quiz_passed
    await upsertProgress({ quiz_correct: correct, quiz_total: total, quiz_passed: passed, quiz_current_idx: 0 })
    if (passed && !wasAlreadyPassed) {
      const pct = total > 0 ? correct / total : 0
      const count = pct >= 1 ? 5 : pct >= 0.9 ? 4 : pct >= 0.85 ? 3 : pct >= 0.75 ? 2 : 1
      await awardSticker(count, `Vượt qua bài kiểm tra! (${correct}/${total} câu đúng) 🎯`)
    } else if (passed) {
      toast.success('Chúc mừng! Bạn đã đạt bài tập')
    } else {
      toast('Chưa đạt, hãy thử lại nhé!', { icon: '📖' })
    }
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
      await awardSticker(1, `Nộp xong bài thực hành ${taskIdx + 1}! 📝`)
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

  // Lock states theo thứ tự: video → pptx → quiz → practice
  const pptxLocked = hasVideo && !videoOk
  const quizLocked = (hasVideo && !videoOk) || (hasPptx && !pptxOk)
  const practiceLocked = (hasVideo && !videoOk) || (hasPptx && !pptxOk) || (hasQuiz && !quizOk)

  const steps = [
    hasVideo && { key: 'video', label: 'Video', icon: <PlayCircle size={16} />, done: videoOk, locked: false },
    hasPptx && { key: 'pptx', label: 'Bài giảng', icon: <FileText size={16} />, done: pptxOk, locked: pptxLocked },
    hasQuiz && { key: 'quiz', label: 'Bài tập', icon: <BookOpen size={16} />, done: quizOk, locked: quizLocked },
    hasPractice && { key: 'practice', label: 'Thực hành', icon: <Upload size={16} />, done: practiceOk, locked: practiceLocked },
  ].filter(Boolean)

  return (
    <div className="min-h-full bg-gray-50 flex flex-col">
      {/* Sticker modal */}
      {stickerModal && (
        <StickerModal
          stickerCount={stickerModal.stickerCount}
          stickerTotal={stickerModal.stickerTotal}
          threshold={stickerModal.threshold}
          reason={stickerModal.reason}
          count={stickerModal.count}
          onClose={() => setStickerModal(null)}
        />
      )}

      {/* ── Hero gradient ── */}
      <div className="bg-gradient-to-r from-[#003d8f] via-[#0055bb] to-[#0077dd] text-white px-5 pt-5 pb-4 md:px-8 shrink-0">
        <div className="max-w-3xl mx-auto">
          <button onClick={() => navigate('/student/learn')}
            className="flex items-center gap-1.5 text-white/60 hover:text-white text-sm mb-4 transition">
            <ArrowLeft size={15} /> Bài học
          </button>
          <h1 className="text-xl md:text-2xl font-bold leading-tight">{lesson.title}</h1>
          {lesson.description && <p className="text-blue-200 text-sm mt-1">{lesson.description}</p>}

          {/* Stepper */}
          {steps.length > 0 && (
            <div className="flex items-center mt-6 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              {steps.map((step, i) => (
                <div key={step.key} className="flex items-center flex-1 min-w-0">
                  <div className="flex flex-col items-center shrink-0">
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center border-2 transition-all duration-300
                      ${step.done
                        ? 'bg-green-400 border-green-300 shadow-lg shadow-green-500/40'
                        : !step.locked
                        ? 'bg-white border-white shadow-lg'
                        : 'bg-white/10 border-white/20'}`}
                      style={!step.done && !step.locked ? { animation: 'node-breathe 2s ease-in-out infinite' } : {}}>
                      {step.done
                        ? <CheckCircle size={20} className="text-white" />
                        : step.locked
                        ? <Lock size={15} className="text-white/30" />
                        : <span className="text-indigo-700">{step.icon}</span>}
                    </div>
                    <span className={`text-[10px] font-semibold mt-1.5 whitespace-nowrap
                      ${step.done ? 'text-green-300' : !step.locked ? 'text-white' : 'text-white/30'}`}>
                      {step.label}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 mb-4 rounded-full min-w-[16px] transition-all duration-500
                      ${step.done ? 'bg-green-400/70' : 'bg-white/20'}`} />
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
            <span className="text-blue-200 text-xs font-medium">
              {doneSteps === totalSteps && totalSteps > 0
                ? '🎉 Hoàn thành bài học!'
                : `Bước ${Math.min(doneSteps + 1, totalSteps)}/${totalSteps}`}
            </span>
            {doneSteps === totalSteps && totalSteps > 0 && (
              <span className="text-xs bg-green-400/20 text-green-300 font-semibold px-3 py-1 rounded-full">✓ Xong</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Content sections ── */}
      <div className="flex-1 max-w-3xl w-full mx-auto px-4 md:px-8 py-6 space-y-4">

        {/* Video */}
        {hasVideo && (
          <SectionCard icon={<PlayCircle size={18} />} iconBg="bg-blue-100" iconColor="text-blue-600"
            title="Video bài giảng" done={videoOk} locked={false} lockMessage="">
            {embedUrl ? (
              <div className="w-full aspect-video rounded-xl overflow-hidden bg-black mb-4">
                <iframe src={embedUrl} title="Lesson video" className="w-full h-full"
                  frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
              </div>
            ) : (
              <div className="mb-4">
                <a href={lesson.video_url} target="_blank" rel="noopener noreferrer"
                  className="text-indigo-600 hover:underline text-sm">{lesson.video_url}</a>
              </div>
            )}
            {videoOk
              ? <DoneChip label="Đã xem video" />
              : <ActionButton onClick={handleMarkVideoWatched} disabled={videoMarking} loading={videoMarking} color="blue">
                  Đánh dấu đã xem video
                </ActionButton>}
          </SectionCard>
        )}

        {/* PPTX */}
        {hasPptx && (
          <SectionCard icon={<FileText size={18} />} iconBg="bg-orange-100" iconColor="text-orange-600"
            title="Bài giảng (PowerPoint)" done={pptxOk} locked={pptxLocked}
            lockMessage="Xem video trước để mở khóa">
            <div className="w-full rounded-xl overflow-hidden border border-gray-200 mb-4" style={{ aspectRatio: '16/9' }}>
              <iframe src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(lesson.pptx_url)}`}
                width="100%" height="100%" frameBorder="0" title="Bài giảng PPTX" className="w-full h-full block" allowFullScreen />
            </div>
            {pptxOk
              ? <DoneChip label="Đã xem bài giảng" />
              : <ActionButton onClick={handleMarkPptxViewed} disabled={pptxMarking} loading={pptxMarking} color="orange">
                  Đánh dấu đã xem bài giảng
                </ActionButton>}
          </SectionCard>
        )}

        {/* Quiz */}
        {hasQuiz && (
          <SectionCard icon={<BookOpen size={18} />} iconBg="bg-indigo-100" iconColor="text-indigo-600"
            title="Bài tập" badge={`${questions.length} câu`}
            done={quizOk && !quizActive} locked={quizLocked}
            lockMessage={hasPptx ? 'Xem bài giảng trước để mở khóa' : 'Xem video trước để mở khóa'}>
            {quizOk && !quizActive ? (
              <div className="flex items-center gap-4 flex-wrap">
                <DoneChip label={`Đạt · ${progress?.quiz_correct ?? 0}/${progress?.quiz_total ?? questions.length} câu đúng`} />
                <button onClick={() => setQuizActive(true)} className="text-xs text-indigo-600 hover:underline font-medium">Làm lại</button>
              </div>
            ) : !quizActive ? (
              (() => {
                const hasResume = progress?.quiz_current_idx > 0 && !progress?.quiz_passed
                return hasResume ? (
                  <div className="flex flex-col gap-3">
                    <ActionButton onClick={() => startQuiz(false)} color="indigo">
                      Tiếp tục từ câu {progress.quiz_current_idx + 1}/{questions.length}
                    </ActionButton>
                    <button onClick={() => startQuiz(true)} className="text-xs text-gray-400 hover:text-gray-600 underline text-left">
                      Làm lại từ đầu
                    </button>
                  </div>
                ) : (
                  <ActionButton onClick={() => startQuiz()} color="indigo">Bắt đầu làm bài</ActionButton>
                )
              })()
            ) : (
              <LessonQuiz
                questions={questions}
                initialCurrent={quizInitIdx}
                initialCorrectCount={quizInitCorrect}
                onProgress={(idx, correct) => upsertProgress({ quiz_current_idx: idx, quiz_correct: correct })}
                onSubmit={({ correct, total, passed }) => {
                  handleQuizSubmit({ correct, total, passed })
                  if (passed) setQuizActive(false)
                }}
              />
            )}
          </SectionCard>
        )}

        {/* Practice */}
        {hasPractice && (
          <SectionCard icon={<Upload size={18} />} iconBg="bg-emerald-100" iconColor="text-emerald-600"
            title="Bài thực hành" badge={`${submittedCount}/${practiceTasks.length} đã nộp`}
            done={practiceOk} locked={practiceLocked}
            lockMessage={hasQuiz ? 'Hoàn thành bài tập trước để mở khóa'
              : hasPptx ? 'Xem bài giảng trước để mở khóa'
              : 'Xem video trước để mở khóa'}>
            <div className="space-y-4">
              {/* ── Task grid ── */}
              {(() => {
                const palette = [
                  { from: '#6366f1', to: '#8b5cf6' },
                  { from: '#0ea5e9', to: '#06b6d4' },
                  { from: '#f97316', to: '#f59e0b' },
                  { from: '#10b981', to: '#14b8a6' },
                  { from: '#ec4899', to: '#f43f5e' },
                ]
                return (
                  <>
                    {/* ── Horizontal node map ── */}
                    <div className="overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                      <div className="flex items-end justify-center gap-0 min-w-full w-max py-4 px-2">
                        {practiceTasks.map((task, i) => {
                          const sub = taskSubmissions[i]
                          const p = palette[i % palette.length]
                          const hasScore = sub?.score != null
                          const hasComment = !!sub?.teacher_comment
                          const nodeIcons = ['⚡','🎯','🔥','⭐','🚀']
                          return (
                            <div key={i} className="flex items-center">
                              {/* Node column */}
                              <div className="flex flex-col items-center gap-2" style={{ minWidth: 88 }}>
                                {/* Badge above node */}
                                <div className={`text-[10px] font-black px-3 py-1 rounded-full flex items-center gap-1 shadow-sm whitespace-nowrap
                                  ${sub
                                    ? hasScore ? 'bg-indigo-600 text-white' : 'bg-green-500 text-white'
                                    : 'bg-orange-500 text-white'}`}
                                  style={!sub ? { animation: 'indicator-bounce 1.4s ease-in-out infinite' } : {}}>
                                  {sub
                                    ? (hasScore ? `⭐ ${sub.score} điểm` : '✅ Đã nộp')
                                    : '▶ Làm bài!'}
                                </div>

                                {/* Circle node button */}
                                <button onClick={() => setActiveTaskIdx(i)}
                                  className="relative w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl shadow-lg transition-all hover:scale-110 active:scale-95 overflow-hidden"
                                  style={{
                                    background: sub
                                      ? 'linear-gradient(135deg, #16a34a, #059669)'
                                      : `linear-gradient(135deg, ${p.from}, ${p.to})`,
                                    animation: !sub ? 'node-breathe 2s ease-in-out infinite' : undefined,
                                  }}>
                                  {!sub && (
                                    <div className="absolute inset-0 pointer-events-none"
                                      style={{ background: 'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.42) 50%, transparent 65%)',
                                        animation: 'node-shimmer 2.4s ease-in-out infinite' }} />
                                  )}
                                  {sub ? '✓' : nodeIcons[i % nodeIcons.length]}
                                </button>

                                {/* Label below */}
                                <span className="text-xs font-bold text-gray-600 text-center leading-tight">
                                  Bài {i + 1}
                                </span>
                                {hasComment && (
                                  <span className="text-[9px] text-indigo-500 font-bold">💬 Có nhận xét</span>
                                )}
                              </div>

                              {/* Connector line */}
                              {i < practiceTasks.length - 1 && (
                                <div className="h-1 rounded-full shrink-0 mb-8" style={{
                                  width: 28,
                                  background: sub ? 'linear-gradient(90deg, #4ade80, #86efac)' : '#e5e7eb'
                                }} />
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* ── Task popup modal ── */}
                    {activeTaskIdx !== null && (() => {
                      const i = activeTaskIdx
                      const task = practiceTasks[i]
                      const sub = taskSubmissions[i]
                      const file = taskFiles[i]
                      const note = taskNotes[i] || ''
                      const isSubmitting = taskSubmitting === i
                      const isResubmitting = resubmitTask === i
                      const p = palette[i % palette.length]
                      const lightBg = ['#f5f3ff','#f0f9ff','#fff7ed','#f0fdf4','#fdf2f8'][i % 5]
                      const borderCol = ['#c4b5fd','#7dd3fc','#fdba74','#6ee7b7','#f9a8d4'][i % 5]
                      const textCol = ['#7c3aed','#0369a1','#c2410c','#047857','#be185d'][i % 5]

                      function closeModal() {
                        setActiveTaskIdx(null)
                        if (resubmitTask === i) {
                          setResubmitTask(null)
                          const nf = [...taskFiles]; nf[i] = null; setTaskFiles(nf)
                          const nn = [...taskNotes]; nn[i] = ''; setTaskNotes(nn)
                        }
                      }

                      return (
                        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
                          onClick={closeModal}>
                          {/* Backdrop */}
                          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

                          {/* Sheet */}
                          <div className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
                            onClick={e => e.stopPropagation()}>

                            {/* Header */}
                            <div className="px-5 py-4 flex items-center gap-3 shrink-0"
                              style={{ background: sub
                                ? 'linear-gradient(135deg, #d1fae5, #bbf7d0)'
                                : `linear-gradient(135deg, ${p.from}28, ${p.to}14)` }}>
                              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-md shrink-0"
                                style={{ background: sub
                                  ? 'linear-gradient(135deg, #16a34a, #059669)'
                                  : `linear-gradient(135deg, ${p.from}, ${p.to})` }}>
                                {sub ? '✓' : i + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-black text-gray-800 text-base">Bài thực hành {i + 1}</p>
                                <p className="text-xs font-medium mt-0.5 text-gray-500">
                                  {sub ? `✅ Đã nộp · ${new Date(sub.submitted_at).toLocaleDateString('vi-VN')}` : '📤 Chưa nộp'}
                                </p>
                              </div>
                              {sub?.score != null && (
                                <div className="text-center bg-white/70 rounded-xl px-3 py-1.5 shrink-0">
                                  <div className="text-2xl font-black" style={{ color: p.from }}>{sub.score}</div>
                                  <div className="text-[10px] text-gray-500 font-semibold">ĐIỂM</div>
                                </div>
                              )}
                              <button onClick={closeModal}
                                className="w-8 h-8 rounded-full bg-white/60 hover:bg-white flex items-center justify-center text-gray-500 transition shrink-0">
                                ✕
                              </button>
                            </div>

                            {/* Scrollable body */}
                            <div className="overflow-y-auto flex-1 p-5 space-y-4">
                              {/* Instructions */}
                              {task.instructions && (
                                <div className="rounded-2xl p-4 border" style={{ background: lightBg, borderColor: borderCol }}>
                                  <div className="flex items-center gap-1.5 font-bold text-xs mb-2" style={{ color: textCol }}>
                                    📋 Đề bài
                                  </div>
                                  <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{task.instructions}</p>
                                </div>
                              )}

                              {/* Submitted view */}
                              {sub && !isResubmitting ? (
                                <div className="space-y-3">
                                  {sub.file_url && <SubmittedFile url={sub.file_url} />}
                                  {sub.text_content && (
                                    <div className="bg-gray-50 rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-600 whitespace-pre-wrap">
                                      {sub.text_content}
                                    </div>
                                  )}
                                  {sub.teacher_comment ? (
                                    <div className="rounded-xl p-4 border border-indigo-200 bg-indigo-50">
                                      <div className="text-indigo-700 font-bold text-xs mb-1.5">💬 Nhận xét của giáo viên</div>
                                      <p className="text-sm text-gray-800 leading-relaxed">{sub.teacher_comment}</p>
                                    </div>
                                  ) : (
                                    <p className="text-xs text-gray-400 italic text-center py-2">⏳ Chờ giáo viên nhận xét...</p>
                                  )}
                                  {!sub.reviewed_at && (
                                    <button onClick={() => {
                                      const nn = [...taskNotes]; nn[i] = sub.text_content || ''; setTaskNotes(nn)
                                      setResubmitTask(i)
                                    }} className="w-full py-2.5 rounded-xl border-2 border-orange-300 text-orange-600 font-bold text-sm hover:bg-orange-50 transition">
                                      🔄 Nộp lại bài này
                                    </button>
                                  )}
                                </div>
                              ) : (
                                /* Upload form */
                                <div className="space-y-3">
                                  {isResubmitting && (
                                    <div className="flex items-center justify-between bg-orange-50 border border-orange-200 rounded-xl px-3 py-2">
                                      <span className="text-xs text-orange-700 font-semibold">🔄 File cũ sẽ được thay thế</span>
                                      <button onClick={() => {
                                        setResubmitTask(null)
                                        const nf = [...taskFiles]; nf[i] = null; setTaskFiles(nf)
                                        const nn = [...taskNotes]; nn[i] = ''; setTaskNotes(nn)
                                      }} className="text-xs text-gray-400 hover:text-gray-600">Hủy</button>
                                    </div>
                                  )}
                                  <label className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl px-4 py-8 cursor-pointer transition-all
                                    ${file ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'}`}>
                                    {file ? (
                                      <>
                                        <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center shadow-sm">
                                          <FileIcon url={file.name} size={28} />
                                        </div>
                                        <div className="text-center">
                                          <p className="text-sm font-bold text-gray-800 break-all max-w-xs">{file.name}</p>
                                          <p className="text-xs text-gray-400 mt-1">{(file.size / 1024).toFixed(0)} KB · Bấm để đổi</p>
                                        </div>
                                      </>
                                    ) : (
                                      <>
                                        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
                                          <Upload size={30} className="text-gray-300" />
                                        </div>
                                        <div className="text-center">
                                          <p className="text-sm font-bold text-gray-500">
                                            {isResubmitting ? 'Chọn file mới' : 'Bấm để chọn file nộp bài'}
                                          </p>
                                          <p className="text-xs text-gray-400 mt-1">.pptx · .docx · .sb3 · .py · .txt</p>
                                        </div>
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
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none bg-gray-50"
                                  />
                                  <button
                                    onClick={() => isResubmitting ? handleTaskResubmit(i) : handleTaskSubmit(i)}
                                    disabled={isSubmitting || (!isResubmitting && !file && !note.trim())}
                                    className="w-full flex items-center justify-center gap-2 text-white py-3.5 rounded-2xl text-sm font-black shadow-lg transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100"
                                    style={{ background: isSubmitting ? '#9ca3af' : isResubmitting
                                      ? 'linear-gradient(135deg, #f97316, #f59e0b)'
                                      : `linear-gradient(135deg, ${p.from}, ${p.to})` }}>
                                    {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                                    {isSubmitting ? 'Đang nộp...' : isResubmitting ? `Cập nhật bài ${i + 1}` : `Nộp bài ${i + 1} 🚀`}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })()}
                  </>
                )
              })()}
            </div>
          </SectionCard>
        )}
      </div>
    </div>
  )
}
