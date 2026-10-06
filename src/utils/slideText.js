// Đọc CHỮ THUẦN từ slide bài giảng (.pptx hoặc .pdf) để AI soạn ghi chú cho gia sư.
// Khác extractContent trong aiGrader.js: ở đây không cần định dạng (đậm/màu/căn lề), chỉ cần nội dung.
import JSZip from 'jszip'

const MAX_CHARS = 25000

const decodeXml = s => s
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&')

// Chữ của 1 file XML OOXML: mỗi đoạn <a:p> thành 1 dòng
function paragraphsOf(xml) {
  return xml.split('</a:p>')
    .map(p => decodeXml([...p.matchAll(/<a:t(?:\s[^>]*)?>([^<]*)<\/a:t>/g)].map(m => m[1]).join('')).trim())
    .filter(Boolean)
}

async function extractPptx(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Không tải được file slide')
  const zip = await JSZip.loadAsync(await res.arrayBuffer())
  const slideFiles = Object.keys(zip.files)
    .filter(f => /^ppt\/slides\/slide\d+\.xml$/.test(f))
    .sort((a, b) => parseInt(a.match(/\d+/)[0]) - parseInt(b.match(/\d+/)[0]))

  const out = []
  for (let i = 0; i < slideFiles.length; i++) {
    const path = slideFiles[i]
    const lines = paragraphsOf(await zip.file(path).async('string'))
    // Ghi chú người thuyết trình (notes) thường chứa lời giảng của giáo viên — rất có ích cho gia sư
    const rels = await zip.file(path.replace('slides/', 'slides/_rels/') + '.rels')?.async('string')
    const notesTarget = rels?.match(/Target="\.\.\/notesSlides\/(notesSlide\d+\.xml)"/)?.[1]
    const notes = notesTarget ? paragraphsOf(await zip.file(`ppt/notesSlides/${notesTarget}`)?.async('string') || '')
      .filter(l => !/^\d+$/.test(l)) : []  // bỏ số trang
    if (!lines.length && !notes.length) continue
    out.push(`[Slide ${i + 1}]\n${lines.join('\n')}${notes.length ? `\n(Ghi chú giáo viên: ${notes.join(' ')})` : ''}`)
  }
  return out.join('\n\n')
}

async function extractPdf(url) {
  const { pdfjs } = await import('react-pdf')
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`
  }
  const doc = await pdfjs.getDocument({ url }).promise
  const out = []
  for (let p = 1; p <= Math.min(doc.numPages, 80); p++) {
    const content = await (await doc.getPage(p)).getTextContent()
    const text = content.items.map(it => it.str).join(' ').replace(/\s+/g, ' ').trim()
    if (text) out.push(`[Trang ${p}]\n${text}`)
  }
  return out.join('\n\n')
}

export async function extractSlideText(url) {
  const isPdf = url.split('?')[0].toLowerCase().endsWith('.pdf')
  const text = isPdf ? await extractPdf(url) : await extractPptx(url)
  return text.slice(0, MAX_CHARS)
}
