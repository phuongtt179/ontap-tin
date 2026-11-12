// Dựng thử (không cần trình duyệt) các phần của trang Bài học phía giáo viên ở nhiều trạng thái:
// thiếu biến / thiếu import / sai tên prop lộ ra ngay ở đây thay vì giáo viên gặp trắng trang khi soạn bài.
import { describe, it, expect, vi } from 'vitest'
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../../../lib/supabase', () => ({ supabase: { from: () => { throw new Error('không gọi DB khi dựng thử') } } }))
vi.mock('../../../context/AuthContext', () => ({ useAuth: () => ({ user: { id: 't1' }, canDelete: true }) }))
vi.mock('../../../hooks/useGrades', () => ({ useGrades: () => ({ grades: ['KN-TIỂU HỌC', 'PYTHON'] }) }))
vi.mock('../../../hooks/useTopics', () => ({ useTopics: () => ({ topics: [{ id: 'c1', name: 'Chủ đề 1', grade: 'PYTHON' }, { id: 'c2', name: 'Chung', grade: 'all' }] }) }))
vi.mock('../../../hooks/useUnits', () => ({
  useUnits: () => ({ units: [{ id: 'u1', name: 'Đơn vị 1' }] }),
  useUnitsByGrade: () => ({ units: [{ id: 'u1', name: 'Đơn vị 1', topic: 'Chủ đề 1' }] }),
}))
vi.mock('../../../hooks/useLessonTitles', () => ({ useLessonTitles: () => ({ lessonTitles: [{ id: 't1', name: 'Tiêu đề nhỏ' }] }) }))
vi.mock('../../student/QuizSession', () => ({ default: () => null }))

import LessonsPage from '../../../pages/teacher/LessonsPage'
import LessonFormModal from './LessonFormModal'
import LessonAudienceModal from './LessonAudienceModal'
import LessonPreviewModal from './LessonPreviewModal'
import TaskEditor from './TaskEditor'
import BuocThongTin from './BuocThongTin'
import BuocChonCauHoi from './BuocChonCauHoi'
import BuocThucHanh from './BuocThucHanh'
import CayChuDe from './CayChuDe'
import DongBaiHoc from './DongBaiHoc'
import ChonHocSinhXem from './ChonHocSinhXem'

const khong = () => {}
const ve = el => renderToString(<MemoryRouter>{el}</MemoryRouter>)
const bai = {
  id: 'L1', title: 'Bài 1: Biến', grade: 'PYTHON', topic: 'Chủ đề 1', unit_id: 'u1', is_published: true, restricted_audience: true,
  video_url: 'https://youtu.be/dQw4w9WgXcQ', pptx_url: 'https://res.cloudinary.com/x/a.pptx', has_practice: true, has_slides: true,
  question_ids: ['q1'], description: 'Học về biến',
  practice_instructions: JSON.stringify([{ instructions: 'Viết **chương trình**', rubric: 'đúng: 5đ' }, { instruction_file_url: 'https://x.test/de.docx' }]),
}
const form = {
  title: 'Bài 1', grade: 'PYTHON', topic: 'Chủ đề 1', description: '', ai_context: '# Lý thuyết', video_url: '', pptx_url: 'https://x.test/a.pdf',
  order: 1, unit_id: 'u1', lesson_title_id: '', has_practice: true, is_published: false, question_ids: ['q1'],
  restricted_audience: true, visible_to: ['s1'],
  practice_tasks: [{ instructions: 'Đề 1', rubric: 'r' }, { instructions: '', instruction_file_url: 'https://x.test/de.pptx' }],
}

describe('trang Bài học (giáo viên)', () => {
  it('dựng cả trang', () => expect(ve(<LessonsPage />)).toContain('Tạo bài học'))
  it('cây chủ đề: đang mở đơn vị + tiêu đề nhỏ', () => {
    const html = ve(<CayChuDe dangMo GRADES={['PYTHON']} selectedGrade="PYTHON" gradeTopics={[{ id: 'c1', name: 'Chủ đề 1' }]}
      loading={false} countByTopic={{ 'Chủ đề 1': 3 }} countByUnit={{ u1: 2 }} countByLessonTitle={{ t1: 1 }}
      expandedTopics={{ 'Chủ đề 1': true }} unitsByTopic={{ 'Chủ đề 1': [{ id: 'u1', name: 'Đơn vị 1' }] }}
      unitLessonTitles={[{ id: 't1', name: 'Tiêu đề nhỏ' }]} selectedTopic="Chủ đề 1" selectedUnit={{ id: 'u1' }} selectedLessonTitle={null}
      onDong={khong} onDoiKhoa={khong} onChonChuDe={khong} onChonDonVi={khong} onChonTieuDe={khong} />)
    expect(html).toContain('Tiêu đề nhỏ')
  })
  it('cây chủ đề: khoá chưa có chủ đề', () =>
    expect(ve(<CayChuDe GRADES={[]} selectedGrade="" gradeTopics={[]} countByTopic={{}} countByUnit={{}} countByLessonTitle={{}}
      expandedTopics={{}} unitsByTopic={{}} unitLessonTitles={[]} />)).toContain('Chưa có chủ đề nào'))
  it.each([
    ['đã xuất bản, có đủ thứ', bai, true],
    ['nháp, không có gì, không được xoá', { id: 'L2', title: 'Nháp', is_published: false }, false],
  ])('dòng bài học: %s', (_, l, xoa) => expect(ve(<DongBaiHoc lesson={l} stt={1} canDelete={xoa} />)).toContain(l.title))
})

describe('form bài học', () => {
  it('tạo mới', () => expect(ve(<LessonFormModal defaultGrade="PYTHON" onClose={khong} onDone={khong} />)).toContain('Tạo bài học mới'))
  it('sửa bài', () => expect(ve(<LessonFormModal lesson={bai} onClose={khong} onDone={khong} />)).toContain('Sửa bài học'))
  it('bước 1: thông tin (có người xem, bài giảng PDF, có thực hành)', () => {
    const html = ve(<BuocThongTin form={form} setForm={khong} GRADES={['PYTHON']} filteredTopics={[{ id: 'c1', name: 'Chủ đề 1' }]}
      onCaiThucHanh={khong} onAiSoanXong={khong} />)
    expect(html).toContain('Chỉ hiện cho một số học sinh')
    expect(html).toContain('Cài đặt thực hành')
  })
  it('bước 1: bài mới trống', () =>
    expect(ve(<BuocThongTin form={{ ...form, pptx_url: '', restricted_audience: false, has_practice: false, ai_context: '' }}
      setForm={khong} GRADES={[]} filteredTopics={[]} />)).toContain('Bấm để tải lên'))
  it('bước 2: chọn câu hỏi (đang tải)', () =>
    expect(ve(<BuocChonCauHoi form={form} setForm={khong} userId="t1" filteredTopics={[{ id: 'c1', name: 'Chủ đề 1' }]} />)).toContain('Ngẫu nhiên'))
  it('bước 3: bài thực hành', () =>
    expect(ve(<BuocThucHanh form={form} setForm={khong} currentTaskIdx={1} setCurrentTaskIdx={khong} />)).toContain('Dán nhiều bài'))
  it('soạn 1 bài: có tệp đề / chưa có', () => {
    expect(ve(<TaskEditor index={0} task={form.practice_tasks[1]} onChange={khong} onRemove={khong} />)).toContain('de.pptx')
    expect(ve(<TaskEditor index={0} task={{}} onChange={khong} onRemove={null} />)).toContain('Upload file Word / PPTX')
  })
  it('chọn học sinh xem', () => {
    expect(ve(<ChonHocSinhXem roster={[{ id: 's1', full_name: 'An' }, { id: 's2', full_name: 'Bình' }]} chon={['s1']} onDoi={khong} />)).toMatch(/Đã chọn (<!-- -->)?1(<!-- -->)? học sinh/)
    expect(ve(<ChonHocSinhXem roster={[]} chon={[]} onDoi={khong} />)).toContain('Chưa có học sinh nào')
  })
})

describe('hộp người xem + xem trước', () => {
  it('ai được xem', () => expect(ve(<LessonAudienceModal lesson={bai} onClose={khong} onDone={khong} />)).toContain('Ai được xem'))
  it('xem trước: video YouTube nhúng + đề thực hành', () => {
    const html = ve(<LessonPreviewModal lesson={bai} onClose={khong} />)
    expect(html).toContain('youtube.com/embed/dQw4w9WgXcQ')
    expect(html).toContain('chương trình')
  })
  it('xem trước: bài trống', () =>
    expect(ve(<LessonPreviewModal lesson={{ id: 'L3', title: 'Trống' }} onClose={khong} />)).toContain('chưa có câu hỏi'))
})
