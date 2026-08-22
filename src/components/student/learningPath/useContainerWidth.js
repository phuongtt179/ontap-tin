import { useState, useLayoutEffect, useCallback, useRef } from 'react'

// Đo bề rộng/chiều cao 1 phần tử bằng ResizeObserver.
//
// Dùng CALLBACK REF (setEl khi node gắn/gỡ) thay vì useRef thường: trang này
// hiện "đang tải..." lúc mới mount (div path chưa có trong DOM), nên nếu dùng
// useLayoutEffect thường (chạy đúng 1 lần lúc mount) thì lúc đó ref.current
// vẫn null → ResizeObserver không bao giờ được gắn, kể cả sau khi div thật
// xuất hiện (effect không tự chạy lại vì dependency không đổi). Callback ref
// tự kích hoạt lại effect (qua state `el`) đúng lúc DOM node thật sự gắn vào.
//
// Chống vòng lặp "ResizeObserver loop completed with undelivered notifications":
//   1. Bỏ qua nếu kích thước không đổi so với giá trị cũ.
//   2. Gộp cập nhật bằng requestAnimationFrame.
//   3. Gọi hook này trên KHUNG CUỘN NGOÀI (ổn định), không phải div path bên
//      trong (bị chính thanh cuộn xuất hiện/biến mất làm đổi kích thước).
function useContainerSize(dimension) {
  const [el, setEl] = useState(null)
  const [size, setSize] = useState(0)
  const prevSizeRef = useRef(-1)
  const rafRef = useRef(null)
  const key = dimension === 'height' ? 'clientHeight' : 'clientWidth'

  const measure = useCallback(node => {
    if (!node) return
    const s = node[key]
    if (s === prevSizeRef.current) return
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      prevSizeRef.current = s
      setSize(s)
    })
  }, [key])

  useLayoutEffect(() => {
    if (!el) return
    measure(el)
    const observer = new ResizeObserver(() => measure(el))
    observer.observe(el)
    return () => {
      observer.disconnect()
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [el, measure])

  return [setEl, size]
}

export function useContainerWidth() {
  return useContainerSize('width')
}

export function useContainerHeight() {
  return useContainerSize('height')
}
