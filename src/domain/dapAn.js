// Quy tắc so đáp án và tính điểm phần trắc nghiệm (quiz trong bài, luyện tập, đề thi lý thuyết).
// Trước 11/11/2026 có 3 bản chép khác nhau (utils/normalizeAnswer, student/ExamsPage, student/LessonPage) → gộp về đây.
// Hàm thuần: không gọi mạng, không giao diện.
// ⚠️ Hiện trình duyệt tự chấm rồi ghi điểm — máy chủ chưa tự tính lại (vá bảo mật đợt 3, bước 5).
import { sameSentence } from '../utils/wordOrder'

const chu = v => String(v ?? '').trim()
const tachDanhSach = s => chu(s).split(',').map(w => w.trim().toLowerCase())

/**
 * Câu trả lời có đúng không. Câu tự luận (essay) luôn false — không chấm tự động, giáo viên chấm.
 * - matching: các cặp "1-a,2-b" không phân biệt thứ tự cặp
 * - drag_word / fill_blank: nhiều ô cách nhau dấu phẩy, so từng ô theo thứ tự, không phân biệt hoa thường
 * - word_order: so cả câu (xem sameSentence)
 * - còn lại: so nguyên câu, bỏ khoảng trắng hai đầu, không phân biệt hoa thường
 */
export function dungDapAn(type, ans, correct) {
  if (type === 'essay') return false
  if (!chu(ans)) return false
  if (type === 'word_order') return sameSentence(chu(ans), chu(correct))
  if (type === 'matching') {
    const chuan = s => chu(s).split(',').map(p => p.trim()).sort().join(',')
    return chuan(ans) === chuan(correct)
  }
  if (type === 'drag_word' || type === 'fill_blank') {
    const a = tachDanhSach(ans)
    const c = tachDanhSach(correct)
    return a.length === c.length && a.every((w, i) => w === c[i])
  }
  return chu(ans).toLowerCase() === chu(correct).toLowerCase()
}

/**
 * Điểm phần tự chấm của một lượt làm bài. Câu tự luận KHÔNG tính vào mẫu số.
 * @param questions [{ type, correct_answer }]
 * @param answers   câu trả lời theo vị trí câu (mảng hoặc object { 0: '...', 1: '...' })
 * @param thangDiem điểm tối đa phần tự chấm (mặc định 10)
 * @returns { soDung, soCau, diem (làm tròn 1 chữ số), phanTram (số nguyên) }
 */
export function diemTuDong(questions, answers, thangDiem = 10) {
  let soDung = 0
  let soCau = 0
  ;(questions || []).forEach((q, i) => {
    if (q.type === 'essay') return
    soCau++
    if (dungDapAn(q.type, answers?.[i], q.correct_answer)) soDung++
  })
  return {
    soDung,
    soCau,
    diem: soCau > 0 ? Math.round((soDung / soCau) * thangDiem * 10) / 10 : 0,
    phanTram: soCau > 0 ? Math.round((soDung / soCau) * 100) : 0,
  }
}
