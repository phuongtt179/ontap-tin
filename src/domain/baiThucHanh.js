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

/** bài tập có nội dung thật (đề, tiêu chí hoặc tệp đề) — bài trống không lưu */
export function baiCoNoiDung(t) {
  return !!((t?.instructions || '').trim() || (t?.rubric || '').trim() || t?.instruction_file_url)
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
 * @param baiCu { pptx_url, practice_instructions } · @param pptxMoi · @param baiTapMoi [{ instruction_file_url }]
 */
export function tepKhongConDung(baiCu, pptxMoi, baiTapMoi = []) {
  const cu = new Set()
  if (baiCu?.pptx_url) cu.add(baiCu.pptx_url)
  try {
    const ds = JSON.parse(baiCu?.practice_instructions || '[]')
    if (Array.isArray(ds)) ds.forEach(t => { if (t?.instruction_file_url) cu.add(t.instruction_file_url) })
  } catch { /* đề cũ dạng chữ: không có tệp */ }
  const moi = new Set()
  if (pptxMoi) moi.add(pptxMoi)
  baiTapMoi.forEach(t => { if (t?.instruction_file_url) moi.add(t.instruction_file_url) })
  return [...cu].filter(u => !moi.has(u) && /res\.cloudinary\.com/.test(u))
}
