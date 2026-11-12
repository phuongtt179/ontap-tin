// Khu trả lời của 1 câu trong QuizSession — chọn đúng ô theo loại câu (8 loại).
// Chỉ hiển thị; chọn / gõ gì báo lên QuizSession qua onSelect (tự luận: onEssayChange).
import MatchingLines from '../../ui/MatchingLines'
import { chuanHoaLuaChon } from '../../../domain/dinhDangCauHoi'
import OptionButton from './NutLuaChon'
import FillBlankQuestion from './CauDienTu'
import OrderingQuestion from './CauSapXep'
import DragWordQuestion from './CauKeoTha'
import WordOrderQuestion from './CauGhepCau'
import EssayQuestion from './CauTuLuan'

export default function OTraLoiQuiz({ q, current, selected, confirmed, showAnswer, answers, onSelect, onEssayChange }) {
  return (
    <div className="space-y-2.5 mb-6 max-w-3xl mx-auto">
      {q.type === 'multiple_choice' && chuanHoaLuaChon(q.options).map((opt, idx) => (
        <OptionButton
          key={opt.key}
          label={String.fromCharCode(65 + idx)}
          text={opt.text}
          imageUrl={opt.image_url}
          selected={selected === opt.key}
          confirmed={confirmed && showAnswer}
          correct={opt.key === q.correct_answer}
          onClick={() => onSelect(opt.key)}
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
          onClick={() => onSelect(val)}
        />
      ))}

      {q.type === 'fill_blank' && (
        <FillBlankQuestion
          key={current}
          q={q}
          value={selected}
          onChange={onSelect}
          disabled={confirmed && showAnswer}
          showResult={confirmed && showAnswer}
        />
      )}

      {q.type === 'matching' && (
        // Nối bằng đường thẳng (bấm trái → bấm phải), chạy được trên màn hình cảm ứng
        <MatchingLines
          key={current}
          q={q}
          value={selected}
          onChange={onSelect}
          disabled={confirmed && showAnswer}
          showResult={confirmed && showAnswer}
        />
      )}

      {q.type === 'ordering' && (
        <OrderingQuestion
          key={current}
          q={q}
          value={selected}
          onChange={onSelect}
          disabled={confirmed && showAnswer}
        />
      )}

      {q.type === 'drag_word' && (
        <DragWordQuestion
          key={current}
          q={q}
          value={selected}
          onChange={onSelect}
          disabled={confirmed && showAnswer}
        />
      )}

      {q.type === 'word_order' && (
        <WordOrderQuestion
          key={current}
          q={q}
          value={selected}
          onChange={onSelect}
          disabled={confirmed && showAnswer}
        />
      )}

      {q.type === 'essay' && (
        <EssayQuestion
          key={current}
          q={q}
          value={answers[current]}
          onChange={onEssayChange}
          disabled={false}
        />
      )}
    </div>
  )
}
