// Tách 1 đoạn text dán vào thành nhiều bài thực hành, mỗi bài tự tách luôn phần
// "Tiêu chí chấm" (nếu có) ra khỏi đề bài — tiêu chí chấm luôn nằm ở CUỐI mỗi bài.

// Dòng bắt đầu 1 bài mới, ví dụ: "BÀI 5 – ...", "Bài 1:", "Bài 2."
const TASK_HEADING_RE = /^[ \t]*BÀI\s*\d+\b.*$/gim

// Dòng đánh dấu bắt đầu phần tiêu chí chấm (chỉ AI đọc, học sinh không thấy).
// Không yêu cầu cả dòng phải khớp chính xác — chỉ cần dòng đó CÓ chứa cụm "tiêu chí chấm"
// (kể cả kèm icon/emoji, "(Tổng: X điểm)"... phía trước/sau) là coi như bắt đầu phần rubric.
const RUBRIC_MARK_RE = /tiêu\s*chí\s*chấm|rubric/i

function splitRubric(block) {
  const lines = block.split('\n')
  const idx = lines.findIndex(l => RUBRIC_MARK_RE.test(l))
  if (idx === -1) return { instructions: block.trim(), rubric: '' }
  return {
    instructions: lines.slice(0, idx).join('\n').trim(),
    rubric: lines.slice(idx).join('\n').trim(),
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
