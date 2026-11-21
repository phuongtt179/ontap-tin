// Bước 2 soạn đề: lọc câu hỏi của khoá theo chủ đề / mức độ, tick chọn hoặc lấy ngẫu nhiên.
// Bộ lọc là của riêng bước này (rời bước thì đặt lại) — giống bước chọn câu hỏi của bài học.
import { useState, useEffect } from 'react'
import { Check, RefreshCw } from 'lucide-react'
import { locCauHoi } from '../../../data/cauHoi'
import { layChuDe } from '../../../data/chuDe'
import { xaoTron } from '../../../utils/xaoTron'

const DIFFICULTY_LABELS = { easy: 'Dễ', medium: 'Trung bình', hard: 'Khó' }
const TYPE_LABELS = { multiple_choice: 'Trắc nghiệm', true_false: 'Đúng/Sai', fill_blank: 'Điền từ', matching: 'Nối đôi', ordering: 'Sắp xếp', drag_word: 'Kéo thả từ' }

export default function BuocChonCauHoiDe({ form, setForm }) {
  const [questions, setQuestions] = useState([])
  const [topics, setTopics] = useState([])
  const [filterTopic, setFilterTopic] = useState('')
  const [filterDiff, setFilterDiff] = useState('')
  const [randomCount, setRandomCount] = useState(10)
  const boLoc = `${form.grade}|${filterTopic}|${filterDiff}`
  const [daTai, setDaTai] = useState(null)   // bộ lọc của danh sách đang hiện (khác boLoc = đang tải)
  const loadingQ = daTai !== boLoc

  useEffect(() => {
    locCauHoi(form.grade, { topic: filterTopic, difficulty: filterDiff }).then(({ data }) => {
      setQuestions(data || [])
      setDaTai(`${form.grade}|${filterTopic}|${filterDiff}`)
    })
  }, [form.grade, filterTopic, filterDiff])
  useEffect(() => {
    layChuDe([form.grade, 'all']).then(({ data }) => setTopics(data?.map(t => t.name) || []))
  }, [form.grade])

  function toggleQuestion(id) {
    setForm(f => ({
      ...f,
      question_ids: f.question_ids.includes(id) ? f.question_ids.filter(x => x !== id) : [...f.question_ids, id],
    }))
  }

  function chonNgauNhien() {
    const conLai = questions.filter(q => !form.question_ids.includes(q.id))
    const chon = xaoTron(conLai).slice(0, randomCount)
    setForm(f => ({ ...f, question_ids: [...new Set([...f.question_ids, ...chon.map(q => q.id)])] }))
  }

  return (
    <div>
      {/* Filters + random */}
      <div className="flex gap-2 mb-4 flex-wrap items-center">
        <select value={filterTopic} onChange={e => setFilterTopic(e.target.value)}
          className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">Tất cả chủ đề</option>
          {topics.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
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
          <button onClick={chonNgauNhien}
            className="flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg text-sm font-medium transition">
            <RefreshCw size={13} /> Ngẫu nhiên
          </button>
          {form.question_ids.length > 0 && (
            <button onClick={() => setForm(f => ({ ...f, question_ids: [] }))} className="text-xs text-red-500 hover:text-red-700 px-2 py-1.5">Bỏ tất cả</button>
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
