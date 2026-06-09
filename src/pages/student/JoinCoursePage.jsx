import { BookOpen } from 'lucide-react'

export default function JoinCoursePage() {
  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Khoá học</h1>
      </div>
      <div className="max-w-md bg-blue-50 border border-blue-200 rounded-2xl p-8 text-center">
        <BookOpen size={40} className="mx-auto mb-4 text-blue-400" />
        <p className="font-semibold text-blue-800 mb-2">Đăng ký do giáo viên quản lý</p>
        <p className="text-sm text-blue-600">
          Liên hệ giáo viên để được thêm vào khoá học.
          <br />
          Sau khi được thêm, khoá học sẽ hiển thị tại đây.
        </p>
      </div>
    </div>
  )
}
