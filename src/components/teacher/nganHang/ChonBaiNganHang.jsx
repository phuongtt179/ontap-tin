// Chọn bài ngân hàng cho kỳ thi: tích chọn tay, hoặc tạo đề ngẫu nhiên theo độ khó / dạng (domain/nganHang.chonNgauNhien).
// onChon([{ id, ten }]) — kỳ thi thêm các bài này theo LIÊN KẾT. daCo: id bài đã có trong kỳ thi (không chọn lại).
import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { X, Loader2, Shuffle, Plus, Trash2 } from 'lucide-react'
import { useNganHang } from '../../../hooks/useNganHang'
import { locBai, chonNgauNhien, DANG_PYTHON, DO_KHO, LOC_TRONG } from '../../../domain/nganHang'
import LocBaiNganHang from './LocBaiNganHang'

export default function ChonBaiNganHang({ daCo = [], onChon, onClose }) {
  const { ds } = useNganHang('python')
  const [loc, setLoc] = useState({ ...LOC_TRONG, boKhoaHoc: true })
  const [chon, setChon] = useState([])            // thứ tự chọn = thứ tự trong đề
  const [yeuCau, setYeuCau] = useState([{ so: 2, do_kho: 'de', dang: '' }, { so: 2, do_kho: 'trung_binh', dang: '' }, { so: 1, do_kho: 'kho', dang: '' }])
  const [tranhDaDung, setTranhDaDung] = useState(true)
  const boQua = useMemo(() => new Set(daCo), [daCo])
  const loc_ = useMemo(() => (ds ? locBai(ds, loc).filter(b => !boQua.has(b.id)) : []), [ds, loc, boQua])
  const theoId = useMemo(() => Object.fromEntries((ds || []).map(b => [b.id, b])), [ds])

  function ngauNhien() {
    const bo = new Set([...boQua, ...(tranhDaDung ? (ds || []).filter(b => b.so_ky_thi > 0).map(b => b.id) : [])])
    const r = chonNgauNhien(ds || [], yeuCau, { boQua: bo, tranhKhoaHoc: loc.boKhoaHoc })
    if (r.loi) { toast.error(r.loi); return }
    setChon(r.ids)
  }
  const doiYc = (i, k, v) => setYeuCau(ys => ys.map((y, j) => (j === i ? { ...y, [k]: v } : y)))
  const o = 'border border-gray-300 rounded px-1.5 py-1 text-xs bg-white'

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-3 border-b shrink-0">
          <h2 className="font-bold text-gray-800">Chọn bài từ ngân hàng</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-auto p-5 space-y-4">
          <div className="border border-indigo-200 bg-indigo-50/50 rounded-xl p-3 space-y-2">
            <p className="text-sm font-semibold text-indigo-800 flex items-center gap-1"><Shuffle size={14} /> Tạo đề ngẫu nhiên</p>
            {yeuCau.map((y, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2 text-xs">
                <input type="number" min={1} value={y.so} onChange={e => doiYc(i, 'so', e.target.value)} className={`${o} w-14`} /> bài
                <select value={y.do_kho} onChange={e => doiYc(i, 'do_kho', e.target.value)} className={o}>
                  <option value="">mọi độ khó</option>{Object.entries(DO_KHO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <select value={y.dang} onChange={e => doiYc(i, 'dang', e.target.value)} className={o}>
                  <option value="">mọi dạng</option>{DANG_PYTHON.map(d => <option key={d}>{d}</option>)}
                </select>
                <button onClick={() => setYeuCau(ys => ys.filter((_, j) => j !== i))} className="text-red-400"><Trash2 size={13} /></button>
              </div>
            ))}
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <button onClick={() => setYeuCau(ys => [...ys, { so: 1, do_kho: '', dang: '' }])} className="text-indigo-600 flex items-center gap-1"><Plus size={12} /> thêm dòng</button>
              <label className="flex items-center gap-1"><input type="checkbox" checked={tranhDaDung} onChange={e => setTranhDaDung(e.target.checked)} /> tránh bài đã dùng ở kỳ thi khác</label>
              <button onClick={ngauNhien} disabled={!ds} className="ml-auto px-3 py-1 rounded-lg bg-indigo-600 text-white disabled:opacity-50">Chọn ngẫu nhiên</button>
            </div>
          </div>

          {chon.length > 0 && (
            <div className="text-sm">
              <p className="font-semibold text-gray-700 mb-1">Đã chọn {chon.length} bài (theo thứ tự trong đề):</p>
              <ol className="list-decimal pl-5 space-y-0.5">
                {chon.map(id => <li key={id}>{theoId[id]?.ten} <span className="text-xs text-gray-400">{DO_KHO[theoId[id]?.do_kho] || ''} · {theoId[id]?.dang || ''}</span>
                  <button onClick={() => setChon(c => c.filter(x => x !== id))} className="ml-2 text-xs text-red-500">bỏ</button></li>)}
              </ol>
            </div>
          )}

          <LocBaiNganHang loc={loc} setLoc={setLoc} coKhoa={false} />
          {ds === null ? <Loader2 className="animate-spin text-gray-400" /> : (
            <div className="space-y-1 max-h-80 overflow-auto">
              {loc_.slice(0, 200).map(b => (
                <label key={b.id} className="flex items-center gap-2 text-sm border border-gray-100 rounded px-2 py-1 hover:bg-gray-50">
                  <input type="checkbox" checked={chon.includes(b.id)} onChange={() => setChon(c => (c.includes(b.id) ? c.filter(x => x !== b.id) : [...c, b.id]))} />
                  <span className="flex-1">{b.ten}</span>
                  <span className="text-xs text-gray-400">{DO_KHO[b.do_kho] || ''} · {b.dang || ''}{b.so_ky_thi ? ` · đã dùng ${b.so_ky_thi} kỳ` : ''}</span>
                </label>
              ))}
              {loc_.length > 200 && <p className="text-xs text-gray-400">… còn {loc_.length - 200} bài, lọc thêm để thấy.</p>}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 px-6 py-3 border-t shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Huỷ</button>
          <button onClick={() => onChon(chon.map(id => ({ id, ten: theoId[id]?.ten || '' })))} disabled={!chon.length}
            className="px-5 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50">Thêm {chon.length} bài vào kỳ thi</button>
        </div>
      </div>
    </div>
  )
}
