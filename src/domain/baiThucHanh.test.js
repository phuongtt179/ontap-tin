import { describe, it, expect } from 'vitest'
import { parseTasks } from './baiThucHanh'

describe('parseTasks — đọc đề thực hành', () => {
  it('trống / null / undefined → 1 đề rỗng', () => {
    for (const v of [null, undefined, '']) expect(parseTasks(v)).toEqual([{ instructions: '' }])
  })
  it('chuỗi thường (bài cũ) → 1 đề, giữ nguyên chữ', () => {
    expect(parseTasks('Vẽ ngôi nhà')).toEqual([{ instructions: 'Vẽ ngôi nhà' }])
  })
  it('mảng JSON nhiều bài → trả đúng mảng, giữ các trường khác', () => {
    const ds = [{ instructions: 'Bài 1', type: 'scratch' }, { instructions: 'Bài 2', criteria: ['a'] }]
    expect(parseTasks(JSON.stringify(ds))).toEqual(ds)
  })
  it('mảng rỗng, số, object, JSON hỏng → coi cả chuỗi là 1 đề', () => {
    for (const v of ['[]', '42', '{"a":1}', '[{"instructions":']) expect(parseTasks(v)).toEqual([{ instructions: v }])
  })
})
