// Dữ liệu trang chấm bài thực hành: bài học, học sinh cả khoá, tiến độ + bài nộp từng em.
// Tự làm mới khi tab đang mở: mỗi 2 phút hỏi nhẹ vài cột (dấu vết), chỉ khi có thay đổi mới tải đầy đủ.
// (Trước đây dùng Supabase Realtime — bỏ vì dò thay đổi liên tục làm máy chủ gói miễn phí quá tải.)
import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { layBaiHocTheoId } from '../data/baiHoc'
import { layHocSinhKemHoSo } from '../data/ghiDanh'
import { layBaiNopCuaLop, layDauVetBaiNop } from '../data/baiNop'
import { layTienDoCuaLop, layDauVetTienDo } from '../data/tienDo'
import { gomTheoHocSinh } from '../domain/chamBai'

export function useTienDoLop(lessonId) {
  const navigate = useNavigate()
  const [lesson, setLesson] = useState(null)
  const [students, setStudents] = useState([])
  const [progressMap, setProgressMap] = useState({})     // userId -> lesson_progress
  const [submissionMap, setSubmissionMap] = useState({}) // userId -> [lesson_submission]
  const [lastRefresh, setLastRefresh] = useState(null)
  const [loading, setLoading] = useState(true)
  const idsRef = useRef([])

  const taiTienDoVaBaiNop = useCallback(async userIds => {
    const [{ data: td }, { data: bn }] = await Promise.all([
      layTienDoCuaLop(lessonId, userIds),
      layBaiNopCuaLop(lessonId, userIds),
    ])
    return { td, bn }
  }, [lessonId])

  useEffect(() => {
    let huy = false
    async function tai() {
      setLoading(true)
      const { data: bai } = await layBaiHocTheoId(lessonId)
      if (huy) return
      if (!bai) { toast.error('Không tìm thấy bài học'); navigate(-1); return }
      setLesson(bai)
      const { data: ghiDanh } = await layHocSinhKemHoSo({ grade: bai.grade })
      const hs = (ghiDanh || []).map(e => ({
        id: e.profiles?.id || e.user_id,
        full_name: e.profiles?.full_name || '',
        class_name: e.class_name,
        grade: e.grade,
      })).sort((a, b) => (a.class_name || '').localeCompare(b.class_name || '') || a.full_name.localeCompare(b.full_name))
      idsRef.current = hs.map(s => s.id)
      if (hs.length) {
        const { td, bn } = await taiTienDoVaBaiNop(idsRef.current)
        if (huy) return
        setProgressMap(gomTheoHocSinh(td))
        setSubmissionMap(gomTheoHocSinh(bn, true))
      }
      setStudents(hs)
      setLoading(false)
    }
    tai()
    return () => { huy = true }
  }, [lessonId, taiTienDoVaBaiNop, navigate])

  useEffect(() => {
    let dauVet = null
    async function kiemTra() {
      if (document.hidden || !idsRef.current.length) return
      const ids = idsRef.current
      const [{ data: p }, { data: s }] = await Promise.all([layDauVetTienDo(lessonId, ids), layDauVetBaiNop(lessonId, ids)])
      if (!p || !s) return
      const moi = JSON.stringify([p.map(x => x.id + x.updated_at).sort(), s.map(x => Object.values(x).join('|')).sort()])
      if (moi === dauVet) return
      dauVet = moi
      // lần đầu cũng tải 1 lần để không lỡ thay đổi từ lúc mở trang
      const { td, bn } = await taiTienDoVaBaiNop(ids)
      if (!td || !bn) return   // lỗi mạng — giữ dữ liệu cũ, lần sau thử lại
      setProgressMap(gomTheoHocSinh(td))
      setSubmissionMap(prev => {
        const cu = new Set(Object.values(prev).flat().map(x => x.id))
        if (bn.some(x => !cu.has(x.id))) toast.success('Có học sinh vừa nộp bài!', { icon: '📩' })
        return gomTheoHocSinh(bn, true)
      })
      setLastRefresh(new Date())
    }
    const timer = setInterval(kiemTra, 120000)
    const onVisible = () => { if (!document.hidden) kiemTra() }
    document.addEventListener('visibilitychange', onVisible)
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', onVisible) }
  }, [lessonId, taiTienDoVaBaiNop])

  /** sau khi lưu: sửa đúng bài đó trong danh sách, không tải lại cả lớp */
  const suaBaiTaiCho = useCallback((userId, subId, thayDoi) => {
    setSubmissionMap(prev => ({ ...prev, [userId]: (prev[userId] || []).map(s => s.id === subId ? { ...s, ...thayDoi } : s) }))
  }, [])

  const classes = [...new Set(students.map(s => s.class_name).filter(Boolean))].sort()

  return { lesson, students, classes, progressMap, submissionMap, lastRefresh, loading, suaBaiTaiCho }
}
