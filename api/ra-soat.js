// "Rà soát lỗi" cho học sinh: AI chỉ PHÂN LOẠI bài nộp ĐẠT / CHƯA ĐẠT theo từng tiêu chí giáo viên viết
// (rubric của bài) — không viết nhận xét, không cho điểm, không cho mức. Học sinh thấy nguyên văn câu tiêu chí
// kèm ✅/⚠️ để tự sửa rồi nộp lại; đánh giá mức T/H/C vẫn do giáo viên.
// Tiêu chí do MÁY CHỦ lấy từ bài học (học sinh không gửi lên được). Mỗi bản nộp rà soát tối đa MAX_LAN lần.
import { getGeminiKeys, callGeminiRotate, isDailyLimit } from './_gemini.js'
import { requireUser } from './_auth.js'
import { tieuChiRaSoat } from '../src/utils/tieuChi.js'

export const config = { maxDuration: 60 }

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
const MODEL = 'gemini-3.1-flash-lite'
const MAX_LAN = 3

function parseTasks(instructions) {
  try { const a = JSON.parse(instructions); if (Array.isArray(a) && a.length) return a } catch { /* chuỗi thường */ }
  return [{ instructions: instructions || '' }]
}

function prompt({ instructions, task, tieuChi }) {
  const tests = Array.isArray(task.testResults) && task.testResults.length
    ? `\nKẾT QUẢ CHẠY THỬ CHƯƠNG TRÌNH (máy chạy thật): đúng ${task.testResults.filter(t => t.passed).length}/${task.testResults.length} lần.\n` : ''
  return `Bạn là công cụ PHÂN LOẠI bài thực hành Tin học của học sinh tiểu học.
Với MỖI tiêu chí trong danh sách, xác định bài làm ĐÃ ĐẠT (true) hay CHƯA ĐẠT (false).
- Chỉ đánh false khi chắc chắn bài làm chưa đáp ứng tiêu chí đó; bài làm đúng theo cách khác vẫn là true.
- Bài trống hoặc không liên quan tới đề → mọi tiêu chí false.
CHỈ trả về một mảng JSON gồm đúng ${tieuChi.length} giá trị true/false theo thứ tự tiêu chí, ví dụ [true,false]. Không viết gì khác.

ĐỀ BÀI:
${String(instructions || '').replace(/\[test[^\n]*\]/gi, '').slice(0, 4000)}

TIÊU CHÍ:
${tieuChi.map((t, i) => `${i + 1}. ${t}`).join('\n')}
${tests}
BÀI LÀM CỦA HỌC SINH (${task.type || 'text'}${task.noFile ? ', không nộp file' : ''}):
${String(task.content || '(trống)').slice(0, 20000)}`
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const user = await requireUser(req, res)
  if (!user) return
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim()
  const { submission_id, task } = req.body || {}
  if (!submission_id || !task || typeof task !== 'object') return res.status(400).json({ error: 'bad_request' })

  // Đọc bằng phiên của chính học sinh → RLS chỉ cho thấy bài của em
  const db = (path, init = {}) => fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init, headers: { apikey: ANON_KEY, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(init.headers || {}) },
  })
  const [sub] = await (await db(`lesson_submissions?select=id,user_id,lesson_id,submitted_at,content_json,reviewed_at,ra_soat&id=eq.${encodeURIComponent(submission_id)}`)).json().catch(() => [])
  if (!sub || sub.user_id !== user.id) return res.status(403).json({ error: 'forbidden' })
  if (sub.reviewed_at) return res.status(400).json({ error: 'da_danh_gia' })
  const cungBan = sub.ra_soat?.phien === sub.submitted_at
  const lan = cungBan ? Number(sub.ra_soat.lan) || 0 : 0
  if (lan >= MAX_LAN) return res.status(429).json({ error: 'het_luot' })

  const [lesson] = await (await db(`lessons?select=practice_instructions&id=eq.${sub.lesson_id}`)).json().catch(() => [])
  const taskDef = parseTasks(lesson?.practice_instructions)[Number(sub.content_json?.task_index ?? 0)] || {}
  const tieuChi = tieuChiRaSoat(taskDef)

  const keys = getGeminiKeys()
  if (!keys.length) return res.status(500).json({ error: 'no_api_key' })
  const payload = JSON.stringify({
    contents: [{ parts: [{ text: prompt({ instructions: taskDef.instructions, task, tieuChi }) }] }],
    generationConfig: { temperature: 0, maxOutputTokens: 200, responseMimeType: 'application/json' },
  })
  let r
  try { r = await callGeminiRotate({ model: MODEL, keys, payload, primaryTimeoutMs: 15000 }) } catch { return res.status(500).json({ error: 'network' }) }
  if (r.status === 429) { const b = await r.json().catch(() => ({})); return res.status(429).json({ error: isDailyLimit(b) ? 'quota_rpd' : 'quota_rpm' }) }
  if (!r.ok) return res.status(500).json({ error: 'gemini_error' })
  const text = ((await r.json()).candidates?.[0]?.content?.parts?.[0]?.text || '').replace(/```json\s*|\s*```/g, '').trim()
  let mang
  try { mang = JSON.parse(text) } catch { return res.status(500).json({ error: 'parse_error' }) }
  if (!Array.isArray(mang)) mang = Array.isArray(mang?.ket_qua) ? mang.ket_qua : []
  if (mang.length !== tieuChi.length) return res.status(500).json({ error: 'parse_error' })

  // Chỉ lưu câu tiêu chí của giáo viên + đạt/chưa đạt — không có chữ nào do AI viết
  const ra_soat = { phien: sub.submitted_at, lan: lan + 1, ket_qua: tieuChi.map((t, i) => ({ tieu_chi: t, dat: mang[i] === true })), at: new Date().toISOString() }
  await db(`lesson_submissions?id=eq.${sub.id}`, { method: 'PATCH', body: JSON.stringify({ ra_soat }) })
  return res.status(200).json({ ra_soat, con_lai: MAX_LAN - ra_soat.lan })
}
