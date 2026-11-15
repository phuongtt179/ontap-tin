// Trang Chấm bài — 1 bài nộp: thông tin bài · nút Xem bài (xem ngay tại trang) · gợi ý AI theo tiêu chí · chọn mức + nhận xét · Duyệt.
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Loader2, Bot, Check, Eye, EyeOff, Download } from 'lucide-react'
import { MUC, mucCua } from '../../../utils/muc'
import { aiChamNhap, luuDanhGia } from '../../../utils/danhGia'
import { phanCua, nhapCu, goiYCua, coNhapCua, mucBanDau } from '../../../domain/chamBai'
import { tenTep } from '../../../domain/tepNop'
import { ChonMuc } from './ChonMuc'
import TepBaiNop from './TepBaiNop'

/** 1 dòng bài nộp: thông tin bài · gợi ý AI theo tiêu chí · chọn mức + nhận xét · Duyệt */
export default function DongBaiCham({ sub, tieuDe, taskDef, onDoi, dangBan }) {
  const goiY = goiYCua(sub)
  const [muc, setMuc] = useState(mucBanDau(sub))
  const [nx, setNx] = useState(sub.teacher_comment || '')
  const [dang, setDang] = useState('')
  const [bd, setBd] = useState(sub.ai_breakdown || [])   // bảng tiêu chí AI, giáo viên sửa được trước khi lưu
  const [suaGhiChu, setSuaGhiChu] = useState(null)       // dòng tiêu chí đang sửa ghi chú
  const [xem, setXem] = useState(false)                  // mở khung xem bài ngay tại trang (Scratch, Python, Word, PowerPoint, ảnh)
  useEffect(() => { setMuc(mucBanDau(sub)); setNx(sub.teacher_comment || ''); setBd(sub.ai_breakdown || []); setSuaGhiChu(null) }, [sub.id, sub.muc, sub.score, sub.teacher_comment, sub.submitted_at, sub.ai_breakdown])   // eslint-disable-line react-hooks/exhaustive-deps
  const coNhap = coNhapCua(sub)

  async function goiYAI() {
    setDang('ai')
    try { onDoi(await aiChamNhap(sub, taskDef)) } catch (e) { toast.error(e.quotaType === 'quota_rpd' ? 'AI đã hết lượt hôm nay' : 'AI lỗi: ' + e.message) }
    setDang('')
  }
  // Đổi đạt ↔ chưa đạt: sang đạt thì bỏ ghi chú; về chưa đạt thì lấy lại ghi chú của AI và mở ô sửa
  function doiDat(i) {
    const dangDat = Number(bd[i].earned) >= Number(bd[i].max)
    setBd(ds => ds.map((b, j) => (j !== i ? b : dangDat ? { ...b, earned: 0, note: sub.ai_breakdown?.[i]?.note || '' } : { ...b, earned: b.max, note: '' })))
    setSuaGhiChu(dangDat ? i : null)
  }
  async function duyet() {
    if (!muc) { toast.error('Chọn mức T, H hoặc C'); return }
    setDang('luu')
    const doiTieuChi = JSON.stringify(bd) !== JSON.stringify(sub.ai_breakdown || [])
    const { moi, loi } = await luuDanhGia(sub, { muc, comment: nx, ...(doiTieuChi && { breakdown: bd }) })
    setDang('')
    if (loi) { toast.error('Lưu thất bại: ' + loi); return }
    toast.success(`Đã chốt mức ${muc}`)
    onDoi(moi)
  }

  return (
    <div className={`rounded-xl border p-3 bg-white space-y-2 ${sub.reviewed_at ? 'border-green-200' : 'border-gray-200'}`}>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-800 truncate">{tieuDe} <span className="text-xs font-normal text-gray-500">· Bài {Number(phanCua(sub)) + 1}</span></div>
          <div className="text-xs text-gray-500">Nộp {new Date(sub.submitted_at).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
            {sub.ra_soat?.phien === sub.submitted_at && <> · em đã rà soát {sub.ra_soat.lan} lần (đạt {sub.ra_soat.ket_qua.filter(k => k.dat).length}/{sub.ra_soat.ket_qua.length})</>}
          </div>
        </div>
        {sub.reviewed_at
          ? <span className={`text-xs font-bold px-2 py-1 rounded-lg border ${MUC[mucCua(sub)]?.cls || ''}`}>Đã chốt: {mucCua(sub)}</span>
          : coNhap ? <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-violet-50 text-violet-700 border border-violet-200">AI đã gợi ý — chờ duyệt</span>
            : <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-gray-100 text-gray-600">Chưa có gợi ý</span>}
      </div>

      <div className="text-xs flex flex-wrap gap-x-3 gap-y-1">
        {sub.file_url && (
          <button type="button" onClick={() => setXem(v => !v)}
            className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-md border ${xem ? 'bg-indigo-600 text-white border-indigo-600' : 'text-indigo-700 border-indigo-300 hover:bg-indigo-50'}`}>
            {xem ? <EyeOff size={12} /> : <Eye size={12} />}{xem ? 'Đóng bài' : 'Xem bài'}</button>
        )}
        {sub.file_url && <a href={sub.file_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-gray-500 hover:text-indigo-600 hover:underline"><Download size={12} />Tải về {tenTep(sub.file_url, sub.file_name)}</a>}
        {sub.text_content && <span className="text-gray-600 line-clamp-2">Ghi chú của em: {sub.text_content}</span>}
        {!sub.file_url && !sub.text_content && <span className="text-red-600 font-semibold">Bài trống</span>}
      </div>

      {xem && sub.file_url && <TepBaiNop sub={sub} chiTep cao={520} />}

      {sub.ai_suspect && !nhapCu(sub) && <p className="text-xs text-rose-700 bg-rose-50 rounded px-2 py-1">🚩 AI nghi dùng AI viết hộ: {sub.ai_suspect_reason}</p>}
      {!nhapCu(sub) && bd.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-2 space-y-1">
          <ul className="text-xs grid sm:grid-cols-2 gap-x-4 gap-y-0.5">
            {bd.map((b, i) => (
              <li key={i} className="flex gap-1.5">
                <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => doiDat(i)} title="Bấm để đổi đạt / chưa đạt" className="shrink-0 self-start rounded px-0.5 hover:bg-gray-200">{Number(b.earned) >= Number(b.max) ? '✅' : '⚠️'}</button>
                <span className="flex-1 min-w-0 text-gray-700">{b.criterion}
                  {suaGhiChu === i
                    ? <textarea autoFocus rows={2} value={b.note || ''} onBlur={() => setSuaGhiChu(null)} placeholder="Ghi chú gửi học sinh (để trống nếu không cần)"
                        onChange={e => setBd(ds => ds.map((x, j) => (j === i ? { ...x, note: e.target.value } : x)))}
                        className="block w-full mt-0.5 border border-indigo-300 rounded px-1.5 py-1 text-xs" />
                    : <button type="button" onClick={() => setSuaGhiChu(i)} title="Bấm để sửa ghi chú" className="text-left text-gray-400 hover:text-indigo-600">{b.note ? ` — ${b.note}` : ' ✏️'}</button>}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-gray-400">Bấm ✅/⚠️ để đổi đạt / chưa đạt, bấm ghi chú để sửa. Bấm {sub.reviewed_at ? 'Lưu lại' : 'Duyệt'} để lưu, học sinh sẽ thấy bản đã sửa.</p>
        </div>
      )}

      <div className="flex flex-wrap items-start gap-2">
        <div className="flex items-center gap-2"><span className="text-xs text-gray-500">Mức:</span><ChonMuc value={muc} onChange={setMuc} goiY={goiY} /></div>
        <textarea value={nx} onChange={e => setNx(e.target.value)} rows={2} placeholder="Nhận xét gửi học sinh (AI soạn nháp, thầy cô sửa)"
          className="flex-1 min-w-[220px] border border-gray-300 rounded-lg px-2 py-1.5 text-sm" />
        <div className="flex flex-col gap-1">
          {!sub.reviewed_at && !coNhap && (
            <button onClick={goiYAI} disabled={!!dang || dangBan}
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-violet-300 text-violet-700 hover:bg-violet-50 disabled:opacity-50">
              {dang === 'ai' ? <Loader2 size={12} className="animate-spin" /> : <Bot size={12} />} AI gợi ý</button>
          )}
          <button onClick={duyet} disabled={!!dang || dangBan || !muc}
            className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white disabled:opacity-50">
            {dang === 'luu' ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} {sub.reviewed_at ? 'Lưu lại' : 'Duyệt'}</button>
        </div>
      </div>
    </div>
  )
}
