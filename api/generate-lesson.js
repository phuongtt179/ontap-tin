import { getGeminiKeys, callGeminiRotate, isDailyLimit } from './_gemini.js'

export const config = { maxDuration: 30 }

const MODEL = 'gemini-2.5-flash'

function buildPrompt({ title, grade, topic, brief }) {
  return `Bạn là một giáo viên Tin học / lập trình sáng tạo tiểu học DÀY DẶN KINH NGHIỆM, được học sinh yêu thích vì giảng bài dễ hiểu, sinh động, gần gũi — không bao giờ viết khô khan kiểu sách giáo khoa. Bạn đang soạn 1 bài học mới cho ứng dụng "Lập Trình Sáng Tạo BNP".

Thông tin bài học:
- Tên bài: "${title}"
${grade ? `- Khoá/lứa tuổi: ${grade}` : ''}
${topic ? `- Chủ đề: ${topic}` : ''}
${brief ? `- Yêu cầu thêm từ giáo viên: ${brief}` : ''}

Hãy soạn:
1. "description": 1 câu mô tả ngắn gọn, hấp dẫn (dưới 20 từ) hiện dưới tiêu đề bài học.
2. "theory": nội dung LÝ THUYẾT dạng MARKDOWN, viết theo phong cách GIÁO VIÊN ĐANG TRÒ CHUYỆN TRỰC TIẾP với học sinh (xưng "thầy/cô", gọi "em"), KHÔNG liệt kê khô khan như tài liệu tra cứu. Yêu cầu bắt buộc:
   - Mở đầu bằng 1-2 câu GẦN GŨI, gợi tò mò (liên hệ điều học sinh đã biết/đã thấy trong đời sống) trước khi vào khái niệm — KHÔNG định nghĩa suông ngay câu đầu.
   - Cấu trúc bằng tiêu đề phụ "##" chia thành các Ý/bước nhỏ, mỗi tiêu đề là 1 câu hỏi hoặc cụm từ sinh động (không đặt tên mục kiểu "1. Định nghĩa", "2. Các bước").
   - MỖI khái niệm/bước ĐỀU phải đi kèm NGAY 1 ví dụ cụ thể, gần gũi lứa tuổi tiểu học (đồ vật, trò chơi, hoạt động quen thuộc) — TUYỆT ĐỐI không dồn hết ví dụ xuống cuối bài.
   - Dùng **in đậm** cho từ khoá quan trọng, danh sách gạch đầu dòng cho các bước thao tác, code block \`\`\` nếu có lệnh/khối lập trình cụ thể. Có thể chèn 1-2 emoji phù hợp để sinh động, không lạm dụng.
   - Kết bằng 1 câu ngắn khích lệ hoặc tóm tắt điều vừa học bằng lời tự nhiên (không viết "Tóm lại:").
   - Ngôn ngữ đơn giản, câu ngắn, đúng lứa tuổi ${grade || 'tiểu học'}. Độ dài khoảng 200-400 từ — đủ để giải thích trọn vẹn, không lan man.
3. "practice_tasks": mảng bài thực hành liên quan trực tiếp tới lý thuyết vừa soạn, mỗi phần tử gồm:
   - "instructions": đề bài thực hành (markdown), rõ ràng, có bước làm cụ thể, học sinh đọc hiểu và tự làm được.
   - "rubric": tiêu chí chấm để AI chấm bài (KHÔNG hiện cho học sinh) — liệt kê từng tiêu chí kèm số điểm, TỔNG các điểm phải bằng 10. Có thể để chuỗi rỗng "" nếu bài này không cần chấm chi tiết.

   SỐ LƯỢNG bài thực hành: nếu "Yêu cầu thêm từ giáo viên" ở trên có nói rõ số lượng (ví dụ "tạo 5 bài tập", "3 bài thực hành"...) thì PHẢI tạo ĐÚNG số lượng đó, không được tự ý rút gọn. Nếu không nói rõ số lượng thì mặc định tạo 1-2 bài.

   ĐỊNH DẠNG "instructions" theo đúng loại phần mềm/nội dung của bài (suy ra từ tên bài/chủ đề):

   (A) Nếu bài liên quan Word/soạn thảo văn bản (gõ văn bản, định dạng chữ...): "instructions" PHẢI có đúng 2 phần theo thứ tự:
     1. "Em hãy gõ đúng nội dung sau:" kèm một đoạn văn bản THẬT cụ thể (chủ đề phù hợp bài học, tiểu học, vài câu) — đây là nguyên văn học sinh phải gõ.
     2. "Em hãy định dạng:" liệt kê từng yêu cầu định dạng. YÊU CẦU BẮT BUỘC: mỗi khi nhắc tới một cụm từ/dòng cụ thể cần định dạng, PHẢI copy NGUYÊN VĂN cụm từ đó (đặt trong dấu ngoặc kép) y hệt như đã gõ ở phần 1, không được diễn đạt lại hay rút gọn — vì AI chấm bài sẽ đối chiếu chính xác cụm từ đó trong bài nộp. Ví dụ: "bảo vệ mắt" → In đậm.

   (B) Nếu bài liên quan Scratch/lập trình kéo thả: "instructions" phải mô tả dưới dạng 1 TRÒ CHƠI MINI hoàn chỉnh (đặt tên trò chơi cụ thể, có nhân vật, mục tiêu chơi, cách thắng/thua rõ ràng) sử dụng đúng khối lệnh/kiến thức vừa học ở phần lý thuyết — không ra bài tập trừu tượng rời rạc.

   (C) Nếu là phần mềm/nội dung khác (PowerPoint, Excel, Paint, lý thuyết chung...): chọn cách trình bày rõ ràng, cụ thể, phù hợp nhất với bản chất bài học.

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
    generationConfig: { temperature: 0.85, maxOutputTokens: 6144 },
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
