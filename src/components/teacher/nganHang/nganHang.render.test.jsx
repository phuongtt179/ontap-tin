// Dựng thử ngân hàng bài + luyện bài (không gọi DB: dữ liệu tải trong useEffect, không chạy khi dựng).
import { describe, it, expect, vi } from 'vitest'
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../../../lib/supabase', () => ({ supabase: { from: () => { throw new Error('không gọi DB khi dựng thử') } } }))
vi.mock('../../../context/AuthContext', () => ({ useAuth: () => ({ canDelete: true, user: { id: 'gv' } }) }))
vi.mock('../../../context/SelectedGradeContext', () => ({ useSelectedGradeContext: () => ({ selectedGrade: 'PYTHON A NÂNG CAO' }) }))
vi.mock('../../../hooks/useGrades', () => ({ useGrades: () => ({ grades: ['PYTHON A NÂNG CAO', 'PYTHON A LUYỆN THI'] }) }))

import NganHangPage from '../../../pages/teacher/NganHangPage'
import LuyenBaiPage from '../../../pages/student/LuyenBaiPage'
import BaiNganHangModal from './BaiNganHangModal'
import ChonBaiNganHang from './ChonBaiNganHang'
import LocBaiNganHang from './LocBaiNganHang'
import LamBaiLuyen from '../../student/luyenBai/LamBaiLuyen'
import { LOC_TRONG } from '../../../domain/nganHang'

const khong = () => {}

describe('ngân hàng bài + luyện bài', () => {
  it('trang Ngân hàng bài (giáo viên) đang tải', () => {
    const h = renderToString(<MemoryRouter><NganHangPage /></MemoryRouter>)
    expect(h).toContain('Ngân hàng bài')
    expect(h).toContain('Mở cho khoá')
  })
  it('thêm bài mới: đủ ô dạng, độ khó, test, lời giải, mở cho khoá', () => {
    const h = renderToString(<BaiNganHangModal id={null} onClose={khong} onDone={khong} />)
    for (const chu of ['Dạng bài', 'Độ khó', 'Test chấm tự động', 'Lời giải mẫu', 'PYTHON A LUYỆN THI']) expect(h).toContain(chu)
  })
  it('chọn bài cho kỳ thi: có tạo đề ngẫu nhiên', () => {
    expect(renderToString(<ChonBaiNganHang daCo={[]} onChon={khong} onClose={khong} />)).toContain('Tạo đề ngẫu nhiên')
    expect(renderToString(<LocBaiNganHang loc={LOC_TRONG} setLoc={khong} grades={['K']} />)).toContain('Mọi dạng')
  })
  it('học sinh: trang Luyện bài + làm 1 bài (đang tải)', () => {
    expect(renderToString(<MemoryRouter><LuyenBaiPage /></MemoryRouter>)).toContain('Luyện bài')
    expect(renderToString(<LamBaiLuyen baiId="b" userId="u" onQuayLai={khong} />)).toContain('animate-spin')
  })
})
