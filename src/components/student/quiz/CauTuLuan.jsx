// Câu tự luận — học sinh gõ bài và/hoặc nộp tệp (giáo viên chấm sau).
import { useState } from 'react'
import toast from 'react-hot-toast'
import { Paperclip } from 'lucide-react'
import { uploadImage, uploadFile } from '../../../lib/cloudinary'

export default function EssayQuestion({ q, value, onChange, disabled }) {
  const allowFile = q.options?.[0]?.allow_file
  const [uploading, setUploading] = useState(false)
  const text = value?.text || ''
  const fileUrl = value?.file_url || ''
  const fileName = value?.file_name || ''

  async function handleFileUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 20 * 1024 * 1024) { toast.error('File tối đa 20MB'); return }
    setUploading(true)
    try {
      // ảnh lên kho ảnh, tệp khác lên kho tệp thô (mở thẳng được) — lib/cloudinary.js
      const url = file.type.startsWith('image/') ? await uploadImage(file) : await uploadFile(file)
      onChange({ text, file_url: url, file_name: file.name })
    } catch { toast.error('Upload thất bại') }
    finally { setUploading(false) }
  }

  return (
    <div className="space-y-3">
      <textarea
        value={text}
        onChange={e => onChange({ file_url: fileUrl, file_name: fileName, text: e.target.value })}
        disabled={disabled}
        rows={7}
        placeholder="Nhập bài làm của bạn tại đây..."
        className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-indigo-500 resize-none disabled:bg-gray-50"
      />
      {allowFile && (
        fileUrl ? (
          <div className="flex items-center gap-2 text-sm text-indigo-700 bg-indigo-50 px-3 py-2 rounded-lg border border-indigo-200">
            <Paperclip size={14} className="shrink-0" />
            <span className="flex-1 truncate">{fileName || 'File đã nộp'}</span>
            {!disabled && (
              <button onClick={() => onChange({ text, file_url: '', file_name: '' })}
                className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
            )}
          </div>
        ) : (
          <label className={`flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl border-2 border-dashed cursor-pointer transition w-full
            ${uploading || disabled ? 'opacity-50 cursor-not-allowed border-gray-200 text-gray-400'
            : 'border-gray-300 hover:border-indigo-400 text-gray-500 hover:text-indigo-600'}`}>
            <Paperclip size={14} />
            {uploading ? 'Đang tải lên...' : 'Đính kèm file (PDF, Word, ảnh...)'}
            <input type="file" className="hidden" disabled={uploading || disabled}
              accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
              onChange={handleFileUpload} />
          </label>
        )
      )}
      <p className="text-xs text-gray-400">Câu tự luận — giáo viên sẽ chấm điểm sau khi nộp bài.</p>
    </div>
  )
}
