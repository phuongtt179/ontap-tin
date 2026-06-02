import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { UserPlus, Trash2, Loader2, Eye, EyeOff } from 'lucide-react'

async function adminCreateUser(email, password, metadata) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  const res = await fetch(`${supabaseUrl}/functions/v1/create-user`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${anonKey}`,
      'apikey': anonKey,
    },
    body: JSON.stringify({ email, password, metadata }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || data.message || 'Lỗi tạo tài khoản')
  return data.user
}

async function adminDeleteUser(userId) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  const res = await fetch(`${supabaseUrl}/functions/v1/delete-user`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${anonKey}`,
      'apikey': anonKey,
    },
    body: JSON.stringify({ userId }),
  })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error || 'Lỗi xóa tài khoản')
  }
}

export default function AssistantsPage() {
  const [assistants, setAssistants] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [form, setForm] = useState({ full_name: '', email: '', password: '' })

  useEffect(() => { fetchAssistants() }, [])

  async function fetchAssistants() {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, username, created_at')
      .eq('role', 'assistant')
      .order('created_at', { ascending: false })
    setAssistants(data || [])
    setLoading(false)
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!form.full_name.trim() || !form.email.trim() || !form.password.trim()) {
      toast.error('Vui lòng điền đầy đủ thông tin')
      return
    }
    if (form.password.length < 6) {
      toast.error('Mật khẩu ít nhất 6 ký tự')
      return
    }
    setSaving(true)
    try {
      await adminCreateUser(form.email.trim(), form.password, {
        full_name: form.full_name.trim(),
        role: 'assistant',
      })
      toast.success('Đã tạo tài khoản trợ giảng')
      setForm({ full_name: '', email: '', password: '' })
      setShowForm(false)
      fetchAssistants()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(a) {
    if (!confirm(`Xóa tài khoản trợ giảng "${a.full_name}"? Hành động này không thể hoàn tác.`)) return
    try {
      await adminDeleteUser(a.id)
      toast.success('Đã xóa tài khoản')
      fetchAssistants()
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Trợ giảng</h1>
          <p className="text-gray-400 text-sm mt-0.5">{assistants.length} tài khoản</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
        >
          <UserPlus size={16} />
          Thêm trợ giảng
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl border border-gray-200 p-5 mb-6 space-y-4">
          <h2 className="font-semibold text-gray-700">Tạo tài khoản trợ giảng</h2>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Họ tên</label>
            <input
              type="text"
              value={form.full_name}
              onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="Nguyễn Văn A"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Email đăng nhập</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="trogiang@gmail.com"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Mật khẩu</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                placeholder="Ít nhất 6 ký tự"
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              Tạo tài khoản
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={24} className="animate-spin text-indigo-400" />
        </div>
      ) : assistants.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          Chưa có tài khoản trợ giảng nào
        </div>
      ) : (
        <div className="space-y-2">
          {assistants.map(a => (
            <div key={a.id} className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-800 text-sm">{a.full_name}</div>
                <div className="text-xs text-gray-400 mt-0.5">
                  Tạo lúc {new Date(a.created_at).toLocaleDateString('vi-VN')}
                </div>
              </div>
              <button
                onClick={() => handleDelete(a)}
                className="p-1.5 text-gray-300 hover:text-red-500 transition"
                title="Xóa tài khoản"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
