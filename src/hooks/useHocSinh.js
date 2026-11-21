// Dữ liệu + thao tác trang Học sinh: tải mọi học sinh kèm ghi danh 1 lần (lọc khoá / lớp làm tại chỗ, không tải lại),
// duyệt / từ chối đăng ký, xoá tài khoản. Lưu / xoá xong thì tải ngầm, giữ nguyên danh sách đang xem.
import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { capNhatHoSo, layTatCaHocSinh } from '../data/hoSo'
import { layGhiDanhDayDuCuaCacHs, duyetGhiDanhCuaHs, tuChoiGhiDanhCuaHs } from '../data/ghiDanh'
import { layCacLop } from '../data/khoaHoc'
import { xoaTaiKhoan } from '../data/taiKhoan'
import { ghepGhiDanh } from '../domain/hocSinh'

/** mọi học sinh + ghi danh, đã ghép */
async function taiDanhSach() {
  const { data: hoSo, error } = await layTatCaHocSinh()
  if (error) return { loi: error }
  const ids = (hoSo || []).map(s => s.id)
  const { data: ghiDanh } = ids.length ? await layGhiDanhDayDuCuaCacHs(ids) : { data: [] }
  return { ds: ghepGhiDanh(hoSo, ghiDanh) }
}

export function useHocSinh() {
  const [hocSinh, setHocSinh] = useState([])
  const [cacLop, setCacLop] = useState([])
  const [loading, setLoading] = useState(true)
  const [dangDuyet, setDangDuyet] = useState(null)   // id em đang duyệt

  const apDung = useCallback(({ ds, loi }) => {
    if (loi) toast.error('Lỗi tải danh sách học sinh: ' + loi.message)
    else setHocSinh(ds)
    setLoading(false)
  }, [])
  const taiLai = useCallback(() => taiDanhSach().then(apDung), [apDung])

  useEffect(() => {
    let huy = false
    taiDanhSach().then(kq => { if (!huy) apDung(kq) })
    layCacLop().then(({ data }) => { if (!huy) setCacLop(data || []) })
    return () => { huy = true }
  }, [apDung])

  /** duyệt tài khoản + mọi ghi danh đang chờ */
  async function duyet(hs) {
    setDangDuyet(hs.id)
    const kq = await Promise.all([duyetGhiDanhCuaHs(hs.id), capNhatHoSo(hs.id, { is_approved: true })])
    setDangDuyet(null)
    const loi = kq.find(r => r.error)?.error
    if (loi) { toast.error('Duyệt thất bại: ' + loi.message); return }
    toast.success(`Đã duyệt ${hs.full_name}`)
    taiLai()
  }

  async function tuChoi(hs) {
    if (!confirm(`Từ chối đăng ký của "${hs.full_name}"?\nHọc sinh sẽ không bị xóa tài khoản.`)) return
    const { error } = await tuChoiGhiDanhCuaHs(hs.id)
    if (error) toast.error('Từ chối thất bại: ' + error.message)
    else { toast.success(`Đã từ chối đăng ký của ${hs.full_name}`); taiLai() }
  }

  async function xoa(hs) {
    if (!confirm(`Xóa tài khoản học sinh "${hs.full_name}"? Hành động này không thể hoàn tác.`)) return
    try {
      await xoaTaiKhoan(hs.id)
      toast.success('Đã xóa học sinh')
      taiLai()
    } catch (err) { toast.error('Xóa thất bại: ' + err.message) }
  }

  /** xoá nhiều em; trả true nếu đã xoá (người dùng xác nhận) */
  async function xoaNhieu(ds, khoa) {
    if (!ds.length) return false
    if (!confirm(khoa ? `Xóa ${ds.length} học sinh đã chọn trong khoá "${khoa}"?` : `Xóa ${ds.length} học sinh đã chọn?`)) return false
    let ok = 0, hong = 0
    for (const hs of ds) {
      try { await xoaTaiKhoan(hs.id); ok++ } catch { hong++ }
    }
    if (ok) toast.success(`Đã xóa ${ok} học sinh`)
    if (hong) toast.error(`${hong} tài khoản xóa thất bại`)
    taiLai()
    return true
  }

  return { hocSinh, cacLop, loading, dangDuyet, taiLai, duyet, tuChoi, xoa, xoaNhieu }
}
