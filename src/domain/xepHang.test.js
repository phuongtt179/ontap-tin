import { describe, it, expect } from 'vitest'
import { gomDiemTheoEm } from './xepHang'

describe('xếp hạng điểm', () => {
  it('gom theo em, trung bình 1 chữ số, điểm cao nhất; bỏ lượt chưa có điểm', () => {
    const kq = gomDiemTheoEm([
      { user_id: 'a', score: 8 }, { user_id: 'a', score: 7 }, { user_id: 'a', score: null },
      { user_id: 'b', score: '9.5' }, { user_id: 'c', score: null },
    ], { a: 'An' }, { a: '4A' })
    expect(kq).toEqual([
      { full_name: 'An', class_name: '4A', scores: [8, 7], count: 2, avg: 7.5, best: 8 },
      { full_name: '—', class_name: '—', scores: [9.5], count: 1, avg: 9.5, best: 9.5 },
    ])
  })
  it('không có lượt → rỗng', () => expect(gomDiemTheoEm([])).toEqual([]))
})
