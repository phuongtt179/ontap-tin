// Bước 1 của form bài học: tiêu đề (có AI soạn hộ), khoá / chủ đề / đơn vị, mô tả, người xem, lý thuyết, video,
// tệp bài giảng, thứ tự, bật bài thực hành. Chỉ sửa `form` của form cha qua setForm.
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { FileText, X, Loader2, Upload, Sparkles } from 'lucide-react'
import MarkdownContent from '../../ui/MarkdownContent'
import { uploadFile } from '../../../lib/cloudinary'
import { useUnits } from '../../../hooks/useUnits'
import { useLessonTitles } from '../../../hooks/useLessonTitles'
import { layTenHocSinhCuaKhoa } from '../../../data/ghiDanh'
import TaoBaiBangAi from './TaoBaiBangAi'
import ChonHocSinhXem from './ChonHocSinhXem'

export default function BuocThongTin({ form, setForm, GRADES, filteredTopics, onCaiThucHanh, onAiSoanXong }) {
  const [roster, setRoster] = useState([])
  const [showTheoryPreview, setShowTheoryPreview] = useState(false)
  const [showAiGenerate, setShowAiGenerate] = useState(false)
  const [pptxUploading, setPptxUploading] = useState(false)
  const { units: lessonUnits } = useUnits(form.grade, form.topic)
  const { lessonTitles } = useLessonTitles(form.unit_id)

  // Danh sách học sinh thuộc khoá này (để chọn giới hạn người xem)
  useEffect(() => {
    if (!form.grade) { setRoster([]); return }
    layTenHocSinhCuaKhoa(form.grade).then(({ data }) => setRoster(data))
  }, [form.grade])

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

  return (
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
        <TaoBaiBangAi form={form} setForm={setForm} onDong={() => setShowAiGenerate(false)}
          onXong={() => { setShowAiGenerate(false); onAiSoanXong() }} />
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
            <ChonHocSinhXem roster={roster} chon={form.visible_to} onDoi={id => setForm(f => ({
              ...f,
              visible_to: f.visible_to.includes(id) ? f.visible_to.filter(x => x !== id) : [...f.visible_to, id],
            }))} />
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
            onClick={onCaiThucHanh}
            className="ml-1 text-xs text-orange-600 hover:text-orange-700 underline"
          >
            → Cài đặt thực hành
          </button>
        )}
      </div>
    </div>
  )
}
