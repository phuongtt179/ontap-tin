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

import { phanCua, baiCuaPhan, gomTheoHocSinh, capNhatKhiGvChot, capNhatKhiDuyetAi, canAiCham, locVaXepHocSinh, thongKeLop } from './chamBai'

describe('trang chấm bài của giáo viên', () => {
  it('phần thực hành của bài nộp; bài cũ không ghi → phần 0', () => {
    expect(phanCua({ content_json: { task_index: 2 } })).toBe(2)
    expect(phanCua({})).toBe(0)
    const ds = [{ id: 'a' }, { id: 'b', content_json: { task_index: 1 } }]
    expect(baiCuaPhan(ds, 1).id).toBe('b')
    expect(baiCuaPhan(ds, 0).id).toBe('a')
    expect(baiCuaPhan(undefined, 0)).toBeUndefined()
  })
  it('gom theo học sinh', () => {
    const d = [{ user_id: 'u', id: 1 }, { user_id: 'u', id: 2 }, { user_id: 'v', id: 3 }]
    expect(gomTheoHocSinh(d, true)).toEqual({ u: [d[0], d[1]], v: [d[2]] })
    expect(gomTheoHocSinh(d)).toEqual({ u: d[1], v: d[2] })
  })
  describe('giáo viên chốt mức', () => {
    it('mức không hợp lệ → null', () => expect(capNhatKhiGvChot({}, '', 'x')).toBeNull())
    it('giữ đúng mức AI gợi ý → giữ điểm AI', () =>
      expect(capNhatKhiGvChot({ score: 8.5, graded_by: 'ai', ai_score: 8.5 }, 'T', 'Tốt', 'L')).toEqual({
        teacher_comment: 'Tốt', reviewed_at: 'L', muc: 'T', score: 8.5, graded_by: 'teacher', sticker_awarded: true,
      }))
    it('đổi mức → điểm đại diện của mức; bài AI cũ chưa có ai_score → lưu lại điểm AI gốc', () =>
      expect(capNhatKhiGvChot({ score: 8.5, graded_by: 'ai' }, 'C', undefined, 'L')).toMatchObject({ score: 3, ai_score: 8.5, teacher_comment: '' }))
    it('đã đánh dấu thưởng thì không ghi lại cờ', () =>
      expect(capNhatKhiGvChot({ sticker_awarded: true }, 'H', '', 'L')).not.toHaveProperty('sticker_awarded'))
  })
  it('duyệt nguyên mức AI', () => {
    expect(capNhatKhiDuyetAi({ score: 6 }, 'L')).toEqual({ reviewed_at: 'L', muc: 'H', sticker_awarded: true })
    expect(capNhatKhiDuyetAi({ score: null }, 'L')).toEqual({ reviewed_at: 'L', muc: null })
    expect(capNhatKhiDuyetAi({ score: 9, sticker_awarded: true }, 'L')).toEqual({ reviewed_at: 'L', muc: 'T' })
  })
  it('cần AI chấm: có bài chưa duyệt mà AI chưa chấm', () => {
    expect(canAiCham([{ graded_by: 'ai' }, { reviewed_at: 'x' }])).toBe(false)
    expect(canAiCham([{ graded_by: 'ai' }, {}])).toBe(true)
    expect(canAiCham(undefined)).toBe(false)
  })
  it('lọc + xếp học sinh: nộp nhiều lên trước, rồi lớp, rồi tên', () => {
    const hs = [{ id: 1, full_name: 'Bình', class_name: '4A' }, { id: 2, full_name: 'An', class_name: '4B' },
      { id: 3, full_name: 'An', class_name: '4A' }, { id: 4, full_name: 'Chi', class_name: '4A' }]
    const bn = { 4: [{}, {}] }
    expect(locVaXepHocSinh(hs, {}, bn).map(s => s.id)).toEqual([4, 3, 1, 2])
    expect(locVaXepHocSinh(hs, { lop: '4A', tim: ' an ' }, bn).map(s => s.id)).toEqual([3])
    expect(hs.map(s => s.id)).toEqual([1, 2, 3, 4])   // không đổi mảng gốc
  })
  it('thống kê lớp', () => {
    const hs = [{ id: 1 }, { id: 2 }]
    const td = { 1: { completed: true, video_watched: true, quiz_passed: true }, 2: { video_watched: true } }
    expect(thongKeLop(hs, td, { 1: [{}, {}], 2: [{}] }, { coVideo: true, coQuiz: false, coThucHanh: true, soPhan: 2 }))
      .toEqual({ tong: 2, hoanThanh: 1, video: 2, quiz: null, thucHanh: 1 })
  })
})

import { nhomBaiNopTheoMuc, goiYCua, mucBanDau } from './chamBai'
describe('trang Chấm bài — theo học sinh', () => {
  const nhom = [
    { topic: 'CĐ A', lessons: [{ id: 'a1', title: 'A1' }, { id: 'a2', title: 'A2' }] },
    { topic: 'CĐ B', lessons: [{ id: 'b1', title: 'B1' }] },
  ]
  const s = (id, lesson_id, task_index) => ({ id, lesson_id, content_json: { task_index } })
  it('xếp theo chủ đề → bài theo chương trình → phần, không theo giờ nộp; bỏ bài chưa nộp', () => {
    const kq = nhomBaiNopTheoMuc([s(1, 'b1', 0), s(2, 'a2', 1), s(3, 'a2', 0)], nhom)
    expect(kq.map(g => g.topic)).toEqual(['CĐ A', 'CĐ B'])
    expect(kq[0].bai.map(b => b.lesson.id)).toEqual(['a2'])
    expect(kq[0].bai[0].subs.map(x => x.id)).toEqual([3, 2])
  })
  it('bài không có trong danh sách → "Bài khác" ở cuối', () => {
    const kq = nhomBaiNopTheoMuc([s(1, 'x', 0), s(2, 'a1', 0)], nhom, { x: { id: 'x', title: 'X' } })
    expect(kq.map(g => g.topic)).toEqual(['CĐ A', 'Bài khác'])
    expect(kq[1].bai[0].lesson.title).toBe('X')
  })
  it('nộp lại (chưa duyệt, điểm đã xoá) → không lấy gợi ý AI của bản cũ', () => {
    expect(goiYCua({ reviewed_at: null, score: null, ai_score: 9, graded_by: 'ai' })).toBe(null)
    expect(mucBanDau({ reviewed_at: null, score: null, muc: 'T' })).toBe('')
  })
})
