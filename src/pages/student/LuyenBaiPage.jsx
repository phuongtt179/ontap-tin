// Trang Luyện bài của học sinh (/student/luyen-bai): các bài ngân hàng thầy cô mở cho khoá em đang chọn, lọc theo dạng / độ khó,
// đánh dấu bài đã đạt. Làm bài: components/student/luyenBai/LamBaiLuyen. Dữ liệu: data/nganHang.js.
import { useEffect, useMemo, useState } from 'react'
import { Loader2, Dumbbell } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useSelectedGradeContext } from '../../context/SelectedGradeContext'
import { layBaiChoKhoa, layKetQuaCuaEm } from '../../data/nganHang'
import { locBai, DANG_PYTHON, DO_KHO, LOC_TRONG } from '../../domain/nganHang'
import LamBaiLuyen from '../../components/student/luyenBai/LamBaiLuyen'

const MAU = { de: 'bg-green-100 text-green-700', trung_binh: 'bg-amber-100 text-amber-700', kho: 'bg-red-100 text-red-700' }

export default function LuyenBaiPage() {
  const { user } = useAuth()
  const { selectedGrade } = useSelectedGradeContext()
  const [ds, setDs] = useState(null)
  const [diem, setDiem] = useState({})          // { bai_id: điểm cao nhất }
  const [loc, setLoc] = useState(LOC_TRONG)
  const [chiChuaDat, setChiChuaDat] = useState(false)
  const [mo, setMo] = useState(null)            // id bài đang làm

  useEffect(() => {
    if (!selectedGrade || !user) return
    let huy = false
    Promise.all([layBaiChoKhoa(selectedGrade), layKetQuaCuaEm(user.id)]).then(([b, k]) => {
      if (huy) return
      setDs((b.data || []).map(r => r.bai_luyen).filter(Boolean).sort((x, y) => x.ten.localeCompare(y.ten, 'vi')))
      setDiem(Object.fromEntries((k.data || []).map(r => [r.bai_id, Number(r.diem)])))
    })
    return () => { huy = true }
  }, [selectedGrade, user])

  const hien = useMemo(() => (ds ? locBai(ds, loc).filter(b => !chiChuaDat || !(diem[b.id] >= 10)) : []), [ds, loc, chiChuaDat, diem])
  const daDat = ds ? ds.filter(b => diem[b.id] >= 10).length : 0

  if (mo) return (
    <div className="p-4 md:p-8 max-w-3xl">
      <LamBaiLuyen baiId={mo} userId={user.id} onQuayLai={() => setMo(null)}
        onCham={(id, d) => setDiem(x => ({ ...x, [id]: Math.max(x[id] ?? 0, d) }))} />
    </div>
  )

  const o = 'border border-gray-300 rounded-lg px-2 py-1.5 text-sm bg-white'
  return (
    <div className="p-4 md:p-8 max-w-3xl space-y-4">
      <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Dumbbell size={24} /> Luyện bài</h1>
      {!selectedGrade ? <p className="text-gray-500">Em chưa ghi danh khoá học nào.</p> : ds === null ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-gray-400" /></div>
      ) : ds.length === 0 ? (
        <p className="text-gray-500">Thầy cô chưa mở bài luyện nào cho khoá <b>{selectedGrade}</b>.</p>
      ) : (
        <>
          <p className="text-sm text-gray-600">Khoá <b>{selectedGrade}</b> · đã làm đúng hết <b className="text-green-700">{daDat}</b> / {ds.length} bài</p>
          <div className="flex flex-wrap gap-2">
            <input value={loc.tim} onChange={e => setLoc(l => ({ ...l, tim: e.target.value }))} placeholder="Tìm bài…" className={`${o} w-40`} />
            <select value={loc.dang} onChange={e => setLoc(l => ({ ...l, dang: e.target.value }))} className={o}>
              <option value="">Mọi dạng</option>{DANG_PYTHON.map(d => <option key={d}>{d}</option>)}
            </select>
            <select value={loc.do_kho} onChange={e => setLoc(l => ({ ...l, do_kho: e.target.value }))} className={o}>
              <option value="">Mọi độ khó</option>{Object.entries(DO_KHO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <label className="flex items-center gap-1 text-sm text-gray-600"><input type="checkbox" checked={chiChuaDat} onChange={e => setChiChuaDat(e.target.checked)} /> Chỉ bài chưa đạt</label>
          </div>
          <div className="space-y-1.5">
            {hien.map(b => (
              <button key={b.id} onClick={() => setMo(b.id)} className="w-full text-left bg-white border border-gray-200 rounded-xl px-4 py-2.5 hover:border-indigo-300 flex items-center gap-3">
                <span className="text-lg w-6">{diem[b.id] >= 10 ? '✅' : diem[b.id] != null ? '🟡' : '⚪'}</span>
                <span className="flex-1 min-w-0">
                  <span className="font-medium text-gray-800">{b.ten}</span>
                  <span className="block text-xs text-gray-400">{b.dang || ''}</span>
                </span>
                {b.do_kho && <span className={`text-[11px] px-1.5 py-0.5 rounded ${MAU[b.do_kho]}`}>{DO_KHO[b.do_kho]}</span>}
                {diem[b.id] != null && <span className="text-xs text-gray-500 w-10 text-right">{diem[b.id]}đ</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
