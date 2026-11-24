// Cửa sổ thêm / sửa 1 bài trong ngân hàng: thông tin, đề bài (markdown, xem thử), test, lời giải mẫu, mở cho khoá nào.
// Đọc ghi: data/nganHang.js · kiểm tra: domain/nganHang.loiBaiLuyen.
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { X, Loader2, Eye, Pencil } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { useGrades } from '../../../hooks/useGrades'
import { layBaiDayDu, luuBaiDayDu } from '../../../data/nganHang'
import { loiBaiLuyen, DANG_PYTHON, DO_KHO } from '../../../domain/nganHang'
import { testHopLe } from '../../../domain/deThi'
import MarkdownContent from '../../ui/MarkdownContent'
import KhungTest from '../deThi/KhungTest'

const TRONG = { ten: '', dang: '', do_kho: 'trung_binh', nguon: '', de_bai: '', tu_khoa_hoc: false, loi_giai: '', khoa: [] }

export default function BaiNganHangModal({ id, onClose, onDone }) {
  const { user } = useAuth()
  const { grades } = useGrades()
  const [form, setForm] = useState(id ? null : TRONG)
  const [tests, setTests] = useState([])
  const [xem, setXem] = useState(false)
  const [dang, setDang] = useState(false)
  const doi = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    if (!id) return
    let huy = false
    layBaiDayDu(id).then(({ data, error }) => {
      if (huy) return
      if (error || !data) { toast.error('Không tải được bài'); onClose(); return }
      setForm({ ten: data.ten, dang: data.dang || '', do_kho: data.do_kho || '', nguon: data.nguon || '', de_bai: data.de_bai,
        tu_khoa_hoc: data.tu_khoa_hoc, loi_giai: data.loi_giai, khoa: (data.bai_luyen_mo || []).map(m => m.grade) })
      setTests(data.tests.map(t => ({ ...t, diem: Number(t.diem) })))
    })
    return () => { huy = true }
  }, [id])   // eslint-disable-line react-hooks/exhaustive-deps

  async function luu() {
    const bai = { ung_dung: 'python', cach_cham: 'test', ten: form.ten.trim(), dang: form.dang || null, do_kho: form.do_kho || null,
      nguon: form.nguon.trim() || null, de_bai: form.de_bai, tu_khoa_hoc: form.tu_khoa_hoc }
    const loi = loiBaiLuyen(bai, tests)
    if (loi) { toast.error(loi); return }
    setDang(true)
    const { error } = await luuBaiDayDu(id, { bai: id ? bai : { ...bai, created_by: user.id }, loi_giai: form.loi_giai, tests: testHopLe(tests), khoa: form.khoa })
    setDang(false)
    if (error) { toast.error('Lưu thất bại: ' + error.message); return }
    toast.success(id ? 'Đã cập nhật bài' : 'Đã thêm bài vào ngân hàng')
    onDone()
  }

  const o = 'w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm'
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
          <h2 className="text-base font-bold text-gray-800">{id ? 'Sửa bài' : 'Thêm bài'} · 🐍 Python · chấm bằng test</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        {!form ? <div className="flex justify-center py-10"><Loader2 className="animate-spin text-gray-400" /></div> : (
          <div className="flex-1 overflow-auto p-6 space-y-3">
            <label className="block text-sm">Tên bài<input value={form.ten} onChange={e => doi('ten', e.target.value)} className={`mt-1 ${o}`} /></label>
            <div className="grid sm:grid-cols-3 gap-3">
              <label className="block text-sm">Dạng bài
                <select value={form.dang} onChange={e => doi('dang', e.target.value)} className={`mt-1 ${o}`}>
                  <option value="">— chưa chọn —</option>{DANG_PYTHON.map(d => <option key={d}>{d}</option>)}
                </select>
              </label>
              <label className="block text-sm">Độ khó
                <select value={form.do_kho} onChange={e => doi('do_kho', e.target.value)} className={`mt-1 ${o}`}>
                  <option value="">— chưa chọn —</option>{Object.entries(DO_KHO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </label>
              <label className="block text-sm">Nguồn<input value={form.nguon} onChange={e => doi('nguon', e.target.value)} placeholder="VD: THTA 2025 Đà Nẵng" className={`mt-1 ${o}`} /></label>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={form.tu_khoa_hoc} onChange={e => doi('tu_khoa_hoc', e.target.checked)} />
              Bài trong khoá học (học sinh có thể đã thấy test trong bài học — tránh dùng làm bài thi)
            </label>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Đề bài (markdown)</span>
                <button onClick={() => setXem(v => !v)} className="text-xs text-indigo-600 flex items-center gap-1">{xem ? <><Pencil size={12} /> Sửa</> : <><Eye size={12} /> Xem thử</>}</button>
              </div>
              {xem
                ? <div className="mt-1 border border-gray-200 rounded-lg p-3 text-sm bg-gray-50 max-h-80 overflow-auto"><MarkdownContent text={form.de_bai} /></div>
                : <textarea value={form.de_bai} onChange={e => doi('de_bai', e.target.value)} rows={10} className={`mt-1 ${o} font-mono`} />}
            </div>
            <KhungTest tests={tests} setTests={setTests} />
            <label className="block text-sm">Lời giải mẫu (chỉ giáo viên xem)
              <textarea value={form.loi_giai} onChange={e => doi('loi_giai', e.target.value)} rows={6} className={`mt-1 ${o} font-mono text-xs`} />
            </label>
            <div className="text-sm">
              <span className="font-medium text-gray-700">Mở cho học sinh khoá</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {grades.map(g => {
                  const co = form.khoa.includes(g)
                  return <button key={g} type="button" onClick={() => doi('khoa', co ? form.khoa.filter(x => x !== g) : [...form.khoa, g])}
                    className={`px-2.5 py-1 rounded-full text-xs border ${co ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-300'}`}>{g}</button>
                })}
              </div>
            </div>
          </div>
        )}
        <div className="flex justify-end gap-3 px-6 py-4 border-t shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Huỷ</button>
          <button onClick={luu} disabled={dang || !form} className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50">
            {dang && <Loader2 size={14} className="animate-spin" />} Lưu bài
          </button>
        </div>
      </div>
    </div>
  )
}
