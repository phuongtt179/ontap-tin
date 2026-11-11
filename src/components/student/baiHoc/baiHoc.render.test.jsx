// Dựng thử (không cần trình duyệt) các phần của trang Học bài với nhiều trạng thái:
// thiếu biến / thiếu import / truy cập thuộc tính của null sẽ lộ ra ngay ở đây thay vì học sinh gặp trắng trang.
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { renderToString } from 'react-dom/server'
import BanDoBaiThucHanh from './BanDoBaiThucHanh'
import ChiTietBaiThucHanh from './ChiTietBaiThucHanh'
import { LessonQuiz } from './LessonQuiz'
import { FileIcon, SubmittedFile } from './TepDaNop'
import { DoneChip, ActionButton, SectionCard } from './KhungMuc'

vi.mock('../../ui/PDFViewer', () => ({ default: () => null }))   // react-pdf cần trình duyệt thật

beforeAll(() => { globalThis.window ??= { innerWidth: 1200 } })

const tasks = [
  { instructions: 'Vẽ con mèo' },
  { instructions: 'Viết chương trình **Python**', instruction_file_url: 'https://x.test/de.pdf' },
  { instructions: 'Đọc thêm', optional: true },
  { instructions: '', instruction_file_url: 'https://x.test/de.docx' },
]
const daChamGv = { id: 's1', submitted_at: '2026-11-10T08:00:00Z', file_url: 'https://x.test/bai.sb3', file_name: 'bai.sb3',
  reviewed_at: '2026-11-10T09:00:00Z', graded_by: 'teacher', score: 9, muc: 'T', teacher_comment: 'Tốt lắm',
  ai_breakdown: [{ criterion: 'Có nhân vật', earned: 1, max: 1, note: 'ok' }, { criterion: 'Có vòng lặp', earned: 0, max: 1 }] }
const choDuyet = { id: 's2', submitted_at: '2026-11-11T08:00:00Z', file_url: 'https://x.test/bai.py', file_name: 'bai.py',
  text_content: 'em làm xong', allow_resubmit: true }
const khong = () => {}
const onAll = { onDong: khong, onChonFile: khong, onDoiGhiChu: khong, onRaSoatTruoc: khong, onNop: khong,
  onBatDauNopLai: khong, onHuyNopLai: khong, onCapNhatBaiNop: khong, onHoiTroGiang: khong }

describe('bản đồ bài thực hành', () => {
  it.each([
    ['chưa nộp bài nào', [null, null, null, null], null, false],
    ['đã nộp / đã chấm, đang mở 1 bài', [daChamGv, choDuyet, null, null], 1, false],
    ['ẩn cột lý thuyết', [daChamGv, null, null, null], null, true],
  ])('%s', (_, subs, active, an) => {
    const html = renderToString(<BanDoBaiThucHanh practiceTasks={tasks} taskSubmissions={subs}
      activeTaskIdx={active} leftPanelHidden={an} onChon={khong} />)
    expect(html).toMatch(/Bài (<!-- -->)?4</)
  })
})

describe('chi tiết 1 bài thực hành', () => {
  const ve = props => renderToString(<ChiTietBaiThucHanh i={0} task={tasks[0]} sub={null} file={null} note=""
    dangNop={false} dangNopLai={false} dangChamAi={false} lessonId="L1" {...onAll} {...props} />)

  it('chưa nộp → ô chọn tệp + nút nộp', () => expect(ve({})).toContain('Bấm để chọn file nộp bài'))
  it('đã chọn tệp → hiện tên tệp', () => expect(ve({ file: { name: 'meo.sb3', size: 2048 } })).toContain('meo.sb3'))
  it('đang nộp', () => expect(ve({ file: { name: 'a.py', size: 10 }, dangNop: true })).toContain('Đang nộp'))
  it('đã chấm → mức + nhận xét + tiêu chí', () => {
    const html = ve({ sub: daChamGv })
    expect(html).toContain('Tốt lắm')
    expect(html).toContain('Có vòng lặp')
  })
  it('chờ duyệt, được nộp lại → thông báo + nút nộp lại', () => {
    const html = ve({ i: 1, task: tasks[1], sub: choDuyet })
    expect(html).toContain('cho phép bạn nộp lại')
    expect(html).toContain('Nộp lại bài này')
  })
  it('đang nộp lại', () => expect(ve({ sub: choDuyet, dangNopLai: true })).toContain('File cũ sẽ được thay thế'))
  it('AI đang chấm', () => expect(ve({ sub: choDuyet, dangChamAi: true })).toContain('AI đang chấm'))
  it('bài đọc thêm', () => expect(ve({ i: 2, task: tasks[2] })).toContain('không cần nộp bài'))
  it('đề là tệp Word', () => expect(ve({ i: 3, task: tasks[3] })).toContain('view.officeapps.live.com'))
})

describe('quiz trong bài: đủ 8 loại câu', () => {
  const cau = [
    { id: 1, type: 'multiple_choice', question: 'Chọn A', options: [{ key: 'A', text: 'a' }, { key: 'B', text: 'b' }], correct_answer: 'A' },
    { id: 2, type: 'true_false', question: 'Đúng hay sai', correct_answer: 'true' },
    { id: 3, type: 'fill_blank', question: 'Điền ___ vào', correct_answer: 'chuột' },
    { id: 4, type: 'drag_word', question: 'Kéo ___ và ___', options: ['chuột', 'bàn phím'], correct_answer: 'chuột,bàn phím' },
    { id: 5, type: 'ordering', question: 'Sắp xếp', options: [{ key: '1', text: 'một' }, { key: '2', text: 'hai' }], correct_answer: '1,2' },
    { id: 6, type: 'matching', question: 'Nối', options: [{ key: 'A', text: 'x' }], match_options: [{ key: '1', text: 'y' }], correct_answer: 'A-1' },
    { id: 7, type: 'word_order', question: 'Sắp câu', options: ['Em', 'học bài'], correct_answer: 'Em học bài' },
    { id: 8, type: 'essay', question: 'Viết đoạn văn', correct_answer: '' },
  ]
  it.each(cau.map((q, k) => [q.type, k]))('%s', (_, k) => {
    const html = renderToString(<LessonQuiz questions={cau} initialCurrent={k} onSubmit={khong} onProgress={khong} onAskTutor={khong} />)
    expect(html.length).toBeGreaterThan(100)
  })
})

describe('phần nhỏ', () => {
  it('biểu tượng tệp / tệp đã nộp / khung mục', () => {
    for (const u of ['a.png', 'b.docx', 'c.pptx', 'd.sb3', 'e.pdf', 'f.py', 'g.txt', 'h.zip']) renderToString(<FileIcon url={u} />)
    expect(renderToString(<SubmittedFile url="https://x.test/a.py" name="a.py" />)).toContain('a.py')
    renderToString(<DoneChip label="Xong" />)
    renderToString(<ActionButton onClick={khong} loading>Bấm</ActionButton>)
    expect(renderToString(<SectionCard title="Lý thuyết" done locked={false}>nội dung</SectionCard>)).toContain('Lý thuyết')
    expect(renderToString(<SectionCard title="Khoá" locked lockMessage="Làm bài trước">x</SectionCard>)).toContain('Khoá')
  })
})
