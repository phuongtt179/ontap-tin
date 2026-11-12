// Cửa sổ chấm nhanh 1 phần của 1 em (bấm ô trong bảng): đề, bài nộp, cờ nghi dùng AI, tiêu chí AI, chọn mức + nhận xét.
import { MessageSquare, CheckCircle, Loader2, RefreshCw, Bot } from 'lucide-react'
import toast from 'react-hot-toast'
import MarkdownContent from '../../ui/MarkdownContent'
import { loaiTep, tenTep, linkXemOffice } from '../../../domain/tepNop'
import TepBaiNop from './TepBaiNop'
import DongChonMuc from './ChonMuc'

function DeBai({ task }) {
  const tep = task.instruction_file_url
  const loai = loaiTep(tep)
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 space-y-2">
      <p className="text-xs font-bold text-amber-700">Đề bài:</p>
      {task.instructions && <MarkdownContent text={task.instructions} className="text-amber-900 text-sm" />}
      {tep && loai.pdf && (
        <a href={tep} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 p-2 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 transition text-sm text-amber-800">
          📄 <span className="truncate">{tenTep(tep)}</span>
          <span className="ml-auto shrink-0 text-xs">↗ Mở PDF</span>
        </a>
      )}
      {tep && loai.office && (
        <iframe src={linkXemOffice(tep)} width="100%" height="400" frameBorder="0" title="Đề bài" className="rounded-lg border border-amber-200 block w-full" />
      )}
    </div>
  )
}

function TieuChiAi({ breakdown }) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
      <p className="text-[11px] font-bold text-amber-700 mb-1.5">🤖 Tiêu chí AI đã kiểm tra</p>
      <table className="w-full text-xs border-collapse">
        <tbody>
          {breakdown.map((row, ri) => (
            <tr key={ri} className={ri % 2 === 0 ? 'bg-white/60' : ''}>
              <td className="py-1 pr-2 text-gray-700 leading-snug align-top">{row.criterion}</td>
              <td className="py-1 text-right whitespace-nowrap font-semibold align-top">
                <span className={row.earned >= row.max ? 'text-green-600' : 'text-red-500'}>{row.earned >= row.max ? '✓ đạt' : '⚠ chưa đủ'}</span>
              </td>
              {row.note && <td className="py-1 pl-2 text-gray-500 italic leading-snug align-top">{row.note}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function ModalChamBai({ hs, sub, task, phan, cham, onDong }) {
  async function aiChamLai(e) {
    e.stopPropagation()
    try {
      await cham.aiChamMotEm(hs)
      toast.success('AI đã chấm xong!')
    } catch (err) {
      toast.error(err.quotaType === 'quota_rpd' ? 'Hết quota hôm nay' : 'Lỗi AI: ' + err.message)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onDong}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-5 py-4 rounded-t-2xl flex items-start justify-between">
          <div>
            <p className="font-black text-base">{hs.full_name}</p>
            <p className="text-indigo-200 text-sm">{hs.class_name || hs.grade} · Bài thực hành {phan + 1}</p>
          </div>
          <button onClick={onDong} className="text-white/70 hover:text-white text-xl leading-none ml-4">✕</button>
        </div>

        <div className="p-5 space-y-4">
          {(task?.instructions || task?.instruction_file_url) && <DeBai task={task} />}
          <TepBaiNop sub={sub} cao={400} />

          <div className="border-t border-gray-100 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-indigo-600 flex items-center gap-1.5">
                <MessageSquare size={12} />
                {sub.graded_by === 'ai' ? '🤖 AI đã chấm nháp — chọn mức & lưu' : 'Nhận xét & mức'}
              </p>
              {!sub.reviewed_at && (
                <button onClick={aiChamLai} className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-semibold">
                  <Bot size={12} /> AI chấm lại
                </button>
              )}
            </div>
            {sub.ai_suspect && (
              <div className="rounded-xl border border-rose-300 bg-rose-50 p-3 flex items-start gap-2">
                <span className="text-lg shrink-0">🚩</span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-rose-700">Nghi ngờ học sinh dùng AI viết hộ</p>
                  {sub.ai_suspect_reason && <p className="text-xs text-rose-600 mt-0.5 leading-snug">{sub.ai_suspect_reason}</p>}
                  <p className="text-[10px] text-rose-400 mt-0.5">Chỉ là gợi ý của AI — thầy/cô mở xem code và tự quyết định.</p>
                </div>
              </div>
            )}
            {sub.score != null && sub.ai_breakdown?.length > 0 && <TieuChiAi breakdown={sub.ai_breakdown} />}
            <DongChonMuc sub={sub} value={cham.mucChon[sub.id]} onChange={m => cham.datMuc(sub.id, m)} />
            <textarea value={cham.nhanXet[sub.id] ?? ''} onChange={e => cham.datNhanXet(sub.id, e.target.value)}
              rows={3} placeholder="Nhận xét cho học sinh..."
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
            <div className="flex gap-2">
              <button onClick={() => cham.luuNhanXet(sub, hs)} disabled={!!cham.dangLuu[sub.id]}
                className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition">
                {cham.dangLuu[sub.id] ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                Lưu nhận xét
              </button>
              <button onClick={onDong} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition">Đóng</button>
            </div>
            {sub.reviewed_at && (
              <>
                <p className="text-xs text-gray-400">Đã nhận xét lúc {new Date(sub.reviewed_at).toLocaleString('vi-VN')}</p>
                <button onClick={() => cham.doiChoNopLai(sub, hs)}
                  className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl border text-sm font-medium transition
                    ${sub.allow_resubmit ? 'border-orange-300 bg-orange-50 text-orange-600 hover:bg-orange-100' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                  <RefreshCw size={13} />
                  {sub.allow_resubmit ? '✓ Đã cho phép nộp lại — bấm để hủy' : 'Cho phép nộp lại'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
