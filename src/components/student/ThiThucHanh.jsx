// Phần thực hành của đề thi: Python (nộp là máy chủ chấm bằng test, biết điểm ngay — tối đa 10 lần, tính lần cao nhất)
// và Scratch (nộp file .sb3, giáo viên chấm sau, có AI chấm nháp ở phía giáo viên).
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Loader2, Send, Upload, CheckCircle } from 'lucide-react'
import { layLanNopPython, layTepThucHanh, nopTepThucHanh } from '../../data/baiLam'
import { apiFetch } from '../../lib/apiFetch'
import { uploadFile } from '../../lib/cloudinary'

const TOI_DA_LAN = 10
const NHAN = {
  dung: { chu: 'Đúng', ky: '✅', cls: 'text-green-700' },
  sai: { chu: 'Sai kết quả', ky: '❌', cls: 'text-red-600' },
  loi: { chu: 'Lỗi chương trình', ky: '💥', cls: 'text-orange-600' },
  qua_gio: { chu: 'Quá thời gian (2 giây)', ky: '⏱️', cls: 'text-amber-600' },
}
const LOI = {
  het_luot: `Em đã nộp đủ ${TOI_DA_LAN} lần. Điểm được tính là lần cao nhất.`,
  het_gio: 'Đã hết giờ làm bài.',
  da_nop_bai: 'Bài thi đã nộp rồi.',
  de_chua_co_test: 'Đề chưa có test, em báo thầy cô nhé.',
  may_cham_loi: 'Máy chấm đang bận, lượt này không bị tính. Em nộp lại sau ít phút nhé.',
  bai_qua_dai: 'Chương trình quá dài.',
}

export function ThiPython({ sessionId }) {
  const [code, setCode] = useState('')
  const [tenFile, setTenFile] = useState('')
  const [dang, setDang] = useState(false)
  const [cacLan, setCacLan] = useState([])   // [{ lan, ket_qua, diem }]

  useEffect(() => {
    layLanNopPython(sessionId)
      .then(({ data }) => setCacLan(data || []))
  }, [sessionId])

  const daDung = cacLan.length ? Math.max(...cacLan.map(l => l.lan)) : 0
  const conLai = Math.max(0, TOI_DA_LAN - daDung)
  const caoNhat = cacLan.length ? Math.max(...cacLan.map(l => Number(l.diem))) : null
  const moiNhat = cacLan[cacLan.length - 1]

  async function chonFile(e) {
    const f = e.target.files?.[0]
    if (!f) return
    if (!/\.py$/i.test(f.name)) { toast.error('Em chọn file .py nhé'); return }
    setCode(await f.text())
    setTenFile(f.name)
  }

  async function nop() {
    if (!code.trim()) { toast.error('Em chọn file bài làm trước'); return }
    setDang(true)
    try {
      const r = await apiFetch('/api/thi-python', { session_id: sessionId, code })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) { toast.error(LOI[d.error] || 'Chưa chấm được, em thử lại nhé'); return }
      setCacLan(prev => [...prev, { lan: d.lan, ket_qua: d.ket_qua, diem: d.diem }])
      toast.success(`Lần ${d.lan}: ${d.diem} điểm`)
    } catch {
      toast.error('Chưa chấm được, em thử lại nhé')
    } finally {
      setDang(false)
    }
  }

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-3 border-2 border-dashed border-gray-300 rounded-xl px-4 py-3 cursor-pointer hover:bg-gray-50">
        <Upload size={18} className="text-gray-500" />
        <span className="text-sm text-gray-700">{tenFile ? <>Đã chọn <b>{tenFile}</b> — bấm để chọn file khác</> : 'Chọn file bài làm (.py)'}</span>
        <input type="file" accept=".py" className="hidden" onChange={chonFile} />
      </label>
      {code && (
        <pre className="bg-gray-900 text-gray-100 text-xs rounded-lg p-3 max-h-64 overflow-auto whitespace-pre-wrap">{code}</pre>
      )}
      <button onClick={nop} disabled={dang || !code || conLai === 0}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm disabled:opacity-50">
        {dang ? <><Loader2 size={15} className="animate-spin" /> Đang chấm…</> : <><Send size={15} /> Nộp chấm (còn {conLai}/{TOI_DA_LAN} lần)</>}
      </button>
      {caoNhat != null && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-3">
          <p className="font-bold text-green-800">Điểm thực hành cao nhất: {caoNhat}/10</p>
          {moiNhat && (
            <div className="mt-2">
              <p className="text-xs text-gray-600 mb-1">Lần {moiNhat.lan} — {moiNhat.diem} điểm:</p>
              <ul className="grid grid-cols-2 sm:grid-cols-3 gap-1 text-xs">
                {moiNhat.ket_qua.map(k => (
                  <li key={k.stt} className={NHAN[k.trang_thai]?.cls}>{NHAN[k.trang_thai]?.ky} Test {k.stt}: {NHAN[k.trang_thai]?.chu}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      <p className="text-[11px] text-gray-500">
        Máy chấm chạy chương trình với các test của thầy cô (mỗi test tối đa 2 giây). Em được nộp tối đa {TOI_DA_LAN} lần, tính lần cao nhất.
        Đọc dữ liệu bằng <code>input()</code> và in kết quả bằng <code>print()</code> đúng như đề yêu cầu.
      </p>
    </div>
  )
}

export function ThiScratch({ sessionId, onCoFile }) {
  const [tenFile, setTenFile] = useState('')
  const [dang, setDang] = useState(false)

  useEffect(() => {
    layTepThucHanh(sessionId).then(ten => { setTenFile(ten || ''); onCoFile?.(!!ten) })
  }, [sessionId])   // eslint-disable-line react-hooks/exhaustive-deps

  async function chonFile(e) {
    const f = e.target.files?.[0]
    if (!f) return
    if (!/\.sb3$/i.test(f.name)) { toast.error('Em chọn file Scratch (.sb3) nhé'); return }
    setDang(true)
    try {
      const url = await uploadFile(f)
      const { error } = await nopTepThucHanh(sessionId, url, f.name)
      if (error) throw error
      setTenFile(f.name)
      onCoFile?.(true)
      toast.success('Đã tải bài lên')
    } catch (err) {
      toast.error('Tải bài lên thất bại: ' + err.message)
    } finally {
      setDang(false)
    }
  }

  return (
    <div className="space-y-2">
      <label className={`flex items-center gap-3 border-2 border-dashed rounded-xl px-4 py-3 cursor-pointer hover:bg-gray-50 ${tenFile ? 'border-green-300 bg-green-50' : 'border-gray-300'}`}>
        {dang ? <Loader2 size={18} className="animate-spin text-gray-500" /> : tenFile ? <CheckCircle size={18} className="text-green-600" /> : <Upload size={18} className="text-gray-500" />}
        <span className="text-sm text-gray-700">
          {dang ? 'Đang tải lên…' : tenFile ? <>Đã tải lên <b>{tenFile}</b> — bấm để thay file khác</> : 'Tải bài làm lên (.sb3)'}
        </span>
        <input type="file" accept=".sb3" className="hidden" disabled={dang} onChange={chonFile} />
      </label>
      <p className="text-[11px] text-gray-500">Làm xong trên Scratch, em chọn File → Lưu về máy tính rồi tải file lên đây. Thầy cô sẽ chấm sau khi em nộp bài.</p>
    </div>
  )
}
