// Trình soạn bài giảng: nút lớn / nhỏ, nhóm nút trên thanh công cụ, thẻ chọn hiệu ứng chuyển trang / xuất hiện.

export function RibbonBigBtn({ onClick, disabled, title, icon: Icon, label, danger, active }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} title={title}
      className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded min-w-[52px] h-14 text-[11px] font-medium border transition select-none
        ${active ? 'bg-blue-100 border-blue-400 text-blue-700'
          : danger ? 'border-transparent text-red-600 hover:bg-red-50 hover:border-red-200'
          : 'border-transparent text-gray-700 hover:bg-gray-100 hover:border-gray-300'}
        ${disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : 'cursor-pointer'}`}>
      <Icon size={20} /><span>{label}</span>
    </button>
  )
}
export function RibbonSmBtn({ onClick, active, disabled, title, children }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} title={title}
      className={`w-7 h-7 flex items-center justify-center rounded border transition select-none
        ${active ? 'bg-blue-100 border-blue-400 text-blue-700' : 'border-transparent text-gray-700 hover:bg-gray-100 hover:border-gray-300'}
        ${disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : 'cursor-pointer'}`}>
      {children}
    </button>
  )
}
export function RibbonGroup({ label, children }) {
  return (
    <div className="flex flex-col border-r border-gray-200 last:border-r-0 px-2 pb-0.5">
      <div className="flex items-center gap-1 flex-1">{children}</div>
      <div className="text-[10px] text-gray-400 text-center mt-1 leading-none">{label}</div>
    </div>
  )
}
export function TransCard({ trans, active, onClick }) {
  return (
    <button type="button" onClick={onClick}
      className={`flex flex-col items-center gap-1 px-2 py-1 rounded border transition w-14
        ${active ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-400 text-gray-600'}`}>
      <span className="text-xl leading-none">{trans.icon}</span>
      <span className="text-[10px] font-medium">{trans.label}</span>
    </button>
  )
}
export function AnimCard({ anim, active, onClick, disabled }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className={`flex flex-col items-center gap-1 px-2 py-1 rounded border transition w-14
        ${active ? 'border-blue-400 bg-blue-50 text-blue-700'
          : disabled ? 'border-gray-100 text-gray-300 cursor-not-allowed'
          : 'border-gray-200 hover:border-gray-400 text-gray-600'}`}>
      <span className="text-xl leading-none">{anim.icon}</span>
      <span className="text-[10px] font-medium">{anim.label}</span>
    </button>
  )
}

/* ── SlideThumb ──────────────────────────────────────────────── */
