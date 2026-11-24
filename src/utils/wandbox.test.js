import { describe, it, expect } from 'vitest'
import { chonPython } from './wandbox'

describe('chonPython — chọn trình biên dịch Python trên Wandbox', () => {
  const ds = ['cpython-head', 'cpython-2.7.18', 'cpython-3.11.18', 'cpython-3.12.9', 'cpython-3.12.16', 'cpython-3.14.10', 'pypy-3.12-v8.0.1']
    .map(name => ({ name, language: 'Python' }))
  it('ưu tiên bản 3.12 mới nhất (so số, không so chữ: 3.12.16 > 3.12.9)', () => expect(chonPython(ds)).toBe('cpython-3.12.16'))
  it('không còn 3.12 → bản 3.x mới nhất, bỏ head và pypy', () =>
    expect(chonPython(ds.filter(c => !c.name.startsWith('cpython-3.12')))).toBe('cpython-3.14.10'))
  it('danh sách rỗng / lỗi → null', () => {
    expect(chonPython([])).toBeNull()
    expect(chonPython(null)).toBeNull()
  })
})
