// Thứ tự bài học giống trang Học bài của học sinh: Chủ đề (theo tên, "Chủ đề 2" trước "Chủ đề 10")
// → Đơn vị (sort_order, rồi tên) → bài (order, rồi ngày tạo). Bài chưa gắn đơn vị đứng cuối chủ đề.
// Hàm thuần: không gọi mạng, không giao diện.

const soSanhTen = (a = '', b = '') => String(a).localeCompare(String(b), 'vi', { numeric: true })

/**
 * @param lessons  [{ id, title, topic, unit_id, order, created_at }]
 * @param units    [{ id, name, sort_order }]
 * @returns [{ topic, lessons: [...] }] — các chủ đề theo đúng thứ tự, bài trong mỗi chủ đề đã sắp
 */
export function nhomBaiTheoChuDe(lessons = [], units = []) {
  const viTriDonVi = new Map(
    [...units]
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || soSanhTen(a.name, b.name))
      .map((u, i) => [u.id, i])
  )
  const viTri = l => (l.unit_id && viTriDonVi.has(l.unit_id) ? viTriDonVi.get(l.unit_id) : Infinity)
  const sap = (a, b) =>
    viTri(a) - viTri(b) ||
    (a.order ?? 0) - (b.order ?? 0) ||
    String(a.created_at || '').localeCompare(String(b.created_at || ''))

  const theoChuDe = new Map()
  for (const l of lessons) {
    const t = l.topic || ''
    if (!theoChuDe.has(t)) theoChuDe.set(t, [])
    theoChuDe.get(t).push(l)
  }
  return [...theoChuDe.keys()]
    .sort((a, b) => (a === '') - (b === '') || soSanhTen(a, b))   // bài không có chủ đề để cuối
    .map(topic => ({ topic, lessons: theoChuDe.get(topic).sort(sap) }))
}
