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

// Ghép đường dẫn tương đối kiểu OOXML (target trong file .rels) với thư mục chứa file nguồn —
// vd resolveZipPath('ppt/slides', '../slideLayouts/slideLayout1.xml') -> 'ppt/slideLayouts/slideLayout1.xml'
function resolveZipPath(baseDir, target) {
  const parts = baseDir.split('/').filter(Boolean)
  for (const seg of target.split('/')) {
    if (seg === '..') parts.pop()
    else if (seg !== '.') parts.push(seg)
  }
  return parts.join('/')
}

// PowerPoint chỉ ghi "align" vào chính file slide khi học sinh THAY ĐỔI khác với mặc định của
// mẫu — căn giữa mặc định của tiêu đề nằm ở file slideLayout (rồi tới slideMaster nếu layout
// cũng không ghi rõ), không nằm trong file slide. Đọc đúng 2 lớp này để biết SỰ THẬT thay vì
// chỉ đoán/bỏ qua khi slide không ghi rõ.
async function resolveTitleAlgn(zip, slidePath) {
  try {
    const slideDir = slidePath.slice(0, slidePath.lastIndexOf('/'))
    const slideName = slidePath.slice(slidePath.lastIndexOf('/') + 1)
    const relsXml = await zip.file(`${slideDir}/_rels/${slideName}.rels`)?.async('string')
    const layoutTarget = (relsXml || '').match(/<Relationship[^>]*Type="[^"]*\/slideLayout"[^>]*Target="([^"]+)"/)?.[1]
    if (!layoutTarget) return null
    const layoutPath = resolveZipPath(slideDir, layoutTarget)
    const layoutXml = await zip.file(layoutPath)?.async('string')
    if (!layoutXml) return null

    // Tìm shape tiêu đề (type="title"/"ctrTitle") trong layout, xem có ghi rõ algn không
    const layoutShapes = layoutXml.match(/<p:sp>[\s\S]*?<\/p:sp>/g) || []
    for (const shape of layoutShapes) {
      const phType = shape.match(/<p:ph[^>]*\btype="([a-zA-Z]+)"/)?.[1]
      if (phType !== 'title' && phType !== 'ctrTitle') continue
      const algn = shape.match(/<a:pPr[^>]*\balgn="([a-z]+)"/)?.[1]
      if (algn) return algn
    }

    // Layout không ghi rõ -> lần lên slideMaster, đọc titleStyle mức 1
    const layoutDir = layoutPath.slice(0, layoutPath.lastIndexOf('/'))
    const layoutName = layoutPath.slice(layoutPath.lastIndexOf('/') + 1)
    const layoutRelsXml = await zip.file(`${layoutDir}/_rels/${layoutName}.rels`)?.async('string')
    const masterTarget = (layoutRelsXml || '').match(/<Relationship[^>]*Type="[^"]*\/slideMaster"[^>]*Target="([^"]+)"/)?.[1]
    if (!masterTarget) return null
    const masterPath = resolveZipPath(layoutDir, masterTarget)
    const masterXml = await zip.file(masterPath)?.async('string')
    if (!masterXml) return null
    const titleStyleBlock = masterXml.match(/<p:titleStyle>([\s\S]*?)<\/p:titleStyle>/)?.[1] || ''
    return titleStyleBlock.match(/<a:lvl1pPr[^>]*\balgn="([a-z]+)"/)?.[1] || null
  } catch {
    return null
  }
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
  // Cho phép \n trong test để mô tả input/output NHIỀU DÒNG
  const stdin = input.replace(/\\n/g, '\n')
  const exp = expected.replace(/\\n/g, '\n')
  try {
    const res = await fetch('https://emkc.org/api/v2/piston/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: 'python', version: '3.10', files: [{ content: code }], stdin }),
    })
    const data = await res.json()
    const actual = (data.run?.stdout || '').trim()
    return { input, expected, actual, passed: actual === exp.trim(), points }
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
    // Tách theo đoạn <w:p>; trong mỗi đoạn duyệt từng "run" <w:r> để vừa lấy chữ (<w:t>)
    // vừa lấy định dạng (<w:rPr>: đậm/nghiêng/gạch chân/màu chữ/tô nền/font/cỡ chữ) — nếu chỉ
    // lấy text thuần thì AI chấm bài không có cách nào biết học sinh đã định dạng đúng hay chưa.
    const paras = xml.split(/<\/w:p>/).map(p => {
      const runs = p.match(/<w:r(?:\s[^>]*)?>[\s\S]*?<\/w:r>/g) || []
      return runs.map(run => {
        // Run chứa ảnh (<w:drawing>) thay vì chữ — không đọc được ảnh là gì, nhưng vẫn báo
        // cho AI biết CÓ ảnh + kích thước, để không bị chấm nhầm là "chưa chèn ảnh".
        const extent = run.match(/<wp:extent\s+cx="(\d+)"\s+cy="(\d+)"/)
        if (!run.includes('<w:t') && run.includes('<w:drawing')) {
          if (extent) {
            const cmW = (Number(extent[1]) * 2.54 / 914400).toFixed(1)
            const cmH = (Number(extent[2]) * 2.54 / 914400).toFixed(1)
            return `[HÌNH ẢNH — kích thước khoảng ${cmW}x${cmH}cm]`
          }
          return '[HÌNH ẢNH]'
        }
        const tMatch = run.match(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/)
        const text = tMatch ? tMatch[1] : ''
        if (!text) return ''
        const rPr = (run.match(/<w:rPr>([\s\S]*?)<\/w:rPr>/) || [])[1] || ''
        const flag = tag => {
          const m = rPr.match(new RegExp(`<w:${tag}(?:\\s+w:val="([^"]*)")?\\s*/>`))
          if (!m) return false
          return m[1] === undefined || !['0', 'false', 'off'].includes(m[1].toLowerCase())
        }
        const tags = []
        if (flag('b')) tags.push('b')
        if (flag('i')) tags.push('i')
        const uVal = (rPr.match(/<w:u\s+w:val="([^"]+)"/) || [])[1]
        if (uVal && uVal !== 'none') tags.push('u')
        const color = (rPr.match(/<w:color\s+w:val="([0-9A-Fa-f]{6})"/) || [])[1]
        if (color) tags.push(`color=#${color.toUpperCase()}`)
        const hl = (rPr.match(/<w:highlight\s+w:val="([a-zA-Z]+)"/) || [])[1]
        if (hl && hl !== 'none') tags.push(`bg=${hl}`)
        const font = (rPr.match(/<w:rFonts\b[^>]*\bw:ascii="([^"]+)"/) || [])[1]
        if (font) tags.push(`font=${font}`)
        const sz = (rPr.match(/<w:sz\s+w:val="(\d+)"/) || [])[1]
        if (sz) tags.push(`size=${Number(sz) / 2}pt`)
        return tags.length ? `[${tags.join(' ')}]${text}[/]` : text
      }).join('')
    }).filter(t => t.trim())
    return paras.join('\n').replace(/[ \t]+/g, ' ').trim()
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
    const alignMap = { ctr: 'giữa', l: 'trái', r: 'phải', just: 'đều hai bên' }
    const slides = []
    for (let i = 0; i < slideFiles.length; i++) {
      const xml = await zip.file(slideFiles[i]).async('string')
      // Duyệt theo TỪNG SHAPE theo đúng thứ tự trong slide (<p:sp> = khung chữ, <p:pic> = ảnh) —
      // trước đây chỉ gom hết <a:p> trong cả slide nên hoàn toàn bỏ sót ảnh (<p:pic> không chứa
      // <a:p>) khiến AI luôn báo "chưa chèn ảnh" dù học sinh đã chèn.
      const shapeBlocks = xml.match(/<p:sp>[\s\S]*?<\/p:sp>|<p:pic>[\s\S]*?<\/p:pic>/g) || []
      const lines = []
      // Chỉ đọc slideLayout/slideMaster (tốn thêm 1-2 lần đọc file zip) khi thật sự gặp tiêu đề
      // không ghi rõ align — tránh làm chậm vô ích cho slide không có tiêu đề hoặc đã ghi rõ.
      let resolvedTitleAlgn
      for (const shape of shapeBlocks) {
        if (shape.startsWith('<p:pic>')) {
          const extent = shape.match(/<a:ext\s+cx="(\d+)"\s+cy="(\d+)"/)
          if (extent) {
            const cmW = (Number(extent[1]) * 2.54 / 914400).toFixed(1)
            const cmH = (Number(extent[2]) * 2.54 / 914400).toFixed(1)
            lines.push(`[HÌNH ẢNH — kích thước khoảng ${cmW}x${cmH}cm]`)
          } else {
            lines.push('[HÌNH ẢNH]')
          }
          continue
        }
        // Loại khung (title/ctrTitle = tiêu đề slide) — dùng để báo cho AI biết dòng này là
        // TIÊU ĐỀ, vì tiêu đề thường CĂN GIỮA MẶC ĐỊNH theo mẫu slide (không ghi align rõ
        // trong XML nếu học sinh không đổi gì) — thiếu thông tin này AI hay chấm nhầm "chưa
        // căn giữa" dù thực ra vẫn đang dùng đúng mặc định căn giữa của mẫu.
        const phType = (shape.match(/<p:ph[^>]*\btype="([a-zA-Z]+)"/) || [])[1]
        const isTitle = phType === 'title' || phType === 'ctrTitle'
        // Tách theo từng đoạn văn <a:p>; trong mỗi đoạn duyệt từng "run" <a:r> để vừa lấy chữ
        // (<a:t>) vừa lấy định dạng (<a:rPr>: đậm/nghiêng/gạch chân/màu chữ/cỡ chữ) + căn lề đoạn
        // (<a:pPr algn=...>) + có/không có bullet (<a:buChar>/<a:buAutoNum> = có, <a:buNone> =
        // tắt) — nếu chỉ lấy text thuần thì AI chấm bài không có cách nào biết học sinh đã định
        // dạng/căn lề/bullet đúng hay chưa.
        const paraBlocks = shape.match(/<a:p>[\s\S]*?<\/a:p>/g) || []
        for (const p of paraBlocks) {
          const pPrBlock = (p.match(/<a:pPr[^>]*\/>|<a:pPr[^>]*>[\s\S]*?<\/a:pPr>/) || [])[0] || ''
          let algnVal = (pPrBlock.match(/\balgn="([a-z]+)"/) || [])[1]
          // Slide không ghi rõ align cho tiêu đề -> đây là đang dùng CĂN LỀ MẶC ĐỊNH của mẫu,
          // đọc thật từ slideLayout/slideMaster thay vì bỏ qua/đoán mò.
          if (!algnVal && isTitle) {
            if (resolvedTitleAlgn === undefined) resolvedTitleAlgn = await resolveTitleAlgn(zip, slideFiles[i])
            algnVal = resolvedTitleAlgn || undefined
          }
          const algnLabel = alignMap[algnVal]
          const bulletTag = /<a:buNone/.test(pPrBlock) ? 'no-bullet'
            : /<a:buChar|<a:buAutoNum/.test(pPrBlock) ? 'bullet' : null
          const runs = p.match(/<a:r>[\s\S]*?<\/a:r>/g) || []
          const runTexts = runs.map(run => {
            const tMatch = run.match(/<a:t(?:\s[^>]*)?>([^<]*)<\/a:t>/)
            const text = tMatch ? tMatch[1] : ''
            if (!text) return ''
            const rPrMatch = run.match(/<a:rPr([^>]*?)(?:\/>|>([\s\S]*?)<\/a:rPr>)/)
            const attrs = rPrMatch?.[1] || ''
            const inner = rPrMatch?.[2] || ''
            const tags = []
            if (/\bb="1"/.test(attrs)) tags.push('b')
            if (/\bi="1"/.test(attrs)) tags.push('i')
            const uVal = (attrs.match(/\bu="([a-zA-Z]+)"/) || [])[1]
            if (uVal && uVal !== 'none') tags.push('u')
            const color = (inner.match(/<a:srgbClr val="([0-9A-Fa-f]{6})"/) || [])[1]
            if (color) tags.push(`color=#${color.toUpperCase()}`)
            const sz = (attrs.match(/\bsz="(\d+)"/) || [])[1]
            if (sz) tags.push(`size=${Math.round(Number(sz) / 100)}pt`)
            return tags.length ? `[${tags.join(' ')}]${text}[/]` : text
          })
          const lineText = runTexts.join('').trim()
          if (!lineText) continue
          let prefix = ''
          if (isTitle) prefix += '[TIÊU ĐỀ]'
          if (algnLabel) prefix += `[align=${algnLabel}]`
          if (bulletTag) prefix += `[${bulletTag}]`
          lines.push(prefix ? `${prefix}${lineText}` : lineText)
        }
      }
      if (lines.length) slides.push(`[Slide ${i + 1}]:\n${lines.join('\n')}`)
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
      // Đọc test từ cả đề bài lẫn Rubric (Rubric ẩn với học sinh → giấu được đáp án test)
      const testCases = parseTestCases(instructions + '\n' + (taskDefs[i]?.rubric || ''))
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
      fileName: sub.file_name || null,
      // Không nộp file, chỉ gõ ghi chú — báo rõ cho AI biết để không lẫn ghi chú của học sinh
      // với 1 bài nộp file thật (trước đây AI không biết điều này nên có thể chấm nhầm điểm cao
      // cho ghi chú không liên quan tới yêu cầu đề bài).
      noFile: !fileUrl,
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

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error ? `grade_error (${err.error})` : 'grade_error')
  }
  return res.json()
}
