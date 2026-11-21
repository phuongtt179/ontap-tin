import { describe, it, expect } from 'vitest'
import { baiDaMoChoLop, loTrinhKhoa } from './moKhoaBai'

const moKhoa = { chuDe: new Set(['CĐ1', '__no_topic__']), bai: new Set(['b1', 'b3']) }

describe('baiDaMoChoLop', () => {
  it('không thuộc lớp nào → mở hết', () => expect(baiDaMoChoLop({ id: 'x', topic: 'CĐ9' }, null)).toBe(true))
  it('chủ đề mở + bài được tick → mở', () => expect(baiDaMoChoLop({ id: 'b1', topic: 'CĐ1' }, moKhoa)).toBe(true))
  it('chủ đề mở nhưng bài chưa tick → khoá', () => expect(baiDaMoChoLop({ id: 'b2', topic: 'CĐ1' }, moKhoa)).toBe(false))
  it('bài được tick nhưng chủ đề chưa mở → khoá', () => expect(baiDaMoChoLop({ id: 'b1', topic: 'CĐ2' }, moKhoa)).toBe(false))
  it('bài không có chủ đề dùng khoá __no_topic__', () => expect(baiDaMoChoLop({ id: 'b3', topic: null }, moKhoa)).toBe(true))
  it('nhận cả Map (trang con đường lưu kèm thời điểm mở)', () =>
    expect(baiDaMoChoLop({ id: 'b1', topic: 'CĐ1' }, { chuDe: moKhoa.chuDe, bai: new Map([['b1', '2026-11-01']]) })).toBe(true))
})

describe('loTrinhKhoa', () => {
  const donVi = [{ id: 'u1', name: 'Làm quen' }, { id: 'u2', name: 'Vòng lặp' }]
  const bai = [
    { id: 'b1', topic: 'CĐ1', unit_id: 'u1', title: 'Bài 1' },
    { id: 'b2', topic: 'CĐ1', unit_id: 'u1', title: 'Bài 2' },
    { id: 'b3', topic: null, unit_id: null, title: 'Bài lẻ' },
    { id: 'b4', topic: 'CĐ1', unit_id: 'u2', title: 'Bài 4' },
  ]
  it('không giới hạn lớp → đủ bài, bài không đơn vị ở cuối', () =>
    expect(loTrinhKhoa(donVi, bai)).toBe('• Làm quen: Bài 1, Bài 2\n• Vòng lặp: Bài 4\n• Bài khác: Bài lẻ'))
  it('có giới hạn lớp → chỉ bài đã mở, đơn vị rỗng bị bỏ', () =>
    expect(loTrinhKhoa(donVi, bai, moKhoa)).toBe('• Làm quen: Bài 1\n• Bài khác: Bài lẻ'))
  it('không có gì → chuỗi rỗng', () => expect(loTrinhKhoa()).toBe(''))
})
