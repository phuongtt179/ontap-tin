import { useState } from 'react'
import { parseQuestions } from '../../utils/questionParser'
import { checkParsedQuestions } from '../../utils/questionCheck'
import AiQuestionPanel from './AiQuestionPanel'
import { dongLuuCauNhap } from '../../domain/soanCauHoi'
import HuongDanNhap from './cauHoi/HuongDanNhap'
import SuaCauNhap from './cauHoi/SuaCauNhap'
import { themCauHoi } from '../../data/cauHoi'
import { uploadImage } from '../../lib/cloudinary'
import { useAuth } from '../../context/AuthContext'
import { useUnits } from '../../hooks/useUnits'
import { useLessonTitles } from '../../hooks/useLessonTitles'
import toast from 'react-hot-toast'
import { X, ChevronRight, Save, ImagePlus, Trash2 } from 'lucide-react'

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
  const [meta, setMeta] = useState({ grade: initialGrade, topic: initialTopic, unit_id: defaultUnitId || '', lesson_title_id: '', difficulty: 'easy' })
  const { units } = useUnits(meta.grade, meta.topic)
  const { lessonTitles } = useLessonTitles(meta.unit_id)

  const currentTopics = topicsForGrade(meta.grade)
  const issues = step === 2 ? checkParsedQuestions(parsed) : []

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

  /** sửa nhiều trường của 1 câu một lúc */
  function doiNhieu(index, thayDoi) {
    setParsed(prev => prev.map((q, i) => (i === index ? { ...q, ...thayDoi } : q)))
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
      const rows = parsed.map(q => dongLuuCauNhap(q, meta, user.id))
      const { data: inserted, error } = await themCauHoi(rows)
      if (error) throw error
      toast.success(`Đã lưu ${rows.length} câu hỏi`)
      onSaved(inserted?.map(q => q.id) || [])
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
                  <select value={meta.unit_id} onChange={e => setMeta({ ...meta, unit_id: e.target.value, lesson_title_id: '' })}
                    className="w-full border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={units.length === 0}>
                    <option value="">-- Chọn bài --</option>
                    {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                {lessonTitles.length > 0 && (
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-gray-600 mb-1 block">
                      Tiêu đề <span className="font-normal text-gray-400">(tuỳ chọn)</span>
                    </label>
                    <select value={meta.lesson_title_id} onChange={e => setMeta({ ...meta, lesson_title_id: e.target.value })}
                      className="w-full border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="">-- Tất cả / Không chọn --</option>
                      {lessonTitles.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                )}
              </div>

              <AiQuestionPanel grade={meta.grade} difficulty={meta.difficulty} onText={setRawText} />

              {/* Paste area */}
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  Dán nội dung từ Word vào đây
                </label>
                {/* Hướng dẫn */}
                <HuongDanNhap />

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
                <SuaCauNhap key={i} q={q} i={i} issues={issues} updateQuestion={updateQuestion} updateOption={updateOption}
                  updateMatchOption={updateMatchOption} updateWordBank={updateWordBank} doiNhieu={doiNhieu} removeQuestion={removeQuestion} handleImageUpload={handleImageUpload} />
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
