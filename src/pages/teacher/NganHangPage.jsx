// Trang Ngân hàng bài (/teacher/ngan-hang): danh sách bài Python, lọc, thêm / sửa / xoá, mở – đóng nhiều bài cho 1 khoá.
// Dữ liệu: hooks/useNganHang + data/nganHang.js · lọc: domain/nganHang.locBai · sửa bài: components/teacher/nganHang/BaiNganHangModal.
import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, Loader2, Library } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useGrades } from '../../hooks/useGrades'
import { useNganHang } from '../../hooks/useNganHang'
import { xoaBaiLuyen, moNhieuBaiChoKhoa, dongNhieuBaiVoiKhoa } from '../../data/nganHang'
import { locBai, DO_KHO, LOC_TRONG } from '../../domain/nganHang'
import LocBaiNganHang from '../../components/teacher/nganHang/LocBaiNganHang'
import BaiNganHangModal from '../../components/teacher/nganHang/BaiNganHangModal'

const MAU_DO_KHO = { de: 'bg-green-100 text-green-700', trung_binh: 'bg-amber-100 text-amber-700', kho: 'bg-red-100 text-red-700' }
const TRANG = 100

export default function NganHangPage() {
  const { canDelete } = useAuth()
  const { grades } = useGrades()
  const { ds, taiLai } = useNganHang('python')
  const [loc, setLoc] = useState(LOC_TRONG)
  const [chon, setChon] = useState(new Set())
  const [khoaMo, setKhoaMo] = useState('')
  const [sua, setSua] = useState(null)   // null | 'moi' | id
  const [soHien, setSoHien] = useState(TRANG)

  const loc_ = useMemo(() => (ds ? locBai(ds, loc) : []), [ds, loc])
  const hien = loc_.slice(0, soHien)

  async function xoa(b) {
    if (b.so_ky_thi) { toast.error(`Bài đang dùng ở ${b.so_ky_thi} kỳ thi — gỡ khỏi kỳ thi trước`); return }
    if (!confirm(`Xoá bài "${b.ten}" khỏi ngân hàng (kèm test, kết quả luyện của học sinh)?`)) return
    const { error } = await xoaBaiLuyen(b.id)
    if (error) toast.error('Xoá thất bại: ' + error.message)
    else { toast.success('Đã xoá'); taiLai() }
  }

  async function moDong(mo) {
    if (!khoaMo || !chon.size) { toast.error('Chọn bài và chọn khoá'); return }
    const { error } = mo ? await moNhieuBaiChoKhoa([...chon], khoaMo) : await dongNhieuBaiVoiKhoa([...chon], khoaMo)
    if (error) { toast.error('Lỗi: ' + error.message); return }
    toast.success(`${mo ? 'Đã mở' : 'Đã đóng'} ${chon.size} bài ${mo ? 'cho' : 'với'} ${khoaMo}`)
    setChon(new Set()); taiLai()
  }

  const doiChon = id => setChon(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })

  return (
    <div className="p-4 md:p-8 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Library size={24} /> Ngân hàng bài · 🐍 Python</h1>
        <button onClick={() => setSua('moi')} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus size={16} /> Thêm bài
        </button>
      </div>
      <LocBaiNganHang loc={loc} setLoc={l => { setLoc(l); setSoHien(TRANG) }} grades={grades} />
      <div className="flex flex-wrap items-center gap-2 text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
        <span className="text-gray-600">Đã chọn <b>{chon.size}</b> bài</span>
        <button onClick={() => setChon(new Set(loc_.map(b => b.id)))} className="text-indigo-600 hover:underline">chọn hết {loc_.length} bài đang lọc</button>
        {chon.size > 0 && <button onClick={() => setChon(new Set())} className="text-gray-500 hover:underline">bỏ chọn</button>}
        <select value={khoaMo} onChange={e => setKhoaMo(e.target.value)} className="border border-gray-300 rounded-lg px-2 py-1 bg-white ml-auto">
          <option value="">— khoá —</option>{grades.map(g => <option key={g}>{g}</option>)}
        </select>
        <button onClick={() => moDong(true)} className="px-3 py-1 rounded-lg bg-green-600 text-white">Mở cho khoá</button>
        <button onClick={() => moDong(false)} className="px-3 py-1 rounded-lg bg-gray-500 text-white">Đóng</button>
      </div>

      {ds === null ? <div className="flex justify-center py-12"><Loader2 className="animate-spin text-gray-400" /></div> : (
        <>
          <p className="text-sm text-gray-500">{loc_.length} / {ds.length} bài</p>
          <div className="space-y-1.5">
            {hien.map(b => (
              <div key={b.id} className="bg-white border border-gray-200 rounded-lg px-3 py-2 flex items-center gap-3 text-sm">
                <input type="checkbox" checked={chon.has(b.id)} onChange={() => doiChon(b.id)} />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-gray-800">{b.ten}</span>
                    {b.do_kho && <span className={`text-[11px] px-1.5 py-0.5 rounded ${MAU_DO_KHO[b.do_kho]}`}>{DO_KHO[b.do_kho]}</span>}
                    {b.dang && <span className="text-[11px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700">{b.dang}</span>}
                    {b.tu_khoa_hoc && <span className="text-[11px] px-1.5 py-0.5 rounded bg-orange-50 text-orange-700" title="Học sinh có thể đã thấy test trong bài học">bài trong khoá học</span>}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5 flex flex-wrap gap-x-3">
                    {b.nguon && <span>{b.nguon}</span>}
                    <span>{b.khoa.length ? `Mở cho: ${b.khoa.join(', ')}` : 'Chưa mở cho khoá nào'}</span>
                    {b.so_ky_thi > 0 && <span>Dùng ở {b.so_ky_thi} kỳ thi</span>}
                  </div>
                </div>
                <button onClick={() => setSua(b.id)} className="p-1.5 text-gray-400 hover:text-indigo-600" title="Sửa"><Pencil size={14} /></button>
                {canDelete && <button onClick={() => xoa(b)} className="p-1.5 text-red-400 hover:text-red-600" title="Xoá"><Trash2 size={14} /></button>}
              </div>
            ))}
          </div>
          {loc_.length > soHien && <button onClick={() => setSoHien(n => n + TRANG)} className="w-full py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg">Xem thêm {Math.min(TRANG, loc_.length - soHien)} bài</button>}
        </>
      )}
      {sua && <BaiNganHangModal id={sua === 'moi' ? null : sua} onClose={() => setSua(null)} onDone={() => { setSua(null); taiLai() }} />}
    </div>
  )
}
