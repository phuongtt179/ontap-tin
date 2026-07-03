import { useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import { FileText } from 'lucide-react'

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

export default function PDFViewer({ url }) {
  const [numPages, setNumPages] = useState(null)
  const [page, setPage] = useState(1)
  const [scale, setScale] = useState(1.0)
  const [error, setError] = useState(false)

  if (!url) return null

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-8 bg-gray-50 rounded-xl border border-gray-200">
        <FileText size={32} className="text-gray-300" />
        <p className="text-sm text-gray-500">Không tải được PDF</p>
        <a href={url} target="_blank" rel="noopener noreferrer"
          className="text-xs text-indigo-600 hover:underline">Mở trong tab mới ↗</a>
      </div>
    )
  }

  return (
    <div className="flex flex-col rounded-xl border border-gray-200 overflow-hidden bg-gray-100">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 bg-white border-b border-gray-200 px-3 py-2">
        <div className="flex items-center gap-1.5">
          <button onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={page <= 1}
            className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-40 text-sm">←</button>
          <span className="text-xs text-gray-600 min-w-[70px] text-center">
            {numPages ? `${page} / ${numPages}` : '...'}
          </span>
          <button onClick={() => setPage(p => Math.min(p + 1, numPages || 1))} disabled={page >= (numPages || 1)}
            className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-40 text-sm">→</button>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setScale(s => Math.max(s - 0.2, 0.5))} disabled={scale <= 0.5}
            className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-40 text-sm">−</button>
          <span className="text-xs text-gray-600 w-12 text-center">{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale(s => Math.min(s + 0.2, 2.0))} disabled={scale >= 2.0}
            className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-40 text-sm">+</button>
        </div>
        <a href={url} target="_blank" rel="noopener noreferrer"
          className="text-xs text-indigo-500 hover:underline shrink-0">↗ Mở tab mới</a>
      </div>

      {/* PDF */}
      <div className="overflow-auto p-3 flex justify-center">
        <Document file={url}
          onLoadSuccess={({ numPages }) => { setNumPages(numPages); setError(false) }}
          onLoadError={() => setError(true)}
          loading={<div className="py-12 text-sm text-gray-400 text-center">Đang tải PDF...</div>}
          error="">
          <Page pageNumber={page} scale={scale}
            renderTextLayer renderAnnotationLayer
            className="shadow-md bg-white" />
        </Document>
      </div>
    </div>
  )
}
