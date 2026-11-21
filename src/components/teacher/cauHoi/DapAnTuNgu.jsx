// Ô đáp án: điền từ (mỗi chỗ trống ___ một đáp án), kéo thả từ, sắp xếp từ thành câu (chia cụm bằng /), tự luận.
import { Plus, Trash2 } from 'lucide-react'
import { splitPhrases } from '../../../utils/wordOrder'
import { soChoTrong } from '../../../domain/soanCauHoi'

/** từ gây nhiễu thêm vào ngân hàng từ (kéo thả từ + sắp xếp từ dùng chung) */
function DanhSachTuNhieu({ form, setForm }) {
  const setDistractor = (i, value) => { const drag_distractors = [...form.drag_distractors]; drag_distractors[i] = value; setForm({ ...form, drag_distractors }) }
  return (
    <div className="space-y-2">
      {form.drag_distractors.map((w, i) => (
        <div key={i} className="flex items-center gap-2">
          <input value={w} onChange={e => setDistractor(i, e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder={`Từ gây nhiễu ${i + 1}`} />
          {form.drag_distractors.length > 1 && (
            <button onClick={() => setForm({ ...form, drag_distractors: form.drag_distractors.filter((_, idx) => idx !== i) })}
              className="text-red-400 hover:text-red-600 shrink-0"><Trash2 size={14} /></button>
          )}
        </div>
      ))}
      <button onClick={() => setForm({ ...form, drag_distractors: [...form.drag_distractors, ''] })}
        className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800">
        <Plus size={14} /> Thêm từ gây nhiễu
      </button>
    </div>
  )
}

export default function DapAnTuNgu({ form, setForm }) {
  const blankCount = soChoTrong(form.question)
  const setDragAnswer = (i, value) => { const drag_answers = [...form.drag_answers]; drag_answers[i] = value; setForm({ ...form, drag_answers }) }
  const setFillAnswer = (i, value) => { const fill_answers = [...form.fill_answers]; fill_answers[i] = value; setForm({ ...form, fill_answers }) }
  return (
    <>
    {/* Fill blank */}
    {form.type === 'fill_blank' && (
      <div>
        {blankCount === 0 && (
          <div className="bg-yellow-50 rounded-lg px-3 py-2 text-sm text-yellow-700 mb-3">
            Nhập <code className="bg-yellow-100 px-1 rounded">___</code> vào câu hỏi để tạo chỗ trống
          </div>
        )}
        {blankCount > 0 ? (
          <div>
            <div className="bg-indigo-50 rounded-lg px-3 py-2 text-sm text-indigo-700 mb-3">
              Phát hiện <strong>{blankCount}</strong> chỗ trống
            </div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Đáp án cho mỗi chỗ trống</label>
            <div className="space-y-2">
              {Array.from({ length: blankCount }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                  <input
                    value={form.fill_answers[i] || ''}
                    onChange={e => setFillAnswer(i, e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder={`Đáp án chỗ trống ${i + 1}`} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Đáp án</label>
            <input value={form.correct_answer} onChange={e => setForm({ ...form, correct_answer: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Nhập đáp án đúng" />
          </div>
        )}
      </div>
    )}
    {/* Drag word */}
    {form.type === 'drag_word' && (
      <div className="space-y-4">
        {blankCount > 0 ? (
          <div className="bg-indigo-50 rounded-lg px-3 py-2 text-sm text-indigo-700">
            Phát hiện <strong>{blankCount}</strong> chỗ trống
          </div>
        ) : (
          <div className="bg-yellow-50 rounded-lg px-3 py-2 text-sm text-yellow-700">
            Nhập <code className="bg-yellow-100 px-1 rounded">___</code> vào câu hỏi để tạo chỗ trống
          </div>
        )}

        {/* Correct words per blank */}
        {blankCount > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Từ đúng cho mỗi chỗ trống</label>
            <div className="space-y-2">
              {Array.from({ length: blankCount }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                  <input
                    value={form.drag_answers[i] || ''}
                    onChange={e => setDragAnswer(i, e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder={`Từ đúng cho chỗ trống ${i + 1}`} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Distractor words */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Từ gây nhiễu (thêm vào ngân hàng từ)</label>
          <DanhSachTuNhieu form={form} setForm={setForm} />
        </div>
      </div>
    )}
    {/* Sắp xếp từ thành câu */}
    {form.type === 'word_order' && (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Câu đúng cần sắp xếp
            <span className="ml-2 text-xs font-normal text-gray-400">Ngăn các cụm từ bằng dấu / (không có / thì app tự gom 2–3 tiếng một cụm)</span>
          </label>
          <input
            value={form.correct_answer}
            onChange={e => setForm({ ...form, correct_answer: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Ví dụ: Con mèo / ngồi / trên bàn học"
          />
          {form.correct_answer.trim() && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {splitPhrases(form.correct_answer).chunks.map((w, i) => (
                <span key={i} className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-xs font-medium border border-indigo-200">{w}</span>
              ))}
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Từ gây nhiễu <span className="text-xs font-normal text-gray-400">(tùy chọn — tăng độ khó)</span></label>
          <DanhSachTuNhieu form={form} setForm={setForm} />
        </div>
      </div>
    )}

    {/* Tự luận */}
    {form.type === 'essay' && (
      <div className="space-y-4">
        <div className="bg-blue-50 rounded-lg px-3 py-2 text-sm text-blue-700">
          Câu tự luận — học sinh gõ bài làm và/hoặc nộp file. Giáo viên chấm điểm thủ công.
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Gợi ý / Đáp án mẫu <span className="text-xs font-normal text-gray-400">(chỉ giáo viên thấy khi chấm)</span>
          </label>
          <textarea
            value={form.correct_answer}
            onChange={e => setForm({ ...form, correct_answer: e.target.value })}
            rows={3}
            placeholder="Nhập đáp án mẫu hoặc tiêu chí chấm điểm..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Điểm tối đa <span className="text-xs font-normal text-gray-400">(câu này chiếm bao nhiêu điểm)</span>
          </label>
          <input type="number" min={0.5} max={10} step={0.5}
            value={form.essay_max_score}
            onChange={e => setForm({ ...form, essay_max_score: e.target.value })}
            className="w-28 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex items-center gap-3">
          <button type="button"
            onClick={() => setForm({ ...form, allow_file: !form.allow_file })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition shrink-0 ${form.allow_file ? 'bg-indigo-600' : 'bg-gray-300'}`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${form.allow_file ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
          <span className="text-sm text-gray-700">Cho phép học sinh nộp file đính kèm</span>
        </div>
      </div>
    )}
    </>
  )
}
