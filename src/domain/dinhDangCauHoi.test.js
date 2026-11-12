import { describe, it, expect } from 'vitest'
import { tachChoTrong, chuanHoaLuaChon } from './dinhDangCauHoi'

describe('tachChoTrong', () => {
  it('chữ thường có ô trống', () => {
    expect(tachChoTrong('Con ___ kêu ___.')).toEqual({ soCho: 2, tokens: [
      { type: 'text', content: 'Con ' }, { type: 'blank', index: 0 }, { type: 'text', content: ' kêu ' },
      { type: 'blank', index: 1 }, { type: 'text', content: '.' }] })
  })
  it('ô trống ở đầu / cuối / liền nhau', () => {
    expect(tachChoTrong('___a______').tokens.map(t => t.type)).toEqual(['blank', 'text', 'blank', 'blank'])
  })
  it('khối code có ô trống → code-with-blanks, đánh số nối tiếp ô ngoài', () => {
    const { tokens, soCho } = tachChoTrong('Điền ___:\n```python\nx = ___\nprint(___)\n```\nhết')
    expect(soCho).toBe(3)
    expect(tokens[3]).toEqual({ type: 'code-with-blanks', lang: 'python', segs: ['x = ', '\nprint(', ')'], startIdx: 1 })
    expect(tokens.at(-1)).toEqual({ type: 'text', content: '\nhết' })
  })
  it('khối code không có ô trống → code', () => {
    expect(tachChoTrong('```\nprint(1)\n```').tokens).toEqual([{ type: 'code', lang: '', content: 'print(1)' }])
  })
  it('không có ô trống / rỗng', () => {
    expect(tachChoTrong('abc')).toEqual({ soCho: 0, tokens: [{ type: 'text', content: 'abc' }] })
    expect(tachChoTrong('')).toEqual({ soCho: 0, tokens: [] })
    expect(tachChoTrong(undefined)).toEqual({ soCho: 0, tokens: [] })
  })
  it('gọi nhiều lần cho cùng kết quả (không dính trạng thái regex)', () => {
    const de = '```\na=___\n```'
    expect(tachChoTrong(de)).toEqual(tachChoTrong(de))
  })
})

describe('chuanHoaLuaChon', () => {
  it('các kiểu lưu', () => {
    expect(chuanHoaLuaChon(['x', { key: 'B', text: 'y' }, { C: 'z', image_url: 'u' }, { value: 'v' }, null, 5])).toEqual([
      { key: 'A', text: 'x', image_url: '' }, { key: 'B', text: 'y' }, { key: 'C', text: 'z', image_url: 'u' },
      { key: 'D', text: 'v', image_url: '' }, { key: 'E', text: '', image_url: '' }, { key: 'F', text: '5', image_url: '' }])
  })
  it('không phải mảng → rỗng', () => expect(chuanHoaLuaChon(null)).toEqual([]))
})
