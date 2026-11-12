// Dựng thử (không cần trình duyệt) QuizSession và các phần trong components/student/quiz/ ở nhiều trạng thái:
// thiếu import / sai tên prop / truy cập thuộc tính của null lộ ra ở đây thay vì học sinh gặp trắng trang giữa giờ thi.
import { describe, it, expect, vi } from 'vitest'
import { renderToString } from 'react-dom/server'

vi.mock('../../../lib/supabase', () => ({ supabase: { from: () => { throw new Error('không gọi DB khi dựng thử') } } }))
vi.mock('../../../context/AuthContext', () => ({ useAuth: () => ({ user: { id: 'hs1' } }) }))
vi.mock('../../../context/ExamGuardContext', () => ({ useExamGuard: () => ({ startExamGuard: () => {}, endExamGuard: () => {} }) }))

import QuizSession from '../QuizSession'
import OTraLoiQuiz from './OTraLoiQuiz'
import BangCauHoi from './BangCauHoi'
import QuizResult from './KetQuaQuiz'
import EssayQuestion from './CauTuLuan'

const khong = () => {}
const CAU = [
  { id: 1, type: 'multiple_choice', question: 'Chọn A', options: [{ key: 'A', text: 'a' }, { key: 'B', text: 'b', image_url: 'https://x.test/b.png' }], correct_answer: 'A', hint: 'nghĩ kỹ' },
  { id: 2, type: 'true_false', question: 'Đúng hay sai', correct_answer: 'Đúng' },
  { id: 3, type: 'fill_blank', question: 'Điền ___:\n```python\nx = ___\n```', correct_answer: 'a,1' },
  { id: 4, type: 'drag_word', question: 'Kéo ___ và ___', options: [{ key: 'A', text: 'chuột' }, { key: 'B', text: 'phím' }], correct_answer: 'chuột,phím' },
  { id: 5, type: 'ordering', question: 'Sắp xếp', options: [{ key: '1', text: 'một' }, { key: '2', text: 'hai' }], correct_answer: '1,2' },
  { id: 6, type: 'matching', question: 'Nối', options: [{ key: 'A', text: 'x' }], match_options: [{ key: '1', text: 'y' }], correct_answer: 'A-1' },
  { id: 7, type: 'word_order', question: 'Sắp câu', options: ['Em', 'học bài'], correct_answer: 'Em học bài' },
  { id: 8, type: 'essay', question: 'Viết đoạn văn', options: [{ allow_file: true }], correct_answer: '' },
]

describe('QuizSession: câu đầu tiên ở mọi chế độ', () => {
  it.each([
    ['luyện tập', { mode: 'practice' }],
    ['đề thi có giờ', { mode: 'exam', examMode: true, examId: 'e1', sessionId: 's1', timeLimit: 15, showAnswer: false }],
    ['xem trước của giáo viên', { mode: 'practice', preview: true }],
  ])('%s', (_, props) => {
    const html = renderToString(<QuizSession questions={CAU} onFinish={khong} {...props} />)
    expect(html).toContain('Chọn A')
    expect(html).toMatch(/Tự luận \((<!-- -->)?1(<!-- -->)?\)/)
  })
})

describe('ô trả lời: đủ 8 loại câu', () => {
  it.each(CAU.map(q => [q.type, q]))('%s — chưa trả lời', (_, q) => {
    const html = renderToString(<OTraLoiQuiz q={q} current={0} selected={null} confirmed={false} showAnswer answers={{}} onSelect={khong} onEssayChange={khong} />)
    expect(html.length).toBeGreaterThan(50)
  })
  it.each([
    ['multiple_choice', 'B'], ['true_false', 'Sai'], ['fill_blank', 'b,2'], ['drag_word', 'phím,chuột'],
    ['ordering', '2,1'], ['matching', 'A-1'], ['word_order', 'học bài,Em'],
  ])('%s — đã xác nhận, sai', (type, ans) => {
    const q = CAU.find(c => c.type === type)
    renderToString(<OTraLoiQuiz q={q} current={0} selected={ans} confirmed showAnswer answers={{ 0: ans }} onSelect={khong} onEssayChange={khong} />)
  })
  it('tự luận đã đính kèm tệp', () =>
    expect(renderToString(<EssayQuestion q={CAU[7]} value={{ text: 'bài', file_url: 'u', file_name: 'bai.docx' }} onChange={khong} />)).toContain('bai.docx'))
})

describe('bảng câu + kết quả', () => {
  it('bảng câu: đang làm / đúng / sai / bỏ qua / khoá', () => {
    const html = renderToString(<BangCauHoi questions={CAU} answers={{ 0: 'A', 1: 'Sai' }} current={2} confirmedSet={new Set([0, 1, 3])}
      skippedSet={new Set([3])} practiceMode answeredCount={2} onChon={khong} onNop={khong} />)
    expect(html).toContain('bg-green-100')
    expect(html).toContain('bg-red-100')
    expect(html).toContain('bg-orange-100')
    expect(html).toContain('cursor-not-allowed')
  })
  it('kết quả có điểm (có tự luận)', () => {
    const html = renderToString(<QuizResult questions={CAU} answers={{ 0: 'A', 1: 'Sai' }} onRetry={khong} />)
    expect(html).toContain('câu tự luận')
    expect(html).toContain('Đáp án đúng')
  })
  it('kết quả không hiện điểm (đề thi ẩn điểm)', () =>
    expect(renderToString(<QuizResult questions={CAU} answers={{}} onRetry={khong} showScore={false} examMode />)).toContain('Đã nộp bài thành công'))
})
