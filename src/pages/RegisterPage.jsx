import { Link } from 'react-router-dom'
import { BookOpen, Lock } from 'lucide-react'

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md text-center">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-gray-100 text-gray-400 rounded-full p-3 mb-3">
            <Lock size={32} />
          </div>
          <h1 className="text-xl font-bold text-gray-700">Đăng ký đã tạm đóng</h1>
          <p className="text-gray-400 text-sm mt-2">
            Tính năng tự tạo tài khoản hiện không khả dụng.
            <br />
            Liên hệ giáo viên để được cấp tài khoản.
          </p>
        </div>
        <Link
          to="/login"
          className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-lg transition text-sm"
        >
          Quay lại đăng nhập
        </Link>
      </div>
    </div>
  )
}
