// Tìm tên, lọc khoá / lớp, chọn tất cả + thanh xoá nhiều em (chỉ người có quyền xoá).
import { Search, X, Trash2, Loader2 } from 'lucide-react'

const O_CHON = 'border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'

export default function ThanhLocHocSinh({ tim, onTim, khoa, onKhoa, lop, onLop, cacKhoa, cacLop, onXoaLoc,
  coQuyenXoa, soHien, soChon, onChonHet, dangXoa, onXoaChon, onBoChon }) {
  const chonHet = soChon === soHien && soHien > 0
  return (
    <>
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative w-full sm:w-auto">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={tim} onChange={e => onTim(e.target.value)} placeholder="Tìm theo tên..."
            className="pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-44" />
        </div>
        <select value={khoa} onChange={e => onKhoa(e.target.value)} className={O_CHON}>
          <option value="">Tất cả khoá</option>
          {cacKhoa.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        <select value={lop} onChange={e => onLop(e.target.value)} className={O_CHON}>
          <option value="">Tất cả lớp</option>
          {cacLop.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
        </select>
        {(khoa || lop || tim) && (
          <button onClick={onXoaLoc} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
            <X size={14} /> Xóa bộ lọc
          </button>
        )}
        {coQuyenXoa && soHien > 0 && (
          <button onClick={onChonHet} className="text-sm text-gray-500 hover:text-indigo-600 flex items-center gap-1 ml-auto">
            {chonHet ? 'Bỏ chọn tất cả' : `Chọn tất cả (${soHien})`}
          </button>
        )}
      </div>
      {coQuyenXoa && soChon > 0 && (
        <div className="flex items-center gap-3 mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <span className="text-sm font-medium text-red-700">Đã chọn {soChon} học sinh</span>
          <button onClick={onXoaChon} disabled={dangXoa}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-1.5 rounded-lg transition disabled:opacity-50 ml-auto">
            {dangXoa ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
            {dangXoa ? 'Đang xóa...' : `Xóa ${soChon} học sinh`}
          </button>
          <button onClick={onBoChon} className="text-xs text-red-400 hover:text-red-600">Hủy</button>
        </div>
      )}
    </>
  )
}
