// Một dòng bài học ở trang Bài học (giáo viên): tên, trạng thái, nội dung có gì + các nút thao tác.
import { useNavigate } from 'react-router-dom'
import {
  Pencil, Trash2, FileText, Presentation, MonitorPlay, ToggleLeft, ToggleRight, PlayCircle, ClipboardList, Eye, Users,
} from 'lucide-react'

export default function DongBaiHoc({ lesson, stt, canDelete, onDoiXuatBan, onNguoiXem, onXemTruoc, onSua, onXoa }) {
  const navigate = useNavigate()
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-4 py-3.5 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-400 font-mono shrink-0">{stt}.</span>
          <span className="font-medium text-gray-800 text-sm">{lesson.title}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${lesson.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {lesson.is_published ? 'Đã xuất bản' : 'Nháp'}
          </span>
          {lesson.restricted_audience && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700">
              Giới hạn người xem
            </span>
          )}
        </div>
        <div className="flex gap-3 mt-1 text-xs text-gray-400 flex-wrap items-center">
          <span>{lesson.question_ids?.length || 0} câu hỏi</span>
          {lesson.video_url && (
            <span className="flex items-center gap-0.5 text-blue-500"><PlayCircle size={11} /> Video</span>
          )}
          {lesson.pptx_url && (
            <span className="flex items-center gap-0.5 text-orange-500"><FileText size={11} /> PPTX</span>
          )}
          {lesson.has_practice && (
            <span className="flex items-center gap-0.5 text-orange-500"><ClipboardList size={11} /> Thực hành</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={onDoiXuatBan}
          title={lesson.is_published ? 'Ẩn bài học' : 'Xuất bản'}
          className={`p-1.5 rounded-lg transition ${lesson.is_published ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
        >
          {lesson.is_published ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
        </button>
        <button
          onClick={onNguoiXem}
          title={lesson.restricted_audience ? 'Đang giới hạn — bấm để đổi ai được xem' : 'Xuất bản cho tất cả — bấm để chỉ cho 1 số em xem'}
          className={`p-1.5 rounded-lg transition ${lesson.restricted_audience ? 'text-amber-600 hover:bg-amber-50' : 'text-gray-400 hover:bg-gray-100'}`}
        >
          <Users size={15} />
        </button>
        <button
          onClick={onXemTruoc}
          className="p-1.5 text-gray-400 hover:text-indigo-600 transition"
          title="Xem trước bài học"
        >
          <Eye size={15} />
        </button>
        <button
          onClick={() => navigate(`/teacher/lessons/${lesson.id}/slides`)}
          className={`p-1.5 transition ${lesson.has_slides ? 'text-violet-600 hover:text-violet-800' : 'text-gray-400 hover:text-violet-600'}`}
          title={lesson.has_slides ? 'Sửa bài giảng web' : 'Soạn bài giảng web (AI hỗ trợ)'}
        >
          <Presentation size={15} />
        </button>
        {lesson.has_slides && (
          <button
            onClick={() => navigate(`/teacher/lessons/${lesson.id}/teach`)}
            className="p-1.5 text-green-600 hover:text-green-800 transition"
            title="Dạy bài này (trình chiếu + công cụ lớp học)"
          >
            <MonitorPlay size={15} />
          </button>
        )}
        <button
          onClick={() => navigate(`/teacher/lessons/${lesson.id}/submissions`)}
          className="p-1.5 text-gray-400 hover:text-indigo-600 transition"
          title="Thống kê tiến độ"
        >
          <FileText size={15} />
        </button>
        <button
          onClick={onSua}
          className="p-1.5 text-gray-400 hover:text-indigo-600 transition"
          title="Sửa bài học"
        >
          <Pencil size={14} />
        </button>
        {canDelete && (
          <button
            onClick={onXoa}
            className="p-1.5 text-red-400 hover:text-red-600 transition"
            title="Xóa bài học"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  )
}
