// Quy tắc chấm bài thực hành. Hàm thuần: không gọi mạng, không giao diện. Dùng cả ở trang web lẫn máy chủ (api/).
import { CAC_MUC, mucCua, mucTuDiem, DIEM_DAI_DIEN } from '../utils/muc.js'

/**
 * Kết quả AI chấm 1 bài ({ score, comment, breakdown, ai_suspect, ai_suspect_reason })
 * → các cột ghi vào lesson_submissions. Điểm AI chỉ là NHÁP: giáo viên duyệt mới thành mức T/H/C cho học sinh thấy.
 */
export function capNhatTuKetQuaAi(r, luc = new Date().toISOString()) {
  return {
    score: r.score, ai_score: r.score, teacher_comment: r.comment, graded_by: 'ai',
    ai_graded_at: luc, ai_breakdown: r.breakdown || null,
    ai_suspect: !!r.ai_suspect, ai_suspect_reason: r.ai_suspect_reason || null,
  }
}

// ── Trang chấm bài thực hành của giáo viên (/teacher/lessons/:id/submissions) ──

/** bài nộp thuộc phần thực hành thứ mấy (bài cũ không ghi → phần 0) */
export const phanCua = sub => sub?.content_json?.task_index ?? 0

/** bài nộp của phần thứ i trong danh sách bài nộp của 1 học sinh */
export const baiCuaPhan = (subs, i) => (subs || []).find(s => phanCua(s) === i)

/** gom danh sách dòng theo user_id: nhieu=true → { id: [dòng...] }, ngược lại { id: dòng } */
export function gomTheoHocSinh(dong, nhieu) {
  const m = {}
  ;(dong || []).forEach(d => {
    if (nhieu) (m[d.user_id] ||= []).push(d)
    else m[d.user_id] = d
  })
  return m
}

/**
 * Giáo viên chốt mức + nhận xét 1 bài → các cột ghi vào lesson_submissions.
 * Giữ điểm AI nếu giáo viên giữ đúng mức AI gợi ý; đổi mức → điểm nội bộ theo mức (học sinh không thấy điểm).
 * Trả null nếu mức không hợp lệ.
 */
export function capNhatKhiGvChot(sub, muc, nhanXet, luc = new Date().toISOString()) {
  if (!CAC_MUC.includes(muc)) return null
  return {
    teacher_comment: nhanXet ?? '',
    reviewed_at: luc,
    muc,
    score: mucTuDiem(sub.score) === muc ? sub.score : DIEM_DAI_DIEN[muc],
    graded_by: 'teacher',
    // bài AI chấm trước khi có cột ai_score: giữ lại điểm AI gốc trước khi bị ghi đè (để đo độ khớp)
    ...(sub.graded_by === 'ai' && sub.ai_score == null && sub.score != null && { ai_score: sub.score }),
    ...(!sub.sticker_awarded && { sticker_awarded: true }),
  }
}

/** giáo viên duyệt nguyên mức AI gợi ý (không sửa) → các cột ghi */
export function capNhatKhiDuyetAi(sub, luc = new Date().toISOString()) {
  const muc = mucCua(sub)
  return { reviewed_at: luc, muc, ...(!sub.sticker_awarded && muc != null && { sticker_awarded: true }) }
}

/** học sinh có bài mới cần AI chấm (chưa duyệt, AI chưa chấm) */
export const canAiCham = subs => (subs || []).some(s => s && !s.reviewed_at && s.graded_by !== 'ai')

/**
 * Lọc theo lớp + tên, rồi xếp: em nộp nhiều bài lên trước, cùng số bài thì theo lớp → tên.
 * bainop: { userId: [bài nộp] }
 */
export function locVaXepHocSinh(hocSinh, { lop = '', tim = '' } = {}, bainop = {}) {
  const t = tim.trim().toLowerCase()
  return hocSinh
    .filter(s => (!lop || s.class_name === lop) && (!t || s.full_name.toLowerCase().includes(t)))
    .sort((a, b) => ((bainop[b.id] || []).length - (bainop[a.id] || []).length)
      || (a.class_name || '').localeCompare(b.class_name || '') || a.full_name.localeCompare(b.full_name))
}

/** số liệu các thẻ tổng kết; mục bài không có → null */
export function thongKeLop(hocSinh, tienDo, bainop, { coVideo, coQuiz, coThucHanh, soPhan }) {
  const dem = f => hocSinh.filter(f).length
  return {
    tong: hocSinh.length,
    hoanThanh: dem(s => tienDo[s.id]?.completed),
    video: coVideo ? dem(s => tienDo[s.id]?.video_watched) : null,
    quiz: coQuiz ? dem(s => tienDo[s.id]?.quiz_passed) : null,
    thucHanh: coThucHanh ? dem(s => (bainop[s.id] || []).length >= soPhan) : null,
  }
}
