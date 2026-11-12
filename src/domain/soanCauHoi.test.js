import { describe, it, expect } from 'vitest'
import { formMoi, formTuCauHoi, duLieuCauHoi, duLieuDapAn, soChoTrong } from './soanCauHoi'
// so trên 1.568 câu thật (12/11/2026): form + dữ liệu lưu giống hệt bản cũ trong QuestionFormModal

const f = (them) => ({ ...formMoi({ grade: 'K3' }), question: 'Câu ___ và ___', ...them })

describe('soạn câu hỏi', () => {
  it('đếm chỗ trống', () => expect(soChoTrong('a ___ b ___')).toBe(2))
  it('thiếu nội dung → lỗi', () => expect(duLieuCauHoi(formMoi()).loi).toBe('Nhập nội dung câu hỏi'))
  it('trắc nghiệm: cần 2 lựa chọn + đáp án đúng; bỏ lựa chọn trống', () => {
    expect(duLieuDapAn(f({ options: [{ key: 'A', text: 'x' }] })).loi).toBe('Cần ít nhất 2 đáp án')
    const opts = [{ key: 'A', text: 'x' }, { key: 'B', text: 'y' }, { key: 'C', text: ' ' }]
    expect(duLieuDapAn(f({ options: opts })).loi).toBe('Chọn đáp án đúng')
    expect(duLieuDapAn(f({ options: opts, correct_answer: 'B' })).duLieu.options).toHaveLength(2)
  })
  it('điền từ: mỗi chỗ trống 1 đáp án', () => {
    expect(duLieuDapAn(f({ type: 'fill_blank', fill_answers: ['a'] })).loi).toBe('Nhập đủ 2 đáp án cho các chỗ trống')
    expect(duLieuDapAn(f({ type: 'fill_blank', fill_answers: [' a ', 'b', 'thừa'] })).duLieu.correct_answer).toBe('a,b')
  })
  it('nối đôi: khoá A-1, B-2…', () => {
    const pairs = [{ left: 'x', right: '1' }, { left: 'y', right: '2' }, { left: '', right: 'bỏ' }]
    expect(duLieuDapAn(f({ type: 'matching', pairs })).duLieu.correct_answer).toBe('A-1,B-2')
  })
  it('kéo thả: từ đúng + từ gây nhiễu thành ngân hàng từ', () => {
    const d = duLieuDapAn(f({ type: 'drag_word', drag_answers: ['chuột', 'phím'], drag_distractors: ['loa', ''] })).duLieu
    expect(d.options.map(o => o.text)).toEqual(['chuột', 'phím', 'loa'])
    expect(d.correct_answer).toBe('chuột,phím')
    expect(duLieuDapAn(f({ type: 'drag_word', question: 'không trống' })).loi).toMatch(/ít nhất 1 chỗ trống/)
    expect(duLieuDapAn(f({ type: 'drag_word', drag_answers: ['chuột'] })).loi).toBe('Nhập đủ 2 từ đúng cho các chỗ trống')
  })
  it('sắp xếp từ: chia cụm bằng /', () => {
    const d = duLieuDapAn(f({ type: 'word_order', correct_answer: 'Con mèo / ngồi / trên bàn', drag_distractors: [''] })).duLieu
    expect(d.options.map(o => o.text)).toEqual(['Con mèo', 'ngồi', 'trên bàn'])
    expect(d.correct_answer).toBe('Con mèo ngồi trên bàn')
  })
  it('tự luận: điểm tối đa + cho nộp tệp', () =>
    expect(duLieuDapAn(f({ type: 'essay', allow_file: true, essay_max_score: '2.5', correct_answer: '' })).duLieu)
      .toEqual({ options: [{ allow_file: true, max_score: 2.5 }], correct_answer: null }))
  it('form từ câu đã lưu: kéo thả tách từ đúng / từ gây nhiễu; lưu lại không đổi', () => {
    const q = { type: 'drag_word', question: 'Kéo ___', grade: 'K3', options: [{ key: '1', text: 'chuột' }, { key: '2', text: 'loa' }], correct_answer: 'chuột' }
    const form = formTuCauHoi(q)
    expect(form).toMatchObject({ drag_answers: ['chuột'], drag_distractors: ['loa'] })
    expect(duLieuCauHoi(form).duLieu).toMatchObject({ correct_answer: 'chuột', options: q.options, topic: null, hint: null })
  })
})
