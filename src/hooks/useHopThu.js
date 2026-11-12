// Hộp thư giáo viên: tải cuộc trò chuyện, mở 1 em (đánh dấu đã đọc, tải log AI), hỏi tin mới mỗi 15 giây khi tab mở,
// trả lời, xoá tin, nhắn em mới, nhắn cả lớp. Đọc ghi qua data/tinNhan.js; gom / lọc ở domain/hoiThoai.js.
// (Không dùng Supabase Realtime — nó làm máy chủ gói miễn phí quá tải.)
import { useState, useEffect, useRef, useCallback } from 'react'
import { layHocSinhDaDuyet, layTenCacHs } from '../data/hoSo'
import { layGhiDanh, layLopCuaCacHs } from '../data/ghiDanh'
import { layHopThu, layTinMoi, layNhatKyAi, danhDauDaDoc, guiTinGiaoVien, guiTinNhieuEm, xoaTin } from '../data/tinNhan'
import { gomHoiThoai, themTinMoi, boTin, locHoiThoai } from '../domain/hoiThoai'

/** tên + lớp của các em → { id: { id, full_name, class_name } } */
async function layHocSinhCuaTin(ids) {
  if (!ids.length) return {}
  const [{ data: ten }, { data: lop }] = await Promise.all([layTenCacHs(ids), layLopCuaCacHs(ids)])
  const lopCua = Object.fromEntries((lop || []).map(e => [e.user_id, e.class_name]))
  return Object.fromEntries((ten || []).map(p => [p.id, { ...p, class_name: lopCua[p.id] || '' }]))
}

/** mọi cuộc trò chuyện, đã gom + gắn tên / lớp */
async function taiHoiThoai() {
  const { tinGiaoVien, mocAi } = await layHopThu()
  const ids = [...new Set([...tinGiaoVien, ...mocAi].map(m => m.student_id))]
  return gomHoiThoai(tinGiaoVien, mocAi, await layHocSinhCuaTin(ids))
}

export function useHopThu() {
  const [threads, setThreads] = useState([])
  const [selected, setSelected] = useState(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [search, setSearch] = useState('')
  const [showAiLog, setShowAiLog] = useState(false)
  const [filterClass, setFilterClass] = useState('')
  const [filterUnread, setFilterUnread] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  // nhắn cả lớp
  const [showGroup, setShowGroup] = useState(false)
  const [classes, setClasses] = useState([])
  const [groupClass, setGroupClass] = useState('')
  const [groupInput, setGroupInput] = useState('')
  const [groupSending, setGroupSending] = useState(false)

  // nhắn em mới (chưa có cuộc trò chuyện)
  const [showNew, setShowNew] = useState(false)
  const [allStudents, setAllStudents] = useState([])
  const [newSearch, setNewSearch] = useState('')

  const apDung = useCallback(ds => { setThreads(ds); setLoading(false) }, [])
  useEffect(() => { taiHoiThoai().then(apDung) }, [apDung])
  async function loadAll() {
    setLoading(true)
    apDung(await taiHoiThoai())
  }

  // đang mở 1 em → hỏi tin mới mỗi 15 giây (chỉ khi tab hiện), tính từ tin cuối đã có
  const selectedId = selected?.student?.id
  const lastCreatedAtRef = useRef(null)
  useEffect(() => {
    if (!selectedId) return
    const msgs = selected.messages
    lastCreatedAtRef.current = msgs.length ? msgs[msgs.length - 1].created_at : new Date().toISOString()
    const interval = setInterval(async () => {
      if (document.hidden || !lastCreatedAtRef.current) return
      const { data } = await layTinMoi(selectedId, lastCreatedAtRef.current)
      if (!data?.length) return
      setSelected(prev => (prev ? themTinMoi(prev, data) : prev))
      setThreads(prev => prev.map(t => (t.student.id === selectedId ? themTinMoi(t, data) : t)))
      lastCreatedAtRef.current = data[data.length - 1].created_at
    }, 15000)
    return () => clearInterval(interval)
  }, [selectedId])   // eslint-disable-line react-hooks/exhaustive-deps -- chỉ đặt lại khi đổi em, không khi có tin mới

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selected?.messages])

  useEffect(() => {
    layGhiDanh({ daDuyet: null }).then(({ data }) => {
      const cls = [...new Set((data || []).map(e => e.class_name).filter(Boolean))].sort()
      setClasses(cls)
      if (cls.length) setGroupClass(cls[0])
    })
  }, [])

  useEffect(() => {
    if (!showNew || allStudents.length) return
    Promise.all([layHocSinhDaDuyet(), layGhiDanh()]).then(([{ data: hs }, { data: ghiDanh }]) => {
      const lopCua = Object.fromEntries((ghiDanh || []).map(e => [e.user_id, e.class_name]))
      setAllStudents((hs || []).map(p => ({ ...p, class_name: lopCua[p.id] || '' }))
        .sort((a, b) => (a.class_name || '').localeCompare(b.class_name || '') || a.full_name.localeCompare(b.full_name)))
    })
  }, [showNew, allStudents.length])

  async function openThread(thread) {
    setSelected(thread)
    setInput('')
    setShowAiLog(false)
    // log hỏi đáp AI của riêng em này (danh sách chỉ có mốc giờ)
    if (thread.aiMessages?.some(m => m._moc)) {
      const { data: aiLog } = await layNhatKyAi(thread.student.id)
      const capNhat = t => (t.student.id === thread.student.id ? { ...t, aiMessages: aiLog || [] } : t)
      setSelected(prev => (prev ? capNhat(prev) : prev))
      setThreads(prev => prev.map(capNhat))
    }
    await danhDauDaDoc(thread.student.id)
    setThreads(prev => prev.map(t => (t.student.id === thread.student.id ? { ...t, unread: 0 } : t)))
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'auto' }), 50)
  }

  function openNewThread(student) {
    setShowNew(false)
    setNewSearch('')
    const daCo = threads.find(t => t.student.id === student.id)
    if (daCo) { openThread(daCo); return }
    setSelected({ student, messages: [], unread: 0, lastMsg: null })   // cuộc trò chuyện tạm (chưa có tin)
    setInput('')
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  async function sendReply() {
    const text = input.trim()
    if (!text || sending || !selected) return
    setSending(true)
    setInput('')
    const { data } = await guiTinGiaoVien(selected.student.id, text)
    if (data) {
      setSelected(prev => (prev ? { ...prev, messages: [...prev.messages, data] } : prev))
      setThreads(prev => prev.map(t => (t.student.id === selected.student.id ? { ...t, messages: [...t.messages, data], lastMsg: data } : t)))
    }
    setSending(false)
    inputRef.current?.focus()
  }

  async function deleteMessage(msgId) {
    if (!window.confirm('Xóa tin nhắn này?')) return
    await xoaTin(msgId)
    setSelected(prev => (prev ? boTin(prev, msgId) : prev))
    setThreads(prev => prev.map(t => boTin(t, msgId)))
  }

  async function sendGroupMessage() {
    const text = groupInput.trim()
    if (!text || !groupClass || groupSending) return
    setGroupSending(true)
    const { data: ghiDanh } = await layGhiDanh({ lop: groupClass })
    if (!ghiDanh?.length) { setGroupSending(false); return }
    await guiTinNhieuEm(ghiDanh.map(e => e.user_id), `📢 [Lớp ${groupClass}] ${text}`)
    setGroupInput('')
    setGroupSending(false)
    setShowGroup(false)
    loadAll()
  }

  const filteredThreads = locHoiThoai(threads, { tim: search, lop: filterClass, chuaDoc: filterUnread })
  const totalUnread = threads.reduce((s, t) => s + t.unread, 0)

  return {
    threads, selected, setSelected, input, setInput, loading, sending, search, setSearch, showAiLog, setShowAiLog,
    filterClass, setFilterClass, filterUnread, setFilterUnread, bottomRef, inputRef,
    showGroup, setShowGroup, classes, groupClass, setGroupClass, groupInput, setGroupInput, groupSending,
    showNew, setShowNew, allStudents, newSearch, setNewSearch,
    openThread, openNewThread, sendReply, deleteMessage, sendGroupMessage, filteredThreads, totalUnread,
  }
}
