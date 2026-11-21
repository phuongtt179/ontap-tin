// Bảng danh sách câu bên phải QuizSession: nút từng câu (đang làm / đúng / sai / bỏ qua / khoá), chú thích, nút Nộp bài.
// Chế độ luyện tập: chỉ nhảy về câu đã làm. Chỉ hiển thị — bấm câu báo lên qua onChon, nộp qua onNop.
import { dungDapAn } from '../../../domain/dapAn'

export default function BangCauHoi({ questions, answers, current, confirmedSet, skippedSet, practiceMode, answeredCount, onChon, onNop }) {
function renderNavBtn(i) {
  const isCurrent = i === current
  const isDone = confirmedSet.has(i)
  const isSkipped = skippedSet.has(i)
  const isLocked = practiceMode && !isDone && !isCurrent

  let cls = 'w-8 h-8 rounded-full text-xs font-semibold flex items-center justify-center border-2 transition '
  if (isCurrent) {
    cls += 'bg-indigo-600 border-indigo-600 text-white shadow-md scale-110 cursor-pointer'
  } else if (isLocked) {
    cls += 'bg-gray-100 border-gray-200 text-gray-300 cursor-not-allowed'
  } else if (isSkipped) {
    cls += 'bg-orange-100 border-orange-300 text-orange-600 cursor-pointer'
  } else if (isDone) {
    const ans = answers[i]
    const q_i = questions[i]
    const ok = q_i.type === 'essay' || dungDapAn(q_i.type, ans, q_i.correct_answer)
    cls += ok
      ? 'bg-green-100 border-green-400 text-green-700 cursor-pointer'
      : 'bg-red-100 border-red-300 text-red-600 cursor-pointer'
  } else {
    cls += 'bg-white border-gray-300 text-gray-500 hover:border-indigo-400 cursor-pointer'
  }
  return <button key={i} onClick={() => onChon(i)} className={cls}>{i + 1}</button>
}

  const autoIndices = questions.map((_, i) => questions[i].type !== 'essay' ? i : null).filter(i => i !== null)
  const essayIndices = questions.map((_, i) => questions[i].type === 'essay' ? i : null).filter(i => i !== null)
  const hasEssay = essayIndices.length > 0

  return (
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
          if (window.confirm(msg)) onNop()
        }}
        className="mt-5 w-full text-xs bg-red-50 hover:bg-red-100 text-red-600 font-medium py-2 rounded-lg transition border border-red-200"
      >
        Nộp bài
      </button>
    </div>
  )
}
