// Đánh giá bài thực hành theo MỨC (Thông tư 27): T = Hoàn thành tốt · H = Hoàn thành · C = Chưa hoàn thành.
// Từ 29/10/2026 không hiện điểm số nữa; giáo viên chọn mức (cột lesson_submissions.muc).
// Điểm AI chấm nháp (cột score, nội bộ) chỉ dùng để GỢI Ý mức cho giáo viên.

export const MUC = {
  T: { ten: 'Hoàn thành tốt', ngan: 'T', cls: 'bg-green-100 text-green-700 border-green-300', nut: 'bg-green-600 text-white' },
  H: { ten: 'Hoàn thành', ngan: 'H', cls: 'bg-blue-100 text-blue-700 border-blue-300', nut: 'bg-blue-600 text-white' },
  C: { ten: 'Chưa hoàn thành', ngan: 'C', cls: 'bg-orange-100 text-orange-700 border-orange-300', nut: 'bg-orange-500 text-white' },
}
export const CAC_MUC = ['T', 'H', 'C']

/** gợi ý mức từ điểm AI chấm nháp (thang 10) */
export function mucTuDiem(score) {
  if (score == null || isNaN(Number(score))) return null
  const s = Number(score)
  return s >= 8 ? 'T' : s >= 5 ? 'H' : 'C'
}

/** mức của 1 bài nộp: mức giáo viên đã chọn; bài cũ (trước khi có mức) thì quy từ điểm */
export function mucCua(sub) {
  return sub?.muc || mucTuDiem(sub?.score)
}

/** điểm đại diện khi giáo viên đổi mức (giữ cho các báo cáo nội bộ dùng điểm vẫn có số liệu hợp lý) */
export const DIEM_DAI_DIEN = { T: 9, H: 6.5, C: 3 }

/** sticker thưởng khi giáo viên duyệt: T = 3, H = 1, C = 0 */
export function stickerTheoMuc(muc) {
  return { T: 3, H: 1, C: 0 }[muc] ?? 0
}
