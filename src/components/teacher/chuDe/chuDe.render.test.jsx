// Dựng thử trang Chủ đề + các cửa sổ (không gọi DB: dữ liệu tải trong useEffect, không chạy khi dựng).
import { describe, it, expect, vi } from 'vitest'
import { renderToString } from 'react-dom/server'

vi.mock('../../../lib/supabase', () => ({ supabase: { from: () => { throw new Error('không gọi DB khi dựng thử') } } }))
vi.mock('../../../context/AuthContext', () => ({ useAuth: () => ({ canDelete: true, user: { id: 'gv' } }) }))
vi.mock('../../../hooks/useGrades', () => ({ useGrades: () => ({ grades: ['K3', 'K5'] }) }))
vi.mock('../../../hooks/useTopics', () => ({ useTopics: () => ({ topics: [{ id: 1, name: 'Chủ đề 2', grade: 'K5' }], loading: false, refetch: () => {} }) }))

import TopicsPage from '../../../pages/teacher/TopicsPage'
import NhapChuDeModal from './NhapChuDeModal'
import QuanLyDonViModal from './QuanLyDonViModal'
import QuanLyTieuDeModal from './QuanLyTieuDeModal'

const khong = () => {}
describe('trang Chủ đề', () => {
  it('danh sách chủ đề', () => expect(renderToString(<TopicsPage />)).toContain('Chủ đề 2'))
  it('nhập chủ đề hàng loạt', () =>
    expect(renderToString(<NhapChuDeModal grades={['K3', 'K5']} existingTopics={[]} defaultGrade="K5" user={{ id: 'gv' }} onClose={khong} onDone={khong} />)).toContain('mỗi dòng 1 tên'))
  it('quản lý đơn vị', () =>
    expect(renderToString(<QuanLyDonViModal topic={{ name: 'Chủ đề 2', grade: 'K5' }} user={{ id: 'gv' }} canDelete onClose={khong} />)).toContain('Chủ đề 2'))
  it('quản lý tiêu đề nhỏ', () =>
    expect(renderToString(<QuanLyTieuDeModal unit={{ id: 'u', name: 'Đơn vị 1' }} user={{ id: 'gv' }} canDelete onClose={khong} />)).toContain('Đơn vị 1'))
})
