import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { laySticker } from '../data/hoSo'
import { NGUONG_DOI_QUA_MAC_DINH } from '../domain/sticker'
import { layMoKhoaCuaLop } from '../data/khoaHoc'
import { loTrinhKhoa } from '../domain/moKhoaBai'
import { layDanhSachBai } from '../data/baiHoc'

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
  const [stickerThreshold, setStickerThreshold] = useState(NGUONG_DOI_QUA_MAC_DINH)
  const [courseScope, setCourseScope] = useState('')

  useEffect(() => {
    if (selectedGrade && user) loadData()
  }, [selectedGrade, user?.id, className])

  async function loadData() {
    setLoading(true)
    const [
      { data: topicsData }, { data: lessonsData }, { data: lockedData }, { data: progressData },
      { data: unitsData }, { data: profData }, { data: cfgData }, { data: scopeData }, { data: visData },
      moKhoa,
    ] = await Promise.all([
      supabase.from('topics').select('*').in('grade', [selectedGrade, 'all']),
      // Chỉ cột cần vẽ con đường — KHÔNG tải đề thực hành / ghi chú AI (vài trăm KB mỗi lần mở trang)
      layDanhSachBai(selectedGrade, { xuatBan: true }),
      layDanhSachBai(selectedGrade, { xuatBan: false }),
      supabase.from('lesson_progress').select('*').eq('user_id', user.id),
      supabase.from('units').select('*').eq('grade', selectedGrade).order('sort_order').order('name'),
      laySticker(user.id),
      supabase.from('reward_configs').select('sticker_threshold').eq('grade', selectedGrade).maybeSingle(),
      supabase.from('grades').select('ai_scope').eq('value', selectedGrade).maybeSingle(),
      supabase.from('lesson_visibility').select('lesson_id').eq('user_id', user.id),
      layMoKhoaCuaLop(selectedGrade, className),
    ])
    setCourseScope(scopeData?.ai_scope || '')
    // Bài học giới hạn người xem (restricted_audience) chỉ hiện nếu có tên mình trong danh sách
    const allowedIds = new Set((visData || []).map(v => v.lesson_id))
    const visibleLessons = (lessonsData || []).filter(l => !l.restricted_audience || allowedIds.has(l.id))
    const visibleLocked = (lockedData || []).filter(l => !l.restricted_audience || allowedIds.has(l.id))
    setLessons(visibleLessons)
    setLockedLessons(visibleLocked)
    setUnlockedTopics(moKhoa?.chuDe ?? null)
    setUnlockedLessonMap(moKhoa?.bai ?? null)
    setUnits(unitsData || [])
    setTopics((topicsData || []).sort((a, b) => a.name.localeCompare(b.name, 'vi', { numeric: true })))
    const map = {}
    ;(progressData || []).forEach(p => { map[p.lesson_id] = p })
    setProgressMap(map)
    setStickerCount(profData?.sticker_count ?? 0)
    setStreakDays(profData?.streak_days ?? 0)
    setStickerThreshold(cfgData?.sticker_threshold ?? NGUONG_DOI_QUA_MAC_DINH)
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
  const courseRoadmap = useMemo(
    () => loTrinhKhoa(units, lessons, unlockedTopics && unlockedLessonMap ? { chuDe: unlockedTopics, bai: unlockedLessonMap } : null),
    [units, lessons, unlockedTopics, unlockedLessonMap]
  )

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
