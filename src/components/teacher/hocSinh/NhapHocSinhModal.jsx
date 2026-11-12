// Nhập học sinh hàng loạt: dán danh sách → xem trước (lỗi, trùng tên đăng nhập) → tạo tài khoản → kết quả từng em.
import { useState } from 'react'
import toast from 'react-hot-toast'
import { X, AlertCircle, CheckCircle2, Loader2, UserPlus } from 'lucide-react'
import { timTenDangNhapDaCo, capNhatHoSo } from '../../../data/hoSo'
import { ghiDanhHocSinh } from '../../../data/ghiDanh'
import { taoTaiKhoan } from '../../../data/taiKhoan'
import { docDanhSachNhap, tenDangNhapCanKiemTra, danhDauTrung, loiTaoTaiKhoan } from '../../../domain/hocSinh'

const TH = 'px-3 py-2 text-left text-xs font-semibold text-gray-500'

function TrangThaiDong({ row }) {
  if (!row._errors.length) return <span className="flex items-center gap-1 text-green-600 text-xs"><CheckCircle2 size={13} /> OK</span>
  if (row._duplicate) return <span className="flex items-center gap-1 text-orange-500 text-xs"><AlertCircle size={13} /> Trùng username — sửa lại</span>
  return <span className="text-red-500 text-xs">{row._errors.join('; ')}</span>
}

function TheDem({ tot, so, children }) {
  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm border ${tot ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-600'}`}>
      {tot ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
      <span><strong>{so}</strong> {children}</span>
    </div>
  )
}

/** tạo tài khoản + hồ sơ + ghi danh cho 1 dòng hợp lệ */
async function taoMotEm(row) {
  const email = `${row.username}@school.local`
  try {
    const user = await taoTaiKhoan(email, row.password, {
      full_name: row.full_name, role: 'student', grade: row.grade, class_name: row.class_name, username: row.username,
    })
    if (user?.id) {
      await capNhatHoSo(user.id, { username: row.username, is_approved: true })
      if (row.grade) await ghiDanhHocSinh({ user_id: user.id, grade: row.grade, class_name: row.class_name || null, is_approved: true })
    }
    return { ...row, _ok: true, email }
  } catch (err) {
    return { ...row, _ok: false, _importError: loiTaoTaiKhoan(err.message), email }
  }
}

export default function NhapHocSinhModal({ onClose, onDone }) {
  const [text, setText] = useState('')
  const [parsed, setParsed] = useState([])
  const [step, setStep] = useState('input') // input | preview | importing | done
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [results, setResults] = useState([])
  const [checking, setChecking] = useState(false)

  const validRows = parsed.filter(r => r._errors.length === 0)
  const invalidRows = parsed.filter(r => r._errors.length > 0)

  async function handleParse() {
    if (!text.trim()) return
    const rows = docDanhSachNhap(text)
    setChecking(true)
    const ten = tenDangNhapCanKiemTra(rows)
    const { data } = ten.length ? await timTenDangNhapDaCo(ten) : { data: [] }
    setParsed(danhDauTrung(rows, new Set((data || []).map(p => p.username))))
    setChecking(false)
    setStep('preview')
  }

  async function handleImport() {
    if (!validRows.length) return
    setStep('importing')
    setProgress({ done: 0, total: validRows.length })
    const res = []
    for (const row of validRows) {
      res.push(await taoMotEm(row))
      setProgress(p => ({ ...p, done: p.done + 1 }))
    }
    setResults(res)
    setStep('done')
    const ok = res.filter(r => r._ok).length
    if (ok > 0) { toast.success(`Đã thêm ${ok} học sinh`); onDone() }
  }

  const soLoi = results.filter(r => !r._ok).length

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Nhập học sinh hàng loạt</h2>
            <p className="text-xs text-gray-400 mt-0.5">Mỗi dòng: <span className="font-mono bg-gray-100 px-1 rounded">họ tên, tên đăng nhập, mật khẩu, khoá học (tuỳ chọn), ca học (tuỳ chọn)</span></p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {step === 'input' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
                <p className="font-semibold mb-1">Định dạng nhập liệu:</p>
                <p className="font-mono text-xs">Nguyễn Văn An, nguyenvanan, matkhau123, Kĩ Năng 1, Ca 1</p>
                <p className="font-mono text-xs">Trần Thị Bình, tranthib, matkhau456, Lập Trình D1</p>
                <p className="font-mono text-xs">Lê Văn Cường, levancuong, matkhau789</p>
                <p className="mt-2 text-xs text-blue-600">Tên đăng nhập: chỉ dùng a-z, 0-9, dấu _ và . · Khoá học và ca học có thể bỏ trống — học sinh tự chọn sau khi đăng nhập</p>
              </div>
              <textarea autoFocus value={text} onChange={e => setText(e.target.value)} placeholder="Dán danh sách học sinh vào đây..." rows={12}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
              <div className="flex justify-end gap-3">
                <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Hủy</button>
                <button onClick={handleParse} disabled={!text.trim() || checking}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 transition">
                  {checking ? <><Loader2 size={14} className="animate-spin" /> Đang kiểm tra...</> : 'Phân tích dữ liệu →'}
                </button>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4">
              <div className="flex gap-3">
                <TheDem tot so={validRows.length}>dòng hợp lệ</TheDem>
                {invalidRows.length > 0 && <TheDem so={invalidRows.length}>dòng lỗi (sẽ bỏ qua)</TheDem>}
              </div>
              <div className="overflow-auto rounded-xl border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className={`${TH} w-8`}>#</th><th className={TH}>Họ tên</th><th className={TH}>Tên đăng nhập</th><th className={TH}>Mật khẩu</th>
                      <th className={TH}>Khoá học</th><th className={TH}>Ca học</th><th className={TH}>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.map((row, i) => (
                      <tr key={i} className={`border-t ${row._errors.length ? 'bg-red-50' : 'bg-white'}`}>
                        <td className="px-3 py-2 text-gray-400 text-xs">{row._line}</td>
                        <td className="px-3 py-2 font-medium text-gray-800">{row.full_name || <span className="text-red-400 italic">trống</span>}</td>
                        <td className="px-3 py-2 text-gray-600 font-mono text-xs">{row.username || '—'}</td>
                        <td className="px-3 py-2 text-gray-400 font-mono text-xs">{row.password ? '••••••' : '—'}</td>
                        <td className="px-3 py-2">{row.grade ? <span className="bg-indigo-100 text-indigo-700 text-xs px-1.5 py-0.5 rounded">{row.grade}</span> : '—'}</td>
                        <td className="px-3 py-2 text-gray-600">{row.class_name || '—'}</td>
                        <td className="px-3 py-2"><TrangThaiDong row={row} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-between gap-3">
                <button onClick={() => setStep('input')} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">← Quay lại</button>
                <div className="flex gap-3">
                  <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Hủy</button>
                  <button onClick={handleImport} disabled={!validRows.length}
                    className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 transition">
                    <UserPlus size={15} /> Thêm {validRows.length} học sinh
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 'importing' && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 size={40} className="animate-spin text-indigo-600" />
              <p className="text-gray-600 font-medium">Đang tạo tài khoản...</p>
              <p className="text-gray-400 text-sm">{progress.done} / {progress.total}</p>
              <div className="w-64 bg-gray-100 rounded-full h-2">
                <div className="bg-indigo-600 h-2 rounded-full transition-all" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
              </div>
            </div>
          )}

          {step === 'done' && (
            <div className="space-y-4">
              <div className="flex gap-3">
                <TheDem tot so={results.length - soLoi}>học sinh đã thêm thành công</TheDem>
                {soLoi > 0 && <TheDem so={soLoi}>tài khoản thất bại</TheDem>}
              </div>
              <div className="overflow-auto rounded-xl border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr><th className={TH}>Họ tên</th><th className={TH}>Email đăng nhập</th><th className={TH}>Ca học</th><th className={TH}>Kết quả</th></tr>
                  </thead>
                  <tbody>
                    {results.map((r, i) => (
                      <tr key={i} className={`border-t ${r._ok ? 'bg-white' : 'bg-red-50'}`}>
                        <td className="px-3 py-2 font-medium text-gray-800">{r.full_name}</td>
                        <td className="px-3 py-2 font-mono text-xs text-gray-600">{r.email}</td>
                        <td className="px-3 py-2 text-gray-600">{r.class_name}</td>
                        <td className="px-3 py-2">
                          {r._ok
                            ? <span className="flex items-center gap-1 text-green-600 text-xs"><CheckCircle2 size={13} /> Thành công</span>
                            : <span className="text-red-500 text-xs">{r._importError}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end">
                <button onClick={onClose} className="px-5 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition">Đóng</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
