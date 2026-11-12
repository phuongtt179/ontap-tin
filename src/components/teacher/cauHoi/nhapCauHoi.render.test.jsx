// Dựng thử cửa sổ nhập câu hỏi hàng loạt (bước dán) + thẻ sửa từng câu đủ 8 loại.
import { describe, it, expect, vi } from 'vitest'
import { renderToString } from 'react-dom/server'

vi.mock('../../../lib/supabase', () => ({ supabase: { from: () => { throw new Error('không gọi DB khi dựng thử') } } }))
vi.mock('../../../context/AuthContext', () => ({ useAuth: () => ({ user: { id: 'gv' } }) }))
vi.mock('../../../hooks/useUnits', () => ({ useUnits: () => ({ units: [] }) }))
vi.mock('../../../hooks/useLessonTitles', () => ({ useLessonTitles: () => ({ lessonTitles: [] }) }))
import QuestionImportModal from '../QuestionImportModal'
import SuaCauNhap from './SuaCauNhap'

const khong = () => {}
const CAU = [
  { type: 'multiple_choice', question: 'Chọn', options: [{ key: 'A', text: 'x' }, { key: 'B', text: 'y' }], correct_answer: 'A' },
  { type: 'true_false', question: 'Đúng?', options: [], correct_answer: 'Đúng' },
  { type: 'fill_blank', question: 'Điền ___', options: [], correct_answer: 'a' },
  { type: 'drag_word', question: 'Kéo ___', options: [{ key: 'A', text: 'chuột' }], correct_answer: 'chuột' },
  { type: 'ordering', question: 'Xếp', options: [{ key: '1', text: 'một' }], correct_answer: '1' },
  { type: 'matching', question: 'Nối', options: [{ key: 'A', text: 'x' }], match_options: [{ key: '1', text: 'y' }], correct_answer: 'A-1' },
  { type: 'word_order', question: 'Sắp', options: [{ key: 'A', text: 'Em' }], correct_answer: 'Em đi' },
  { type: 'essay', question: 'Viết', options: [], correct_answer: '' },
]
const props = { issues: [{ index: 0, msg: 'thiếu đáp án' }], updateQuestion: khong, updateOption: khong, updateMatchOption: khong, updateWordBank: khong, doiNhieu: khong, removeQuestion: khong, handleImageUpload: khong }

describe('nhập câu hỏi hàng loạt', () => {
  it('bước dán + hướng dẫn', () => {
    const html = renderToString(<QuestionImportModal onClose={khong} onSaved={khong} grades={['K3']} topics={[{ name: 'Chủ đề 1', grade: 'K3' }]} />)
    expect(html).toContain('Hướng dẫn định dạng')
  })
  it.each(CAU.map((q, i) => [q.type, q, i]))('thẻ sửa câu: %s', (_, q, i) => {
    const html = renderToString(<SuaCauNhap q={q} i={i} {...props} />)
    expect(html).toContain(`Câu <!-- -->${i + 1}`)
  })
  it('cảnh báo lỗi cấu trúc hiện đúng câu', () => expect(renderToString(<SuaCauNhap q={CAU[0]} i={0} {...props} />)).toContain('thiếu đáp án'))
})
