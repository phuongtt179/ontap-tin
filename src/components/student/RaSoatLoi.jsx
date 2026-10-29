// 🔍 "Rà soát lỗi" — học sinh bấm để AI PHÂN LOẠI bài nộp đạt / chưa đạt theo từng tiêu chí giáo viên viết.
// Học sinh chỉ thấy câu tiêu chí của giáo viên kèm ✅ / ⚠️ (AI không viết chữ nào), tự sửa rồi nộp lại.
// Đánh giá mức T/H/C vẫn do giáo viên. Mỗi bản nộp rà soát tối đa 3 lần (máy chủ kiểm tra).
import { useState } from 'react'
import { Loader2, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { apiFetch } from '../../lib/apiFetch'
import { prepareTasks } from '../../utils/gradePrep.js'

const MAX_LAN = 3
const LOI = {
  het_luot: 'Em đã rà soát đủ 3 lần cho bản nộp này. Sửa bài rồi nộp lại để rà soát tiếp nhé!',
  da_danh_gia: 'Thầy cô đã đánh giá bài này rồi.',
  quota_rpd: 'Hôm nay máy rà soát đã hết lượt, em thử lại ngày mai nhé.',
  quota_rpm: 'Nhiều bạn đang rà soát cùng lúc, em chờ 1 phút rồi thử lại nhé.',
}

export default function RaSoatLoi({ sub, task, onCapNhat }) {
  const [dang, setDang] = useState(false)
  const rs = sub?.ra_soat?.phien === sub?.submitted_at ? sub.ra_soat : null   // chỉ lấy kết quả của bản nộp hiện tại
  const conLai = MAX_LAN - (rs?.lan || 0)

  async function raSoat() {
    setDang(true)
    try {
      const [prepared] = await prepareTasks([sub], [task])
      if (!prepared) { toast.error('Bài này chưa rà soát được'); return }
      const r = await apiFetch('/api/ra-soat', { submission_id: sub.id, task: prepared })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) { toast.error(LOI[d.error] || 'Chưa rà soát được, em thử lại sau nhé'); return }
      onCapNhat({ ...sub, ra_soat: d.ra_soat })
    } catch {
      toast.error('Chưa rà soát được, em thử lại sau nhé')
    } finally {
      setDang(false)
    }
  }

  const dat = rs ? rs.ket_qua.filter(k => k.dat).length : 0
  return (
    <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm space-y-2">
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
          {dat < rs.ket_qua.length && <p className="text-xs text-sky-800">Em xem lại các mục ⚠️, sửa bài rồi bấm <b>Nộp lại bài này</b> nhé.</p>}
        </>
      )}
      {conLai > 0 ? (
        <button onClick={raSoat} disabled={dang}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold disabled:opacity-60">
          {dang ? <><Loader2 size={14} className="animate-spin" /> Đang rà soát…</> : <><Search size={14} /> {rs ? 'Rà soát lại' : 'Rà soát lỗi'} (còn {conLai} lần)</>}
        </button>
      ) : (
        <p className="text-xs text-gray-500">Đã rà soát đủ {MAX_LAN} lần cho bản nộp này. Sửa bài và nộp lại để rà soát tiếp.</p>
      )}
      <p className="text-[11px] text-gray-500">Máy chỉ kiểm tra bài theo các tiêu chí thầy cô đặt ra. Đánh giá chính thức do thầy cô.</p>
    </div>
  )
}
