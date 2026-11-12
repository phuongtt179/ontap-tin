// Tài khoản / ghi danh đang chờ giáo viên duyệt: duyệt, sửa (phân lớp), từ chối.
import { Clock, AlertCircle, Loader2, UserCheck, UserX, Pencil } from 'lucide-react'

export default function DanhSachChoDuyet({ ds, dangDuyet, onDuyet, onSua, onTuChoi }) {
  return (
    <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-amber-200 flex items-center gap-2">
        <Clock size={15} className="text-amber-600" />
        <span className="text-sm font-semibold text-amber-800">Tài khoản chờ phê duyệt ({ds.length})</span>
      </div>
      <div className="divide-y divide-amber-100">
        {ds.map(s => (
          <div key={s.id} className="px-4 py-3 flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-800 text-sm">{s.full_name}</p>
              <p className="text-xs text-gray-500 font-mono mt-0.5">
                {s.username || s.id.slice(0, 8)}
                {s.grade && <span className="ml-2 text-indigo-600">{s.grade}</span>}
              </p>
            </div>
            {s.class_name ? (
              <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full font-medium">{s.class_name}</span>
            ) : (
              <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full font-medium">
                <AlertCircle size={11} /> Chưa chọn lớp
              </span>
            )}
            <div className="flex items-center gap-2">
              <button onClick={() => onDuyet(s)} disabled={dangDuyet === s.id}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition disabled:opacity-50">
                {dangDuyet === s.id ? <Loader2 size={12} className="animate-spin" /> : <UserCheck size={13} />}
                Duyệt
              </button>
              <button onClick={() => onSua(s)} className="p-1.5 text-gray-400 hover:text-indigo-600 transition" title="Sửa thông tin / phân lớp">
                <Pencil size={14} />
              </button>
              <button onClick={() => onTuChoi(s)} title="Từ chối đăng ký"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-red-200 hover:bg-red-50 text-red-500 hover:text-red-600 text-xs font-medium rounded-lg transition">
                <UserX size={13} /> Từ chối
              </button>
            </div>
          </div>
        ))}
      </div>
      {ds.some(s => !s.class_name) && (
        <div className="px-4 py-2 bg-orange-50 border-t border-amber-200 text-xs text-orange-700">
          Học sinh chưa chọn lớp — bấm ✏️ để phân lớp trước hoặc sau khi duyệt.
        </div>
      )}
    </div>
  )
}
