// Engine làm bài của học sinh: luyện tập (xác nhận từng câu, sai hiện gợi ý, không nhảy câu tương lai)
// và đề thi (làm tự do, nộp 1 lần, khoá rời trang). Ô trả lời / bảng câu / kết quả ở components/student/quiz/.
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useExamGuard } from '../../context/ExamGuardContext'
import { CheckCircle, XCircle, Clock, ChevronRight } from 'lucide-react'
import { dungDapAn, diemTuDong } from '../../domain/dapAn'
import QuestionText from '../ui/QuestionText'
import { nopBaiThi, luuLuotLuyenTap } from '../../data/baiLam'
import OTraLoiQuiz from './quiz/OTraLoiQuiz'
import BangCauHoi from './quiz/BangCauHoi'
import QuizResult from './quiz/KetQuaQuiz'

export default function QuizSession({
  questions, mode, timeLimit, onFinish,
  examMode = false, examId = null, sessionId = null,
  showAnswer = true, showScore = true, tnMaxScore = 10,
  preview = false,
}) {
  const { user } = useAuth()
  const { startExamGuard, endExamGuard } = useExamGuard()
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState({})
  const [selected, setSelected] = useState(null)
  const [confirmed, setConfirmed] = useState(false)
  const [confirmedSet, setConfirmedSet] = useState(new Set())
  const [skippedSet, setSkippedSet] = useState(new Set())
  const [showResult, setShowResult] = useState(false)
  const [timeLeft, setTimeLeft] = useState(timeLimit ? timeLimit * 60 : null)

  // practice mode = phải xác nhận từng câu trước khi qua câu tiếp
  const practiceMode = !examMode && showAnswer

  // Khoá học sinh không cho rời trang khi đang làm đề thi (xem ExamGuardContext.jsx) — nếu cố
  // rời đi (đổi trang/đăng xuất/đổi khoá qua Layout.jsx), bắt buộc nộp bài với đáp án hiện có
  // trước. Dùng ref để guard luôn gọi đúng handleFinish MỚI NHẤT (đóng đúng answers/selected
  // hiện tại) thay vì bản closure cũ lúc mount.
  const handleFinishRef = useRef(null)
  handleFinishRef.current = handleFinish
  const submittedRef = useRef(false)
  useEffect(() => {
    if (!examMode || preview) return
    startExamGuard(() => handleFinishRef.current())
    return () => endExamGuard()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examMode, preview])

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

  function handleSkip() {
    // Đánh dấu đã "xử lý" câu này (unlock nav) nhưng không lưu đáp án
    setConfirmedSet(prev => new Set([...prev, current]))
    setSkippedSet(prev => new Set([...prev, current]))
    if (isLastQuestion) {
      handleFinish()
    } else {
      const nextIndex = current + 1
      setCurrent(nextIndex)
      setSelected(answers[nextIndex] || null)
      setConfirmed(confirmedSet.has(nextIndex))
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
    // Chặn gọi 2 lần chồng nhau — giờ handleFinish có 3 đường gọi độc lập (bấm Nộp bài, hết
    // giờ, hoặc bị ép nộp lúc cố rời trang) nên có thể trùng thời điểm.
    if (submittedRef.current) return
    submittedRef.current = true
    const finalAnswers = { ...answers }
    if (selected && !confirmed) finalAnswers[current] = selected

    // Essay không tính tự động — chỉ tính câu tự chấm
    const { soDung: correct, diem: score } = diemTuDong(questions, finalAnswers, tnMaxScore)

    try {
      if (!preview) {
        if (examMode && examId && sessionId) {
          // Cập nhật dòng đã ghi sẵn lúc bắt đầu làm (không insert dòng mới) — xem
          // migration_exam_session_start.sql.
          await nopBaiThi(sessionId, { correct, score, answers: finalAnswers })
        } else {
          await luuLuotLuyenTap({ userId: user.id, mode, questions, correct, score, answers: finalAnswers })
        }
      }
    } catch { /* lưu lỗi: vẫn hiện kết quả cho em (không mất bài đang làm trên màn hình) */ }

    setAnswers(finalAnswers)
    setShowResult(true)
    endExamGuard()
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

  const isCorrect = q.type !== 'essay' && confirmed && dungDapAn(q.type, selected, q.correct_answer)

  function isAnsweredAt(i) {
    const a = answers[i]
    if (a == null) return !!(showAnswer && i === current && selected)
    if (typeof a === 'object') return !!(a.text?.trim() || a.file_url)
    return true
  }
  const answeredCount = questions.filter((_, i) => isAnsweredAt(i)).length


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
          <OTraLoiQuiz q={q} current={current} selected={selected} confirmed={confirmed} showAnswer={showAnswer}
            answers={answers} onSelect={handleSelect} onEssayChange={handleEssayChange} />

          {/* Phản hồi đúng/sai */}
          {confirmed && showAnswer && q.type !== 'essay' && (
            <div className={`flex items-center gap-2 px-4 py-3 rounded-xl mb-2 text-sm font-medium max-w-3xl mx-auto
              ${isCorrect ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {isCorrect
                ? <><CheckCircle size={18} /> Chính xác!</>
                : <><XCircle size={18} /> Sai rồi!</>
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
          <div className="max-w-3xl mx-auto space-y-2">
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
              <>
                <button
                  onClick={handleConfirm}
                  disabled={!selected}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
                >
                  Xác nhận
                </button>
                {practiceMode && (
                  <button
                    onClick={handleSkip}
                    className="w-full border border-gray-300 text-gray-500 hover:bg-gray-50 font-medium py-2.5 rounded-xl transition text-sm flex items-center justify-center gap-1.5"
                  >
                    Bỏ qua câu này <ChevronRight size={15} />
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={handleNext}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2"
                >
                  {isLastQuestion ? 'Xem kết quả' : 'Câu tiếp theo'} <ChevronRight size={18} />
                </button>
                {practiceMode && !isCorrect && (
                  <button
                    onClick={handleSkip}
                    className="w-full border border-orange-300 text-orange-600 hover:bg-orange-50 font-medium py-2.5 rounded-xl transition text-sm flex items-center justify-center gap-1.5"
                  >
                    Bỏ qua câu này <ChevronRight size={15} />
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        <BangCauHoi questions={questions} answers={answers} current={current} confirmedSet={confirmedSet}
          skippedSet={skippedSet} practiceMode={practiceMode} answeredCount={answeredCount}
          onChon={jumpTo} onNop={handleFinish} />
      </div>
    </div>
  )
}
