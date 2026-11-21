// Ô "Tạo bài học bằng AI" ở bước 1 của form bài học: AI soạn mô tả, lý thuyết, bài thực hành + tiêu chí chấm.
// AI chỉ điền sẵn vào form — chưa lưu gì; giáo viên xem lại rồi mới lưu. Máy chủ (api/generate-lesson) chỉ cho giáo viên gọi.
import { useState } from 'react'
import toast from 'react-hot-toast'
import { Loader2 } from 'lucide-react'
import { apiFetch } from '../../../lib/apiFetch'
import { tieuChiThanhChu } from '../../../domain/baiThucHanh'

export default function TaoBaiBangAi({ form, setForm, onXong, onDong }) {
  const [aiBrief, setAiBrief] = useState('')
  const [aiGenerating, setAiGenerating] = useState(false)

  async function handleGenerateWithAi() {
    if (!form.title.trim()) { toast.error('Nhập tiêu đề bài học trước đã'); return }
    setAiGenerating(true)
    try {
      const res = await apiFetch('/api/generate-lesson', { title: form.title, grade: form.grade, topic: form.topic, brief: aiBrief })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error === 'quota_rpd' || data.error === 'quota_rpm'
          ? 'AI đang quá tải, thầy/cô thử lại sau ít phút nhé'
          : res.status === 504
            ? 'AI soạn quá lâu nên bị ngắt. Thầy/cô thử lại, hoặc yêu cầu ít bài thực hành hơn (ví dụ 3–4 bài) rồi bấm tạo thêm lần nữa'
            : data.error === 'parse_error'
              ? 'AI trả về nội dung bị lỗi định dạng, thầy/cô bấm tạo lại nhé'
              : 'Không tạo được nội dung, thử lại sau')
        return
      }
      setForm(f => ({
        ...f,
        description: data.description || f.description,
        ai_context: data.theory || f.ai_context,
        has_practice: data.practice_tasks?.length > 0 ? true : f.has_practice,
        practice_tasks: data.practice_tasks?.length > 0
          ? data.practice_tasks.map(t => ({ instructions: t.instructions || '', rubric: tieuChiThanhChu(t.rubric), instruction_file_url: '' }))
          : f.practice_tasks,
      }))
      toast.success('AI đã soạn xong — thầy/cô kiểm tra & chỉnh sửa trước khi lưu nhé')
      setAiBrief('')
      onXong()
    } catch {
      toast.error('Có lỗi xảy ra, thử lại sau')
    } finally {
      setAiGenerating(false)
    }
  }

  return (
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
        <button type="button" onClick={() => { setAiBrief(''); onDong() }}
          className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 rounded-lg">Hủy</button>
        <button type="button" onClick={handleGenerateWithAi} disabled={aiGenerating}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white rounded-lg disabled:opacity-50 transition">
          {aiGenerating && <Loader2 size={12} className="animate-spin" />}
          {aiGenerating ? 'Đang soạn...' : 'Tạo nội dung'}
        </button>
      </div>
    </div>
  )
}
