import { createContext, useContext, useState } from 'react'

// Cho phép 1 trang (hiện chỉ LearnPage) "gửi" số liệu streak/sticker/tiến độ
// lên hiển thị ngay trong thanh điều hướng dùng chung (Layout.jsx) — để gộp
// chung 1 dòng thay vì 2 thanh xếp chồng (topbar + hero riêng của trang).
// Trang khác không gọi setStats() thì Layout không hiện gì thêm, không ảnh hưởng.
const HeaderStatsContext = createContext(null)

export function HeaderStatsProvider({ children }) {
  const [stats, setStats] = useState(null)
  return (
    <HeaderStatsContext.Provider value={{ stats, setStats }}>
      {children}
    </HeaderStatsContext.Provider>
  )
}

export function useHeaderStats() {
  const ctx = useContext(HeaderStatsContext)
  if (!ctx) throw new Error('useHeaderStats phải dùng bên trong HeaderStatsProvider')
  return ctx
}
