// Máy chủ tự chấm các bài nộp mà AI chưa chấm (học sinh đóng trang trước khi trình duyệt kịp chấm,
// mạng chập chờn, AI quá tải lúc đó…). Supabase pg_cron gọi endpoint này vài phút một lần
// (xem migration_grade_pending.sql) — không còn phụ thuộc việc học sinh mở lại bài.
// ⚠ 27/10/2026: ĐÃ GỠ lịch pg_cron (cạn Disk IO gói nano) — endpoint không còn được gọi; giáo viên tự bấm chấm.
import { gradeTasks } from './_gradeCore.js'
import { prepareTasks } from '../src/utils/gradePrep.js'

export const config = { maxDuration: 60 }

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const BATCH = 5                      // tối đa số bài mỗi lần gọi
const TIME_BUDGET_MS = 40 * 1000     // quá thời gian này thì không nhận bài mới (giới hạn 60s của Vercel)
const MIN_AGE_MS = 3 * 60 * 1000     // chừa 3 phút cho trình duyệt học sinh tự chấm trước
const MAX_AGE_DAYS = 14
const MAX_ATTEMPTS = 3               // bài lỗi mãi (file hỏng…) thử tối đa 3 lần rồi bỏ qua

function parseTasks(instructions) {
  if (!instructions) return [{ instructions: '' }]
  try {
    const arr = JSON.parse(instructions)
    if (Array.isArray(arr) && arr.length > 0) return arr
  } catch { /* không phải JSON → coi cả chuỗi là 1 đề */ }
  return [{ instructions }]
}

// Đề rỗng → AI không có gì để đối chiếu (từng cho 10 điểm bài gõ "1") → không chấm, để giáo viên chấm
const isEmptyTask = t => !t || t.optional || !String(t.instructions || '').trim() || String(t.instructions).trim() === '[]'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  // Chỉ khoá bí mật (service) của Supabase — do pg_cron gửi kèm — mới gọi được endpoint này
  const key = String(req.headers.apikey || '').trim()
  if (!key || !SUPABASE_URL) return res.status(401).json({ error: 'unauthorized' })
  const chk = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?per_page=1`, { headers: { apikey: key } })
  if (!chk.ok) return res.status(401).json({ error: 'unauthorized' })

  const db = (path, init = {}) => fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: key, 'Content-Type': 'application/json', ...(init.headers || {}) },
  })

  const now = Date.now()
  const before = new Date(now - MIN_AGE_MS).toISOString()
  const after = new Date(now - MAX_AGE_DAYS * 864e5).toISOString()
  const listRes = await db(`lesson_submissions?select=id,lesson_id,file_url,file_name,text_content,content_json,ai_attempts`
    + `&score=is.null&graded_by=is.null&ai_graded_at=is.null&ai_attempts=lt.${MAX_ATTEMPTS}`
    + `&submitted_at=lt.${before}&submitted_at=gt.${after}&order=submitted_at.desc&limit=${BATCH}`)
  if (!listRes.ok) return res.status(500).json({ error: 'db_error', details: await listRes.text() })
  const subs = await listRes.json()
  if (!subs.length) return res.status(200).json({ graded: 0 })

  const lessonIds = [...new Set(subs.map(s => s.lesson_id))]
  const lessons = await (await db(`lessons?select=id,practice_instructions&id=in.(${lessonIds.join(',')})`)).json()
  const taskMap = Object.fromEntries(lessons.map(l => [l.id, parseTasks(l.practice_instructions)]))

  const out = { graded: 0, skipped: 0, failed: 0, errors: [] }
  for (const sub of subs) {
    if (Date.now() - now > TIME_BUDGET_MS) break
    // Đánh dấu đã thử (cũng để 2 lần gọi chồng nhau không chấm trùng nhiều lần)
    await db(`lesson_submissions?id=eq.${sub.id}`, { method: 'PATCH', body: JSON.stringify({ ai_attempts: (sub.ai_attempts || 0) + 1 }) })

    const taskDef = taskMap[sub.lesson_id]?.[Number(sub.content_json?.task_index ?? 0)]
    if (isEmptyTask(taskDef)) {
      // Không chấm được → đánh dấu hết lượt thử để lần sau không lấy lại
      await db(`lesson_submissions?id=eq.${sub.id}`, { method: 'PATCH', body: JSON.stringify({ ai_attempts: MAX_ATTEMPTS }) })
      out.skipped++
      continue
    }
    try {
      const tasks = await prepareTasks([sub], [taskDef])
      if (!tasks.length) { out.skipped++; continue }
      const r = await gradeTasks(tasks)
      if (r.status === 429 && r.body?.error === 'quota_rpd') { out.errors.push('quota_rpd'); break }   // hết lượt cả ngày
      const result = r.status === 200 ? r.body.results?.[0] : null
      if (!result) { out.failed++; out.errors.push(r.body?.error || `status_${r.status}`); continue }
      // Chỉ ghi khi bài vẫn chưa ai chấm (giáo viên/trình duyệt có thể đã chấm trong lúc chờ)
      await db(`lesson_submissions?id=eq.${sub.id}&score=is.null&graded_by=is.null`, {
        method: 'PATCH',
        body: JSON.stringify({
          score: result.score, ai_score: result.score, teacher_comment: result.comment, graded_by: 'ai',
          ai_graded_at: new Date().toISOString(), ai_breakdown: result.breakdown || null,
          ai_suspect: !!result.ai_suspect, ai_suspect_reason: result.ai_suspect_reason || null,
        }),
      })
      out.graded++
    } catch (e) {
      out.failed++
      out.errors.push(String(e?.message || e).slice(0, 120))
    }
  }
  return res.status(200).json(out)
}
