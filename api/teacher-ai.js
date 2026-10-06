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

const TYPE_CODES = { multiple_choice: 'TN', true_false: 'DS', fill_blank: 'DT', drag_word: 'KT', ordering: 'SX', matching: 'ND', word_order: 'ST', essay: 'TL' }

// Đặc tả định dạng = đúng định dạng mà ô "Nhập" câu hỏi của app (utils/questionParser.js) đọc được
const QUESTION_FORMAT = `ĐỊNH DẠNG BẮT BUỘC (hệ thống sẽ tự đọc, sai định dạng là hỏng):
- Mỗi câu bắt đầu bằng "Câu N:" rồi mã loại ngay sau, các câu cách nhau 1 dòng trống. KHÔNG thêm tiêu đề, giải thích hay markdown nào khác.
- Code: dùng dòng "---python" mở và "---" đóng (KHÔNG dùng backtick).
- Mã loại và mẫu:
Câu 1: [TN] Thiết bị nào dùng để nhập dữ liệu?
A. Màn hình
B. Bàn phím
C. Loa
D. Máy in
Đáp án: B
Gợi ý: Thiết bị nhập đưa dữ liệu VÀO máy tính.

Câu 2: [DS] CPU được gọi là bộ não của máy tính. Đúng hay sai?
Đáp án: Đúng
Gợi ý: ...

Câu 3: [DT] ___ là thiết bị nhập văn bản, ___ hiển thị kết quả.
Đáp án: Bàn phím, Màn hình
Gợi ý: ...

Câu 4: [KT] Phần mềm ___ dùng để soạn văn bản, phần mềm ___ dùng để tính toán.
Từ: Word, Excel, PowerPoint, Paint
Đáp án: Word, Excel
Gợi ý: ...

Câu 5: [SX] Sắp xếp các bước tắt máy tính đúng thứ tự
1. Đóng các chương trình
2. Bấm nút Start
3. Chọn Shut down
Gợi ý: ...

Câu 6: [ND] Ghép thiết bị với chức năng
Bàn phím | Nhập văn bản
Chuột | Di chuyển con trỏ
Loa | Phát âm thanh
Gợi ý: ...

Câu 7: [ST] Sắp xếp các từ sau thành câu hoàn chỉnh
Câu đúng: Bàn phím là thiết bị nhập dữ liệu
Gợi ý: ...

Câu 8: [TL] Em hãy nêu sự khác nhau giữa thiết bị nhập và thiết bị xuất.
Gợi ý: ...
QUY TẮC TỪNG LOẠI (bắt buộc):
- [DT] và [KT]: câu hỏi (hoặc đoạn code) PHẢI chứa đúng số chỗ trống "___" bằng số đáp án. Mỗi đáp án chỉ 1–3 từ (hoặc 1 lệnh/giá trị ngắn), KHÔNG chứa dấu phẩy, vì học sinh phải gõ/kéo cho khớp.
- [KT]: dòng "Từ:" gồm cả từ đúng lẫn 1–3 từ gây nhiễu.
- [SX]: liệt kê các bước theo ĐÚNG THỨ TỰ đúng (hệ thống tự xáo trộn khi hiện cho học sinh). KHÔNG có dòng "Đáp án:".
- [ND]: mỗi dòng "vế trái | vế phải" là một cặp ĐÚNG (hệ thống tự xáo). KHÔNG có dòng "Đáp án:".
- [ST]: chỉ có dòng "Câu đúng:", câu ngắn 5–12 từ, KHÔNG có dòng "Đáp án:".
- [TL]: KHÔNG có dòng "Đáp án:".
- "Gợi ý:" tuyệt đối không chứa đáp án hay diễn đạt lại đáp án. Ví dụ SAI (lộ đáp án): "continue chỉ bỏ qua vòng hiện tại nên vòng lặp vẫn chạy tiếp". Ví dụ ĐÚNG: "Nhớ lại ví dụ điểm danh: bỏ qua một bạn thì cả lớp có dừng điểm danh không?".`

function questionsPrompt({ lessonTitle, grade, topic, sourceText, count, types, difficulty, extra }) {
  const typeList = (types?.length ? types : Object.keys(TYPE_CODES)).filter(t => TYPE_CODES[t]).map(t => `[${TYPE_CODES[t]}]`).join(', ')
  const level = { easy: 'dễ (nhận biết)', medium: 'trung bình (hiểu, áp dụng đơn giản)', hard: 'khó (vận dụng)' }[difficulty] || 'dễ'
  return `Bạn là giáo viên Tin học / lập trình giàu kinh nghiệm, soạn câu hỏi luyện tập cho học sinh${grade ? ` khoá "${grade}"` : ' tiểu học'}.
Soạn ĐÚNG ${count} câu hỏi cho bài "${lessonTitle}"${topic ? ` (chủ đề: ${topic})` : ''}, mức độ ${level}.
Chỉ dùng các loại: ${typeList} — phân bổ đa dạng giữa các loại này.
${extra ? `Yêu cầu thêm của giáo viên: ${extra}\n` : ''}
NGUYÊN TẮC NỘI DUNG:
- Bám ĐÚNG nội dung bài học bên dưới. TUYỆT ĐỐI không hỏi kiến thức, lệnh, khối lệnh không có trong nội dung bài (học sinh chưa học).
- Mỗi câu chỉ có MỘT đáp án đúng rõ ràng, không gây tranh cãi. Đáp án nhiễu phải hợp lý (lỗi học sinh hay mắc), không vô lý.
- Ngôn ngữ ngắn gọn, đúng lứa tuổi. Gọi tên khối lệnh/lệnh/menu đúng như trong bài.
- Mọi câu đều có dòng "Gợi ý:" — gợi ý HƯỚNG SUY NGHĨ cho học sinh khi làm sai, KHÔNG được nói thẳng đáp án.
- Không lặp ý giữa các câu.

${QUESTION_FORMAT}

NỘI DUNG BÀI HỌC:
${sourceText}`
}

function hintsPrompt(items) {
  return `Bạn là giáo viên Tin học tiểu học. Với mỗi câu hỏi dưới đây, viết 1 "gợi ý" hiện cho học sinh khi em trả lời SAI.
Gợi ý hiện ra để em THỬ LẠI — nên nếu gợi ý để lộ đáp án thì em không còn phải suy nghĩ, coi như vô dụng.
Yêu cầu gợi ý:
- Tiếng Việt, ngắn (tối đa khoảng 25 từ), đúng lứa tuổi, giọng nhẹ nhàng.
- Chỉ hướng em NHÌN LẠI chỗ cần chú ý: nhắc khái niệm nền liên quan, một ví dụ đời thường TƯƠNG TỰ, hoặc một câu hỏi ngược để em tự suy ra.
- NGHIÊM CẤM: nêu đáp án; diễn đạt lại / định nghĩa lại đáp án bằng từ khác; ghép các mảnh để thành đáp án; nêu chữ cái A/B/C/D;
  với câu Đúng/Sai: không được viết "Đúng rồi", "Sai rồi", không khẳng định hay phủ định mệnh đề.
  Phép thử: nếu em CHỈ đọc gợi ý (không cần hiểu bài) mà đoán ngay ra đáp án → gợi ý đó SAI, phải viết lại.
- Ví dụ:
  • Câu "___ dùng cho nhiều điều kiện (đáp án elif)": SAI "dùng từ khóa kết hợp else và if" → ĐÚNG "Giữa 'if' đầu tiên và 'else' cuối cùng, Python có một từ khóa riêng cho các điều kiện ở giữa — em xem lại ví dụ xếp loại điểm nhé."
  • Câu "'Nếu… thì' là dạng gì? (đáp án Rẽ nhánh)": SAI "chương trình rẽ sang hướng khác, đó là cấu trúc rẽ nhánh" → ĐÚNG "Chương trình có chạy MỌI lệnh không, hay chọn một trong hai đường tuỳ điều kiện?"
  • Câu Đúng/Sai "remove(5) xoá phần tử có giá trị 5": SAI "Đúng rồi, remove nghĩa là xoá" → ĐÚNG "Em để ý số trong ngoặc là giá trị hay vị trí của phần tử nhé."
- Bám đúng nội dung câu hỏi, không thêm kiến thức ngoài.
Trả về DUY NHẤT JSON: {"hints":[{"id":"...","hint":"..."}]} — đủ mọi id.

CÁC CÂU HỎI:
${items.map(q => `[id=${q.id}] (${q.type}) ${String(q.question).slice(0, 600)}${q.options ? `\n  Lựa chọn: ${q.options}` : ''}${q.correct_answer ? `\n  Đáp án đúng (KHÔNG được tiết lộ): ${q.correct_answer}` : ''}`).join('\n\n')}`
}

// Làm sạch văn bản câu hỏi AI trả về trước khi đưa vào parser của app:
// [SX]/[ND]/[ST]/[TL] không được có dòng "Đáp án:" (parser sẽ hiểu sai → câu hỏng). Với [SX], nếu AI liệt kê
// các bước lộn xộn rồi ghi "Đáp án: 2, 3, 1" thì xếp lại các bước theo đáp án đó trước khi bỏ dòng.
// allowedCodes: bỏ các câu thuộc loại giáo viên KHÔNG chọn (AI đôi khi tự thêm loại khác).
export function sanitizeQuestionText(text, allowedCodes = null) {
  return text.split(/\n(?=Câu\s*\d+\s*:)/).filter(block => {
    const code = block.match(/^Câu\s*\d+\s*:\s*\[(\w+)\]/)?.[1]
    return !allowedCodes || !code || allowedCodes.includes(code)
  }).map(block => {
    const code = block.match(/^Câu\s*\d+\s*:\s*\[(\w+)\]/)?.[1]
    if (!['SX', 'ND', 'ST', 'TL'].includes(code)) return block
    const lines = block.split('\n')
    const ai = lines.findIndex(l => /^Đáp án\s*:/i.test(l.trim()))
    if (ai === -1) return block
    let end = lines.findIndex((l, i) => i > ai && /^Gợi ý\s*:/i.test(l.trim()))
    if (end === -1) end = lines.length
    const answer = lines.slice(ai, end).join(' ').replace(/^Đáp án\s*:/i, '')
    let kept = [...lines.slice(0, ai), ...lines.slice(end)]
    if (code === 'SX') {
      const order = answer.split(/[,\s]+/).map(Number).filter(Boolean)
      const itemIdx = kept.map((l, i) => (/^\s*\d+[.)]\s+/.test(l) ? i : -1)).filter(i => i >= 0)
      const items = itemIdx.map(i => kept[i].replace(/^\s*\d+[.)]\s+/, ''))
      const isPerm = order.length === items.length && [...order].sort((a, b) => a - b).every((v, i) => v === i + 1)
      if (isPerm) itemIdx.forEach((li, k) => { kept[li] = `${k + 1}. ${items[order[k] - 1]}` })
    }
    return kept.join('\n')
  }).join('\n')
}

// Tải PDF slide (chỉ trên Cloudinary) thành inlineData cho Gemini — dùng khi PDF xuất dạng ảnh, không có chữ
async function loadPdfPart(pdfUrl) {
  let url
  try { url = new URL(pdfUrl) } catch { return { error: 'bad_url' } }
  if (url.protocol !== 'https:' || url.hostname !== 'res.cloudinary.com') return { error: 'bad_url' }
  const f = await fetch(url).catch(() => null)
  if (!f?.ok) return { error: 'fetch_failed' }
  const buf = Buffer.from(await f.arrayBuffer())
  if (buf.length > 15 * 1024 * 1024) return { error: 'file_too_large' }
  return { part: { inlineData: { mimeType: 'application/pdf', data: buf.toString('base64') } } }
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
      // PDF xuất dạng ẢNH (không có lớp chữ) → gửi nguyên file cho Gemini đọc bằng thị giác
      const pdf = await loadPdfPart(pdfUrl)
      if (pdf.error) return res.status(400).json({ error: pdf.error })
      extraParts.push(pdf.part)
      prompt = lessonNotesPrompt({ title, grade, topic, slidesText: '(Xem file PDF slide đính kèm — đọc chữ và hình trong từng trang.)' })
      model = 'gemini-2.5-flash'
    } else {
      return res.status(400).json({ error: 'no_text' })
    }
    // 2.5-flash mặc định "suy nghĩ" và tiêu luôn hạn mức token trả về → ghi chú bị cắt cụt; tắt đi
    generationConfig = { temperature: 0.3, maxOutputTokens: 3000, ...(model === 'gemini-2.5-flash' && { thinkingConfig: { thinkingBudget: 0 } }) }
  } else if (action === 'questions') {
    const { lessonTitle, grade, topic, sourceText, pdfUrl, types, difficulty, extra } = req.body
    const count = Math.max(1, Math.min(Number(req.body.count) || 5, 20))
    const text = String(sourceText || '').trim()
    if (!String(lessonTitle || '').trim()) return res.status(400).json({ error: 'no_title' })
    let source = text.slice(0, 25000)
    if (text.length < 40) {
      if (!pdfUrl) return res.status(400).json({ error: 'no_text' })
      const pdf = await loadPdfPart(pdfUrl)
      if (pdf.error) return res.status(400).json({ error: pdf.error })
      extraParts.push(pdf.part)
      source = '(Xem file PDF slide bài học đính kèm.)'
    }
    model = 'gemini-2.5-flash'   // soạn câu hỏi cần chính xác hơn → dùng model mạnh hơn
    prompt = questionsPrompt({ lessonTitle, grade, topic, sourceText: source, count, types, difficulty, extra: String(extra || '').slice(0, 500) })
    generationConfig = { temperature: 0.6, maxOutputTokens: 8000, thinkingConfig: { thinkingBudget: 0 } }
  } else if (action === 'hints') {
    const items = Array.isArray(req.body.items) ? req.body.items.slice(0, 30) : []
    if (!items.length) return res.status(400).json({ error: 'no_items' })
    prompt = hintsPrompt(items)
    generationConfig = { temperature: 0.4, maxOutputTokens: 4000, responseMimeType: 'application/json' }
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
  // Bỏ fence ``` nếu AI lỡ bọc cả khối (định dạng câu hỏi dùng ---python, không dùng backtick)
  if (action === 'questions') {
    const allowed = Array.isArray(req.body.types) && req.body.types.length ? req.body.types.map(t => TYPE_CODES[t]).filter(Boolean) : null
    return res.status(200).json({ text: sanitizeQuestionText(text.replace(/^```[a-z]*\n|\n```$/g, ''), allowed) })
  }
  if (action === 'hints') {
    try {
      const parsed = JSON.parse(text.replace(/```json\s*|\s*```/g, ''))
      return res.status(200).json({ hints: Array.isArray(parsed.hints) ? parsed.hints : [] })
    } catch {
      return res.status(500).json({ error: 'parse_error' })
    }
  }

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
