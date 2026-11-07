// 🔍 "Rà soát lỗi" — học sinh bấm để AI PHÂN LOẠI bài làm đạt / chưa đạt theo từng tiêu chí giáo viên viết.
// Học sinh chỉ thấy câu tiêu chí của giáo viên kèm ✅ / ⚠️ (AI không viết chữ nào), tự sửa rồi nộp / nộp lại.
// Đánh giá mức T/H/C vẫn do giáo viên.
// Hai chế độ: đã nộp (sub) hoặc TRƯỚC khi nộp (file + note mới chọn, từ 08/11/2026) — đọc file ngay trên máy,
// chưa tải lên. Mỗi ô bài tối đa 7 lần/ngày, dùng chung cả hai chế độ (máy chủ đếm, bảng ra_soat_luot).
import { useEffect, useState } from 'react'
import { Loader2, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { apiFetch } from '../../lib/apiFetch'
import { supabase } from '../../lib/supabase'
import { prepareTasks } from '../../utils/gradePrep.js'

const MAX_LAN = 7
const LOI = {
  het_luot: `Hôm nay em đã rà soát đủ ${MAX_LAN} lần cho bài này. Mai em rà soát tiếp nhé!`,
  da_danh_gia: 'Thầy cô đã đánh giá bài này rồi.',
  quota_rpd: 'Hôm nay máy rà soát đã hết lượt, em thử lại ngày mai nhé.',
  quota_rpm: 'Nhiều bạn đang rà soát cùng lúc, em chờ 1 phút rồi thử lại nhé.',
}

export default function RaSoatLoi({ sub, file, note, lessonId, taskIdx, task, onCapNhat, onKetQua }) {
  const truocKhiNop = !sub
  const [dang, setDang] = useState(false)
  const [daDung, setDaDung] = useState(null)   // số lượt đã dùng hôm nay (null = đang tải)
  const [kqMoi, setKqMoi] = useState(null)     // kết quả lần rà soát gần nhất trên trang này
  // Đã nộp: chỉ hiện kết quả của bản nộp hiện tại. Chưa nộp: kết quả của file đang chọn.
  const rs = kqMoi || (sub?.ra_soat?.phien === sub?.submitted_at ? sub.ra_soat : null)

  useEffect(() => {
    let huy = false
    supabase.rpc('ra_soat_dem', { p_lesson: lessonId ?? sub?.lesson_id, p_task: taskIdx ?? Number(sub?.content_json?.task_index ?? 0) })
      .then(({ data }) => { if (!huy) setDaDung(Number(data) || 0) })
    return () => { huy = true }
  }, [lessonId, taskIdx, sub?.id])   // eslint-disable-line react-hooks/exhaustive-deps

  // Đổi file khác → kết quả cũ không còn đúng với file mới
  useEffect(() => { if (truocKhiNop) setKqMoi(null) }, [file])   // eslint-disable-line react-hooks/exhaustive-deps

  const conLai = daDung == null ? null : Math.max(0, MAX_LAN - daDung)

  async function raSoat() {
    setDang(true)
    let blobUrl = null
    try {
      let nguon = sub
      if (truocKhiNop) {
        blobUrl = file ? URL.createObjectURL(file) : null
        nguon = { file_url: blobUrl, loai_tep: file?.name, file_name: file?.name, text_content: (note || '').trim() || null, content_json: { task_index: taskIdx } }
      }
      const [prepared] = await prepareTasks([nguon], [task])
      if (!prepared) { toast.error('Bài này chưa rà soát được'); return }
      if (prepared.type === 'image') { toast.error('Ảnh chưa rà soát được, em nộp bài để thầy cô xem nhé'); return }
      const r = await apiFetch('/api/ra-soat', truocKhiNop
        ? { lesson_id: lessonId, task_index: taskIdx, task: prepared }
        : { submission_id: sub.id, task: prepared })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) {
        if (d.error === 'het_luot') setDaDung(MAX_LAN)
        toast.error(LOI[d.error] || 'Chưa rà soát được, em thử lại sau nhé')
        return
      }
      setKqMoi(d.ra_soat)
      setDaDung(d.ra_soat.lan)
      if (truocKhiNop) onKetQua?.(d.ra_soat)
      else onCapNhat?.({ ...sub, ra_soat: d.ra_soat })
    } catch {
      toast.error('Chưa rà soát được, em thử lại sau nhé')
    } finally {
      if (blobUrl) URL.revokeObjectURL(blobUrl)
      setDang(false)
    }
  }

  const dat = rs ? rs.ket_qua.filter(k => k.dat).length : 0
  return (
    <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm space-y-2">
      {truocKhiNop && !rs && (
        <p className="text-xs text-sky-800">Trước khi nộp, em có thể bấm <b>Rà soát lỗi</b> để máy kiểm tra bài theo tiêu chí của thầy cô.</p>
      )}
      {rs && (
        <>
          <div className={`font-bold ${dat === rs.ket_qua.length ? 'text-green-700' : 'text-sky-800'}`}>
            🔍 Rà soát lần {rs.lan}: đạt {dat}/{rs.ket_qua.length} tiêu chí
          </div>
          <ul className="space-y-1">
            {rs.ket_qua.map((k, i) => (
              <li key={i} className="flex gap-2 items-start">
                <span className="shrink-0">{k.dat ? '✅' : '⚠️'}</span>
                <span className={k.dat ? 'text-gray-600' : 'text-gray-900 font-medium'}>{k.tieu_chi}</span>
              </li>
            ))}
          </ul>
          {dat < rs.ket_qua.length && (
            <p className="text-xs text-sky-800">
              Em xem lại các mục ⚠️, sửa bài rồi {truocKhiNop ? <>chọn lại file và rà soát tiếp, hoặc bấm <b>Nộp bài</b></> : <>bấm <b>Nộp lại bài này</b></>} nhé.
            </p>
          )}
        </>
      )}
      {conLai !== 0 ? (
        <button onClick={raSoat} disabled={dang || conLai == null}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold disabled:opacity-60">
          {dang ? <><Loader2 size={14} className="animate-spin" /> Đang rà soát…</> : <><Search size={14} /> {rs ? 'Rà soát lại' : 'Rà soát lỗi'}{conLai != null && ` (hôm nay còn ${conLai} lần)`}</>}
        </button>
      ) : (
        <p className="text-xs text-gray-500">Hôm nay em đã rà soát đủ {MAX_LAN} lần cho bài này. Mai em rà soát tiếp nhé!</p>
      )}
      <p className="text-[11px] text-gray-500">Máy chỉ kiểm tra bài theo các tiêu chí thầy cô đặt ra. Đánh giá chính thức do thầy cô.</p>
    </div>
  )
}
