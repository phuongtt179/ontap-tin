// Dựng thử cửa sổ ghi chú (học sinh) + chi tiết điểm danh 1 em (giáo viên) — không gọi DB khi dựng.
import { describe, it, expect, vi } from 'vitest'
import { renderToString } from 'react-dom/server'

vi.mock('../../lib/supabase', () => ({ supabase: { from: () => { throw new Error('không gọi DB khi dựng thử') } } }))
import NoteModal from './GhiChuModal'
import { colorOf } from './mauGhiChu'
import StudentDetailModal from '../teacher/DiemDanhHocSinhModal'

const khong = () => {}
describe('ghi chú + điểm danh', () => {
  it('cửa sổ ghi chú mới / sửa', () => {
    expect(renderToString(<NoteModal note={null} enrollments={[{ grade: 'K3' }]} topicsByGrade={{ K3: ['Chủ đề 1'] }} onClose={khong} onSave={khong} />).length).toBeGreaterThan(100)
    expect(renderToString(<NoteModal note={{ id: 1, title: 'Vòng lặp', content: 'for', color: 'blue', grade: 'K3' }} enrollments={[{ grade: 'K3' }]} topicsByGrade={{}} onClose={khong} onSave={khong} />)).toContain('Vòng lặp')
  })
  it('màu ghi chú lạ → màu đầu', () => expect(colorOf('khong_co')).toBeTruthy())
  it('chi tiết điểm danh 1 em: có mặt 1/2 buổi', () => {
    const html = renderToString(<StudentDetailModal student={{ id: 'a', full_name: 'An', class_name: '4A' }}
      sessions={[{ id: 1, opened_at: '2026-11-10T08:00:00Z', session_date: '2026-11-10' }, { id: 2, opened_at: '2026-11-11T08:00:00Z', session_date: '2026-11-11' }]}
      records={[{ session_id: 1, user_id: 'a', checked_at: '2026-11-10T08:05:00Z' }]} onClose={khong} />)
    expect(html).toContain('An')
    expect(html).toMatch(/50(<!-- -->)?%/)
  })
})
