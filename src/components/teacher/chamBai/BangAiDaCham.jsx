// Cửa sổ tổng hợp các bài AI đã chấm nháp: mức gợi ý, nhận xét + bảng tiêu chí, duyệt từng bài / duyệt hết, mở ra sửa.
import { Loader2, CheckCircle, Bot } from 'lucide-react'
import { MUC, mucCua } from '../../../utils/muc'
import { phanCua } from '../../../domain/chamBai'

const MAU_MUC = { T: 'text-green-600', H: 'text-blue-600' }

export default function BangAiDaCham({ hocSinh, baiNop, dangDuyetHet, onDuyet, onDuyetHet, onSua, onDong }) {
  const rows = hocSinh.flatMap(hs => (baiNop[hs.id] || [])
    .filter(sub => sub.graded_by === 'ai')
    .sort((a, b) => phanCua(a) - phanCua(b))
    .map(sub => ({ hs, sub, phan: phanCua(sub) })))
  const chuaDuyet = rows.filter(r => !r.sub.reviewed_at).length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onDong}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-5 py-4 rounded-t-2xl flex items-center justify-between shrink-0">
          <div>
            <p className="font-black text-base flex items-center gap-2"><Bot size={16} /> Tổng hợp AI chấm ({rows.length} bài)</p>
            <p className="text-amber-100 text-sm mt-0.5">{chuaDuyet} bài chưa duyệt · {rows.length - chuaDuyet} đã duyệt</p>
          </div>
          <div className="flex items-center gap-2">
            {chuaDuyet > 0 && (
              <button onClick={onDuyetHet} disabled={dangDuyetHet}
                className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition disabled:opacity-60">
                {dangDuyetHet ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                Duyệt tất cả ({chuaDuyet})
              </button>
            )}
            <button onClick={onDong} className="text-white/70 hover:text-white text-xl leading-none ml-2">✕</button>
          </div>
        </div>
        <div className="overflow-y-auto flex-1">
          {rows.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Bot size={36} className="mx-auto mb-3 opacity-30" />
              <p>Chưa có bài nào được AI chấm</p>
            </div>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead className="sticky top-0 bg-gray-50 border-b border-gray-200 z-10">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 min-w-[160px]">Học sinh</th>
                  <th className="text-left px-3 py-3 font-semibold text-gray-600 w-20">Lớp</th>
                  <th className="text-center px-3 py-3 font-semibold text-gray-600 w-16">Bài</th>
                  <th className="text-center px-3 py-3 font-semibold text-gray-600 w-20">Điểm AI</th>
                  <th className="text-left px-3 py-3 font-semibold text-gray-600">Nhận xét AI</th>
                  <th className="text-center px-3 py-3 font-semibold text-gray-600 w-32">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ hs, sub, phan }, i) => {
                  const muc = mucCua(sub)
                  return (
                    <tr key={sub.id} className={`border-b border-gray-100 ${i % 2 === 1 ? 'bg-gray-50/40' : 'bg-white'}`}>
                      <td className="px-4 py-3 font-medium text-gray-800">{hs.full_name}</td>
                      <td className="px-3 py-3 text-xs text-gray-500">{hs.class_name || hs.grade}</td>
                      <td className="px-3 py-3 text-center">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-700 text-xs font-bold">{phan + 1}</span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`text-sm font-bold ${MAU_MUC[muc] || 'text-orange-500'}`} title={MUC[muc]?.ten}>{muc || '?'}</span>
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-600 max-w-xs">
                        <span className="line-clamp-2">{sub.teacher_comment || <span className="text-gray-300 italic">Không có nhận xét</span>}</span>
                        {sub.score != null && sub.ai_breakdown?.length > 0 && (
                          <table className="mt-1.5 w-full border-collapse">
                            <tbody>
                              {sub.ai_breakdown.map((row, ri) => (
                                <tr key={ri}>
                                  <td className="py-0.5 pr-2 text-[11px] text-gray-500 leading-snug">{row.criterion}</td>
                                  <td className="py-0.5 text-right whitespace-nowrap text-[11px] font-bold">
                                    <span className={row.earned >= row.max ? 'text-green-600' : 'text-red-500'}>{row.earned}/{row.max}đ</span>
                                  </td>
                                  {row.note && <td className="py-0.5 pl-1.5 text-[10px] text-gray-400 italic">{row.note}</td>}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {sub.reviewed_at ? (
                            <span className="text-xs text-green-600 font-semibold flex items-center gap-1"><CheckCircle size={11} />Đã duyệt</span>
                          ) : (
                            <button onClick={() => onDuyet(sub, hs)}
                              className="text-xs bg-green-100 hover:bg-green-200 text-green-700 font-semibold px-2.5 py-1 rounded-lg transition">Duyệt</button>
                          )}
                          <button onClick={() => onSua(hs, phan)}
                            className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-semibold px-2.5 py-1 rounded-lg transition">Sửa</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
