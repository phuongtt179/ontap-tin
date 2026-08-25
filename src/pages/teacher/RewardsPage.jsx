import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useGrades } from '../../hooks/useGrades'
import { adjustStickerCount } from '../../utils/stickerAward'
import toast from 'react-hot-toast'
import { Gift, Plus, Trash2, CheckCircle, Clock, X, Loader2, ToggleLeft, ToggleRight, Package, Settings, Save, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'

const EMOJI_PRESETS = ['🍬','🍭','🍫','🎮','📚','✏️','🖍️','🎨','🏆','⭐','🎯','🎁','🎀','🧸','🪀','🎲','🎵','📱','🍕','🍦','🎠','🌟','💎','🦄','🐱','🐶','🦋','🌈','🚀','💫']

function SortTh({ label, col, sortBy, sortAsc, onSort }) {
  const active = sortBy === col
  return (
    <th className="px-4 py-3 text-left">
      <button onClick={() => onSort(col)}
        className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-indigo-600 transition group">
        {label}
        {active
          ? sortAsc ? <ChevronUp size={13} className="text-indigo-500" /> : <ChevronDown size={13} className="text-indigo-500" />
          : <ChevronsUpDown size={12} className="text-gray-300 group-hover:text-indigo-400" />}
      </button>
    </th>
  )
}

export default function RewardsPage() {
  const { grades } = useGrades()
  const [tab, setTab] = useState('items')
  const [items, setItems] = useState([])
  const [requests, setRequests] = useState([])
  const [configs, setConfigs] = useState({})   // { [grade]: sticker_threshold }
  const [loading, setLoading] = useState(true)

  // Filter items by grade
  const [gradeFilter, setGradeFilter] = useState('__all__')

  // Form thêm/sửa quà
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [formName, setFormName] = useState('')
  const [formEmoji, setFormEmoji] = useState('🎁')
  const [formGrade, setFormGrade] = useState('')   // '' = tất cả, hoặc grade cụ thể
  const [formCost, setFormCost] = useState(50)
  const [saving, setSaving] = useState(false)

  // Requests
  const [fulfilling, setFulfilling] = useState(null)
  const [filterStatus, setFilterStatus] = useState('pending')
  const [sortBy, setSortBy] = useState('date')
  const [sortAsc, setSortAsc] = useState(false)

  // Config editing
  const [editingThreshold, setEditingThreshold] = useState({})  // { [grade]: value }
  const [savingConfig, setSavingConfig] = useState(null)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const [{ data: itemsData }, { data: reqData }, { data: cfgData }] = await Promise.all([
      supabase.from('reward_items').select('*').order('created_at'),
      supabase.from('reward_requests').select('*, reward_items(name, emoji)').order('id', { ascending: false }),
      supabase.from('reward_configs').select('*'),
    ])
    setItems(itemsData || [])

    // Configs → map
    const cfgMap = {}
    ;(cfgData || []).forEach(c => { cfgMap[c.grade] = c.sticker_threshold })
    setConfigs(cfgMap)
    setEditingThreshold(cfgMap)

    // Profiles + class
    const reqs = reqData || []
    const studentIds = [...new Set(reqs.map(r => r.student_id))]
    let profileMap = {}
    let classMap = {}
    if (studentIds.length > 0) {
      const [{ data: profileData }, { data: enrollData }] = await Promise.all([
        supabase.from('profiles').select('id, full_name').in('id', studentIds),
        supabase.from('student_enrollments').select('user_id, class_name').in('user_id', studentIds),
      ])
      ;(profileData || []).forEach(p => { profileMap[p.id] = p.full_name })
      ;(enrollData || []).forEach(e => { classMap[e.user_id] = e.class_name })
    }
    setRequests(reqs.map(r => ({
      ...r,
      profiles: { full_name: profileMap[r.student_id] || 'Học sinh', id: r.student_id },
      class_name: classMap[r.student_id] || '',
      created_at: r.created_at || r.requested_at,
      fulfilled_at: r.fulfilled_at || r.given_at,
    })))
    setLoading(false)
  }

  // ── Save threshold for a grade ──
  async function saveThreshold(grade) {
    const val = parseInt(editingThreshold[grade])
    if (!val || val < 1) { toast.error('Nhập số sticker hợp lệ'); return }
    setSavingConfig(grade)
    const { error } = await supabase.from('reward_configs').upsert(
      { grade, sticker_threshold: val, updated_at: new Date().toISOString() },
      { onConflict: 'grade' }
    )
    if (error) toast.error(error.message)
    else {
      setConfigs(prev => ({ ...prev, [grade]: val }))
      toast.success(`Đã lưu ngưỡng cho khóa ${grade}`)
    }
    setSavingConfig(null)
  }

  // ── Item CRUD ──
  function openAdd() {
    setEditItem(null); setFormName(''); setFormEmoji('🎁'); setFormGrade(''); setFormCost(50); setShowForm(true)
  }
  function openEdit(item) {
    setEditItem(item); setFormName(item.name); setFormEmoji(item.emoji || '🎁')
    setFormGrade(item.grade || ''); setFormCost(item.sticker_cost ?? 50); setShowForm(true)
  }

  async function saveItem() {
    if (!formName.trim()) { toast.error('Nhập tên phần thưởng'); return }
    const cost = parseInt(formCost)
    if (!cost || cost < 1) { toast.error('Nhập số sticker hợp lệ'); return }
    setSaving(true)
    const payload = { name: formName.trim(), emoji: formEmoji, is_active: true, grade: formGrade || null, sticker_cost: cost }
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

  // ── Request actions ──
  async function fulfillRequest(req) {
    setFulfilling(req.id)
    const { error } = await supabase.from('reward_requests').update({
      status: 'fulfilled', fulfilled_at: new Date().toISOString(),
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
    await adjustStickerCount(req.student_id, req.sticker_cost)
    await supabase.from('reward_requests').update({ status: 'cancelled' }).eq('id', req.id)
    toast.success('Đã từ chối và hoàn sticker')
    setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'cancelled' } : r))
  }

  const pendingCount = requests.filter(r => r.status === 'pending').length

  function toggleSort(col) {
    if (sortBy === col) setSortAsc(a => !a)
    else { setSortBy(col); setSortAsc(true) }
  }

  const filteredReqs = requests
    .filter(r => r.status === filterStatus)
    .sort((a, b) => {
      let va, vb
      if (sortBy === 'reward') {
        va = a.reward_items?.name ?? ''; vb = b.reward_items?.name ?? ''
        return sortAsc ? va.localeCompare(vb, 'vi') : vb.localeCompare(va, 'vi')
      }
      if (sortBy === 'student') {
        va = a.profiles?.full_name ?? ''; vb = b.profiles?.full_name ?? ''
        return sortAsc ? va.localeCompare(vb, 'vi') : vb.localeCompare(va, 'vi')
      }
      if (sortBy === 'class') {
        va = a.class_name ?? ''; vb = b.class_name ?? ''
        return sortAsc ? va.localeCompare(vb, 'vi') : vb.localeCompare(va, 'vi')
      }
      // date (default)
      va = new Date(a.created_at); vb = new Date(b.created_at)
      return sortAsc ? va - vb : vb - va
    })
  const filteredItems = gradeFilter === '__all__'
    ? items
    : items.filter(i => (i.grade || '') === gradeFilter || (!i.grade && gradeFilter === '__all__'))

  const displayItems = gradeFilter === '__all__'
    ? items
    : items.filter(i => i.grade === gradeFilter || !i.grade)

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
      <div className="flex gap-2 mb-6 flex-wrap">
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
        <button onClick={() => setTab('config')}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === 'config' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-gray-500 border border-gray-200 hover:border-indigo-300'}`}>
          <Settings size={15} className="inline mr-1.5 -mt-0.5" />
          Cài đặt ngưỡng
        </button>
      </div>

      {/* ── Tab: Danh sách quà ── */}
      {tab === 'items' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Grade filter */}
            <div className="flex gap-1.5 flex-wrap flex-1">
              <button onClick={() => setGradeFilter('__all__')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${gradeFilter === '__all__' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-300'}`}>
                Tất cả
              </button>
              <button onClick={() => setGradeFilter('')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${gradeFilter === '' ? 'bg-gray-600 text-white border-gray-600' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}`}>
                Chung (mọi khóa)
              </button>
              {grades.map(g => (
                <button key={g} onClick={() => setGradeFilter(g)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${gradeFilter === g ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-500 border-gray-200 hover:border-orange-300'}`}>
                  Khóa {g}
                </button>
              ))}
            </div>
            <button onClick={openAdd}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition shadow-md shadow-indigo-200 shrink-0">
              <Plus size={16} /> Thêm quà
            </button>
          </div>

          {displayItems.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-300 py-16 text-center">
              <div className="text-5xl mb-3">🎁</div>
              <p className="text-gray-500 font-medium">Chưa có phần thưởng nào</p>
              <p className="text-gray-400 text-sm mt-1">Thêm quà để học sinh có thể đổi sticker</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {displayItems.map(item => (
                <div key={item.id}
                  className={`bg-white rounded-2xl border-2 p-4 flex flex-col items-center gap-2 transition-all relative ${item.is_active ? 'border-indigo-100 shadow-sm' : 'border-gray-100 opacity-50'}`}>
                  {/* Grade badge */}
                  <span className={`absolute top-2 left-2 text-[9px] font-black px-1.5 py-0.5 rounded-md ${item.grade ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'}`}>
                    {item.grade ? `Khóa ${item.grade}` : 'Chung'}
                  </span>
                  <span className="text-4xl mt-2">{item.emoji}</span>
                  <span className="text-sm font-bold text-gray-700 text-center leading-tight">{item.name}</span>
                  <div className="text-[11px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    ⭐ {item.sticker_cost ?? 50}
                  </div>
                  <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {item.is_active ? 'Đang hiện' : 'Đã ẩn'}
                  </div>
                  <div className="flex gap-2 mt-1">
                    <button onClick={() => toggleActive(item)} className="text-gray-400 hover:text-indigo-500 transition" title={item.is_active ? 'Ẩn' : 'Hiện'}>
                      {item.is_active ? <ToggleRight size={18} className="text-green-500" /> : <ToggleLeft size={18} />}
                    </button>
                    <button onClick={() => openEdit(item)}
                      className="text-xs text-indigo-500 hover:text-indigo-700 font-semibold px-2 py-0.5 rounded-lg hover:bg-indigo-50 transition">
                      Sửa
                    </button>
                    <button onClick={() => deleteItem(item.id)} className="text-gray-300 hover:text-red-500 transition">
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
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'pending', label: '⏳ Chờ trao' },
              { key: 'fulfilled', label: '✅ Đã trao' },
              { key: 'cancelled', label: '✕ Từ chối' },
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
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-4 py-3 text-left font-bold text-gray-500 text-xs w-8">#</th>
                      <SortTh label="Học sinh" col="student" sortBy={sortBy} sortAsc={sortAsc} onSort={toggleSort} />
                      <SortTh label="Lớp" col="class" sortBy={sortBy} sortAsc={sortAsc} onSort={toggleSort} />
                      <SortTh label="Phần thưởng" col="reward" sortBy={sortBy} sortAsc={sortAsc} onSort={toggleSort} />
                      <th className="px-4 py-3 text-left font-bold text-gray-500 text-xs">Sticker</th>
                      <SortTh label="Ngày" col="date" sortBy={sortBy} sortAsc={sortAsc} onSort={toggleSort} />
                      {filterStatus === 'pending' && <th className="px-4 py-3 text-center font-bold text-gray-500 text-xs">Hành động</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredReqs.map((req, idx) => (
                      <tr key={req.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="px-4 py-3 text-xs text-gray-300 font-mono">{idx + 1}</td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-gray-800">{req.profiles?.full_name || 'Học sinh'}</span>
                        </td>
                        <td className="px-4 py-3">
                          {req.class_name
                            ? <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">{req.class_name}</span>
                            : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xl leading-none">{req.reward_items?.emoji || '🎁'}</span>
                            <span className="font-semibold text-orange-600">{req.reward_items?.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs font-bold text-amber-600">⭐ {req.sticker_cost}</td>
                        <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                          {new Date(req.created_at).toLocaleDateString('vi-VN')}
                          {req.fulfilled_at && (
                            <div className="text-green-500 mt-0.5">
                              Trao {new Date(req.fulfilled_at).toLocaleDateString('vi-VN')}
                            </div>
                          )}
                        </td>
                        {filterStatus === 'pending' && (
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1.5">
                              <button onClick={() => fulfillRequest(req)} disabled={fulfilling === req.id}
                                className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition disabled:opacity-50">
                                {fulfilling === req.id ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle size={11} />}
                                Đã trao
                              </button>
                              <button onClick={() => cancelRequest(req)} disabled={fulfilling === req.id}
                                className="flex items-center gap-1 bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-500 px-2.5 py-1.5 rounded-lg text-xs font-bold transition">
                                <X size={11} /> Từ chối
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-xs text-gray-400">
                {filteredReqs.length} yêu cầu
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Cài đặt ngưỡng ── */}
      {tab === 'config' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 text-sm text-blue-700">
            <strong>Ngưỡng sticker</strong>: số sticker học sinh cần tích lũy để đổi 1 phần thưởng. Mặc định 50 nếu chưa cài đặt.
          </div>

          {grades.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-300 py-14 text-center">
              <p className="text-gray-400 text-sm">Chưa có khóa học nào. Tạo khóa tại trang <strong>Khối lớp</strong>.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {grades.map(grade => {
                const current = configs[grade] ?? 50
                const editing = editingThreshold[grade] ?? current
                const changed = parseInt(editing) !== current
                return (
                  <div key={grade} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-black text-gray-800">Khóa {grade}</span>
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold">
                          {items.filter(i => i.grade === grade || !i.grade).length} quà áp dụng
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">Ngưỡng hiện tại: <strong>{current} sticker</strong></p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                        <span className="text-sm">⭐</span>
                        <input
                          type="number"
                          min={1}
                          max={9999}
                          value={editing}
                          onChange={e => setEditingThreshold(prev => ({ ...prev, [grade]: e.target.value }))}
                          className="w-16 bg-transparent text-sm font-black text-gray-800 focus:outline-none text-center"
                        />
                        <span className="text-xs text-gray-400">sticker</span>
                      </div>
                      <button
                        onClick={() => saveThreshold(grade)}
                        disabled={!changed || savingConfig === grade}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all
                          ${changed ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200' : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}>
                        {savingConfig === grade ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                        Lưu
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Hiển thị quà theo từng khóa */}
          <div className="mt-6 space-y-3">
            <h3 className="font-bold text-gray-700 text-sm">Quà theo từng khóa</h3>
            <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
              <div className="px-4 py-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-600">Chung (hiện cho tất cả khóa)</span>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  {items.filter(i => !i.grade).length} quà
                </span>
              </div>
              {grades.map(grade => (
                <div key={grade} className="px-4 py-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-600">Khóa {grade}</span>
                  <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                    {items.filter(i => i.grade === grade).length} quà riêng
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Form thêm/sửa quà ── */}
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
              {/* Khóa học */}
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1.5 block">Áp dụng cho khóa</label>
                <select
                  value={formGrade}
                  onChange={e => setFormGrade(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white">
                  <option value="">Tất cả khóa (chung)</option>
                  {grades.map(g => <option key={g} value={g}>Khóa {g}</option>)}
                </select>
              </div>

              {/* Emoji */}
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

              {/* Số sticker */}
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1.5 block">Số sticker cần để đổi</label>
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
                  <span className="text-base">⭐</span>
                  <input
                    type="number" min={1} max={9999}
                    value={formCost}
                    onChange={e => setFormCost(e.target.value)}
                    className="flex-1 bg-transparent text-sm font-black text-amber-700 focus:outline-none"
                    placeholder="VD: 50"
                  />
                  <span className="text-xs text-amber-600 font-semibold">sticker</span>
                </div>
              </div>

              {/* Preview */}
              <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
                <span className="text-3xl">{formEmoji}</span>
                <div>
                  <div className="font-bold text-gray-700 text-sm">{formName || 'Tên phần thưởng'}</div>
                  <div className="text-[11px] font-bold text-amber-600 mt-0.5">⭐ {formCost || 50} sticker</div>
                  <div className={`text-[10px] font-semibold mt-0.5 ${formGrade ? 'text-orange-600' : 'text-gray-400'}`}>
                    {formGrade ? `Chỉ khóa ${formGrade}` : 'Áp dụng tất cả khóa'}
                  </div>
                </div>
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
