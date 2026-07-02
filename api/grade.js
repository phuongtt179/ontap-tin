export const config = { maxDuration: 30 }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { tasks } = req.body || {}
  if (!Array.isArray(tasks) || tasks.length === 0)
    return res.status(400).json({ error: 'no_tasks' })

  const GEMINI_KEY = process.env.GEMINI_API_KEY
  if (!GEMINI_KEY) return res.status(500).json({ error: 'no_api_key' })

  const hasImage = tasks.some(t => t.type === 'image' && t.imageUrl)
  const model = hasImage ? 'gemini-2.5-flash' : 'gemini-3.1-flash-lite'

  // Build prompt text
  let prompt = `Bạn là giáo viên chấm bài thực hành Tin học tiểu học. Chấm các bài sau và trả về JSON.

Quy tắc:
- Điểm từ 0 đến 10 (hoặc theo thang điểm trong tiêu chí nếu có)
- Nhận xét bằng tiếng Việt, 1–2 câu ngắn gọn, khuyến khích học sinh
- Nếu có "Tiêu chí chấm" trong đề bài thì chấm theo đó
- Nếu có kết quả test case Python thì cộng điểm test + chấm style code riêng
- Trả về ĐÚNG định dạng JSON array, không thêm text khác\n\n`

  for (const task of tasks) {
    prompt += `=== BÀI ${task.taskIndex + 1} ===\n`
    prompt += `Đề bài: ${task.instructions || '(không có đề bài)'}\n`

    if (task.type === 'image') {
      prompt += `Bài nộp: [xem hình ảnh đính kèm]\n`
    } else if (task.content) {
      prompt += `Bài nộp:\n${task.content}\n`
    } else {
      prompt += `Bài nộp: (không có nội dung)\n`
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

  prompt += `Trả về JSON array (không có markdown, không text thêm):
[{"taskIndex":0,"score":8,"comment":"Nhận xét..."},{"taskIndex":1,"score":7,"comment":"..."}]`

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

  // Call Gemini
  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 2048 },
      }),
    }
  )

  if (geminiRes.status === 429) {
    const body = await geminiRes.json().catch(() => ({}))
    const msg = JSON.stringify(body).toLowerCase()
    const isDaily = msg.includes('daily') || msg.includes('per_day') || msg.includes('rpd')
    return res.status(429).json({ error: isDaily ? 'quota_rpd' : 'quota_rpm' })
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
