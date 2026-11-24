// Phần thực hành Python của lượt thi. Kỳ thi nhiều bài (giống thi Tin học trẻ): thanh chọn bài + đề bài + ô nộp riêng từng bài,
// điểm thực hành = trung bình có trọng số điểm cao nhất từng bài (máy chủ tính). Đề không có bài (kiểu cũ) → 1 ô nộp như trước.
import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { layBaiCuaKyThi } from '../../data/deThi'
import { layDiemTungBai } from '../../data/baiLam'
import MarkdownContent from '../ui/MarkdownContent'
import { ThiPython } from './ThiThucHanh'
import { diemKyThi } from '../../domain/chamPython'

export default function KyThiPython({ examId, sessionId }) {
  const [cacBai, setCacBai] = useState(null)   // null = đang tải
  const [chon, setChon] = useState(0)
  const [diem, setDiem] = useState({})         // { bai_id: điểm cao nhất }
  const [tong, setTong] = useState(null)

  useEffect(() => {
    let huy = false
    Promise.all([layBaiCuaKyThi(examId), layDiemTungBai(sessionId)]).then(([b, d]) => {
      if (huy) return
      setCacBai(b.data || [])
      setDiem(Object.fromEntries((d.data || []).map(x => [x.bai_id, Number(x.diem)])))
    })
    return () => { huy = true }
  }, [examId, sessionId])

  if (cacBai === null) return <div className="flex justify-center py-6"><Loader2 className="animate-spin text-gray-400" /></div>
  if (!cacBai.length) return <ThiPython sessionId={sessionId} />

  const bai = cacBai[Math.min(chon, cacBai.length - 1)]
  const daCham = d => {
    setDiem(cu => ({ ...cu, [bai.id]: d.diem_cao_nhat }))
    if (d.diem_thuc_hanh != null) setTong(d.diem_thuc_hanh)
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {cacBai.map((b, i) => (
          <button key={b.id} onClick={() => setChon(i)}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition ${i === chon ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}>
            Bài {i + 1}
            {diem[b.id] != null && <span className={`ml-1.5 text-xs ${i === chon ? 'text-indigo-100' : diem[b.id] >= 10 ? 'text-green-600' : 'text-orange-500'}`}>{diem[b.id]}đ</span>}
          </button>
        ))}
      </div>
      <p className="text-sm text-gray-600">Điểm thực hành hiện tại (cả kỳ thi): <b className="text-indigo-700">{tong ?? diemKyThi(cacBai, diem)}/10</b> · mỗi bài nộp tối đa 10 lần, tính lần cao nhất</p>
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
        <h4 className="font-bold text-gray-800 mb-2">Bài {chon + 1}. {bai.ten}</h4>
        <div className="text-sm text-gray-800"><MarkdownContent text={bai.de_bai} /></div>
      </div>
      <ThiPython key={bai.id} sessionId={sessionId} baiId={bai.id} onCham={daCham} />
    </div>
  )
}
