import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { topicKeyOf } from '../utils/lessonSteps'

// Bóc loadData() + các useMemo dẫn xuất của LearnPage.jsx ra hook riêng — hành vi giữ nguyên 100%.
// `className`: lớp học sinh đang thuộc (cho khoá đang chọn) — dùng để lấy đúng
// khoá 2 tầng riêng của lớp đó (class_topic_unlock + class_lesson_unlock).
// Không thuộc lớp nào (null) → coi như mở hết, không bị chặn bởi tiến độ lớp.
export function useLearnData(user, selectedGrade, className) {
  const [lessons, setLessons] = useState([])
  // Bài CHƯA publish của khoá — chỉ lấy cột tối thiểu (phòng thủ theo tầng,
  // không lấy ai_context/practice_instructions/video_url... của bài nháp) —
  // dùng để hiện node khoá 🔒 trên con đường, KHÔNG gộp vào `lessons` để
  // không ảnh hưởng courseRoadmap/thống kê/thẻ chủ đề vốn chỉ tính bài thật.
  const [lockedLessons, setLockedLessons] = useState([])
  // Khoá 2 tầng theo lớp: chủ đề nào đã mở (class_topic_unlock) + trong chủ
  // đề đó, bài nào đã được tick mở (class_lesson_unlock, kèm thời điểm mở để
  // xác định "bài mới nhất"). null = học sinh không thuộc lớp nào, coi như
  // mở hết mọi bài đã publish.
  const [unlockedTopics, setUnlockedTopics] = useState(null)
  const [unlockedLessonMap, setUnlockedLessonMap] = useState(null)
  const [topics, setTopics] = useState([])
  const [units, setUnits] = useState([])
  const [progressMap, setProgressMap] = useState({})
  const [loading, setLoading] = useState(false)
  const [stickerCount, setStickerCount] = useState(0)
  const [streakDays, setStreakDays] = useState(0)
  const [stickerThreshold, setStickerThreshold] = useState(50)
  const [courseScope, setCourseScope] = useState('')

  useEffect(() => {
    if (selectedGrade && user) loadData()
  }, [selectedGrade, user?.id, className])

  async function loadData() {
    setLoading(true)
    const [
      { data: topicsData }, { data: lessonsData }, { data: lockedData }, { data: progressData },
      { data: unitsData }, { data: profData }, { data: cfgData }, { data: scopeData }, { data: visData },
      { data: topicUnlockRows }, { data: lessonUnlockRows },
    ] = await Promise.all([
      supabase.from('topics').select('*').in('grade', [selectedGrade, 'all']),
      supabase.from('lessons').select('*').eq('is_published', true).eq('grade', selectedGrade)
        .order('order', { ascending: true }).order('created_at', { ascending: true }),
      supabase.from('lessons').select('id, title, unit_id, topic, "order", created_at, restricted_audience')
        .eq('is_published', false).eq('grade', selectedGrade)
        .order('order', { ascending: true }).order('created_at', { ascending: true }),
      supabase.from('lesson_progress').select('*').eq('user_id', user.id),
      supabase.from('units').select('*').eq('grade', selectedGrade).order('sort_order').order('name'),
      supabase.from('profiles').select('sticker_count, streak_days').eq('id', user.id).single(),
      supabase.from('reward_configs').select('sticker_threshold').eq('grade', selectedGrade).maybeSingle(),
      supabase.from('grades').select('ai_scope').eq('value', selectedGrade).maybeSingle(),
      supabase.from('lesson_visibility').select('lesson_id').eq('user_id', user.id),
      className
        ? supabase.from('class_topic_unlock').select('topic').eq('grade', selectedGrade).eq('class_name', className)
        : Promise.resolve({ data: null }),
      className
        ? supabase.from('class_lesson_unlock').select('lesson_id, created_at').eq('grade', selectedGrade).eq('class_name', className)
        : Promise.resolve({ data: null }),
    ])
    setCourseScope(scopeData?.ai_scope || '')
    // Bài học giới hạn người xem (restricted_audience) chỉ hiện nếu có tên mình trong danh sách
    const allowedIds = new Set((visData || []).map(v => v.lesson_id))
    const visibleLessons = (lessonsData || []).filter(l => !l.restricted_audience || allowedIds.has(l.id))
    const visibleLocked = (lockedData || []).filter(l => !l.restricted_audience || allowedIds.has(l.id))
    setLessons(visibleLessons)
    setLockedLessons(visibleLocked)
    setUnlockedTopics(className ? new Set((topicUnlockRows || []).map(r => r.topic)) : null)
    setUnlockedLessonMap(className
      ? new Map((lessonUnlockRows || []).map(r => [r.lesson_id, r.created_at]))
      : null)
    setUnits(unitsData || [])
    setTopics((topicsData || []).sort((a, b) => a.name.localeCompare(b.name, 'vi', { numeric: true })))
    const map = {}
    ;(progressData || []).forEach(p => { map[p.lesson_id] = p })
    setProgressMap(map)
    setStickerCount(profData?.sticker_count ?? 0)
    setStreakDays(profData?.streak_days ?? 0)
    setStickerThreshold(cfgData?.sticker_threshold ?? 50)
    setLoading(false)
  }

  const grouped = useMemo(() => {
    const g = {}
    lessons.forEach(l => { const k = l.topic || '__no_topic__'; if (!g[k]) g[k] = []; g[k].push(l) })
    return g
  }, [lessons])

  const topicChips = useMemo(() => {
    const from = topics.map(t => t.name)
    lessons.forEach(l => { const k = l.topic || '__no_topic__'; if (!from.includes(k)) from.push(k) })
    return from
  }, [topics, lessons])

  // Lộ trình khóa (đơn vị → bài) cho AI trả lời câu hỏi chương trình học —
  // CHỈ lấy bài đã MỞ KHOÁ cho lớp học sinh. Trước đây lấy hết mọi bài đã
  // publish, khiến AI biết và có thể gợi ý/link tên bài học sinh chưa được
  // mở, học sinh bấm vào nút "Vào học" trong câu trả lời AI là truy cập được
  // luôn (né qua UI khoá của con đường bài học).
  const courseRoadmap = useMemo(() => {
    const noRestriction = unlockedTopics == null || unlockedLessonMap == null
    const unlockedForAi = noRestriction
      ? lessons
      : lessons.filter(l => unlockedTopics.has(topicKeyOf(l)) && unlockedLessonMap.has(l.id))
    const lines = []
    units.forEach(u => {
      const titles = unlockedForAi.filter(l => l.unit_id === u.id).map(l => l.title)
      if (titles.length) lines.push(`• ${u.name}: ${titles.join(', ')}`)
    })
    const noUnit = unlockedForAi.filter(l => !l.unit_id).map(l => l.title)
    if (noUnit.length) lines.push(`• Bài khác: ${noUnit.join(', ')}`)
    return lines.join('\n')
  }, [units, lessons, unlockedTopics, unlockedLessonMap])

  const lessonsCompleted = useMemo(
    () => lessons.filter(l => progressMap[l.id]?.completed).length,
    [lessons, progressMap]
  )

  return {
    lessons, lockedLessons, unlockedTopics, unlockedLessonMap, topics, units, progressMap, loading,
    stickerCount, setStickerCount, streakDays, stickerThreshold, courseScope,
    grouped, topicChips, courseRoadmap, lessonsCompleted,
  }
}
