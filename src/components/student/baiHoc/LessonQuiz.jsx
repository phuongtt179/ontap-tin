// Quiz trong bài học: từng câu một — đúng sang câu tiếp, sai làm lại câu đó + hiện gợi ý.
import { useState } from 'react'
import { STUDENT_AI_DIRECT } from '../../../lib/aiMode'
import { dungDapAn } from '../../../domain/dapAn'
import { CheckCircle } from 'lucide-react'
import QuestionText from '../../ui/QuestionText'
import { DragWordInput, MatchingInput, FillBlankInput, OrderingInput, WordOrderInput } from './OTraLoi'
import { datQuiz } from '../../../domain/tienDoBaiHoc'

// tự luận không chấm tự động → coi như đúng để học sinh đi tiếp
const checkAnswer = (type, ans, correct) => type === 'essay' || dungDapAn(type, ans, correct)

/* ── LessonQuiz ────────────────────────────────────────────── */
export function LessonQuiz({ questions, onSubmit, initialCurrent = 0, initialCorrectCount = 0, onProgress, onAskTutor }) {
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
      const passed = datQuiz(newCorrect, total)
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
    const passed = datQuiz(correctCount, total)
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
        <div className="flex flex-col gap-2">
          <button onClick={handleRetry}
            className="w-full bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl text-sm font-medium transition">
            Thử lại
          </button>
          <button onClick={handleNext}
            className="w-full border border-gray-300 text-gray-500 hover:bg-gray-50 py-2.5 rounded-xl text-sm font-medium transition">
            Bỏ qua câu này →
          </button>
        </div>
      )}

      {/* Hỏi trợ giảng về câu này */}
      {onAskTutor && (
        <button onClick={() => onAskTutor({
          questionId: q.id,
          questionText: q.question,
          options: q.type === 'multiple_choice'
            ? opts.map((o, oi) => `${String.fromCharCode(65 + oi)}. ${optText(o)}`)
            : q.type === 'true_false' ? ['Đúng', 'Sai'] : undefined,
          studentAnswer: answer || undefined,
          correctAnswer: q.correct_answer || undefined,
          hint: q.hint || undefined,
        })}
          className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-violet-600 bg-violet-50 hover:bg-violet-100 border border-violet-200 py-2 rounded-xl transition">
          🙋 Chưa hiểu? {STUDENT_AI_DIRECT ? 'Hỏi trợ giảng' : 'Hỏi thầy cô'}
        </button>
      )}
    </div>
  )
}
