// Thao tác chấm bài thực hành của giáo viên: chốt mức + nhận xét, cho nộp lại, AI chấm nháp, duyệt mức AI.
// Quy tắc (cột ghi, ai cần chấm) ở domain/chamBai.js; sticker ở utils/stickerAward.js; ghi qua data/baiNop.js.
import { useState } from 'react'
import toast from 'react-hot-toast'
import { gradeStudent } from '../utils/aiGrader'
import { thuongStickerTheoMuc } from '../utils/stickerAward'
import { mucCua, mucTuDiem } from '../utils/muc'
import { parseTasks } from '../domain/baiThucHanh'
import { capNhatTuKetQuaAi, capNhatKhiGvChot, capNhatKhiDuyetAi, canAiCham, baiCuaPhan } from '../domain/chamBai'
import { capNhatBaiNop } from '../data/baiNop'

const cho = ms => new Promise(r => setTimeout(r, ms))

export function useChamBaiThucHanh({ lesson, submissionMap, suaBaiTaiCho }) {
  const [nhanXet, setNhanXet] = useState({})   // subId -> nhận xét đang soạn
  const [mucChon, setMucChon] = useState({})   // subId -> 'T' | 'H' | 'C' | ''
  const [dangLuu, setDangLuu] = useState({})   // subId -> bool
  const [aiDangCham, setAiDangCham] = useState({ active: false, done: 0, total: 0, countdown: 0 })
  const [dangDuyetHet, setDangDuyetHet] = useState(false)

  /** nạp nhận xét + mức hiện có của các bài vào ô soạn (khi mở bài ra chấm) */
  function moSoan(subs, { thayHet = false } = {}) {
    const nx = {}, m = {}
    subs.forEach(s => { nx[s.id] = s.teacher_comment || ''; m[s.id] = mucCua(s) || '' })
    setNhanXet(prev => thayHet ? nx : { ...prev, ...nx })
    setMucChon(prev => thayHet ? m : { ...prev, ...m })
  }

  async function thuongSticker(sub, hs, muc) {
    const { them, error } = await thuongStickerTheoMuc(sub.id, hs.id, muc)
    if (error) toast.error('Không cập nhật được sticker: ' + error.message)
    else if (them > 0) toast.success(`Đã cộng +${them} ⭐ cho ${hs.full_name}`)
  }

  async function luuNhanXet(sub, hs) {
    const thayDoi = capNhatKhiGvChot(sub, mucChon[sub.id], nhanXet[sub.id])
    if (!thayDoi) { toast.error('Chọn mức T, H hoặc C'); return }
    setDangLuu(prev => ({ ...prev, [sub.id]: true }))
    const { error } = await capNhatBaiNop(sub.id, thayDoi)
    setDangLuu(prev => ({ ...prev, [sub.id]: false }))
    if (error) { toast.error('Lưu thất bại: ' + error.message); return }
    await thuongSticker(sub, hs, thayDoi.muc)
    toast.success(`Đã lưu nhận xét bài ${(sub.content_json?.task_index ?? 0) + 1}`)
    suaBaiTaiCho(hs.id, sub.id, thayDoi)
  }

  async function doiChoNopLai(sub, hs) {
    const choPhep = !sub.allow_resubmit
    const { error } = await capNhatBaiNop(sub.id, { allow_resubmit: choPhep })
    if (error) { toast.error('Thất bại: ' + error.message); return }
    toast.success(choPhep ? `Đã cho phép ${hs.full_name} nộp lại` : 'Đã hủy cho phép nộp lại')
    suaBaiTaiCho(hs.id, sub.id, { allow_resubmit: choPhep })
  }

  /** AI chấm nháp mọi phần đã nộp của 1 em (ném lỗi quota để nơi gọi xử lý) */
  async function aiChamMotEm(hs) {
    const de = parseTasks(lesson?.practice_instructions)
    const baiTheoPhan = de.map((_, i) => baiCuaPhan(submissionMap[hs.id], i) || null)
    const { results } = await gradeStudent(baiTheoPhan, de)
    const luc = new Date().toISOString()
    for (const kq of results) {
      const sub = baiTheoPhan[kq.taskIndex]
      if (!sub) continue
      const thayDoi = capNhatTuKetQuaAi(kq, luc)
      await capNhatBaiNop(sub.id, thayDoi)
      suaBaiTaiCho(hs.id, sub.id, thayDoi)
      setMucChon(prev => ({ ...prev, [sub.id]: mucTuDiem(kq.score) || '' }))
      setNhanXet(prev => ({ ...prev, [sub.id]: kq.comment }))
    }
  }

  /** AI chấm các em đang hiện có bài mới; hết lượt/phút thì đợi 60 giây rồi chấm tiếp, hết lượt/ngày thì dừng */
  async function aiChamTatCa(hocSinh) {
    const canCham = hocSinh.filter(s => canAiCham(submissionMap[s.id]))
    if (!canCham.length) { toast('Không có bài mới nào cần chấm'); return }
    setAiDangCham({ active: true, done: 0, total: canCham.length, countdown: 0 })
    for (let i = 0; i < canCham.length; i++) {
      try {
        await aiChamMotEm(canCham[i])
        setAiDangCham(prev => ({ ...prev, done: i + 1 }))
      } catch (err) {
        if (err.quotaType === 'quota_rpm') {
          for (let s = 60; s > 0; s--) { setAiDangCham(prev => ({ ...prev, countdown: s })); await cho(1000) }
          setAiDangCham(prev => ({ ...prev, countdown: 0 }))
          i--; continue
        }
        if (err.quotaType === 'quota_rpd') { toast.error(`Hết quota hôm nay! Đã chấm ${i}/${canCham.length} học sinh.`); break }
        toast.error(`Lỗi: ${canCham[i].full_name} — ${err.message}`)
      }
      if (i < canCham.length - 1) await cho(4000)
    }
    setAiDangCham({ active: false, done: 0, total: 0, countdown: 0 })
    toast.success('AI đã chấm xong!')
  }

  async function duyetMucAi(sub, hs) {
    const thayDoi = capNhatKhiDuyetAi(sub)
    await capNhatBaiNop(sub.id, thayDoi)
    suaBaiTaiCho(hs.id, sub.id, thayDoi)
    if (thayDoi.muc) await thuongSticker(sub, hs, thayDoi.muc)
  }

  /** duyệt mọi bài AI chấm chưa duyệt của các em đang hiện; trả true nếu đã duyệt */
  async function duyetHetMucAi(hocSinh) {
    const canDuyet = hocSinh.flatMap(hs => (submissionMap[hs.id] || [])
      .filter(sub => sub.graded_by === 'ai' && !sub.reviewed_at).map(sub => ({ sub, hs })))
    if (!canDuyet.length) { toast('Không có bài AI nào chưa duyệt'); return false }
    setDangDuyetHet(true)
    const luc = new Date().toISOString()
    const ds = canDuyet.map(x => ({ ...x, thayDoi: capNhatKhiDuyetAi(x.sub, luc) }))
    await Promise.all(ds.map(({ sub, thayDoi }) => capNhatBaiNop(sub.id, thayDoi)))
    ds.forEach(({ sub, hs, thayDoi }) => suaBaiTaiCho(hs.id, sub.id, thayDoi))
    // cộng sticker lần lượt từng bài (phần còn thiếu so với số bài đó đã được thưởng)
    for (const { sub, hs, thayDoi } of ds) if (thayDoi.muc) await thuongStickerTheoMuc(sub.id, hs.id, thayDoi.muc)
    setDangDuyetHet(false)
    toast.success(`Đã duyệt ${ds.length} bài AI!`)
    return true
  }

  return {
    nhanXet, mucChon, dangLuu, aiDangCham, dangDuyetHet,
    datNhanXet: (id, v) => setNhanXet(prev => ({ ...prev, [id]: v })),
    datMuc: (id, v) => setMucChon(prev => ({ ...prev, [id]: v })),
    moSoan, luuNhanXet, doiChoNopLai, aiChamMotEm, aiChamTatCa, duyetMucAi, duyetHetMucAi,
  }
}
