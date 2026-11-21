import { describe, it, expect } from 'vitest'
import { datQuiz, trangThaiBuoc } from './tienDoBaiHoc'

describe('datQuiz — đạt khi đúng ≥ 2/3', () => {
  it.each([[2, 3, true], [1, 3, false], [4, 6, true], [3, 6, false], [7, 10, true], [6, 10, false], [5, 5, true], [0, 0, false]])(
    '%i/%i → %s', (dung, tong, kq) => expect(datQuiz(dung, tong)).toBe(kq))
})

describe('trangThaiBuoc', () => {
  const baiDu = { ai_context: 'x', video_url: 'v', has_slides: true, has_practice: true, question_ids: ['a', 'b'] }

  it('bài trống → không có bước nào, coi như hoàn thành', () => {
    expect(trangThaiBuoc({}, null)).toMatchObject({ tongBuoc: 0, soBuocXong: 0, hoanThanh: true })
  })
  it('bài đủ 5 bước, mới làm 2 → chưa hoàn thành', () => {
    const r = trangThaiBuoc(baiDu, { theory_read: true, quiz_passed: true })
    expect(r).toMatchObject({ tongBuoc: 5, soBuocXong: 2, hoanThanh: false })
    expect(r.xong).toEqual({ theory: true, video: false, pptx: false, quiz: true, practice: false })
  })
  it('làm đủ 5 bước → hoàn thành', () => {
    const p = { theory_read: true, video_watched: true, pptx_viewed: true, quiz_passed: true, practice_submitted: true }
    expect(trangThaiBuoc(baiDu, p).hoanThanh).toBe(true)
  })
  it('pptx_url hoặc bài giảng web đều tính là có bước Bài giảng', () => {
    expect(trangThaiBuoc({ pptx_url: 'f.pdf' }, null).co.pptx).toBe(true)
    expect(trangThaiBuoc({ has_slides: true }, null).co.pptx).toBe(true)
  })
  it('soCauQuiz = 0 (câu đã bị xoá) → không có bước quiz dù bài còn question_ids', () => {
    expect(trangThaiBuoc(baiDu, null, 0).co.quiz).toBe(false)
    expect(trangThaiBuoc(baiDu, null).co.quiz).toBe(true)
  })
  it('bài có tiến độ thừa (đã xem video nhưng bài không có video) không đếm vào số bước xong', () => {
    expect(trangThaiBuoc({ has_practice: true }, { video_watched: true })).toMatchObject({ tongBuoc: 1, soBuocXong: 0 })
  })
})
