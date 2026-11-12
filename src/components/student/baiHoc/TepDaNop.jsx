// Hiển thị tệp học sinh đã nộp (biểu tượng theo loại tệp, xem ảnh / mã / tải về).
import { FileText, FileImage, File, Code } from 'lucide-react'
import CodeViewer from '../../ui/CodeViewer'
import { loaiTep, tenTep, linkXemOffice } from '../../../domain/tepNop'

/* ── FileIcon ──────────────────────────────────────────────── */
export function FileIcon({ url, size = 20 }) {
  const ext = (url || '').split('.').pop().toLowerCase()
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return <FileImage size={size} className="text-blue-400" />
  if (ext === 'docx' || ext === 'doc') return <FileText size={size} className="text-blue-600" />
  if (ext === 'pptx' || ext === 'ppt') return <FileText size={size} className="text-orange-500" />
  if (ext === 'sb3') return <File size={size} className="text-yellow-500" />
  if (ext === 'pdf') return <FileText size={size} className="text-red-500" />
  if (ext === 'py') return <Code size={size} className="text-green-600" />
  if (ext === 'txt') return <FileText size={size} className="text-gray-500" />
  return <File size={size} className="text-gray-400" />
}

/* ── SubmittedFile ──────────────────────────────────────────── */
export function SubmittedFile({ url, name }) {
  const { duoi: ext, anh: isImage, office: isOffice, code: isCode } = loaiTep(url)
  // Ưu tiên tên gốc học sinh đặt; nếu không có thì lấy từ URL (bị Cloudinary đổi ngẫu nhiên)
  const fileName = tenTep(url, name)

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 overflow-hidden">
      {isImage && (
        <img src={url} alt="Bài nộp" className="w-full max-h-64 object-contain bg-white border-b border-gray-200" />
      )}
      <div className="flex items-center gap-3 px-4 py-3">
        <FileIcon url={url} size={22} />
        <span className="flex-1 text-sm text-gray-700 truncate">{fileName}</span>
        <a href={url} target="_blank" rel="noopener noreferrer"
          className="text-xs text-indigo-600 hover:underline font-medium shrink-0">
          Tải xuống
        </a>
      </div>
      {isOffice && (
        <div className="border-t border-gray-200 bg-gray-100 overflow-hidden">
          <iframe
            src={linkXemOffice(url)}
            width="100%" height="480" frameBorder="0" title="Xem file" className="w-full block"
          />
        </div>
      )}
      {isCode && (
        <div className="border-t border-gray-200 px-4 py-3">
          <CodeViewer url={url} ext={ext} />
        </div>
      )}
    </div>
  )
}
