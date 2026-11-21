// Trang Phần thưởng của giáo viên: quà (thêm / sửa / bật tắt / xoá), yêu cầu đổi quà (trao / từ chối + hoàn sticker),
// ngưỡng sticker theo khoá. Đọc ghi qua data/phanThuong.js; lọc / xếp ở domain/phanThuong.js.
import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { layTenCacHs } from '../data/hoSo'
import { layLopCuaCacHs } from '../data/ghiDanh'
import { layQua, themQua, suaQua, xoaQua, layYeuCauDoiQua, xuLyYeuCau, layNguongCacKhoa, luuNguong } from '../data/phanThuong'
import { adjustStickerCount } from '../utils/stickerAward'
import { GIA_QUA_MAC_DINH } from '../domain/sticker'
import { ganTenYeuCau, locVaXepYeuCau, quaTheoKhoa } from '../domain/phanThuong'

/** quà + yêu cầu (đã gắn tên / lớp em) + ngưỡng theo khoá */
async function taiTatCa() {
  const [{ data: qua }, { data: yc }, { data: nguong }] = await Promise.all([layQua(), layYeuCauDoiQua(), layNguongCacKhoa()])
  const ids = [...new Set((yc || []).map(r => r.student_id))]
  let tenCua = {}, lopCua = {}
  if (ids.length) {
    const [{ data: ten }, { data: lop }] = await Promise.all([layTenCacHs(ids), layLopCuaCacHs(ids)])
    tenCua = Object.fromEntries((ten || []).map(p => [p.id, p.full_name]))
    lopCua = Object.fromEntries((lop || []).map(e => [e.user_id, e.class_name]))
  }
  return { qua: qua || [], yeuCau: ganTenYeuCau(yc || [], tenCua, lopCua), nguong }
}

export function usePhanThuong() {
  const [tab, setTab] = useState('items')
  const [items, setItems] = useState([])
  const [requests, setRequests] = useState([])
  const [configs, setConfigs] = useState({})   // { grade: sticker_threshold }
  const [loading, setLoading] = useState(true)
  const [gradeFilter, setGradeFilter] = useState('__all__')

  // form thêm / sửa quà
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [formName, setFormName] = useState('')
  const [formEmoji, setFormEmoji] = useState('🎁')
  const [formGrade, setFormGrade] = useState('')   // '' = mọi khoá
  const [formCost, setFormCost] = useState(GIA_QUA_MAC_DINH)
  const [saving, setSaving] = useState(false)

  // yêu cầu đổi quà
  const [fulfilling, setFulfilling] = useState(null)
  const [filterStatus, setFilterStatus] = useState('pending')
  const [sortBy, setSortBy] = useState('date')
  const [sortAsc, setSortAsc] = useState(false)

  // ngưỡng đang sửa
  const [editingThreshold, setEditingThreshold] = useState({})
  const [savingConfig, setSavingConfig] = useState(null)

  const apDung = useCallback(({ qua, yeuCau, nguong }) => {
    setItems(qua); setRequests(yeuCau); setConfigs(nguong); setEditingThreshold(nguong); setLoading(false)
  }, [])
  useEffect(() => { taiTatCa().then(apDung) }, [apDung])
  async function loadAll() { setLoading(true); apDung(await taiTatCa()) }

  async function saveThreshold(grade) {
    const val = parseInt(editingThreshold[grade])
    if (!val || val < 1) { toast.error('Nhập số sticker hợp lệ'); return }
    setSavingConfig(grade)
    const { error } = await luuNguong(grade, val)
    if (error) toast.error(error.message)
    else { setConfigs(prev => ({ ...prev, [grade]: val })); toast.success(`Đã lưu ngưỡng cho khóa ${grade}`) }
    setSavingConfig(null)
  }

  function openAdd() {
    setEditItem(null); setFormName(''); setFormEmoji('🎁'); setFormGrade(''); setFormCost(GIA_QUA_MAC_DINH); setShowForm(true)
  }
  function openEdit(item) {
    setEditItem(item); setFormName(item.name); setFormEmoji(item.emoji || '🎁')
    setFormGrade(item.grade || ''); setFormCost(item.sticker_cost ?? GIA_QUA_MAC_DINH); setShowForm(true)
  }

  async function saveItem() {
    if (!formName.trim()) { toast.error('Nhập tên phần thưởng'); return }
    const cost = parseInt(formCost)
    if (!cost || cost < 1) { toast.error('Nhập số sticker hợp lệ'); return }
    setSaving(true)
    const payload = { name: formName.trim(), emoji: formEmoji, is_active: true, grade: formGrade || null, sticker_cost: cost }
    const { error } = editItem ? await suaQua(editItem.id, payload) : await themQua(payload)
    if (error) toast.error(error.message)
    else { toast.success(editItem ? 'Đã cập nhật' : 'Đã thêm phần thưởng'); loadAll() }
    setSaving(false)
    setShowForm(false)
  }

  async function deleteItem(id) {
    if (!confirm('Xóa phần thưởng này?')) return
    const { error } = await xoaQua(id)
    if (error) toast.error(error.message)
    else { toast.success('Đã xóa'); setItems(prev => prev.filter(i => i.id !== id)) }
  }

  async function toggleActive(item) {
    const { error } = await suaQua(item.id, { is_active: !item.is_active })
    if (error) toast.error(error.message)
    else setItems(prev => prev.map(i => (i.id === item.id ? { ...i, is_active: !i.is_active } : i)))
  }

  async function fulfillRequest(req) {
    setFulfilling(req.id)
    const { doi, error } = await xuLyYeuCau(req.id, 'fulfilled')
    if (error) toast.error(error.message)
    else if (!doi) { toast('Yêu cầu này đã được xử lý trước đó'); loadAll() }
    else {
      toast.success(`Đã trao quà cho ${req.profiles?.full_name}!`)
      setRequests(prev => prev.map(r => (r.id === req.id ? { ...r, status: 'fulfilled', fulfilled_at: new Date().toISOString() } : r)))
    }
    setFulfilling(null)
  }

  /** từ chối: đổi trạng thái TRƯỚC (chỉ khi còn chờ) rồi mới hoàn sticker → bấm 2 lần / 2 tab không hoàn 2 lần */
  async function cancelRequest(req) {
    if (!confirm('Từ chối yêu cầu này? Sticker sẽ được hoàn lại cho học sinh.')) return
    const { doi, error } = await xuLyYeuCau(req.id, 'cancelled')
    if (error) { toast.error(error.message); return }
    if (!doi) { toast('Yêu cầu này đã được xử lý trước đó'); loadAll(); return }
    const { error: loiHoan } = await adjustStickerCount(req.student_id, req.sticker_cost)
    if (loiHoan) toast.error(`Đã từ chối nhưng CHƯA hoàn được ${req.sticker_cost} sticker cho ${req.profiles?.full_name}: ${loiHoan.message}`)
    else toast.success('Đã từ chối và hoàn sticker')
    setRequests(prev => prev.map(r => (r.id === req.id ? { ...r, status: 'cancelled' } : r)))
  }

  function toggleSort(col) {
    if (sortBy === col) setSortAsc(a => !a)
    else { setSortBy(col); setSortAsc(true) }
  }

  return {
    tab, setTab, items, requests, configs, loading, gradeFilter, setGradeFilter,
    showForm, setShowForm, editItem, formName, setFormName, formEmoji, setFormEmoji, formGrade, setFormGrade, formCost, setFormCost, saving,
    fulfilling, filterStatus, setFilterStatus, sortBy, sortAsc, editingThreshold, setEditingThreshold, savingConfig,
    saveThreshold, openAdd, openEdit, saveItem, deleteItem, toggleActive, fulfillRequest, cancelRequest, toggleSort,
    pendingCount: requests.filter(r => r.status === 'pending').length,
    filteredReqs: locVaXepYeuCau(requests, { trangThai: filterStatus, theo: sortBy, tangDan: sortAsc }),
    displayItems: quaTheoKhoa(items, gradeFilter),
  }
}
