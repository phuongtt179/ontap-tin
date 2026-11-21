// Điểm danh: chi tiết 1 em qua các buổi (có mặt / vắng, tỉ lệ tham dự).
import { X, CheckCircle2, XCircle } from 'lucide-react'

// ─── Chi tiết điểm danh một học sinh ─────────────────────────────────────────
export default function StudentDetailModal({ student, sessions, records, onClose }) {
  const myRecords = records.filter(r => r.user_id === student.id)
  const mySessionIds = new Set(myRecords.map(r => r.session_id))
  const attended = myRecords.length

  function checkedAt(sessionId) {
    const r = myRecords.find(r => r.session_id === sessionId)
    if (!r) return null
    return new Date(r.checked_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-base font-bold text-gray-800">{student.full_name}</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Tham dự <strong className="text-indigo-600">{attended}</strong> / {sessions.length} buổi
              {sessions.length > 0 && (
                <span className="ml-1">
                  ({Math.round(attended / sessions.length * 100)}%)
                </span>
              )}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4 space-y-1.5">
          {sessions.length === 0 && (
            <p className="text-center text-gray-400 py-10 text-sm">Chưa có buổi học nào</p>
          )}
          {sessions.map((s, i) => {
            const ok = mySessionIds.has(s.id)
            const time = checkedAt(s.id)
            return (
              <div
                key={s.id}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${ok ? 'bg-green-50' : 'bg-gray-50'}`}
              >
                {ok
                  ? <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                  : <XCircle size={16} className="text-gray-300 shrink-0" />
                }
                <span className="text-sm text-gray-700 flex-1">
                  Buổi {sessions.length - i} — {new Date(s.session_date + 'T00:00:00').toLocaleDateString('vi-VN')}
                </span>
                {!s.closed_at && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Đang mở</span>
                )}
                {time && (
                  <span className="text-xs text-gray-400">{time}</span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
