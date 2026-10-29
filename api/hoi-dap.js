// Học sinh hỏi trong bài → AI chỉ PHÂN LOẠI câu hỏi của em cùng ý với câu HỎI ĐÁP MẪU nào (giáo viên đã duyệt),
// trả về đúng câu trả lời giáo viên đã duyệt. AI không viết chữ nào gửi học sinh. Không khớp → { khop: null }
// (giao diện gửi câu hỏi cho giáo viên như cũ).
import { getGeminiKeys, callGeminiRotate, isDailyLimit } from './_gemini.js'
import { requireUser } from './_auth.js'

export const config = { maxDuration: 60 }

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
const MODEL = 'gemini-3.1-flash-lite'

function prompt(cau, mau) {
  return `Bạn là công cụ PHÂN LOẠI câu hỏi của học sinh tiểu học trong một bài học Tin học.
Cho CÂU HỎI CỦA HỌC SINH và danh sách CÂU HỎI MẪU (đánh số). Chọn câu mẫu HỎI CÙNG MỘT Ý với câu của học sinh
(chấp nhận viết khác chữ, sai chính tả, không dấu). Nếu không có câu nào cùng ý thì chọn 0. Đừng chọn câu chỉ giống vài từ mà khác ý.
CHỈ trả về JSON dạng {"so": <số thứ tự hoặc 0>}.

CÂU HỎI CỦA HỌC SINH: ${String(cau).slice(0, 600)}

CÂU HỎI MẪU:
${mau.map((m, i) => `${i + 1}. ${m.question}`).join('\n')}`
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const user = await requireUser(req, res)
  if (!user) return
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim()
  const { lesson_id, cau_hoi, mode } = req.body || {}
  const cau = String(cau_hoi || '').trim()
  if (!lesson_id || cau.length < 2) return res.status(400).json({ error: 'bad_request' })

  const db = (path, init = {}) => fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init, headers: { apikey: ANON_KEY, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(init.headers || {}) },
  })
  // RLS: học sinh chỉ đọc được câu đã duyệt
  const mau = await (await db(`lesson_faq?select=id,question,answer&lesson_id=eq.${encodeURIComponent(lesson_id)}&approved=eq.true&order=sort_order,created_at&limit=60`)).json().catch(() => [])
  if (!Array.isArray(mau) || !mau.length) return res.status(200).json({ khop: null })

  const keys = getGeminiKeys()
  if (!keys.length) return res.status(500).json({ error: 'no_api_key' })
  const payload = JSON.stringify({
    contents: [{ parts: [{ text: prompt(cau, mau) }] }],
    generationConfig: { temperature: 0, maxOutputTokens: 50, responseMimeType: 'application/json' },
  })
  let r
  try { r = await callGeminiRotate({ model: MODEL, keys, payload, primaryTimeoutMs: 15000 }) } catch { return res.status(500).json({ error: 'network' }) }
  if (r.status === 429) { const b = await r.json().catch(() => ({})); return res.status(429).json({ error: isDailyLimit(b) ? 'quota_rpd' : 'quota_rpm' }) }
  if (!r.ok) return res.status(500).json({ error: 'gemini_error' })
  const text = ((await r.json()).candidates?.[0]?.content?.parts?.[0]?.text || '').replace(/```json\s*|\s*```/g, '').trim()
  let so = 0
  try { so = Number(JSON.parse(text)?.so) || 0 } catch { so = Number((text.match(/\d+/) || [])[0]) || 0 }
  const chon = so >= 1 && so <= mau.length ? mau[so - 1] : null
  if (!chon) return res.status(200).json({ khop: null })

  // Ghi lại (máy chủ lấy câu trả lời từ bảng hỏi đáp đã duyệt)
  const g = await db('rpc/hoi_dap_ghi', { method: 'POST', body: JSON.stringify({ p_faq: chon.id, p_cau: cau, p_mode: mode || 'theory' }) })
  const ghi = await g.json().catch(() => ({}))
  return res.status(200).json({ khop: { id: chon.id, question: chon.question, answer: chon.answer }, question_id: ghi?.id || null })
}
