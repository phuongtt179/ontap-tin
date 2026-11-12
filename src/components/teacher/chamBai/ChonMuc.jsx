// Chọn mức T/H/C — từ 29/10/2026 giáo viên đánh giá theo mức, không nhập điểm.
import { MUC, CAC_MUC, mucCua } from '../../../utils/muc'

export function ChonMuc({ value, onChange }) {
  return (
    <span className="inline-flex gap-1">
      {CAC_MUC.map(m => (
        <button key={m} type="button" onClick={() => onChange(m)} title={MUC[m].ten}
          className={`w-9 h-8 rounded-lg font-black text-sm border ${value === m ? MUC[m].nut + ' border-transparent' : 'bg-white text-gray-600 border-gray-300'}`}>{m}</button>
      ))}
    </span>
  )
}

/** dòng "Mức: [T][H][C]  Đã chốt / AI gợi ý: …" */
export default function DongChonMuc({ sub, value, onChange }) {
  const muc = mucCua(sub)
  return (
    <div className="flex items-center gap-2">
      <label className="text-xs text-gray-500 shrink-0">Mức:</label>
      <ChonMuc value={value} onChange={onChange} />
      {muc && (
        <span className="text-xs text-gray-400">{sub.reviewed_at ? 'Đã chốt' : 'AI gợi ý'}: <b className="text-indigo-600">{MUC[muc].ten}</b></span>
      )}
    </div>
  )
}
