// Dựng thử cửa sổ soạn câu hỏi: thêm mới + sửa đủ 8 loại câu (không gọi DB: hook tải trong useEffect, đã giả lập).
import { describe, it, expect, vi } from 'vitest'
import { renderToString } from 'react-dom/server'

vi.mock('../../../lib/supabase', () => ({ supabase: { from: () => { throw new Error('không gọi DB khi dựng thử') } } }))
vi.mock('../../../context/AuthContext', () => ({ useAuth: () => ({ user: { id: 'gv' } }) }))
vi.mock('../../../hooks/useGrades', () => ({ useGrades: () => ({ grades: ['K3', 'K5'] }) }))
vi.mock('../../../hooks/useTopics', () => ({ useTopics: () => ({ topics: [{ id: 1, name: 'Chủ đề 1', grade: 'K3' }] }) }))
vi.mock('../../../hooks/useUnits', () => ({ useUnits: () => ({ units: [{ id: 'u1', name: 'Đơn vị 1' }] }) }))
vi.mock('../../../hooks/useLessonTitles', () => ({ useLessonTitles: () => ({ lessonTitles: [{ id: 't1', name: 'Tiêu đề 1' }] }) }))

import QuestionFormModal from '../QuestionFormModal'

const khong = () => {}
const CAU = [
  { id: 1, type: 'multiple_choice', question: 'Chọn A', grade: 'K3', options: [{ key: 'A', text: 'chuột' }, { key: 'B', text: 'phím' }], correct_answer: 'A' },
  { id: 2, type: 'true_false', question: 'Đúng?', grade: 'K3', correct_answer: 'Đúng' },
  { id: 3, type: 'fill_blank', question: 'Điền ___ và ___', grade: 'K3', correct_answer: 'a,b' },
  { id: 4, type: 'matching', question: 'Nối', grade: 'K3', options: [{ key: 'A', text: 'x' }], match_options: [{ key: '1', text: 'y' }], correct_answer: 'A-1' },
  { id: 5, type: 'ordering', question: 'Xếp', grade: 'K3', options: [{ key: '1', text: 'một' }, { key: '2', text: 'hai' }], correct_answer: '1,2' },
  { id: 6, type: 'drag_word', question: 'Kéo ___', grade: 'K3', options: [{ key: '1', text: 'chuột' }, { key: '2', text: 'loa' }], correct_answer: 'chuột' },
  { id: 7, type: 'word_order', question: 'Sắp câu', grade: 'K3', options: [{ key: 'A', text: 'Em đi' }, { key: 'B', text: 'học' }], correct_answer: 'Em đi học' },
  { id: 8, type: 'essay', question: 'Viết', grade: 'K3', options: [{ allow_file: true, max_score: 2 }], correct_answer: 'mẫu' },
]
const DAU_HIEU = {
  multiple_choice: 'bấm chữ để chọn đúng', true_false: 'Đáp án đúng', fill_blank: 'Đáp án cho mỗi chỗ trống', matching: 'Các cặp nối',
  ordering: 'Thứ tự đúng', drag_word: 'Từ gây nhiễu', word_order: 'Câu đúng cần sắp xếp', essay: 'Cho phép học sinh nộp file',
}

describe('cửa sổ soạn câu hỏi', () => {
  it('thêm mới', () => expect(renderToString(<QuestionFormModal onClose={khong} onDone={khong} defaultGrade="K3" />)).toContain('Thêm câu hỏi'))
  it.each(CAU.map(q => [q.type, q]))('sửa: %s', (type, q) => {
    const html = renderToString(<QuestionFormModal onClose={khong} onDone={khong} question={q} />)
    expect(html).toContain('Sửa câu hỏi')
    expect(html).toContain(DAU_HIEU[type])
  })
  it('kéo thả từ + sắp xếp từ dùng chung danh sách từ gây nhiễu', () => {
    expect(renderToString(<QuestionFormModal onClose={khong} onDone={khong} question={CAU[6]} />)).toContain('Thêm từ gây nhiễu')
  })
})
