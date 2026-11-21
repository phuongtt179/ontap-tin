// Xem hết các phần thực hành của 1 em: đề, bài nộp, chọn mức + nhận xét từng phần.
import { ArrowLeft, MessageSquare, CheckCircle, Loader2, RefreshCw, Upload } from 'lucide-react'
import MarkdownContent from '../../ui/MarkdownContent'
import { baiCuaPhan } from '../../../domain/chamBai'
import TepBaiNop from './TepBaiNop'
import DongChonMuc from './ChonMuc'

function KhungNhanXet({ sub, hs, i, cham }) {
  return (
    <div className="border-t border-gray-100 pt-3">
      <p className="text-xs font-semibold text-indigo-600 mb-2 flex items-center gap-1.5">
        <MessageSquare size={12} /> Nhận xét & mức — Bài {i + 1}
      </p>
      <div className="mb-2"><DongChonMuc sub={sub} value={cham.mucChon[sub.id]} onChange={m => cham.datMuc(sub.id, m)} /></div>
      <textarea value={cham.nhanXet[sub.id] ?? ''} onChange={e => cham.datNhanXet(sub.id, e.target.value)} rows={3}
        placeholder={`Nhận xét bài ${i + 1}...`}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none mb-2" />
      <div className="flex gap-2">
        <button onClick={() => cham.luuNhanXet(sub, hs)} disabled={!!cham.dangLuu[sub.id]}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50 transition">
          {cham.dangLuu[sub.id] ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
          Lưu nhận xét bài {i + 1}
        </button>
        {sub.reviewed_at && (
          <button onClick={() => cham.doiChoNopLai(sub, hs)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition
              ${sub.allow_resubmit ? 'border-orange-300 bg-orange-50 text-orange-600 hover:bg-orange-100' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
            <RefreshCw size={11} />
            {sub.allow_resubmit ? 'Đã cho phép nộp lại' : 'Cho phép nộp lại'}
          </button>
        )}
      </div>
      {sub.reviewed_at && <p className="text-xs text-gray-400 mt-1.5">Đã nhận xét lúc {new Date(sub.reviewed_at).toLocaleString('vi-VN')}</p>}
    </div>
  )
}

export default function ChiTietHocSinh({ hs, subs, tasks, cham, onQuayLai }) {
  return (
    <div>
      <button onClick={onQuayLai} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4 transition">
        <ArrowLeft size={14} /> Danh sách
      </button>
      <div className="bg-indigo-600 text-white rounded-xl px-5 py-4 mb-5">
        <p className="font-semibold text-base">{hs.full_name}</p>
        <p className="text-indigo-200 text-sm mt-0.5">
          {hs.class_name ? `Lớp ${hs.class_name}` : hs.grade}{' · '}{subs.length}/{tasks.length} bài đã nộp
        </p>
      </div>
      <div className="space-y-4 mb-6">
        {tasks.map((task, i) => {
          const sub = baiCuaPhan(subs, i)
          return (
            <div key={i} className={`rounded-xl border p-4 space-y-3 ${sub ? 'border-gray-200' : 'border-dashed border-gray-200 bg-gray-50'}`}>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-700 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                <span className="text-sm font-semibold text-gray-700">Bài {i + 1}</span>
              </div>
              {task.instructions && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                  <p className="text-xs font-semibold text-amber-700 mb-1">Đề bài:</p>
                  <MarkdownContent text={task.instructions} className="text-amber-900 text-sm" />
                </div>
              )}
              {sub ? <TepBaiNop sub={sub} /> : <p className="text-sm text-gray-400 italic">Học sinh chưa nộp bài này</p>}
              {sub && <KhungNhanXet sub={sub} hs={hs} i={i} cham={cham} />}
            </div>
          )
        })}
        {subs.length === 0 && (
          <div className="text-center py-10 text-gray-400">
            <Upload size={32} className="mx-auto mb-2 opacity-30" />
            <p>Học sinh chưa nộp bài nào</p>
          </div>
        )}
      </div>
    </div>
  )
}
