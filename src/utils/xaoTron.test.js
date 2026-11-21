import { describe, it, expect } from 'vitest'
import { xaoTron } from './xaoTron'

describe('xaoTron', () => {
  it('giữ đủ phần tử, không sửa mảng gốc', () => {
    const goc = [1, 2, 3, 4, 5]
    const r = xaoTron(goc)
    expect([...r].sort()).toEqual(goc)
    expect(goc).toEqual([1, 2, 3, 4, 5])
  })
  it('không bao giờ trả lại đúng thứ tự ban đầu (khi có ≥ 2 phần tử khác nhau)', () => {
    for (let k = 0; k < 500; k++) expect(xaoTron(['a', 'b'])).toEqual(['b', 'a'])
    for (let k = 0; k < 500; k++) expect(xaoTron([1, 2, 3])).not.toEqual([1, 2, 3])
  })
  it('mảng rỗng / 1 phần tử / null', () => {
    expect(xaoTron([])).toEqual([])
    expect(xaoTron([7])).toEqual([7])
    expect(xaoTron(null)).toEqual([])
  })
  it('các thứ tự xuất hiện tương đối đều (không lệch như sort ngẫu nhiên)', () => {
    const dem = {}
    for (let k = 0; k < 6000; k++) { const s = xaoTron([1, 2, 3]).join(''); dem[s] = (dem[s] || 0) + 1 }
    expect(Object.keys(dem).length).toBe(5)                     // 6 thứ tự trừ thứ tự gốc
    for (const n of Object.values(dem)) expect(n).toBeGreaterThan(900)
  })
})
