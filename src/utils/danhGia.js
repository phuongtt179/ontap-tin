// Đánh giá bài thực hành (giáo viên): AI chấm nháp gợi ý mức + tiêu chí → giáo viên duyệt / đổi mức T/H/C.
// Dùng cho trang Chấm bài (theo bài / theo học sinh).
import { supabase } from '../lib/supabase'
import { gradeStudent } from './aiGrader'
import { adjustStickerCount } from './stickerAward'
import { mucTuDiem, stickerTheoMuc, DIEM_DAI_DIEN } from './muc'

export function parseTasks(instructions) {
  if (!instructions) return [{ instructions: '' }]
  try { const a = JSON.parse(instructions); if (Array.isArray(a) && a.length) return a } catch { /* chuỗi thường */ }
  return [{ instructions }]
}

/** AI chấm nháp 1 bài (chạy trên máy giáo viên) → cập nhật DB, trả về bản ghi mới. Học sinh chưa thấy gì. */
export async function aiChamNhap(sub, taskDef) {
  const { results } = await gradeStudent([sub], [taskDef])
  const r = results?.[0]
  if (!r) throw new Error('AI chưa trả về kết quả')
  const updates = {
    score: r.score, ai_score: r.score, teacher_comment: r.comment, graded_by: 'ai', ai_graded_at: new Date().toISOString(),
    ai_breakdown: r.breakdown || null, ai_suspect: !!r.ai_suspect, ai_suspect_reason: r.ai_suspect_reason || null,
  }
  const { error } = await supabase.from('lesson_submissions').update(updates).eq('id', sub.id)
  if (error) throw error
  return { ...sub, ...updates }
}

/**
 * Giáo viên chốt đánh giá: mức T/H/C + nhận xét → học sinh thấy. Cộng sticker theo mức (T 3 · H 1 · C 0) một lần.
 * Trả về bản ghi mới (null nếu lỗi).
 */
export async function luuDanhGia(sub, { muc, comment, choNopLai = false }) {
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
    ...((goiY !== muc || doiNhanXet || sub.graded_by !== 'ai') && { graded_by: 'teacher' }),
    ...(awardSticker && { sticker_awarded: true }),
    ...(choNopLai && { allow_resubmit: true }),
  }
  const { error } = await supabase.from('lesson_submissions').update(updates).eq('id', sub.id)
  if (error) return { loi: error.message }
  if (awardSticker) {
    const bonus = stickerTheoMuc(muc)
    if (bonus > 0) await adjustStickerCount(sub.user_id, bonus, { affectsTotal: true })
  }
  return { moi: { ...sub, ...updates } }
}
