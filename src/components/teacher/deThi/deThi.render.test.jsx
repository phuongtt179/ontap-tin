// Dựng thử các phần soạn / chấm đề thi (không gọi DB: dữ liệu tải trong useEffect, không chạy khi dựng).
import { describe, it, expect, vi } from 'vitest'
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../../../lib/supabase', () => ({ supabase: { from: () => { throw new Error('không gọi DB khi dựng thử') } } }))
vi.mock('../../../context/AuthContext', () => ({ useAuth: () => ({ canDelete: true, user: { id: 'gv' } }) }))
vi.mock('../../../hooks/useGrades', () => ({ useGrades: () => ({ grades: ['K3', 'K5'] }) }))
vi.mock('../../editor/WordEditor', () => ({ default: () => <div>WORD</div> }))
vi.mock('../../editor/PPTEditor', () => ({ default: () => <div>PPT</div> }))

import ExamsPage from '../../../pages/teacher/ExamsPage'
import ExamResultsPage from '../../../pages/teacher/ExamResultsPage'
import DeThiFormModal from './DeThiFormModal'
import BuocThongTinDe from './BuocThongTinDe'
import BuocChonCauHoiDe from './BuocChonCauHoiDe'
import ChamThucHanhThi from './ChamThucHanhThi'

const khong = () => {}
const FORM = {
  title: 'Đề 1', grade: 'K3', class_names: [], time_limit: 30, max_attempts: 1, is_active: false, show_answer: true, show_score: true,
  question_ids: [1], has_practical: true, practical_type: 'python', practical_instructions: '', theory_weight: 60, practical_weight: 40, practical_rubric: '',
}

describe('đề thi (giáo viên)', () => {
  it('trang danh sách + trang kết quả đang tải', () => {
    expect(renderToString(<MemoryRouter><ExamsPage /></MemoryRouter>)).toContain('Đề thi')
    expect(renderToString(<MemoryRouter><ExamResultsPage /></MemoryRouter>)).toContain('animate-spin')
  })
  it('cửa sổ tạo đề mới + sửa đề', () => {
    expect(renderToString(<DeThiFormModal onClose={khong} onDone={khong} />)).toContain('Tạo đề thi mới')
    expect(renderToString(<DeThiFormModal exam={{ id: 'e', ...FORM }} onClose={khong} onDone={khong} />)).toContain('Sửa đề thi')
  })
  it('bước 1: phần thực hành Python có khung test', () => {
    const html = renderToString(<BuocThongTinDe form={FORM} setForm={khong} tests={[{ input: '1', expected: '1', diem: 1 }]} setTests={khong} />)
    expect(html).toContain('Test chấm tự động')
    expect(html).toContain('Phần thực hành')
  })
  it('bước 2: chọn câu hỏi (đang tải)', () =>
    expect(renderToString(<BuocChonCauHoiDe form={FORM} setForm={khong} />)).toContain('Ngẫu nhiên'))
  it.each([
    ['Python đã nộp', { practical_type: 'python' }, { id: 's', practical_score: 7, practical_comment: 'ổn' }],
    ['Scratch có tệp + AI chấm nháp', { practical_type: 'scratch' }, { id: 's', practical_file_url: 'https://x.test/a.sb3', practical_file_name: 'a.sb3', practical_ai: { score: 6, comment: 'AI', breakdown: [] } }],
    ['Word soạn trong trang', { practical_type: 'word' }, { id: 's', practical_content: '<p>bài</p>' }],
    ['chưa nộp thực hành', { practical_type: 'ppt' }, { id: 's' }],
  ])('chấm thực hành: %s', (_, de, luot) => {
    const html = renderToString(<ChamThucHanhThi exam={{ has_practical: true, ...de }} luot={luot} onCapNhat={khong} />)
    expect(html.length).toBeGreaterThan(0)
  })
})
