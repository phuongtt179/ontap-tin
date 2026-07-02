import JSZip from 'jszip'
import { generateSb3Text } from './sb3Text'

function getFileType(fileUrl, textContent) {
  if (!fileUrl && textContent) return 'text'
  if (!fileUrl) return 'text'
  const ext = fileUrl.split('?')[0].split('.').pop().toLowerCase()
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)) return 'image'
  if (ext === 'py') return 'py'
  if (ext === 'sb3') return 'sb3'
  if (ext === 'docx' || ext === 'doc') return 'docx'
  if (ext === 'pptx' || ext === 'ppt') return 'pptx'
  return 'text'
}

// Parse [test:Xđ] Input: ... → Output: ... lines from rubric
export function parseTestCases(instructions) {
  const tests = []
  const re = /\[test(?::(\d+(?:\.\d+)?)đ?)?\]\s*Input:\s*(.+?)\s*→\s*Output:\s*(.+?)(?=\n|\[|$)/gi
  let m
  while ((m = re.exec(instructions)) !== null) {
    tests.push({ points: parseFloat(m[1] || '0'), input: m[2].trim(), expected: m[3].trim() })
  }
  return tests
}

async function runPythonTest(code, input, expected, points) {
  try {
    const res = await fetch('https://emkc.org/api/v2/piston/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: 'python', version: '3.10', files: [{ content: code }], stdin: input }),
    })
    const data = await res.json()
    const actual = (data.run?.stdout || '').trim()
    return { input, expected, actual, passed: actual === expected.trim(), points }
  } catch {
    return { input, expected, actual: '', passed: false, points }
  }
}

async function extractContent(fileUrl, textContent, type) {
  if (type === 'image') return null
  if (type === 'text') {
    if (fileUrl) {
      try {
        const res = await fetch(fileUrl)
        if (res.ok) return await res.text()
      } catch {}
    }
    return textContent || ''
  }

  const res = await fetch(fileUrl)
  if (!res.ok) return textContent || ''
  const buf = await res.arrayBuffer()

  if (type === 'py') return new TextDecoder().decode(buf)

  if (type === 'sb3') {
    const zip = await JSZip.loadAsync(buf)
    const jsonStr = await zip.file('project.json').async('string')
    return generateSb3Text(JSON.parse(jsonStr))
  }

  if (type === 'docx') {
    const zip = await JSZip.loadAsync(buf)
    const xml = await zip.file('word/document.xml').async('string')
    const matches = xml.match(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g) || []
    return matches.map(m => m.replace(/<[^>]+>/g, '')).join(' ').replace(/\s+/g, ' ').trim()
  }

  if (type === 'pptx') {
    const zip = await JSZip.loadAsync(buf)
    const slideFiles = Object.keys(zip.files)
      .filter(f => /ppt\/slides\/slide\d+\.xml/.test(f))
      .sort((a, b) => {
        const na = parseInt(a.match(/\d+/)?.[0] || 0)
        const nb = parseInt(b.match(/\d+/)?.[0] || 0)
        return na - nb
      })
    const slides = []
    for (let i = 0; i < slideFiles.length; i++) {
      const xml = await zip.file(slideFiles[i]).async('string')
      const matches = xml.match(/<a:t(?:\s[^>]*)?>([^<]*)<\/a:t>/g) || []
      const text = matches.map(m => m.replace(/<[^>]+>/g, '')).join(' ').replace(/\s+/g, ' ').trim()
      if (text) slides.push(`[Slide ${i + 1}]: ${text}`)
    }
    return slides.join('\n')
  }

  return textContent || ''
}

// Bundle all tasks for a student into 1 API call
// submissions: array indexed by task (null = not submitted)
// taskDefs: array of {instructions} objects
// Returns: { results: [{taskIndex, score, comment}] }
export async function gradeStudent(submissions, taskDefs) {
  const preparedTasks = []

  for (let i = 0; i < taskDefs.length; i++) {
    const sub = submissions[i]
    if (!sub) continue

    const instructions = taskDefs[i]?.instructions || ''
    const fileUrl = sub.file_url
    const textContent = sub.text_content
    const type = getFileType(fileUrl, textContent)

    let testResults = null
    if (type === 'py') {
      const testCases = parseTestCases(instructions)
      if (testCases.length > 0) {
        const code = await extractContent(fileUrl, textContent, 'py')
        testResults = await Promise.all(
          testCases.map(tc => runPythonTest(code, tc.input, tc.expected, tc.points))
        )
      }
    }

    preparedTasks.push({
      taskIndex: i,
      type,
      content: type !== 'image' ? await extractContent(fileUrl, textContent, type) : null,
      imageUrl: type === 'image' ? fileUrl : null,
      instructions,
      rubric: taskDefs[i]?.rubric || '',
      testResults,
    })
  }

  if (preparedTasks.length === 0) return { results: [] }

  const res = await fetch('/api/grade', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tasks: preparedTasks }),
  })

  if (res.status === 429) {
    const err = await res.json().catch(() => ({}))
    const e = new Error(err.error || 'quota_rpm')
    e.quotaType = err.error || 'quota_rpm'
    throw e
  }

  if (!res.ok) throw new Error('grade_error')
  return res.json()
}
