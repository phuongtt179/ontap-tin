import { useState, useEffect, useMemo, useRef } from 'react'
import MarkdownContent from '../../components/ui/MarkdownContent'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useGrades } from '../../hooks/useGrades'
import { useTopics } from '../../hooks/useTopics'
import { useUnits, useUnitsByGrade } from '../../hooks/useUnits'
import { useLessonTitles } from '../../hooks/useLessonTitles'
import toast from 'react-hot-toast'
import {
  Plus, Pencil, Trash2, FileText, X, Loader2, Check, Upload,
  ToggleLeft, ToggleRight, RefreshCw, PlayCircle, BookOpen, ClipboardList,
  ChevronDown, ChevronRight, Eye, Filter, Sparkles, Users,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { uploadFile, deleteFile } from '../../lib/cloudinary'
import QuizSession from '../../components/student/QuizSession'
import JSZip from 'jszip'
import { generateSb3Text } from '../../utils/sb3Text'
import { parsePracticeTasks } from '../../utils/practiceTaskParser'

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
function TaskEditor({ index, task, onChange, onRemove, autoFocus }) {
  const [tab, setTab] = useState('edit')
  const [uploading, setUploading] = useState(false)
  const [sb3Loading, setSb3Loading] = useState(false)
  const fileRef = useRef(null)
  const sb3Ref = useRef(null)

  async function handleFileUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadFile(file)
      onChange({ ...task, instruction_file_url: url })
    } catch {
      toast.error('Upload thất bại')
    }
    setUploading(false)
    e.target.value = ''
  }

  // Thả file .sb3 mẫu → đọc thành sơ đồ khối text → chèn vào rubric (chỉnh sửa được)
  async function handleSb3Sample(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setSb3Loading(true)
    try {
      const zip = await JSZip.loadAsync(await file.arrayBuffer())
      const jsonStr = await zip.file('project.json').async('string')
      const text = generateSb3Text(JSON.parse(jsonStr))
      const block = `\n\n[SƠ ĐỒ KHỐI MẪU — MỘT cách làm ĐÚNG, chấp nhận cách tương đương; không bắt lỗi các khối điều chỉnh tọa độ hợp lý]\n${text}\n`
      onChange({ ...task, rubric: (task.rubric || '').trimEnd() + block })
      toast.success('Đã chèn code mẫu từ .sb3 vào rubric')
    } catch {
      toast.error('Không đọc được file .sb3')
    }
    setSb3Loading(false)
    e.target.value = ''
  }

  const fileUrl = task.instruction_file_url || ''
  const fileExt = fileUrl ? fileUrl.split('.').pop().toLowerCase().split('?')[0] : ''
  const isOffice = ['doc','docx','ppt','pptx'].includes(fileExt)
  const fileName = fileUrl ? decodeURIComponent(fileUrl.split('/').pop().split('?')[0]) : ''

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between bg-gray-50 border-b border-gray-200 px-3 py-2">
        <span className="text-sm font-semibold text-gray-700">Bài {index + 1}</span>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg overflow-hidden border border-gray-200 text-xs">
            <button type="button" onClick={() => setTab('edit')}
              className={`px-3 py-1 font-medium transition ${tab === 'edit' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
              Soạn
            </button>
            <button type="button" onClick={() => setTab('preview')}
              className={`px-3 py-1 font-medium transition ${tab === 'preview' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
              Xem trước
            </button>
          </div>
          {onRemove && (
            <button type="button" onClick={onRemove} className="text-red-400 hover:text-red-600 transition">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {tab === 'edit' ? (
        <div>
          {/* Text instructions */}
          <textarea
            value={task.instructions || ''}
            onChange={e => onChange({ ...task, instructions: e.target.value })}
            onPaste={e => {
              const text = e.clipboardData.getData('text/plain')
              const lines = text.trim().split('\n').filter(l => l.trim())
              if (lines.length >= 2 && lines.some(l => l.includes('\t'))) {
                e.preventDefault()
                const rows = lines.map(l => l.split('\t').map(c => c.trim()))
                const maxCols = Math.max(...rows.map(r => r.length))
                const pad = r => { while (r.length < maxCols) r.push(''); return r }
                const padded = rows.map(pad)
                const header = `| ${padded[0].join(' | ')} |`
                const sep = `| ${Array(maxCols).fill('---').join(' | ')} |`
                const body = padded.slice(1).map(r => `| ${r.join(' | ')} |`).join('\n')
                const md = [header, sep, body].join('\n')
                const cur = task.instructions || ''
                const el = e.target
                const start = el.selectionStart
                const end = el.selectionEnd
                const next = cur.slice(0, start) + md + cur.slice(end)
                onChange({ ...task, instructions: next })
              }
            }}
            rows={10}
            autoFocus={autoFocus}
            placeholder="Nhập hướng dẫn ngắn (tùy chọn, hỗ trợ Markdown)..."
            className="w-full px-3 py-2.5 text-sm focus:outline-none resize-y font-mono min-h-[180px]"
          />
          <div className="bg-gray-50 border-t border-gray-100 px-3 py-1.5 text-[10px] text-gray-400 flex gap-3 flex-wrap">
            <span>**đậm**</span><span>*nghiêng*</span><span># Tiêu đề</span><span>- danh sách</span>
            <span className="text-blue-400">| cột1 | cột2 | ← bảng (hoặc copy từ Word/Excel)</span>
          </div>

          {/* Rubric chấm */}
          <div className="border-t border-gray-100 px-3 py-3 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-xs font-semibold text-gray-600">Tiêu chí chấm (Rubric)</p>
              <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">Chỉ AI đọc · Học sinh không thấy</span>
              <button type="button" onClick={() => sb3Ref.current?.click()} disabled={sb3Loading}
                className="ml-auto flex items-center gap-1 text-[11px] font-semibold text-violet-600 bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded-lg px-2 py-1 transition disabled:opacity-50"
                title="Thả file .sb3 lời giải mẫu → tự chuyển thành sơ đồ khối và chèn vào rubric">
                {sb3Loading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                Chèn code mẫu (.sb3)
              </button>
              <input ref={sb3Ref} type="file" accept=".sb3" className="hidden" onChange={handleSb3Sample} />
            </div>
            <textarea
              value={task.rubric || ''}
              onChange={e => onChange({ ...task, rubric: e.target.value })}
              rows={4}
              placeholder={'Ví dụ:\n1. Có khối "Khi bấm cờ xanh": 2 điểm\n2. Có vòng lặp Forever: 3 điểm\n3. Nhân vật di chuyển đúng: 5 điểm\n\nMẹo: bấm "Chèn code mẫu (.sb3)" để thả file lời giải mẫu → tự thêm sơ đồ khối.'}
              className="w-full px-3 py-2 text-sm border border-amber-200 bg-amber-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 resize-y font-mono min-h-[90px] placeholder-gray-400"
            />
          </div>

          {/* File đề bài */}
          <div className="border-t border-gray-100 px-3 py-3 space-y-2">
            <p className="text-xs font-semibold text-gray-600">File đề bài (Word / PPTX — tùy chọn)</p>
            {fileUrl ? (
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                <FileText size={15} className="text-blue-500 shrink-0" />
                <span className="text-xs text-blue-700 flex-1 truncate">{fileName}</span>
                <a href={fileUrl} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline shrink-0">Xem</a>
                <button type="button" onClick={() => onChange({ ...task, instruction_file_url: '' })}
                  className="text-red-400 hover:text-red-600 shrink-0"><X size={13} /></button>
              </div>
            ) : (
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                className="flex items-center gap-2 w-full border-2 border-dashed border-gray-300 hover:border-indigo-400 rounded-lg px-3 py-2 text-sm text-gray-500 hover:text-indigo-600 transition disabled:opacity-50">
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                {uploading ? 'Đang upload...' : 'Upload file Word / PPTX'}
              </button>
            )}
            <input ref={fileRef} type="file" accept=".doc,.docx,.ppt,.pptx,.pdf" className="hidden" onChange={handleFileUpload} />
          </div>
        </div>
      ) : (
        <div className="px-4 py-3 min-h-[80px] bg-white space-y-3">
          {(task.instructions || '').trim()
            ? <MarkdownContent text={task.instructions} />
            : !fileUrl && <p className="text-gray-400 text-sm italic">Chưa có nội dung...</p>}
          {fileUrl && isOffice && (
            <iframe src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`}
              width="100%" height="400" frameBorder="0" className="rounded-lg border border-gray-200 block" />
          )}
        </div>
      )}
    </div>
  )
}

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
    ai_context: lesson?.ai_context || '',
    video_url: lesson?.video_url || '',
    pptx_url: lesson?.pptx_url || '',
    order: lesson?.order ?? 0,
    unit_id: lesson?.unit_id || defaultUnitId || '',
    lesson_title_id: lesson?.lesson_title_id || '',
    has_practice: lesson?.has_practice ?? false,
    practice_tasks: parseTasks(lesson?.practice_instructions),
    is_published: lesson?.is_published ?? false,
    question_ids: lesson?.question_ids || [],
    restricted_audience: lesson?.restricted_audience ?? false,
    visible_to: [],
  })
  const [roster, setRoster] = useState([])
  const [rosterSearch, setRosterSearch] = useState('')
  const [questions, setQuestions] = useState([])
  const [filterTopic, setFilterTopic] = useState('')
  const [filterUnit, setFilterUnit] = useState('')
  const [filterDiff, setFilterDiff] = useState('')
  const [filterLessonTitle, setFilterLessonTitle] = useState('')
  const [randomCount, setRandomCount] = useState(10)
  const [currentTaskIdx, setCurrentTaskIdx] = useState(0)
  const [showBulkPaste, setShowBulkPaste] = useState(false)
  const [bulkText, setBulkText] = useState('')
  const [showTheoryPreview, setShowTheoryPreview] = useState(false)
  const [showAiGenerate, setShowAiGenerate] = useState(false)
  const [aiBrief, setAiBrief] = useState('')
  const [aiGenerating, setAiGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loadingQ, setLoadingQ] = useState(false)
  const [pptxUploading, setPptxUploading] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

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

  // Danh sách học sinh thuộc khoá này (để chọn giới hạn người xem)
  useEffect(() => {
    if (!form.grade) { setRoster([]); return }
    supabase.from('student_enrollments')
      .select('user_id, profiles!inner(id, full_name)')
      .eq('grade', form.grade).eq('is_approved', true)
      .then(({ data }) => {
        const list = (data || []).map(e => ({ id: e.user_id, full_name: e.profiles.full_name }))
        list.sort((a, b) => a.full_name.localeCompare(b.full_name))
        setRoster(list)
      })
  }, [form.grade])

  // Danh sách học sinh đã được chọn từ trước (khi sửa bài đã bật giới hạn)
  useEffect(() => {
    if (!isEdit || !lesson?.restricted_audience) return
    supabase.from('lesson_visibility').select('user_id').eq('lesson_id', lesson.id)
      .then(({ data }) => setForm(f => ({ ...f, visible_to: (data || []).map(r => r.user_id) })))
  }, [isEdit, lesson?.id])

  const filteredTopics = ALL_TOPICS.filter(
    t => !form.grade || t.grade === form.grade || t.grade === 'all'
  )
  const { units: lessonUnits } = useUnits(form.grade, form.topic)
  const { units: filterUnits } = useUnits(form.grade, filterTopic)
  const { lessonTitles } = useLessonTitles(form.unit_id)
  const { lessonTitles: filterLessonTitles } = useLessonTitles(filterUnit)

  useEffect(() => {
    if (step !== 2) return
    setLoadingQ(true)
    let q = supabase.from('questions').select('id, question, type, difficulty, topic, unit_id').eq('grade', form.grade)
    if (filterTopic) q = q.eq('topic', filterTopic)
    if (filterUnit) q = q.eq('unit_id', filterUnit)
    if (filterLessonTitle) q = q.eq('lesson_title_id', filterLessonTitle)
    if (filterDiff) q = q.eq('difficulty', filterDiff)
    q.order('created_at', { ascending: false }).then(({ data }) => {
      setQuestions(data || [])
      setLoadingQ(false)
    })
  }, [step, form.grade, filterTopic, filterUnit, filterLessonTitle, filterDiff, refreshKey])

  // Auto-clean stale question_ids once the full (unfiltered) question list is loaded
  useEffect(() => {
    if (step !== 2 || loadingQ || filterTopic || filterUnit || filterLessonTitle || filterDiff || questions.length === 0) return
    const validIds = new Set(questions.map(q => q.id))
    setForm(f => {
      const cleaned = f.question_ids.filter(id => validIds.has(id))
      return cleaned.length === f.question_ids.length ? f : { ...f, question_ids: cleaned }
    })
  }, [step, loadingQ, filterTopic, filterUnit, filterLessonTitle, filterDiff, questions])

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
    setForm(f => {
      const next = [...f.practice_tasks, { instructions: '', instruction_file_url: '' }]
      setCurrentTaskIdx(next.length - 1)
      return { ...f, practice_tasks: next }
    })
  }
  // Phòng hờ: nếu AI lỡ trả rubric dạng object thay vì string thì chuyển thành text đọc được.
  function rubricToText(rubric) {
    if (!rubric) return ''
    if (typeof rubric === 'string') return rubric
    if (typeof rubric === 'object') {
      return Object.entries(rubric).map(([k, v]) => `${k}: ${v}đ`).join('\n')
    }
    return String(rubric)
  }

  async function handleGenerateWithAi() {
    if (!form.title.trim()) { toast.error('Nhập tiêu đề bài học trước đã'); return }
    setAiGenerating(true)
    try {
      const res = await fetch('/api/generate-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: form.title, grade: form.grade, topic: form.topic, brief: aiBrief }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error === 'quota_rpd' || data.error === 'quota_rpm'
          ? 'AI đang quá tải, thầy/cô thử lại sau ít phút nhé'
          : 'Không tạo được nội dung, thử lại sau')
        return
      }
      setForm(f => ({
        ...f,
        description: data.description || f.description,
        ai_context: data.theory || f.ai_context,
        has_practice: data.practice_tasks?.length > 0 ? true : f.has_practice,
        practice_tasks: data.practice_tasks?.length > 0
          ? data.practice_tasks.map(t => ({ instructions: t.instructions || '', rubric: rubricToText(t.rubric), instruction_file_url: '' }))
          : f.practice_tasks,
      }))
      setCurrentTaskIdx(0)
      toast.success('AI đã soạn xong — thầy/cô kiểm tra & chỉnh sửa trước khi lưu nhé')
      setShowAiGenerate(false)
      setAiBrief('')
    } catch {
      toast.error('Có lỗi xảy ra, thử lại sau')
    } finally {
      setAiGenerating(false)
    }
  }

  function handleBulkSplit() {
    const parsed = parsePracticeTasks(bulkText)
    if (parsed.length === 0) { toast.error('Không tách được bài nào, kiểm tra lại nội dung dán vào'); return }
    setForm(f => {
      // Giữ lại các bài đã soạn có nội dung; bỏ bài trống mặc định ban đầu
      const kept = f.practice_tasks.filter(t => (t.instructions || '').trim() || (t.rubric || '').trim() || t.instruction_file_url)
      const next = [...kept, ...parsed.map(p => ({ instructions: p.instructions, rubric: p.rubric, instruction_file_url: '' }))]
      setCurrentTaskIdx(kept.length)
      return { ...f, practice_tasks: next }
    })
    toast.success(`Đã tách thành ${parsed.length} bài`)
    setBulkText('')
    setShowBulkPaste(false)
  }
  function removeTask(idx) {
    setForm(f => {
      const next = f.practice_tasks.filter((_, i) => i !== idx)
      setCurrentTaskIdx(prev => Math.min(prev, next.length - 1))
      return { ...f, practice_tasks: next }
    })
  }
  function updateTask(idx, taskObj) {
    setForm(f => ({ ...f, practice_tasks: f.practice_tasks.map((t, i) => i === idx ? taskObj : t) }))
  }

  async function handleSave() {
    if (!form.title.trim()) { toast.error('Nhập tiêu đề bài học'); return }
    setSaving(true)
    const payload = {
      title: form.title.trim(),
      grade: form.grade,
      topic: form.topic || null,
      unit_id: form.unit_id || null,
      lesson_title_id: form.lesson_title_id || null,
      description: form.description.trim() || null,
      ai_context: form.ai_context.trim() || null,
      video_url: form.video_url.trim() || null,
      pptx_url: form.pptx_url || null,
      order: form.order || 0,
      has_practice: form.has_practice,
      practice_type: null,
      practice_instructions: form.has_practice
        ? JSON.stringify(form.practice_tasks.filter(t => (t.instructions || '').trim() || (t.rubric || '').trim() || t.instruction_file_url))
        : null,
      is_published: form.is_published,
      question_ids: form.question_ids,
      restricted_audience: form.restricted_audience,
    }
    const { data: savedLesson, error } = isEdit
      ? await supabase.from('lessons').update(payload).eq('id', lesson.id).select().single()
      : await supabase.from('lessons').insert({ ...payload, created_by: user.id }).select().single()
    if (error) { setSaving(false); toast.error('Lưu thất bại: ' + error.message); return }

    // Đồng bộ danh sách học sinh được xem (nếu bật giới hạn) — xoá hết rồi ghi lại cho đơn giản
    await supabase.from('lesson_visibility').delete().eq('lesson_id', savedLesson.id)
    if (form.restricted_audience && form.visible_to.length > 0) {
      await supabase.from('lesson_visibility').insert(
        form.visible_to.map(uid => ({ lesson_id: savedLesson.id, user_id: uid }))
      )
    }
    setSaving(false)

    // Xóa file bài giảng cũ trên Cloudinary không còn dùng (thay pptx / gỡ file task)
    if (isEdit) {
      const oldUrls = new Set()
      if (lesson.pptx_url) oldUrls.add(lesson.pptx_url)
      try {
        const oldTasks = JSON.parse(lesson.practice_instructions || '[]')
        if (Array.isArray(oldTasks)) oldTasks.forEach(t => { if (t?.instruction_file_url) oldUrls.add(t.instruction_file_url) })
      } catch { /* bỏ qua */ }
      const newUrls = new Set()
      if (form.pptx_url) newUrls.add(form.pptx_url)
      form.practice_tasks.forEach(t => { if (t?.instruction_file_url) newUrls.add(t.instruction_file_url) })
      oldUrls.forEach(u => { if (!newUrls.has(u) && /res\.cloudinary\.com/.test(u)) deleteFile(u) })
    }

    toast.success(isEdit ? 'Đã cập nhật bài học' : 'Đã tạo bài học')
    onDone()
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
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">Tiêu đề <span className="text-red-500">*</span></label>
                  <button type="button" onClick={() => setShowAiGenerate(v => !v)}
                    className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg transition
                      ${showAiGenerate ? 'bg-violet-600 text-white' : 'bg-violet-50 text-violet-600 hover:bg-violet-100'}`}>
                    <Sparkles size={12} /> Tạo bài học bằng AI
                  </button>
                </div>
                <input
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ví dụ: Bài 1 - Giới thiệu về máy tính"
                  autoFocus
                />
              </div>

              {showAiGenerate && (
                <div className="border border-violet-200 rounded-xl overflow-hidden">
                  <div className="bg-violet-50 border-b border-violet-100 px-3 py-2 text-xs text-violet-700">
                    AI sẽ soạn <strong>mô tả, lý thuyết (markdown)</strong> và <strong>bài thực hành + tiêu chí chấm</strong> dựa vào tiêu đề{form.topic ? ', chủ đề' : ''} ở trên. Thầy/cô xem lại & sửa trước khi lưu — AI chỉ điền sẵn, chưa lưu gì cả.
                  </div>
                  <textarea
                    value={aiBrief}
                    onChange={e => setAiBrief(e.target.value)}
                    rows={3}
                    placeholder="Mô tả thêm cho AI (tuỳ chọn) — vd: tập trung vào khối lặp Forever, có ví dụ nhân vật mèo đuổi bắt bóng..."
                    className="w-full px-3 py-2.5 text-sm focus:outline-none resize-none"
                  />
                  <div className="flex justify-end gap-2 bg-gray-50 border-t border-gray-100 px-3 py-2">
                    <button type="button" onClick={() => { setShowAiGenerate(false); setAiBrief('') }}
                      className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 rounded-lg">Hủy</button>
                    <button type="button" onClick={handleGenerateWithAi} disabled={aiGenerating}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white rounded-lg disabled:opacity-50 transition">
                      {aiGenerating && <Loader2 size={12} className="animate-spin" />}
                      {aiGenerating ? 'Đang soạn...' : 'Tạo nội dung'}
                    </button>
                  </div>
                </div>
              )}

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
                    onChange={e => setForm({ ...form, unit_id: e.target.value, lesson_title_id: '' })}
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

              {lessonTitles.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tiêu đề bài học nhỏ <span className="text-xs font-normal text-gray-400">(tuỳ chọn)</span>
                  </label>
                  <select
                    value={form.lesson_title_id}
                    onChange={e => {
                      const id = e.target.value
                      const title = lessonTitles.find(t => t.id === id)
                      setForm(f => ({ ...f, lesson_title_id: id, title: title ? title.name : f.title }))
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- Tất cả / Không chọn --</option>
                    {lessonTitles.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              )}

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

              <div className="border border-gray-200 rounded-xl p-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.restricted_audience}
                    onChange={e => setForm({ ...form, restricted_audience: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                  <span className="text-sm font-medium text-gray-700">Chỉ hiện cho một số học sinh</span>
                </label>
                <p className="text-[11px] text-gray-400 mt-1 ml-6">
                  Mặc định bài học hiện cho TẤT CẢ học sinh đã ghi danh khoá này. Bật lên để chỉ chọn vài bạn xem trước.
                </p>
                {form.restricted_audience && (
                  <div className="mt-3 ml-6">
                    <input
                      value={rosterSearch}
                      onChange={e => setRosterSearch(e.target.value)}
                      placeholder="Tìm tên học sinh..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <div className="max-h-48 overflow-y-auto border border-gray-100 rounded-lg divide-y">
                      {roster.length === 0 && (
                        <p className="text-xs text-gray-400 px-3 py-2">Chưa có học sinh nào ghi danh khoá này</p>
                      )}
                      {roster
                        .filter(s => s.full_name.toLowerCase().includes(rosterSearch.trim().toLowerCase()))
                        .map(s => (
                          <label key={s.id} className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-50 cursor-pointer">
                            <input type="checkbox" checked={form.visible_to.includes(s.id)}
                              onChange={() => setForm(f => ({
                                ...f,
                                visible_to: f.visible_to.includes(s.id)
                                  ? f.visible_to.filter(id => id !== s.id)
                                  : [...f.visible_to, s.id],
                              }))}
                              className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                            {s.full_name}
                          </label>
                        ))}
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">Đã chọn {form.visible_to.length} học sinh</p>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    💡 Lý thuyết (markdown) <span className="text-gray-400 font-normal">(tuỳ chọn)</span>
                  </label>
                  {form.ai_context.trim() && (
                    <button type="button" onClick={() => setShowTheoryPreview(v => !v)}
                      className="text-xs text-violet-600 hover:underline font-medium">
                      {showTheoryPreview ? 'Ẩn xem trước' : 'Xem trước'}
                    </button>
                  )}
                </div>
                {showTheoryPreview && form.ai_context.trim() ? (
                  <div className="border border-violet-200 rounded-lg px-3 py-2 bg-violet-50/40 min-h-[120px]">
                    <MarkdownContent text={form.ai_context} />
                  </div>
                ) : (
                  <textarea
                    value={form.ai_context}
                    onChange={e => setForm({ ...form, ai_context: e.target.value })}
                    rows={5}
                    className="w-full border border-violet-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none bg-violet-50/40 font-mono"
                    placeholder={"Viết lý thuyết dạng markdown (#, ##, **đậm**, danh sách...) — vd:\n## Chuyển cảnh trong Scratch\nDùng khối **Backdrop** để đổi phông nền.\n- Bấm tab Trang phục\n- Chọn Backdrop mới từ thư viện"}
                  />
                )}
                <p className="text-[11px] text-gray-400 mt-1">
                  Hiển thị cho học sinh ở bước "Lý thuyết" trong bài học, đồng thời AI trợ giảng cũng dựa vào đây để trả lời sát bài. Để trống thì không có bước Lý thuyết, AI dùng tiêu đề bài + kiến thức chuẩn.
                </p>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">File bài giảng <span className="text-gray-400 font-normal">PPTX / PDF (tuỳ chọn)</span></label>
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
                      : <><Upload size={15} className="text-gray-400 shrink-0" /><span className="text-sm text-gray-500">Bấm để tải lên .pptx · .ppt · .pdf</span></>
                    }
                    <input type="file" className="hidden" accept=".pptx,.ppt,.pdf"
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
          ) : (
            /* ── Step 3: Practice settings (carousel) ── */
            <div className="space-y-3">
              {/* Navigation bar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {form.practice_tasks.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCurrentTaskIdx(i)}
                      className={`w-7 h-7 rounded-full text-xs font-bold transition
                        ${currentTaskIdx === i
                          ? 'bg-indigo-600 text-white shadow'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={addTask}
                    className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-lg font-bold flex items-center justify-center transition"
                    title="Thêm bài tập"
                  >
                    <Plus size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowBulkPaste(v => !v)}
                    className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition ml-1
                      ${showBulkPaste ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
                    title="Dán 1 đoạn text nhiều bài, tự tách thành từng bài + tiêu chí chấm"
                  >
                    <ClipboardList size={13} /> Dán nhiều bài
                  </button>
                </div>
                {!showBulkPaste && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={currentTaskIdx === 0}
                      onClick={() => setCurrentTaskIdx(i => i - 1)}
                      className="px-2 py-1 text-xs rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 disabled:opacity-30 transition"
                    >
                      ← Trước
                    </button>
                    <span className="text-xs text-gray-400">{currentTaskIdx + 1}/{form.practice_tasks.length}</span>
                    <button
                      type="button"
                      disabled={currentTaskIdx === form.practice_tasks.length - 1}
                      onClick={() => setCurrentTaskIdx(i => i + 1)}
                      className="px-2 py-1 text-xs rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 disabled:opacity-30 transition"
                    >
                      Sau →
                    </button>
                  </div>
                )}
              </div>

              {showBulkPaste ? (
                /* Dán nhiều bài cùng lúc — tự tách theo "BÀI <số>" và tự tách "Tiêu chí chấm" ở cuối mỗi bài */
                <div className="border border-indigo-200 rounded-xl overflow-hidden">
                  <div className="bg-indigo-50 border-b border-indigo-100 px-3 py-2 text-xs text-indigo-700 space-y-0.5">
                    <p>Dán đề nhiều bài vào đây. Mỗi bài bắt đầu bằng dòng <strong>"BÀI 1 – ..."</strong>, <strong>"BÀI 2 – ..."</strong> (nếu chỉ 1 bài thì không cần).</p>
                    <p>Trong mỗi bài, nếu có phần <strong>"Tiêu chí chấm"</strong> ở cuối thì sẽ tự tách riêng vào ô Rubric (chỉ AI đọc) — không bắt buộc phải có.</p>
                  </div>
                  <textarea
                    value={bulkText}
                    onChange={e => setBulkText(e.target.value)}
                    rows={12}
                    autoFocus
                    placeholder={'BÀI 1 – Tên bài...\n(nội dung đề bài)\n\nTiêu chí chấm\n(tiêu chí, có thể bỏ trống)\n\nBÀI 2 – Tên bài...\n...'}
                    className="w-full px-3 py-2.5 text-sm focus:outline-none resize-y font-mono min-h-[220px]"
                  />
                  <div className="flex justify-end gap-2 bg-gray-50 border-t border-gray-100 px-3 py-2">
                    <button type="button" onClick={() => { setShowBulkPaste(false); setBulkText('') }}
                      className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 rounded-lg">Hủy</button>
                    <button type="button" onClick={handleBulkSplit} disabled={!bulkText.trim()}
                      className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-40 transition">
                      Tách bài tập
                    </button>
                  </div>
                </div>
              ) : (
                <TaskEditor
                  key={currentTaskIdx}
                  index={currentTaskIdx}
                  task={form.practice_tasks[currentTaskIdx]}
                  onChange={taskObj => updateTask(currentTaskIdx, taskObj)}
                  onRemove={form.practice_tasks.length > 1 ? () => removeTask(currentTaskIdx) : null}
                  autoFocus
                />
              )}

              <p className="text-xs text-gray-400">Mỗi bài yêu cầu học sinh nộp 1 file (.pptx · .docx · .sb3).</p>
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

/* ── LessonAudienceModal — chọn nhanh ai được xem bài học, không cần mở form sửa đầy đủ ── */
function LessonAudienceModal({ lesson, onClose, onDone }) {
  const [restricted, setRestricted] = useState(lesson.restricted_audience)
  const [roster, setRoster] = useState([])
  const [selected, setSelected] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      supabase.from('student_enrollments')
        .select('user_id, profiles!inner(id, full_name)')
        .eq('grade', lesson.grade).eq('is_approved', true),
      supabase.from('lesson_visibility').select('user_id').eq('lesson_id', lesson.id),
    ]).then(([{ data: enr }, { data: vis }]) => {
      const list = (enr || []).map(e => ({ id: e.user_id, full_name: e.profiles.full_name }))
      list.sort((a, b) => a.full_name.localeCompare(b.full_name))
      setRoster(list)
      setSelected((vis || []).map(v => v.user_id))
      setLoading(false)
    })
  }, [lesson.id, lesson.grade])

  function toggleStudent(id) {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  }

  async function handleSave() {
    setSaving(true)
    const { error } = await supabase.from('lessons').update({ restricted_audience: restricted }).eq('id', lesson.id)
    if (error) { setSaving(false); toast.error('Lưu thất bại: ' + error.message); return }
    await supabase.from('lesson_visibility').delete().eq('lesson_id', lesson.id)
    if (restricted && selected.length > 0) {
      const { error: insErr } = await supabase.from('lesson_visibility')
        .insert(selected.map(uid => ({ lesson_id: lesson.id, user_id: uid })))
      if (insErr) { setSaving(false); toast.error('Lưu thất bại: ' + insErr.message); return }
    }
    setSaving(false)
    toast.success('Đã cập nhật')
    onDone()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
          <h2 className="text-base font-bold text-gray-800 truncate">Ai được xem "{lesson.title}"?</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 shrink-0 ml-2"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="audience" checked={!restricted} onChange={() => setRestricted(false)}
              className="w-4 h-4 text-indigo-600 focus:ring-indigo-500" />
            <span className="text-sm font-medium text-gray-700">Tất cả học sinh khoá này</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="audience" checked={restricted} onChange={() => setRestricted(true)}
              className="w-4 h-4 text-indigo-600 focus:ring-indigo-500" />
            <span className="text-sm font-medium text-gray-700">Chỉ một số học sinh</span>
          </label>

          {restricted && (
            loading ? (
              <div className="flex justify-center py-6"><Loader2 size={20} className="animate-spin text-indigo-400" /></div>
            ) : (
              <div className="ml-6">
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Tìm tên học sinh..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <div className="max-h-56 overflow-y-auto border border-gray-100 rounded-lg divide-y">
                  {roster.length === 0 && (
                    <p className="text-xs text-gray-400 px-3 py-2">Chưa có học sinh nào ghi danh khoá này</p>
                  )}
                  {roster
                    .filter(s => s.full_name.toLowerCase().includes(search.trim().toLowerCase()))
                    .map(s => (
                      <label key={s.id} className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-50 cursor-pointer">
                        <input type="checkbox" checked={selected.includes(s.id)} onChange={() => toggleStudent(s.id)}
                          className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                        {s.full_name}
                      </label>
                    ))}
                </div>
                <p className="text-[11px] text-gray-400 mt-1">Đã chọn {selected.length} học sinh</p>
              </div>
            )
          )}
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Hủy</button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 transition">
            {saving && <Loader2 size={14} className="animate-spin" />}
            Lưu
          </button>
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
                <div key={i}>
                  {tasks.length > 1 && <p className="text-xs font-semibold text-amber-700 mb-1">Bài {i + 1}:</p>}
                  <MarkdownContent text={t.instructions} className="text-amber-900 text-sm" />
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

  const [selectedGrade, setSelectedGrade] = useState(() => sessionStorage.getItem('lessons_grade') || '')
  const [selectedTopic, setSelectedTopic] = useState(() => sessionStorage.getItem('lessons_topic') || '')
  const [selectedUnit, setSelectedUnit] = useState(null)
  const [selectedLessonTitle, setSelectedLessonTitle] = useState(null)
  const [expandedTopics, setExpandedTopics] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('lessons_expanded') || '{}') } catch { return {} }
  })
  const [allLessons, setAllLessons] = useState([])
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [editLesson, setEditLesson] = useState(null)
  const [previewLesson, setPreviewLesson] = useState(null)
  const [audienceLesson, setAudienceLesson] = useState(null)

  const { units: gradeUnits } = useUnitsByGrade(selectedGrade)
  const { lessonTitles: unitLessonTitles } = useLessonTitles(selectedUnit?.id)

  useEffect(() => { if (selectedGrade) sessionStorage.setItem('lessons_grade', selectedGrade) }, [selectedGrade])
  useEffect(() => { if (selectedTopic) sessionStorage.setItem('lessons_topic', selectedTopic) }, [selectedTopic])
  useEffect(() => { sessionStorage.setItem('lessons_expanded', JSON.stringify(expandedTopics)) }, [expandedTopics])

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
      .order('created_at', { ascending: true })
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
      setSelectedLessonTitle(null)
      setExpandedTopics(prev => ({ ...prev, [topicName]: true }))
    }
  }

  function handleUnitClick(unit) {
    setSelectedUnit(prev => prev?.id === unit.id ? null : unit)
    setSelectedLessonTitle(null)
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

  const countByLessonTitle = useMemo(() => {
    const map = {}
    allLessons.forEach(l => {
      if (l.lesson_title_id) map[l.lesson_title_id] = (map[l.lesson_title_id] || 0) + 1
    })
    return map
  }, [allLessons])

  const displayedLessons = useMemo(() => {
    let ls = allLessons
    if (selectedTopic) ls = ls.filter(l => l.topic === selectedTopic)
    if (selectedUnit) ls = ls.filter(l => l.unit_id === selectedUnit.id)
    if (selectedLessonTitle) ls = ls.filter(l => l.lesson_title_id === selectedLessonTitle.id)
    return ls
  }, [allLessons, selectedTopic, selectedUnit, selectedLessonTitle])

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

  const panelTitle = selectedLessonTitle
    ? selectedLessonTitle.name
    : selectedUnit
      ? selectedUnit.name
      : selectedTopic || 'Tất cả bài học'

  return (
    <div className="flex h-full min-h-0 relative overflow-hidden">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ─────────────────────────────── */}
      <aside className={sidebarOpen
        ? 'flex fixed inset-y-0 left-0 z-40 shadow-2xl w-64 shrink-0 bg-white border-r border-gray-200 flex-col min-h-0'
        : 'hidden md:flex md:relative w-64 shrink-0 bg-white border-r border-gray-200 flex-col min-h-0'
      }>
        <div className="px-4 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-gray-800">Bài học</h1>
            <div className="flex items-center gap-1">
              <button onClick={() => navigate('/teacher/sb3-preview')}
                title="Xem AI đọc file Scratch"
                className="text-xs text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 px-2 py-1 rounded-lg transition font-medium">
                🐱 sb3
              </button>
              <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-400 hover:text-gray-600 p-1 -mr-1"><X size={18} /></button>
            </div>
          </div>
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
                          <div key={u.id}>
                            <button
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
                            {uActive && unitLessonTitles.length > 0 && (
                              <div className="ml-4 mt-0.5 space-y-0.5 border-l-2 border-indigo-100 pl-2">
                                {unitLessonTitles.map(lt => {
                                  const ltActive = selectedLessonTitle?.id === lt.id
                                  const ltCount = countByLessonTitle[lt.id] || 0
                                  return (
                                    <button
                                      key={lt.id}
                                      onClick={() => setSelectedLessonTitle(prev => prev?.id === lt.id ? null : lt)}
                                      className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-left text-xs transition
                                        ${ltActive ? 'bg-indigo-600 text-white font-medium' : 'text-gray-500 hover:bg-gray-100'}`}
                                    >
                                      <span className="flex-1 leading-tight line-clamp-2">{lt.name}</span>
                                      <span className={`shrink-0 text-xs px-1 py-0.5 rounded-full
                                        ${ltActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                        {ltCount}
                                      </span>
                                    </button>
                                  )
                                })}
                              </div>
                            )}
                          </div>
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
        <div className="flex items-center justify-between gap-2 md:gap-4 px-4 md:px-6 py-4 bg-white border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden shrink-0 flex items-center gap-1 text-sm text-gray-600 border border-gray-300 rounded-lg px-2.5 py-1.5">
              <Filter size={14} /> Lọc
            </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {selectedLessonTitle ? (
                <>
                  <span className="text-xs text-gray-400">{selectedTopic} /</span>
                  <span className="text-xs text-gray-400">{selectedUnit?.name} /</span>
                </>
              ) : selectedUnit ? (
                <span className="text-xs text-gray-400">{selectedTopic} /</span>
              ) : null}
              <h2 className="font-semibold text-gray-800 truncate">{panelTitle}</h2>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              {loading ? '...' : `${displayedLessons.length} bài học`}
            </p>
          </div>
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
                      {lesson.restricted_audience && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700">
                          Giới hạn người xem
                        </span>
                      )}
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
                      onClick={() => setAudienceLesson(lesson)}
                      title={lesson.restricted_audience ? 'Đang giới hạn — bấm để đổi ai được xem' : 'Xuất bản cho tất cả — bấm để chỉ cho 1 số em xem'}
                      className={`p-1.5 rounded-lg transition ${lesson.restricted_audience ? 'text-amber-600 hover:bg-amber-50' : 'text-gray-400 hover:bg-gray-100'}`}
                    >
                      <Users size={15} />
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
      {audienceLesson && (
        <LessonAudienceModal
          lesson={audienceLesson}
          onClose={() => setAudienceLesson(null)}
          onDone={() => { setAudienceLesson(null); fetchLessons() }}
        />
      )}
    </div>
  )
}
