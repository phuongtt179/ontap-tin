// Khung từng mục của trang Học bài (lý thuyết, video, bài giảng, quiz, thực hành) + nút / nhãn dùng chung.
import { CheckCircle, Loader2, Lock } from 'lucide-react'

/* ── Helper UI components ──────────────────────────────────── */
export function DoneChip({ label }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-green-700 font-semibold bg-green-100 px-4 py-2 rounded-xl">
      <CheckCircle size={16} /> {label}
    </span>
  )
}

export function ActionButton({ onClick, disabled, loading, color = 'indigo', children }) {
  const colors = {
    indigo: 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200',
    blue:   'bg-blue-500 hover:bg-blue-600 shadow-blue-200',
    orange: 'bg-orange-500 hover:bg-orange-600 shadow-orange-200',
    emerald:'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200',
    amber:  'bg-amber-500 hover:bg-amber-600 shadow-amber-200',
  }
  return (
    <button onClick={onClick} disabled={disabled}
      className={`flex items-center gap-2 ${colors[color]} text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100`}>
      {loading && <Loader2 size={15} className="animate-spin" />}
      {children}
    </button>
  )
}

export function SectionCard({ icon, iconBg, iconColor, title, badge, done, locked, lockMessage, children }) {
  return (
    <section className={`relative bg-white rounded-2xl shadow-sm border overflow-hidden transition-all duration-300
      ${done ? 'border-green-200' : locked ? 'border-gray-100' : 'border-indigo-100 shadow-indigo-50'}`}>
      {/* Header */}
      <div className={`flex items-center gap-3 px-5 py-4 border-b
        ${done ? 'border-green-100 bg-green-50/50' : locked ? 'border-gray-100 bg-gray-50/50' : 'border-indigo-50 bg-indigo-50/30'}`}>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${done ? 'bg-green-100' : locked ? 'bg-gray-100' : iconBg}`}>
          <span className={done ? 'text-green-600' : locked ? 'text-gray-300' : iconColor}>{icon}</span>
        </div>
        <h2 className={`font-bold text-sm flex-1 ${locked ? 'text-gray-400' : 'text-gray-800'}`}>{title}</h2>
        {badge && !done && !locked && (
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full font-medium">{badge}</span>
        )}
        {done && <CheckCircle size={18} className="text-green-500 shrink-0" />}
        {locked && <Lock size={16} className="text-gray-300 shrink-0" />}
      </div>
      {/* Body */}
      {locked ? (
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
            <Lock size={24} className="text-gray-300" />
          </div>
          <p className="text-sm text-gray-400 font-medium">{lockMessage}</p>
        </div>
      ) : (
        <div className="p-5">{children}</div>
      )}
    </section>
  )
}
