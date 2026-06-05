import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { BookOpen } from 'lucide-react'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    full_name: '',
    username: '',
    password: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.full_name.trim()) { toast.error('Vui lòng nhập họ và tên'); return }
    if (!/^[a-zA-Z0-9_.]+$/.test(form.username)) {
      toast.error('Tên đăng nhập chỉ dùng chữ không dấu, số, dấu _ và .'); return
    }
    if (form.password.length < 6) { toast.error('Mật khẩu phải có ít nhất 6 ký tự'); return }
    if (form.password !== form.confirmPassword) { toast.error('Mật khẩu xác nhận không khớp'); return }

    setLoading(true)
    try {
      const email = `${form.username.toLowerCase()}@school.local`
      const { error } = await supabase.auth.signUp({
        email,
        password: form.password,
        options: {
          data: {
            full_name: form.full_name.trim(),
            role: 'student',
            username: form.username.toLowerCase(),
            is_approved: false,
          },
        },
      })
      if (error) throw error
      toast.success('Đăng ký thành công! Liên hệ giáo viên để được thêm vào khoá học.')
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      const msg = err.message?.includes('already')
        ? 'Tên đăng nhập này đã được sử dụng'
        : (err.message || 'Đăng ký thất bại')
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-indigo-600 text-white rounded-full p-3 mb-3">
            <BookOpen size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Đăng ký tài khoản</h1>
          <p className="text-gray-500 text-sm mt-1">Ôn Tập Tin Học — Tiểu học</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Họ và tên <span className="text-red-500">*</span>
            </label>
            <input
              type="text" required
              value={form.full_name}
              onChange={e => set('full_name', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Nguyễn Văn An"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên đăng nhập <span className="text-red-500">*</span>
            </label>
            <input
              type="text" required
              value={form.username}
              onChange={e => set('username', e.target.value.toLowerCase())}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="nguyenvanan"
              autoComplete="username"
            />
            <p className="text-xs text-gray-400 mt-1">Chỉ dùng chữ không dấu, số, dấu _ và .</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mật khẩu <span className="text-red-500">*</span>
            </label>
            <input
              type="password" required minLength={6}
              value={form.password}
              onChange={e => set('password', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Tối thiểu 6 ký tự"
              autoComplete="new-password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Xác nhận mật khẩu <span className="text-red-500">*</span>
            </label>
            <input
              type="password" required
              value={form.confirmPassword}
              onChange={e => set('confirmPassword', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Nhập lại mật khẩu"
              autoComplete="new-password"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-700">
            Sau khi đăng ký, liên hệ giáo viên để được thêm vào khoá học.
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-60"
          >
            {loading ? 'Đang đăng ký...' : 'Đăng ký'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Đã có tài khoản?{' '}
          <Link to="/login" className="text-indigo-600 font-medium hover:underline">Đăng nhập</Link>
        </p>
      </div>
    </div>
  )
}
