import { getGeminiKeys, callGeminiRotate, isDailyLimit } from './_gemini.js'

export const config = { maxDuration: 30 }

const MODEL = 'gemini-3.1-flash-lite'

function buildSystemPrompt({ classLabel, snapshot }) {
  return `Bạn là trợ lý dữ liệu cho GIÁO VIÊN trong ứng dụng "Lập Trình Sáng Tạo BNP".
Nhiệm vụ: dựa DUY NHẤT vào dữ liệu JSON "SNAPSHOT" bên dưới (tiến độ học tập của lớp${classLabel ? ` "${classLabel}"` : ''} tính đến thời điểm hiện tại) để trả lời câu hỏi của giáo viên.

Nguyên tắc:
- Trả lời bằng tiếng Việt, ngắn gọn, đi thẳng vào số liệu; có thể liệt kê tên học sinh nếu câu hỏi cần.
- CHỈ dùng dữ liệu trong SNAPSHOT. TUYỆT ĐỐI KHÔNG bịa số liệu hay tên học sinh không có trong dữ liệu.
- Nếu SNAPSHOT không đủ thông tin để trả lời chính xác, hãy nói rõ là dữ liệu hiện có chưa đủ để trả lời, đừng đoán.
- SNAPSHOT có 2 dạng: (a) có "students" — dữ liệu tiến độ của TỪNG học sinh trong 1 lớp cụ thể; (b) chỉ có "lessons"/"classesInThisCourse", KHÔNG có "students" — đây là dữ liệu cấp KHOÁ (không nhắm 1 lớp), chỉ dùng để trả lời về danh sách bài học / danh sách lớp thuộc khoá, KHÔNG có dữ liệu học sinh nào, nếu bị hỏi về học sinh thì nói rõ cần chọn 1 lớp cụ thể.
- "Tiến độ mới nhất" của một học sinh = bài học có "latestUpdatedAt" gần hiện tại nhất trong danh sách của học sinh đó.
- Giáo viên có thể gõ TÊN BÀI không chính xác 100% (thiếu số thứ tự, viết tắt, thiếu dấu, sai vài chữ). Hãy tự đối chiếu với mảng "lessons" (danh sách tên bài chuẩn của khoá) để suy ra đúng bài đang được hỏi, rồi dùng "progressByLesson" của từng học sinh để trả lời (bài không có trong "progressByLesson" của học sinh nghĩa là học sinh đó CHƯA bắt đầu bài đó). Nếu không tìm được bài nào khớp hợp lý trong "lessons", nói rõ không thấy bài tên như vậy trong khoá này.
- Xưng "tôi", gọi người hỏi là "thầy/cô".

SNAPSHOT:
${JSON.stringify(snapshot)}`
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { question, classLabel, snapshot } = req.body || {}
  if (!String(question || '').trim()) return res.status(400).json({ error: 'no_question' })
  if (!snapshot) return res.status(400).json({ error: 'no_snapshot' })

  const keys = getGeminiKeys()
  if (!keys.length) return res.status(500).json({ error: 'no_api_key' })

  const payload = JSON.stringify({
    systemInstruction: { parts: [{ text: buildSystemPrompt({ classLabel, snapshot }) }] },
    contents: [{ role: 'user', parts: [{ text: String(question) }] }],
    generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
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
  const answer = (data.candidates?.[0]?.content?.parts?.[0]?.text || '').trim()
  if (!answer) return res.status(500).json({ error: 'empty' })

  return res.status(200).json({ answer })
}
