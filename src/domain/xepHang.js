// Xếp hạng điểm của học sinh (trang tổng quan giáo viên). Hàm thuần.

/**
 * Gom lượt làm bài theo em → { full_name, class_name, scores, count, avg (1 chữ số), best }.
 * Chỉ tính lượt CÓ ĐIỂM — lượt bỏ dở (chưa nộp, score null) không kéo điểm trung bình xuống.
 * ten: { id: full_name }, lop: { id: tên lớp (hoặc khoá) }
 */
export function gomDiemTheoEm(cacLuot, ten = {}, lop = {}) {
  const theoEm = {}
  cacLuot.filter(l => l.score != null).forEach(l => {
    ;(theoEm[l.user_id] ||= { full_name: ten[l.user_id] || '—', class_name: lop[l.user_id] || '—', scores: [] }).scores.push(Number(l.score))
  })
  return Object.values(theoEm).map(u => ({
    ...u,
    count: u.scores.length,
    avg: Math.round(u.scores.reduce((a, b) => a + b, 0) / u.scores.length * 10) / 10,
    best: Math.max(...u.scores),
  }))
}
