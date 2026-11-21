import { describe, it, expect } from 'vitest'
import { docDanhSachTen, dongSeThem, doiCho } from './cayNoiDung'

describe('cây nội dung', () => {
  it('đọc danh sách tên: bỏ dòng trống, đánh dấu đã có / lặp (không phân biệt hoa thường)', () => {
    const ds = docDanhSachTen('  Biến \n\nvòng lặp\nBIẾN\nHàm', ['Hàm'])
    expect(ds).toEqual([
      { name: 'Biến', isDup: false, isRepeat: false },
      { name: 'vòng lặp', isDup: false, isRepeat: false },
      { name: 'BIẾN', isDup: false, isRepeat: true },
      { name: 'Hàm', isDup: true, isRepeat: false },
    ])
    expect(dongSeThem(ds).map(r => r.name)).toEqual(['Biến', 'vòng lặp'])
    expect(dongSeThem(null)).toEqual([])
  })
  it('đổi chỗ lên / xuống; ra ngoài mép → null; không sửa mảng gốc', () => {
    const a = [1, 2, 3]
    expect(doiCho(a, 1, -1)).toEqual([2, 1, 3])
    expect(doiCho(a, 2, 1)).toBeNull()
    expect(doiCho(a, 0, -1)).toBeNull()
    expect(a).toEqual([1, 2, 3])
  })
})
