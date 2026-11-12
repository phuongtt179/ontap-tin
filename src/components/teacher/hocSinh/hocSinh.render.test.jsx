// Dựng thử (không cần trình duyệt) các phần của trang Học sinh ở nhiều trạng thái.
import { describe, it, expect, vi } from 'vitest'
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../../../lib/supabase', () => ({ NOI_DU_LIEU: 'neon', supabase: { from: () => { throw new Error('không gọi DB khi dựng thử') } } }))
vi.mock('../../../context/AuthContext', () => ({ useAuth: () => ({ canDelete: true }) }))
vi.mock('../../../hooks/useGrades', () => ({ useGrades: () => ({ grades: ['K3', 'K5'] }) }))

import StudentsPage from '../../../pages/teacher/StudentsPage'
import NhapHocSinhModal from './NhapHocSinhModal'
import SuaHocSinhModal from './SuaHocSinhModal'
import GhiDanhModal from './GhiDanhModal'
import DanhSachChoDuyet from './DanhSachChoDuyet'
import ThanhLocHocSinh from './ThanhLocHocSinh'
import BangHocSinh from './BangHocSinh'

const khong = () => {}
const LOP = [{ name: 'Ca 1', grade: 'K5' }, { name: 'Ca 2', grade: 'K3' }]
const HS = [
  { id: 'aaaaaaaa-1', full_name: 'An', username: 'an', enrollments: [{ id: 1, grade: 'K5', class_name: 'Ca 1', is_approved: true }, { id: 2, grade: 'K3', is_approved: false }], grade: 'K5', class_name: 'Ca 1' },
  { id: 'bbbbbbbb-2', full_name: 'Bình', enrollments: [], grade: '', class_name: '' },
]

describe('trang Học sinh', () => {
  it('đang tải (chưa gọi DB khi dựng)', () =>
    expect(renderToString(<MemoryRouter><StudentsPage /></MemoryRouter>)).toContain('animate-spin'))
})

describe('các phần', () => {
  it('nhập hàng loạt: bước dán danh sách', () => expect(renderToString(<NhapHocSinhModal onClose={khong} onDone={khong} />)).toContain('Phân tích dữ liệu'))
  it('sửa học sinh: lấy khoá / lớp từ ghi danh đầu', () => {
    const html = renderToString(<SuaHocSinhModal student={HS[0]} classes={LOP} gradeValues={['K3', 'K5']} onClose={khong} onDone={khong} />)
    expect(html).toMatch(/<option value="K5" selected="">/)
    expect(html).toContain('ít nhất 6 ký tự')
  })
  it('ghi danh: khoá đang học + khoá có thể thêm', () => {
    const html = renderToString(<GhiDanhModal student={{ ...HS[0], enrollments: [HS[0].enrollments[0]] }} classes={LOP} gradeValues={['K3', 'K5']} onDone={khong} />)
    expect(html).toContain('Đang tham gia')
    expect(html).toContain('Thêm vào khoá')
  })
  it('chờ duyệt: em chưa chọn lớp được nhắc', () => {
    const html = renderToString(<DanhSachChoDuyet ds={HS} dangDuyet="bbbbbbbb-2" onDuyet={khong} onSua={khong} onTuChoi={khong} />)
    expect(html).toContain('Chưa chọn lớp')
    expect(html).toContain('bbbbbbbb')   // không có tên đăng nhập → hiện đầu mã
    expect(html).toContain('animate-spin')
  })
  it('thanh lọc: đang chọn 2 em → thanh xoá', () => {
    const html = renderToString(<ThanhLocHocSinh tim="a" onTim={khong} khoa="K5" onKhoa={khong} lop="" onLop={khong} cacKhoa={['K3', 'K5']} cacLop={LOP}
      onXoaLoc={khong} coQuyenXoa soHien={2} soChon={2} onChonHet={khong} dangXoa={false} onXoaChon={khong} onBoChon={khong} />)
    expect(html).toContain('Bỏ chọn tất cả')
    expect(html).toMatch(/Xóa (<!-- -->)?2(<!-- -->)? học sinh/)
    expect(html).toContain('Xóa bộ lọc')
  })
  it.each([[true], [false]])('bảng học sinh (quyền xoá: %s)', coQuyenXoa => {
    const html = renderToString(<BangHocSinh ds={HS} mauKhoa={{ K5: 'bg-blue-100 text-blue-700' }} coQuyenXoa={coQuyenXoa} daChon={new Set(['aaaaaaaa-1'])}
      onChon={khong} onChonHet={khong} onThanhTich={khong} onGhiDanh={khong} onSua={khong} onXoa={khong} />)
    expect(html).toContain('an<span class="text-gray-300">@school.local</span>')
    expect(html).toContain('(chờ)')
    expect(html.includes('Xóa học sinh')).toBe(coQuyenXoa)
  })
})
