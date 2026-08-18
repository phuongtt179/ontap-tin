import { getGeminiKeys, callGeminiRotate, isDailyLimit } from './_gemini.js'

export const config = { maxDuration: 30 }

const MODEL = 'gemini-3.1-flash-lite'

function buildPrompt({ title, grade, topic, brief }) {
  return `Bạn là giáo viên Tin học / lập trình sáng tạo tiểu học, đang soạn 1 bài học mới cho ứng dụng "Lập Trình Sáng Tạo BNP".

Thông tin bài học:
- Tên bài: "${title}"
${grade ? `- Khoá: ${grade}` : ''}
${topic ? `- Chủ đề: ${topic}` : ''}
${brief ? `- Yêu cầu thêm từ giáo viên: ${brief}` : ''}

Hãy soạn:
1. "description": 1 câu mô tả ngắn gọn (dưới 20 từ) hiện dưới tiêu đề bài học.
2. "theory": nội dung LÝ THUYẾT dạng MARKDOWN có cấu trúc rõ ràng (dùng ## tiêu đề phụ, **in đậm** từ khoá quan trọng, danh sách gạch đầu dòng, code block \`\`\` nếu có lệnh/khối lập trình cụ thể) — viết cho học sinh tiểu học, ngôn ngữ đơn giản dễ hiểu, có ví dụ cụ thể. Độ dài vừa phải (khoảng 150-350 từ).
3. "practice_tasks": mảng 1-2 bài thực hành liên quan trực tiếp tới lý thuyết vừa soạn, mỗi phần tử gồm:
   - "instructions": đề bài thực hành (markdown), rõ ràng, có bước làm cụ thể, học sinh đọc hiểu và tự làm được.
   - "rubric": tiêu chí chấm để AI chấm bài (KHÔNG hiện cho học sinh) — liệt kê từng tiêu chí kèm số điểm, TỔNG các điểm phải bằng 10. Có thể để chuỗi rỗng "" nếu bài này không cần chấm chi tiết.

Nguyên tắc:
- Đúng lứa tuổi tiểu học, đúng chủ đề/khoá học nêu trên.
- Hạn chế thuật ngữ tiếng Anh khó, trừ tên lệnh/khối lập trình đặc thù không dịch được.
- Trả về DUY NHẤT 1 JSON object, không thêm text hay markdown fence nào khác, đúng dạng:
{"description":"...","theory":"...","practice_tasks":[{"instructions":"...","rubric":"..."}]}`
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { title, grade, topic, brief } = req.body || {}
  if (!String(title || '').trim()) return res.status(400).json({ error: 'no_title' })

  const keys = getGeminiKeys()
  if (!keys.length) return res.status(500).json({ error: 'no_api_key' })

  const payload = JSON.stringify({
    contents: [{ role: 'user', parts: [{ text: buildPrompt({ title, grade, topic, brief }) }] }],
    generationConfig: { temperature: 0.6, maxOutputTokens: 3072 },
  })

  let geminiRes
  try {
    geminiRes = await callGeminiRotate({ model: MODEL, keys, payload })
  } catch {
    return res.status(500).json({ error: 'network' })
  }

  if (geminiRes.status === 429) {
    const errBody = await geminiRes.json().catch(() => ({}))
    return res.status(429).json({ error: isDailyLimit(errBody) ? 'quota_rpd' : 'quota_rpm' })
  }
  if (!geminiRes.ok) {
    const body = await geminiRes.json().catch(() => ({}))
    return res.status(500).json({ error: 'gemini_error', details: body })
  }

  const data = await geminiRes.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
  const cleaned = text.replace(/```json\s*|\s*```/g, '').trim()

  let parsed
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    return res.status(500).json({ error: 'parse_error', raw: text })
  }
  if (!parsed?.description && !parsed?.theory) return res.status(500).json({ error: 'empty' })

  return res.status(200).json({
    description: parsed.description || '',
    theory: parsed.theory || '',
    practice_tasks: Array.isArray(parsed.practice_tasks) ? parsed.practice_tasks : [],
  })
}
