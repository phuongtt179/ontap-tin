import { useEffect, useState } from 'react'

// Tab mở lâu ngày vẫn chạy code cũ (vd hôm 29/10: bản giảm tải đã lên nhưng tab cũ vẫn hỏi máy chủ kiểu cũ).
// Cứ 10 phút (chỉ khi tab đang hiện) và mỗi lần quay lại tab, hỏi /version.json — khác bản đang chạy thì
// hiện thanh mời tải lại. KHÔNG tự tải lại để không mất bài em đang làm dở.
const BAN_HIEN_TAI = typeof __BUILD_ID__ !== 'undefined' ? __BUILD_ID__ : 'dev'

export default function BanMoi() {
  const [coBanMoi, setCoBanMoi] = useState(false)

  useEffect(() => {
    if (import.meta.env.DEV) return
    let lanCuoi = 0
    async function kiemTra() {
      if (document.hidden || Date.now() - lanCuoi < 60000) return
      lanCuoi = Date.now()
      try {
        const r = await fetch('/version.json', { cache: 'no-store' })
        const { id } = await r.json()
        if (id && id !== BAN_HIEN_TAI) setCoBanMoi(true)
      } catch { /* mạng lỗi — lần sau thử lại */ }
    }
    // File code cũ đã bị xoá sau khi có bản mới → trang không tải tiếp được → cũng mời tải lại
    const loiTaiCode = e => { e.preventDefault?.(); setCoBanMoi(true) }
    const t = setInterval(kiemTra, 10 * 60000)
    document.addEventListener('visibilitychange', kiemTra)
    window.addEventListener('vite:preloadError', loiTaiCode)
    return () => {
      clearInterval(t)
      document.removeEventListener('visibilitychange', kiemTra)
      window.removeEventListener('vite:preloadError', loiTaiCode)
    }
  }, [])

  if (!coBanMoi) return null
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 bg-indigo-700 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg max-w-[calc(100vw-2rem)]">
      <span>🔄 Trang vừa có bản mới. Em lưu bài đang làm rồi bấm tải lại nhé!</span>
      <button onClick={() => window.location.reload()} className="shrink-0 bg-white text-indigo-700 font-bold px-3 py-1 rounded-lg">Tải lại</button>
    </div>
  )
}
