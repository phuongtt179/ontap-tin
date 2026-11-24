// Làm 1 bài luyện trong ngân hàng: đọc đề, chọn file .py, nộp → máy chủ chấm ngay (api/thi-python.js, luyen_bai_id).
// Không giới hạn số lần (cách nhau ≥ 10 giây). Học sinh chỉ thấy đúng / sai từng test, không thấy test.
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { ArrowLeft, Loader2, Send, Upload } from 'lucide-react'
import { layDeBai, layLanNopLuyen } from '../../../data/nganHang'
import { apiFetch } from '../../../lib/apiFetch'
import { DO_KHO } from '../../../domain/nganHang'
import MarkdownContent from '../../ui/MarkdownContent'

const KY = { dung: '✅', sai: '❌', loi: '💥', qua_gio: '⏱️' }
const LOI = {
  cho_chut: 'Em nộp nhanh quá — chờ khoảng 10 giây rồi nộp lại nhé.',
  forbidden: 'Bài này chưa mở cho khoá của em.',
  may_cham_loi: 'Máy chấm đang bận, lần này không tính. Em nộp lại sau ít phút nhé.',
  de_chua_co_test: 'Bài chưa có test, em báo thầy cô nhé.',
  bai_qua_dai: 'Chương trình quá dài.',
}

export default function LamBaiLuyen({ baiId, userId, onQuayLai, onCham }) {
  const [bai, setBai] = useState(null)
  const [cacLan, setCacLan] = useState([])
  const [code, setCode] = useState('')
  const [tenFile, setTenFile] = useState('')
  const [dang, setDang] = useState(false)

  useEffect(() => {
    let huy = false
    Promise.all([layDeBai(baiId), layLanNopLuyen(baiId, userId)]).then(([b, l]) => {
      if (huy) return
      setBai(b.data || false)
      setCacLan(l.data || [])
    })
    return () => { huy = true }
  }, [baiId, userId])

  async function chonFile(e) {
    const f = e.target.files?.[0]
    if (!f) return
    if (!/\.py$/i.test(f.name)) { toast.error('Em chọn file .py nhé'); return }
    setCode(await f.text()); setTenFile(f.name)
  }

  async function nop() {
    if (!code.trim()) { toast.error('Em chọn file bài làm trước'); return }
    setDang(true)
    try {
      const r = await apiFetch('/api/thi-python', { luyen_bai_id: baiId, code })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) { toast.error(LOI[d.error] || 'Chưa chấm được, em thử lại nhé'); return }
      setCacLan(c => [{ id: Date.now(), ket_qua: d.ket_qua, diem: d.diem, created_at: new Date().toISOString() }, ...c])
      toast.success(`${d.diem} điểm${d.diem >= 10 ? ' — làm đúng hết! 🎉' : ''}`)
      onCham?.(baiId, d.diem_cao_nhat)
    } catch {
      toast.error('Chưa chấm được, em thử lại nhé')
    } finally {
      setDang(false)
    }
  }

  if (bai === null) return <div className="flex justify-center py-10"><Loader2 className="animate-spin text-gray-400" /></div>
  if (bai === false) return <p className="text-sm text-gray-500">Không mở được bài này. <button onClick={onQuayLai} className="text-indigo-600">Quay lại</button></p>
  const caoNhat = cacLan.length ? Math.max(...cacLan.map(l => Number(l.diem))) : null
  const moiNhat = cacLan[0]
  return (
    <div className="space-y-4">
      <button onClick={onQuayLai} className="text-sm text-indigo-600 flex items-center gap-1"><ArrowLeft size={14} /> Danh sách bài</button>
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h2 className="text-lg font-bold text-gray-800">{bai.ten}</h2>
        <p className="text-xs text-gray-500 mb-3">{[DO_KHO[bai.do_kho], bai.dang, bai.nguon].filter(Boolean).join(' · ')}</p>
        <div className="text-sm text-gray-800"><MarkdownContent text={bai.de_bai} /></div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
        <label className="flex items-center gap-3 border-2 border-dashed border-gray-300 rounded-xl px-4 py-3 cursor-pointer hover:bg-gray-50">
          <Upload size={18} className="text-gray-500" />
          <span className="text-sm text-gray-700">{tenFile ? <>Đã chọn <b>{tenFile}</b> — bấm để chọn file khác</> : 'Chọn file bài làm (.py)'}</span>
          <input type="file" accept=".py" className="hidden" onChange={chonFile} />
        </label>
        {code && <pre className="bg-gray-900 text-gray-100 text-xs rounded-lg p-3 max-h-64 overflow-auto whitespace-pre-wrap">{code}</pre>}
        <button onClick={nop} disabled={dang || !code}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm disabled:opacity-50">
          {dang ? <><Loader2 size={15} className="animate-spin" /> Đang chấm…</> : <><Send size={15} /> Nộp chấm</>}
        </button>
        {moiNhat && (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm">
            <p>Lần gần nhất: <b>{moiNhat.diem}</b>/10 · Điểm cao nhất: <b className="text-green-700">{caoNhat}</b>/10 · Đã nộp {cacLan.length} lần</p>
            <p className="mt-1">{(moiNhat.ket_qua || []).map(k => <span key={k.stt} className="mr-2">Test {k.stt} {KY[k.trang_thai]}</span>)}</p>
          </div>
        )}
        <p className="text-[11px] text-gray-500">✅ đúng · ❌ sai kết quả · 💥 lỗi chương trình · ⏱️ quá 2 giây. Em nộp bao nhiêu lần cũng được, mỗi lần cách nhau 10 giây.</p>
      </div>
    </div>
  )
}
