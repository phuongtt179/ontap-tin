import { describe, it, expect } from 'vitest'
import { stickerTheoMuc, stickerConThieu, mocChuoi, MOC_CHUOI_NGAY } from './sticker'

describe('stickerTheoMuc', () => {
  it('T = 3, H = 1, C = 0, mức lạ = 0', () => {
    expect([stickerTheoMuc('T'), stickerTheoMuc('H'), stickerTheoMuc('C'), stickerTheoMuc(null), stickerTheoMuc('X')]).toEqual([3, 1, 0, 0, 0])
  })
})

describe('stickerConThieu — duyệt lại không cộng trùng, không trừ', () => {
  it.each([
    [0, 'T', 3], [0, 'H', 1], [0, 'C', 0],   // lần đầu
    [0, 'T', 3], [1, 'T', 2], [3, 'T', 0],   // nộp lại, mức tăng → chỉ cộng phần chênh
    [3, 'H', 0], [3, 'C', 0], [1, 'C', 0],   // hạ mức → không trừ
    [null, 'H', 1], [undefined, 'T', 3],
  ])('đã thưởng %s, mức %s → +%i', (cu, muc, kq) => expect(stickerConThieu(cu, muc)).toBe(kq))
})

describe('mocChuoi', () => {
  it('không có thưởng → null', () => {
    expect(mocChuoi(5, 0)).toBeNull()
    expect(mocChuoi(3, null)).toBeNull()
  })
  it('mốc quen → nhãn sẵn; mốc lạ máy chủ báo → nhãn trống, số sticker theo máy chủ', () => {
    expect(mocChuoi(7, 7)).toBe(MOC_CHUOI_NGAY[7])
    expect(mocChuoi(60, 60)).toEqual({ stickers: 60, emoji: '🔥', label: '' })
  })
})
