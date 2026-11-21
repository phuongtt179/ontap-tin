// Các thẻ tổng kết: hoàn thành / xem video / đạt câu hỏi / nộp thực hành (mục bài không có → ẩn).
import { PlayCircle, BookOpen, Upload } from 'lucide-react'

// tên lớp Tailwind viết đủ (không ghép chuỗi) để Tailwind nhận ra khi đóng gói
const MAU = {
  indigo: ['bg-indigo-50 border-indigo-200', 'text-indigo-700', 'text-indigo-500'],
  blue: ['bg-blue-50 border-blue-200', 'text-blue-700', 'text-blue-500'],
  green: ['bg-green-50 border-green-200', 'text-green-700', 'text-green-500'],
  orange: ['bg-orange-50 border-orange-200', 'text-orange-700', 'text-orange-500'],
}

function The({ mau, so, tong, children }) {
  const [nen, so_, nhan] = MAU[mau]
  return (
    <div className={`${nen} border rounded-xl p-3 text-center`}>
      <div className={`text-2xl font-bold ${so_}`}>{so}/{tong}</div>
      <div className={`text-xs ${nhan} mt-0.5 flex items-center justify-center gap-1`}>{children}</div>
    </div>
  )
}

export default function TheTongKet({ tk }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <The mau="indigo" so={tk.hoanThanh} tong={tk.tong}>Hoàn thành</The>
      {tk.video != null && <The mau="blue" so={tk.video} tong={tk.tong}><PlayCircle size={10} />Xem video</The>}
      {tk.quiz != null && <The mau="green" so={tk.quiz} tong={tk.tong}><BookOpen size={10} />Đạt bài tập</The>}
      {tk.thucHanh != null && <The mau="orange" so={tk.thucHanh} tong={tk.tong}><Upload size={10} />Nộp thực hành</The>}
    </div>
  )
}
