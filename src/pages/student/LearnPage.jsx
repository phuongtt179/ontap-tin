import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useSelectedGradeContext } from '../../context/SelectedGradeContext'
import { useHeaderStats } from '../../context/HeaderStatsContext'
import { useLearnData } from '../../hooks/useLearnData'
import SubjectStrip from '../../components/student/learningPath/SubjectStrip'
import AssistantBubble from '../../components/student/learningPath/AssistantBubble'
import LessonPath from '../../components/student/learningPath/LessonPath'
import { useContainerHeight } from '../../components/student/learningPath/useContainerWidth'
import { computePoints } from '../../components/student/learningPath/pathGeometry'
import { decorateLessons } from '../../utils/lessonSteps'
import RewardModal from '../../components/student/RewardModal'
import AchievementsModal from '../../components/student/AchievementsModal'
import { supabase } from '../../lib/supabase'

// ── Full learning map: MỘT con đường duy nhất nối hết bài đầu → cuối,
//    chạy NGANG (lò xo nằm ngang), cuộn sang phải ──
function LearningMap({ lessons, lockedLessons, progressMap, navigate, height, unlockedTopics, unlockedLessonMap, allLessonsCount, completedCount }) {
  // Mỗi bài học = 1 node. Gộp cả bài chưa publish (hiện dạng khoá 🔒) vào
  // con đường — không tính vào allLessonsCount/completedCount (mẫu số tiến
  // độ chỉ tính bài thật).
  const decorated = decorateLessons(lessons, lockedLessons, progressMap, unlockedTopics, unlockedLessonMap)

  if (decorated.length === 0) return (
    <div className="text-center py-20">
      <div className="text-6xl mb-4">📖</div>
      <p className="text-gray-500 font-medium">Chưa có bài học nào</p>
    </div>
  )

  // Xếp path + cờ đích cạnh nhau theo hàng ngang (không xếp chồng dọc như
  // trước) — chiều cao khớp CHÍNH XÁC chiều cao đã đo ở khung cuộn ngoài.
  return (
    <div className="flex items-center px-6" style={{ height }}>
      <LessonPath
        lessons={decorated}
        height={height}
        onNavigate={id => navigate(`/student/learn/${id}`)}
      />

      <div className="flex justify-center shrink-0 pl-10 pr-16">
        <div className={`flex flex-col items-center gap-1.5 transition-all duration-500
          ${completedCount === allLessonsCount ? 'opacity-100 scale-110' : 'opacity-20 scale-100'}`}>
          <div className="text-5xl">🏁</div>
          <p className="text-xs font-black text-gray-500 tracking-widest whitespace-nowrap">HOÀN THÀNH!</p>
          {completedCount === allLessonsCount && (
            <p className="text-emerald-600 text-xs font-semibold mt-1 whitespace-nowrap">🎉 Xuất sắc!</p>
          )}
        </div>
      </div>

      {/* Đệm rỗng cuối path — không có khoảng này thì node gần cuối (nhất là
          node cuối cùng) không thể cuộn tới GIỮA màn hình được vì hết nội
          dung để cuộn tiếp, bị kẹt sát mép phải. */}
      <div className="shrink-0" style={{ width: '50vw' }} />
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────
export default function LearnPage() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const { grades, selectedGrade, selectedEnrollment, loading: enrollLoading } = useSelectedGradeContext()
  const {
    lessons, lockedLessons, unlockedTopics, unlockedLessonMap, topics, progressMap, loading,
    stickerCount, setStickerCount, streakDays, stickerThreshold, courseScope,
    grouped, topicChips, courseRoadmap, lessonsCompleted,
  } = useLearnData(user, selectedGrade, selectedEnrollment?.class_name ?? null)
  const { setStats } = useHeaderStats()

  const [selectedTopic, setSelectedTopic] = useState('__all__')
  const [showReward, setShowReward] = useState(false)
  const [showAchievements, setShowAchievements] = useState(false)
  const [rewardNotif, setRewardNotif] = useState(false)   // có quà mới được trao chưa xem
  // Đo CHIỀU CAO khung cuộn ngang MỘT lần ở đây — con đường chạy ngang nên
  // biên độ lượn sóng co theo chiều cao đang có, chiều rộng tự nối dài.
  const [setPathHeightEl, pathHeight] = useContainerHeight()
  // Cần chính DOM node thật (không chỉ chiều cao) để tự cuộn ngang tới bài
  // "Học tiếp" — gộp chung 1 callback ref với hook đo chiều cao ở trên.
  const scrollElRef = useRef(null)
  const centeredForRef = useRef(null) // đánh dấu đã canh giữa cho topic nào rồi, tránh giật cuộn lại mỗi lần re-render
  const pathContainerRef = useCallback(node => {
    setPathHeightEl(node)
    scrollElRef.current = node
  }, [setPathHeightEl])

  useEffect(() => {
    if (selectedGrade && user) setSelectedTopic('__all__')
  }, [selectedGrade, user?.id])

  // Kiểm tra quà mới được trao (thông báo chấm đỏ)
  useEffect(() => {
    if (!user?.id) return
    async function checkRewardNotif() {
      const { data } = await supabase.from('reward_requests')
        .select('fulfilled_at').eq('student_id', user.id).eq('status', 'fulfilled')
        .not('fulfilled_at', 'is', null).order('fulfilled_at', { ascending: false }).limit(1)
      if (!data?.length) return
      const lastSeen = localStorage.getItem(`rewards_seen_${user.id}`)
      if (!lastSeen || new Date(data[0].fulfilled_at) > new Date(lastSeen)) setRewardNotif(true)
    }
    checkRewardNotif()
  }, [user?.id])

  const displayedLessons = useMemo(() => {
    if (selectedTopic === '__all__') return lessons
    return lessons.filter(l => (l.topic || '__no_topic__') === selectedTopic)
  }, [lessons, selectedTopic])

  const displayedLockedLessons = useMemo(() => {
    if (selectedTopic === '__all__') return lockedLessons
    return lockedLessons.filter(l => (l.topic || '__no_topic__') === selectedTopic)
  }, [lockedLessons, selectedTopic])

  // Tự cuộn ngang tới bài MỚI NHẤT lớp đã được mở (isNewest — không phải bài
  // "Học tiếp"/current), có hiệu ứng riêng ở LessonNode, canh nó vào GIỮA màn
  // hình — chỉ chạy 1 lần cho mỗi lần đổi chủ đề, không chạy lại mỗi khi
  // progressMap cập nhật (tránh giật cuộn khỏi vị trí HS đang xem).
  useEffect(() => {
    // Khoá theo CẢ khoá học lẫn chủ đề — trước đây chỉ khoá theo selectedTopic
    // nên khi đổi sang khoá học khác mà chủ đề đang chọn tình cờ trùng key cũ
    // (vd cùng là '__all__'), effect bị coi là "đã canh giữa rồi" và bỏ qua.
    //
    // QUAN TRỌNG: phải đợi `loading` xong mới canh giữa. Đổi khoá học xong,
    // useLearnData fetch dữ liệu mới BẤT ĐỒNG BỘ — trong lúc đang fetch,
    // `lessons` vẫn còn dữ liệu khoá CŨ (React chưa unmount gì cả, state cũ
    // vẫn còn nguyên). Nếu chạy effect ngay lúc đó, nó canh giữa nhầm theo dữ
    // liệu cũ RỒI đánh dấu centerKey của khoá MỚI là "đã xong" — khi dữ liệu
    // đúng về tới nơi thì effect chạy lại nhưng bị guard chặn, không canh lại
    // được nữa. Đây chính là lỗi "đổi khoá không canh giữa" bị lặp lại.
    if (loading) return
    const centerKey = `${selectedGrade}|${selectedTopic}`
    const decorated = decorateLessons(displayedLessons, displayedLockedLessons, progressMap, unlockedTopics, unlockedLessonMap)
    if (!pathHeight || decorated.length === 0) return
    if (centeredForRef.current === centerKey) return
    const el = scrollElRef.current
    if (!el) return
    const points = computePoints(pathHeight, decorated.length)
    const idx = decorated.findIndex(l => l.isNewest)
    const targetIdx = idx >= 0 ? idx : decorated.length - 1
    const targetX = points[targetIdx]?.x ?? 0
    el.scrollTo({ left: Math.max(0, targetX - el.clientWidth / 2), behavior: 'auto' })
    centeredForRef.current = centerKey
  }, [loading, pathHeight, displayedLessons, displayedLockedLessons, progressMap, unlockedTopics, unlockedLessonMap, selectedGrade, selectedTopic])

  const totalLessons = lessons.length
  const completedLessons = lessons.filter(l => progressMap[l.id]?.completed).length

  // Gửi số liệu streak/sticker/tiến độ lên thanh điều hướng dùng chung
  // (Layout.jsx hiện chúng cạnh avatar) — gộp 1 dòng thay vì 2 thanh xếp
  // chồng. Dọn lại khi rời trang để trang khác không kế thừa nhầm số liệu.
  useEffect(() => {
    setStats({
      totalLessons, completedLessons, streakDays, stickerCount, stickerThreshold, rewardNotif,
      onOpenReward: () => setShowReward(true),
      onOpenAchievements: () => { setShowAchievements(true); setRewardNotif(false) },
    })
    return () => setStats(null)
  }, [totalLessons, completedLessons, streakDays, stickerCount, stickerThreshold, rewardNotif, setStats])

  if (enrollLoading || loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-sky-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
          <p className="text-blue-600 text-sm font-medium">Đang tải...</p>
        </div>
      </div>
    )
  }

  if (grades.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-sky-100 p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">📚</div>
          <p className="text-xl font-bold text-gray-700">Bạn chưa tham gia khoá học nào</p>
          <p className="text-gray-400 mt-2">Liên hệ giáo viên để được thêm vào khoá học</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50">

      {/* Reward modal */}
      {showReward && (
        <RewardModal
          stickerCount={stickerCount}
          threshold={stickerThreshold}
          grade={selectedGrade}
          onClose={() => setShowReward(false)}
          onRedeemed={newCount => setStickerCount(newCount)}
        />
      )}

      {/* Achievements modal */}
      <AchievementsModal
        open={showAchievements}
        onClose={() => setShowAchievements(false)}
        userId={user.id}
        userName={profile?.full_name}
      />

      {/* ② Dải chip chủ đề — cố định */}
      <div className="shrink-0" style={{ background: 'var(--card)', borderBottom: '1px solid var(--stone)' }}>
        <SubjectStrip
          topicKeys={topicChips}
          lessons={lessons}
          progressMap={progressMap}
          grouped={grouped}
          selected={selectedTopic}
          onSelect={k => setSelectedTopic(k)}
          unlockedTopics={unlockedTopics}
        />
      </div>

      {/* Legend — cố định phía trên, không nằm trong khung cuộn ngang */}
      <div className="shrink-0 max-w-3xl mx-auto px-4 pt-3 flex items-center gap-4 flex-wrap text-xs" style={{ color: 'var(--ink-soft)' }}>
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded-full" style={{ background: 'var(--leaf)' }} /> Đã xong
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded-full" style={{ background: 'var(--sun)' }} /> Học tiếp
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded-full" style={{ background: 'var(--grape)' }} /> Chưa học
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded-full" style={{ background: 'var(--stone)' }} /> Chưa mở khoá
        </div>
      </div>

      {/* ③ Con đường bài học — CHỈ phần này cuộn, cuộn NGANG. Đo chiều cao ở
          chính khung cuộn ngoài này (ổn định hơn đo div path bên trong). */}
      <div ref={pathContainerRef} className="flex-1 overflow-x-auto overflow-y-hidden min-h-0">
        <LearningMap
          lessons={displayedLessons}
          lockedLessons={displayedLockedLessons}
          progressMap={progressMap}
          navigate={navigate}
          height={pathHeight}
          unlockedTopics={unlockedTopics}
          unlockedLessonMap={unlockedLessonMap}
          allLessonsCount={displayedLessons.length}
          completedCount={displayedLessons.filter(l => progressMap[l.id]?.completed).length}
        />
      </div>

      <AssistantBubble
        user={user}
        profile={profile}
        lessons={lessons}
        displayedLessons={displayedLessons}
        progressMap={progressMap}
        selectedGrade={selectedGrade}
        courseScope={courseScope}
        courseRoadmap={courseRoadmap}
        lessonsCompleted={lessonsCompleted}
        navigate={navigate}
        unlockedTopics={unlockedTopics}
        unlockedLessonMap={unlockedLessonMap}
      />
    </div>
  )
}
