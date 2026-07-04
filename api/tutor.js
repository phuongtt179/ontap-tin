export const config = { maxDuration: 30 }

// Model cho trợ giảng — dùng chung với api/grade.js (chấm text) cho đồng bộ
const MODEL = 'gemini-3.1-flash-lite'

function buildSystemPrompt({ mode, context = {} }) {
  const persona = `Bạn là thầy/cô trợ giảng thân thiện của môn Lập trình sáng tạo (Scratch, Python) cho học sinh TIỂU HỌC (6–11 tuổi).
Nguyên tắc:
- Tiếng Việt thật đơn giản, giọng ấm áp khích lệ, xưng "thầy/cô" và gọi học sinh là "em".
- Ngắn gọn: 2–4 câu; nếu hướng dẫn thao tác thì liệt kê vài bước đánh số (1., 2., 3.) cho dễ làm theo, đừng dài dòng.
- Có thể dùng 1–2 emoji cho sinh động.
- PHẠM VI: chỉ trả lời về bài học hiện tại và môn Tin học / lập trình (Scratch, Python, sử dụng máy tính). Nếu em hỏi việc khác — môn học khác (Toán, Văn, Tiếng Anh...), chuyện đời sống, giải trí, tán gẫu, chuyện riêng tư, hay nhờ làm hộ bài tập môn khác — thì nhẹ nhàng nói rằng thầy/cô là trợ giảng Tin học nên chỉ giúp được phần này thôi, rồi mời em đặt câu hỏi về bài. TUYỆT ĐỐI không trả lời nội dung ngoài phạm vi đó.
- Nếu em nói tục, chửi bậy, trêu chọc, spam hay nội dung không phù hợp lứa tuổi: TUYỆT ĐỐI không lặp lại hay hùa theo. Hãy nhắc nhở thật nhẹ nhàng, lịch sự rằng mình cùng nói chuyện văn minh và tập trung học nhé, rồi mời em đặt câu hỏi về bài. Luôn giữ thái độ bình tĩnh, tử tế.
- Không dùng từ khó, không giải thích dài dòng học thuật.`

  let task = ''
  if (mode === 'quiz') {
    task = `Em đang làm một CÂU HỎI TRẮC NGHIỆM và cần trợ giúp.
Bên dưới có thể có "[Đáp án đúng]" và "[Gợi ý giáo viên đã soạn]" — những thứ này CHỈ để bạn định hướng gợi ý cho chính xác. TUYỆT ĐỐI KHÔNG nói ra đáp án đúng, KHÔNG chỉ thẳng chọn A/B/C/D hay Đúng/Sai. Chỉ được GỢI Ý — nhắc lại khái niệm liên quan, đặt câu hỏi ngược, hướng em tự suy nghĩ để tìm ra. Nếu em nài xin đáp án, hãy động viên em tự thử một lần nữa.`
  } else if (mode === 'practice') {
    task = `Em đang làm BÀI THỰC HÀNH lập trình. Hãy giảng kỹ: chỉ ra HƯỚNG làm hoặc chỗ có thể sai, gợi ý khối lệnh/câu lệnh cần dùng và các BƯỚC thao tác cụ thể. Nhưng KHÔNG viết hộ toàn bộ lời giải — để em tự làm phần chính.`
  } else {
    task = `Em hỏi về LÝ THUYẾT hoặc cách làm trong bài học.
Hãy ưu tiên dựa vào "Nội dung bài học" bên dưới (nếu có). Nếu nội dung đó chưa đủ chi tiết thao tác, em được dùng kiến thức chuẩn về Scratch/Python để hướng dẫn TỪNG BƯỚC cụ thể — nhưng phải đúng mức tiểu học và bám đúng chủ đề bài, không lan man sang chủ đề khác.`
  }

  let ctx = ''
  if (context.lessonTitle) ctx += `\n[Bài học] ${context.lessonTitle}`
  if (context.lessonDescription) ctx += `\n[Mô tả bài] ${context.lessonDescription}`
  if (context.aiContext) ctx += `\n[Nội dung bài học do giáo viên cung cấp]\n${context.aiContext}`
  if (context.questionText) ctx += `\n[Câu hỏi em đang làm] ${context.questionText}`
  if (Array.isArray(context.options) && context.options.length) ctx += `\n[Các lựa chọn] ${context.options.join(' | ')}`
  if (context.studentAnswer) ctx += `\n[Em đang chọn/đang làm] ${context.studentAnswer}`
  if (context.correctAnswer) ctx += `\n[Đáp án đúng — CHỈ để bạn định hướng, TUYỆT ĐỐI KHÔNG tiết lộ cho học sinh] ${context.correctAnswer}`
  if (context.hint) ctx += `\n[Gợi ý giáo viên đã soạn cho câu này] ${context.hint}`
  if (context.taskInstructions) ctx += `\n[Đề bài thực hành] ${context.taskInstructions}`

  return `${persona}

${task}
${ctx ? `\nNGỮ CẢNH:${ctx}\n` : ''}
Trả lời chỉ nội dung, không thêm tiêu đề. Nhớ toàn bộ cuộc trò chuyện với em để trả lời liền mạch, không lặp lại từ đầu.`
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  // messages: [{ role: 'student'|'ai', content }] — cả đoạn hội thoại, câu mới nhất ở cuối
  const { mode, context, messages, studentQuestion } = req.body || {}
  const turns = Array.isArray(messages) && messages.length
    ? messages
    : (studentQuestion ? [{ role: 'student', content: studentQuestion }] : [])  // tương thích ngược
  if (turns.length === 0 || !String(turns[turns.length - 1]?.content || '').trim())
    return res.status(400).json({ error: 'no_question' })

  const GEMINI_KEY = process.env.GEMINI_API_KEY
  if (!GEMINI_KEY) return res.status(500).json({ error: 'no_api_key' })

  const systemPrompt = buildSystemPrompt({ mode, context: context || {} })
  const contents = turns.map(m => ({
    role: m.role === 'ai' ? 'model' : 'user',
    parts: [{ text: String(m.content || '') }],
  }))

  let geminiRes
  try {
    geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 1024,
          },
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
