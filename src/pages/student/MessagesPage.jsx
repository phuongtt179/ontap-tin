import { MessageCircle } from 'lucide-react'

// Tạm khoá tính năng "Hỏi giáo viên" (2026-08 — giảm tải Supabase đang bị quá tải tài nguyên).
// Bản chat đầy đủ (Realtime + polling) đã bỏ tạm thời, xem lịch sử git để khôi phục.
export default function MessagesPage() {
  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-gradient-to-r from-[#003d8f] via-[#0055bb] to-[#0077dd] text-white px-5 py-4 shrink-0">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <MessageCircle size={20} />
          </div>
          <div>
            <h1 className="font-black text-base">Hỏi giáo viên</h1>
            <p className="text-blue-200 text-xs">Tính năng đang tạm ngưng</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
        <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
          <MessageCircle size={36} className="text-indigo-400" />
        </div>
        <p className="text-gray-600 font-semibold">Tính năng "Hỏi giáo viên" đang tạm ngưng</p>
        <p className="text-gray-400 text-sm mt-1 max-w-xs">
          Em vui lòng hỏi trực tiếp thầy/cô trên lớp trong thời gian này nhé!
        </p>
      </div>
    </div>
  )
}
