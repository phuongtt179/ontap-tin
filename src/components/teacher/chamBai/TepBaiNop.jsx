// Bài nộp của 1 phần: giờ nộp, tệp (ảnh xem ngay, code xem + chạy thử, Word/PowerPoint xem trực tuyến, Scratch chạy thử), chữ học sinh gõ.
import { FileText, FileImage, File, ExternalLink, Code } from 'lucide-react'
import Sb3Viewer from '../../ui/Sb3Viewer'
import CodeViewer from '../../ui/CodeViewer'
import { loaiTep, tenTep, linkXemOffice } from '../../../domain/tepNop'

function BieuTuong({ loai }) {
  if (loai.anh) return <FileImage size={18} className="text-blue-400 shrink-0" />
  if (loai.word) return <FileText size={18} className="text-blue-600 shrink-0" />
  if (loai.ppt) return <FileText size={18} className="text-orange-500 shrink-0" />
  if (loai.sb3) return <File size={18} className="text-yellow-500 shrink-0" />
  if (loai.duoi === 'py') return <Code size={18} className="text-green-600 shrink-0" />
  if (loai.duoi === 'txt') return <FileText size={18} className="text-gray-500 shrink-0" />
  return <File size={18} className="text-gray-400 shrink-0" />
}

export default function TepBaiNop({ sub, cao = 480 }) {
  const url = sub.file_url
  const loai = loaiTep(url)
  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-400">Nộp lúc {new Date(sub.submitted_at).toLocaleString('vi-VN')}</p>
      {url && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 overflow-hidden">
          {loai.anh && <img src={url} alt="" className="w-full max-h-64 object-contain bg-white border-b border-gray-200" />}
          <div className="flex items-center gap-3 px-4 py-3">
            <BieuTuong loai={loai} />
            <span className="flex-1 text-sm text-gray-700 truncate">{tenTep(url, sub.file_name)}</span>
            <a href={url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-indigo-600 hover:underline font-medium shrink-0">
              <ExternalLink size={12} /> Tải xuống
            </a>
          </div>
          {loai.code && (
            <div className="border-t border-gray-200 px-4 py-3">
              <CodeViewer url={url} ext={loai.duoi} choChay />
            </div>
          )}
        </div>
      )}
      {loai.office && url && (
        <div className="rounded-xl border border-gray-200 overflow-hidden bg-gray-100">
          <iframe src={linkXemOffice(url)} width="100%" height={cao} frameBorder="0" title="Xem file" className="w-full block" />
        </div>
      )}
      {loai.sb3 && url && <Sb3Viewer url={url} />}
      {sub.text_content && (
        <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 whitespace-pre-wrap border">{sub.text_content}</div>
      )}
    </div>
  )
}
