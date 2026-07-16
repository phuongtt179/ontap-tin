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
- Nhận xét bằng tiếng Việt THẬT DỄ HIỂU cho học sinh nhỏ tuổi, giọng ấm áp khích lệ, xưng "thầy/cô" và gọi học sinh là "em".
- CHẤM CÔNG BẰNG, RỘNG LƯỢNG (RẤT QUAN TRỌNG): mặc định coi bài ĐẠT yêu cầu cho tới khi tìm thấy lỗi RÕ RÀNG, CHẮC CHẮN. Bài làm đúng/đủ yêu cầu thì cho ĐIỂM CAO hoặc TỐI ĐA (10) — đừng ngại cho 10. TUYỆT ĐỐI KHÔNG bịa lỗi, không trừ điểm vì lý do mơ hồ, không đòi hỏi thêm ngoài yêu cầu của đề. Khi phân vân mà bài vẫn đạt yêu cầu → KHÔNG trừ điểm.
- CHẤP NHẬN NHIỀU CÁCH LÀM: một bài có thể đúng bằng nhiều cách (thứ tự khối, giá trị tọa độ, khối tương đương...). Chỉ cần đạt yêu cầu và cho kết quả đúng là được điểm — không bắt buộc giống một cách cố định.
- NẾU CÓ "SƠ ĐỒ KHỐI MẪU" (bài giải mẫu giáo viên cung cấp trong tiêu chí) — đây là ĐÁP ÁN ĐÚNG: bài nộp GIỐNG hoặc TƯƠNG ĐƯƠNG sơ đồ mẫu (cùng các khối chính và cùng logic) thì cho ĐIỂM TỐI ĐA (10), kể cả khác thứ tự nhỏ hay khác tọa độ. CHỈ trừ điểm ở chỗ bài nộp THIẾU hoặc SAI so với mẫu. Nếu bài nộp trùng khớp mẫu thì bắt buộc phải 10.
- RÀ SOÁT ĐẦY ĐỦ nhưng CHỈ báo lỗi CÓ THẬT: kiểm tra tất cả yêu cầu trong MỘT lần chấm và liệt kê hết các lỗi RÕ RÀNG (để em sửa một lần), NHƯNG không được bịa lỗi hay nống lỗi cho đủ. Nếu bài không có lỗi thì khen và cho điểm cao — không cần cố tìm lỗi. Nếu có nhiều lỗi thật, viết mỗi lỗi một ý ngắn.
- Độ dài linh hoạt: bài gần đúng hết thì 1–2 câu; bài nhiều lỗi thì được viết dài hơn để nêu đủ, miễn rõ ràng, không lan man.
- Khi có chỗ sai, mỗi lỗi nói RÕ RÀNG: (1) em đã làm gì, (2) chỗ đó ĐÚNG ra phải thế nào, (3) sửa bằng cách nào — nói bằng lời đơn giản, KHÔNG viết tắt kiểu "A thay vì B" (trẻ không biết cái nào đúng). Nếu buộc phải nhắc lệnh/thuật ngữ thì giải thích ngắn nó làm gì.
  Ví dụ ĐỪNG viết: "viết int() thay vì float()".
  Nên viết: "Em dùng int() nên số bị mất phần thập phân. Bài này cần giữ phần thập phân, em đổi sang dùng float() nhé!"
- ĐẶT TÊN FILE: nếu đề bài / tiêu chí yêu cầu học sinh đặt tên file theo quy tắc (ví dụ "Hoten_Lop.pptx", "Bai1_NguyenVanA"...), hãy đối chiếu "Tên file học sinh đặt" ở trên với quy tắc và nhận xét đúng/sai, chấm điểm phần đó. Nếu đề KHÔNG yêu cầu về tên file thì BỎ QUA, đừng bắt lỗi tên file.
- Bài SCRATCH: bài nộp được mô tả bằng các KHỐI LỆNH tiếng Việt (ví dụ: "Khi bấm cờ xanh", "Nói ...", "Lặp mãi", "Nếu <đang chạm chuột> thì", "Di chuyển ... bước"). Hãy nhận xét dựa theo các khối này và gọi tên khối bằng tiếng Việt ĐÚNG như em thấy trên Scratch, TUYỆT ĐỐI không dùng tên tiếng Anh hay mã lệnh (opcode). Ví dụ nên viết: "Em thiếu khối 'Lặp mãi' nên nhân vật chỉ chạy 1 lần, em bọc các khối di chuyển vào trong 'Lặp mãi' nhé!"
- CÁCH ĐỌC LỒNG KHỐI (RẤT QUAN TRỌNG, đừng đọc sai): các khối cùng MỨC LỀ chạy tuần tự từ trên xuống. Khối thụt vào SÂU hơn (dấu "└" và lề rộng hơn) là NẰM BÊN TRONG khối phía trên (vòng lặp / "Nếu"). Khối lùi trở lại lề NGOÀI là NẰM SAU/NGOÀI khối đó. Ví dụ: một khối "Nói ..." ở lề ngoài, ngay dưới "Lặp lại cho đến khi <...>" nghĩa là em cho nói SAU KHI thoát vòng lặp — ĐÓ LÀ HỢP LỆ, đừng bảo em đặt sai hay còn thiếu. Chỉ kết luận "thiếu/đặt sai chỗ" khi thật sự chắc chắn theo sơ đồ.
- CHỈ đánh giá dựa trên NỘI DUNG BÀI NỘP thực tế ở trên, không suy diễn. Nếu một từ / khối lệnh / phần tử KHÔNG còn xuất hiện trong bài nộp thì coi như em ĐÃ xóa/đã bỏ nó — đừng khẳng định ngược lại. Đọc kỹ bài nộp trước khi kết luận em thiếu hay đã làm.
- Nếu có "Tiêu chí chấm", trả về thêm mảng "breakdown": mỗi phần tử gồm {"criterion":"Tên tiêu chí ngắn gọn","earned":điểm_đạt,"max":điểm_tối_đa}. "earned" của mỗi tiêu chí KHÔNG BAO GIỜ vượt quá "max" của tiêu chí đó (ví dụ max=2 thì earned tối đa là 2). QUY TẮC BẮT BUỘC để tránh mâu thuẫn:
  • "earned" phải KHỚP với thực tế: nếu em làm ĐÚNG tiêu chí đó thì earned = max; CHỈ hạ earned < max khi thật sự CÓ LỖI/THIẾU.
  • "note" phải KHỚP với "earned": nếu earned = max thì KHÔNG viết note (hoặc note khen ngắn); nếu earned < max thì note PHẢI chỉ ra CÁI SAI/THIẾU và cách sửa — TUYỆT ĐỐI không được vừa cho earned < max vừa viết note khen kiểu "em làm đúng rồi". Ngược lại, nếu em làm đúng thì phải cho đủ điểm, không được cho 0 rồi khen.
  • Ví dụ note khi earned < max: "Em cho nhân vật nói 'xin chào', nhưng đề yêu cầu nói 'Chúc mừng!' — em sửa lại lời thoại nhé."
- ĐIỂM TỔNG ("score") = TỔNG các "earned" trong breakdown (không tự ý ghi số khác). Ví dụ breakdown cộng lại 10 thì score = 10, cộng lại 8 thì score = 8.
- Trả về JSON array, không thêm text khác\n\n`

  for (const task of tasks) {
    prompt += `=== [taskIndex=${task.taskIndex}] ===\n`
    prompt += `Đề bài: ${task.instructions || '(không có đề bài)'}\n`
    if (task.rubric) prompt += `Tiêu chí chấm:\n${task.rubric}\n`
    if (task.fileName) prompt += `Tên file học sinh đặt: "${task.fileName}"\n`

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
    let results = JSON.parse(cleaned)
    if (!Array.isArray(results)) results = [results]
    // Đồng bộ điểm tổng với bảng tiêu chí: điểm = tổng điểm đạt / tổng điểm tối đa × 10
    // (tránh trường hợp AI ghi score lệch với breakdown, hoặc bảng cộng ra 10 mà score ghi 8)
    for (const r of results) {
      if (Array.isArray(r?.breakdown) && r.breakdown.length) {
        let earned = 0, max = 0
        for (const b of r.breakdown) {
          const bmax = Number(b.max) || 0
          const be = Math.max(0, Math.min(Number(b.earned) || 0, bmax)) // earned không vượt quá max, không âm
          b.earned = be
          b.max = bmax
          earned += be
          max += bmax
        }
        if (max > 0) r.score = Math.round((earned / max) * 10 * 10) / 10
      }
    }
    return res.status(200).json({ results })
  } catch {
    return res.status(500).json({ error: 'parse_error', raw: text })
  }
}
