// Màn kết quả sau khi nộp quiz / đề thi: điểm phần tự chấm + từng câu đúng / sai (tự luận: chờ giáo viên chấm).
import { CheckCircle, XCircle, RotateCcw } from 'lucide-react'
import QuestionText from '../../ui/QuestionText'
import { dungDapAn, diemTuDong } from '../../../domain/dapAn'

export default function QuizResult({ questions, answers, onRetry, examMode = false, showScore = true, tnMaxScore = 10 }) {
  const essayQs = questions.filter(q => q.type === 'essay')
  const hasEssay = essayQs.length > 0
  const { soDung: correct, soCau: soCauTuCham, diem: score, phanTram: percent } = diemTuDong(questions, answers, tnMaxScore)

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
          {correct} / {soCauTuCham} câu {hasEssay ? 'trắc nghiệm' : ''} đúng
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
          const isOk = dungDapAn(q.type, ans, q.correct_answer)
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
