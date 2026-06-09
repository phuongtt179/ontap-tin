import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useGrades } from '../../hooks/useGrades'
import { useTopics } from '../../hooks/useTopics'
import { useUnits, useUnitsByGrade } from '../../hooks/useUnits'
import toast from 'react-hot-toast'
import {
  Plus, Pencil, Trash2, FileText, X, Loader2, Check, Upload,
  ToggleLeft, ToggleRight, RefreshCw, PlayCircle, BookOpen, ClipboardList,
  ChevronDown, ChevronRight, Eye,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { uploadFile } from '../../lib/cloudinary'
import QuizSession from '../../components/student/QuizSession'

const DIFFICULTY_LABELS = { easy: 'Dễ', medium: 'Trung bình', hard: 'Khó' }
const TYPE_LABELS = {
  multiple_choice: 'Trắc nghiệm', true_false: 'Đúng/Sai', fill_blank: 'Điền từ',
  matching: 'Nối đôi', ordering: 'Sắp xếp', drag_word: 'Kéo thả từ',
}

function parseTasks(instructions) {
  if (!instructions) return [{ instructions: '' }]
  try {
    const arr = JSON.parse(instructions)
    if (Array.isArray(arr) && arr.length > 0) return arr
  } catch {}
  return [{ instructions }]
}

/* ── LessonFormModal ───────────────────────────────────────── */
function LessonFormModal({ lesson, defaultGrade, defaultTopic, defaultUnitId, onClose, onDone }) {
  const { user } = useAuth()
  const { grades: GRADES } = useGrades()
  const { topics: ALL_TOPICS } = useTopics()
  const isEdit = !!lesson
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    title: lesson?.title || '',
    grade: lesson?.grade || defaultGrade || (GRADES[0] || '3'),
    topic: lesson?.topic || defaultTopic || '',
    description: lesson?.description || '',
    video_url: lesson?.video_url || '',
    pptx_url: lesson?.pptx_url || '',
    order: lesson?.order ?? 0,
    unit_id: lesson?.unit_id || defaultUnitId || '',
    has_practice: lesson?.has_practice ?? false,
    practice_tasks: parseTasks(lesson?.practice_instructions),
    is_published: lesson?.is_published ?? false,
    question_ids: lesson?.question_ids || [],
  })
  const [questions, setQuestions] = useState([])
  const [filterTopic, setFilterTopic] = useState('')
  const [filterUnit, setFilterUnit] = useState('')
  const [filterDiff, setFilterDiff] = useState('')
  const [randomCount, setRandomCount] = useState(10)
  const [saving, setSaving] = useState(false)
  const [loadingQ, setLoadingQ] = useState(false)
  const [pptxUploading, setPptxUploading] = useState(false)

  async function handlePptxUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setPptxUploading(true)
    try {
      const url = await uploadFile(file)
      setForm(f => ({ ...f, pptx_url: url }))
      toast.success('Đã tải lên file PPTX')
    } catch (err) {
      toast.error('Tải file thất bại: ' + err.message)
    } finally {
      setPptxUploading(false)
      e.target.value = ''
    }
  }

  // Sync grade default when GRADES loads
  useEffect(() => {
    if (!isEdit && GRADES.length > 0 && !form.grade) {
      setForm(f => ({ ...f, grade: defaultGrade || GRADES[0] }))
    }
  }, [GRADES])

  const filteredTopics = ALL_TOPICS.filter(
    t => !form.grade || t.grade === form.grade || t.grade === 'all'
  )
  const { units: lessonUnits } = useUnits(form.grade, form.topic)
  const { units: filterUnits } = useUnits(form.grade, filterTopic)

  useEffect(() => {
    if (step !== 2) return
    setLoadingQ(true)
    let q = supabase.from('questions').select('id, question, type, difficulty, topic, unit_id').eq('grade', form.grade)
    if (filterTopic) q = q.eq('topic', filterTopic)
    if (filterUnit) q = q.eq('unit_id', filterUnit)
    if (filterDiff) q = q.eq('difficulty', filterDiff)
    q.order('created_at', { ascending: false }).then(({ data }) => {
      setQuestions(data || [])
      setLoadingQ(false)
    })
  }, [step, form.grade, filterTopic, filterUnit, filterDiff])

  // Auto-clean stale question_ids once the full (unfiltered) question list is loaded
  useEffect(() => {
    if (step !== 2 || loadingQ || filterTopic || filterUnit || filterDiff || questions.length === 0) return
    const validIds = new Set(questions.map(q => q.id))
    setForm(f => {
      const cleaned = f.question_ids.filter(id => validIds.has(id))
      return cleaned.length === f.question_ids.length ? f : { ...f, question_ids: cleaned }
    })
  }, [step, loadingQ, filterTopic, filterUnit, filterDiff, questions])

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
    const picked = [...pool].sort(() => Math.random() - 0.5).slice(0, randomCount)
    setForm(f => ({ ...f, question_ids: [...new Set([...f.question_ids, ...picked.map(q => q.id)])] }))
  }

  function clearAll() {
    setForm(f => ({ ...f, question_ids: [] }))
  }

  function addTask() {
    setForm(f => ({ ...f, practice_tasks: [...f.practice_tasks, { instructions: '' }] }))
  }
  function removeTask(idx) {
    setForm(f => ({ ...f, practice_tasks: f.practice_tasks.filter((_, i) => i !== idx) }))
  }
  function updateTask(idx, val) {
    setForm(f => ({ ...f, practice_tasks: f.practice_tasks.map((t, i) => i === idx ? { ...t, instructions: val } : t) }))
  }

  async function handleSave() {
    if (!form.title.trim()) { toast.error('Nhập tiêu đề bài học'); return }
    setSaving(true)
    const payload = {
      title: form.title.trim(),
      grade: form.grade,
      topic: form.topic || null,
      unit_id: form.unit_id || null,
      description: form.description.trim() || null,
      video_url: form.video_url.trim() || null,
      pptx_url: form.pptx_url || null,
      order: form.order || 0,
      has_practice: form.has_practice,
      practice_type: null,
      practice_instructions: form.has_practice
        ? JSON.stringify(form.practice_tasks.filter(t => t.instructions.trim()))
        : null,
      is_published: form.is_published,
      question_ids: form.question_ids,
    }
    const { error } = isEdit
      ? await supabase.from('lessons').update(payload).eq('id', lesson.id)
      : await supabase.from('lessons').insert({ ...payload, created_by: user.id })
    setSaving(false)
    if (error) toast.error('Lưu thất bại: ' + error.message)
    else { toast.success(isEdit ? 'Đã cập nhật bài học' : 'Đã tạo bài học'); onDone() }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-800">{isEdit ? 'Sửa bài học' : 'Tạo bài học mới'}</h2>
            <div className="flex gap-2 mt-1.5">
              <button
                onClick={() => setStep(1)}
                className={`text-xs px-3 py-0.5 rounded-full font-medium transition ${step === 1 ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              >
                1. Thông tin
              </button>
              <button
                onClick={() => { if (!form.title.trim()) return; setStep(2) }}
                className={`text-xs px-3 py-0.5 rounded-full font-medium transition ${step === 2 ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              >
                {`2. Câu hỏi${form.question_ids.length > 0 ? ` (${form.question_ids.length})` : ''}`}
              </button>
              {form.has_practice && (
                <button
                  onClick={() => { if (!form.title.trim()) return; setStep(3) }}
                  className={`text-xs px-3 py-0.5 rounded-full font-medium transition ${step === 3 ? 'bg-orange-500 text-white' : 'bg-orange-50 text-orange-600 hover:bg-orange-100'}`}
                >
                  3. Bài thực hành
                </button>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto min-h-0 p-6">
          {step === 1 ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề <span className="text-red-500">*</span></label>
                <input
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ví dụ: Bài 1 - Giới thiệu về máy tính"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Khoá học</label>
                  <select
                    value={form.grade}
                    onChange={e => setForm({ ...form, grade: e.target.value, topic: '', unit_id: '' })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Chủ đề</label>
                  <select
                    value={form.topic}
                    onChange={e => setForm({ ...form, topic: e.target.value, unit_id: '' })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- Không chọn --</option>
                    {filteredTopics.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bài <span className="text-xs font-normal text-gray-400">(tuỳ chọn — gắn vào danh mục bài của chủ đề)</span>
                  </label>
                  <select
                    value={form.unit_id}
                    onChange={e => setForm({ ...form, unit_id: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={!form.topic || lessonUnits.length === 0}
                  >
                    <option value="">-- Không gắn vào bài nào --</option>
                    {lessonUnits.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                  {form.topic && lessonUnits.length === 0 && (
                    <p className="text-xs text-gray-400 mt-1">
                      Chủ đề này chưa có danh sách bài — tạo tại trang Chủ đề
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả <span className="text-gray-400 font-normal">(tuỳ chọn)</span></label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  placeholder="Mô tả ngắn về nội dung bài học..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL Video <span className="text-gray-400 font-normal">(tuỳ chọn)</span></label>
                <input
                  value={form.video_url}
                  onChange={e => setForm({ ...form, video_url: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">File bài giảng PPTX <span className="text-gray-400 font-normal">(tuỳ chọn)</span></label>
                {form.pptx_url ? (
                  <div className="flex items-center gap-3 border border-orange-200 rounded-lg px-3 py-2.5 bg-orange-50">
                    <FileText size={18} className="text-orange-500 shrink-0" />
                    <span className="flex-1 text-sm text-gray-700 truncate">
                      {decodeURIComponent(form.pptx_url.split('/').pop().split('?')[0])}
                    </span>
                    <button type="button" onClick={() => setForm(f => ({ ...f, pptx_url: '' }))}
                      className="text-gray-400 hover:text-red-500 transition shrink-0">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <label className={`flex items-center gap-2 border-2 border-dashed rounded-lg px-3 py-2.5 transition
                    ${pptxUploading ? 'border-orange-200 bg-orange-50 cursor-wait' : 'border-gray-300 hover:border-orange-400 hover:bg-orange-50 cursor-pointer'}`}>
                    {pptxUploading
                      ? <><Loader2 size={15} className="text-orange-400 animate-spin shrink-0" /><span className="text-sm text-orange-500">Đang tải lên...</span></>
                      : <><Upload size={15} className="text-gray-400 shrink-0" /><span className="text-sm text-gray-500">Bấm để tải lên .pptx · .ppt</span></>
                    }
                    <input type="file" className="hidden" accept=".pptx,.ppt"
                      onChange={handlePptxUpload} disabled={pptxUploading} />
                  </label>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thứ tự</label>
                  <input
                    type="number"
                    min={0}
                    value={form.order}
                    onChange={e => setForm({ ...form, order: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, has_practice: !form.has_practice })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition shrink-0 ${form.has_practice ? 'bg-indigo-600' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${form.has_practice ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                <span className="text-sm text-gray-700">Có bài nộp thực hành</span>
                {form.has_practice && (
                  <button
                    type="button"
                    onClick={() => { if (!form.title.trim()) { toast.error('Nhập tiêu đề bài học'); return } setStep(3) }}
                    className="ml-1 text-xs text-orange-600 hover:text-orange-700 underline"
                  >
                    → Cài đặt thực hành
                  </button>
                )}
              </div>
            </div>
          ) : step === 2 ? (
            <div>
              {/* Filters + random */}
              <div className="flex gap-2 mb-4 flex-wrap items-center">
                <select
                  value={filterTopic}
                  onChange={e => { setFilterTopic(e.target.value); setFilterUnit('') }}
                  className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Tất cả chủ đề</option>
                  {filteredTopics.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                </select>
                {filterUnits.length > 0 && (
                  <select
                    value={filterUnit}
                    onChange={e => setFilterUnit(e.target.value)}
                    className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Tất cả bài</option>
                    {filterUnits.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                )}
                <select
                  value={filterDiff}
                  onChange={e => setFilterDiff(e.target.value)}
                  className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Tất cả mức độ</option>
                  <option value="easy">Dễ</option>
                  <option value="medium">Trung bình</option>
                  <option value="hard">Khó</option>
                </select>
                <div className="flex items-center gap-1 ml-auto">
                  <input
                    type="number" min={1} max={50} value={randomCount}
                    onChange={e => setRandomCount(Number(e.target.value))}
                    className="w-14 border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={pickRandom}
                    className="flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg text-sm font-medium transition"
                  >
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
                      <button
                        key={q.id}
                        onClick={() => toggleQuestion(q.id)}
                        className={`w-full flex items-start gap-3 p-3 rounded-xl border-2 text-left transition ${checked ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-indigo-200 bg-white'}`}
                      >
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
          ) : (
            /* ── Step 3: Practice settings ── */
            <div className="space-y-3">
              <p className="text-xs text-gray-500">
                Mỗi bài yêu cầu học sinh nộp 1 file (.pptx · .docx · .sb3).
              </p>
              {form.practice_tasks.map((task, i) => (
                <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">Bài {i + 1}</span>
                    {form.practice_tasks.length > 1 && (
                      <button type="button" onClick={() => removeTask(i)}
                        className="text-red-400 hover:text-red-600 transition">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  <textarea
                    value={task.instructions}
                    onChange={e => updateTask(i, e.target.value)}
                    rows={3}
                    autoFocus={i === form.practice_tasks.length - 1}
                    placeholder={`Đề bài / hướng dẫn bài ${i + 1}...`}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>
              ))}
              <button type="button" onClick={addTask}
                className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium transition">
                <Plus size={14} /> Thêm bài tập
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t shrink-0">
          {step > 1
            ? <button onClick={() => setStep(step - 1)} className="text-sm text-gray-500 hover:text-gray-700">← Quay lại</button>
            : <span />
          }
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Hủy</button>
            {step === 1 ? (
              <button
                onClick={() => { if (!form.title.trim()) { toast.error('Nhập tiêu đề bài học'); return } setStep(2) }}
                className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
              >
                Tiếp theo →
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 transition"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                {isEdit ? 'Lưu thay đổi' : 'Tạo bài học'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── LessonPreviewModal ────────────────────────────────────── */
function LessonPreviewModal({ lesson, onClose }) {
  const [questions, setQuestions] = useState([])
  const [loadingQ, setLoadingQ] = useState(false)
  const [quizKey, setQuizKey] = useState(0)

  useEffect(() => {
    if (!lesson.question_ids?.length) return
    setLoadingQ(true)
    supabase
      .from('questions')
      .select('*')
      .in('id', lesson.question_ids)
      .then(({ data }) => {
        const map = {}
        ;(data || []).forEach(q => { map[q.id] = q })
        setQuestions(lesson.question_ids.map(id => map[id]).filter(Boolean))
        setLoadingQ(false)
      })
  }, [lesson.id])

  const hasContent = lesson.video_url || lesson.pptx_url || lesson.description
  const tasks = (() => {
    if (!lesson.practice_instructions) return []
    try { const a = JSON.parse(lesson.practice_instructions); return Array.isArray(a) ? a : [{ instructions: lesson.practice_instructions }] }
    catch { return [{ instructions: lesson.practice_instructions }] }
  })()

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex flex-col">
      <div className="bg-white flex items-center justify-between px-6 py-3 border-b shrink-0">
        <div>
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <Eye size={16} className="text-indigo-500" />
            Xem trước: {lesson.title}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">Chế độ xem trước · không lưu kết quả</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

          {/* Lesson content */}
          {hasContent && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
              {lesson.description && (
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{lesson.description}</p>
              )}
              {lesson.video_url && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                    <PlayCircle size={12} /> Video bài học
                  </p>
                  {/youtube\.com|youtu\.be/i.test(lesson.video_url) ? (
                    <div className="aspect-video rounded-xl overflow-hidden bg-black">
                      <iframe
                        src={lesson.video_url
                          .replace('watch?v=', 'embed/')
                          .replace('youtu.be/', 'youtube.com/embed/')
                          .replace('youtube.com/embed/youtube.com/embed/', 'youtube.com/embed/')}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <a href={lesson.video_url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline">
                      <PlayCircle size={14} /> Mở video
                    </a>
                  )}
                </div>
              )}
              {lesson.pptx_url && (
                <a href={lesson.pptx_url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-orange-600 hover:underline">
                  <FileText size={14} /> Tải bài trình chiếu (PPTX)
                </a>
              )}
            </div>
          )}

          {/* Practice tasks */}
          {lesson.has_practice && tasks.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
              <p className="text-xs font-semibold text-amber-700 mb-3 flex items-center gap-1.5">
                <ClipboardList size={13} /> Thực hành
              </p>
              {tasks.map((t, i) => t.instructions && (
                <div key={i} className="text-sm text-amber-900 whitespace-pre-line">
                  {tasks.length > 1 && <span className="font-medium">Bài {i + 1}: </span>}
                  {t.instructions}
                </div>
              ))}
            </div>
          )}

          {/* Quiz */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-3 flex items-center gap-1.5">
              <BookOpen size={12} /> {questions.length} câu hỏi kiểm tra
            </p>
            {loadingQ ? (
              <div className="flex justify-center py-10">
                <Loader2 size={28} className="animate-spin text-indigo-400" />
              </div>
            ) : questions.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm bg-white rounded-2xl border border-gray-200">
                Bài học này chưa có câu hỏi
              </div>
            ) : (
              <QuizSession
                key={quizKey}
                questions={questions}
                mode="practice"
                preview={true}
                showAnswer={true}
                showScore={true}
                examMode={false}
                onFinish={() => setQuizKey(k => k + 1)}
              />
            )}
          </div>

        </div>
      </div>
    </div>
  )
}

/* ── LessonsPage ───────────────────────────────────────────── */
export default function LessonsPage() {
  const { canDelete } = useAuth()
  const navigate = useNavigate()
  const { grades: GRADES } = useGrades()
  const { topics } = useTopics()

  const [selectedGrade, setSelectedGrade] = useState('')
  const [selectedTopic, setSelectedTopic] = useState('')
  const [selectedUnit, setSelectedUnit] = useState(null)
  const [expandedTopics, setExpandedTopics] = useState({})
  const [allLessons, setAllLessons] = useState([])
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [editLesson, setEditLesson] = useState(null)
  const [previewLesson, setPreviewLesson] = useState(null)

  const { units: gradeUnits } = useUnitsByGrade(selectedGrade)

  useEffect(() => {
    if (GRADES.length > 0 && topics.length > 0 && !selectedGrade) {
      const g = GRADES[0]
      const t = topics.find(t => t.grade === g || t.grade === 'all')
      setSelectedGrade(g)
      if (t) {
        setSelectedTopic(t.name)
        setExpandedTopics({ [t.name]: true })
      }
    }
  }, [GRADES, topics])

  useEffect(() => { if (selectedGrade) fetchLessons() }, [selectedGrade])

  async function fetchLessons() {
    setLoading(true)
    const { data } = await supabase
      .from('lessons')
      .select('*')
      .eq('grade', selectedGrade)
      .order('order', { ascending: true })
      .order('created_at', { ascending: false })
    setAllLessons(data || [])
    setLoading(false)
  }

  function handleGradeChange(grade) {
    setSelectedGrade(grade)
    const first = topics.find(t => t.grade === grade || t.grade === 'all')
    setSelectedTopic(first?.name || '')
    setSelectedUnit(null)
    setExpandedTopics(first ? { [first.name]: true } : {})
  }

  function handleTopicClick(topicName) {
    if (selectedTopic === topicName) {
      setExpandedTopics(prev => ({ ...prev, [topicName]: !prev[topicName] }))
    } else {
      setSelectedTopic(topicName)
      setSelectedUnit(null)
      setExpandedTopics(prev => ({ ...prev, [topicName]: true }))
    }
  }

  function handleUnitClick(unit) {
    setSelectedUnit(prev => prev?.id === unit.id ? null : unit)
  }

  const gradeTopics = useMemo(
    () => topics.filter(t => t.grade === selectedGrade || t.grade === 'all'),
    [topics, selectedGrade]
  )

  const unitsByTopic = useMemo(() => {
    const map = {}
    gradeUnits.forEach(u => {
      if (!map[u.topic]) map[u.topic] = []
      map[u.topic].push(u)
    })
    return map
  }, [gradeUnits])

  const countByTopic = useMemo(() => {
    const map = {}
    allLessons.forEach(l => { map[l.topic] = (map[l.topic] || 0) + 1 })
    return map
  }, [allLessons])

  const countByUnit = useMemo(() => {
    const map = {}
    allLessons.forEach(l => {
      if (l.unit_id) map[l.unit_id] = (map[l.unit_id] || 0) + 1
    })
    return map
  }, [allLessons])

  const displayedLessons = useMemo(() => {
    let ls = allLessons
    if (selectedTopic) ls = ls.filter(l => l.topic === selectedTopic)
    if (selectedUnit) ls = ls.filter(l => l.unit_id === selectedUnit.id)
    return ls
  }, [allLessons, selectedTopic, selectedUnit])

  async function handleDelete(id, title) {
    if (!confirm(`Xóa bài học "${title}"?`)) return
    const { error } = await supabase.from('lessons').delete().eq('id', id)
    if (error) toast.error('Xóa thất bại')
    else { toast.success('Đã xóa bài học'); fetchLessons() }
  }

  async function handleTogglePublish(lesson) {
    const { error } = await supabase.from('lessons').update({ is_published: !lesson.is_published }).eq('id', lesson.id)
    if (error) toast.error('Cập nhật thất bại')
    else fetchLessons()
  }

  const panelTitle = selectedUnit
    ? selectedUnit.name
    : selectedTopic || 'Tất cả bài học'

  return (
    <div className="flex h-full min-h-0">

      {/* ── Sidebar ─────────────────────────────── */}
      <aside className="w-64 shrink-0 bg-white border-r border-gray-200 flex flex-col min-h-0">
        <div className="px-4 pt-5 pb-4 border-b border-gray-100">
          <h1 className="text-lg font-bold text-gray-800 mb-3">Bài học</h1>
          <select value={selectedGrade} onChange={e => handleGradeChange(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
            {GRADES.length === 0 && <option value="">-- Chọn khoá --</option>}
            {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        <nav className="flex-1 overflow-y-auto py-2 px-2">
          {gradeTopics.length === 0 ? (
            <p className="text-xs text-gray-400 text-center px-4 pt-6">Chưa có chủ đề nào</p>
          ) : (
            gradeTopics.map(t => {
              const topicCount = countByTopic[t.name] || 0
              const topicActive = selectedTopic === t.name && !selectedUnit
              const isExpanded = !!expandedTopics[t.name]
              const topicUnits = unitsByTopic[t.name] || []

              return (
                <div key={t.id} className="mb-0.5">
                  <button
                    onClick={() => handleTopicClick(t.name)}
                    className={`w-full flex items-center gap-1.5 px-2 py-2.5 rounded-lg text-left text-sm transition
                      ${topicActive
                        ? 'bg-indigo-600 text-white font-medium'
                        : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    {topicUnits.length > 0 ? (
                      isExpanded
                        ? <ChevronDown size={13} className="shrink-0 opacity-60" />
                        : <ChevronRight size={13} className="shrink-0 opacity-60" />
                    ) : <span className="w-[13px] shrink-0" />}
                    <span className="flex-1 leading-tight line-clamp-2 text-xs">{t.name}</span>
                    <span className={`shrink-0 text-xs px-1.5 py-0.5 rounded-full font-semibold
                      ${topicActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                      {loading ? '·' : topicCount}
                    </span>
                  </button>

                  {isExpanded && topicUnits.length > 0 && (
                    <div className="ml-4 mt-0.5 space-y-0.5 border-l-2 border-gray-100 pl-2">
                      {topicUnits.map(u => {
                        const uCount = countByUnit[u.id] || 0
                        const uActive = selectedUnit?.id === u.id
                        return (
                          <button
                            key={u.id}
                            onClick={() => { setSelectedTopic(t.name); handleUnitClick(u) }}
                            className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left text-xs transition
                              ${uActive
                                ? 'bg-indigo-100 text-indigo-800 font-medium'
                                : 'text-gray-600 hover:bg-gray-100'}`}
                          >
                            <BookOpen size={11} className="shrink-0 opacity-50" />
                            <span className="flex-1 leading-tight line-clamp-2">{u.name}</span>
                            <span className={`shrink-0 text-xs px-1 py-0.5 rounded-full
                              ${uActive ? 'bg-indigo-200 text-indigo-700' : 'bg-gray-100 text-gray-400'}`}>
                              {uCount}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </nav>
      </aside>

      {/* ── Main panel ──────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-0 bg-gray-50">
        <div className="flex items-center justify-between gap-4 px-6 py-4 bg-white border-b border-gray-200 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {selectedUnit && (
                <span className="text-xs text-gray-400">{selectedTopic} /</span>
              )}
              <h2 className="font-semibold text-gray-800 truncate">{panelTitle}</h2>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              {loading ? '...' : `${displayedLessons.length} bài học`}
            </p>
          </div>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition shrink-0">
            <Plus size={15} /> Tạo bài học
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
          ) : displayedLessons.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
              <BookOpen size={40} className="mb-3 opacity-20" />
              <p className="text-sm">Chưa có bài học nào</p>
              <button onClick={() => setShowCreate(true)}
                className="mt-3 text-sm text-indigo-500 hover:text-indigo-700 font-medium">
                + Tạo bài học đầu tiên
              </button>
            </div>
          ) : (
            <div className="space-y-3 max-w-4xl">
              {displayedLessons.map((lesson, i) => (
                <div key={lesson.id} className="bg-white border border-gray-200 rounded-xl px-4 py-3.5 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-gray-400 font-mono shrink-0">{i + 1}.</span>
                      <span className="font-medium text-gray-800 text-sm">{lesson.title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${lesson.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {lesson.is_published ? 'Đã xuất bản' : 'Nháp'}
                      </span>
                    </div>
                    <div className="flex gap-3 mt-1 text-xs text-gray-400 flex-wrap items-center">
                      <span>{lesson.question_ids?.length || 0} câu hỏi</span>
                      {lesson.video_url && (
                        <span className="flex items-center gap-0.5 text-blue-500"><PlayCircle size={11} /> Video</span>
                      )}
                      {lesson.pptx_url && (
                        <span className="flex items-center gap-0.5 text-orange-500"><FileText size={11} /> PPTX</span>
                      )}
                      {lesson.has_practice && (
                        <span className="flex items-center gap-0.5 text-orange-500"><ClipboardList size={11} /> Thực hành</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleTogglePublish(lesson)}
                      title={lesson.is_published ? 'Ẩn bài học' : 'Xuất bản'}
                      className={`p-1.5 rounded-lg transition ${lesson.is_published ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
                    >
                      {lesson.is_published ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                    </button>
                    <button
                      onClick={() => setPreviewLesson(lesson)}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 transition"
                      title="Xem trước bài học"
                    >
                      <Eye size={15} />
                    </button>
                    <button
                      onClick={() => navigate(`/teacher/lessons/${lesson.id}/submissions`)}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 transition"
                      title="Thống kê tiến độ"
                    >
                      <FileText size={15} />
                    </button>
                    <button
                      onClick={() => setEditLesson(lesson)}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 transition"
                      title="Sửa bài học"
                    >
                      <Pencil size={14} />
                    </button>
                    {canDelete && (
                      <button
                        onClick={() => handleDelete(lesson.id, lesson.title)}
                        className="p-1.5 text-red-400 hover:text-red-600 transition"
                        title="Xóa bài học"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {(showCreate || editLesson) && (
        <LessonFormModal
          lesson={editLesson}
          defaultGrade={selectedGrade}
          defaultTopic={selectedTopic}
          defaultUnitId={selectedUnit?.id || null}
          onClose={() => { setShowCreate(false); setEditLesson(null) }}
          onDone={() => { setShowCreate(false); setEditLesson(null); fetchLessons() }}
        />
      )}
      {previewLesson && (
        <LessonPreviewModal lesson={previewLesson} onClose={() => setPreviewLesson(null)} />
      )}
    </div>
  )
}
