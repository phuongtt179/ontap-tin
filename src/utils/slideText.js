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
  return pptxText(await res.arrayBuffer())
}

async function pptxText(buf) {
  const zip = await JSZip.loadAsync(buf)
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

async function moPdf(src) {
  const { pdfjs } = await import('react-pdf')
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`
  }
  return pdfjs.getDocument(src).promise
}

async function extractPdf(url) { return pdfText(await moPdf({ url })) }

async function pdfText(doc) {
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

// ---- File trên máy giáo viên (nhập vào trình soạn bài giảng web) ----

/** Chữ + ghi chú của file .pptx / .pdf trên máy → làm nguồn cho AI soạn kịch bản */
export async function docChuFile(file) {
  const buf = await file.arrayBuffer()
  const text = /\.pdf$/i.test(file.name) ? await pdfText(await moPdf({ data: buf })) : await pptxText(buf)
  return text.slice(0, MAX_CHARS)
}

/** Vẽ từng trang PDF thành ảnh JPEG (rộng 1600px như khung slide). onTrang(i, tong, blob) gọi lần lượt từng trang. */
export async function pdfThanhAnh(file, onTrang, toiDa = 60) {
  const doc = await moPdf({ data: await file.arrayBuffer() })
  const tong = Math.min(doc.numPages, toiDa)
  for (let p = 1; p <= tong; p++) {
    const trang = await doc.getPage(p)
    const vp0 = trang.getViewport({ scale: 1 })
    const vp = trang.getViewport({ scale: 1600 / vp0.width })
    const cv = document.createElement('canvas')
    cv.width = Math.round(vp.width); cv.height = Math.round(vp.height)
    const ctx = cv.getContext('2d')
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height)
    await trang.render({ canvas: cv, canvasContext: ctx, viewport: vp }).promise
    const blob = await new Promise(r => cv.toBlob(r, 'image/jpeg', 0.85))
    trang.cleanup()
    await onTrang(p, tong, blob, doc.numPages)
  }
  doc.destroy()
}
