import { getGeminiKeys, callGeminiRotate, isDailyLimit } from './_gemini.js'

export const config = { maxDuration: 30 }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { tasks } = req.body || {}
  if (!Array.isArray(tasks) || tasks.length === 0)
    return res.status(400).json({ error: 'no_tasks' })

  const keys = getGeminiKeys()
  if (!keys.length) return res.status(500).json({ error: 'no_api_key' })

  const hasImage = tasks.some(t => t.type === 'image' && t.imageUrl)
  const model = hasImage ? 'gemini-2.5-flash' : 'gemini-3.1-flash-lite'

  // Build prompt — dùng taskIndex thực trong header để AI trả đúng số
  let prompt = `Bạn là giáo viên chấm bài thực hành Tin học tiểu học. Chấm các bài sau và trả về JSON.

Quy tắc:
- Điểm từ 0 đến 10 (hoặc theo tiêu chí nếu có)
- Chấm từng bài ĐÚNG theo đề bài của bài đó, không nhầm lẫn
- Nhận xét bằng tiếng Việt THẬT DỄ HIỂU cho học sinh nhỏ tuổi, giọng ấm áp khích lệ, xưng "thầy/cô" và gọi học sinh là "em". 1–3 câu.
- Khi có chỗ sai, phải nói RÕ RÀNG: (1) em đã làm gì, (2) chỗ đó ĐÚNG ra phải thế nào, (3) sửa bằng cách nào — nói bằng lời đơn giản, KHÔNG viết tắt kiểu "A thay vì B" (trẻ không biết cái nào đúng). Nếu buộc phải nhắc lệnh/thuật ngữ thì giải thích ngắn nó làm gì.
  Ví dụ ĐỪNG viết: "viết int() thay vì float()".
  Nên viết: "Em dùng int() nên số bị mất phần thập phân. Bài này cần giữ phần thập phân, em đổi sang dùng float() nhé!"
- Nếu có "Tiêu chí chấm", trả về thêm mảng "breakdown": mỗi phần tử gồm {"criterion":"Tên tiêu chí ngắn gọn","earned":điểm_đạt,"max":điểm_tối_đa} — nếu earned < max thì thêm "note" giải thích DỄ HIỂU: em làm sai/thiếu chỗ nào và cần sửa thành gì (nói rõ cái đúng), bằng lời đơn giản cho trẻ. Ví dụ: "Em cho nhân vật nói 'xin chào', nhưng đề yêu cầu nói 'Chúc mừng!' — em sửa lại lời thoại nhé."
- Trả về JSON array, không thêm text khác\n\n`

  for (const task of tasks) {
    prompt += `=== [taskIndex=${task.taskIndex}] ===\n`
    prompt += `Đề bài: ${task.instructions || '(không có đề bài)'}\n`
    if (task.rubric) prompt += `Tiêu chí chấm:\n${task.rubric}\n`

    if (task.type === 'image') {
      prompt += `Bài nộp: [xem hình ảnh đính kèm]\n`
    } else if (task.content) {
      prompt += `Bài nộp:\n${task.content}\n`
    } else {
      prompt += `Bài nộp: (học sinh chưa nộp hoặc file trống)\n`
    }

    if (task.testResults?.length > 0) {
      const passed = task.testResults.filter(r => r.passed)
      const total = task.testResults.length
      const testScore = passed.reduce((s, r) => s + (r.points || 0), 0)
      const maxTest = task.testResults.reduce((s, r) => s + (r.points || 0), 0)
      prompt += `\nKết quả test case (${passed.length}/${total} đúng, ${testScore}/${maxTest}đ):\n`
      task.testResults.forEach((r, i) => {
        prompt += `  Test ${i + 1}: input="${r.input}" → expected="${r.expected}", actual="${r.actual}" ${r.passed ? '✅' : '❌'}\n`
      })
    }

    prompt += '\n'
  }

  // JSON mẫu dùng đúng taskIndex thực — AI copy theo, không tự đặt số
  const example = tasks.map(t => {
    if (t.rubric) {
      return `{"taskIndex":${t.taskIndex},"score":8,"comment":"Nhận xét...","breakdown":[{"criterion":"Tên tiêu chí","earned":1,"max":1},{"criterion":"Tiêu chí khác","earned":2,"max":3,"note":"Lý do trừ"}]}`
    }
    return `{"taskIndex":${t.taskIndex},"score":8,"comment":"Nhận xét..."}`
  }).join(',')
  prompt += `Trả về JSON array (không có markdown, không text thêm):\n[${example}]`

  // Build Gemini parts
  const parts = [{ text: prompt }]

  // Add images as inlineData
  for (const task of tasks) {
    if (task.type !== 'image' || !task.imageUrl) continue
    try {
      const imgRes = await fetch(task.imageUrl)
      if (!imgRes.ok) continue
      const buf = await imgRes.arrayBuffer()
      const mimeType = imgRes.headers.get('content-type') || 'image/jpeg'
      parts.push({ inlineData: { mimeType, data: Buffer.from(buf).toString('base64') } })
    } catch { /* skip unloadable images */ }
  }

  // Call Gemini — xoay vòng nhiều key khi hết lượt
  const payload = JSON.stringify({
    contents: [{ parts }],
    generationConfig: { temperature: 0.2, maxOutputTokens: 2048 },
  })
  const geminiRes = await callGeminiRotate({ model, keys, payload })

  if (geminiRes.status === 429) {
    const body = await geminiRes.json().catch(() => ({}))
    return res.status(429).json({ error: isDailyLimit(body) ? 'quota_rpd' : 'quota_rpm' })
  }

  if (!geminiRes.ok) {
    const body = await geminiRes.json().catch(() => ({}))
    return res.status(500).json({ error: 'gemini_error', details: body })
  }

  const data = await geminiRes.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
  const cleaned = text.replace(/```json\s*|\s*```/g, '').trim()

  try {
    const results = JSON.parse(cleaned)
    return res.status(200).json({ results: Array.isArray(results) ? results : [results] })
  } catch {
    return res.status(500).json({ error: 'parse_error', raw: text })
  }
}
