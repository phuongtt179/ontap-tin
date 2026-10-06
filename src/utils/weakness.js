// Phân tích bảng điểm AI (lesson_submissions.ai_breakdown = [{ criterion, earned, max, note? }])
// để tìm "lỗi hay gặp" — dùng cho (1) gia sư AI cá nhân hóa theo từng em, (2) thẻ lỗi chung của lớp.

const norm = s => String(s || '').trim().toLowerCase()
const lostOf = b => (Number(b.max) || 0) - (Number(b.earned) || 0)

// rows: [{ ai_breakdown, lessons: { title } }] — mới nhất trước.
// Trả về chuỗi ngắn gọn cho gia sư AI, hoặc '' nếu chưa có dữ liệu.
export function buildWeaknessProfile(rows, { top = 4, maxChars = 700 } = {}) {
  const map = new Map()
  for (const row of rows || []) {
    for (const b of Array.isArray(row.ai_breakdown) ? row.ai_breakdown : []) {
      if (!b?.criterion || lostOf(b) <= 0) continue
      const key = norm(b.criterion)
      const cur = map.get(key) || { criterion: b.criterion, times: 0, lost: 0, lesson: row.lessons?.title || '', note: '' }
      cur.times += 1
      cur.lost += lostOf(b)
      if (!cur.note && b.note) cur.note = String(b.note).replace(/\s+/g, ' ').slice(0, 140) // note mới nhất (rows đã mới→cũ)
      map.set(key, cur)
    }
  }
  const items = [...map.values()].sort((a, b) => b.times - a.times || b.lost - a.lost).slice(0, top)
  if (!items.length) return ''
  const text = items.map(i =>
    `- "${i.criterion}" (mất điểm ${i.times} lần${i.lesson ? `, gần nhất ở bài "${i.lesson}"` : ''})${i.note ? `: ${i.note}` : ''}`
  ).join('\n')
  return text.slice(0, maxChars)
}

// submissions: mảng bài nộp của nhiều học sinh trong CÙNG 1 bài học.
// Trả về các tiêu chí xếp theo tỉ lệ học sinh bị mất điểm giảm dần.
export function summarizeClassErrors(submissions, { minSample = 3, topNotes = 2 } = {}) {
  const map = new Map()
  for (const sub of submissions || []) {
    for (const b of Array.isArray(sub.ai_breakdown) ? sub.ai_breakdown : []) {
      if (!b?.criterion) continue
      const key = norm(b.criterion)
      const cur = map.get(key) || { criterion: b.criterion, graded: 0, lostCount: 0, earned: 0, max: 0, notes: new Map() }
      cur.graded += 1
      cur.earned += Number(b.earned) || 0
      cur.max += Number(b.max) || 0
      if (lostOf(b) > 0) {
        cur.lostCount += 1
        const n = String(b.note || '').replace(/\s+/g, ' ').trim().slice(0, 160)
        if (n) cur.notes.set(n, (cur.notes.get(n) || 0) + 1)
      }
      map.set(key, cur)
    }
  }
  return [...map.values()]
    .filter(i => i.graded >= minSample && i.lostCount > 0)
    .map(i => ({
      criterion: i.criterion,
      graded: i.graded,
      lostCount: i.lostCount,
      lostPct: Math.round((i.lostCount / i.graded) * 100),
      avgPct: i.max ? Math.round((i.earned / i.max) * 100) : null,
      notes: [...i.notes.entries()].sort((a, b) => b[1] - a[1]).slice(0, topNotes).map(([n]) => n),
    }))
    .sort((a, b) => b.lostPct - a.lostPct || b.graded - a.graded)
}
