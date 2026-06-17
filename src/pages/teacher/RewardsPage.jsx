import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { Gift, Plus, Trash2, CheckCircle, Clock, X, Loader2, ToggleLeft, ToggleRight, Package } from 'lucide-react'

const EMOJI_PRESETS = ['🍬','🍭','🍫','🎮','📚','✏️','🖍️','🎨','🏆','⭐','🎯','🎁','🎀','🧸','🪀','🎲','🎵','📱','🍕','🍦','🎠','🌟','💎','🦄','🐱','🐶','🦋','🌈','🚀','💫']

export default function RewardsPage() {
  const [tab, setTab] = useState('items')
  const [items, setItems] = useState([])
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [reqLoading, setReqLoading] = useState(false)

  // Form thêm/sửa
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [formName, setFormName] = useState('')
  const [formEmoji, setFormEmoji] = useState('🎁')
  const [saving, setSaving] = useState(false)

  const [fulfilling, setFulfilling] = useState(null)
  const [filterStatus, setFilterStatus] = useState('pending')

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const [{ data: itemsData }, { data: reqData }] = await Promise.all([
      supabase.from('reward_items').select('*').order('created_at'),
      supabase.from('reward_requests')
        .select('*, reward_items(name, emoji), profiles(full_name, id)')
        .order('created_at', { ascending: false }),
    ])
    setItems(itemsData || [])

    // Join thêm class info
    const reqs = reqData || []
    const studentIds = [...new Set(reqs.map(r => r.student_id))]
    let classMap = {}
    if (studentIds.length > 0) {
      const { data: enrollData } = await supabase
        .from('student_enrollments')
        .select('user_id, class_name')
        .in('user_id', studentIds)
      ;(enrollData || []).forEach(e => { classMap[e.user_id] = e.class_name })
    }
    setRequests(reqs.map(r => ({ ...r, class_name: classMap[r.student_id] || '' })))
    setLoading(false)
  }

  function openAdd() {
    setEditItem(null); setFormName(''); setFormEmoji('🎁'); setShowForm(true)
  }

  function openEdit(item) {
    setEditItem(item); setFormName(item.name); setFormEmoji(item.emoji || '🎁'); setShowForm(true)
  }

  async function saveItem() {
    if (!formName.trim()) { toast.error('Nhập tên phần thưởng'); return }
    setSaving(true)
    const payload = { name: formName.trim(), emoji: formEmoji, is_active: true }
    if (editItem) {
      const { error } = await supabase.from('reward_items').update(payload).eq('id', editItem.id)
      if (error) toast.error(error.message)
      else { toast.success('Đã cập nhật'); loadAll() }
    } else {
      const { error } = await supabase.from('reward_items').insert(payload)
      if (error) toast.error(error.message)
      else { toast.success('Đã thêm phần thưởng'); loadAll() }
    }
    setSaving(false)
    setShowForm(false)
  }

  async function deleteItem(id) {
    if (!confirm('Xóa phần thưởng này?')) return
    const { error } = await supabase.from('reward_items').delete().eq('id', id)
    if (error) toast.error(error.message)
    else { toast.success('Đã xóa'); setItems(prev => prev.filter(i => i.id !== id)) }
  }

  async function toggleActive(item) {
    const { error } = await supabase.from('reward_items').update({ is_active: !item.is_active }).eq('id', item.id)
    if (error) toast.error(error.message)
    else setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_active: !i.is_active } : i))
  }

  async function fulfillRequest(req) {
    setFulfilling(req.id)
    const { error } = await supabase.from('reward_requests').update({
      status: 'fulfilled',
      fulfilled_at: new Date().toISOString(),
    }).eq('id', req.id)
    if (error) toast.error(error.message)
    else {
      toast.success(`Đã trao quà cho ${req.profiles?.full_name}!`)
      setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'fulfilled', fulfilled_at: new Date().toISOString() } : r))
    }
    setFulfilling(null)
  }

  async function cancelRequest(req) {
    if (!confirm('Từ chối yêu cầu này? Sticker sẽ được hoàn lại cho học sinh.')) return
    // Hoàn sticker
    const { data: prof } = await supabase.from('profiles').select('sticker_count').eq('id', req.student_id).single()
    await supabase.from('profiles').update({ sticker_count: (prof?.sticker_count ?? 0) + req.sticker_cost }).eq('id', req.student_id)
    await supabase.from('reward_requests').update({ status: 'cancelled' }).eq('id', req.id)
    toast.success('Đã từ chối và hoàn sticker')
    setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'cancelled' } : r))
  }

  const pendingCount = requests.filter(r => r.status === 'pending').length
  const filteredReqs = requests.filter(r => r.status === filterStatus)

  if (loading) return (
    <div className="flex justify-center items-center py-20">
      <Loader2 size={32} className="animate-spin text-indigo-500" />
    </div>
  )

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
          <Gift size={22} className="text-indigo-600" />
        </div>
        <div>
          <h1 className="text-xl font-black text-gray-800">Quản lý phần thưởng</h1>
          <p className="text-sm text-gray-400">Cài đặt quà và duyệt yêu cầu đổi quà</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab('items')}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === 'items' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-gray-500 border border-gray-200 hover:border-indigo-300'}`}>
          <Package size={15} className="inline mr-1.5 -mt-0.5" />
          Danh sách quà ({items.length})
        </button>
        <button onClick={() => setTab('requests')}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all relative ${tab === 'requests' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-gray-500 border border-gray-200 hover:border-indigo-300'}`}>
          <Clock size={15} className="inline mr-1.5 -mt-0.5" />
          Yêu cầu đổi quà
          {pendingCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center">
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Tab: Danh sách quà ── */}
      {tab === 'items' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={openAdd}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition shadow-md shadow-indigo-200">
              <Plus size={16} /> Thêm phần thưởng
            </button>
          </div>

          {items.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-300 py-16 text-center">
              <div className="text-5xl mb-3">🎁</div>
              <p className="text-gray-500 font-medium">Chưa có phần thưởng nào</p>
              <p className="text-gray-400 text-sm mt-1">Thêm quà để học sinh có thể đổi sticker</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {items.map(item => (
                <div key={item.id}
                  className={`bg-white rounded-2xl border-2 p-4 flex flex-col items-center gap-2 transition-all relative ${item.is_active ? 'border-indigo-100 shadow-sm' : 'border-gray-100 opacity-50'}`}>
                  <span className="text-4xl">{item.emoji}</span>
                  <span className="text-sm font-bold text-gray-700 text-center leading-tight">{item.name}</span>
                  <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {item.is_active ? 'Đang hiện' : 'Đã ẩn'}
                  </div>
                  <div className="flex gap-2 mt-1">
                    <button onClick={() => toggleActive(item)}
                      className="text-gray-400 hover:text-indigo-500 transition" title={item.is_active ? 'Ẩn' : 'Hiện'}>
                      {item.is_active ? <ToggleRight size={18} className="text-green-500" /> : <ToggleLeft size={18} />}
                    </button>
                    <button onClick={() => openEdit(item)}
                      className="text-xs text-indigo-500 hover:text-indigo-700 font-semibold px-2 py-0.5 rounded-lg hover:bg-indigo-50 transition">
                      Sửa
                    </button>
                    <button onClick={() => deleteItem(item.id)}
                      className="text-gray-300 hover:text-red-500 transition">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Yêu cầu đổi quà ── */}
      {tab === 'requests' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            {[
              { key: 'pending', label: '⏳ Chờ trao', color: 'yellow' },
              { key: 'fulfilled', label: '✅ Đã trao', color: 'green' },
              { key: 'cancelled', label: '✕ Từ chối', color: 'gray' },
            ].map(({ key, label }) => (
              <button key={key} onClick={() => setFilterStatus(key)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${filterStatus === key ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-300'}`}>
                {label}
                <span className="ml-1.5 bg-white/20 px-1.5 py-0.5 rounded-full">
                  {requests.filter(r => r.status === key).length}
                </span>
              </button>
            ))}
          </div>

          {filteredReqs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 py-14 text-center">
              <div className="text-4xl mb-2">{filterStatus === 'pending' ? '✨' : filterStatus === 'fulfilled' ? '🎉' : '📭'}</div>
              <p className="text-gray-400 text-sm font-medium">
                {filterStatus === 'pending' ? 'Không có yêu cầu nào đang chờ' : filterStatus === 'fulfilled' ? 'Chưa có quà nào được trao' : 'Không có yêu cầu bị từ chối'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReqs.map(req => (
                <div key={req.id} className={`bg-white rounded-2xl border px-5 py-4 flex items-center gap-4 ${req.status === 'pending' ? 'border-yellow-200 shadow-sm shadow-yellow-50' : 'border-gray-100'}`}>
                  {/* Reward emoji */}
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-100 to-yellow-100 flex items-center justify-center text-2xl shrink-0">
                    {req.reward_items?.emoji || '🎁'}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-800 text-sm">{req.profiles?.full_name || 'Học sinh'}</span>
                      {req.class_name && <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{req.class_name}</span>}
                    </div>
                    <div className="text-sm text-gray-600 mt-0.5">
                      muốn đổi: <span className="font-semibold text-orange-600">{req.reward_items?.emoji} {req.reward_items?.name}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span>⭐ {req.sticker_cost} sticker</span>
                      <span>· {new Date(req.created_at).toLocaleDateString('vi-VN')}</span>
                      {req.fulfilled_at && <span className="text-green-500">· Trao {new Date(req.fulfilled_at).toLocaleDateString('vi-VN')}</span>}
                    </div>
                  </div>

                  {/* Actions */}
                  {req.status === 'pending' && (
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => fulfillRequest(req)} disabled={fulfilling === req.id}
                        className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-xl text-xs font-bold transition disabled:opacity-50">
                        {fulfilling === req.id ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                        Đã trao
                      </button>
                      <button onClick={() => cancelRequest(req)} disabled={fulfilling === req.id}
                        className="flex items-center gap-1.5 bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-500 px-3 py-2 rounded-xl text-xs font-bold transition">
                        <X size={13} /> Từ chối
                      </button>
                    </div>
                  )}
                  {req.status === 'fulfilled' && (
                    <span className="text-green-500 text-xs font-bold shrink-0">✅ Đã trao</span>
                  )}
                  {req.status === 'cancelled' && (
                    <span className="text-gray-400 text-xs font-bold shrink-0">✕ Từ chối</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Form thêm/sửa ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
            onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-5 py-4 flex items-center justify-between">
              <h3 className="text-white font-black text-base">{editItem ? 'Sửa phần thưởng' : 'Thêm phần thưởng'}</h3>
              <button onClick={() => setShowForm(false)} className="text-white/70 hover:text-white"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              {/* Emoji chọn sẵn */}
              <div>
                <label className="text-xs font-bold text-gray-500 mb-2 block">Chọn emoji</label>
                <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-xl max-h-28 overflow-y-auto">
                  {EMOJI_PRESETS.map(e => (
                    <button key={e} onClick={() => setFormEmoji(e)}
                      className={`w-9 h-9 text-xl rounded-lg transition-all hover:scale-110 ${formEmoji === e ? 'bg-indigo-100 ring-2 ring-indigo-400 scale-110' : 'hover:bg-gray-100'}`}>
                      {e}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-2xl">{formEmoji}</span>
                  <input value={formEmoji} onChange={e => setFormEmoji(e.target.value)}
                    className="w-20 border border-gray-200 rounded-lg px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    placeholder="emoji" maxLength={4} />
                  <span className="text-xs text-gray-400">hoặc gõ emoji khác</span>
                </div>
              </div>

              {/* Tên */}
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1.5 block">Tên phần thưởng</label>
                <input value={formName} onChange={e => setFormName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && saveItem()}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  placeholder="VD: Kẹo ngọt, Nhãn dán, Bút màu..." />
              </div>

              {/* Preview */}
              <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
                <span className="text-3xl">{formEmoji}</span>
                <span className="font-bold text-gray-700 text-sm">{formName || 'Tên phần thưởng'}</span>
              </div>

              <button onClick={saveItem} disabled={saving || !formName.trim()}
                className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-black rounded-xl disabled:opacity-50 transition hover:opacity-90">
                {saving ? <Loader2 size={18} className="animate-spin mx-auto" /> : editItem ? 'Lưu thay đổi' : 'Thêm phần thưởng'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
