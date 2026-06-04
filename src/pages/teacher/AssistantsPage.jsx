import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { UserPlus, Trash2, Loader2, Eye, EyeOff, Pencil, Check, X, BookOpen, ClipboardList, Tags, FileText, ChevronLeft } from 'lucide-react'

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

async function adminUpdateUser(userId, updates) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  const res = await fetch(`${supabaseUrl}/functions/v1/update-user`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${anonKey}`,
      'apikey': anonKey,
    },
    body: JSON.stringify({ userId, ...updates }),
  })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error || 'Lỗi cập nhật mật khẩu')
  }
}

const CONTENT_TABS = [
  { key: 'topics',    label: 'Chủ đề',   icon: <Tags size={14} /> },
  { key: 'questions', label: 'Câu hỏi',  icon: <FileText size={14} /> },
  { key: 'lessons',  label: 'Bài học',   icon: <BookOpen size={14} /> },
  { key: 'exams',    label: 'Đề thi',    icon: <ClipboardList size={14} /> },
]

function AssistantContentPanel({ assistant, onBack }) {
  const [tab, setTab] = useState('topics')
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => { fetchData(tab) }, [tab])

  async function fetchData(type) {
    setLoading(true)
    setData([])
    const col = type === 'topics' ? 'name' : 'title'
    const { data: rows } = await supabase
      .from(type)
      .select(`id, ${col}, grade, created_at`)
      .eq('created_by', assistant.id)
      .order('created_at', { ascending: false })
    setData(rows || [])
    setLoading(false)
  }

  const nameKey = tab === 'topics' ? 'name' : 'title'

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onBack} className="p-1.5 text-gray-400 hover:text-gray-700 transition">
          <ChevronLeft size={20} />
        </button>
        <div>
          <h2 className="text-lg font-bold text-gray-800">{assistant.full_name}</h2>
          <p className="text-xs text-gray-400">Nội dung đã tạo</p>
        </div>
      </div>

      <div className="flex gap-1 mb-4 border-b border-gray-200">
        {CONTENT_TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition -mb-px
              ${tab === t.key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 size={20} className="animate-spin text-indigo-400" />
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm">Chưa có {CONTENT_TABS.find(t => t.key === tab)?.label.toLowerCase()} nào</div>
      ) : (
        <div className="space-y-1.5">
          {data.map(row => (
            <div key={row.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-2.5">
              <div>
                <div className="text-sm text-gray-800">{row[nameKey]}</div>
                {row.grade && <span className="text-xs text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded mt-0.5 inline-block">Khối {row.grade}</span>}
              </div>
              <div className="text-xs text-gray-400 shrink-0 ml-3">
                {new Date(row.created_at).toLocaleDateString('vi-VN')}
              </div>
            </div>
          ))}
          <p className="text-xs text-gray-400 text-right pt-1">{data.length} mục</p>
        </div>
      )}
    </div>
  )
}

export default function AssistantsPage() {
  const [assistants, setAssistants] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [form, setForm] = useState({ full_name: '', email: '', password: '' })

  const [editId, setEditId] = useState(null)
  const [editForm, setEditForm] = useState({ full_name: '', password: '' })
  const [editSaving, setEditSaving] = useState(false)
  const [showEditPass, setShowEditPass] = useState(false)

  const [viewingAssistant, setViewingAssistant] = useState(null)

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

  function startEdit(a) {
    setEditId(a.id)
    setEditForm({ full_name: a.full_name, password: '' })
    setShowEditPass(false)
    setShowForm(false)
  }

  function cancelEdit() {
    setEditId(null)
    setEditForm({ full_name: '', password: '' })
  }

  async function handleUpdate(e) {
    e.preventDefault()
    if (!editForm.full_name.trim()) { toast.error('Họ tên không được để trống'); return }
    if (editForm.password && editForm.password.length < 6) { toast.error('Mật khẩu ít nhất 6 ký tự'); return }
    setEditSaving(true)
    try {
      const { error } = await supabase.from('profiles').update({ full_name: editForm.full_name.trim() }).eq('id', editId)
      if (error) throw new Error(error.message)
      if (editForm.password) await adminUpdateUser(editId, { password: editForm.password })
      toast.success('Đã cập nhật')
      cancelEdit()
      fetchAssistants()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setEditSaving(false)
    }
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!form.full_name.trim() || !form.email.trim() || !form.password.trim()) {
      toast.error('Vui lòng điền đầy đủ thông tin'); return
    }
    if (form.password.length < 6) { toast.error('Mật khẩu ít nhất 6 ký tự'); return }
    setSaving(true)
    try {
      await adminCreateUser(form.email.trim(), form.password, { full_name: form.full_name.trim(), role: 'assistant' })
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

  if (viewingAssistant) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <AssistantContentPanel assistant={viewingAssistant} onBack={() => setViewingAssistant(null)} />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Trợ giảng</h1>
          <p className="text-gray-400 text-sm mt-0.5">{assistants.length} tài khoản</p>
        </div>
        <button
          onClick={() => { setShowForm(v => !v); cancelEdit() }}
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
            <input type="text" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="Nguyễn Văn A" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Email đăng nhập</label>
            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="trogiang@gmail.com" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Mật khẩu</label>
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="Ít nhất 6 ký tự" />
              <button type="button" onClick={() => setShowPass(v => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">Hủy</button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50">
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
        <div className="text-center py-12 text-gray-400 text-sm">Chưa có tài khoản trợ giảng nào</div>
      ) : (
        <div className="space-y-2">
          {assistants.map(a => (
            <div key={a.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {editId === a.id ? (
                <form onSubmit={handleUpdate} className="p-4 space-y-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Họ tên</label>
                    <input type="text" value={editForm.full_name} onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Mật khẩu mới <span className="text-gray-400">(để trống nếu không đổi)</span></label>
                    <div className="relative">
                      <input type={showEditPass ? 'text' : 'password'} value={editForm.password}
                        onChange={e => setEditForm(f => ({ ...f, password: e.target.value }))}
                        className="w-full border rounded-lg px-3 py-1.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        placeholder="Ít nhất 6 ký tự" />
                      <button type="button" onClick={() => setShowEditPass(v => !v)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showEditPass ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button type="button" onClick={cancelEdit}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition">
                      <X size={14} /> Hủy
                    </button>
                    <button type="submit" disabled={editSaving}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50">
                      {editSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                      Lưu
                    </button>
                  </div>
                </form>
              ) : (
                <div className="px-4 py-3 flex items-center justify-between">
                  <button onClick={() => setViewingAssistant(a)} className="text-left flex-1 min-w-0">
                    <div className="font-medium text-gray-800 text-sm hover:text-indigo-600 transition">{a.full_name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      Tạo lúc {new Date(a.created_at).toLocaleDateString('vi-VN')}
                    </div>
                  </button>
                  <div className="flex items-center gap-1 ml-2">
                    <button onClick={() => setViewingAssistant(a)}
                      className="p-1.5 text-gray-300 hover:text-indigo-500 transition" title="Xem nội dung đã tạo">
                      <BookOpen size={15} />
                    </button>
                    <button onClick={() => startEdit(a)}
                      className="p-1.5 text-gray-300 hover:text-indigo-500 transition" title="Sửa">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => handleDelete(a)}
                      className="p-1.5 text-gray-300 hover:text-red-500 transition" title="Xóa tài khoản">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
