import { describe, it, expect } from 'vitest'
import { ganTenYeuCau, locVaXepYeuCau, quaTheoKhoa } from './phanThuong'

const YC = ganTenYeuCau([
  { id: 1, student_id: 'a', status: 'pending', requested_at: '2026-11-10', reward_items: { name: 'Bút' } },
  { id: 2, student_id: 'b', status: 'pending', created_at: '2026-11-12', reward_items: { name: 'Ăn kẹo' } },
  { id: 3, student_id: 'c', status: 'fulfilled', requested_at: '2026-11-11', given_at: '2026-11-12' },
], { a: 'Bình', b: 'An' }, { a: '4B', b: '4A' })

describe('phần thưởng', () => {
  it('gắn tên / lớp; em lạ → "Học sinh"; ngày lấy cột cũ khi thiếu', () => {
    expect(YC[0]).toMatchObject({ profiles: { full_name: 'Bình', id: 'a' }, class_name: '4B', created_at: '2026-11-10' })
    expect(YC[2]).toMatchObject({ profiles: { full_name: 'Học sinh' }, class_name: '', fulfilled_at: '2026-11-12' })
  })
  it('lọc trạng thái + xếp theo ngày / quà / tên / lớp', () => {
    expect(locVaXepYeuCau(YC, { trangThai: 'pending' }).map(r => r.id)).toEqual([2, 1])
    expect(locVaXepYeuCau(YC, { trangThai: 'pending', tangDan: true }).map(r => r.id)).toEqual([1, 2])
    expect(locVaXepYeuCau(YC, { trangThai: 'pending', theo: 'reward', tangDan: true }).map(r => r.id)).toEqual([2, 1])
    expect(locVaXepYeuCau(YC, { trangThai: 'pending', theo: 'student', tangDan: true }).map(r => r.id)).toEqual([2, 1])
    expect(locVaXepYeuCau(YC, { trangThai: 'pending', theo: 'class', tangDan: false }).map(r => r.id)).toEqual([1, 2])
    expect(locVaXepYeuCau(YC, { trangThai: 'fulfilled' }).map(r => r.id)).toEqual([3])
  })
  it('quà theo khoá: của khoá + quà chung', () => {
    const qua = [{ id: 1, grade: 'K3' }, { id: 2, grade: null }, { id: 3, grade: 'K5' }]
    expect(quaTheoKhoa(qua, '__all__')).toHaveLength(3)
    expect(quaTheoKhoa(qua, 'K3').map(q => q.id)).toEqual([1, 2])
  })
})
