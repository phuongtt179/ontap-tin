import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { CheckCircle, XCircle, Clock, ChevronRight, RotateCcw, ArrowUp, ArrowDown, Paperclip } from 'lucide-react'
import { normalizeAnswer } from '../../utils/normalizeAnswer'
import toast from 'react-hot-toast'
import QuestionText from '../ui/QuestionText'
import { CodeBlock, CodeBlockWithBlanks } from '../ui/CodeBlock'

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

function normalizeOptions(options) {
  if (!Array.isArray(options)) return []
  return options.map((opt, i) => {
    const fallbackKey = String.fromCharCode(65 + i)
    if (typeof opt === 'string') return { key: fallbackKey, text: opt, image_url: '' }
    if (!opt || typeof opt !== 'object') return { key: fallbackKey, text: String(opt ?? ''), image_url: '' }
    if (opt.key !== undefined && opt.text !== undefined) return opt
    const keys = Object.keys(opt)
    if (keys.length >= 1 && keys[0].length === 1) return { key: keys[0], text: opt[keys[0]], image_url: opt.image_url || '' }
    return { key: fallbackKey, text: opt.text || opt.value || opt.label || '', image_url: opt.image_url || '' }
  })
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Câu tự luận — học sinh gõ bài và/hoặc nộp file
function EssayQuestion({ q, value, onChange, disabled }) {
  const allowFile = q.options?.[0]?.allow_file
  const [uploading, setUploading] = useState(false)
  const text = value?.text || ''
  const fileUrl = value?.file_url || ''
  const fileName = value?.file_name || ''

  async function handleFileUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 20 * 1024 * 1024) { toast.error('File tối đa 20MB'); return }
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('upload_preset', UPLOAD_PRESET)
    const isImage = file.type.startsWith('image/')
    const endpoint = isImage
      ? `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`
      : `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/raw/upload`
    try {
      const res = await fetch(endpoint, { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok || json.error) { toast.error('Upload thất bại'); return }
      onChange({ text, file_url: json.secure_url, file_name: file.name })
    } catch { toast.error('Upload thất bại') }
    finally { setUploading(false) }
  }

  return (
    <div className="space-y-3">
      <textarea
        value={text}
        onChange={e => onChange({ file_url: fileUrl, file_name: fileName, text: e.target.value })}
        disabled={disabled}
        rows={7}
        placeholder="Nhập bài làm của bạn tại đây..."
        className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-indigo-500 resize-none disabled:bg-gray-50"
      />
      {allowFile && (
        fileUrl ? (
          <div className="flex items-center gap-2 text-sm text-indigo-700 bg-indigo-50 px-3 py-2 rounded-lg border border-indigo-200">
            <Paperclip size={14} className="shrink-0" />
            <span className="flex-1 truncate">{fileName || 'File đã nộp'}</span>
            {!disabled && (
              <button onClick={() => onChange({ text, file_url: '', file_name: '' })}
                className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
            )}
          </div>
        ) : (
          <label className={`flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl border-2 border-dashed cursor-pointer transition w-full
            ${uploading || disabled ? 'opacity-50 cursor-not-allowed border-gray-200 text-gray-400'
            : 'border-gray-300 hover:border-indigo-400 text-gray-500 hover:text-indigo-600'}`}>
            <Paperclip size={14} />
            {uploading ? 'Đang tải lên...' : 'Đính kèm file (PDF, Word, ảnh...)'}
            <input type="file" className="hidden" disabled={uploading || disabled}
              accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
              onChange={handleFileUpload} />
          </label>
        )
      )}
      <p className="text-xs text-gray-400">Câu tự luận — giáo viên sẽ chấm điểm sau khi nộp bài.</p>
    </div>
  )
}

export default function QuizSession({
  questions, mode, timeLimit, onFinish,
  examMode = false, examId = null, attemptNumber = 1,
  showAnswer = true, showScore = true, tnMaxScore = 10,
}) {
  const { user } = useAuth()
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState({})
  const [selected, setSelected] = useState(null)
  const [confirmed, setConfirmed] = useState(false)
  const [confirmedSet, setConfirmedSet] = useState(new Set())
  const [showResult, setShowResult] = useState(false)
  const [timeLeft, setTimeLeft] = useState(timeLimit ? timeLimit * 60 : null)

  // practice mode = phải xác nhận từng câu trước khi qua câu tiếp
  const practiceMode = !examMode && showAnswer

  useEffect(() => {
    if (timeLeft === null) return
    if (timeLeft <= 0) { handleFinish(); return }
    const t = setTimeout(() => setTimeLeft(tl => tl - 1), 1000)
    return () => clearTimeout(t)
  }, [timeLeft])

  const q = questions[current]
  const isLastQuestion = current === questions.length - 1

  function handleSelect(answer) {
    if (confirmed && showAnswer) return
    setSelected(answer)
    if (!showAnswer) {
      setAnswers(prev => ({ ...prev, [current]: answer }))
    }
  }

  function handleEssayChange(value) {
    setAnswers(prev => ({ ...prev, [current]: value }))
  }

  function handleConfirm() {
    if (!selected || !showAnswer) return
    setAnswers(prev => ({ ...prev, [current]: selected }))
    setConfirmed(true)
    setConfirmedSet(prev => new Set([...prev, current]))
  }

  function handleNext() {
    if (isLastQuestion) {
      handleFinish()
    } else {
      // essay trong practice mode: tự thêm vào confirmedSet khi bấm next
      if (q.type === 'essay' && practiceMode) {
        setConfirmedSet(prev => new Set([...prev, current]))
      }
      const nextIndex = current + 1
      setCurrent(nextIndex)
      setSelected(answers[nextIndex] || null)
      setConfirmed(false)
    }
  }

  function jumpTo(index) {
    // practice mode: chỉ cho nhảy về câu đã làm
    if (practiceMode && !confirmedSet.has(index) && index !== current) return
    if (selected && !confirmed) {
      setAnswers(prev => ({ ...prev, [current]: selected }))
    }
    setCurrent(index)
    setSelected(answers[index] || null)
    setConfirmed(confirmedSet.has(index))
  }

  async function handleFinish() {
    const finalAnswers = { ...answers }
    if (selected && !confirmed) finalAnswers[current] = selected

    // Essay không tính tự động — chỉ tính câu tự chấm
    let correct = 0
    const autoQuestions = questions.filter(q => q.type !== 'essay')
    questions.forEach((q, i) => {
      if (q.type === 'essay') return
      if (normalizeAnswer(q.type, finalAnswers[i], q.correct_answer)) correct++
    })
    const score = autoQuestions.length > 0
      ? Math.round((correct / autoQuestions.length) * tnMaxScore * 10) / 10
      : 0

    try {
      if (examMode && examId) {
        await supabase.from('exam_sessions').insert({
          exam_id: examId,
          user_id: user.id,
          total: questions.length,
          correct,
          score,
          answers: finalAnswers,
          attempt_number: attemptNumber,
          submitted_at: new Date().toISOString(),
        })
      } else {
        await supabase.from('quiz_sessions').insert({
          user_id: user.id,
          mode,
          total: questions.length,
          correct,
          score,
          answers: finalAnswers,
          question_ids: questions.map(q => q.id),
        })
      }
    } catch {}

    setAnswers(finalAnswers)
    setShowResult(true)
  }

  if (showResult) {
    return (
      <QuizResult
        questions={questions}
        answers={answers}
        onRetry={onFinish}
        examMode={examMode}
        showScore={showScore}
        tnMaxScore={tnMaxScore}
      />
    )
  }

  const isCorrect = q.type !== 'essay' && confirmed && normalizeAnswer(q.type, selected, q.correct_answer)

  function isAnsweredAt(i) {
    const a = answers[i]
    if (a == null) return !!(showAnswer && i === current && selected)
    if (typeof a === 'object') return !!(a.text?.trim() || a.file_url)
    return true
  }
  const answeredCount = questions.filter((_, i) => isAnsweredAt(i)).length

  const autoIndices = questions.map((_, i) => questions[i].type !== 'essay' ? i : null).filter(i => i !== null)
  const essayIndices = questions.map((_, i) => questions[i].type === 'essay' ? i : null).filter(i => i !== null)
  const hasEssay = essayIndices.length > 0

  function renderNavBtn(i) {
    const isCurrent = i === current
    const isDone = confirmedSet.has(i)
    const isLocked = practiceMode && !isDone && !isCurrent

    let cls = 'w-8 h-8 rounded-full text-xs font-semibold flex items-center justify-center border-2 transition '
    if (isCurrent) {
      cls += 'bg-indigo-600 border-indigo-600 text-white shadow-md scale-110 cursor-pointer'
    } else if (isLocked) {
      cls += 'bg-gray-100 border-gray-200 text-gray-300 cursor-not-allowed'
    } else if (isDone) {
      const ans = answers[i]
      const q_i = questions[i]
      const ok = q_i.type === 'essay' || normalizeAnswer(q_i.type, ans, q_i.correct_answer)
      cls += ok
        ? 'bg-green-100 border-green-400 text-green-700 cursor-pointer'
        : 'bg-red-100 border-red-300 text-red-600 cursor-pointer'
    } else {
      cls += 'bg-white border-gray-300 text-gray-500 hover:border-indigo-400 cursor-pointer'
    }
    return <button key={i} onClick={() => jumpTo(i)} className={cls}>{i + 1}</button>
  }

  return (
    <div className="flex min-h-screen justify-center">
      <div className="flex flex-col md:flex-row w-full">

        {/* Phần chính: câu hỏi + đáp án */}
        <div className="flex-1 p-4 md:p-8 bg-gray-50 overflow-y-auto">
          <div className="flex items-start justify-between mb-4 max-w-3xl mx-auto gap-4">
            <span className="text-sm text-gray-500 pt-1">
              Câu <span className="font-bold text-gray-800">{current + 1}</span> / {questions.length}
            </span>
            {timeLeft !== null && (
              <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border-2 shadow-sm
                ${timeLeft < 60 ? 'border-red-400 bg-red-50 text-red-600' : 'border-indigo-200 bg-white text-indigo-700'}`}>
                <Clock size={18} />
                <span className="text-2xl font-bold tabular-nums">
                  {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                </span>
              </div>
            )}
          </div>

          <div className="h-1.5 bg-gray-200 rounded-full mb-7 max-w-3xl mx-auto">
            <div
              className="h-1.5 bg-indigo-600 rounded-full transition-all"
              style={{ width: `${(answeredCount / questions.length) * 100}%` }}
            />
          </div>

          {/* Nội dung câu hỏi */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4 max-w-3xl mx-auto">
            {q.audio_url && (
              <div className="mb-4">
                <audio controls className="w-full rounded-xl" src={q.audio_url}>
                  Trình duyệt không hỗ trợ phát âm thanh
                </audio>
              </div>
            )}
            {q.image_url && (
              <img src={q.image_url} alt="" className="rounded-lg mb-4 max-h-48 w-auto" />
            )}
            {q.type !== 'drag_word' && q.type !== 'fill_blank' && (
              <QuestionText text={q.question} className="text-gray-800 font-medium text-base leading-relaxed" />
            )}
          </div>

          {/* Khu vực đáp án */}
          <div className="space-y-2.5 mb-6 max-w-3xl mx-auto">
            {q.type === 'multiple_choice' && normalizeOptions(q.options).map((opt, idx) => (
              <OptionButton
                key={opt.key}
                label={String.fromCharCode(65 + idx)}
                text={opt.text}
                imageUrl={opt.image_url}
                selected={selected === opt.key}
                confirmed={confirmed && showAnswer}
                correct={opt.key === q.correct_answer}
                onClick={() => handleSelect(opt.key)}
              />
            ))}

            {q.type === 'true_false' && ['Đúng', 'Sai'].map(val => (
              <OptionButton
                key={val}
                label={val === 'Đúng' ? '✓' : '✗'}
                text={val}
                selected={selected === val}
                confirmed={confirmed && showAnswer}
                correct={val === q.correct_answer}
                onClick={() => handleSelect(val)}
              />
            ))}

            {q.type === 'fill_blank' && (
              <FillBlankQuestion
                key={current}
                q={q}
                value={selected}
                onChange={handleSelect}
                disabled={confirmed && showAnswer}
                showResult={confirmed && showAnswer}
              />
            )}

            {q.type === 'matching' && (
              <MatchingQuestion
                key={current}
                q={q}
                value={selected}
                onChange={handleSelect}
                disabled={confirmed && showAnswer}
              />
            )}

            {q.type === 'ordering' && (
              <OrderingQuestion
                key={current}
                q={q}
                value={selected}
                onChange={handleSelect}
                disabled={confirmed && showAnswer}
              />
            )}

            {q.type === 'drag_word' && (
              <DragWordQuestion
                key={current}
                q={q}
                value={selected}
                onChange={handleSelect}
                disabled={confirmed && showAnswer}
              />
            )}

            {q.type === 'word_order' && (
              <WordOrderQuestion
                key={current}
                q={q}
                value={selected}
                onChange={handleSelect}
                disabled={confirmed && showAnswer}
              />
            )}

            {q.type === 'essay' && (
              <EssayQuestion
                key={current}
                q={q}
                value={answers[current]}
                onChange={handleEssayChange}
                disabled={false}
              />
            )}
          </div>

          {/* Phản hồi đúng/sai */}
          {confirmed && showAnswer && q.type !== 'essay' && (
            <div className={`flex items-center gap-2 px-4 py-3 rounded-xl mb-2 text-sm font-medium max-w-3xl mx-auto
              ${isCorrect ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {isCorrect
                ? <><CheckCircle size={18} /> Chính xác!</>
                : <><XCircle size={18} /> Sai rồi! Đáp án đúng: <strong>{q.correct_answer}</strong></>
              }
            </div>
          )}

          {/* Gợi ý khi sai */}
          {confirmed && showAnswer && !isCorrect && q.hint && q.type !== 'essay' && (
            <div className="flex items-start gap-2 px-4 py-3 rounded-xl mb-4 text-sm max-w-3xl mx-auto bg-amber-50 border border-amber-200 text-amber-800">
              <span className="text-base shrink-0">💡</span>
              <span><strong>Gợi ý:</strong> {q.hint}</span>
            </div>
          )}

          {/* Nút hành động */}
          <div className="max-w-3xl mx-auto">
            {q.type === 'essay' ? (
              <button
                onClick={handleNext}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2"
              >
                {isLastQuestion ? 'Nộp bài' : <><span>Câu tiếp theo</span><ChevronRight size={18} /></>}
              </button>
            ) : !showAnswer ? (
              <button
                onClick={handleNext}
                disabled={!selected}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLastQuestion ? 'Xem kết quả' : <><span>Câu tiếp theo</span><ChevronRight size={18} /></>}
              </button>
            ) : !confirmed ? (
              <button
                onClick={handleConfirm}
                disabled={!selected}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
              >
                Xác nhận
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2"
              >
                {isLastQuestion ? 'Xem kết quả' : 'Câu tiếp theo'} <ChevronRight size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Panel điều hướng bên phải */}
        <div className="md:w-60 shrink-0 bg-white border-t md:border-t-0 md:border-l border-gray-200 p-4 overflow-y-auto">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Danh sách câu
          </div>

          {hasEssay ? (
            <div className="mb-4 space-y-3">
              {autoIndices.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 mb-1.5">Tự chấm ({autoIndices.length})</p>
                  <div className="grid gap-2.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(2rem, 1fr))' }}>
                    {autoIndices.map(i => renderNavBtn(i))}
                  </div>
                </div>
              )}
              {essayIndices.length > 0 && (
                <div>
                  <p className="text-xs text-amber-500 mb-1.5">Tự luận ({essayIndices.length})</p>
                  <div className="grid gap-2.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(2rem, 1fr))' }}>
                    {essayIndices.map(i => renderNavBtn(i))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="grid gap-2.5 mb-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(2rem, 1fr))' }}>
              {questions.map((_, i) => renderNavBtn(i))}
            </div>
          )}

          <div className="space-y-2 text-xs text-gray-500 border-t border-gray-100 pt-4">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-600 inline-block shrink-0" />
              Câu đang làm
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-red-100 border-2 border-red-300 inline-block shrink-0" />
              Đã trả lời
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-white border-2 border-gray-300 inline-block shrink-0" />
              Chưa làm
            </div>
          </div>

          <div className="mt-4 text-xs text-gray-400 border-t border-gray-100 pt-4">
            Đã làm: <span className="font-semibold text-indigo-600">{answeredCount}</span> / {questions.length}
          </div>

          <button
            onClick={() => {
              const unanswered = questions.length - Object.keys(answers).length
              const msg = unanswered > 0
                ? `Còn ${unanswered} câu chưa trả lời. Bạn có chắc muốn nộp bài không?`
                : 'Bạn có chắc muốn nộp bài không?'
              if (window.confirm(msg)) handleFinish()
            }}
            className="mt-5 w-full text-xs bg-red-50 hover:bg-red-100 text-red-600 font-medium py-2 rounded-lg transition border border-red-200"
          >
            Nộp bài
          </button>
        </div>
      </div>
    </div>
  )
}

function OptionButton({ label, text, imageUrl, selected, confirmed, correct, onClick }) {
  let cls = 'flex items-center gap-3 w-full px-4 py-3 rounded-xl border-2 text-left text-sm font-medium transition '
  if (confirmed && correct) cls += 'bg-green-50 border-green-500 text-green-800'
  else if (confirmed && selected && !correct) cls += 'bg-red-50 border-red-400 text-red-700'
  else if (selected) cls += 'border-indigo-500 bg-indigo-50 text-indigo-800'
  else cls += 'border-gray-200 bg-white text-gray-700 hover:border-indigo-400 hover:bg-indigo-50'

  return (
    <button onClick={onClick} disabled={confirmed} className={cls}>
      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0
        ${confirmed && correct ? 'bg-green-500 text-white'
          : confirmed && selected ? 'bg-red-400 text-white'
          : selected ? 'bg-indigo-600 text-white'
          : 'bg-gray-100 text-gray-500'}`}>
        {label}
      </span>
      <span className="flex-1">
        {text}
        {imageUrl && <img src={imageUrl} alt="" className="mt-1 rounded max-h-20 w-auto" />}
      </span>
    </button>
  )
}

const PAIR_COLORS = [
  { cls: 'border-blue-400 bg-blue-50 text-blue-800',   label: 'text-blue-600' },
  { cls: 'border-purple-400 bg-purple-50 text-purple-800', label: 'text-purple-600' },
  { cls: 'border-amber-400 bg-amber-50 text-amber-800',  label: 'text-amber-600' },
  { cls: 'border-rose-400 bg-rose-50 text-rose-800',    label: 'text-rose-600' },
  { cls: 'border-teal-400 bg-teal-50 text-teal-800',   label: 'text-teal-600' },
]

function FillBlankQuestion({ q, value, onChange, disabled, showResult }) {
  const correctAnswers = useMemo(() => (q.correct_answer || '').split(',').map(s => s.trim()), [q.id])

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

  const blankCount = useMemo(() =>
    tokens.filter(t => t.type === 'blank').length +
    tokens.filter(t => t.type === 'code-with-blanks').reduce((a, t) => a + t.segs.length - 1, 0),
  [tokens])

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

function MatchingQuestion({ q, value, onChange, disabled }) {
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

  const correctPairs = new Set((q.correct_answer || '').split(',').map(p => p.trim()))

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4">
      <p className="text-xs text-gray-400 mb-3">Kéo cột phải để sắp xếp tương ứng với cột trái</p>
      <div className="flex gap-3 items-start">
        <div className="flex-1 space-y-2">
          {(q.options || []).map(opt => (
            <div key={opt.key} className="px-3 py-2 rounded-lg border-2 border-gray-200 bg-gray-50 text-sm text-gray-800 min-h-[42px] flex items-center">
              {opt.image_url && <img src={opt.image_url} alt="" className="h-12 w-auto mb-1 rounded" />}
              <span className="font-bold mr-1">{opt.key}.</span>{opt.text}
            </div>
          ))}
        </div>

        <div className="flex flex-col text-gray-300 text-lg select-none">
          {(q.options || []).map((_, i) => (
            <div key={i} className="min-h-[42px] mb-2 flex items-center">→</div>
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
                className={`px-3 py-2 rounded-lg border-2 text-sm min-h-[42px] flex items-center gap-2 transition
                  ${disabled
                    ? isCorrect ? 'border-green-400 bg-green-50 text-green-800'
                    : isWrong ? 'border-red-300 bg-red-50 text-red-800'
                    : 'border-gray-200 bg-gray-50'
                    : dragIdx === i ? 'border-indigo-400 bg-indigo-50 opacity-50'
                    : overIdx === i ? 'border-indigo-400 border-dashed bg-indigo-50/40'
                    : 'border-gray-200 bg-white text-gray-700 cursor-grab hover:border-indigo-300'
                  }`}
              >
                {!disabled && <span className="text-gray-300 shrink-0 select-none">⠿</span>}
                {opt.image_url && <img src={opt.image_url} alt="" className="h-12 w-auto rounded" />}
                {opt.text}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function OrderingQuestion({ q, value, onChange, disabled }) {
  const [items, setItems] = useState(() => {
    if (value) {
      const keyOrder = value.split(',')
      return keyOrder.map(k => q.options?.find(o => o.key === k)).filter(Boolean)
    }
    return shuffle(q.options || [])
  })

  function move(index, dir) {
    if (disabled) return
    const newItems = [...items]
    const target = index + dir
    if (target < 0 || target >= newItems.length) return;
    [newItems[index], newItems[target]] = [newItems[target], newItems[index]]
    setItems(newItems)
    onChange(newItems.map(o => o.key).join(','))
  }

  useEffect(() => {
    if (!value) onChange(items.map(o => o.key).join(','))
  }, [])

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4">
      <p className="text-xs text-gray-400 mb-3">Sắp xếp theo thứ tự đúng bằng cách bấm ↑ ↓</p>
      <div className="space-y-2">
        {items.map((opt, i) => (
          <div key={opt.key} className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0">
              {i + 1}
            </span>
            <span className="flex-1 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-800">
              {opt.text}
            </span>
            {!disabled && (
              <div className="flex flex-col gap-0.5">
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

// Kéo thả từ vào chỗ trống — hỗ trợ cả click lẫn drag-and-drop
function DragWordQuestion({ q, value, onChange, disabled }) {
  // Tokenize question thành text / blank / code / code-with-blanks
  const tokens = useMemo(() => {
    const result = []
    let blankIdx = 0
    const codeBlockRe = /```(\w*)\n?([\s\S]*?)```/g
    let last = 0, m

    function pushText(txt) {
      const segs = txt.split('___')
      segs.forEach((seg, i) => {
        if (seg) result.push({ type: 'text', content: seg })
        if (i < segs.length - 1) result.push({ type: 'blank', index: blankIdx++ })
      })
    }

    while ((m = codeBlockRe.exec(q.question)) !== null) {
      if (m.index > last) pushText(q.question.slice(last, m.index))
      const codeContent = m[2].replace(/\n$/, '')
      if (codeContent.includes('___')) {
        const segs = codeContent.split('___')
        result.push({ type: 'code-with-blanks', lang: m[1] || '', segs, startIdx: blankIdx })
        blankIdx += segs.length - 1
      } else {
        result.push({ type: 'code', lang: m[1] || '', content: codeContent })
      }
      last = m.index + m[0].length
    }
    if (last < q.question.length) pushText(q.question.slice(last))
    return result
  }, [q.id, q.question])

  const blankCount = tokens.filter(t => t.type === 'blank' || t.type === 'code-with-blanks').reduce(
    (acc, t) => acc + (t.type === 'blank' ? 1 : t.segs.length - 1), 0
  )
  const wordBank = useMemo(() => shuffle(q.options || []), [q.id])

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

// Sắp xếp từ thành câu hoàn chỉnh
function WordOrderQuestion({ q, value, onChange, disabled }) {
  // Fallback: nếu options rỗng nhưng correct_answer có, tự tách thành từ
  const resolvedOptions = useMemo(() => {
    const opts = normalizeOptions(q.options)
    if (opts.length > 0) return opts
    if (q.correct_answer) {
      const words = q.correct_answer.trim().split(/\s+/).filter(Boolean)
      return words.map((text, i) => ({ key: String.fromCharCode(65 + i), text }))
    }
    return []
  }, [q.id])
  const wordBank = useMemo(() => shuffle(resolvedOptions), [q.id])
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

function QuizResult({ questions, answers, onRetry, examMode = false, showScore = true, tnMaxScore = 10 }) {
  let correct = 0
  const autoQs = questions.filter(q => q.type !== 'essay')
  const essayQs = questions.filter(q => q.type === 'essay')
  const hasEssay = essayQs.length > 0
  questions.forEach((q, i) => {
    if (q.type === 'essay') return
    if (normalizeAnswer(q.type, answers[i], q.correct_answer)) correct++
  })
  const score = autoQs.length > 0 ? Math.round((correct / autoQs.length) * tnMaxScore * 10) / 10 : 0
  const percent = autoQs.length > 0 ? Math.round((correct / autoQs.length) * 100) : 0

  if (!showScore) {
    return (
      <div className="p-4 md:p-8 max-w-md mx-auto text-center">
        <div className="bg-white rounded-2xl border border-gray-200 p-10 mb-6">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Đã nộp bài thành công!</h2>
          <p className="text-gray-500 text-sm">Giáo viên sẽ thông báo kết quả sau.</p>
        </div>
        <button
          onClick={onRetry}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition"
        >
          <RotateCcw size={18} /> Quay lại danh sách đề
        </button>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center mb-6">
        <div className={`text-6xl font-bold mb-2 ${percent >= 70 ? 'text-green-600' : 'text-orange-500'}`}>
          {score}
        </div>
        <div className="text-gray-500 mb-1">
          {hasEssay ? `điểm trắc nghiệm / ${tnMaxScore}` : 'điểm'}
        </div>
        <div className="text-lg font-semibold text-gray-800 mt-3">
          {correct} / {autoQs.length} câu {hasEssay ? 'trắc nghiệm' : ''} đúng
        </div>
        {hasEssay && (
          <div className="mt-2 text-sm text-amber-600 bg-amber-50 rounded-lg px-4 py-2 inline-block">
            ⏳ {essayQs.length} câu tự luận — giáo viên sẽ chấm và cộng điểm sau
          </div>
        )}
        {!hasEssay && (
          <div className={`text-sm mt-2 ${percent >= 70 ? 'text-green-600' : 'text-orange-500'}`}>
            {percent >= 90 ? 'Xuất sắc!' : percent >= 70 ? 'Tốt lắm!' : percent >= 50 ? 'Cố gắng thêm nhé!' : 'Cần ôn luyện thêm!'}
          </div>
        )}
      </div>

      <div className="space-y-3 mb-6">
        {questions.map((q, i) => {
          const ans = answers[i]
          const isEssay = q.type === 'essay'
          const isOk = normalizeAnswer(q.type, ans, q.correct_answer)
          const ansText = typeof ans === 'object' ? (ans?.text || '') : (ans || '')
          return (
            <div key={i} className={`rounded-xl border p-4 text-sm ${
              isEssay ? 'border-amber-200 bg-amber-50'
              : isOk ? 'border-green-200 bg-green-50'
              : 'border-red-200 bg-red-50'
            }`}>
              <div className="flex items-start gap-2">
                {isEssay
                  ? <span className="text-amber-500 mt-0.5 shrink-0 text-base">📝</span>
                  : isOk
                    ? <CheckCircle size={16} className="text-green-600 mt-0.5 shrink-0" />
                    : <XCircle size={16} className="text-red-500 mt-0.5 shrink-0" />}
                <div>
                  <QuestionText text={q.question} className="font-medium text-gray-800" />
                  {isEssay ? (
                    <p className="text-amber-600 mt-1 text-xs">⏳ Giáo viên sẽ chấm điểm sau</p>
                  ) : !isOk && (
                    <p className="text-red-600 mt-1">
                      Bạn chọn: <strong>{ansText || '(chưa trả lời)'}</strong> — Đáp án đúng: <strong>{q.correct_answer}</strong>
                    </p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <button
        onClick={onRetry}
        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition"
      >
        <RotateCcw size={18} /> {examMode ? 'Quay lại danh sách đề' : 'Làm bài khác'}
      </button>
    </div>
  )
}
