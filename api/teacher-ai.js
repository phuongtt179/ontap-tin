import { getGeminiKeys, callGeminiRotate, isDailyLimit } from './_gemini.js'

// Các công cụ AI cho giáo viên (Trung tâm AI). Gộp chung 1 file để không tăng số serverless
// function trên Vercel. action:
//   - 'lesson_notes': soạn ghi chú nội bộ cho gia sư AI từ chữ trong slide bài giảng
//   - 'insights'    : tổng hợp các câu học sinh hỏi gia sư AI → chủ đề hay bối rối + gắn cờ an toàn
export const config = { maxDuration: 60 }

const MODEL = 'gemini-3.1-flash-lite'

function lessonNotesPrompt({ title, grade, topic, slidesText }) {
  return `Bạn đang soạn GHI CHÚ NỘI BỘ cho một gia sư AI dạy Tin học / lập trình cho học sinh${grade ? ` khoá "${grade}"` : ' tiểu học'}.
Gia sư sẽ dựa vào ghi chú này để trả lời câu hỏi lý thuyết của học sinh về bài "${title}"${topic ? ` (chủ đề: ${topic})` : ''}. Học sinh KHÔNG đọc ghi chú này.

Yêu cầu:
- Dựa DUY NHẤT vào nội dung slide bên dưới. TUYỆT ĐỐI không thêm kiến thức, lệnh hay khái niệm không có trong slide (gia sư chỉ được dạy đúng những gì lớp đã học).
- Viết markdown ngắn gọn, tối đa khoảng 350 từ, đúng 4 mục với tiêu đề CHÍNH XÁC như sau (không thêm chữ vào tiêu đề):
  "## Mục tiêu bài"
  "## Kiến thức chính" — nội dung: các khái niệm, thao tác/các bước làm, GHI ĐÚNG tên khối lệnh / lệnh / menu / nút như trong slide
  "## Ví dụ trong bài" — nội dung: ví dụ cụ thể slide đã dùng (nếu có)
  "## Chỗ học sinh dễ nhầm" — nội dung: chỉ ghi khi suy ra hợp lý từ nội dung slide, cuối mỗi ý ghi "(dự đoán)"
- Nếu slide gần như không có chữ / không đủ thông tin, ghi đúng 1 dòng: "KHÔNG ĐỦ NỘI DUNG".
- Chỉ trả về ghi chú, không thêm lời dẫn.

NỘI DUNG SLIDE:
${slidesText}`
}

function insightsPrompt({ lessonLabel, questions }) {
  return `Dưới đây là các câu học sinh tiểu học đã hỏi GIA SƯ AI trong ${lessonLabel}. Mỗi câu có số id. Tên học sinh đã được thay bằng mã HSxx.
Nhiệm vụ của bạn — giúp GIÁO VIÊN biết lớp đang bối rối điều gì để cải tiến bài giảng:
1. "themes": gom các câu thành tối đa 6 CHỦ ĐỀ THẮC MẮC có ý nghĩa sư phạm (vd "Chưa hiểu cách làm nhân vật lặp lại hành động", "Không biết nộp file bài làm"). Mỗi chủ đề: "title" (ngắn, tiếng Việt), "count" (số câu thuộc chủ đề — đếm THẬT), "example_ids" (tối đa 3 id tiêu biểu), "suggestion" (1 câu gợi ý giáo viên nên làm gì trên lớp). Bỏ qua các câu chào hỏi/vô nghĩa, không tạo chủ đề cho chúng. Sắp xếp theo count giảm dần.
2. "flags": các câu CẦN GIÁO VIÊN CHÚ Ý về AN TOÀN/HÀNH VI: nói tục, xúc phạm, dấu hiệu buồn bã/bị bắt nạt/bị đánh/muốn tự làm đau mình, chia sẻ thông tin cá nhân (số điện thoại, địa chỉ, mật khẩu), hoặc nội dung không phù hợp lứa tuổi. Mỗi phần tử: "id", "reason" (ngắn gọn). Không gắn cờ câu bình thường; KHÔNG gắn cờ chỉ vì học sinh xin đáp án.
3. "summary": 1–2 câu tóm tắt tình hình chung.
Trả về DUY NHẤT JSON dạng: {"summary":"...","themes":[{"title":"...","count":0,"example_ids":[1],"suggestion":"..."}],"flags":[{"id":1,"reason":"..."}]}

CÁC CÂU HỎI:
${questions.map(q => `[${q.id}] ${q.text}`).join('\n')}`
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { action } = req.body || {}

  const keys = getGeminiKeys()
  if (!keys.length) return res.status(500).json({ error: 'no_api_key' })

  let prompt, generationConfig, model = MODEL
  const extraParts = []
  if (action === 'lesson_notes') {
    const { title, grade, topic, slidesText, pdfUrl } = req.body
    const text = String(slidesText || '').trim()
    if (text.length >= 40) {
      prompt = lessonNotesPrompt({ title, grade, topic, slidesText: text.slice(0, 25000) })
    } else if (pdfUrl) {
      // PDF xuất dạng ẢNH (không có lớp chữ) → gửi nguyên file cho Gemini đọc bằng thị giác.
      // Chỉ nhận file trên Cloudinary của app, tránh bị dùng để tải file bất kỳ.
      let url
      try { url = new URL(pdfUrl) } catch { return res.status(400).json({ error: 'bad_url' }) }
      if (url.protocol !== 'https:' || url.hostname !== 'res.cloudinary.com') return res.status(400).json({ error: 'bad_url' })
      const f = await fetch(url).catch(() => null)
      if (!f?.ok) return res.status(400).json({ error: 'fetch_failed' })
      const buf = Buffer.from(await f.arrayBuffer())
      if (buf.length > 15 * 1024 * 1024) return res.status(400).json({ error: 'file_too_large' })
      extraParts.push({ inlineData: { mimeType: 'application/pdf', data: buf.toString('base64') } })
      prompt = lessonNotesPrompt({ title, grade, topic, slidesText: '(Xem file PDF slide đính kèm — đọc chữ và hình trong từng trang.)' })
      model = 'gemini-2.5-flash'
    } else {
      return res.status(400).json({ error: 'no_text' })
    }
    // 2.5-flash mặc định "suy nghĩ" và tiêu luôn hạn mức token trả về → ghi chú bị cắt cụt; tắt đi
    generationConfig = { temperature: 0.3, maxOutputTokens: 3000, ...(model === 'gemini-2.5-flash' && { thinkingConfig: { thinkingBudget: 0 } }) }
  } else if (action === 'insights') {
    const { lessonLabel, questions } = req.body
    if (!Array.isArray(questions) || !questions.length) return res.status(400).json({ error: 'no_questions' })
    const qs = questions.slice(0, 400).map(q => ({ id: Number(q.id), text: String(q.text || '').slice(0, 300) }))
    prompt = insightsPrompt({ lessonLabel: lessonLabel || 'bài học', questions: qs })
    generationConfig = { temperature: 0.2, maxOutputTokens: 3000, responseMimeType: 'application/json' }
  } else {
    return res.status(400).json({ error: 'bad_action' })
  }

  let r
  try {
    r = await callGeminiRotate({
      model, keys,
      payload: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }, ...extraParts] }], generationConfig }),
    })
  } catch {
    return res.status(500).json({ error: 'network' })
  }
  if (r.status === 429) {
    const body = await r.json().catch(() => ({}))
    return res.status(429).json({ error: isDailyLimit(body) ? 'quota_rpd' : 'quota_rpm' })
  }
  if (!r.ok) return res.status(500).json({ error: 'gemini_error' })

  const data = await r.json()
  const text = (data.candidates?.[0]?.content?.parts?.[0]?.text || '').trim()
  if (!text) return res.status(500).json({ error: 'empty' })

  if (action === 'lesson_notes') return res.status(200).json({ notes: text })

  try {
    const parsed = JSON.parse(text.replace(/```json\s*|\s*```/g, ''))
    return res.status(200).json({
      summary: parsed.summary || '',
      themes: Array.isArray(parsed.themes) ? parsed.themes : [],
      flags: Array.isArray(parsed.flags) ? parsed.flags : [],
    })
  } catch {
    return res.status(500).json({ error: 'parse_error' })
  }
}
