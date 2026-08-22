import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { X, Lock, Unlock, Check } from 'lucide-react'

function byOrderThenCreated(a, b) {
  const oa = a.order ?? 0
  const ob = b.order ?? 0
  if (oa !== ob) return oa - ob
  return new Date(a.created_at) - new Date(b.created_at)
}

/**
 * Popup mở khoá theo 2 tầng cho 1 lớp: chọn chủ đề (bên trái) → mở/khoá cả
 * chủ đề (khoá 1) → trong chủ đề đã mở, tick từng bài muốn mở cho lớp (khoá
 * 2, không cần theo thứ tự). Ghi trực tiếp vào class_topic_unlock/
 * class_lesson_unlock — học sinh thấy ngay lần tải trang kế tiếp.
 */
export default function UnlockLessonsModal({ cls, onClose }) {
  const [loading, setLoading] = useState(true)
  const [lessonsByTopic, setLessonsByTopic] = useState({})
  const [topicOrder, setTopicOrder] = useState([]) // [{key, label}]
  const [unlockedTopics, setUnlockedTopics] = useState(new Set())
  const [unlockedLessons, setUnlockedLessons] = useState(new Set())
  const [selectedTopic, setSelectedTopic] = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    // Lấy TẤT CẢ bài (kể cả chưa publish) để biết đủ danh sách chủ đề của
    // khoá — trước đây chỉ lấy bài đã publish nên chủ đề nào chưa publish
    // bài nào sẽ biến mất khỏi popup dù đã tồn tại (thấy được ở trang Chủ đề).
    // Ô tick mở bài thì vẫn chỉ hiện bài ĐÃ publish (chưa publish không có gì để mở).
    const [{ data: topicsData }, { data: allLessonsData }, { data: topicUnlockRows }, { data: lessonUnlockRows }] = await Promise.all([
      supabase.from('topics').select('name').in('grade', [cls.grade, 'all']),
      supabase.from('lessons').select('id, title, topic, "order", created_at, is_published')
        .eq('grade', cls.grade),
      supabase.from('class_topic_unlock').select('topic').eq('grade', cls.grade).eq('class_name', cls.name),
      supabase.from('class_lesson_unlock').select('lesson_id').eq('grade', cls.grade).eq('class_name', cls.name),
    ])

    const byTopicAll = {}
    const byTopicPublished = {}
    ;(allLessonsData || []).forEach(l => {
      const k = l.topic || '__no_topic__'
      ;(byTopicAll[k] ||= []).push(l)
      if (l.is_published) (byTopicPublished[k] ||= []).push(l)
    })
    Object.keys(byTopicPublished).forEach(k => byTopicPublished[k].sort(byOrderThenCreated))
    setLessonsByTopic(byTopicPublished)

    const named = (topicsData || []).map(t => t.name)
    const allKeys = [...new Set([...named, ...Object.keys(byTopicAll)])]
    allKeys.sort((a, b) => a.localeCompare(b, 'vi', { numeric: true }))
    const order = allKeys.map(k => ({ key: k, label: k === '__no_topic__' ? 'Chưa phân loại' : k }))
    setTopicOrder(order)

    setUnlockedTopics(new Set((topicUnlockRows || []).map(r => r.topic)))
    setUnlockedLessons(new Set((lessonUnlockRows || []).map(r => r.lesson_id)))
    setSelectedTopic(prev => (prev && byTopicAll[prev]) ? prev : (order[0]?.key ?? null))
    setLoading(false)
  }

  async function toggleTopic(topicKey, nextOpen) {
    setUnlockedTopics(prev => {
      const s = new Set(prev)
      nextOpen ? s.add(topicKey) : s.delete(topicKey)
      return s
    })
    if (nextOpen) {
      const { error } = await supabase.from('class_topic_unlock')
        .insert({ grade: cls.grade, class_name: cls.name, topic: topicKey })
      if (error && error.code !== '23505') toast.error('Lỗi mở chủ đề: ' + error.message)
    } else {
      const { error } = await supabase.from('class_topic_unlock')
        .delete().eq('grade', cls.grade).eq('class_name', cls.name).eq('topic', topicKey)
      if (error) toast.error('Lỗi khoá chủ đề: ' + error.message)
    }
  }

  async function toggleLesson(lessonId, nextOpen) {
    setUnlockedLessons(prev => {
      const s = new Set(prev)
      nextOpen ? s.add(lessonId) : s.delete(lessonId)
      return s
    })
    if (nextOpen) {
      const { error } = await supabase.from('class_lesson_unlock')
        .insert({ grade: cls.grade, class_name: cls.name, lesson_id: lessonId })
      if (error && error.code !== '23505') toast.error('Lỗi mở bài: ' + error.message)
    } else {
      const { error } = await supabase.from('class_lesson_unlock')
        .delete().eq('grade', cls.grade).eq('class_name', cls.name).eq('lesson_id', lessonId)
      if (error) toast.error('Lỗi khoá bài: ' + error.message)
    }
  }

  const currentLessons = selectedTopic ? (lessonsByTopic[selectedTopic] || []) : []
  const topicIsOpen = selectedTopic ? unlockedTopics.has(selectedTopic) : false

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Mở bài học cho lớp {cls.name}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{cls.grade}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-indigo-600" />
          </div>
        ) : topicOrder.length === 0 ? (
          <div className="text-center py-16 text-gray-400 px-5">Khoá này chưa có bài học nào đã publish</div>
        ) : (
          <div className="flex flex-1 min-h-0">
            {/* Chọn chủ đề */}
            <div className="w-40 shrink-0 border-r border-gray-100 overflow-y-auto py-2">
              {topicOrder.map(t => {
                const open = unlockedTopics.has(t.key)
                const active = selectedTopic === t.key
                return (
                  <button
                    key={t.key}
                    onClick={() => setSelectedTopic(t.key)}
                    className={`w-full text-left px-3 py-2.5 text-sm flex items-center gap-1.5 transition
                      ${active ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    {open ? <Unlock size={12} className="text-emerald-500 shrink-0" /> : <Lock size={12} className="text-gray-300 shrink-0" />}
                    <span className="truncate">{t.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Danh sách bài của chủ đề đang chọn */}
            <div className="flex-1 overflow-y-auto p-4">
              <label className="flex items-center gap-2.5 mb-4 p-3 rounded-xl bg-gray-50 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={topicIsOpen}
                  onChange={e => toggleTopic(selectedTopic, e.target.checked)}
                  className="w-4 h-4 accent-indigo-600"
                />
                <span className="text-sm font-semibold text-gray-700">
                  Mở chủ đề này cho lớp {cls.name}
                </span>
              </label>

              {!topicIsOpen && (
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-3">
                  Chủ đề đang khoá — học sinh sẽ không bấm vào được, kể cả khi có bài đã tick mở bên dưới.
                </p>
              )}

              {currentLessons.length === 0 && (
                <p className="text-xs text-gray-400 px-1 mb-2">Chủ đề này chưa có bài nào được publish.</p>
              )}

              <div className="space-y-1.5">
                {currentLessons.map(l => {
                  const checked = unlockedLessons.has(l.id)
                  return (
                    <label
                      key={l.id}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={e => toggleLesson(l.id, e.target.checked)}
                        className="w-4 h-4 accent-indigo-600 shrink-0"
                      />
                      <span className={`text-sm flex-1 min-w-0 truncate ${checked ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
                        {l.title}
                      </span>
                      {checked && <Check size={14} className="text-emerald-500 shrink-0" />}
                    </label>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
