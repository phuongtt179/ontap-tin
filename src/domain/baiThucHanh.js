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
