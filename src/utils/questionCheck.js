// Soát lỗi cấu trúc các câu hỏi đã parse (từ utils/questionParser.js) — dùng sau khi AI soạn câu hỏi,
// để giáo viên biết câu nào cần sửa trước khi lưu. Trả về [{ index, msg }].
export function checkParsedQuestions(parsed) {
  const issues = []
  parsed.forEach((q, i) => {
    const add = msg => issues.push({ index: i, msg })
    const blanks = (String(q.question).match(/___/g) || []).length
    const answers = String(q.correct_answer || '').split(',').map(s => s.trim()).filter(Boolean)
    if (q.type === 'fill_blank' || q.type === 'drag_word') {
      if (blanks === 0) add('không có chỗ trống ___')
      else if (blanks !== answers.length) add(`có ${blanks} chỗ trống nhưng ${answers.length} đáp án`)
      if (answers.some(a => a.split(/\s+/).length > 4)) add('đáp án quá dài, học sinh khó gõ khớp')
    }
    if (q.type === 'drag_word') {
      const words = (q.options || []).map(o => String(o.text).trim())
      if (answers.some(a => !words.includes(a))) add('đáp án không có trong danh sách từ kéo thả')
    }
    if (q.type === 'multiple_choice') {
      if ((q.options || []).length < 2) add('thiếu lựa chọn A/B/C/D')
      if (!(q.options || []).some(o => o.key === q.correct_answer)) add('đáp án không khớp lựa chọn nào')
    }
    if (q.type === 'true_false' && !['Đúng', 'Sai'].includes(String(q.correct_answer).trim())) add('đáp án phải là Đúng hoặc Sai')
    if (q.type === 'matching' && ((q.options || []).length < 2 || (q.options || []).length !== (q.match_options || []).length)) add('số vế trái và vế phải không khớp')
    if (q.type === 'ordering' && (q.options || []).length < 2) add('cần ít nhất 2 bước')
    if (q.type !== 'essay' && !String(q.hint || '').trim()) add('thiếu gợi ý')
  })
  return issues
}
