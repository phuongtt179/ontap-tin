import { describe, it, expect } from 'vitest'
import { dungDapAn, diemTuDong } from './dapAn'

describe('dungDapAn', () => {
  it('trắc nghiệm / đúng sai: không phân biệt hoa thường, bỏ khoảng trắng hai đầu', () => {
    expect(dungDapAn('multiple_choice', 'B', 'b')).toBe(true)
    expect(dungDapAn('multiple_choice', ' Bàn phím ', 'bàn phím')).toBe(true)
    expect(dungDapAn('multiple_choice', 'A', 'B')).toBe(false)
    expect(dungDapAn('true_false', 'true', 'true')).toBe(true)
    expect(dungDapAn('true_false', 'false', 'true')).toBe(false)
  })

  it('chưa trả lời → sai (kể cả đáp án trống)', () => {
    for (const a of [undefined, null, '', '   ']) expect(dungDapAn('multiple_choice', a, '')).toBe(false)
  })

  it('tự luận không chấm tự động', () => {
    expect(dungDapAn('essay', 'bài làm', 'bài làm')).toBe(false)
  })

  it('ghép cặp: không phụ thuộc thứ tự cặp, bỏ khoảng trắng', () => {
    expect(dungDapAn('matching', '2-b, 1-a,3-c', '1-a,2-b,3-c')).toBe(true)
    expect(dungDapAn('matching', '1-b,2-a,3-c', '1-a,2-b,3-c')).toBe(false)
    expect(dungDapAn('matching', '1-a,2-b', '1-a,2-b,3-c')).toBe(false)
  })

  it('điền chỗ trống / kéo thả: từng ô theo thứ tự, không phân biệt hoa thường', () => {
    expect(dungDapAn('fill_blank', 'Chuột', 'chuột')).toBe(true)
    expect(dungDapAn('fill_blank', ' chuột , Bàn phím', 'chuột,bàn phím')).toBe(true)
    expect(dungDapAn('drag_word', 'bàn phím,chuột', 'chuột,bàn phím')).toBe(false)   // sai thứ tự
    expect(dungDapAn('drag_word', 'chuột', 'chuột,bàn phím')).toBe(false)            // thiếu ô
  })

  it('sắp xếp câu: so cả câu, dấu "/" và "," coi như dấu cách', () => {
    expect(dungDapAn('word_order', 'Hiệu ứng giúp bài sinh động', 'Hiệu ứng / giúp bài / sinh động')).toBe(true)
    expect(dungDapAn('word_order', 'giúp bài Hiệu ứng sinh động', 'Hiệu ứng giúp bài sinh động')).toBe(false)
  })

  it('câu trả lời không phải chuỗi vẫn so được', () => {
    expect(dungDapAn('multiple_choice', 3, '3')).toBe(true)
  })
})

describe('diemTuDong — thang 10, tự luận không tính', () => {
  const de = [
    { type: 'multiple_choice', correct_answer: 'A' },
    { type: 'multiple_choice', correct_answer: 'B' },
    { type: 'essay', correct_answer: '' },
    { type: 'fill_blank', correct_answer: 'chuột' },
  ]

  it('đúng 2/3 câu tự chấm → 6,7 điểm, 67%', () => {
    expect(diemTuDong(de, { 0: 'a', 1: 'C', 2: 'bài', 3: 'Chuột' })).toEqual({ soDung: 2, soCau: 3, diem: 6.7, phanTram: 67 })
  })
  it('nhận cả mảng câu trả lời', () => {
    expect(diemTuDong(de, ['A', 'B', '', 'chuột']).diem).toBe(10)
  })
  it('thang điểm khác (phần trắc nghiệm 6 điểm)', () => {
    expect(diemTuDong(de, ['A', 'x', '', 'x'], 6).diem).toBe(2)
  })
  it('đề chỉ có tự luận / đề trống → 0', () => {
    expect(diemTuDong([{ type: 'essay' }], ['x'])).toEqual({ soDung: 0, soCau: 0, diem: 0, phanTram: 0 })
    expect(diemTuDong([], {}).diem).toBe(0)
    expect(diemTuDong(null, null).diem).toBe(0)
  })
  it('chưa làm câu nào → 0', () => {
    expect(diemTuDong(de, {}).diem).toBe(0)
  })
})
