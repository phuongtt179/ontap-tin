import { describe, it, expect } from 'vitest'
import { gomHoiThoai, themTinMoi, boTin, locHoiThoai } from './hoiThoai'

const tin = (id, sid, phut, vai = 'student', doc = false) => ({ id, student_id: sid, created_at: new Date(Date.UTC(2026, 10, 12, 8, phut)).toISOString(), sender_role: vai, is_read: doc })

describe('hộp thư giáo viên', () => {
  const ds = gomHoiThoai(
    [tin(1, 'a', 1), tin(2, 'a', 2, 'teacher', true), tin(3, 'b', 3, 'student', true)],
    [{ student_id: 'c', created_at: tin(0, 'c', 9).created_at }, { student_id: 'a', created_at: tin(0, 'a', 0).created_at }],
    { a: { id: 'a', full_name: 'An', class_name: '4A' }, b: { id: 'b', full_name: 'Bình', class_name: '4B' } },
  )
  it('gom theo em, mới hoạt động nhất lên đầu, đếm chưa đọc, em lạ → "Học sinh"', () => {
    expect(ds.map(h => h.student.id)).toEqual(['c', 'b', 'a'])
    expect(ds[0]).toMatchObject({ student: { full_name: 'Học sinh' }, messages: [], unread: 0, lastMsg: { _moc: true, content: '🤖 Hỏi đáp AI' } })
    expect(ds[2]).toMatchObject({ unread: 1, lastMsg: { id: 2 } })
    expect(ds[2].aiMessages).toHaveLength(1)
  })
  it('thêm tin mới bỏ tin trùng; không có gì mới → giữ nguyên', () => {
    const a = ds[2]
    const sau = themTinMoi(a, [tin(2, 'a', 2), tin(4, 'a', 5)])
    expect(sau.messages.map(m => m.id)).toEqual([1, 2, 4])
    expect(sau.lastMsg.id).toBe(4)
    expect(themTinMoi(a, [tin(1, 'a', 1)])).toBe(a)
  })
  it('xoá tin: tin cuối cập nhật; tin không thuộc cuộc này → giữ nguyên', () => {
    const a = ds[2]
    expect(boTin(a, 2)).toMatchObject({ lastMsg: { id: 1 } })
    expect(boTin(a, 99)).toBe(a)
  })
  it('lọc theo tên / lớp / chưa đọc', () => {
    expect(locHoiThoai(ds, { tim: '4b' }).map(h => h.student.id)).toEqual(['b'])
    expect(locHoiThoai(ds, { lop: '4A' }).map(h => h.student.id)).toEqual(['a'])
    expect(locHoiThoai(ds, { chuaDoc: true }).map(h => h.student.id)).toEqual(['a'])
  })
})
