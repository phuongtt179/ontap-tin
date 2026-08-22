// Tính state (done/current/todo/locked) + số sao + cờ "bài mới nhất" cho con
// đường học tập, dùng chung giữa LearnPage và bất kỳ nơi nào khác cần hiển thị.
//
// Khoá 3 tầng:
//   1. is_published=false (giáo viên chưa xong)                    → 'locked'
//   2. chủ đề của bài chưa được mở cho LỚP học sinh (class_topic_unlock)
//      → 'locked' — khoá CẢ chủ đề, không quan tâm bài bên trong đã tick hay chưa.
//   3. chủ đề đã mở nhưng BÀI CỤ THỂ đó chưa được tick mở (class_lesson_unlock)
//      → 'locked'.
// `unlockedTopics/unlockedLessonMap = null` nghĩa là học sinh không thuộc lớp
// nào — coi như mở hết mọi bài đã publish (không bị chặn bởi tiến độ lớp).

// Ngưỡng % đúng quiz để quy đổi sao — tái dùng đúng thang app đang dùng để
// phát sticker (LessonPage.jsx: >=90% → nhiều sao nhất), gộp về 3 mức.
function starsFor(progress) {
  const total = progress?.quiz_total
  if (!total) return 3 // bài không có quiz: hoàn thành = trọn vẹn
  const pct = (progress?.quiz_correct || 0) / total
  if (pct >= 0.9) return 3
  if (pct >= 0.75) return 2
  return 1
}

function byOrderThenCreated(a, b) {
  const oa = a.order ?? 0
  const ob = b.order ?? 0
  if (oa !== ob) return oa - ob
  return new Date(a.created_at) - new Date(b.created_at)
}

export function topicKeyOf(lesson) {
  return lesson.topic || '__no_topic__'
}

/**
 * Trả về mảng gộp (bài đã publish + bài chưa publish), đã sort đúng thứ tự
 * hiển thị, mỗi phần tử thêm { state, stars, isNewest }.
 *
 * `publishedLessons`: bài is_published=true của khoá (đầy đủ cột).
 * `lockedLessons`: bài is_published=false của khoá (cột tối thiểu).
 * `unlockedTopics`: Set các chủ đề đã mở cho lớp — null = không giới hạn.
 * `unlockedLessonMap`: Map lesson_id -> thời điểm mở (ISO string) — null = không giới hạn.
 */
export function decorateLessons(publishedLessons, lockedLessons, progressMap, unlockedTopics, unlockedLessonMap) {
  const sortedPublished = publishedLessons.slice().sort(byOrderThenCreated)
  const sortedAll = [...publishedLessons, ...lockedLessons].sort(byOrderThenCreated)

  const noRestriction = unlockedTopics == null || unlockedLessonMap == null
  const isUnlocked = l => noRestriction || (unlockedTopics.has(topicKeyOf(l)) && unlockedLessonMap.has(l.id))

  const unlockedPublished = sortedPublished.filter(isUnlocked)
  const currentId = unlockedPublished.find(l => !progressMap[l.id]?.completed)?.id ?? null

  // "Bài mới nhất": không còn là "N bài đầu tiên" tuần tự nữa (giáo viên có
  // thể tick bất kỳ bài nào, không theo thứ tự) — nên lấy bài được MỞ GẦN
  // ĐÂY NHẤT theo thời điểm giáo viên tick (unlocked_at), không phải theo
  // thứ tự chương trình học.
  let newestId = null
  if (noRestriction) {
    newestId = sortedPublished[sortedPublished.length - 1]?.id ?? null
  } else if (unlockedPublished.length) {
    newestId = unlockedPublished.reduce((best, l) => {
      const t = unlockedLessonMap.get(l.id)
      const bestT = unlockedLessonMap.get(best.id)
      return t > bestT ? l : best
    }).id
  }

  return sortedAll.map(l => {
    const isNewest = l.id === newestId
    if (!isUnlocked(l)) return { ...l, state: 'locked', stars: 0, isNewest }
    const progress = progressMap[l.id]
    const completed = !!progress?.completed
    const state = completed ? 'done' : l.id === currentId ? 'current' : 'todo'
    return { ...l, state, stars: completed ? starsFor(progress) : 0, isNewest }
  })
}
