// Học liệu giáo viên đính kèm bài thực hành: ảnh xem trước, âm thanh nghe thử, mọi tệp có nút Tải về (giữ tên gốc).
import { Download } from 'lucide-react'
import { loaiTep } from '../../../domain/tepNop'
import { hocLieuCua } from '../../../domain/baiThucHanh'
import { luuTepVeMay } from '../../../lib/taiVe'
import { FileIcon } from './TepDaNop'

export default function HocLieuBaiTap({ task }) {
  const ds = hocLieuCua(task)
  if (!ds.length) return null
  return (
    <div className="rounded-2xl p-4 border border-emerald-200 bg-emerald-50/60 space-y-2">
      <div className="font-bold text-xs text-emerald-700">📦 Học liệu — tải về để làm bài</div>
      {ds.map(h => {
        const { anh, amThanh } = loaiTep(h.url)
        return (
          <div key={h.url} className="bg-white rounded-xl border border-emerald-100 overflow-hidden">
            {anh && <img src={h.url} alt={h.ten || 'Ảnh học liệu'} className="w-full max-h-40 object-contain bg-gray-50 border-b border-emerald-100" />}
            <div className="flex items-center gap-2 px-3 py-2">
              <FileIcon url={h.ten || h.url} size={18} />
              <span className="text-sm text-gray-700 flex-1 truncate">{h.ten || 'Tệp học liệu'}</span>
              <button type="button" onClick={() => luuTepVeMay(h.url, h.ten)}
                className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-lg px-2.5 py-1 transition shrink-0">
                <Download size={13} /> Tải về
              </button>
            </div>
            {amThanh && <audio src={h.url} controls preload="none" className="w-full px-3 pb-2" />}
          </div>
        )
      })}
    </div>
  )
}
