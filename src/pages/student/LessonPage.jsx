import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { layCauHoiTheoIds } from '../../data/cauHoi'
import { layLopCuaEm } from '../../data/ghiDanh'
import { buildWeaknessProfile } from '../../utils/weakness'
import { STUDENT_AI_DIRECT } from '../../lib/aiMode'
import toast from 'react-hot-toast'
import { Upload, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import StickerModal from '../../components/student/StickerModal'
import RewardModal from '../../components/student/RewardModal'
import { updateStreak } from '../../utils/updateStreak'
import { NGUONG_DOI_QUA_MAC_DINH } from '../../domain/sticker'
import AskTutorModal from '../../components/student/AskTutorModal'
import { topicKeyOf } from '../../utils/lessonSteps'
import { parseTasks } from '../../domain/baiThucHanh'
import { trangThaiBuoc } from '../../domain/tienDoBaiHoc'
import { layTieuChiGanDay } from '../../data/baiNop'
import { layBaiHocTheoId, layDanhSachBai } from '../../data/baiHoc'
import BanDoBaiThucHanh from '../../components/student/baiHoc/BanDoBaiThucHanh'
import ChiTietBaiThucHanh from '../../components/student/baiHoc/ChiTietBaiThucHanh'
import { useBaiThucHanh } from '../../hooks/useBaiThucHanh'
import DauBaiHoc from '../../components/student/baiHoc/DauBaiHoc'
import { MucLyThuyet, MucVideo, MucBaiGiang, MucBaiTap } from '../../components/student/baiHoc/CacMucHoc'
import { SectionCard } from '../../components/student/baiHoc/KhungMuc'

/* ── LessonPage ────────────────────────────────────────────── */
export default function LessonPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [lesson, setLesson] = useState(null)
  const [questions, setQuestions] = useState([])
  const [progress, setProgress] = useState(null)
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

    // 4. Bài nộp thực hành của em
    await th.napBaiNop(lessonData)

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

  // phần thực hành: nộp / nộp lại / chờ nhận xét — src/hooks/useBaiThucHanh.js
  const th = useBaiThucHanh({ id, user, lesson, loading, upsertProgress, recordActivity, taiLai: loadAll })

  useEffect(() => {
    if (user) loadAll()
  }, [id, user?.id])

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

  const practiceTasks = parseTasks(lesson.practice_instructions)
  // Chỉ đếm bài bắt buộc (bài đọc thêm — optional — không cần nộp)
  const requiredCount = practiceTasks.filter(t => !t?.optional).length
  const submittedCount = th.taskSubmissions.filter((s, k) => s && !practiceTasks[k]?.optional).length

  const { theory: theoryOk, video: videoOk, pptx: pptxOk, quiz: quizOk, practice: practiceOk } = buoc.xong

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

      <DauBaiHoc lesson={lesson} buoc={buoc} onQuayLai={() => navigate('/student/learn')} />

      {/* ── Content sections ── */}
      <div className="flex-1 max-w-[1600px] w-full mx-auto px-4 md:px-8 py-6 md:flex md:items-start md:gap-5">

      {/* Cột trái: Lý thuyết/Video/Bài giảng/Bài tập — Bài thực hành tách riêng ở dưới. Có thể ẩn trên desktop để bên phải rộng hơn. */}
      <div className={`${leftPanelHidden ? 'md:hidden' : ''} md:w-1/2 min-w-0 space-y-4 md:sticky md:top-4 md:max-h-[calc(100vh-2rem)] md:overflow-y-auto md:pr-2`}>

        {hasTheory && <MucLyThuyet noiDung={lesson.ai_context} xong={theoryOk} dangDanhDau={theoryMarking} onDanhDau={handleMarkTheoryRead} />}
        {hasVideo && <MucVideo videoUrl={lesson.video_url} xong={videoOk} an={leftPanelHidden} dangDanhDau={videoMarking} onDanhDau={handleMarkVideoWatched} />}
        {hasPptx && <MucBaiGiang pptxUrl={lesson.pptx_url} webSlides={webSlides} xong={pptxOk} daXem={!!progress?.pptx_viewed}
          an={leftPanelHidden} dangDanhDau={pptxMarking} onDanhDau={handleMarkPptxViewed} />}
        {hasQuiz && (
          <MucBaiTap questions={questions} progress={progress} xong={quizOk} dangLam={quizActive} coBaiGiang={hasPptx}
            batDauTuCau={quizInitIdx} soDungLucDau={quizInitCorrect}
            onBatDau={startQuiz} onLamLai={() => setQuizActive(true)}
            onHoiTroGiang={extra => openTutor('quiz', extra)}
            onTienDo={(idx, correct) => upsertProgress({ quiz_current_idx: idx, quiz_correct: correct })}
            onNop={({ correct, total, passed }) => {
              handleQuizSubmit({ correct, total, passed })
              if (passed) setQuizActive(false)
            }} />
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
            done={practiceOk} locked={false}
            lockMessage={hasQuiz ? 'Hoàn thành bài tập trước để mở khóa'
              : hasPptx ? 'Xem bài giảng trước để mở khóa'
              : 'Xem video trước để mở khóa'}>
            <div className="space-y-4">
                {/* ── Task grid ── */}
                <BanDoBaiThucHanh practiceTasks={practiceTasks} taskSubmissions={th.taskSubmissions}
                  activeTaskIdx={th.activeTaskIdx} leftPanelHidden={leftPanelHidden} onChon={th.setActiveTaskIdx} />
                {th.activeTaskIdx !== null && (() => {
                  const i = th.activeTaskIdx
                  const task = practiceTasks[i]
                  return (
                    <ChiTietBaiThucHanh key={i} i={i} task={task} sub={th.taskSubmissions[i]} file={th.taskFiles[i]}
                      note={th.taskNotes[i] || ''} dangNop={th.taskSubmitting === i} dangNopLai={th.resubmitTask === i}
                      dangChamAi={th.aiGradingTask === i} lessonId={id}
                      onDong={() => th.dongBai(i)} onChonFile={f => th.chonFile(i, f)} onDoiGhiChu={t => th.doiGhiChu(i, t)}
                      onRaSoatTruoc={kq => th.ghiRaSoatTruoc(i, kq)} onNop={() => th.nop(i)}
                      onBatDauNopLai={() => th.batDauNopLai(i)} onHuyNopLai={() => th.huyNopLai(i)}
                      onCapNhatBaiNop={th.capNhatMotBaiNop}
                      onHoiTroGiang={() => openTutor('practice', {
                        taskInstructions: task.instructions || `Bài thực hành ${i + 1}`,
                        questionText: `Bài thực hành ${i + 1}`,
                      })} />
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
