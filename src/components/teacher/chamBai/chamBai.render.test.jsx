// Dựng thử (không cần trình duyệt) các phần của trang Chấm bài thực hành ở nhiều trạng thái:
// thiếu import / sai tên prop / truy cập thuộc tính của null lộ ra ở đây thay vì giáo viên gặp trắng trang.
import { describe, it, expect, vi } from 'vitest'
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../../../lib/supabase', () => ({ supabase: { from: () => { throw new Error('không gọi DB khi dựng thử') } } }))

import LessonSubmissionsPage from '../../../pages/teacher/LessonSubmissionsPage'
import LoiHayGap from './LoiHayGap'
import ThanhLoc from './ThanhLoc'
import TheTongKet from './TheTongKet'
import BangTienDo from './BangTienDo'
import ChiTietHocSinh from './ChiTietHocSinh'
import BangAiDaCham from './BangAiDaCham'
import ModalChamBai from './ModalChamBai'
import TepBaiNop from './TepBaiNop'

const khong = () => {}
const LUC = '2026-11-12T03:00:00Z'
const HS = [{ id: 'a', full_name: 'An', class_name: '4A' }, { id: 'b', full_name: 'Bình', class_name: '4B' }, { id: 'c', full_name: 'Chi', grade: 'Khối 4' }]
const BREAKDOWN = [{ criterion: 'Dùng vòng lặp', earned: 1, max: 2, note: 'thiếu điều kiện' }, { criterion: 'Chạy đúng', earned: 3, max: 3 }]
const BAI_NOP = {
  a: [
    { id: 's1', user_id: 'a', submitted_at: LUC, file_url: 'https://x.test/bai.py', content_json: { task_index: 0 }, graded_by: 'ai', score: 8.5, ai_breakdown: BREAKDOWN, teacher_comment: 'Tốt', ai_suspect: true, ai_suspect_reason: 'giống mẫu' },
    { id: 's2', user_id: 'a', submitted_at: LUC, file_url: 'https://x.test/bai.sb3', file_name: 'meo.sb3', content_json: { task_index: 1 }, graded_by: 'teacher', muc: 'H', reviewed_at: LUC, allow_resubmit: true },
  ],
  b: [{ id: 's3', user_id: 'b', submitted_at: LUC, file_url: 'https://x.test/a.docx', text_content: 'em viết thêm', graded_by: 'ai', score: 3, reviewed_at: LUC, muc: 'C' }],
}
const TIEN_DO = { a: { completed: true, video_watched: true, quiz_passed: true, quiz_correct: 3, quiz_total: 3 }, b: { quiz_correct: 1 } }
const TASKS = [{ instructions: 'Viết **vòng lặp**', instruction_file_url: 'https://x.test/de.pdf' }, { instructions: 'Làm game', instruction_file_url: 'https://x.test/de.docx' }, { instructions: 'Bài 3' }]
const CHAM = {
  nhanXet: { s1: 'Tốt' }, mucChon: { s1: 'T' }, dangLuu: { s2: true },
  datNhanXet: khong, datMuc: khong, luuNhanXet: khong, doiChoNopLai: khong, aiChamMotEm: khong,
}

describe('trang Chấm bài', () => {
  it('đang tải (chưa gọi DB khi dựng)', () => {
    const html = renderToString(<MemoryRouter><LessonSubmissionsPage /></MemoryRouter>)
    expect(html).toContain('animate-spin')
  })
})

describe('các phần đầu trang', () => {
  it('lỗi hay gặp: có tiêu chí đỏ ≥ 40%', () => {
    const html = renderToString(<LoiHayGap baiNop={[1, 2, 3].map(() => ({ ai_breakdown: BREAKDOWN }))} />)   // cần ≥ 3 bài có bảng tiêu chí
    expect(html).toContain('Dùng vòng lặp')
    expect(html).toContain('nên cân nhắc giảng lại')
  })
  it('lỗi hay gặp: chưa có bảng điểm AI → không hiện', () => expect(renderToString(<LoiHayGap baiNop={[]} />)).toBe(''))
  it.each([
    ['đứng yên', { active: false, done: 0, total: 0, countdown: 0 }, /AI Chấm tất cả/],
    ['đang chấm', { active: true, done: 1, total: 4, countdown: 0 }, /1(<!-- -->)?\/(<!-- -->)?4/],
    ['đợi hết lượt/phút', { active: true, done: 1, total: 4, countdown: 42 }, /Đợi (<!-- -->)?42/],
  ])('thanh lọc — AI %s', (_, aiDangCham, mau) => {
    const html = renderToString(<ThanhLoc classes={['4A', '4B']} lop="4A" onLop={khong} tim="an" onTim={khong} soHs={2} coThucHanh
      aiDangCham={aiDangCham} soBaiAi={2} onAiCham={khong} onXemAi={khong} lanLamMoi={new Date(LUC)} />)
    expect(html).toMatch(mau)
    expect(html).toMatch(/Xem AI đã chấm \((<!-- -->)?2/)
  })
  it('thẻ tổng kết: ẩn mục bài không có, giữ màu', () => {
    const html = renderToString(<TheTongKet tk={{ tong: 3, hoanThanh: 1, video: null, quiz: 2, thucHanh: 1 }} />)
    expect(html).not.toContain('Xem video')
    expect(html).toContain('bg-green-50')
    expect(html).toContain('Nộp thực hành')
  })
})

describe('bảng tiến độ', () => {
  it('đủ cột, các trạng thái ô bài nộp', () => {
    const html = renderToString(<BangTienDo hocSinh={HS} tienDo={TIEN_DO} baiNop={BAI_NOP} lesson={{ question_ids: [1, 2, 3] }}
      coVideo coQuiz coThucHanh soPhan={3} onChonHs={khong} onChamNhanh={khong} />)
    expect(html).toContain('ring-rose-400')          // nghi dùng AI
    expect(html).toContain('🤖')                     // AI chấm nháp
    expect(html).toContain('chờ')                    // cho nộp lại
    expect(html).toMatch(/✓ (<!-- -->)?3(<!-- -->)?\/(<!-- -->)?3/)
    expect(html).toMatch(/Bài (<!-- -->)?3/)
  })
  it('không có học sinh', () => expect(renderToString(<BangTienDo hocSinh={[]} tienDo={{}} baiNop={{}} soPhan={0} />)).toContain('Không có học sinh nào'))
})

describe('chấm từng em', () => {
  it('chi tiết 1 em: phần đã nộp / chưa nộp, nút cho nộp lại', () => {
    const html = renderToString(<ChiTietHocSinh hs={HS[0]} subs={BAI_NOP.a} tasks={TASKS} cham={CHAM} onQuayLai={khong} />)
    expect(html).toContain('Học sinh chưa nộp bài này')
    expect(html).toContain('meo.sb3')
    expect(html).toContain('Đã cho phép nộp lại')
    expect(html).toMatch(/AI gợi ý(<!-- -->)?: <b[^>]*>Hoàn thành tốt/)
  })
  it('chi tiết em chưa nộp gì', () =>
    expect(renderToString(<ChiTietHocSinh hs={HS[2]} subs={[]} tasks={TASKS} cham={CHAM} onQuayLai={khong} />)).toContain('Học sinh chưa nộp bài nào'))
  it('cửa sổ chấm nhanh: bài AI chấm, nghi dùng AI, đề PDF', () => {
    const html = renderToString(<ModalChamBai hs={HS[0]} sub={BAI_NOP.a[0]} task={TASKS[0]} phan={0} cham={CHAM} onDong={khong} />)
    expect(html).toContain('AI đã chấm nháp')
    expect(html).toContain('Nghi ngờ học sinh dùng AI viết hộ')
    expect(html).toContain('⚠ chưa đủ')
    expect(html).toContain('Mở PDF')
    expect(html).toContain('AI chấm lại')
  })
  it('cửa sổ chấm nhanh: bài đã chốt, đề Word', () => {
    const html = renderToString(<ModalChamBai hs={HS[1]} sub={BAI_NOP.b[0]} task={TASKS[1]} phan={1} cham={CHAM} onDong={khong} />)
    expect(html).toContain('officeapps')
    expect(html).toContain('Đã nhận xét lúc')
    expect(html).not.toContain('AI chấm lại')
  })
  it('bảng AI đã chấm: đếm chưa duyệt / đã duyệt', () => {
    const html = renderToString(<BangAiDaCham hocSinh={HS} baiNop={BAI_NOP} dangDuyetHet={false} onDuyet={khong} onDuyetHet={khong} onSua={khong} onDong={khong} />)
    expect(html).toMatch(/1(<!-- -->)? bài chưa duyệt · (<!-- -->)?1(<!-- -->)? đã duyệt/)
    expect(html).toMatch(/1(<!-- -->)?\/(<!-- -->)?2(<!-- -->)?đ/)
  })
  it('bảng AI đã chấm: trống', () =>
    expect(renderToString(<BangAiDaCham hocSinh={HS} baiNop={{}} onDong={khong} />)).toContain('Chưa có bài nào được AI chấm'))
  it.each([
    ['ảnh', { file_url: 'https://x.test/a.png' }, '<img'],
    ['Word', { file_url: 'https://x.test/a.docx' }, 'officeapps'],
    ['chỉ chữ', { text_content: 'bài làm' }, 'bài làm'],
  ])('tệp nộp: %s', (_, sub, mau) => expect(renderToString(<TepBaiNop sub={{ submitted_at: LUC, ...sub }} />)).toContain(mau))
})
