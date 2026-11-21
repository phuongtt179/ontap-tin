// Form tạo / sửa bài học (3 bước: Thông tin · Câu hỏi · Bài thực hành). Giữ `form` + lưu; nội dung từng bước ở Buoc*.jsx.
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { X, Loader2 } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { useGrades } from '../../../hooks/useGrades'
import { useTopics } from '../../../hooks/useTopics'
import { deleteFile } from '../../../lib/cloudinary'
import { parseTasks, baiCoNoiDung, tepKhongConDung } from '../../../domain/baiThucHanh'
import { taoBaiHoc, luuBaiHoc, layNguoiXemBai, ghiNguoiXemBai } from '../../../data/baiHoc'
import BuocThongTin from './BuocThongTin'
import BuocChonCauHoi from './BuocChonCauHoi'
import BuocThucHanh from './BuocThucHanh'

export default function LessonFormModal({ lesson, defaultGrade, defaultTopic, defaultUnitId, onClose, onDone }) {
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
  const [currentTaskIdx, setCurrentTaskIdx] = useState(0)
  const [saving, setSaving] = useState(false)

  // Danh sách học sinh đã được chọn từ trước (khi sửa bài đã bật giới hạn)
  useEffect(() => {
    if (!isEdit || !lesson?.restricted_audience) return
    layNguoiXemBai(lesson.id).then(({ data }) => setForm(f => ({ ...f, visible_to: data })))
  }, [isEdit, lesson?.id])

  const filteredTopics = ALL_TOPICS.filter(
    t => !form.grade || t.grade === form.grade || t.grade === 'all'
  )

  function denBuoc(n) {
    if (!form.title.trim()) { toast.error('Nhập tiêu đề bài học'); return }
    setStep(n)
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
        ? JSON.stringify(form.practice_tasks.filter(baiCoNoiDung))
        : null,
      is_published: form.is_published,
      question_ids: form.question_ids,
      restricted_audience: form.restricted_audience,
    }
    const { data: savedLesson, error } = isEdit
      ? await luuBaiHoc(lesson.id, payload)
      : await taoBaiHoc({ ...payload, created_by: user.id })
    if (error) { setSaving(false); toast.error('Lưu thất bại: ' + error.message); return }

    // Đồng bộ danh sách học sinh được xem (nếu bật giới hạn) — xoá hết rồi ghi lại cho đơn giản
    const { error: loiNguoiXem } = await ghiNguoiXemBai(savedLesson.id, form.restricted_audience ? form.visible_to : [])
    if (loiNguoiXem) toast.error('Đã lưu bài nhưng chưa lưu được danh sách người xem: ' + loiNguoiXem.message)
    setSaving(false)

    // Xóa file bài giảng cũ trên Cloudinary không còn dùng (thay pptx / gỡ file task)
    if (isEdit) tepKhongConDung(lesson, form.pptx_url, form.practice_tasks).forEach(u => deleteFile(u))

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
                onClick={() => { if (form.title.trim()) setStep(2) }}
                className={`text-xs px-3 py-0.5 rounded-full font-medium transition ${step === 2 ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              >
                {`2. Câu hỏi${form.question_ids.length > 0 ? ` (${form.question_ids.length})` : ''}`}
              </button>
              {form.has_practice && (
                <button
                  onClick={() => { if (form.title.trim()) setStep(3) }}
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
            <BuocThongTin form={form} setForm={setForm} GRADES={GRADES} filteredTopics={filteredTopics}
              onCaiThucHanh={() => denBuoc(3)} onAiSoanXong={() => setCurrentTaskIdx(0)} />
          ) : step === 2 ? (
            <BuocChonCauHoi form={form} setForm={setForm} userId={user?.id} filteredTopics={filteredTopics} />
          ) : (
            <BuocThucHanh form={form} setForm={setForm} currentTaskIdx={currentTaskIdx} setCurrentTaskIdx={setCurrentTaskIdx} />
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
                onClick={() => denBuoc(2)}
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
