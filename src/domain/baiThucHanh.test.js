import { describe, it, expect } from 'vitest'
import { parseTasks, baiCoNoiDung, tieuChiThanhChu, tepKhongConDung } from './baiThucHanh'

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

describe('soạn bài thực hành (giáo viên)', () => {
  it('baiCoNoiDung: đề / tiêu chí / tệp đề đều tính; toàn khoảng trắng thì không', () => {
    expect(baiCoNoiDung({ instructions: ' a ' })).toBe(true)
    expect(baiCoNoiDung({ rubric: 'x' })).toBe(true)
    expect(baiCoNoiDung({ instruction_file_url: 'u' })).toBe(true)
    expect(baiCoNoiDung({ instructions: '  ', rubric: '\n', instruction_file_url: '' })).toBe(false)
    expect(baiCoNoiDung(null)).toBe(false)
  })
  it('tieuChiThanhChu: chữ giữ nguyên, object → từng dòng', () => {
    expect(tieuChiThanhChu('a')).toBe('a')
    expect(tieuChiThanhChu(null)).toBe('')
    expect(tieuChiThanhChu({ 'Có vòng lặp': 3, 'Đúng màu': 2 })).toBe('Có vòng lặp: 3đ\nĐúng màu: 2đ')
    expect(tieuChiThanhChu(5)).toBe('5')
  })
  it('tepKhongConDung: chỉ tệp Cloudinary bị thay / gỡ', () => {
    const C = 'https://res.cloudinary.com/x/'
    const cu = { pptx_url: C + 'a.pptx', practice_instructions: JSON.stringify([{ instruction_file_url: C + 'd1.docx' }, { instruction_file_url: C + 'd2.docx' }, { instruction_file_url: 'https://drive.test/k' }]) }
    expect(tepKhongConDung(cu, C + 'b.pptx', [{ instruction_file_url: C + 'd2.docx' }])).toEqual([C + 'a.pptx', C + 'd1.docx'])
    expect(tepKhongConDung(cu, C + 'a.pptx', [{ instruction_file_url: C + 'd1.docx' }, { instruction_file_url: C + 'd2.docx' }])).toEqual([])
    expect(tepKhongConDung({ practice_instructions: 'đề cũ dạng chữ' }, null, [])).toEqual([])
  })
})
