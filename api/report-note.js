import { getGeminiKeys, callGeminiRotate } from './_gemini.js'

export const config = { maxDuration: 20 }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { studentName, summary } = req.body || {}
  if (!summary) return res.status(400).json({ error: 'no_summary' })

  const keys = getGeminiKeys()
  if (!keys.length) return res.status(500).json({ error: 'no_api_key' })

  const prompt = `Bạn là giáo viên của trung tâm "Lập Trình Sáng Tạo BNP". Hãy viết MỘT đoạn NHẬN XÉT HỌC TẬP ngắn (3–4 câu) bằng tiếng Việt để gửi PHỤ HUYNH của học sinh "${studentName || 'em'}".
Yêu cầu:
- Giọng ấm áp, chuyên nghiệp, khích lệ; xưng "trung tâm"/"thầy cô", gọi học sinh là "em ${studentName || ''}".
- Nêu ĐIỂM MẠNH trước, rồi 1 điều cần cố gắng (nếu có) theo hướng tích cực.
- CHỈ dựa trên số liệu dưới đây, TUYỆT ĐỐI không bịa thêm con số nào.
- Chỉ trả về đúng đoạn văn nhận xét, không thêm tiêu đề hay lời dẫn.

Số liệu học tập:
${summary}`

  const payload = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.6, maxOutputTokens: 400 },
  })

  let r
  try {
    r = await callGeminiRotate({ model: 'gemini-3.1-flash-lite', keys, payload })
  } catch {
    return res.status(500).json({ error: 'network' })
  }
  if (r.status === 429) return res.status(429).json({ error: 'quota' })
  if (!r.ok) return res.status(500).json({ error: 'gemini_error' })

  const data = await r.json()
  const note = (data.candidates?.[0]?.content?.parts?.[0]?.text || '').trim()
  if (!note) return res.status(500).json({ error: 'empty' })
  return res.status(200).json({ note })
}
