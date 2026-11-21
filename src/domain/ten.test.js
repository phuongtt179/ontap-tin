import { describe, it, expect } from 'vitest'
import { boDau, coChua, soKhop, tenGoi, xepTheoTenGoi, xepTheoLopRoiTen } from './ten'

describe('so khớp / xếp theo tên', () => {
  it('bỏ dấu, đ → d', () => expect(boDau('Đặng Thị Ánh')).toBe('dang thi anh'))
  it('tìm tên không cần dấu, tìm rỗng → khớp', () => {
    expect(coChua('Nguyễn Văn Đức', ' duc ')).toBe(true)
    expect(coChua('Nguyễn Văn An', 'bình')).toBe(false)
    expect(coChua(null, '')).toBe(true)
  })
  it('so khớp gần đúng tên lớp', () => {
    expect(soKhop('lớp kn 46')).toContain(soKhop('KN-46'))
    expect(soKhop('Lớp Đ1')).toBe('LOPD1')
  })
  it('xếp theo tên gọi', () => {
    expect(tenGoi(' Nguyễn Văn  An ')).toBe('An')
    expect(['Lê Bình', 'Trần An', 'Phạm Chi'].sort(xepTheoTenGoi)).toEqual(['Trần An', 'Lê Bình', 'Phạm Chi'])
  })
  it('xếp theo lớp rồi họ tên; thiếu lớp / tên không lỗi', () => {
    const ds = [{ class_name: '4B', full_name: 'An' }, { class_name: '4A', full_name: 'Chi' }, { class_name: '4A', full_name: 'Bình' }, { full_name: null }]
    expect(ds.sort(xepTheoLopRoiTen).map(h => h.full_name)).toEqual([null, 'Bình', 'Chi', 'An'])
  })
})
