// Phần THỰC HÀNH của trang Học bài: danh sách bài nộp theo từng ô bài, chọn tệp / ghi chú, nộp, nộp lại,
// chờ thầy cô nhận xét (hỏi lại định kỳ, nhẹ), AI chấm (chỉ khi bật chế độ AI trực tiếp — hiện tắt cố định).
// Trang Học bài chỉ việc gọi hook này và truyền kết quả xuống BanDoBaiThucHanh / ChiTietBaiThucHanh.
import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { STUDENT_AI_DIRECT, feedbackVisible } from '../lib/aiMode'
import { uploadFile, deleteFile } from '../lib/cloudinary'
import { gradeStudent } from '../utils/aiGrader'
import { parseTasks } from '../domain/baiThucHanh'
import { capNhatTuKetQuaAi } from '../domain/chamBai'
import { layBaiNopCuaEm, layTrangThaiCham, layBaiNopTheoIds, nopBaiMoi, nopLaiBai, capNhatBaiNop } from '../data/baiNop'

/**
 * @param id              mã bài học
 * @param user            người đang đăng nhập
 * @param lesson          bài học (null khi chưa tải)
 * @param loading         trang còn đang tải
 * @param upsertProgress  ghi tiến độ bài (đánh dấu đã nộp đủ thực hành)
 * @param recordActivity  ghi ngày học (chuỗi ngày)
 * @param taiLai          tải lại cả trang (khi phát hiện đã nộp ở tab khác)
 */
export function useBaiThucHanh({ id, user, lesson, loading, upsertProgress, recordActivity, taiLai }) {
  const [taskSubmissions, setTaskSubmissions] = useState([])   // submission|null per task
  const [taskFiles, setTaskFiles] = useState([])               // File|null per task
  const [taskNotes, setTaskNotes] = useState([])               // string per task
  const [raSoatTruoc, setRaSoatTruoc] = useState({})            // kết quả rà soát TRƯỚC khi nộp của file đang chọn, theo ô bài
  const [taskSubmitting, setTaskSubmitting] = useState(null)   // task index being submitted
  const [resubmitTask, setResubmitTask] = useState(null)       // task index in resubmit mode
  const [aiGradingTask, setAiGradingTask] = useState(null)     // task index being AI graded
  const [activeTaskIdx, setActiveTaskIdx] = useState(null)     // task popup index

  /** tải bài nộp của em cho bài học này, xếp theo ô bài */
  async function napBaiNop(lessonData) {
    const tasks = parseTasks(lessonData.practice_instructions)
    const { data: subData } = await layBaiNopCuaEm(user.id, id)
    const subs = Array(tasks.length).fill(null)
    ;(subData || []).forEach(s => {
      const tidx = s.content_json?.task_index ?? 0
      if (tidx >= 0 && tidx < tasks.length) subs[tidx] = s
    })
    setTaskSubmissions(subs)
    setTaskFiles(Array(tasks.length).fill(null))
    setTaskNotes(Array(tasks.length).fill(''))
  }

  async function triggerAiGrade(sub, taskIdx, { retry = true } = {}) {
    // Mặc định học sinh không kích hoạt AI: bài chờ giáo viên chấm (có AI hỗ trợ) và duyệt
    if (!sub || !STUDENT_AI_DIRECT) return
    // Cooldown: không chấm lại nếu AI vừa chấm trong 5 phút
    if (sub.ai_graded_at) {
      const elapsed = Date.now() - new Date(sub.ai_graded_at).getTime()
      if (elapsed < 5 * 60 * 1000) return
    }
    const taskDefs = parseTasks(lesson?.practice_instructions)
    const taskDef = taskDefs[taskIdx]
    if (!taskDef) return
    // Jitter ngẫu nhiên 1–4s để cả lớp không gửi cùng lúc (trước đây 2–15s: học sinh hay rời trang trước khi kịp chấm)
    await new Promise(r => setTimeout(r, 1000 + Math.random() * 3000))
    setAiGradingTask(taskIdx)
    try {
      const { results } = await gradeStudent([sub], [taskDef])
      const result = results[0]
      if (!result) return
      const updates = capNhatTuKetQuaAi(result)
      await capNhatBaiNop(sub.id, updates)
      setTaskSubmissions(prev => { const next = [...prev]; next[taskIdx] = { ...sub, ...updates }; return next })
    } catch (err) {
      // Lỗi tạm thời (mạng, AI quá tải theo phút) → thử lại 1 lần sau 20 giây; hết lượt cả ngày thì thôi,
      // lần sau học sinh mở lại bài sẽ được chấm bù (xem effect "chấm bù" bên dưới)
      if (retry && err?.quotaType !== 'quota_rpd') {
        setAiGradingTask(null)
        await new Promise(r => setTimeout(r, 20000))
        return triggerAiGrade(sub, taskIdx, { retry: false })
      }
    }
    finally { setAiGradingTask(null) }
  }

  // Chấm bù: bài đã nộp mà AI chưa chấm (học sinh rời trang trước khi kịp chấm, hoặc AI lỗi lúc đó)
  // → khi học sinh mở lại bài học thì chấm lần lượt từng bài. Mỗi lần mở trang chỉ chạy 1 lượt.
  // Bài đã nộp mà học sinh chưa thấy nhận xét (chờ giáo viên duyệt / máy chủ chấm bù): khi trang đang mở thì
  // định kỳ hỏi lại để nhận xét tự hiện ngay khi có, học sinh không phải tải lại trang.
  // Chỉ hỏi các cột trạng thái (nhẹ); bài nào đã hiện được nhận xét mới tải đầy đủ. Dừng sau 30 phút
  // (chờ giáo viên duyệt có thể mất cả ngày — hỏi mãi làm máy chủ nano quá tải).
  useEffect(() => {
    const choIds = taskSubmissions.filter(s => s && !feedbackVisible(s)).map(s => s.id)
    if (!choIds.length) return
    const batDau = Date.now()
    const t = setInterval(async () => {
      if (Date.now() - batDau > 30 * 60000) { clearInterval(t); return }
      if (document.hidden) return
      const { data } = await layTrangThaiCham(choIds)
      const xongIds = (data || []).filter(feedbackVisible).map(r => r.id)
      if (!xongIds.length) return
      const { data: moi } = await layBaiNopTheoIds(xongIds)
      if (moi?.length) setTaskSubmissions(prev => prev.map(s => (s && moi.find(r => r.id === s.id)) || s))
    }, STUDENT_AI_DIRECT ? 20000 : 180000)
    return () => clearInterval(t)
  }, [taskSubmissions])

  const catchupDone = useRef(false)
  useEffect(() => {
    if (loading || !lesson || catchupDone.current || !STUDENT_AI_DIRECT) return
    const pending = taskSubmissions
      .map((sub, i) => ({ sub, i }))
      .filter(({ sub }) => sub && sub.score == null && !sub.graded_by && !sub.ai_graded_at
        && Date.now() - new Date(sub.submitted_at).getTime() > 60 * 1000)
    if (!pending.length) return
    catchupDone.current = true
    ;(async () => {
      for (const { sub, i } of pending) await triggerAiGrade(sub, i, { retry: false })
    })()
  }, [loading, lesson, taskSubmissions]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleTaskResubmit(taskIdx) {
    const file = taskFiles[taskIdx]
    const note = taskNotes[taskIdx] || ''
    const existingSub = taskSubmissions[taskIdx]
    // Bắt buộc phải có file (mới chọn hoặc file cũ đã nộp) — ghi chú không thay thế được
    // file, tránh nộp bài trống/không liên quan tới đề mà vẫn được AI chấm điểm.
    if (!file && !existingSub?.file_url) {
      toast.error('Vui lòng chọn file để nộp bài')
      return
    }
    setTaskSubmitting(taskIdx)
    try {
      const oldUrl = existingSub?.file_url ?? null
      let fileUrl = oldUrl
      if (file) fileUrl = await uploadFile(file)
      const luc = new Date().toISOString()
      const { data: updated, error } = await nopLaiBai(existingSub.id, {
          file_url: fileUrl,
          file_name: file ? file.name : (existingSub?.file_name ?? null),
          text_content: note.trim() || null,
          submitted_at: luc,
          // Lần rà soát trước khi nộp (nếu em đã rà soát file này) → thầy cô thấy ở trang Chấm bài
          ra_soat: file && raSoatTruoc[taskIdx] ? { ...raSoatTruoc[taskIdx], phien: luc } : null,
          allow_resubmit: false,
          reviewed_at: null,
          score: null,
          muc: null,
          teacher_comment: null,
          graded_by: null,
          ai_graded_at: null,
          // Bảng tiêu chí / cờ nghi của AI thuộc bản nộp cũ (ai_score học sinh không ghi được, trang Chấm bài tự bỏ qua)
          ai_breakdown: null,
          ai_suspect: false,
          ai_suspect_reason: null,
        })
      if (error) throw error
      // Nộp file mới → xóa file cũ trên Cloudinary cho đỡ tốn dung lượng
      if (file && oldUrl && oldUrl !== fileUrl) deleteFile(oldUrl)
      const newSubs = [...taskSubmissions]; newSubs[taskIdx] = updated; setTaskSubmissions(newSubs)
      setResubmitTask(null)
      triggerAiGrade(updated, taskIdx)
      const nf = [...taskFiles]; nf[taskIdx] = null; setTaskFiles(nf)
      const nn = [...taskNotes]; nn[taskIdx] = ''; setTaskNotes(nn)
      toast.success(`Đã cập nhật bài ${taskIdx + 1}`)
    } catch (err) {
      toast.error('Nộp lại thất bại: ' + err.message)
    } finally {
      setTaskSubmitting(null)
    }
  }

  async function handleTaskSubmit(taskIdx) {
    const file = taskFiles[taskIdx]
    const note = taskNotes[taskIdx] || ''
    // Bắt buộc phải có file — ghi chú chỉ là phần thêm, không thay thế được file, tránh
    // nộp bài trống/không liên quan tới đề mà vẫn được AI chấm điểm.
    if (!file) {
      toast.error('Vui lòng chọn file để nộp bài')
      return
    }
    setTaskSubmitting(taskIdx)
    try {
      let fileUrl = null
      if (file) fileUrl = await uploadFile(file)
      const luc = new Date().toISOString()
      const { data: subInserted, error } = await nopBaiMoi({
        user_id: user.id,
        lesson_id: id,
        file_url: fileUrl,
        file_name: file ? file.name : null,
        text_content: note.trim() || null,
        content_json: { task_index: taskIdx },
        submitted_at: luc,
        // Lần rà soát trước khi nộp (nếu có) → thầy cô thấy "em đã rà soát n lần" ở trang Chấm bài
        ...(raSoatTruoc[taskIdx] && { ra_soat: { ...raSoatTruoc[taskIdx], phien: luc } }),
      }).select().single()
      if (error) {
        // Máy chủ chặn nộp trùng (thường do đã nộp ở tab khác) → tải lại để thấy bài đã nộp và nút "Nộp lại"
        if (error.code === '23505' || /duplicate_submission/.test(error.message || '')) {
          toast.error('Bài này em đã nộp rồi (có thể ở tab khác). Muốn đổi bài thì bấm "Nộp lại" nhé.')
          if (fileUrl) deleteFile(fileUrl)
          taiLai()
          return
        }
        throw error
      }
      const newSubs = [...taskSubmissions]
      newSubs[taskIdx] = subInserted
      setTaskSubmissions(newSubs)
      // Bài đọc thêm (optional) không cần nộp — đủ các bài bắt buộc là tính đã nộp thực hành
      const tasksNow = parseTasks(lesson?.practice_instructions)
      if (newSubs.every((s, k) => s !== null || tasksNow[k]?.optional)) {
        await upsertProgress({ practice_submitted: true })
      }
      // Từ 07/11/2026 không thưởng sticker khi nộp (học sinh nộp file bừa để lấy sticker) — chỉ thưởng khi thầy cô duyệt
      toast.success(`Đã nộp bài thực hành ${taskIdx + 1}! 📝 Thầy cô duyệt xong em sẽ nhận sticker theo mức.`)
      recordActivity()
      triggerAiGrade(subInserted, taskIdx)
    } catch (err) {
      toast.error('Nộp bài thất bại: ' + err.message)
    } finally {
      setTaskSubmitting(null)
    }
  }

  // ── thao tác trên ô bài đang mở (giao diện gọi) ──
  function chonFile(i, f) {
    const next = [...taskFiles]; next[i] = f; setTaskFiles(next)
    setRaSoatTruoc(prev => ({ ...prev, [i]: null }))
  }
  function doiGhiChu(i, text) {
    const next = [...taskNotes]; next[i] = text; setTaskNotes(next)
  }
  function ghiRaSoatTruoc(i, kq) {
    setRaSoatTruoc(prev => ({ ...prev, [i]: kq }))
  }
  function batDauNopLai(i) {
    const nn = [...taskNotes]; nn[i] = taskSubmissions[i]?.text_content || ''; setTaskNotes(nn)
    setResubmitTask(i)
  }
  function huyNopLai(i) {
    setResubmitTask(null)
    const nf = [...taskFiles]; nf[i] = null; setTaskFiles(nf)
    const nn = [...taskNotes]; nn[i] = ''; setTaskNotes(nn)
  }
  function dongBai(i) {
    setActiveTaskIdx(null)
    if (resubmitTask === i) huyNopLai(i)
  }
  function capNhatMotBaiNop(moi) {
    setTaskSubmissions(prev => prev.map(x => (x && x.id === moi.id ? moi : x)))
  }
  function nop(i) {
    return resubmitTask === i ? handleTaskResubmit(i) : handleTaskSubmit(i)
  }

  return {
    taskSubmissions, taskFiles, taskNotes, taskSubmitting, resubmitTask, aiGradingTask, activeTaskIdx,
    napBaiNop, setActiveTaskIdx, chonFile, doiGhiChu, ghiRaSoatTruoc, batDauNopLai, huyNopLai, dongBai,
    capNhatMotBaiNop, nop,
  }
}
