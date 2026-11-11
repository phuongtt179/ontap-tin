// Chi tiết 1 bài thực hành: đề bài, bài đã nộp + nhận xét, ô chọn tệp / ghi chú / rà soát / nộp.
// Desktop: hiện tại chỗ; điện thoại: hộp thoại nổi. Chỉ hiển thị — mọi thao tác báo lên qua on…
// (xử lý ở hook useBaiThucHanh).
import { Loader2, Send, Upload } from 'lucide-react'
import { STUDENT_AI_DIRECT, feedbackVisible } from '../../../lib/aiMode'
import { MUC, mucCua } from '../../../utils/muc'
import MarkdownContent from '../../ui/MarkdownContent'
import PDFViewer from '../../ui/PDFViewer'
import PyTestStatus from '../PyTestStatus'
import RaSoatLoi from '../RaSoatLoi'
import { FileIcon, SubmittedFile } from './TepDaNop'
import { MAU_BAI } from './mauBai'

export default function ChiTietBaiThucHanh({
  i, task, sub, file, note, dangNop, dangNopLai, dangChamAi, lessonId,
  onDong, onChonFile, onDoiGhiChu, onRaSoatTruoc, onNop, onBatDauNopLai, onHuyNopLai, onCapNhatBaiNop, onHoiTroGiang,
}) {
  const p = MAU_BAI[i % MAU_BAI.length]
  const lightBg = ['#f5f3ff','#f0f9ff','#fff7ed','#f0fdf4','#fdf2f8'][i % 5]
  const borderCol = ['#c4b5fd','#7dd3fc','#fdba74','#6ee7b7','#f9a8d4'][i % 5]
  const textCol = ['#7c3aed','#0369a1','#c2410c','#047857','#be185d'][i % 5]


  const header = (
    <div className="px-5 py-4 flex items-center gap-3 shrink-0"
      style={{ background: sub
        ? 'linear-gradient(135deg, #d1fae5, #bbf7d0)'
        : `linear-gradient(135deg, ${p.from}28, ${p.to}14)` }}>
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-md shrink-0"
        style={{ background: sub
          ? 'linear-gradient(135deg, #16a34a, #059669)'
          : `linear-gradient(135deg, ${p.from}, ${p.to})` }}>
        {sub ? '✓' : i + 1}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-black text-gray-800 text-base">Bài thực hành {i + 1}</p>
        <p className="text-xs font-medium mt-0.5 text-gray-500">
          {sub ? `✅ Đã nộp · ${new Date(sub.submitted_at).toLocaleDateString('vi-VN')}` : task?.optional ? '📖 Bài đọc thêm — không cần nộp' : '📤 Chưa nộp'}
        </p>
      </div>
      {feedbackVisible(sub) && mucCua(sub) && (
        <div className="text-center bg-white/70 rounded-xl px-3 py-1.5 shrink-0" title={MUC[mucCua(sub)].ten}>
          <div className="text-2xl font-black" style={{ color: p.from }}>{mucCua(sub)}</div>
          <div className="text-[10px] text-gray-500 font-semibold">MỨC</div>
        </div>
      )}
      <button onClick={onDong}
        className="w-8 h-8 rounded-full bg-white/60 hover:bg-white flex items-center justify-center text-gray-500 transition shrink-0">
        ✕
      </button>
    </div>
  )

  const body = (
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {/* Instructions */}
          {(task.instructions || task.instruction_file_url) && (
            <div className="rounded-2xl p-4 border space-y-3" style={{ background: lightBg, borderColor: borderCol }}>
              <div className="flex items-center gap-1.5 font-bold text-xs" style={{ color: textCol }}>
                📋 Đề bài
              </div>
              {task.instructions && (
                <MarkdownContent text={task.instructions} className="text-gray-800 text-sm" />
              )}
              {task.instruction_file_url && (() => {
                const ext = task.instruction_file_url.split('.').pop().toLowerCase().split('?')[0]
                const isOffice = ['doc','docx','ppt','pptx'].includes(ext)
                const isPdf = ext === 'pdf'
                return isPdf ? (
                  <PDFViewer url={task.instruction_file_url} />
                ) : isOffice ? (
                  <iframe
                    src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(task.instruction_file_url)}`}
                    width="100%" height="480" frameBorder="0"
                    className="rounded-xl border border-gray-200 block w-full" />
                ) : (
                  <a href={task.instruction_file_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-indigo-600 hover:underline">
                    📄 Tải file đề bài
                  </a>
                )
              })()}
            </div>
          )}

          {/* Hỏi trợ giảng về bài thực hành này */}
          <button onClick={onHoiTroGiang}
            className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-violet-600 bg-violet-50 hover:bg-violet-100 border border-violet-200 py-2 rounded-xl transition">
            🙋 Chưa hiểu bài? {STUDENT_AI_DIRECT ? 'Hỏi trợ giảng' : 'Hỏi thầy cô'}
          </button>

          {/* Bài đọc thêm: không có ô nộp bài */}
          {task?.optional && !sub ? (
            <p className="text-sm text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2.5 text-center">📖 Đây là bài đọc thêm — em đọc để hiểu thêm, không cần nộp bài.</p>
          ) : sub && !dangNopLai ? (
            <div className="space-y-3">
              {sub.file_url && <SubmittedFile url={sub.file_url} name={sub.file_name} />}
              {sub.text_content && (
                <div className="bg-gray-50 rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-600 whitespace-pre-wrap">
                  {sub.text_content}
                </div>
              )}
              {sub.allow_resubmit && (
                <div className="rounded-xl p-3 border border-orange-300 bg-orange-50 flex items-center gap-2">
                  <span className="text-lg">📢</span>
                  <p className="text-sm text-orange-700 font-semibold">Giáo viên cho phép bạn nộp lại bài này!</p>
                </div>
              )}
              {!feedbackVisible(sub) && <PyTestStatus fileUrl={sub.file_url} task={task} />}
              {!sub.reviewed_at && !task?.optional && (
                <RaSoatLoi sub={sub} task={task} onCapNhat={onCapNhatBaiNop} />
              )}
              {dangChamAi ? (
                <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 rounded-xl px-3 py-2.5 border border-amber-200">
                  <Loader2 size={13} className="animate-spin" /> AI đang chấm bài… có thể mất tới 1 phút, em đừng đóng trang nhé
                </div>
              ) : feedbackVisible(sub) ? (
                <div className={`rounded-xl p-4 border ${sub.graded_by === 'ai' ? 'border-amber-200 bg-amber-50' : 'border-indigo-200 bg-indigo-50'}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className={`text-xs font-bold ${sub.graded_by === 'ai' ? 'text-amber-700' : 'text-indigo-700'}`}>
                      {sub.graded_by !== 'ai' ? '💬 Nhận xét của giáo viên' : sub.reviewed_at ? '💬 Nhận xét (thầy cô đã duyệt)' : '🤖 AI nhận xét'}
                    </div>
                    {mucCua(sub) && <span className={`text-xs font-black px-2 py-1 rounded-lg border ${MUC[mucCua(sub)].cls}`}>
                      {mucCua(sub)} · {MUC[mucCua(sub)].ten}
                    </span>}
                  </div>
                  {sub.teacher_comment && (
                    <p className="text-sm text-gray-800 leading-relaxed">{sub.teacher_comment}</p>
                  )}
                  {sub.ai_breakdown?.length > 0 && (
                    <div className="mt-3 border-t border-amber-200 pt-3">
                      <p className="text-[11px] font-bold text-amber-700 mb-1.5">Các tiêu chí</p>
                      <table className="w-full text-xs border-collapse">
                        <tbody>
                          {sub.ai_breakdown.map((row, ri) => (
                            <tr key={ri} className={ri % 2 === 0 ? 'bg-white/60' : ''}>
                              <td className="py-1 pr-2 text-gray-700 leading-snug">{row.criterion}</td>
                              <td className="py-1 text-right shrink-0 whitespace-nowrap font-semibold">
                                <span className={row.earned >= row.max ? 'text-green-600' : 'text-red-500'}>
                                  {row.earned >= row.max ? '✓ đạt' : '⚠ chưa đủ'}
                                </span>
                              </td>
                              {row.note && (
                                <td className="py-1 pl-2 text-gray-400 italic leading-snug">{row.note}</td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic text-center py-2">⏳ Thầy cô sẽ xem bài và nhận xét – em quay lại sau nhé (nhận xét tự hiện ở đây)</p>
              )}
              {/* Luôn nộp lại được, kể cả bài đã duyệt — nộp lại thì bài quay về chờ thầy/cô duyệt */}
              <button onClick={onBatDauNopLai} className="w-full py-2.5 rounded-xl border-2 border-orange-300 text-orange-600 font-bold text-sm hover:bg-orange-50 transition">
                🔄 Nộp lại bài này
              </button>
            </div>
          ) : (
            /* Upload form */
            <div className="space-y-3">
              {dangNopLai && (
                <div className="flex items-center justify-between bg-orange-50 border border-orange-200 rounded-xl px-3 py-2">
                  <span className="text-xs text-orange-700 font-semibold">🔄 File cũ sẽ được thay thế</span>
                  <button onClick={onHuyNopLai} className="text-xs text-gray-400 hover:text-gray-600">Hủy</button>
                </div>
              )}
              <label className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl px-4 py-8 cursor-pointer transition-all
                ${file ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'}`}>
                {file ? (
                  <>
                    <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center shadow-sm">
                      <FileIcon url={file.name} size={28} />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-gray-800 break-all max-w-xs">{file.name}</p>
                      <p className="text-xs text-gray-400 mt-1">{(file.size / 1024).toFixed(0)} KB · Bấm để đổi</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
                      <Upload size={30} className="text-gray-300" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-gray-500">
                        {dangNopLai ? 'Chọn file mới' : 'Bấm để chọn file nộp bài'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">.pptx · .docx · .pdf · .sb3 · .py · .txt · ảnh</p>
                    </div>
                  </>
                )}
                <input type="file" className="hidden" accept=".pptx,.docx,.pdf,.sb3,.py,.txt,image/*"
                  onChange={e => { if (e.target.files?.[0]) onChonFile(e.target.files[0]) }} />
              </label>
              <textarea
                value={note}
                onChange={e => onDoiGhiChu(e.target.value)}
                rows={2}
                placeholder="Ghi chú thêm (tuỳ chọn)..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none bg-gray-50"
              />
              {/* Tự rà soát TRƯỚC khi nộp: chọn file → rà soát → sửa → thấy ổn mới bấm Nộp */}
              {file && !task?.optional && (
                <RaSoatLoi file={file} note={note} lessonId={lessonId} taskIdx={i} task={task}
                  onKetQua={onRaSoatTruoc} />
              )}
              <button
                onClick={onNop}
                disabled={dangNop || (dangNopLai ? !file && !sub?.file_url : !file)}
                className="w-full flex items-center justify-center gap-2 text-white py-3.5 rounded-2xl text-sm font-black shadow-lg transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100"
                style={{ background: dangNop ? '#9ca3af' : dangNopLai
                  ? 'linear-gradient(135deg, #f97316, #f59e0b)'
                  : `linear-gradient(135deg, ${p.from}, ${p.to})` }}>
                {dangNop ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                {dangNop ? 'Đang nộp...' : dangNopLai ? `Cập nhật bài ${i + 1}` : `Nộp bài ${i + 1} 🚀`}
              </button>
            </div>
          )}
        </div>
  )

  return (
    <>
      {/* Desktop: hiện ngay tại chỗ, không hộp thoại nổi */}
      <div className="hidden md:flex md:flex-col md:bg-white md:rounded-2xl md:border md:border-gray-100 md:shadow-sm md:overflow-hidden">
        <button onClick={onDong}
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 px-4 pt-3 pb-1 shrink-0">
          ← Quay lại danh sách
        </button>
        {header}
        {body}
      </div>

      {/* Mobile: hộp thoại nổi như cũ */}
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 md:hidden"
        onClick={onDong}>
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <div className="relative w-full sm:max-w-2xl bg-white rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
          onClick={e => e.stopPropagation()}>
          {header}
          {body}
        </div>
      </div>
    </>
  )
}
