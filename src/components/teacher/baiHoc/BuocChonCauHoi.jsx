// Bước 2 của form bài học: chọn câu hỏi quiz từ ngân hàng (lọc chủ đề / đơn vị / tiêu đề / mức độ, chọn ngẫu nhiên),
// hoặc nhờ AI soạn câu mới. Chỉ sửa form.question_ids của form cha.
import { useState, useEffect } from 'react'
import { Check, RefreshCw } from 'lucide-react'
import AiNewQuestionsPanel from '../AiNewQuestionsPanel'
import { useUnits } from '../../../hooks/useUnits'
import { useLessonTitles } from '../../../hooks/useLessonTitles'
import { locCauHoi } from '../../../data/cauHoi'
import { xaoTron } from '../../../utils/xaoTron'

const DIFFICULTY_LABELS = { easy: 'Dễ', medium: 'Trung bình', hard: 'Khó' }
const TYPE_LABELS = {
  multiple_choice: 'Trắc nghiệm', true_false: 'Đúng/Sai', fill_blank: 'Điền từ',
  matching: 'Nối đôi', ordering: 'Sắp xếp', drag_word: 'Kéo thả từ',
}

export default function BuocChonCauHoi({ form, setForm, userId, filteredTopics }) {
  const [filterTopic, setFilterTopic] = useState('')
  const [filterUnit, setFilterUnit] = useState('')
  const [filterDiff, setFilterDiff] = useState('')
  const [filterLessonTitle, setFilterLessonTitle] = useState('')
  const [randomCount, setRandomCount] = useState(10)
  const [refreshKey, setRefreshKey] = useState(0)
  const { units: filterUnits } = useUnits(form.grade, filterTopic)
  const { lessonTitles: filterLessonTitles } = useLessonTitles(filterUnit)

  // Kết quả lọc gắn với bộ lọc đã dùng: bộ lọc đổi mà chưa có kết quả mới = đang tải
  const boLoc = JSON.stringify([form.grade, filterTopic, filterUnit, filterLessonTitle, filterDiff, refreshKey])
  const [ketQua, setKetQua] = useState({ boLoc: null, ds: [] })
  const loadingQ = ketQua.boLoc !== boLoc
  const questions = ketQua.ds
  useEffect(() => {
    locCauHoi(form.grade, { topic: filterTopic, unitId: filterUnit, lessonTitleId: filterLessonTitle, difficulty: filterDiff })
      .then(({ data }) => setKetQua({ boLoc, ds: data || [] }))
  }, [boLoc]) // eslint-disable-line react-hooks/exhaustive-deps -- boLoc đã gồm đủ các bộ lọc

  // Auto-clean stale question_ids once the full (unfiltered) question list is loaded
  useEffect(() => {
    if (loadingQ || filterTopic || filterUnit || filterLessonTitle || filterDiff || questions.length === 0) return
    const validIds = new Set(questions.map(q => q.id))
    setForm(f => {
      const cleaned = f.question_ids.filter(id => validIds.has(id))
      return cleaned.length === f.question_ids.length ? f : { ...f, question_ids: cleaned }
    })
  }, [loadingQ, filterTopic, filterUnit, filterLessonTitle, filterDiff, questions, setForm])

  function toggleQuestion(id) {
    setForm(f => ({
      ...f,
      question_ids: f.question_ids.includes(id)
        ? f.question_ids.filter(x => x !== id)
        : [...f.question_ids, id],
    }))
  }

  function pickRandom() {
    const pool = questions.filter(q => !form.question_ids.includes(q.id))
    const picked = xaoTron(pool).slice(0, randomCount)
    setForm(f => ({ ...f, question_ids: [...new Set([...f.question_ids, ...picked.map(q => q.id)])] }))
  }

  function clearAll() {
    setForm(f => ({ ...f, question_ids: [] }))
  }

  return (
    <div>
      <AiNewQuestionsPanel form={form} userId={userId} onCreated={ids => {
        // Câu mới tạo: tự tích chọn cho bài + bỏ lọc để thấy ngay ở đầu danh sách
        setForm(f => ({ ...f, question_ids: [...new Set([...f.question_ids, ...ids])] }))
        setFilterTopic(''); setFilterUnit(''); setFilterLessonTitle(''); setFilterDiff('')
        setRefreshKey(k => k + 1)
      }} />
      {/* Filters */}
      <div className="flex gap-2 mb-3 flex-wrap items-center">
        <select value={filterTopic} onChange={e => { setFilterTopic(e.target.value); setFilterUnit(''); setFilterLessonTitle('') }}
          className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">Tất cả chủ đề</option>
          {filteredTopics.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
        </select>
        {filterUnits.length > 0 && (
          <select value={filterUnit} onChange={e => { setFilterUnit(e.target.value); setFilterLessonTitle('') }}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">Tất cả bài</option>
            {filterUnits.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        )}
        {filterUnit && filterLessonTitles.length > 0 && (
          <select value={filterLessonTitle} onChange={e => setFilterLessonTitle(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">Tất cả tiêu đề</option>
            {filterLessonTitles.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        )}
        <select value={filterDiff} onChange={e => setFilterDiff(e.target.value)}
          className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">Tất cả mức độ</option>
          <option value="easy">Dễ</option>
          <option value="medium">Trung bình</option>
          <option value="hard">Khó</option>
        </select>
        <div className="flex items-center gap-1 ml-auto">
          <input type="number" min={1} max={50} value={randomCount}
            onChange={e => setRandomCount(Number(e.target.value))}
            className="w-14 border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <button onClick={pickRandom}
            className="flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg text-sm font-medium transition">
            <RefreshCw size={13} /> Ngẫu nhiên
          </button>
          {form.question_ids.length > 0 && (
            <button onClick={clearAll} className="text-xs text-red-500 hover:text-red-700 px-2 py-1.5">Bỏ tất cả</button>
          )}
        </div>
      </div>
      {loadingQ ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-indigo-600" />
        </div>
      ) : questions.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm">Không có câu hỏi nào cho khối {form.grade}</div>
      ) : (
        <div className="space-y-1.5">
          {questions.map(q => {
            const checked = form.question_ids.includes(q.id)
            return (
              <button key={q.id} onClick={() => toggleQuestion(q.id)}
                className={`w-full flex items-start gap-3 p-3 rounded-xl border-2 text-left transition ${checked ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-indigo-200 bg-white'}`}>
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition ${checked ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}`}>
                  {checked && <Check size={11} className="text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 line-clamp-2">{q.question}</p>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    <span className="text-xs text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">{TYPE_LABELS[q.type]}</span>
                    <span className="text-xs text-gray-400">{DIFFICULTY_LABELS[q.difficulty]}</span>
                    {q.topic && <span className="text-xs text-gray-400">{q.topic}</span>}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
