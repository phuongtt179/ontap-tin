// Bảng tiến độ cả lớp: mỗi em 1 dòng — video, câu hỏi, từng phần thực hành (bấm ô để chấm nhanh).
import { PlayCircle, RefreshCw, Users } from 'lucide-react'
import { mucCua } from '../../../utils/muc'
import { baiCuaPhan } from '../../../domain/chamBai'

function OBaiNop({ sub, onClick }) {
  if (!sub) return <span className="text-gray-300 text-sm">—</span>
  const choNopLai = !!sub.allow_resubmit
  const aiCham = sub.graded_by === 'ai'
  const daDuyet = !!sub.reviewed_at
  return (
    <button onClick={onClick}
      title={sub.ai_suspect ? `🚩 Nghi ngờ dùng AI: ${sub.ai_suspect_reason || 'xem kỹ code'}` : undefined}
      className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg transition
        ${sub.ai_suspect ? 'ring-2 ring-rose-400 ' : ''}${choNopLai ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
          : aiCham ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
          : daDuyet ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
          : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
      {sub.ai_suspect && <span title="Nghi ngờ dùng AI">🚩</span>}
      {choNopLai ? <><RefreshCw size={10} /> chờ</>
        : aiCham ? <>🤖 {mucCua(sub) || '?'}</>
        : daDuyet ? (mucCua(sub) || '✓ chấm')
        : '✓ nộp'}
    </button>
  )
}

export default function BangTienDo({ hocSinh, tienDo, baiNop, lesson, coVideo, coQuiz, coThucHanh, soPhan, onChonHs, onChamNhanh }) {
  if (!hocSinh.length) {
    return (
      <div className="text-center py-16 text-gray-400">
        <Users size={40} className="mx-auto mb-3 opacity-30" />
        <p>Không có học sinh nào</p>
      </div>
    )
  }
  const soCau = lesson?.question_ids?.length ?? 0
  const phan = Array.from({ length: soPhan }, (_, i) => i)
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="sticky left-0 z-10 bg-gray-50 text-left px-4 py-3 font-semibold text-gray-600 border-r border-gray-200 min-w-[220px] whitespace-nowrap">Họ và tên</th>
            {coVideo && <th className="px-3 py-3 font-semibold text-gray-600 text-center min-w-[80px] border-r border-gray-100 whitespace-nowrap">Video</th>}
            {coQuiz && <th className="px-3 py-3 font-semibold text-gray-600 text-center min-w-[110px] border-r border-gray-100 whitespace-nowrap">Câu hỏi</th>}
            {coThucHanh && phan.map(i => (
              <th key={i} className="px-3 py-3 font-semibold text-gray-600 text-center min-w-[90px] border-r border-gray-100 whitespace-nowrap">Bài {i + 1}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {hocSinh.map((hs, dong) => {
            const td = tienDo[hs.id]
            const subs = baiNop[hs.id] || []
            const nen = dong % 2 === 1 ? 'bg-gray-50/40' : 'bg-white'
            return (
              <tr key={hs.id} className={`border-b border-gray-100 transition-colors ${nen} hover:bg-indigo-50/30`}>
                <td className={`sticky left-0 z-10 px-4 py-3 border-r border-gray-200 ${nen} hover:bg-indigo-50/30`}>
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0
                      ${td?.completed ? 'bg-green-500 text-white' : 'bg-indigo-100 text-indigo-600'}`}>
                      {hs.full_name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="min-w-0">
                      <button onClick={() => coThucHanh && onChonHs(hs)}
                        className={`font-medium text-gray-800 text-left leading-tight truncate block max-w-[160px] ${coThucHanh ? 'hover:text-indigo-600 cursor-pointer' : 'cursor-default'}`}>
                        {hs.full_name}
                      </button>
                      <span className="text-xs text-gray-400">{hs.class_name || hs.grade}</span>
                    </div>
                  </div>
                </td>
                {coVideo && (
                  <td className="px-3 py-3 text-center border-r border-gray-100">
                    {td?.video_watched
                      ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full"><PlayCircle size={10} />✓</span>
                      : <span className="text-gray-300 text-sm">—</span>}
                  </td>
                )}
                {coQuiz && (
                  <td className="px-3 py-3 text-center border-r border-gray-100">
                    {td?.quiz_passed
                      ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">✓ {td.quiz_correct ?? 0}/{td.quiz_total ?? soCau}</span>
                      : td?.quiz_correct > 0
                        ? <span className="text-xs text-gray-500">{td.quiz_correct}/{soCau}</span>
                        : <span className="text-gray-300 text-sm">—</span>}
                  </td>
                )}
                {coThucHanh && phan.map(i => (
                  <td key={i} className="px-3 py-3 text-center border-r border-gray-100">
                    <OBaiNop sub={baiCuaPhan(subs, i)} onClick={e => { e.stopPropagation(); onChamNhanh(hs, i) }} />
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
