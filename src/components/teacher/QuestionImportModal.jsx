import { useState } from 'react'
import { parseQuestions } from '../../utils/questionParser'
import { supabase } from '../../lib/supabase'
import { uploadImage } from '../../lib/cloudinary'
import { useAuth } from '../../context/AuthContext'
import { useUnits } from '../../hooks/useUnits'
import toast from 'react-hot-toast'
import { X, ChevronRight, Save, ImagePlus, Trash2 } from 'lucide-react'

const QUESTION_TYPES = {
  multiple_choice: 'Trắc nghiệm',
  true_false: 'Đúng / Sai',
  fill_blank: 'Điền từ',
  drag_word: 'Kéo thả từ',
  ordering: 'Sắp xếp',
  matching: 'Ghép đôi',
  word_order: 'Sắp xếp từ',
  essay: 'Tự luận',
}

export default function QuestionImportModal({ onClose, onSaved, grades, topics, defaultGrade, defaultTopic, defaultUnitId }) {
  const { user } = useAuth()
  const [step, setStep] = useState(1) // 1: paste, 2: preview & edit
  const [rawText, setRawText] = useState('')
  const [parsed, setParsed] = useState([])
  const [saving, setSaving] = useState(false)

  const topicsForGrade = (grade) =>
    topics.filter(t => (t.grade === grade || t.grade === 'all')).map(t => t.name)

  const initialGrade = defaultGrade || grades[0] || ''
  const initialTopics = topicsForGrade(initialGrade)
  const initialTopic = defaultTopic || initialTopics[0] || ''
  const [meta, setMeta] = useState({ grade: initialGrade, topic: initialTopic, unit_id: defaultUnitId || '', difficulty: 'easy' })
  const { units } = useUnits(meta.grade, meta.topic)

  const currentTopics = topicsForGrade(meta.grade)

  function handleGradeChange(grade) {
    const available = topicsForGrade(grade)
    setMeta({ ...meta, grade, topic: available[0] || '', unit_id: '' })
  }

  function handleParse() {
    const result = parseQuestions(rawText)
    if (result.length === 0) {
      toast.error('Không nhận dạng được câu hỏi. Kiểm tra lại định dạng.')
      return
    }
    setParsed(result)
    setStep(2)
  }

  function updateQuestion(index, field, value) {
    setParsed(prev => prev.map((q, i) => i === index ? { ...q, [field]: value } : q))
  }

  function updateOption(qIndex, optIndex, value) {
    setParsed(prev => prev.map((q, i) => {
      if (i !== qIndex) return q
      const options = [...q.options]
      options[optIndex] = { ...options[optIndex], text: value }
      return { ...q, options }
    }))
  }

  function updateMatchOption(qIndex, optIndex, value) {
    setParsed(prev => prev.map((q, i) => {
      if (i !== qIndex) return q
      const match_options = [...(q.match_options || [])]
      match_options[optIndex] = { ...match_options[optIndex], text: value }
      return { ...q, match_options }
    }))
  }

  function updateWordBank(qIndex, value) {
    const words = value.split(',').map(w => w.trim()).filter(Boolean)
    setParsed(prev => prev.map((q, i) => {
      if (i !== qIndex) return q
      const options = words.map((text, idx) => ({ key: String.fromCharCode(65 + idx), text }))
      return { ...q, options }
    }))
  }

  function removeQuestion(index) {
    setParsed(prev => prev.filter((_, i) => i !== index))
  }

  async function handleImageUpload(index, file) {
    const toastId = toast.loading('Đang upload ảnh...')
    try {
      const url = await uploadImage(file)
      updateQuestion(index, 'image_url', url)
      toast.success('Upload ảnh thành công', { id: toastId })
    } catch {
      toast.error('Upload ảnh thất bại', { id: toastId })
    }
  }

  async function handleSave() {
    if (parsed.length === 0) { toast.error('Không có câu hỏi nào để lưu'); return }
    setSaving(true)
    try {
      const rows = parsed.map(q => ({
        question: q.question,
        type: q.type,
        options: q.type === 'essay' ? [{ allow_file: false, max_score: 1 }] : q.options,
        match_options: q.match_options?.length ? q.match_options : null,
        correct_answer: q.type === 'essay' ? (q.correct_answer || null) : q.correct_answer,
        hint: q.hint || null,
        image_url: q.image_url || null,
        audio_url: null,
        grade: meta.grade,
        topic: meta.topic,
        unit_id: meta.unit_id || null,
        difficulty: meta.difficulty,
        created_by: user.id,
      }))
      const { error } = await supabase.from('questions').insert(rows)
      if (error) throw error
      toast.success(`Đã lưu ${rows.length} câu hỏi`)
      onSaved()
    } catch (err) {
      toast.error('Lưu thất bại: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-bold text-gray-800">
            {step === 1 ? 'Paste câu hỏi từ Word' : `Preview — ${parsed.length} câu hỏi`}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={22} /></button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5">
          {step === 1 ? (
            <div className="space-y-4">
              {/* Meta */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Khoá học</label>
                  <select value={meta.grade} onChange={e => handleGradeChange(e.target.value)}
                    className="w-full border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    {grades.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Mức độ</label>
                  <select value={meta.difficulty} onChange={e => setMeta({ ...meta, difficulty: e.target.value })}
                    className="w-full border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="easy">Dễ</option>
                    <option value="medium">Trung bình</option>
                    <option value="hard">Khó</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Chủ đề</label>
                  <select value={meta.topic} onChange={e => setMeta({ ...meta, topic: e.target.value, unit_id: '' })}
                    className="w-full border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    {currentTopics.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">
                    Bài <span className="font-normal text-gray-400">(tuỳ chọn)</span>
                  </label>
                  <select value={meta.unit_id} onChange={e => setMeta({ ...meta, unit_id: e.target.value })}
                    className="w-full border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={units.length === 0}>
                    <option value="">-- Chọn bài --</option>
                    {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Paste area */}
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  Dán nội dung từ Word vào đây
                </label>
                {/* Hướng dẫn */}
                <details className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden mb-2">
                  <summary className="px-4 py-2.5 text-sm font-medium text-gray-600 cursor-pointer select-none hover:bg-gray-100 transition">
                    📋 Hướng dẫn định dạng từng loại câu hỏi
                  </summary>
                  <div className="px-4 pb-4 pt-2 space-y-3 text-xs text-gray-600 font-mono">

                    <div>
                      <p className="font-sans font-semibold text-gray-700 mb-1">Mã loại câu hỏi (tùy chọn, đặt ngay sau "Câu N:")</p>
                      <pre className="bg-white border border-gray-200 rounded-lg p-2 whitespace-pre-wrap">{`[TN] Trắc nghiệm    [DS] Đúng/Sai     [DT] Điền từ      [KT] Kéo thả từ
[SX] Sắp xếp        [ND] Ghép đôi     [ST] Sắp xếp từ  [TL] Tự luận

Ví dụ: Câu 1: [TN] Thiết bị nào dùng để nhập dữ liệu?
       Câu 5: [SX] Sắp xếp các bước khởi động máy tính`}</pre>
                      <p className="font-sans text-gray-400 mt-1">Không dùng mã → hệ thống tự nhận dạng từ nội dung. Mã [SX] bắt buộc cho câu sắp xếp có code.</p>
                    </div>

                    <div>
                      <p className="font-sans font-semibold text-gray-700 mb-1">1. Trắc nghiệm</p>
                      <pre className="bg-white border border-gray-200 rounded-lg p-2 whitespace-pre-wrap">{`Câu 1: [TN] Thiết bị nào dùng để nhập dữ liệu?
A. Màn hình
B. Bàn phím
C. Loa
D. Máy in
Đáp án: B
Gợi ý: Bàn phím là thiết bị INPUT`}</pre>
                    </div>

                    <div>
                      <p className="font-sans font-semibold text-gray-700 mb-1">2. Đúng / Sai</p>
                      <pre className="bg-white border border-gray-200 rounded-lg p-2 whitespace-pre-wrap">{`Câu 2: CPU là bộ não của máy tính. Đúng hay sai?
Đáp án: Đúng`}</pre>
                    </div>

                    <div>
                      <p className="font-sans font-semibold text-gray-700 mb-1">3. Điền từ — 1 hoặc nhiều chỗ trống</p>
                      <pre className="bg-white border border-gray-200 rounded-lg p-2 whitespace-pre-wrap">{`Câu 3: [DT] ___ là thiết bị dùng để nhập văn bản.
Đáp án: Bàn phím

Câu 4: [DT] ___ là thiết bị nhập, ___ là thiết bị xuất.
Đáp án: Bàn phím, Màn hình`}</pre>
                      <p className="font-sans text-gray-400 mt-1">Số đáp án = số ___ trong câu (phân cách dấu phẩy)</p>
                    </div>

                    <div>
                      <p className="font-sans font-semibold text-gray-700 mb-1">4. Kéo thả từ — 1 hoặc nhiều chỗ trống</p>
                      <pre className="bg-white border border-gray-200 rounded-lg p-2 whitespace-pre-wrap">{`Câu 5: [KT] ___ là ngôn ngữ lập trình, ___ là phần mềm soạn thảo.
Từ: Python, Word, Excel, Scratch
Đáp án: Python, Word`}</pre>
                      <p className="font-sans text-gray-400 mt-1">Từ thừa trong "Từ:" → từ gây nhiễu. Số đáp án = số ___.</p>
                    </div>

                    <div>
                      <p className="font-sans font-semibold text-gray-700 mb-1">5. Sắp xếp thứ tự</p>
                      <pre className="bg-white border border-gray-200 rounded-lg p-2 whitespace-pre-wrap">{`Câu 6: [SX] Sắp xếp các bước khởi động máy tính
1. Bật màn hình
2. Bật thùng máy
3. Đăng nhập`}</pre>
                      <p className="font-sans text-gray-400 mt-1">Dùng [SX] để tránh nhầm lẫn — đặc biệt khi câu hỏi có code.</p>
                    </div>

                    <div>
                      <p className="font-sans font-semibold text-gray-700 mb-1">6. Ghép đôi</p>
                      <pre className="bg-white border border-gray-200 rounded-lg p-2 whitespace-pre-wrap">{`Câu 7: [ND] Ghép thiết bị với chức năng
Bàn phím | Nhập văn bản
Chuột | Di chuyển con trỏ
Màn hình | Hiển thị thông tin`}</pre>
                    </div>

                    <div>
                      <p className="font-sans font-semibold text-gray-700 mb-1">7. Sắp xếp từ thành câu</p>
                      <pre className="bg-white border border-gray-200 rounded-lg p-2 whitespace-pre-wrap">{`Câu 8: [ST] Sắp xếp các từ thành câu đúng
Câu đúng: Bàn phím là thiết bị nhập dữ liệu`}</pre>
                    </div>

                    <div>
                      <p className="font-sans font-semibold text-gray-700 mb-1">8. Tự luận</p>
                      <pre className="bg-white border border-gray-200 rounded-lg p-2 whitespace-pre-wrap">{`Câu 9: [TL] Em hãy nêu tên 3 thiết bị nhập dữ liệu
Gợi ý: Bàn phím, chuột, màn hình cảm ứng`}</pre>
                    </div>

                    <div>
                      <p className="font-sans font-semibold text-gray-700 mb-1">9. Câu hỏi có code — dùng ---python / --- (dễ gõ)</p>
                      <pre className="bg-white border border-gray-200 rounded-lg p-2 whitespace-pre-wrap">{`Câu 10: [TN] Đoạn code sau in ra kết quả gì?
---python
x = 5
print(x + 3)
---
A. 5
B. 3
C. 8
D. 53
Đáp án: C

Câu 11: [DT] Điền từ còn thiếu vào chỗ ___ để in ra "Xin chào"
---python
___("Xin chào")
---
Đáp án: print

Câu 12: [KT] Kéo thả từ đúng vào chỗ trống
---python
x = ___
y = ___
print(x + y)
---
Từ: 10, 20, 30, "hello"
Đáp án: 10, 20`}</pre>
                      <p className="font-sans text-gray-400 mt-1">---python / --- dễ gõ hơn backtick. Cũng dùng được: ```python ... ```</p>
                    </div>

                  </div>
                </details>

                <textarea
                  value={rawText}
                  onChange={e => setRawText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Tab') {
                      e.preventDefault()
                      const el = e.target
                      const start = el.selectionStart
                      const end = el.selectionEnd
                      const next = rawText.substring(0, start) + '    ' + rawText.substring(end)
                      setRawText(next)
                      requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = start + 4 })
                    }
                  }}
                  rows={12}
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  placeholder="Dán câu hỏi vào đây..."
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {parsed.map((q, i) => (
                <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                      Câu {i + 1} — {QUESTION_TYPES[q.type] || q.type}
                    </span>
                    <button onClick={() => removeQuestion(i)} className="text-red-400 hover:text-red-600">
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Question text */}
                  <textarea
                    value={q.question}
                    onChange={e => updateQuestion(i, 'question', e.target.value)}
                    rows={2}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                  />

                  {/* Image */}
                  <div className="flex items-center gap-3">
                    {q.image_url ? (
                      <div className="flex items-center gap-2">
                        <img src={q.image_url} alt="" className="h-16 rounded border" />
                        <button onClick={() => updateQuestion(i, 'image_url', null)}
                          className="text-xs text-red-500 hover:underline">Xóa ảnh</button>
                      </div>
                    ) : (
                      <label className="flex items-center gap-1.5 text-xs text-indigo-600 cursor-pointer hover:underline">
                        <ImagePlus size={14} /> Thêm ảnh
                        <input type="file" accept="image/*" className="hidden"
                          onChange={e => e.target.files[0] && handleImageUpload(i, e.target.files[0])} />
                      </label>
                    )}
                  </div>

                  {/* Options for multiple choice */}
                  {q.type === 'multiple_choice' && (
                    <div className="space-y-1.5">
                      {q.options.map((opt, oi) => (
                        <div key={oi} className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuestion(i, 'correct_answer', opt.key)}
                            className={`w-7 h-7 rounded-full text-xs font-bold border-2 flex-shrink-0 transition
                              ${q.correct_answer === opt.key
                                ? 'bg-green-500 border-green-500 text-white'
                                : 'border-gray-300 text-gray-500 hover:border-indigo-400'}`}
                          >
                            {opt.key}
                          </button>
                          <input
                            value={opt.text}
                            onChange={e => updateOption(i, oi, e.target.value)}
                            className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
                          />
                        </div>
                      ))}
                      <p className="text-xs text-gray-400">Bấm vào chữ cái để chọn đáp án đúng</p>
                    </div>
                  )}

                  {/* True/False */}
                  {q.type === 'true_false' && (
                    <div className="flex gap-2">
                      {['Đúng', 'Sai'].map(val => (
                        <button key={val}
                          onClick={() => updateQuestion(i, 'correct_answer', val)}
                          className={`px-4 py-1.5 rounded-lg text-sm font-medium border-2 transition
                            ${q.correct_answer === val
                              ? 'bg-green-500 border-green-500 text-white'
                              : 'border-gray-300 text-gray-600 hover:border-indigo-400'}`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Fill blank */}
                  {q.type === 'fill_blank' && (
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Đáp án</label>
                      <input
                        value={q.correct_answer || ''}
                        onChange={e => updateQuestion(i, 'correct_answer', e.target.value)}
                        className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400 w-full"
                      />
                    </div>
                  )}

                  {/* Drag word */}
                  {q.type === 'drag_word' && (
                    <div className="space-y-2">
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">Từ vựng (cách nhau bằng dấu phẩy)</label>
                        <input
                          value={q.options.map(o => o.text).join(', ')}
                          onChange={e => updateWordBank(i, e.target.value)}
                          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400 w-full"
                          placeholder="từ1, từ2, từ3..."
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">Đáp án (thứ tự từ cần điền)</label>
                        <input
                          value={q.correct_answer || ''}
                          onChange={e => updateQuestion(i, 'correct_answer', e.target.value)}
                          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400 w-full"
                          placeholder="từ1, từ2..."
                        />
                      </div>
                    </div>
                  )}

                  {/* Ordering */}
                  {q.type === 'ordering' && (
                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-500 block">Các mục (thứ tự hiện tại = đáp án đúng)</label>
                      {q.options.map((opt, oi) => (
                        <div key={oi} className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0">
                            {oi + 1}
                          </span>
                          <input
                            value={opt.text}
                            onChange={e => updateOption(i, oi, e.target.value)}
                            className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Matching */}
                  {q.type === 'matching' && (
                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-500 block">Cặp ghép đôi (trái | phải)</label>
                      {q.options.map((opt, oi) => (
                        <div key={oi} className="flex items-center gap-2">
                          <span className="w-6 text-xs font-bold text-indigo-600 text-center shrink-0">{opt.key}</span>
                          <input
                            value={opt.text}
                            onChange={e => updateOption(i, oi, e.target.value)}
                            className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
                          />
                          <span className="text-gray-400 text-xs shrink-0">→</span>
                          <input
                            value={(q.match_options || [])[oi]?.text || ''}
                            onChange={e => updateMatchOption(i, oi, e.target.value)}
                            className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Word Order */}
                  {q.type === 'word_order' && (
                    <div className="space-y-2">
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">Câu đúng (đáp án)</label>
                        <input
                          value={q.correct_answer || ''}
                          onChange={e => {
                            const sentence = e.target.value
                            const words = sentence.split(' ').filter(Boolean)
                            setParsed(prev => prev.map((item, idx) => idx !== i ? item : {
                              ...item,
                              correct_answer: sentence,
                              options: words.map((text, wi) => ({ key: String.fromCharCode(65 + wi), text }))
                            }))
                          }}
                          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400 w-full"
                          placeholder="Ví dụ: Bàn phím là thiết bị nhập dữ liệu"
                        />
                      </div>
                      {q.options.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {q.options.map((opt, oi) => (
                            <span key={oi} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded-full border border-indigo-200">
                              {opt.text}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Essay */}
                  {q.type === 'essay' && (
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Gợi ý / Đáp án mẫu (tùy chọn)</label>
                      <textarea
                        value={q.correct_answer || ''}
                        onChange={e => updateQuestion(i, 'correct_answer', e.target.value)}
                        rows={2}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400 resize-none"
                        placeholder="Nhập đáp án mẫu (không bắt buộc, giáo viên sẽ chấm)"
                      />
                    </div>
                  )}

                  {/* Hint */}
                  {q.type !== 'essay' && (
                    <div>
                      <label className="text-xs text-amber-600 block mb-1">Gợi ý khi sai (tùy chọn)</label>
                      <input
                        value={q.hint || ''}
                        onChange={e => updateQuestion(i, 'hint', e.target.value)}
                        className="border border-amber-200 bg-amber-50 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400 w-full"
                        placeholder="Nhập gợi ý cho học sinh khi trả lời sai..."
                      />
                    </div>
                  )}

                  {/* Type selector */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-500">Dạng:</label>
                    <select
                      value={q.type}
                      onChange={e => updateQuestion(i, 'type', e.target.value)}
                      className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    >
                      {Object.entries(QUESTION_TYPES).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
          <button onClick={step === 2 ? () => setStep(1) : onClose}
            className="text-sm text-gray-500 hover:text-gray-700">
            {step === 2 ? '← Quay lại' : 'Hủy'}
          </button>
          {step === 1 ? (
            <button onClick={handleParse} disabled={!rawText.trim()}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50">
              Phân tích câu hỏi <ChevronRight size={16} />
            </button>
          ) : (
            <button onClick={handleSave} disabled={saving || parsed.length === 0}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50">
              <Save size={16} /> {saving ? 'Đang lưu...' : `Lưu ${parsed.length} câu hỏi`}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
