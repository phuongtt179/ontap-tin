import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { layCauHoiTheoIds } from '../../data/cauHoi'
import { layLopCuaEm } from '../../data/ghiDanh'
import { buildWeaknessProfile } from '../../utils/weakness'
import { STUDENT_AI_DIRECT, feedbackVisible } from '../../lib/aiMode'
import toast from 'react-hot-toast'
import { ArrowLeft, CheckCircle, PlayCircle, BookOpen, Upload, Loader2, Send, FileText, File, Lock, Lightbulb, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { uploadFile, deleteFile } from '../../lib/cloudinary'
import MarkdownContent from '../../components/ui/MarkdownContent'
import StickerModal from '../../components/student/StickerModal'
import RewardModal from '../../components/student/RewardModal'
import { updateStreak } from '../../utils/updateStreak'
import { NGUONG_DOI_QUA_MAC_DINH } from '../../domain/sticker'
import { gradeStudent } from '../../utils/aiGrader'
import PDFViewer from '../../components/ui/PDFViewer'
import AskTutorModal from '../../components/student/AskTutorModal'
import PyTestStatus from '../../components/student/PyTestStatus'
import RaSoatLoi from '../../components/student/RaSoatLoi'
import { MUC, mucCua } from '../../utils/muc'
import { topicKeyOf } from '../../utils/lessonSteps'
import { parseTasks } from '../../domain/baiThucHanh'
import { trangThaiBuoc } from '../../domain/tienDoBaiHoc'
import { layBaiNopCuaEm, layTieuChiGanDay, layTrangThaiCham, layBaiNopTheoIds, nopBaiMoi, nopLaiBai, capNhatBaiNop } from '../../data/baiNop'
import { capNhatTuKetQuaAi } from '../../domain/chamBai'
import { layBaiHocTheoId, layDanhSachBai } from '../../data/baiHoc'
import { FileIcon, SubmittedFile } from '../../components/student/baiHoc/TepDaNop'
import { LessonQuiz } from '../../components/student/baiHoc/LessonQuiz'
import { DoneChip, ActionButton, SectionCard } from '../../components/student/baiHoc/KhungMuc'
// Bài giảng web (trình chiếu) – tải khi bài có bài giảng web
const LessonSlidesViewer = lazy(() => import('../../components/slides/LessonSlidesViewer.jsx'))


/* ── Helpers ───────────────────────────────────────────────── */
function getEmbedUrl(url) {
  if (!url) return null
  const m = url.match(/(?:youtu\.be\/|[?&]v=)([a-zA-Z0-9_-]{11})/)
  if (m) return `https://www.youtube.com/embed/${m[1]}`
  if (url.includes('/embed/')) return url
  return null
}

// tự luận không chấm tự động → coi như đúng để học sinh đi tiếp
/* ── LessonPage ────────────────────────────────────────────── */
export default function LessonPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, profile } = useAuth()

  const [lesson, setLesson] = useState(null)
  const [questions, setQuestions] = useState([])
  const [progress, setProgress] = useState(null)
  const [taskSubmissions, setTaskSubmissions] = useState([])   // submission|null per task
  const [taskFiles, setTaskFiles] = useState([])               // File|null per task
  const [taskNotes, setTaskNotes] = useState([])               // string per task
  const [raSoatTruoc, setRaSoatTruoc] = useState({})            // kết quả rà soát TRƯỚC khi nộp của file đang chọn, theo ô bài
  const [taskSubmitting, setTaskSubmitting] = useState(null)   // task index being submitted
  const [resubmitTask, setResubmitTask] = useState(null)       // task index in resubmit mode
  const [aiGradingTask, setAiGradingTask] = useState(null)     // task index being AI graded
  const [activeTaskIdx, setActiveTaskIdx] = useState(null)     // task popup index
  const [loading, setLoading] = useState(true)
  const [quizActive, setQuizActive] = useState(false)
  const [quizInitIdx, setQuizInitIdx] = useState(0)
  const [quizInitCorrect, setQuizInitCorrect] = useState(0)
  const [theoryMarking, setTheoryMarking] = useState(false)
  const [leftPanelHidden, setLeftPanelHidden] = useState(false)
  const [videoMarking, setVideoMarking] = useState(false)
  const [stickerModal, setStickerModal] = useState(null) // { stickerCount, stickerTotal, threshold, reason }
  const [showReward, setShowReward] = useState(null)    // { stickerCount, threshold } | null
  const [stickerThreshold, setStickerThreshold] = useState(NGUONG_DOI_QUA_MAC_DINH)
  const [studentGrade, setStudentGrade] = useState(null)
  const [tutor, setTutor] = useState(null)   // { mode, context } | null
  const [newAnswers, setNewAnswers] = useState(0)  // số câu thầy cô vừa trả lời mà em chưa xem (chế độ giáo viên trung gian)
  const [courseScope, setCourseScope] = useState('')       // mô tả khóa cho AI
  const [lessonsCompleted, setLessonsCompleted] = useState(0)  // số bài đã hoàn thành (ước lượng trình độ)
  const [weaknessProfile, setWeaknessProfile] = useState('')    // lỗi em hay gặp (cho gia sư AI cá nhân hóa)
  const [courseRoadmap, setCourseRoadmap] = useState('')   // lộ trình khóa (cho AI trả lời câu hỏi chương trình)
  const wasCompleted = useRef(false)
  const [pptxMarking, setPptxMarking] = useState(false)
  const [webSlides, setWebSlides] = useState(null)   // bài giảng web (lesson_slides) – có thì hiện thay PPTX

  useEffect(() => {
    if (user) loadAll()
  }, [id, user?.id])

  async function loadAll() {
    setLoading(true)
    // 1. Fetch lesson + student grade + threshold
    const { data: lessonData } = await layBaiHocTheoId(id)
    if (!lessonData) { toast.error('Không tìm thấy bài học'); navigate(-1); return }
    if (lessonData.restricted_audience) {
      const { data: visRow } = await supabase.from('lesson_visibility')
        .select('id').eq('lesson_id', id).eq('user_id', user.id).maybeSingle()
      if (!visRow) { toast.error('Bài học này chưa mở cho em'); navigate(-1); return }
    }
    if (lessonData.has_slides) {
      supabase.from('lesson_slides').select('slides').eq('lesson_id', id).maybeSingle()
        .then(({ data }) => setWebSlides(data?.slides?.length ? data.slides : null))
    } else setWebSlides(null)

    // Chặn truy cập bài bị KHOÁ (chưa publish, hoặc đã publish nhưng chủ đề/
    // bài chưa được mở cho LỚP của học sinh) — trang con đường bài học chỉ
    // ẩn nút bấm ở giao diện, không chặn được nếu học sinh vào thẳng URL
    // (vd qua link AI trợ giảng gợi ý, gõ tay, bookmark...). Đây là điểm
    // chặn THẬT SỰ — phải kiểm tra lại độc lập, không tin UI trước đó.
    if (!lessonData.is_published) {
      toast.error('Bài học này chưa được mở'); navigate(-1); return
    }
    const { data: enrollRow } = await layLopCuaEm(user.id, lessonData.grade)
    const className = enrollRow?.class_name || null
    let topicUnlockSet = null   // null = không thuộc lớp nào -> không giới hạn
    let lessonUnlockSet = null
    if (className) {
      const [{ data: topicUnlockRows }, { data: lessonUnlockRows }] = await Promise.all([
        supabase.from('class_topic_unlock').select('topic')
          .eq('grade', lessonData.grade).eq('class_name', className),
        supabase.from('class_lesson_unlock').select('lesson_id')
          .eq('grade', lessonData.grade).eq('class_name', className),
      ])
      topicUnlockSet = new Set((topicUnlockRows || []).map(r => r.topic))
      lessonUnlockSet = new Set((lessonUnlockRows || []).map(r => r.lesson_id))
      const topicOpen = topicUnlockSet.has(topicKeyOf(lessonData))
      const lessonOpen = lessonUnlockSet.has(lessonData.id)
      if (!topicOpen || !lessonOpen) {
        toast.error('Bài học này chưa được mở cho lớp của em'); navigate(-1); return
      }
    }

    setLesson(lessonData)

    // Khoá của bài đang học (profiles không còn cột grade từ khi chuyển sang ghi danh theo lớp)
    const grade = lessonData.grade || null
    setStudentGrade(grade)
    if (grade) {
      const { data: cfgData } = await supabase.from('reward_configs').select('sticker_threshold').eq('grade', grade).maybeSingle()
      if (cfgData?.sticker_threshold) setStickerThreshold(cfgData.sticker_threshold)
    }

    // 1b. Mô tả khóa cho AI + số bài đã hoàn thành (ước lượng trình độ)
    if (lessonData.grade) {
      supabase.from('grades').select('ai_scope').eq('value', lessonData.grade).maybeSingle()
        .then(({ data }) => setCourseScope(data?.ai_scope || ''))

      // Lộ trình khóa: đơn vị (sort_order) → bài (order) — cho AI trả lời câu hỏi chương trình học.
      // CHỈ lấy bài đã mở khoá cho lớp — không để AI biết/gợi ý tên bài học
      // sinh chưa được mở (xem cùng lý do ở useLearnData.js).
      Promise.all([
        supabase.from('units').select('id, name, sort_order').eq('grade', lessonData.grade).order('sort_order'),
        layDanhSachBai(lessonData.grade, { xuatBan: true }),
      ]).then(([uRes, lRes]) => {
        const us = uRes.data || []
        const ls = (lRes.data || []).filter(l =>
          topicUnlockSet == null || (topicUnlockSet.has(topicKeyOf(l)) && lessonUnlockSet.has(l.id)))
        const lines = []
        us.forEach(u => {
          const titles = ls.filter(l => l.unit_id === u.id).map(l => l.title)
          if (titles.length) lines.push(`• ${u.name}: ${titles.join(', ')}`)
        })
        const noUnit = ls.filter(l => !l.unit_id).map(l => l.title)
        if (noUnit.length) lines.push(`• Bài khác: ${noUnit.join(', ')}`)
        setCourseRoadmap(lines.join('\n'))
      })
    }
    supabase.from('lesson_progress').select('id', { count: 'exact', head: true })
      .eq('user_id', user.id).eq('completed', true)
      .then(({ count }) => setLessonsCompleted(count || 0))

    if (!STUDENT_AI_DIRECT) {
      supabase.from('student_questions').select('id', { count: 'exact', head: true })
        .eq('student_id', user.id).eq('lesson_id', id).eq('status', 'answered').is('seen_at', null)
        .then(({ count }) => setNewAnswers(count || 0))
    }

    // Hồ sơ lỗi hay gặp của chính em (từ bảng điểm AI các bài gần đây) → gia sư gợi ý đúng chỗ em hay vướng.
    // Lỗi truy vấn không ảnh hưởng gì tới trang học: chỉ đơn giản là không có hồ sơ.
    // Chỉ gia sư AI trực tiếp mới dùng — đang tắt thì không tải (tốn ~10% thời gian SQL phía học sinh).
    if (STUDENT_AI_DIRECT) {
      layTieuChiGanDay(user.id)
        .then(({ data }) => setWeaknessProfile(buildWeaknessProfile(data)))
        .catch(() => {})
    }

    // 2. Fetch questions if any
    if (lessonData.question_ids?.length > 0) {
      const { data: qData } = await layCauHoiTheoIds(lessonData.question_ids)
      setQuestions(qData || [])
    }

    // 3. Fetch progress
    const { data: progData } = await supabase.from('lesson_progress')
      .select('*').eq('user_id', user.id).eq('lesson_id', id).maybeSingle()
    setProgress(progData || null)
    wasCompleted.current = !!progData?.completed // đánh dấu để không hiện modal lại

    // 4. Fetch all task submissions
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

    setLoading(false)
  }

  // Thưởng sticker "nộp bài" / "đạt bài kiểm tra" qua máy chủ: mỗi bài chỉ thưởng ĐÚNG 1 LẦN dù mở bao nhiêu tab
  // (máy chủ tự kiểm tra đã nộp/đã đạt thật chưa và tự tính số sticker — xem migration_sticker_once.sql)
  async function awardOnce(kind, taskIdx, reasonFn) {
    const { data, error } = await supabase.rpc('award_sticker_once', { p_kind: kind, p_lesson: id, p_task: taskIdx ?? 0 })
    if (error) { toast.error('Không cộng được sticker: ' + error.message); return false }
    if (!data?.awarded) return false
    setStickerModal({ stickerCount: data.sticker_count, stickerTotal: data.sticker_total, threshold: stickerThreshold, reason: reasonFn(data.count), count: data.count })
    return true
  }

  async function recordActivity() {
    const result = await updateStreak(user.id)
    if (!result?.isNew) return
    if (result.milestone) {
      // Sticker mốc chuỗi đã được máy chủ cộng trong record_activity — ở đây chỉ hiện thông báo
      const { stickers, emoji, label } = result.milestone
      setStickerModal({ stickerCount: result.stickerCount, stickerTotal: result.stickerTotal, threshold: stickerThreshold,
        reason: `${emoji} ${label} Nhận ${stickers} sticker thưởng! 🎉`, count: stickers })
    } else if (result.streakDays > 1) {
      toast(`🔥 ${result.streakDays} ngày học liên tiếp!`, { duration: 3000 })
    } else {
      toast('🌟 Bắt đầu chuỗi ngày học mới!', { duration: 2500 })
    }
  }

  async function upsertProgress(updates) {
    const current = progress || {}
    const newData = { ...current, ...updates, user_id: user.id, lesson_id: id }
    const completed = trangThaiBuoc(lesson, newData).hoanThanh
    const { data, error } = await supabase.from('lesson_progress').upsert(
      { ...newData, completed, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,lesson_id' }
    ).select().single()
    if (!error && data) {
      setProgress(data)
      if (completed) wasCompleted.current = true
    }
    return { data, error }
  }

  async function handleMarkTheoryRead() {
    setTheoryMarking(true)
    const { error } = await upsertProgress({ theory_read: true })
    setTheoryMarking(false)
    if (error) toast.error('Có lỗi xảy ra')
    else { toast.success('Đã đánh dấu đọc lý thuyết'); recordActivity() }
  }

  async function handleMarkVideoWatched() {
    setVideoMarking(true)
    const { error } = await upsertProgress({ video_watched: true })
    setVideoMarking(false)
    if (error) toast.error('Có lỗi xảy ra')
    else { toast.success('Đã đánh dấu xem video'); recordActivity() }
  }

  async function handleMarkPptxViewed() {
    setPptxMarking(true)
    const { error } = await upsertProgress({ pptx_viewed: true })
    setPptxMarking(false)
    if (error) toast.error('Có lỗi xảy ra')
    else { toast.success('Đã đánh dấu xem bài giảng'); recordActivity() }
  }

  function startQuiz(fromScratch = false) {
    if (!fromScratch && progress?.quiz_current_idx > 0 && !progress?.quiz_passed) {
      setQuizInitIdx(progress.quiz_current_idx)
      setQuizInitCorrect(progress.quiz_correct || 0)
    } else {
      setQuizInitIdx(0)
      setQuizInitCorrect(0)
      if (fromScratch) upsertProgress({ quiz_current_idx: 0, quiz_correct: 0 })
    }
    setQuizActive(true)
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

  async function handleQuizSubmit({ correct, total, passed }) {
    // Đã đạt rồi thì giữ "đạt" (làm lại ở tab khác mà trượt cũng không mất trạng thái đạt)
    const keepPassed = passed || !!progress?.quiz_passed
    await upsertProgress({ quiz_correct: correct, quiz_total: total, quiz_passed: keepPassed, quiz_current_idx: 0 })
    if (passed && await awardOnce('quiz', 0, () => `Vượt qua bài kiểm tra! (${correct}/${total} câu đúng) 🎯`)) {
      recordActivity()
    } else if (passed) {
      toast.success('Chúc mừng! Bạn đã đạt bài tập')
    } else {
      toast('Chưa đạt, hãy thử lại nhé!', { icon: '📖' })
    }
  }

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
          loadAll()
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

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    )
  }

  if (!lesson) return null

  function openTutor(mode, extra = {}) {
    setTutor({
      mode,
      context: {
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        lessonDescription: lesson.description || '',
        // Lý thuyết (học sinh thấy) + ghi chú riêng cho gia sư soạn từ slide (học sinh không thấy)
        aiContext: [lesson.ai_context, lesson.ai_tutor_notes].filter(s => s?.trim()).join('\n\n'),
        courseScope,
        courseRoadmap,
        // Không gửi tên học sinh sang AI (bảo vệ dữ liệu cá nhân trẻ em)
        lessonsCompleted,
        weaknessProfile,
        ...extra,
      },
    })
  }

  // quy tắc bước / hoàn thành: src/domain/tienDoBaiHoc.js (ở đây đếm quiz theo số câu thực tế tải được)
  const buoc = trangThaiBuoc(lesson, progress, questions.length)
  const { theory: hasTheory, video: hasVideo, pptx: hasPptx, quiz: hasQuiz, practice: hasPractice } = buoc.co
  const embedUrl = getEmbedUrl(lesson.video_url)
  const practiceTasks = parseTasks(lesson.practice_instructions)
  // Chỉ đếm bài bắt buộc (bài đọc thêm — optional — không cần nộp)
  const requiredCount = practiceTasks.filter(t => !t?.optional).length
  const submittedCount = taskSubmissions.filter((s, k) => s && !practiceTasks[k]?.optional).length

  const { theory: theoryOk, video: videoOk, pptx: pptxOk, quiz: quizOk, practice: practiceOk } = buoc.xong
  const totalSteps = buoc.tongBuoc, doneSteps = buoc.soBuocXong

  const pptxLocked = false
  const quizLocked = false
  const practiceLocked = false

  const steps = [
    hasTheory && { key: 'theory', label: 'Lý thuyết', icon: <Lightbulb size={16} />, done: theoryOk, locked: false },
    hasVideo && { key: 'video', label: 'Video', icon: <PlayCircle size={16} />, done: videoOk, locked: false },
    hasPptx && { key: 'pptx', label: 'Bài giảng', icon: <FileText size={16} />, done: pptxOk, locked: pptxLocked },
    hasQuiz && { key: 'quiz', label: 'Bài tập', icon: <BookOpen size={16} />, done: quizOk, locked: quizLocked },
    hasPractice && { key: 'practice', label: 'Thực hành', icon: <Upload size={16} />, done: practiceOk, locked: practiceLocked },
  ].filter(Boolean)

  return (
    <div className="min-h-full bg-gray-50 flex flex-col">
      {/* Sticker modal */}
      {stickerModal && (
        <StickerModal
          stickerCount={stickerModal.stickerCount}
          stickerTotal={stickerModal.stickerTotal}
          threshold={stickerModal.threshold}
          reason={stickerModal.reason}
          count={stickerModal.count}
          onClose={() => setStickerModal(null)}
          onRedeem={stickerModal.stickerCount >= stickerModal.threshold
            ? () => setShowReward({ stickerCount: stickerModal.stickerCount, threshold: stickerModal.threshold })
            : undefined}
        />
      )}
      {/* Reward modal */}
      {showReward && (
        <RewardModal
          stickerCount={showReward.stickerCount}
          threshold={showReward.threshold}
          grade={studentGrade}
          onClose={() => { setShowReward(null); setStickerModal(null) }}
          onRedeemed={() => { setShowReward(null); setStickerModal(null) }}
        />
      )}

      {/* AI trợ giảng */}
      <AskTutorModal
        open={!!tutor}
        mode={tutor?.mode}
        context={tutor?.context || {}}
        studentId={user.id}
        onClose={() => { setTutor(null); setNewAnswers(0) }}
      />

      {/* Nút nổi "Hỏi trợ giảng" — hỏi lý thuyết cả bài */}
      <button onClick={() => openTutor('theory')}
        className="fixed z-40 bottom-5 right-5 flex items-center gap-2 bg-gradient-to-r from-violet-500 to-indigo-500 text-white font-bold text-sm px-4 py-3 rounded-full shadow-xl shadow-indigo-300/50 hover:scale-105 active:scale-95 transition-all">
        <span className="text-lg leading-none">🤖</span>
        <span className="hidden sm:inline">{STUDENT_AI_DIRECT ? 'Hỏi trợ giảng' : 'Hỏi thầy cô'}</span>
        {newAnswers > 0 && <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[11px] font-black flex items-center justify-center">{newAnswers}</span>}
      </button>

      {/* ── Hero gradient ── */}
      <div className="bg-gradient-to-r from-[#003d8f] via-[#0055bb] to-[#0077dd] text-white px-5 pt-5 pb-4 md:px-8 shrink-0">
        <div className="max-w-5xl mx-auto">
          <button onClick={() => navigate('/student/learn')}
            className="flex items-center gap-1.5 text-white/60 hover:text-white text-sm mb-4 transition">
            <ArrowLeft size={15} /> Bài học
          </button>
          <h1 className="text-xl md:text-2xl font-bold leading-tight">{lesson.title}</h1>
          {lesson.description && <p className="text-blue-200 text-sm mt-1">{lesson.description}</p>}

          {/* Stepper */}
          {steps.length > 0 && (
            <div className="flex items-center mt-6 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              {steps.map((step, i) => (
                <div key={step.key} className="flex items-center flex-1 min-w-0">
                  <div className="flex flex-col items-center shrink-0">
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center border-2 transition-all duration-300
                      ${step.done
                        ? 'bg-green-400 border-green-300 shadow-lg shadow-green-500/40'
                        : !step.locked
                        ? 'bg-white border-white shadow-lg'
                        : 'bg-white/10 border-white/20'}`}
                      style={!step.done && !step.locked ? { animation: 'node-breathe 2s ease-in-out infinite' } : {}}>
                      {step.done
                        ? <CheckCircle size={20} className="text-white" />
                        : step.locked
                        ? <Lock size={15} className="text-white/30" />
                        : <span className="text-indigo-700">{step.icon}</span>}
                    </div>
                    <span className={`text-[10px] font-semibold mt-1.5 whitespace-nowrap
                      ${step.done ? 'text-green-300' : !step.locked ? 'text-white' : 'text-white/30'}`}>
                      {step.label}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 mb-4 rounded-full min-w-[16px] transition-all duration-500
                      ${step.done ? 'bg-green-400/70' : 'bg-white/20'}`} />
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
            <span className="text-blue-200 text-xs font-medium">
              {doneSteps === totalSteps && totalSteps > 0
                ? '🎉 Hoàn thành bài học!'
                : `Bước ${Math.min(doneSteps + 1, totalSteps)}/${totalSteps}`}
            </span>
            {doneSteps === totalSteps && totalSteps > 0 && (
              <span className="text-xs bg-green-400/20 text-green-300 font-semibold px-3 py-1 rounded-full">✓ Xong</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Content sections ── */}
      <div className="flex-1 max-w-[1600px] w-full mx-auto px-4 md:px-8 py-6 md:flex md:items-start md:gap-5">

      {/* Cột trái: Lý thuyết/Video/Bài giảng/Bài tập — Bài thực hành tách riêng ở dưới. Có thể ẩn trên desktop để bên phải rộng hơn. */}
      <div className={`${leftPanelHidden ? 'md:hidden' : ''} md:w-1/2 min-w-0 space-y-4 md:sticky md:top-4 md:max-h-[calc(100vh-2rem)] md:overflow-y-auto md:pr-2`}>

        {/* Lý thuyết */}
        {hasTheory && (
          <SectionCard icon={<Lightbulb size={18} />} iconBg="bg-amber-100" iconColor="text-amber-600"
            title="Lý thuyết" done={theoryOk} locked={false} lockMessage="">
            <div className="mb-4">
              <MarkdownContent text={lesson.ai_context} />
            </div>
            {theoryOk
              ? <DoneChip label="Đã đọc lý thuyết" />
              : <ActionButton onClick={handleMarkTheoryRead} disabled={theoryMarking} loading={theoryMarking} color="amber">
                  Đánh dấu đã đọc
                </ActionButton>}
          </SectionCard>
        )}

        {/* Video */}
        {hasVideo && (
          <SectionCard icon={<PlayCircle size={18} />} iconBg="bg-blue-100" iconColor="text-blue-600"
            title="Video bài giảng" done={videoOk} locked={false} lockMessage="">
            {/* Cột này bị ẩn hẳn (display:none) khi leftPanelHidden trên desktop — không
                render iframe/video lúc đó để tránh giữ tài nguyên chạy ngầm trong lúc ẩn
                (video/pptx/pdf nặng, một số máy cấu hình yếu bị treo/trắng trang). */}
            {leftPanelHidden ? null : embedUrl ? (
              <div className="w-full aspect-video rounded-xl overflow-hidden bg-black mb-4">
                <iframe src={embedUrl} title="Lesson video" className="w-full h-full"
                  frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
              </div>
            ) : (
              <div className="mb-4">
                <a href={lesson.video_url} target="_blank" rel="noopener noreferrer"
                  className="text-indigo-600 hover:underline text-sm">{lesson.video_url}</a>
              </div>
            )}
            {videoOk
              ? <DoneChip label="Đã xem video" />
              : <ActionButton onClick={handleMarkVideoWatched} disabled={videoMarking} loading={videoMarking} color="blue">
                  Đánh dấu đã xem video
                </ActionButton>}
          </SectionCard>
        )}

        {/* PPTX / PDF */}
        {hasPptx && (() => {
          const isPdf = lesson.pptx_url?.split('?')[0].toLowerCase().endsWith('.pdf')
          return (
          <SectionCard icon={<FileText size={18} />} iconBg="bg-orange-100" iconColor="text-orange-600"
            title={webSlides ? 'Bài giảng' : isPdf ? 'Bài giảng (PDF)' : 'Bài giảng (PowerPoint)'} done={pptxOk} locked={pptxLocked}
            lockMessage="Xem video trước để mở khóa">
            {leftPanelHidden ? null : webSlides ? (
              <Suspense fallback={<div className="w-full rounded-xl bg-gray-100 mb-4 flex items-center justify-center text-sm text-gray-400" style={{ aspectRatio: '16/9' }}>Đang tải bài giảng…</div>}>
                <LessonSlidesViewer slides={webSlides} onXemHet={() => { if (!progress?.pptx_viewed && !pptxMarking) handleMarkPptxViewed() }} />
              </Suspense>
            ) : !lesson.pptx_url ? (
              <div className="w-full rounded-xl bg-gray-100 mb-4 flex items-center justify-center text-sm text-gray-400" style={{ aspectRatio: '16/9' }}>Đang tải bài giảng…</div>
            ) : isPdf ? (
              <div className="mb-4">
                <PDFViewer url={lesson.pptx_url} />
              </div>
            ) : (
              <div className="w-full rounded-xl overflow-hidden border border-gray-200 mb-4" style={{ aspectRatio: '16/9' }}>
                <iframe src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(lesson.pptx_url)}`}
                  width="100%" height="100%" frameBorder="0" title="Bài giảng PPTX" className="w-full h-full block" allowFullScreen />
              </div>
            )}
            {pptxOk
              ? <DoneChip label="Đã xem bài giảng" />
              : <ActionButton onClick={handleMarkPptxViewed} disabled={pptxMarking} loading={pptxMarking} color="orange">
                  Đánh dấu đã xem bài giảng
                </ActionButton>}
          </SectionCard>
          )
        })()}

        {/* Quiz */}
        {hasQuiz && (
          <SectionCard icon={<BookOpen size={18} />} iconBg="bg-indigo-100" iconColor="text-indigo-600"
            title="Bài tập" badge={`${questions.length} câu`}
            done={quizOk && !quizActive} locked={quizLocked}
            lockMessage={hasPptx ? 'Xem bài giảng trước để mở khóa' : 'Xem video trước để mở khóa'}>
            {quizOk && !quizActive ? (
              <div className="flex items-center gap-4 flex-wrap">
                <DoneChip label={`Đạt · ${progress?.quiz_correct ?? 0}/${progress?.quiz_total ?? questions.length} câu đúng`} />
                <button onClick={() => setQuizActive(true)} className="text-xs text-indigo-600 hover:underline font-medium">Làm lại</button>
              </div>
            ) : !quizActive ? (
              (() => {
                const hasResume = progress?.quiz_current_idx > 0 && !progress?.quiz_passed
                return hasResume ? (
                  <div className="flex flex-col gap-3">
                    <ActionButton onClick={() => startQuiz(false)} color="indigo">
                      Tiếp tục từ câu {progress.quiz_current_idx + 1}/{questions.length}
                    </ActionButton>
                    <button onClick={() => startQuiz(true)} className="text-xs text-gray-400 hover:text-gray-600 underline text-left">
                      Làm lại từ đầu
                    </button>
                  </div>
                ) : (
                  <ActionButton onClick={() => startQuiz()} color="indigo">Bắt đầu làm bài</ActionButton>
                )
              })()
            ) : (
              <LessonQuiz
                questions={questions}
                initialCurrent={quizInitIdx}
                initialCorrectCount={quizInitCorrect}
                onAskTutor={(extra) => openTutor('quiz', extra)}
                onProgress={(idx, correct) => upsertProgress({ quiz_current_idx: idx, quiz_correct: correct })}
                onSubmit={({ correct, total, passed }) => {
                  handleQuizSubmit({ correct, total, passed })
                  if (passed) setQuizActive(false)
                }}
              />
            )}
          </SectionCard>
        )}

      </div>
      {/* Kết thúc cột trái */}

      {/* Cột phải (desktop): Bài thực hành, dính khi cuộn. Mobile: xếp cuối như cột trái.
          Bung rộng hết cỡ khi cột trái đang bị ẩn. */}
      {hasPractice && (
        <div className={`mt-4 md:mt-0 md:shrink-0 md:sticky md:top-4 md:max-h-[calc(100vh-2rem)] md:overflow-y-auto
          ${leftPanelHidden ? 'md:w-full' : 'md:w-1/2 md:pl-5 md:border-l-2 md:border-gray-300'}`}>
          <button onClick={() => setLeftPanelHidden(v => !v)}
            className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-indigo-600 mb-2 px-1">
            {leftPanelHidden ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
            {leftPanelHidden ? 'Hiện lý thuyết' : 'Ẩn lý thuyết — đọc đề rộng hơn'}
          </button>
          <SectionCard icon={<Upload size={18} />} iconBg="bg-emerald-100" iconColor="text-emerald-600"
            title="Bài thực hành" badge={`${submittedCount}/${requiredCount} đã nộp`}
            done={practiceOk} locked={practiceLocked}
            lockMessage={hasQuiz ? 'Hoàn thành bài tập trước để mở khóa'
              : hasPptx ? 'Xem bài giảng trước để mở khóa'
              : 'Xem video trước để mở khóa'}>
            <div className="space-y-4">
              {/* ── Task grid ── */}
              {(() => {
                const palette = [
                  { from: '#6366f1', to: '#8b5cf6' },
                  { from: '#0ea5e9', to: '#06b6d4' },
                  { from: '#f97316', to: '#f59e0b' },
                  { from: '#10b981', to: '#14b8a6' },
                  { from: '#ec4899', to: '#f43f5e' },
                ]
                return (
                  <>
                    {/* ── Node map: 3 bài/dòng trên mobile, 6 trên desktop; ẩn trên desktop khi đã chọn 1 bài ── */}
                    <div className={activeTaskIdx !== null ? 'md:hidden' : ''}>
                    {(() => {
                      // Khung này thường chỉ chiếm nửa màn hình nên bớt số bài/hàng lại; khi ẩn cột
                      // trái (khung bung full-width) thì cho nhiều bài/hàng hơn để đỡ phí chỗ.
                      const TASKS_PER_ROW = window.innerWidth < 768 ? 3
                        : leftPanelHidden ? 6
                        : window.innerWidth < 1400 ? 3 : 4
                      const nodeIcons = ['⚡','🎯','🔥','⭐','🚀']
                      const rows = []
                      for (let r = 0; r < practiceTasks.length; r += TASKS_PER_ROW)
                        rows.push(practiceTasks.slice(r, r + TASKS_PER_ROW))
                      return (
                        <div className="py-4 px-2 space-y-6">
                          {rows.map((row, rowIdx) => (
                            <div key={rowIdx} className="flex items-end justify-center gap-0">
                              {row.map((task, colIdx) => {
                                const i = rowIdx * TASKS_PER_ROW + colIdx
                                const sub = taskSubmissions[i]
                                const p = palette[i % palette.length]
                                const canSee = feedbackVisible(sub)
                                const hasScore = canSee && sub?.score != null
                                const hasComment = canSee && !!sub?.teacher_comment
                                return (
                                  <div key={i} className="flex items-center">
                                    <div className="flex flex-col items-center gap-2" style={{ minWidth: window.innerWidth < 768 ? 70 : 88 }}>
                                      {/* Badge */}
                                      <div className={`text-[10px] font-black px-3 py-1 rounded-full flex items-center gap-1 shadow-sm whitespace-nowrap
                                        ${sub
                                          ? hasScore ? 'bg-indigo-600 text-white' : 'bg-green-500 text-white'
                                          : 'bg-orange-500 text-white'}`}
                                        style={!sub ? { animation: 'indicator-bounce 1.4s ease-in-out infinite' } : {}}>
                                        {sub ? (hasScore && mucCua(sub) ? `⭐ Mức ${mucCua(sub)}` : '✅ Đã nộp') : task?.optional ? '📖 Đọc thêm' : '▶ Làm bài!'}
                                      </div>
                                      {/* Circle */}
                                      <button onClick={() => setActiveTaskIdx(i)}
                                        className="relative w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl shadow-lg transition-all hover:scale-110 active:scale-95 overflow-hidden"
                                        style={{
                                          background: sub ? 'linear-gradient(135deg, #16a34a, #059669)' : `linear-gradient(135deg, ${p.from}, ${p.to})`,
                                          animation: !sub ? 'node-breathe 2s ease-in-out infinite' : undefined,
                                        }}>
                                        {!sub && (
                                          <div className="absolute inset-0 pointer-events-none"
                                            style={{ background: 'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.42) 50%, transparent 65%)', animation: 'node-shimmer 2.4s ease-in-out infinite' }} />
                                        )}
                                        {sub ? '✓' : nodeIcons[i % nodeIcons.length]}
                                      </button>
                                      {/* Label */}
                                      <span className="text-xs font-bold text-gray-600 text-center leading-tight">Bài {i + 1}</span>
                                      {hasComment && <span className="text-[9px] text-indigo-500 font-bold">💬 Có nhận xét</span>}
                                    </div>
                                    {/* Connector — chỉ trong cùng dòng */}
                                    {colIdx < row.length - 1 && (
                                      <div className="h-1 rounded-full shrink-0 mb-8" style={{
                                        width: 28,
                                        background: sub ? 'linear-gradient(90deg, #4ade80, #86efac)' : '#e5e7eb'
                                      }} />
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          ))}
                        </div>
                      )
                    })()}
                    </div>

                    {/* ── Chi tiết bài đã chọn: hộp thoại nổi trên mobile, hiện ngay tại chỗ trên desktop ── */}
                    {activeTaskIdx !== null && (() => {
                      const i = activeTaskIdx
                      const task = practiceTasks[i]
                      const sub = taskSubmissions[i]
                      const file = taskFiles[i]
                      const note = taskNotes[i] || ''
                      const isSubmitting = taskSubmitting === i
                      const isResubmitting = resubmitTask === i
                      const p = palette[i % palette.length]
                      const lightBg = ['#f5f3ff','#f0f9ff','#fff7ed','#f0fdf4','#fdf2f8'][i % 5]
                      const borderCol = ['#c4b5fd','#7dd3fc','#fdba74','#6ee7b7','#f9a8d4'][i % 5]
                      const textCol = ['#7c3aed','#0369a1','#c2410c','#047857','#be185d'][i % 5]

                      function closeModal() {
                        setActiveTaskIdx(null)
                        if (resubmitTask === i) {
                          setResubmitTask(null)
                          const nf = [...taskFiles]; nf[i] = null; setTaskFiles(nf)
                          const nn = [...taskNotes]; nn[i] = ''; setTaskNotes(nn)
                        }
                      }

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
                          <button onClick={closeModal}
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
                              <button onClick={() => openTutor('practice', {
                                taskInstructions: task.instructions || `Bài thực hành ${i + 1}`,
                                questionText: `Bài thực hành ${i + 1}`,
                              })}
                                className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-violet-600 bg-violet-50 hover:bg-violet-100 border border-violet-200 py-2 rounded-xl transition">
                                🙋 Chưa hiểu bài? {STUDENT_AI_DIRECT ? 'Hỏi trợ giảng' : 'Hỏi thầy cô'}
                              </button>

                              {/* Bài đọc thêm: không có ô nộp bài */}
                              {task?.optional && !sub ? (
                                <p className="text-sm text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2.5 text-center">📖 Đây là bài đọc thêm — em đọc để hiểu thêm, không cần nộp bài.</p>
                              ) : sub && !isResubmitting ? (
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
                                    <RaSoatLoi sub={sub} task={task} onCapNhat={moi => setTaskSubmissions(prev => prev.map(x => (x && x.id === moi.id ? moi : x)))} />
                                  )}
                                  {aiGradingTask === i ? (
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
                                  <button onClick={() => {
                                    const nn = [...taskNotes]; nn[i] = sub.text_content || ''; setTaskNotes(nn)
                                    setResubmitTask(i)
                                  }} className="w-full py-2.5 rounded-xl border-2 border-orange-300 text-orange-600 font-bold text-sm hover:bg-orange-50 transition">
                                    🔄 Nộp lại bài này
                                  </button>
                                </div>
                              ) : (
                                /* Upload form */
                                <div className="space-y-3">
                                  {isResubmitting && (
                                    <div className="flex items-center justify-between bg-orange-50 border border-orange-200 rounded-xl px-3 py-2">
                                      <span className="text-xs text-orange-700 font-semibold">🔄 File cũ sẽ được thay thế</span>
                                      <button onClick={() => {
                                        setResubmitTask(null)
                                        const nf = [...taskFiles]; nf[i] = null; setTaskFiles(nf)
                                        const nn = [...taskNotes]; nn[i] = ''; setTaskNotes(nn)
                                      }} className="text-xs text-gray-400 hover:text-gray-600">Hủy</button>
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
                                            {isResubmitting ? 'Chọn file mới' : 'Bấm để chọn file nộp bài'}
                                          </p>
                                          <p className="text-xs text-gray-400 mt-1">.pptx · .docx · .pdf · .sb3 · .py · .txt · ảnh</p>
                                        </div>
                                      </>
                                    )}
                                    <input type="file" className="hidden" accept=".pptx,.docx,.pdf,.sb3,.py,.txt,image/*"
                                      onChange={e => {
                                        if (!e.target.files?.[0]) return
                                        const next = [...taskFiles]; next[i] = e.target.files[0]; setTaskFiles(next)
                                        setRaSoatTruoc(prev => ({ ...prev, [i]: null }))
                                      }} />
                                  </label>
                                  <textarea
                                    value={note}
                                    onChange={e => { const next = [...taskNotes]; next[i] = e.target.value; setTaskNotes(next) }}
                                    rows={2}
                                    placeholder="Ghi chú thêm (tuỳ chọn)..."
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none bg-gray-50"
                                  />
                                  {/* Tự rà soát TRƯỚC khi nộp: chọn file → rà soát → sửa → thấy ổn mới bấm Nộp */}
                                  {file && !task?.optional && (
                                    <RaSoatLoi file={file} note={note} lessonId={id} taskIdx={i} task={task}
                                      onKetQua={kq => setRaSoatTruoc(prev => ({ ...prev, [i]: kq }))} />
                                  )}
                                  <button
                                    onClick={() => isResubmitting ? handleTaskResubmit(i) : handleTaskSubmit(i)}
                                    disabled={isSubmitting || (isResubmitting ? !file && !sub?.file_url : !file)}
                                    className="w-full flex items-center justify-center gap-2 text-white py-3.5 rounded-2xl text-sm font-black shadow-lg transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100"
                                    style={{ background: isSubmitting ? '#9ca3af' : isResubmitting
                                      ? 'linear-gradient(135deg, #f97316, #f59e0b)'
                                      : `linear-gradient(135deg, ${p.from}, ${p.to})` }}>
                                    {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                                    {isSubmitting ? 'Đang nộp...' : isResubmitting ? `Cập nhật bài ${i + 1}` : `Nộp bài ${i + 1} 🚀`}
                                  </button>
                                </div>
                              )}
                            </div>
                      )

                      return (
                        <>
                          {/* Desktop: hiện ngay tại chỗ, không hộp thoại nổi */}
                          <div className="hidden md:flex md:flex-col md:bg-white md:rounded-2xl md:border md:border-gray-100 md:shadow-sm md:overflow-hidden">
                            <button onClick={closeModal}
                              className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 px-4 pt-3 pb-1 shrink-0">
                              ← Quay lại danh sách
                            </button>
                            {header}
                            {body}
                          </div>

                          {/* Mobile: hộp thoại nổi như cũ */}
                          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 md:hidden"
                            onClick={closeModal}>
                            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
                            <div className="relative w-full sm:max-w-2xl bg-white rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
                              onClick={e => e.stopPropagation()}>
                              {header}
                              {body}
                            </div>
                          </div>
                        </>
                      )
                    })()}
                  </>
                )
              })()}
            </div>
          </SectionCard>
        </div>
      )}
      </div>
      {/* Kết thúc bố cục 2 cột */}
    </div>
  )
}
