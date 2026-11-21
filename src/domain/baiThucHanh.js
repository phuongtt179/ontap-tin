// Đề thực hành của một bài học — cột lessons.practice_instructions.
// Có 2 dạng lưu: (1) chuỗi JSON mảng [{ instructions, ... }, ...] khi bài có nhiều bài tập;
// (2) chuỗi thường (bài cũ, chỉ 1 đề). Hàm DUY NHẤT để đọc — dùng cả ở trang web lẫn máy chủ (api/).
// Hàm thuần: không gọi mạng, không giao diện.

/** chuỗi practice_instructions → mảng bài tập (luôn có ít nhất 1 phần tử) */
export function parseTasks(instructions) {
  if (!instructions) return [{ instructions: '' }]
  try {
    const arr = JSON.parse(instructions)
    if (Array.isArray(arr) && arr.length > 0) return arr
  } catch { /* không phải JSON → coi cả chuỗi là 1 đề */ }
  return [{ instructions }]
}

/** học liệu kèm bài tập (tệp mẫu, ảnh, âm thanh để học sinh tải về dùng) → [{ url, ten }] hợp lệ */
export function hocLieuCua(t) {
  return (Array.isArray(t?.hoc_lieu) ? t.hoc_lieu : []).filter(h => h && typeof h.url === 'string' && h.url)
}

/** dung lượng tối đa 1 tệp học liệu (MB) — giới hạn tải lên của gói Cloudinary miễn phí */
export const TOI_DA_MB_HOC_LIEU = 10

/** mọi tệp của 1 bài tập: tệp đề + học liệu */
export function tepCuaBaiTap(t) {
  return [t?.instruction_file_url, ...hocLieuCua(t).map(h => h.url)].filter(Boolean)
}

/** bài tập có nội dung thật (đề, tiêu chí, tệp đề hoặc học liệu) — bài trống không lưu */
export function baiCoNoiDung(t) {
  return !!((t?.instructions || '').trim() || (t?.rubric || '').trim() || t?.instruction_file_url || hocLieuCua(t).length)
}

/** tiêu chí chấm AI soạn lỡ trả dạng object { tiêu chí: điểm } → chữ đọc được */
export function tieuChiThanhChu(rubric) {
  if (!rubric) return ''
  if (typeof rubric === 'string') return rubric
  if (typeof rubric === 'object') return Object.entries(rubric).map(([k, v]) => `${k}: ${v}đ`).join('\n')
  return String(rubric)
}

/**
 * Tệp trên Cloudinary không còn bài nào dùng sau khi sửa bài (thay bài giảng / gỡ tệp đề) → nên xoá.
 * @param baiCu { pptx_url, practice_instructions } · @param pptxMoi · @param baiTapMoi [{ instruction_file_url, hoc_lieu }]
 */
export function tepKhongConDung(baiCu, pptxMoi, baiTapMoi = []) {
  const cu = new Set()
  if (baiCu?.pptx_url) cu.add(baiCu.pptx_url)
  try {
    const ds = JSON.parse(baiCu?.practice_instructions || '[]')
    if (Array.isArray(ds)) ds.forEach(t => tepCuaBaiTap(t).forEach(u => cu.add(u)))
  } catch { /* đề cũ dạng chữ: không có tệp */ }
  const moi = new Set()
  if (pptxMoi) moi.add(pptxMoi)
  baiTapMoi.forEach(t => tepCuaBaiTap(t).forEach(u => moi.add(u)))
  return [...cu].filter(u => !moi.has(u) && /res\.cloudinary\.com/.test(u))
}
