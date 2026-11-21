// Dựng thử hộp thư giáo viên ở nhiều trạng thái (hook giả lập — không gọi DB).
import { describe, it, expect, vi } from 'vitest'
import { renderToString } from 'react-dom/server'

vi.mock('../../../lib/supabase', () => ({ supabase: { from: () => { throw new Error('không gọi DB khi dựng thử') } } }))
import MessagesInboxPage from '../../../pages/teacher/MessagesInboxPage'
import DanhSachHoiThoai from './DanhSachHoiThoai'
import KhungChat from './KhungChat'
import NhanEmMoi from './NhanEmMoi'
import NhanCaLop from './NhanCaLop'

const khong = () => {}
const tin = (id, vai, noiDung) => ({ id, student_id: 'a', sender_role: vai, content: noiDung, is_read: false, created_at: '2026-11-12T08:00:00Z' })
const HOI_THOAI = {
  student: { id: 'a', full_name: 'An', class_name: '4A' },
  messages: [tin(1, 'student', 'Thầy ơi'), tin(2, 'teacher', 'Thầy đây')],
  aiMessages: [tin(3, 'student', 'vòng lặp?'), tin(4, 'ai', 'là lặp lại')],
  lastMsg: tin(2, 'teacher', 'Thầy đây'), unread: 1,
}
const h = (them = {}) => ({
  threads: [HOI_THOAI], filteredThreads: [HOI_THOAI], selected: null, setSelected: khong, input: '', setInput: khong,
  loading: false, sending: false, search: '', setSearch: khong, showAiLog: false, setShowAiLog: khong,
  filterClass: '', setFilterClass: khong, filterUnread: false, setFilterUnread: khong, bottomRef: { current: null }, inputRef: { current: null },
  showGroup: false, setShowGroup: khong, classes: ['4A'], groupClass: '4A', setGroupClass: khong, groupInput: '', setGroupInput: khong, groupSending: false,
  showNew: false, setShowNew: khong, allStudents: [], newSearch: '', setNewSearch: khong,
  openThread: khong, openNewThread: khong, sendReply: khong, deleteMessage: khong, sendGroupMessage: khong, totalUnread: 1, ...them,
})

describe('hộp thư giáo viên', () => {
  it('trang đang tải (chưa gọi DB khi dựng)', () => expect(renderToString(<MessagesInboxPage />)).toContain('Tin nhắn'))
  it('danh sách: có em chưa đọc', () => {
    const html = renderToString(<DanhSachHoiThoai h={h()} />)
    expect(html).toContain('An')
    expect(html).toContain('Thầy đây')
  })
  it('khung chat: tin thầy trò + log AI', () => {
    expect(renderToString(<KhungChat h={h({ selected: HOI_THOAI })} />)).toContain('Thầy ơi')
    expect(renderToString(<KhungChat h={h({ selected: HOI_THOAI, showAiLog: true })} />)).toContain('là lặp lại')
  })
  it('khung chat: chưa chọn em', () => expect(renderToString(<KhungChat h={h()} />).length).toBeGreaterThan(0))
  it('cửa sổ nhắn em mới + nhắn cả lớp', () => {
    expect(renderToString(<NhanEmMoi h={h({ showNew: true, allStudents: [{ id: 'b', full_name: 'Bình', class_name: '4A' }] })} />)).toContain('Bình')
    expect(renderToString(<NhanCaLop h={h({ showGroup: true })} />)).toContain('4A')
  })
})
