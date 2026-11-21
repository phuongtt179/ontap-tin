// Sửa họ tên, khoá / lớp (ghi danh), đặt lại mật khẩu của 1 học sinh.
import { useState } from 'react'
import toast from 'react-hot-toast'
import { X, Loader2 } from 'lucide-react'
import { capNhatHoSo } from '../../../data/hoSo'
import { ghiDanhHocSinh } from '../../../data/ghiDanh'
import { suaTaiKhoan } from '../../../data/taiKhoan'
import { MAT_KHAU_TOI_THIEU } from '../../../domain/hocSinh'

const O_NHAP = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'

export default function SuaHocSinhModal({ student, classes, gradeValues, onClose, onDone }) {
  const dau = student.enrollments?.[0] || {}
  const [form, setForm] = useState({
    full_name: student.full_name || '',
    grade: dau.grade || student.grade || '',
    class_name: dau.class_name || student.class_name || '',
    new_password: '',
  })
  const [saving, setSaving] = useState(false)
  const lopCuaKhoa = form.grade ? classes.filter(c => c.grade === form.grade) : classes

  async function handleSave() {
    if (form.new_password && form.new_password.length < MAT_KHAU_TOI_THIEU) {
      toast.error(`Mật khẩu mới phải ít nhất ${MAT_KHAU_TOI_THIEU} ký tự`)
      return
    }
    setSaving(true)
    const ops = [capNhatHoSo(student.id, { full_name: form.full_name })]
    if (form.grade) ops.push(ghiDanhHocSinh({ user_id: student.id, grade: form.grade, class_name: form.class_name || null, is_approved: true }))
    const err = (await Promise.all(ops)).find(r => r.error)?.error
    if (err) { setSaving(false); toast.error('Lưu thất bại: ' + err.message); return }
    if (form.new_password) {
      try { await suaTaiKhoan(student.id, { password: form.new_password }) } catch (e) {
        setSaving(false)
        toast.error('Đổi mật khẩu thất bại: ' + e.message)
        return
      }
    }
    setSaving(false)
    toast.success('Đã cập nhật')
    onDone()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-base font-bold text-gray-800">Sửa thông tin học sinh</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
            <input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className={O_NHAP} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Khoá học</label>
            <select value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value, class_name: '' })} className={O_NHAP}>
              <option value="">-- Chọn khối --</option>
              {gradeValues.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lớp</label>
            <select value={form.class_name} onChange={e => setForm({ ...form, class_name: e.target.value })} className={O_NHAP}>
              <option value="">-- Chọn lớp --</option>
              {lopCuaKhoa.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Đặt lại mật khẩu <span className="text-gray-400 font-normal">(để trống nếu không đổi)</span>
            </label>
            <input type="password" value={form.new_password} onChange={e => setForm({ ...form, new_password: e.target.value })}
              placeholder={`Mật khẩu mới (ít nhất ${MAT_KHAU_TOI_THIEU} ký tự)`} className={O_NHAP} />
          </div>
          <div className="text-xs text-gray-400">
            Tên đăng nhập: <span className="font-mono">{student.username || '—'}</span> (không thể thay đổi)
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Hủy</button>
          <button onClick={handleSave} disabled={saving || !form.full_name}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 transition">
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            Lưu
          </button>
        </div>
      </div>
    </div>
  )
}
