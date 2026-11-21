// Khoá bài theo lớp (2 tầng): giáo viên mở CHỦ ĐỀ cho lớp (class_topic_unlock) rồi tick từng BÀI trong chủ đề
// (class_lesson_unlock). Học sinh không thuộc lớp nào → moKhoa = null → coi như mở hết bài đã xuất bản.
// Hàm thuần: không gọi mạng, không giao diện. Dùng ở trang Học bài (chặn vào thẳng URL) và trang Con đường bài học.
import { topicKeyOf } from '../utils/lessonSteps'

/**
 * @param lesson  { id, topic }
 * @param moKhoa  { chuDe: Set<topic>, bai: Set|Map<lesson_id> } | null
 */
export function baiDaMoChoLop(lesson, moKhoa) {
  if (!moKhoa) return true
  return moKhoa.chuDe.has(topicKeyOf(lesson)) && moKhoa.bai.has(lesson.id)
}

/**
 * Lộ trình khoá cho AI trả lời câu hỏi chương trình học: "• Đơn vị: bài, bài" — CHỈ bài đã mở cho lớp
 * (không để AI biết / gợi ý tên bài học sinh chưa được mở).
 * @param donVi  đơn vị đã sắp theo thứ tự · @param baiHoc bài đã xuất bản (đã sắp theo thứ tự bài)
 */
export function loTrinhKhoa(donVi = [], baiHoc = [], moKhoa = null) {
  const bai = baiHoc.filter(l => baiDaMoChoLop(l, moKhoa))
  const dong = []
  donVi.forEach(u => {
    const ten = bai.filter(l => l.unit_id === u.id).map(l => l.title)
    if (ten.length) dong.push(`• ${u.name}: ${ten.join(', ')}`)
  })
  const khongDonVi = bai.filter(l => !l.unit_id).map(l => l.title)
  if (khongDonVi.length) dong.push(`• Bài khác: ${khongDonVi.join(', ')}`)
  return dong.join('\n')
}
