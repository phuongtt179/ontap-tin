// Đánh giá bài thực hành (giáo viên): AI chấm nháp gợi ý mức + tiêu chí → giáo viên duyệt / đổi mức T/H/C.
// Dùng cho trang Chấm bài (theo bài / theo học sinh).
import { gradeStudent } from './aiGrader'
import { thuongStickerTheoMuc } from './stickerAward'
import { mucTuDiem, DIEM_DAI_DIEN } from './muc'
import { capNhatBaiNop } from '../data/baiNop'
import { capNhatTuKetQuaAi } from '../domain/chamBai'

/** AI chấm nháp 1 bài (chạy trên máy giáo viên) → cập nhật DB, trả về bản ghi mới. Học sinh chưa thấy gì. */
export async function aiChamNhap(sub, taskDef) {
  const { results } = await gradeStudent([sub], [taskDef])
  const r = results?.[0]
  if (!r) throw new Error('AI chưa trả về kết quả')
  const updates = capNhatTuKetQuaAi(r)
  const { error } = await capNhatBaiNop(sub.id, updates)
  if (error) throw error
  return { ...sub, ...updates }
}

/**
 * Giáo viên chốt đánh giá: mức T/H/C + nhận xét → học sinh thấy. Cộng sticker theo mức (T 3 · H 1 · C 0); nộp lại mà mức tăng thì cộng phần chênh.
 * Trả về bản ghi mới (null nếu lỗi).
 */
export async function luuDanhGia(sub, { muc, comment, choNopLai = false, breakdown = null }) {
  const goiY = mucTuDiem(sub.score)
  const doiNhanXet = comment != null && comment !== (sub.teacher_comment || '')
  const awardSticker = !sub.sticker_awarded
  const updates = {
    reviewed_at: new Date().toISOString(),
    muc,
    ...(comment != null && { teacher_comment: comment }),
    // điểm nội bộ: giữ điểm AI nếu giữ đúng mức gợi ý; đổi mức → điểm đại diện của mức (học sinh không thấy điểm)
    ...(goiY !== muc && { score: DIEM_DAI_DIEN[muc] }),
    ...(sub.graded_by === 'ai' && sub.ai_score == null && sub.score != null && { ai_score: sub.score }),
    // Bài nộp lại chưa được AI chấm lại: bỏ điểm + tiêu chí AI của bản cũ để học sinh không thấy, số liệu độ khớp không sai
    ...(sub.score == null && { ai_score: null, ai_breakdown: null, ai_suspect: false, ai_suspect_reason: null }),
    ...((goiY !== muc || doiNhanXet || breakdown || sub.graded_by !== 'ai') && { graded_by: 'teacher' }),
    // Giáo viên sửa bảng tiêu chí AI (đạt / chưa đạt, ghi chú) → học sinh thấy bản đã sửa
    ...(breakdown && { ai_breakdown: breakdown }),
    ...(awardSticker && { sticker_awarded: true }),
    ...(choNopLai && { allow_resubmit: true }),
  }
  const { error } = await capNhatBaiNop(sub.id, updates)
  if (error) return { loi: error.message }
  await thuongStickerTheoMuc(sub.id, sub.user_id, muc)
  return { moi: { ...sub, ...updates } }
}
