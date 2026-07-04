export const config = { maxDuration: 30 }

// Model cho trợ giảng — chỉnh ở đây nếu muốn đổi
const MODEL = 'gemini-2.5-flash'

function buildPrompt({ mode, studentQuestion, context = {} }) {
  const persona = `Bạn là thầy/cô trợ giảng thân thiện của môn Lập trình sáng tạo (Scratch, Python) cho học sinh TIỂU HỌC (6–11 tuổi).
Nguyên tắc:
- Tiếng Việt thật đơn giản, ngắn gọn 2–4 câu, giọng ấm áp khích lệ, gọi học sinh là "con".
- Có thể dùng 1–2 emoji cho sinh động.
- Chỉ hỗ trợ việc học. Nếu con hỏi chuyện ngoài học tập, nhẹ nhàng từ chối và mời con quay lại bài.
- Không dùng từ khó, không giải thích dài dòng học thuật.`

  let task = ''
  if (mode === 'quiz') {
    task = `Con đang làm một CÂU HỎI TRẮC NGHIỆM và cần trợ giúp.
QUAN TRỌNG: TUYỆT ĐỐI KHÔNG nói ra đáp án đúng. Chỉ được GỢI Ý — nhắc lại khái niệm liên quan, đặt câu hỏi ngược, hướng con tự suy nghĩ để tìm ra. Nếu con xin đáp án thẳng, hãy động viên con tự thử một lần nữa.`
  } else if (mode === 'practice') {
    task = `Con đang làm BÀI THỰC HÀNH lập trình. Hãy giảng kỹ: chỉ ra HƯỚNG làm hoặc chỗ có thể sai, gợi ý khối lệnh/câu lệnh cần dùng và các BƯỚC thao tác cụ thể. Nhưng KHÔNG viết hộ toàn bộ lời giải — để con tự làm phần chính.`
  } else {
    task = `Con hỏi về LÝ THUYẾT hoặc cách làm trong bài học.
Hãy ưu tiên dựa vào "Nội dung bài học" bên dưới (nếu có). Nếu nội dung đó chưa đủ chi tiết thao tác, con được dùng kiến thức chuẩn về Scratch/Python để hướng dẫn TỪNG BƯỚC cụ thể — nhưng phải đúng mức tiểu học và bám đúng chủ đề bài, không lan man sang chủ đề khác.`
  }

  let ctx = ''
  if (context.lessonTitle) ctx += `\n[Bài học] ${context.lessonTitle}`
  if (context.lessonDescription) ctx += `\n[Mô tả bài] ${context.lessonDescription}`
  if (context.aiContext) ctx += `\n[Nội dung bài học do giáo viên cung cấp]\n${context.aiContext}`
  if (context.questionText) ctx += `\n[Câu hỏi con đang làm] ${context.questionText}`
  if (Array.isArray(context.options) && context.options.length) ctx += `\n[Các lựa chọn] ${context.options.join(' | ')}`
  if (context.studentAnswer) ctx += `\n[Con đang chọn/đang làm] ${context.studentAnswer}`
  if (context.taskInstructions) ctx += `\n[Đề bài thực hành] ${context.taskInstructions}`

  return `${persona}

${task}
${ctx ? `\nNGỮ CẢNH:${ctx}\n` : ''}
[Câu hỏi của con] ${studentQuestion}

Trả lời (chỉ nội dung, không thêm tiêu đề hay markdown):`
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { mode, studentQuestion, context } = req.body || {}
  if (!studentQuestion || !String(studentQuestion).trim())
    return res.status(400).json({ error: 'no_question' })

  const GEMINI_KEY = process.env.GEMINI_API_KEY
  if (!GEMINI_KEY) return res.status(500).json({ error: 'no_api_key' })

  const prompt = buildPrompt({ mode, studentQuestion, context: context || {} })

  let geminiRes
  try {
    geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 512 },
        }),
      }
    )
  } catch {
    return res.status(500).json({ error: 'network' })
  }

  if (geminiRes.status === 429) return res.status(429).json({ error: 'quota' })
  if (!geminiRes.ok) {
    const body = await geminiRes.json().catch(() => ({}))
    return res.status(500).json({ error: 'gemini_error', details: body })
  }

  const data = await geminiRes.json()
  const answer = (data.candidates?.[0]?.content?.parts?.[0]?.text || '').trim()
  if (!answer) return res.status(500).json({ error: 'empty' })

  return res.status(200).json({ answer })
}
