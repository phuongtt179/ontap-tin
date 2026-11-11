import { describe, it, expect } from 'vitest'
import { capNhatTuKetQuaAi } from './chamBai'

describe('capNhatTuKetQuaAi', () => {
  it('đủ trường, đánh dấu do AI chấm, điểm AI giữ riêng ở ai_score', () => {
    const r = { score: 8, comment: 'Tốt', breakdown: [{ ten: 'a', dat: true }], ai_suspect: true, ai_suspect_reason: 'giống mẫu' }
    expect(capNhatTuKetQuaAi(r, 'T')).toEqual({
      score: 8, ai_score: 8, teacher_comment: 'Tốt', graded_by: 'ai', ai_graded_at: 'T',
      ai_breakdown: r.breakdown, ai_suspect: true, ai_suspect_reason: 'giống mẫu',
    })
  })
  it('thiếu bảng tiêu chí / cờ nghi → null / false', () => {
    expect(capNhatTuKetQuaAi({ score: 5, comment: '' }, 'T')).toMatchObject({ ai_breakdown: null, ai_suspect: false, ai_suspect_reason: null })
  })
  it('không truyền giờ → tự lấy giờ hiện tại', () => {
    expect(capNhatTuKetQuaAi({ score: 1 }).ai_graded_at).toMatch(/^\d{4}-\d\d-\d\dT/)
  })
})
