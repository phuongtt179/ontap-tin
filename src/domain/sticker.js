// Quy tắc sticker / phần thưởng / chuỗi ngày học. Hàm thuần: không gọi mạng, không giao diện.
//
// Phần nào do MÁY CHỦ quyết định (trình duyệt không đổi được) — sửa ở SQL, không sửa ở đây:
//   · sticker làm quiz / nộp bài 1 lần mỗi bài: award_sticker_once   (sql/2026-10-13_sticker_once.sql)
//   · chuỗi ngày học + sticker mốc chuỗi:       record_activity      (sql/2026-10-13_secure_profiles.sql)
//   · đổi quà (trừ sticker):                    redeem_reward        (sql/2026-10-13_secure_profiles.sql)

/** Ngưỡng sticker để đổi quà khi giáo viên chưa cài cho khoá (bảng reward_configs) */
export const NGUONG_DOI_QUA_MAC_DINH = 50

/** Giá 1 món quà khi chưa đặt (khớp DEFAULT 50 của cột reward_items.sticker_cost) */
export const GIA_QUA_MAC_DINH = 50

/** Sticker thưởng khi giáo viên duyệt bài thực hành theo mức: T = 3, H = 1, C = 0 */
export function stickerTheoMuc(muc) {
  return { T: 3, H: 1, C: 0 }[muc] ?? 0
}

/**
 * Bài đã được thưởng `daThuong` sticker, nay giáo viên duyệt mức `muc` → cộng thêm bao nhiêu.
 * Chỉ cộng phần còn thiếu (C → T: +3, H → T: +2); giữ nguyên hoặc hạ mức thì 0 — không bao giờ trừ.
 */
export function stickerConThieu(daThuong, muc) {
  return Math.max(0, stickerTheoMuc(muc) - (daThuong ?? 0))
}

/**
 * Nhãn các mốc chuỗi ngày học. CHỈ để hiển thị — số sticker thật do record_activity trên máy chủ quyết định
 * (3 / 7 / 14 / 30 ngày → 3 / 7 / 14 / 30 sticker). Đổi mốc phải đổi CẢ hai nơi.
 */
export const MOC_CHUOI_NGAY = {
  3: { stickers: 3, emoji: '🔥', label: '3 ngày liên tiếp!' },
  7: { stickers: 7, emoji: '🔥🔥', label: '1 tuần liên tiếp!' },
  14: { stickers: 14, emoji: '🔥🔥🔥', label: '2 tuần liên tiếp!' },
  30: { stickers: 30, emoji: '🏆', label: '1 tháng liên tiếp!' },
}

/** mốc chuỗi để hiện khi máy chủ báo vừa cộng `bonus` sticker ở ngày thứ `soNgay` (null nếu không có thưởng) */
export function mocChuoi(soNgay, bonus) {
  if (!(bonus > 0)) return null
  return MOC_CHUOI_NGAY[soNgay] ?? { stickers: bonus, emoji: '🔥', label: '' }
}
