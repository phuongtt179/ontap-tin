// Soạn câu hỏi: nội dung (chèn code, Tab thụt lề), ảnh / âm thanh, khoá, mức độ, chủ đề, bài, tiêu đề nhỏ.
import { useRef } from 'react'
import { useTopics } from '../../../hooks/useTopics'
import { useGrades } from '../../../hooks/useGrades'
import { useUnits } from '../../../hooks/useUnits'
import { useLessonTitles } from '../../../hooks/useLessonTitles'
import { ImageUpload, AudioUpload } from './TaiAnhAmThanh'

export default function NoiDungCauHoi({ form, setForm }) {
  const { topics } = useTopics()
  const { grades: GRADES } = useGrades()
  const topicOptions = topics.filter(t => t.grade === form.grade || t.grade === 'all')
  const { units } = useUnits(form.grade, form.topic)
  const { lessonTitles } = useLessonTitles(form.unit_id)
  const questionRef = useRef(null)

  function insertCodeTemplate(lang) {
    const el = questionRef.current
    if (!el) return
    const start = el.selectionStart ?? form.question.length
    const end = el.selectionEnd ?? start
    const newText = form.question.substring(0, start) + '```' + lang + '\n\n```' + form.question.substring(end)
    setForm({ ...form, question: newText })
    requestAnimationFrame(() => {
      el.focus()
      el.selectionStart = el.selectionEnd = start + lang.length + 4   // con trỏ vào trong khối code
    })
  }

  return (
    <>
    {/* Question text + image */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1 flex flex-wrap items-center gap-x-2">
        <span>Nội dung câu hỏi</span>
        {(form.type === 'drag_word' || form.type === 'fill_blank') && (
          <span className="text-xs font-normal text-gray-400">Dùng <code className="bg-gray-100 px-1 rounded">___</code> để đánh dấu chỗ trống</span>
        )}
        <span className="text-xs font-normal text-blue-500">Dùng <code className="bg-blue-50 px-1 rounded">```python</code> để chèn code</span>
      </label>
      <textarea ref={questionRef} value={form.question} onChange={e => setForm({ ...form, question: e.target.value })}
        onKeyDown={e => {
          if (e.key === 'Tab') {
            e.preventDefault()
            const el = e.target
            const start = el.selectionStart
            const end = el.selectionEnd
            const next = form.question.substring(0, start) + '    ' + form.question.substring(end)
            setForm({ ...form, question: next })
            requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = start + 4 })
          }
        }}
        rows={3} placeholder={form.type === 'drag_word' ? 'Ví dụ: Chuột là thiết bị ___ dữ liệu' : 'Nhập nội dung câu hỏi...'}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-mono" />
      <div className="mt-1 flex flex-wrap gap-1.5">
        <button type="button" onClick={() => insertCodeTemplate('python')}
          className="text-xs px-2 py-0.5 rounded border border-blue-200 text-blue-600 hover:bg-blue-50 font-mono transition">
          + code python
        </button>
        <button type="button" onClick={() => insertCodeTemplate('')}
          className="text-xs px-2 py-0.5 rounded border border-gray-200 text-gray-500 hover:bg-gray-50 font-mono transition">
          + code khác
        </button>
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-3">
        <ImageUpload value={form.image_url} onChange={v => setForm({ ...form, image_url: v })} />
        <AudioUpload value={form.audio_url} onChange={v => setForm({ ...form, audio_url: v })} />
      </div>
    </div>

    {/* Grade / Topic / Unit / Difficulty */}
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Khoá học</label>
        <select value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value, topic: '', unit_id: '' })}
          className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Mức độ</label>
        <select value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="easy">Dễ</option>
          <option value="medium">Trung bình</option>
          <option value="hard">Khó</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Chủ đề</label>
        <select value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value, unit_id: '' })}
          className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">-- Chủ đề --</option>
          {topicOptions.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Bài <span className="text-xs font-normal text-gray-400">(tuỳ chọn)</span>
        </label>
        <select value={form.unit_id} onChange={e => setForm({ ...form, unit_id: e.target.value, lesson_title_id: '' })}
          className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          disabled={!form.topic || units.length === 0}>
          <option value="">-- Chọn bài --</option>
          {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        {form.topic && units.length === 0 && (
          <p className="text-xs text-gray-400 mt-0.5">Chủ đề này chưa có bài nào</p>
        )}
      </div>
      {lessonTitles.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tiêu đề <span className="text-xs font-normal text-gray-400">(tuỳ chọn)</span>
          </label>
          <select value={form.lesson_title_id} onChange={e => setForm({ ...form, lesson_title_id: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">-- Tất cả tiêu đề --</option>
            {lessonTitles.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      )}
    </div>
    </>
  )
}
