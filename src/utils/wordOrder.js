// Câu hỏi "Sắp xếp thành câu" (word_order) tách theo CỤM TỪ thay vì từng tiếng.
// Tiếng Việt viết cách từng tiếng ("Bàn phím là thiết bị") → tách theo dấu cách ra quá nhiều mảnh lẻ, khó sắp xếp.
// - Giáo viên tự chia cụm bằng dấu "/": "Hiệu ứng / giúp bài trình bày / sinh động hơn"
// - Không có "/" (kể cả câu hỏi cũ đã lưu theo từng tiếng): tự gom thành cụm 2–3 tiếng liền nhau.

// Gom các tiếng liền nhau thành cụm: câu ≤ 4 tiếng giữ nguyên; dài hơn chia thành 3–6 cụm đều nhau
export function autoChunk(words) {
  const n = words.length
  if (n <= 4) return [...words]
  const k = Math.min(6, Math.max(3, Math.round(n / 2.5)))
  const chunks = []
  let start = 0
  for (let i = 0; i < k; i++) {
    const end = Math.round(((i + 1) * n) / k)
    chunks.push(words.slice(start, end).join(' '))
    start = end
  }
  return chunks.filter(Boolean)
}

// Chuỗi giáo viên nhập → { sentence: câu đúng (không còn "/"), chunks: các cụm theo đúng thứ tự }
export function splitPhrases(input) {
  const raw = String(input || '').trim()
  if (raw.includes('/')) {
    const chunks = raw.split('/').map(s => s.trim().replace(/\s+/g, ' ')).filter(Boolean)
    return { sentence: chunks.join(' '), chunks }
  }
  const words = raw.split(/\s+/).filter(Boolean)
  return { sentence: words.join(' '), chunks: autoChunk(words) }
}

const optText = o => (typeof o === 'string' ? o : o?.text || '').trim()

// Tách options đã lưu thành { chunks (đúng thứ tự, ghép lại = câu đúng), distractors (từ gây nhiễu) }
export function storedPhrases(q) {
  const sentence = String(q.correct_answer || '').trim().replace(/\s+/g, ' ')
  const opts = (q.options || []).map(optText).filter(Boolean)
  const chunks = []
  let i = 0
  // options lưu theo thứ tự đúng, từ gây nhiễu nối phía sau
  for (; i < opts.length; i++) {
    const next = [...chunks, opts[i]].join(' ')
    if (sentence.toLowerCase().startsWith(next.toLowerCase())) chunks.push(opts[i])
    else break
  }
  if (chunks.join(' ').toLowerCase() === sentence.toLowerCase()) return { chunks, distractors: opts.slice(i) }
  // không khớp (dữ liệu cũ lạ) → coi mọi option là mảnh của câu
  return { chunks: opts, distractors: [] }
}

// Các "thẻ" hiện cho học sinh bấm/kéo (chưa xáo trộn)
export function phraseBank(q) {
  const sentenceWords = String(q.correct_answer || '').trim().split(/\s+/).filter(Boolean)
  const opts = (q.options || []).map(optText).filter(Boolean)
  if (!opts.length) return autoChunk(sentenceWords)
  const { chunks, distractors } = storedPhrases(q)
  // Đã lưu theo cụm (có thẻ nhiều tiếng) → dùng nguyên; lưu theo từng tiếng (dữ liệu cũ) → gom lại thành cụm
  if (chunks.some(c => /\s/.test(c))) return [...chunks, ...distractors]
  return [...autoChunk(chunks.length ? chunks : sentenceWords), ...distractors]
}

// So câu học sinh ghép (các thẻ nối bằng ",") với câu đúng — bỏ qua hoa/thường, dấu phẩy, khoảng trắng thừa
export function sameSentence(answer, correct) {
  const norm = s => String(s || '').toLowerCase().replace(/[,/]/g, ' ').replace(/\s+/g, ' ').trim()
  return !!answer && norm(answer) === norm(correct)
}
