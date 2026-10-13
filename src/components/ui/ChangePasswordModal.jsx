import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { X, Eye, EyeOff, Loader2, KeyRound } from 'lucide-react'

// Người dùng (học sinh / giáo viên / trợ giảng) tự đổi mật khẩu của mình.
// Supabase đang bật "đổi mật khẩu phải đăng nhập lại gần đây" — mã xác nhận gửi qua email thì học sinh
// (@school.local) không nhận được, nên ta đăng nhập lại bằng MẬT KHẨU HIỆN TẠI: vừa xác minh đúng chủ tài khoản,
// vừa làm mới lần đăng nhập để Supabase cho phép đặt mật khẩu mới.
export default function ChangePasswordModal({ email, onClose }) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [saving, setSaving] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (!current) { toast.error('Nhập mật khẩu hiện tại'); return }
    if (next.length < 6) { toast.error('Mật khẩu mới phải có ít nhất 6 ký tự'); return }
    if (next !== confirm) { toast.error('Hai lần nhập mật khẩu mới chưa giống nhau'); return }
    if (next === current) { toast.error('Mật khẩu mới phải khác mật khẩu hiện tại'); return }

    setSaving(true)
    try {
      const { error: signErr } = await supabase.auth.signInWithPassword({ email, password: current })
      if (signErr) { toast.error('Mật khẩu hiện tại chưa đúng'); return }
      const { error } = await supabase.auth.updateUser({ password: next })
      if (error) { toast.error('Chưa đổi được mật khẩu: ' + error.message); return }
      toast.success('Đã đổi mật khẩu! Lần sau đăng nhập bằng mật khẩu mới nhé')
      onClose()
    } catch {
      toast.error('Có lỗi mạng, thử lại sau')
    } finally {
      setSaving(false)
    }
  }

  const input = 'w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500'
  const toggle = (
    <button type="button" onClick={() => setShow(s => !s)} tabIndex={-1}
      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" title={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>
      {show ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  )

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4" onClick={onClose}>
      <form onSubmit={submit} onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5 space-y-4 text-left">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><KeyRound size={18} className="text-indigo-600" /> Đổi mật khẩu</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <label className="block text-sm text-gray-700 space-y-1">
          <span className="font-medium">Mật khẩu hiện tại</span>
          <div className="relative">
            <input type={show ? 'text' : 'password'} value={current} onChange={e => setCurrent(e.target.value)}
              autoComplete="current-password" autoFocus className={input} />
            {toggle}
          </div>
        </label>
        <label className="block text-sm text-gray-700 space-y-1">
          <span className="font-medium">Mật khẩu mới <span className="text-gray-400 font-normal">(ít nhất 6 ký tự)</span></span>
          <div className="relative">
            <input type={show ? 'text' : 'password'} value={next} onChange={e => setNext(e.target.value)}
              autoComplete="new-password" className={input} />
            {toggle}
          </div>
        </label>
        <label className="block text-sm text-gray-700 space-y-1">
          <span className="font-medium">Nhập lại mật khẩu mới</span>
          <div className="relative">
            <input type={show ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)}
              autoComplete="new-password" className={input} />
            {toggle}
          </div>
          {confirm && next !== confirm && <span className="text-xs text-red-500">Chưa giống mật khẩu mới</span>}
        </label>

        <p className="text-xs text-gray-500">Quên mật khẩu hiện tại? Nhờ thầy/cô đặt lại mật khẩu cho em.</p>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">Huỷ</button>
          <button type="submit" disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold disabled:opacity-50">
            {saving && <Loader2 size={14} className="animate-spin" />} Đổi mật khẩu
          </button>
        </div>
      </form>
    </div>
  )
}
