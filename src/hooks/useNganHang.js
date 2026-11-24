// Tải ngân hàng bài 1 lần (cột nhẹ, không kèm đề) rồi lọc tại chỗ. khoa = các khoá được mở, so_ky_thi = số kỳ thi đang liên kết bài.
import { useEffect, useState, useCallback } from 'react'
import { layNganHang } from '../data/nganHang'

const chuanHoa = data => (data || []).map(({ bai_luyen_mo, exam_bai, ...b }) => ({
  ...b, khoa: (bai_luyen_mo || []).map(m => m.grade), so_ky_thi: new Set((exam_bai || []).map(e => e.exam_id)).size,
}))

/** tải ngân hàng bài của 1 ứng dụng → { ds (null khi đang tải), taiLai } */
export function useNganHang(ungDung = 'python') {
  const [ds, setDs] = useState(null)   // null = đang tải
  const taiLai = useCallback(() => layNganHang(ungDung).then(({ data }) => setDs(chuanHoa(data))), [ungDung])
  useEffect(() => {
    let huy = false
    layNganHang(ungDung).then(({ data }) => { if (!huy) setDs(chuanHoa(data)) })
    return () => { huy = true }
  }, [ungDung])
  return { ds, taiLai }
}
