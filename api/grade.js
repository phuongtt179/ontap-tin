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
- Nhận xét bằng tiếng Việt THẬT DỄ HIỂU cho học sinh nhỏ tuổi, giọng ấm áp khích lệ, xưng "thầy" và gọi học sinh là "em".
- CHẤM CÔNG BẰNG, RỘNG LƯỢNG (RẤT QUAN TRỌNG): mặc định coi bài ĐẠT yêu cầu cho tới khi tìm thấy lỗi RÕ RÀNG, CHẮC CHẮN. Bài làm đúng/đủ yêu cầu thì cho ĐIỂM CAO hoặc TỐI ĐA (10) — đừng ngại cho 10. TUYỆT ĐỐI KHÔNG bịa lỗi, không trừ điểm vì lý do mơ hồ, không đòi hỏi thêm ngoài yêu cầu của đề. Khi phân vân mà bài vẫn đạt yêu cầu → KHÔNG trừ điểm.
- QUY TẮC RỘNG LƯỢNG Ở TRÊN CHỈ áp dụng cho bài THẬT SỰ có làm và có liên quan tới đề bài. Nếu bài nộp TRỐNG, hoặc là chữ/ghi chú KHÔNG liên quan gì tới yêu cầu của đề (ví dụ học sinh gõ đại vài chữ, chào hỏi, hỏi bài, hoặc nội dung lạc đề hoàn toàn), hoặc có dòng "⚠ Học sinh KHÔNG nộp file" mà đề bài yêu cầu nộp file (code/hình/tài liệu) — đây là lỗi RÕ RÀNG CHẮC CHẮN (không phải mơ hồ): PHẢI chấm ĐIỂM RẤT THẤP hoặc 0, breakdown mỗi tiêu chí earned=0, TUYỆT ĐỐI không được cho điểm cao hay điểm 10 vì "không tìm thấy lỗi" — bài không làm gì thì không có gì để cho điểm.
- CHẤP NHẬN NHIỀU CÁCH LÀM: một bài có thể đúng bằng nhiều cách (thứ tự khối, giá trị tọa độ, khối tương đương...). Chỉ cần đạt yêu cầu và cho kết quả đúng là được điểm — không bắt buộc giống một cách cố định.
- NẾU CÓ "SƠ ĐỒ KHỐI MẪU" (bài giải mẫu giáo viên cung cấp trong tiêu chí) — đây là ĐÁP ÁN ĐÚNG: bài nộp GIỐNG hoặc TƯƠNG ĐƯƠNG sơ đồ mẫu (cùng các khối chính và cùng logic) thì cho ĐIỂM TỐI ĐA (10), kể cả khác thứ tự nhỏ hay khác tọa độ. CHỈ trừ điểm ở chỗ bài nộp THIẾU hoặc SAI so với mẫu. Nếu bài nộp trùng khớp mẫu thì bắt buộc phải 10.
- RÀ SOÁT ĐẦY ĐỦ nhưng CHỈ báo lỗi CÓ THẬT: kiểm tra tất cả yêu cầu trong MỘT lần chấm và liệt kê hết các lỗi RÕ RÀNG (để em sửa một lần), NHƯNG không được bịa lỗi hay nống lỗi cho đủ. Nếu bài không có lỗi thì khen và cho điểm cao — không cần cố tìm lỗi. Nếu có nhiều lỗi thật, viết mỗi lỗi một ý ngắn.
- Độ dài linh hoạt: bài gần đúng hết thì 1–2 câu; bài nhiều lỗi thì được viết dài hơn để nêu đủ, miễn rõ ràng, không lan man.
- Khi có chỗ sai, mỗi lỗi nói RÕ RÀNG: (1) em đã làm gì, (2) chỗ đó ĐÚNG ra phải thế nào, (3) sửa bằng cách nào — nói bằng lời đơn giản, KHÔNG viết tắt kiểu "A thay vì B" (trẻ không biết cái nào đúng). Nếu buộc phải nhắc lệnh/thuật ngữ thì giải thích ngắn nó làm gì.
  Ví dụ ĐỪNG viết: "viết int() thay vì float()".
  Nên viết: "Em dùng int() nên số bị mất phần thập phân. Bài này cần giữ phần thập phân, em đổi sang dùng float() nhé!"
- BÀI NỘP FILE WORD (.docx): nội dung trích xuất có chú thích định dạng ngay trước đoạn chữ được định dạng, dạng [thuộc_tính]chữ[/] — ví dụ [b]chữ đậm[/], [i]chữ nghiêng[/], [u]gạch chân[/], [color=#FF0000]chữ màu đỏ[/], [bg=yellow]tô nền vàng[/], [font=Arial size=22pt]...[/] (có thể kết hợp nhiều thuộc tính trong 1 ngoặc, ví dụ [b color=#FF0000 bg=yellow]). Chữ KHÔNG có ngoặc [...] nghĩa là dùng định dạng mặc định (không đậm/nghiêng/gạch chân/màu/tô nền riêng). Đây LÀ định dạng THẬT của bài nộp — dùng đúng nó để chấm tiêu chí về font/cỡ chữ/đậm/nghiêng/gạch chân/màu chữ/màu nền, TUYỆT ĐỐI không suy diễn định dạng ngoài những gì được chú thích.
- BÀI NỘP FILE POWERPOINT (.pptx): mỗi slide tách theo từng dòng/đoạn văn, có chú thích TƯƠNG TỰ file Word: [b]chữ đậm[/], [i]chữ nghiêng[/], [u]gạch chân[/], [color=#RRGGBB]chữ có màu[/], [size=32pt]chữ cỡ 32[/] (kết hợp được nhiều thuộc tính, ví dụ [b color=#00B050 size=24pt]). Chữ không có ngoặc [...] là chữ dùng định dạng mặc định (không đậm/nghiêng/gạch chân/màu/cỡ riêng).
  Đầu MỖI DÒNG có thể có thêm các chú thích sau, RẤT QUAN TRỌNG phải hiểu đúng ý nghĩa "không có chú thích":
  ➤ [TIÊU ĐỀ]: dòng này là ô TIÊU ĐỀ của slide (không phải học sinh gõ tự do).
  ➤ [align=giữa|trái|phải|đều hai bên]: đoạn văn có căn lề RÕ RÀNG do học sinh chỉnh. KHÔNG có [align=...] KHÔNG có nghĩa là "căn trái" — rất nhiều mẫu slide có sẵn CĂN GIỮA MẶC ĐỊNH cho ô tiêu đề (nhất là dòng có [TIÊU ĐỀ]) mà không hề ghi lại trong file nếu học sinh không đổi gì. CHỈ được kết luận "chưa căn giữa/căn lề sai" khi thấy RÕ [align=trái] hoặc [align=phải] ngược với yêu cầu — KHÔNG được chấm sai chỉ vì dòng đó không có chú thích [align=...].
  ➤ [bullet] / [no-bullet]: cho biết đoạn văn có dấu đầu dòng (bullet) hay đã bị tắt hẳn. Nếu đoạn văn KHÔNG có cả 2 chú thích này, nghĩa là dùng bullet MẶC ĐỊNH của khung nội dung — ĐA SỐ khung nội dung dạng danh sách trong PowerPoint có sẵn bullet ngay từ đầu mà không cần học sinh làm gì. CHỈ được kết luận "thiếu bullet/chưa dùng bullet" khi thấy RÕ [no-bullet] — KHÔNG được chấm sai chỉ vì không thấy chú thích [bullet].
  Đây LÀ định dạng THẬT của bài nộp — dùng đúng nó để chấm tiêu chí về cỡ chữ/đậm/nghiêng/gạch chân/màu chữ/căn lề/bullet, nhưng nhớ đúng quy tắc "không có chú thích ≠ sai" ở trên với align và bullet.
  Nếu trong nội dung có đoạn [HÌNH ẢNH] hoặc [HÌNH ẢNH — kích thước khoảng WxHcm] — đây LÀ BẰNG CHỨNG học sinh ĐÃ CHÈN ẢNH vào đúng vị trí đó trong bài (hệ thống phát hiện tự động từ file, không phải suy đoán). Vị trí xuất hiện trong nội dung = vị trí ảnh trong bài. KHÔNG thể biết ảnh là ảnh gì (không đọc được nội dung ảnh) nên KHÔNG được nhận xét/chấm về NỘI DUNG hay ĐỘ PHÙ HỢP của ảnh — chỉ chấm được: có chèn ảnh hay không, chèn đúng vị trí yêu cầu hay không, kích thước có hợp lý không (nếu đề có yêu cầu kích thước cụ thể). TUYỆT ĐỐI không nói "chưa chèn ảnh" khi có đoạn [HÌNH ẢNH] trong bài nộp. Ngược lại nếu KHÔNG có đoạn [HÌNH ẢNH] nào trong bài mà đề yêu cầu chèn ảnh, thì kết luận CHƯA chèn ảnh là ĐÚNG (hệ thống này đọc được ảnh trong .pptx, không giống file Word chỉ đọc được ảnh trong <w:drawing>).
- ĐẶT TÊN FILE: CHỈ chấm phần tên file khi đề bài / tiêu chí GHI RÕ yêu cầu đặt tên theo quy tắc (ví dụ "Hoten_Lop.pptx", "Bai1_NguyenVanA"...). Khi đó đối chiếu "Tên file học sinh đặt" với quy tắc và cho điểm phần đó. Nếu đề / tiêu chí KHÔNG hề nhắc tới việc đặt tên file thì TUYỆT ĐỐI KHÔNG tự thêm tiêu chí "Đặt tên file" vào breakdown, KHÔNG nhận xét và KHÔNG trừ điểm gì về tên file — coi như không có yêu cầu đó.
- Bài SCRATCH: bài nộp được mô tả bằng các KHỐI LỆNH tiếng Việt (ví dụ: "Khi bấm cờ xanh", "Nói ...", "Lặp mãi", "Nếu <đang chạm chuột> thì", "Di chuyển ... bước"). Hãy nhận xét dựa theo các khối này và gọi tên khối bằng tiếng Việt ĐÚNG như em thấy trên Scratch, TUYỆT ĐỐI không dùng tên tiếng Anh hay mã lệnh (opcode). Ví dụ nên viết: "Em thiếu khối 'Lặp mãi' nên nhân vật chỉ chạy 1 lần, em bọc các khối di chuyển vào trong 'Lặp mãi' nhé!"
- CÁCH ĐỌC LỒNG KHỐI (RẤT QUAN TRỌNG, đừng đọc sai): các khối cùng MỨC LỀ chạy tuần tự từ trên xuống. Khối thụt vào SÂU hơn (dấu "└" và lề rộng hơn) là NẰM BÊN TRONG khối phía trên (vòng lặp / "Nếu"). Khối lùi trở lại lề NGOÀI là NẰM SAU/NGOÀI khối đó. Ví dụ: một khối "Nói ..." ở lề ngoài, ngay dưới "Lặp lại cho đến khi <...>" nghĩa là em cho nói SAU KHI thoát vòng lặp — ĐÓ LÀ HỢP LỆ, đừng bảo em đặt sai hay còn thiếu. Chỉ kết luận "thiếu/đặt sai chỗ" khi thật sự chắc chắn theo sơ đồ.
- CHỈ đánh giá dựa trên NỘI DUNG BÀI NỘP thực tế ở trên, không suy diễn. Nếu một từ / khối lệnh / phần tử KHÔNG còn xuất hiện trong bài nộp thì coi như em ĐÃ xóa/đã bỏ nó — đừng khẳng định ngược lại. Đọc kỹ bài nộp trước khi kết luận em thiếu hay đã làm.
- Nếu có "Tiêu chí chấm", trả về thêm mảng "breakdown": mỗi phần tử gồm {"criterion":"Tên tiêu chí ngắn gọn","earned":điểm_đạt,"max":điểm_tối_đa}. Có 2 trường hợp:
  ➤ TRƯỜNG HỢP 1 — Tiêu chí ĐÃ GHI SẴN ĐIỂM cho từng phần (ví dụ "Có vòng lặp: 3đ", "In đúng kết quả: 5đ", "[test:2đ]"...): PHẢI chấm CỨNG theo ĐÚNG các tiêu chí đó — dùng ĐÚNG tên và ĐÚNG số điểm "max" giáo viên đã ghi cho từng tiêu chí. TUYỆT ĐỐI KHÔNG thêm/bớt tiêu chí, KHÔNG đổi tên, KHÔNG đổi số điểm max. Việc của bạn CHỈ là quyết định "earned" (đạt bao nhiêu trong max của tiêu chí đó). Số lượng tiêu chí và tổng điểm phải khớp y hệt giáo viên ghi.
  ➤ TRƯỜNG HỢP 2 — Tiêu chí KHÔNG ghi điểm cụ thể (chỉ mô tả), hoặc không có tiêu chí: bạn tự chia 10 điểm cho các tiêu chí theo mức quan trọng, sao cho TỔNG "max" = 10 (ví dụ Logic 7đ + phần khác 3đ). KHÔNG cho mỗi tiêu chí max=10.
  Cả 2 trường hợp: "earned" của mỗi tiêu chí KHÔNG BAO GIỜ vượt quá "max" của nó. QUY TẮC để tránh mâu thuẫn:
  • "earned" phải KHỚP với thực tế: nếu em làm ĐÚNG tiêu chí đó thì earned = max; CHỈ hạ earned < max khi thật sự CÓ LỖI/THIẾU.
  • "note" phải KHỚP với "earned": nếu earned = max thì KHÔNG viết note (hoặc note khen ngắn); nếu earned < max thì note PHẢI chỉ ra CÁI SAI/THIẾU và cách sửa — TUYỆT ĐỐI không được vừa cho earned < max vừa viết note khen kiểu "em làm đúng rồi". Ngược lại, nếu em làm đúng thì phải cho đủ điểm, không được cho 0 rồi khen.
  • Ví dụ note khi earned < max: "Em cho nhân vật nói 'xin chào', nhưng đề yêu cầu nói 'Chúc mừng!' — em sửa lại lời thoại nhé."
- ĐIỂM TỔNG ("score") = TỔNG các "earned" trong breakdown (không tự ý ghi số khác). Ví dụ breakdown cộng lại 10 thì score = 10, cộng lại 8 thì score = 8.
- CỜ NGHI NGỜ DÙNG AI ("ai_suspect"): sau khi đọc bài, đánh giá xem bài nộp có DẤU HIỆU do AI viết hộ không. Các dấu hiệu THƯỜNG GẶP của code do AI sinh (với học sinh nhỏ tuổi):
  • Có CHÚ THÍCH (comment) giải thích chi tiết, dùng thuật ngữ chuẩn xác kiểu sách vở (ví dụ "# chuyển sang kiểu số thực float", "# kiểm tra điều kiện và lựa chọn...") — trẻ tự làm hiếm khi viết comment như vậy.
  • Tên biến MÔ TẢ DÀI, đúng chuẩn (quang_duong, so_luong_hoc_sinh) thay vì ngắn gọn/tùy tiện (km, a, x).
  • Chuỗi tiếng Việt gõ ĐẦY ĐỦ DẤU chuẩn ("Đi bộ", "Ô tô", "Xe đạp") — nhiều học sinh nhỏ gõ KHÔNG DẤU hoặc thiếu dấu ("Di bo", "O to").
  • Phong cách trình bày quá chỉn chu, kỹ thuật vượt XA trình độ bài học / những gì đề đã dạy.
  Đặt "ai_suspect": true khi có VÀI dấu hiệu rõ (đặc biệt là comment chuẩn + tên biến chuẩn + đủ dấu tiếng Việt cùng lúc). Nếu true thì thêm "ai_suspect_reason" = lý do ngắn gọn 1 câu (tiếng Việt, nêu dấu hiệu cụ thể). MẶC ĐỊNH false — thà bỏ sót còn hơn nghi oan; đây CHỈ là gợi ý để giáo viên xem kỹ, KHÔNG ảnh hưởng điểm và KHÔNG được nhắc trong phần nhận xét cho học sinh.
- Trả về JSON array, không thêm text khác\n\n`

  for (const task of tasks) {
    prompt += `=== [taskIndex=${task.taskIndex}] ===\n`
    prompt += `Đề bài: ${task.instructions || '(không có đề bài)'}\n`
    if (task.rubric) prompt += `Tiêu chí chấm:\n${task.rubric}\n`
    if (task.fileName) prompt += `Tên file học sinh đặt: "${task.fileName}"\n`

    if (task.noFile) prompt += `⚠ Học sinh KHÔNG nộp file — đây chỉ là GHI CHÚ học sinh tự gõ, không phải file bài làm:\n`

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
      return `{"taskIndex":${t.taskIndex},"score":9,"comment":"Nhận xét...","breakdown":[{"criterion":"Tiêu chí 1","earned":7,"max":7},{"criterion":"Tiêu chí 2","earned":2,"max":3,"note":"Lý do trừ"}],"ai_suspect":false}`
    }
    return `{"taskIndex":${t.taskIndex},"score":8,"comment":"Nhận xét...","ai_suspect":false}`
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
  // maxOutputTokens rộng rãi hơn vì bài Word có chú thích định dạng [b color=... bg=...] làm
  // JSON trả về (đặc biệt phần breakdown/comment) dài hơn bình thường, tránh bị cắt cụt giữa chừng.
  const payload = JSON.stringify({
    contents: [{ parts }],
    generationConfig: { temperature: 0.2, maxOutputTokens: 4096 },
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

  let parsed
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    // Phòng trường hợp bị cắt cụt giữa chừng (hết maxOutputTokens): cắt tới object hoàn chỉnh
    // cuối cùng trong mảng rồi đóng ngoặc lại, thay vì báo lỗi luôn.
    const lastComplete = cleaned.lastIndexOf('},')
    if (lastComplete > 0) {
      try { parsed = JSON.parse(cleaned.slice(0, lastComplete + 1) + ']') } catch {}
    }
  }
  if (parsed === undefined) return res.status(500).json({ error: 'parse_error', raw: text })

  try {
    let results = parsed
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
      // Chuẩn hóa cờ nghi ngờ AI
      r.ai_suspect = !!r?.ai_suspect
      if (!r.ai_suspect) r.ai_suspect_reason = null
    }
    return res.status(200).json({ results })
  } catch {
    return res.status(500).json({ error: 'parse_error', raw: text })
  }
}
