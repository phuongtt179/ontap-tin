// Thanh lọc ngân hàng bài (dùng chung: trang Ngân hàng bài, cửa sổ chọn bài cho kỳ thi). Lọc thật ở domain/nganHang.locBai.
import { Search } from 'lucide-react'
import { DANG_PYTHON, DO_KHO } from '../../../domain/nganHang'

export default function LocBaiNganHang({ loc, setLoc, grades = [], coKhoa = true }) {
  const doi = (k, v) => setLoc(l => ({ ...l, [k]: v }))
  const o = 'border border-gray-300 rounded-lg px-2 py-1.5 text-sm bg-white'
  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="relative">
        <Search size={14} className="absolute left-2 top-2.5 text-gray-400" />
        <input value={loc.tim} onChange={e => doi('tim', e.target.value)} placeholder="Tìm tên, nguồn…" className={`${o} pl-7 w-48`} />
      </label>
      <select value={loc.dang} onChange={e => doi('dang', e.target.value)} className={o}>
        <option value="">Mọi dạng</option>{DANG_PYTHON.map(d => <option key={d}>{d}</option>)}
      </select>
      <select value={loc.do_kho} onChange={e => doi('do_kho', e.target.value)} className={o}>
        <option value="">Mọi độ khó</option>{Object.entries(DO_KHO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>
      {coKhoa && (
        <select value={loc.khoa} onChange={e => doi('khoa', e.target.value)} className={o}>
          <option value="">Mọi khoá</option>{grades.map(g => <option key={g} value={g}>Mở cho {g}</option>)}
        </select>
      )}
      <label className="flex items-center gap-1 text-sm text-gray-600">
        <input type="checkbox" checked={loc.boKhoaHoc} onChange={e => doi('boKhoaHoc', e.target.checked)} /> Bỏ bài trong khoá học
      </label>
    </div>
  )
}
