// Soạn học liệu kèm 1 bài thực hành: tệp Word mẫu để sửa, ảnh / âm thanh để chèn, tệp .sb3 / .txt dữ liệu…
// Học sinh thấy danh sách này và tải về dùng. Chỉ hiển thị + báo thay đổi qua onChange (lưu cùng bài học).
import { useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { Loader2, Upload, X } from 'lucide-react'
import { uploadHocLieu } from '../../../lib/cloudinary'
import { loaiTep } from '../../../domain/tepNop'
import { hocLieuCua, TOI_DA_MB_HOC_LIEU } from '../../../domain/baiThucHanh'
import { FileIcon } from '../../student/baiHoc/TepDaNop'

const NHAN = '.doc,.docx,.xls,.xlsx,.ppt,.pptx,.pdf,.txt,.csv,.py,.sb3,.sprite3,.zip,.png,.jpg,.jpeg,.gif,.svg,.bmp,.webp,.mp3,.wav,.ogg,.m4a'

export default function HocLieuEditor({ hocLieu, onChange }) {
  const [dangTai, setDangTai] = useState(0)
  const ref = useRef(null)
  const ds = hocLieuCua({ hoc_lieu: hocLieu })

  async function chonTep(e) {
    const tep = [...(e.target.files || [])]
    e.target.value = ''
    const quaTo = tep.filter(f => f.size > TOI_DA_MB_HOC_LIEU * 1024 * 1024)
    if (quaTo.length) toast.error(`Tệp quá ${TOI_DA_MB_HOC_LIEU} MB, không tải được: ${quaTo.map(f => f.name).join(', ')}`)
    const hopLe = tep.filter(f => !quaTo.includes(f))
    if (!hopLe.length) return
    setDangTai(hopLe.length)
    const moi = []
    for (const f of hopLe) {
      try { moi.push(await uploadHocLieu(f)) } catch { toast.error(`Tải lên thất bại: ${f.name}`) }
      setDangTai(n => n - 1)
    }
    if (moi.length) onChange([...ds, ...moi])
  }

  return (
    <div className="border-t border-gray-100 px-3 py-3 space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <p className="text-xs font-semibold text-gray-600">Học liệu cho học sinh tải về (tùy chọn)</p>
        <span className="text-[10px] text-gray-400">Word mẫu để sửa, ảnh, âm thanh, .sb3, .txt dữ liệu… · tối đa {TOI_DA_MB_HOC_LIEU} MB / tệp</span>
      </div>
      {ds.map((h, i) => (
        <div key={h.url} className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
          <FileIcon url={h.ten || h.url} size={15} />
          <span className="text-xs text-emerald-800 flex-1 truncate">{h.ten || h.url}</span>
          {loaiTep(h.url).amThanh && <audio src={h.url} controls preload="none" className="h-7 max-w-[160px]" />}
          <a href={h.url} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-700 hover:underline shrink-0">Xem</a>
          <button type="button" onClick={() => onChange(ds.filter((_, j) => j !== i))} title="Gỡ tệp này"
            className="text-red-400 hover:text-red-600 shrink-0"><X size={13} /></button>
        </div>
      ))}
      <button type="button" onClick={() => ref.current?.click()} disabled={dangTai > 0}
        className="flex items-center gap-2 w-full border-2 border-dashed border-gray-300 hover:border-emerald-400 rounded-lg px-3 py-2 text-sm text-gray-500 hover:text-emerald-600 transition disabled:opacity-50">
        {dangTai > 0 ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
        {dangTai > 0 ? `Đang tải lên… còn ${dangTai} tệp` : 'Thêm học liệu (chọn được nhiều tệp)'}
      </button>
      <input ref={ref} type="file" multiple accept={NHAN} className="hidden" onChange={chonTep} />
    </div>
  )
}
