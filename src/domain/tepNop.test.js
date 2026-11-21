import { describe, it, expect } from 'vitest'
import { duoiTep, tenTep, loaiTep, linkXemOffice } from './tepNop'

describe('tệp nộp', () => {
  it('đuôi tệp: viết thường, bỏ ?..., không có url → rỗng', () => {
    expect(duoiTep('https://x/a/Bai.PY?v=2')).toBe('py')
    expect(duoiTep(null)).toBe('')
  })
  it('tên tệp: ưu tiên tên gốc, không thì giải mã cuối đường dẫn', () => {
    expect(tenTep('https://x/b%C3%A0i%201.sb3?x', 'goc.sb3')).toBe('goc.sb3')
    expect(tenTep('https://x/b%C3%A0i%201.sb3?x')).toBe('bài 1.sb3')
    expect(tenTep('')).toBe('')
  })
  it('loại tệp', () => {
    expect(loaiTep('a.docx')).toMatchObject({ word: true, office: true, ppt: false })
    expect(loaiTep('a.PPTX')).toMatchObject({ ppt: true, office: true })
    expect(loaiTep('a.webp').anh).toBe(true)
    expect(loaiTep('a.sb3').sb3).toBe(true)
    expect(loaiTep('a.txt').code).toBe(true)
    expect(loaiTep('a.pdf')).toMatchObject({ pdf: true, office: false, code: false })
  })
  it('link xem Office mã hoá url', () =>
    expect(linkXemOffice('https://x/a b.docx')).toBe('https://view.officeapps.live.com/op/embed.aspx?src=https%3A%2F%2Fx%2Fa%20b.docx'))
})
