/**
 * Parse text copied from Word into structured questions.
 * Supports: multiple_choice, true_false, fill_blank, drag_word, ordering, matching
 */

export function parseQuestions(rawText) {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean)
  const questions = []
  let current = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Detect start of a new question
    const questionMatch = line.match(/^(?:Câu\s*)?(\d+)[.):]\s*(.+)$/i)
    if (questionMatch) {
      if (current) questions.push(finalizeQuestion(current))
      current = {
        order: parseInt(questionMatch[1]),
        question: questionMatch[2],
        type: 'fill_blank',
        options: [],
        match_options: [],
        correct_answer: null,
        image_url: null,
      }
      continue
    }

    if (!current) continue

    // Detect options A/B/C/D → multiple_choice
    const optionMatch = line.match(/^([A-D])[.)]\s*(.+)$/i)
    if (optionMatch) {
      current.options.push({ key: optionMatch[1].toUpperCase(), text: optionMatch[2] })
      current.type = 'multiple_choice'
      continue
    }

    // Detect word bank for drag_word: "Từ: word1, word2, ..."
    const wordBankMatch = line.match(/^(?:Từ|Từ vựng|Words?)[:\s]+(.+)$/i)
    if (wordBankMatch) {
      const words = wordBankMatch[1].split(',').map(w => w.trim()).filter(Boolean)
      current.options = words.map((text, idx) => ({ key: String.fromCharCode(65 + idx), text }))
      current.type = 'drag_word'
      continue
    }

    // Detect ordering items: "1. item", "2. item" (only when no A/B/C/D options)
    const orderMatch = line.match(/^(\d+)[.)]\s*(.+)$/)
    if (orderMatch && current.type !== 'multiple_choice') {
      current.options.push({ key: String.fromCharCode(64 + parseInt(orderMatch[1])), text: orderMatch[2] })
      current.type = 'ordering'
      continue
    }

    // Detect matching pairs: "A - 1", "A. text | 1. text", or "text = text"
    const matchPairMatch = line.match(/^(.+?)\s*[|=]\s*(.+)$/)
    if (matchPairMatch && current.type !== 'multiple_choice' && current.type !== 'ordering') {
      const idx = current.options.length
      current.options.push({ key: String.fromCharCode(65 + idx), text: matchPairMatch[1].trim() })
      current.match_options.push({ key: String(idx + 1), text: matchPairMatch[2].trim() })
      current.type = 'matching'
      continue
    }

    // Detect answer line
    const answerMatch = line.match(/^(?:Đáp án|Trả lời|Answer)[:\s]+(.+)$/i)
    if (answerMatch) {
      current.correct_answer = answerMatch[1].trim()
      continue
    }

    // Continuation of question text
    if (current.options.length === 0 && current.match_options.length === 0) {
      current.question += ' ' + line
    }
  }

  if (current) questions.push(finalizeQuestion(current))
  return questions
}

function finalizeQuestion(q) {
  // Detect true/false from question ending
  if (
    q.options.length === 0 &&
    /đúng hay sai|đúng\/sai|true or false/i.test(q.question)
  ) {
    q.type = 'true_false'
    q.options = []
    if (!q.correct_answer) q.correct_answer = 'Đúng'
    return q
  }

  // If question has ___ and no word bank yet → fill_blank
  if (q.type === 'fill_blank' && q.options.length === 0 && q.question.includes('___')) {
    q.type = 'fill_blank'
    return q
  }

  // ordering: set correct_answer from options order if not set
  if (q.type === 'ordering' && !q.correct_answer) {
    q.correct_answer = q.options.map(o => o.key).join(',')
  }

  // matching: set correct_answer as A-1,B-2,... if not set
  if (q.type === 'matching' && !q.correct_answer) {
    q.correct_answer = q.options.map((o, i) => `${o.key}-${i + 1}`).join(',')
  }

  // drag_word: correct_answer should be set via "Đáp án:" line
  // If not set, leave empty for teacher to fill

  return q
}
