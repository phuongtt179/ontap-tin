import { describe, it, expect } from 'vitest'
import { diemTongLuot, diemCaoNhat, testHopLe, loiDeThi, duLieuDeThi, deDanhChoLop } from './deThi'

const DE = { has_practical: true, theory_weight: 60, practical_weight: 40 }

describe('điểm đề thi', () => {
  it('đề chỉ lý thuyết → điểm lý thuyết', () => expect(diemTongLuot({ has_practical: false }, { score: 7.5 })).toBe(7.5))
  it('có thực hành → theo hệ số, làm tròn 1 chữ số; chưa chấm thực hành = 0', () => {
    expect(diemTongLuot(DE, { score: 8, practical_score: 7 })).toBe(7.6)
    expect(diemTongLuot(DE, { score: 6.7, practical_score: 9.3 })).toBe(7.7)
    expect(diemTongLuot(DE, { score: 10 })).toBe(6)
  })
  it('điểm cao nhất chỉ tính lượt đã nộp', () => {
    expect(diemCaoNhat(DE, [{ score: 10, practical_score: 10, submitted_at: null }, { score: 5, practical_score: 5, submitted_at: 'x' }])).toBe(5)
    expect(diemCaoNhat(DE, [{ score: 10, submitted_at: null }])).toBeNull()
  })
})

describe('soạn đề', () => {
  const form = {
    title: ' Giữa kỳ ', grade: 'K3', class_names: [], time_limit: 0, max_attempts: 2, is_active: true, show_answer: true, show_score: false,
    question_ids: [1, 2], has_practical: false, practical_type: 'python', practical_instructions: '  ', theory_weight: 70, practical_weight: 30, practical_rubric: '',
  }
  it('báo lỗi trước khi lưu', () => {
    expect(loiDeThi({ ...form, title: ' ' })).toBe('Nhập tên đề thi')
    expect(loiDeThi({ ...form, question_ids: [] })).toBe('Chưa chọn câu hỏi nào')
    expect(loiDeThi({ ...form, has_practical: true }, [{ expected: ' ' }])).toMatch(/Python cần ít nhất 1 test/)
    expect(loiDeThi({ ...form, has_practical: true }, [{ expected: '3' }])).toBeNull()
    expect(loiDeThi(form)).toBeNull()
  })
  it('test hợp lệ: có output mong đợi', () => expect(testHopLe([{ expected: '' }, { expected: 0 }, { expected: 'a' }])).toHaveLength(2))
  it('không thực hành → 100% lý thuyết, xoá cột thực hành', () =>
    expect(duLieuDeThi(form)).toMatchObject({ title: 'Giữa kỳ', class_names: null, time_limit: null, theory_weight: 100, practical_weight: 0,
      practical_type: null, practical_instructions: null, practical_rubric: null }))
  it('có thực hành + câu hỏi → giữ hệ số; chỉ thực hành → 100% thực hành', () => {
    const th = { ...form, has_practical: true, practical_instructions: ' Làm ', class_names: ['Ca 1'] }
    expect(duLieuDeThi(th)).toMatchObject({ theory_weight: 70, practical_weight: 30, practical_type: 'python', practical_instructions: 'Làm', class_names: ['Ca 1'] })
    expect(duLieuDeThi({ ...th, question_ids: [] })).toMatchObject({ theory_weight: 0, practical_weight: 100 })
  })
  it('đề dành cho lớp', () => {
    expect(deDanhChoLop({ class_names: null }, 'Ca 1')).toBe(true)
    expect(deDanhChoLop({ class_names: ['Ca 2'] }, 'Ca 1')).toBe(false)
    expect(deDanhChoLop({ class_names: ['Ca 2'] }, '')).toBe(true)
  })
})
