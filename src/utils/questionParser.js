/**
 * Parse text from Word into structured questions.
 * Supports 8 types: multiple_choice, true_false, fill_blank, drag_word, ordering, matching, word_order, essay
 *
 * Type codes (optional, placed right after "Câu N:"):
 *   [TN] multiple_choice  [DS] true_false   [DT] fill_blank  [KT] drag_word
 *   [SX] ordering         [ND] matching      [ST] word_order  [TL] essay
 *
 * Code blocks: ---python / --- (recommended, easy to type) or ```python / ```
 * Question lines MUST start with "Câu" (e.g. "Câu 1:", "Câu 2.")
 */

const TYPE_CODE_MAP = {
  TN: 'multiple_choice',
  DS: 'true_false',
  DT: 'fill_blank',
  KT: 'drag_word',
  SX: 'ordering',
  ND: 'matching',
  ST: 'word_order',
  TL: 'essay',
}

function convertDashCodeBlocks(text) {
  const lines = text.split('\n')
  const result = []
  let inBlock = false
  for (const line of lines) {
    const t = line.trim()
    const m = t.match(/^---(\w+)$/)
    if (!inBlock && m) {
      inBlock = true
      result.push('```' + m[1])
      continue
    }
    if (inBlock && t === '---') {
      inBlock = false
      result.push('```')
      continue
    }
    result.push(line)
  }
  return result.join('\n')
}

export function parseQuestions(rawText) {
  const preprocessed = convertDashCodeBlocks(rawText)
  const rawLines = preprocessed.split('\n')

  const questions = []
  let current = null
  let inCodeBlock = false
  let codeAccum = []
  let codeLang = ''

  for (let i = 0; i < rawLines.length; i++) {
    const rawLine = rawLines[i]
    const line = rawLine.trim()

    // Inside code block — collect lines until closing ```
    if (inCodeBlock) {
      if (line === '```') {
        inCodeBlock = false
        if (current) {
          const codeStr = '```' + codeLang + '\n' + codeAccum.join('\n') + '\n```'
          current.question = current.question ? current.question + '\n' + codeStr : codeStr
        }
        codeAccum = []
        codeLang = ''
      } else {
        codeAccum.push(rawLine)
      }
      continue
    }

    // Opening code block
    const codeOpenMatch = line.match(/^```(\w*)$/)
    if (codeOpenMatch) {
      inCodeBlock = true
      codeLang = codeOpenMatch[1] || ''
      codeAccum = []
      continue
    }

    // Skip empty lines outside code blocks
    if (!line) continue

    // New question — MUST start with "Câu" (prevents numbered ordering items being mistaken for questions)
    const questionMatch = line.match(/^Câu\s*(\d+)[.):]\s*(.*)$/i)
    if (questionMatch) {
      if (current) questions.push(finalizeQuestion(current))
      let qText = questionMatch[2].trim()

      // Extract optional type code [XX]
      let detectedType = null
      let typeLocked = false
      const tcMatch = qText.match(/^\[(\w+)\]\s*/)
      if (tcMatch) {
        const code = tcMatch[1].toUpperCase()
        if (TYPE_CODE_MAP[code]) {
          detectedType = TYPE_CODE_MAP[code]
          typeLocked = true
          qText = qText.slice(tcMatch[0].length)
        }
      }

      // Legacy [Tự luận] tag (backward compat)
      if (!detectedType && /^\[tự luận\]/i.test(qText)) {
        detectedType = 'essay'
        typeLocked = true
        qText = qText.replace(/^\[tự luận\]\s*/i, '')
      }

      current = {
        order: parseInt(questionMatch[1]),
        question: qText,
        type: detectedType || 'fill_blank',
        typeLocked,
        options: [],
        match_options: [],
        correct_answer: null,
        image_url: null,
      }
      continue
    }

    if (!current) continue

    // A/B/C/D options → multiple_choice
    const optionMatch = line.match(/^([A-D])[.)]\s*(.+)$/i)
    if (optionMatch) {
      if (!current.typeLocked) current.type = 'multiple_choice'
      current.options.push({ key: optionMatch[1].toUpperCase(), text: optionMatch[2] })
      continue
    }

    // Word bank → drag_word: "Từ: word1, word2, ..."
    const wordBankMatch = line.match(/^(?:Từ|Từ vựng|Words?)[:\s]+(.+)$/i)
    if (wordBankMatch) {
      if (!current.typeLocked) current.type = 'drag_word'
      const words = wordBankMatch[1].split(',').map(w => w.trim()).filter(Boolean)
      current.options = words.map((text, idx) => ({ key: String.fromCharCode(65 + idx), text }))
      continue
    }

    // Numbered ordering items: "1. text" or "1) text"
    const orderMatch = line.match(/^(\d+)[.)]\s*(.+)$/)
    if (orderMatch) {
      const canBeOrdering = current.type === 'ordering' ||
        (!current.typeLocked && current.type !== 'multiple_choice')
      if (canBeOrdering) {
        if (!current.typeLocked) current.type = 'ordering'
        current.options.push({ key: String.fromCharCode(64 + parseInt(orderMatch[1])), text: orderMatch[2] })
        continue
      }
    }

    // Matching pairs: "left | right"
    const matchPairMatch = line.match(/^(.+?)\s*[|]\s*(.+)$/)
    if (matchPairMatch) {
      const canBeMatching = current.type === 'matching' ||
        (!current.typeLocked && current.type !== 'multiple_choice' && current.type !== 'ordering')
      if (canBeMatching) {
        if (!current.typeLocked) current.type = 'matching'
        const idx = current.options.length
        current.options.push({ key: String.fromCharCode(65 + idx), text: matchPairMatch[1].trim() })
        current.match_options.push({ key: String(idx + 1), text: matchPairMatch[2].trim() })
        continue
      }
    }

    // word_order sentence
    const wordOrderMatch = line.match(/^(?:Câu đúng|Câu hoàn chỉnh)[:\s]+(.+)$/i)
    if (wordOrderMatch) {
      if (!current.typeLocked) current.type = 'word_order'
      current.correct_answer = wordOrderMatch[1].trim()
      continue
    }

    // Hint
    const hintMatch = line.match(/^(?:Gợi ý|Hint)[:\s]+(.+)$/i)
    if (hintMatch) {
      if (current.type === 'essay') {
        current.correct_answer = hintMatch[1].trim()
      } else {
        current.hint = hintMatch[1].trim()
      }
      continue
    }

    // Essay sample answer
    const sampleMatch = line.match(/^(?:Đáp án mẫu|Mẫu)[:\s]+(.+)$/i)
    if (sampleMatch && current.type === 'essay') {
      current.correct_answer = sampleMatch[1].trim()
      continue
    }

    // Answer line
    const answerMatch = line.match(/^(?:Đáp án|Trả lời|Answer)[:\s]+(.+)$/i)
    if (answerMatch) {
      current.correct_answer = answerMatch[1].trim()
      continue
    }

    // Continuation of question text (before any options/answers)
    if (current.options.length === 0 && current.match_options.length === 0 && !current.correct_answer) {
      current.question = current.question ? current.question + '\n' + line : line
    }
  }

  if (current) questions.push(finalizeQuestion(current))
  return questions
}

function finalizeQuestion(q) {
  // true_false auto-detect (skip if type already locked)
  if (!q.typeLocked && q.options.length === 0 &&
      /đúng hay sai|đúng\/sai|true or false/i.test(q.question)) {
    q.type = 'true_false'
  }

  // true_false: default correct answer
  if (q.type === 'true_false' && !q.correct_answer) {
    q.correct_answer = 'Đúng'
  }

  // ordering: set correct_answer from options order
  if (q.type === 'ordering' && !q.correct_answer) {
    q.correct_answer = q.options.map(o => o.key).join(',')
  }

  // matching: set correct_answer as A-1,B-2,...
  if (q.type === 'matching' && !q.correct_answer) {
    q.correct_answer = q.options.map((o, i) => `${o.key}-${i + 1}`).join(',')
  }

  // word_order: build word chips from correct_answer sentence
  if (q.type === 'word_order' && q.correct_answer && q.options.length === 0) {
    const words = q.correct_answer.split(' ').filter(Boolean)
    q.options = words.map((text, idx) => ({ key: String.fromCharCode(65 + idx), text }))
  }

  // essay: options stores config
  if (q.type === 'essay') {
    q.options = [{ allow_file: false, max_score: 1 }]
  }

  return q
}
