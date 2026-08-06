// Tách 1 đoạn text dán vào thành nhiều bài thực hành, mỗi bài tự tách luôn phần
// "Tiêu chí chấm" (nếu có) ra khỏi đề bài — tiêu chí chấm luôn nằm ở CUỐI mỗi bài.

// Dòng bắt đầu 1 bài mới, ví dụ: "BÀI 5 – ...", "Bài 1:", "Bài 2."
const TASK_HEADING_RE = /^[ \t]*BÀI\s*\d+\b.*$/gim

// Dòng đánh dấu bắt đầu phần tiêu chí chấm (chỉ AI đọc, học sinh không thấy)
const RUBRIC_HEADING_RE = /^[ \t]*(?:TIÊU CHÍ CHẤM(?:\s*ĐIỂM)?|RUBRIC)\s*:?[ \t]*$/im

function splitRubric(block) {
  const m = block.match(RUBRIC_HEADING_RE)
  if (!m) return { instructions: block.trim(), rubric: '' }
  const idx = block.indexOf(m[0])
  return {
    instructions: block.slice(0, idx).trim(),
    rubric: block.slice(idx + m[0].length).trim(),
  }
}

export function parsePracticeTasks(rawText) {
  const text = (rawText || '').replace(/\r\n/g, '\n').trim()
  if (!text) return []

  const marks = [...text.matchAll(TASK_HEADING_RE)]
  let blocks
  if (marks.length >= 2) {
    blocks = marks.map((m, i) => {
      const end = i + 1 < marks.length ? marks[i + 1].index : text.length
      return text.slice(m.index, end).trim()
    })
  } else {
    blocks = [text]
  }

  return blocks
    .map(splitRubric)
    .filter(t => t.instructions || t.rubric)
}
