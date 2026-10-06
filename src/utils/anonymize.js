// Ẩn họ tên học sinh trước khi gửi dữ liệu sang AI bên ngoài, rồi khôi phục khi hiển thị.
// Bảng tra mã ↔ tên chỉ nằm trên máy giáo viên, không bao giờ rời trình duyệt.

// Thay `students[].name` trong snapshot bằng mã HS01, HS02...
// Trả về { snapshot đã ẩn danh, codeToName }
export function anonymizeSnapshot(snapshot) {
  const codeToName = {}
  if (!Array.isArray(snapshot?.students)) return { snapshot, codeToName }
  const students = snapshot.students.map((s, i) => {
    const code = `HS${String(i + 1).padStart(2, '0')}`
    codeToName[code] = s.name
    return { ...s, name: code }
  })
  return { snapshot: { ...snapshot, students }, codeToName }
}

// Thay tên thật (nếu giáo viên gõ trong câu hỏi) bằng mã. Tên dài khớp trước để không thay nửa chừng.
export function maskNames(text, codeToName) {
  let out = text
  Object.entries(codeToName)
    .filter(([, name]) => name)
    .sort((a, b) => b[1].length - a[1].length)
    .forEach(([code, name]) => {
      out = out.replace(new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), code)
    })
  return out
}

// Đổi mã HS01... trong câu trả lời của AI về tên thật
export function unmaskNames(text, codeToName) {
  return text.replace(/HS\d{2,}/g, code => codeToName[code] || code)
}
