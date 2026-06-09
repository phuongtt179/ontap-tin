import { useState } from 'react'
import QuestionFormModal from './QuestionFormModal'
import { Trash2, ChevronDown, ChevronUp, Pencil } from 'lucide-react'
import QuestionText from '../ui/QuestionText'

const TYPE_LABELS = {
  multiple_choice: 'Trắc nghiệm', true_false: 'Đúng / Sai', fill_blank: 'Điền từ',
  matching: 'Nối đôi', ordering: 'Sắp xếp', drag_word: 'Kéo thả từ',
  word_order: 'Sắp xếp từ', essay: 'Tự luận',
}

const DIFFICULTY_LABELS = { easy: 'Dễ', medium: 'Trung bình', hard: 'Khó' }

export default function QuestionCard({ question: q, index, onDelete, onUpdate, selected, onSelect }) {
  const [expanded, setExpanded] = useState(false)
  const [showEdit, setShowEdit] = useState(false)

  return (
    <>
      <div className={`bg-white border rounded-xl overflow-hidden transition ${selected ? 'border-indigo-400 ring-1 ring-indigo-300' : 'border-gray-200'}`}>
        <div
          className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center gap-3 min-w-0">
            {onSelect && (
              <input type="checkbox" checked={!!selected}
                onChange={onSelect}
                onClick={e => e.stopPropagation()}
                className="w-4 h-4 accent-indigo-600 rounded border-gray-300 cursor-pointer shrink-0"
              />
            )}
            <span className="text-sm font-semibold text-gray-400 w-6 shrink-0">{index}</span>
            <span className="text-sm text-gray-800 truncate">{q.question}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-3">
            <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">{TYPE_LABELS[q.type]}</span>
            <span className="text-xs text-gray-400">{q.grade}</span>
            {q.image_url && <span className="text-xs text-green-600">📷</span>}
            {q.audio_url && <span className="text-xs text-blue-600">🔊</span>}
            <button onClick={e => { e.stopPropagation(); setShowEdit(true) }}
              className="text-gray-400 hover:text-indigo-600 p-1 transition">
              <Pencil size={14} />
            </button>
            {onDelete && (
              <button onClick={e => { e.stopPropagation(); onDelete() }}
                className="text-red-400 hover:text-red-600 p-1">
                <Trash2 size={14} />
              </button>
            )}
            {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          </div>
        </div>

        {expanded && (
          <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-2">
            {q.image_url && <img src={q.image_url} alt="" className="rounded-lg max-h-40 border" />}
            <QuestionText text={q.question} className="text-sm font-medium text-gray-700" />

            {q.type === 'multiple_choice' && (
              <div className="grid grid-cols-2 gap-1.5">
                {q.options?.map(opt => (
                  <div key={opt.key}
                    className={`text-sm px-3 py-1.5 rounded-lg border ${q.correct_answer === opt.key
                      ? 'bg-green-50 border-green-400 text-green-700 font-medium'
                      : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                    {opt.key}. {opt.text}
                  </div>
                ))}
              </div>
            )}

            {q.type === 'true_false' && (
              <div className="flex gap-2">
                {['Đúng', 'Sai'].map(v => (
                  <span key={v} className={`text-sm px-3 py-1 rounded-lg border ${q.correct_answer === v
                    ? 'bg-green-50 border-green-400 text-green-700 font-medium'
                    : 'bg-gray-50 border-gray-200 text-gray-500'}`}>{v}</span>
                ))}
              </div>
            )}

            {q.type === 'fill_blank' && (
              <div className="text-sm text-green-700 bg-green-50 px-3 py-1.5 rounded-lg inline-block">
                Đáp án: <strong>{q.correct_answer}</strong>
              </div>
            )}

            {q.type === 'matching' && (
              <div className="space-y-1">
                {q.options?.map((opt, i) => {
                  const match = q.match_options?.[i]
                  return (
                    <div key={opt.key} className="flex items-center gap-2 text-sm">
                      <span className="px-2 py-1 bg-indigo-50 border border-indigo-200 rounded text-indigo-700">
                        {opt.image_url && <img src={opt.image_url} alt="" className="h-8 w-auto mb-0.5 rounded" />}
                        {opt.text}
                      </span>
                      <span className="text-gray-400">↔</span>
                      <span className="px-2 py-1 bg-green-50 border border-green-200 rounded text-green-700">
                        {match?.image_url && <img src={match.image_url} alt="" className="h-8 w-auto mb-0.5 rounded" />}
                        {match?.text}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}

            {q.type === 'ordering' && (
              <div className="space-y-1">
                {q.options?.map((opt, i) => (
                  <div key={opt.key} className="flex items-center gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                    <span className="text-gray-700">{opt.text}</span>
                  </div>
                ))}
              </div>
            )}

            {q.type === 'drag_word' && (
              <div className="space-y-2">
                <div className="text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-lg">
                  {q.question.split('___').map((seg, i, arr) => (
                    <span key={i}>
                      {seg}
                      {i < arr.length - 1 && (
                        <span className="inline-block bg-green-100 border border-green-300 text-green-700 text-xs font-bold px-2 py-0.5 rounded mx-1">
                          {q.correct_answer?.split(',')[i] || '___'}
                        </span>
                      )}
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1">
                  {q.options?.map(opt => (
                    <span key={opt.key} className="px-2 py-0.5 bg-indigo-50 border border-indigo-200 rounded text-xs text-indigo-700">{opt.text}</span>
                  ))}
                </div>
              </div>
            )}

            {q.type === 'word_order' && (
              <div className="space-y-2">
                <div className="text-sm text-green-700 bg-green-50 px-3 py-1.5 rounded-lg">
                  Câu đúng: <strong>{q.correct_answer}</strong>
                </div>
                <div className="flex flex-wrap gap-1">
                  {q.options?.map(opt => (
                    <span key={opt.key} className="px-2 py-0.5 bg-indigo-50 border border-indigo-200 rounded text-xs text-indigo-700">{opt.text}</span>
                  ))}
                </div>
              </div>
            )}

            {q.type === 'essay' && (
              <div className="space-y-1.5">
                <div className="text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg">
                  Tự luận — giáo viên chấm thủ công
                  {q.options?.[0]?.max_score && <span className="ml-2">| Điểm tối đa: <strong>{q.options[0].max_score}</strong></span>}
                  {q.options?.[0]?.allow_file && <span className="ml-2">| Cho nộp file</span>}
                </div>
                {q.correct_answer && (
                  <div className="text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg">
                    Đáp án mẫu: {q.correct_answer}
                  </div>
                )}
              </div>
            )}

            {q.audio_url && (
              <audio controls src={q.audio_url} className="h-8 w-full rounded mt-1" />
            )}

            <div className="flex gap-3 text-xs text-gray-400 pt-1">
              <span>Chủ đề: {q.topic}</span>
              <span>Mức độ: {DIFFICULTY_LABELS[q.difficulty]}</span>
            </div>
          </div>
        )}
      </div>

      {showEdit && (
        <QuestionFormModal
          question={q}
          onClose={() => setShowEdit(false)}
          onDone={() => { setShowEdit(false); onUpdate() }}
        />
      )}
    </>
  )
}
