import { describe, it, expect } from 'vitest'
import { nhomBaiTheoChuDe } from './thuTuBaiHoc'

const ten = nhom => nhom.map(g => [g.topic, g.lessons.map(l => l.title)])

describe('nhomBaiTheoChuDe', () => {
  it('chủ đề xếp theo số tự nhiên: Chủ đề 2 trước Chủ đề 10', () => {
    const r = nhomBaiTheoChuDe([{ title: 'b', topic: 'Chủ đề 10' }, { title: 'a', topic: 'Chủ đề 2' }])
    expect(r.map(g => g.topic)).toEqual(['Chủ đề 2', 'Chủ đề 10'])
  })
  it('trong chủ đề: theo đơn vị (sort_order) trước, rồi số thứ tự bài; bài chưa có đơn vị đứng cuối', () => {
    const bai = [
      { title: 'u2-bai1', topic: 'T', unit_id: 'u2', order: 1 },
      { title: 'khong-don-vi', topic: 'T', order: 0 },
      { title: 'u1-bai5', topic: 'T', unit_id: 'u1', order: 5 },
      { title: 'u1-bai2', topic: 'T', unit_id: 'u1', order: 2 },
    ]
    const r = nhomBaiTheoChuDe(bai, [{ id: 'u2', sort_order: 2 }, { id: 'u1', sort_order: 1 }])
    expect(ten(r)).toEqual([['T', ['u1-bai2', 'u1-bai5', 'u2-bai1', 'khong-don-vi']]])
  })
  it('cùng số thứ tự thì bài tạo trước đứng trước', () => {
    const r = nhomBaiTheoChuDe([
      { title: 'sau', topic: 'T', order: 1, created_at: '2026-02-01' },
      { title: 'truoc', topic: 'T', order: 1, created_at: '2026-01-01' },
    ])
    expect(ten(r)[0][1]).toEqual(['truoc', 'sau'])
  })
  it('bài không có chủ đề để nhóm cuối; danh sách rỗng không lỗi', () => {
    const r = nhomBaiTheoChuDe([{ title: 'x' }, { title: 'y', topic: 'A' }])
    expect(r.map(g => g.topic)).toEqual(['A', ''])
    expect(nhomBaiTheoChuDe()).toEqual([])
  })
})
