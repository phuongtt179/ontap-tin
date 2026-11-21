// Nút tải ảnh / âm thanh lên Cloudinary cho câu hỏi (dùng hàm tải chung ở lib/cloudinary).
import { useState } from 'react'
import toast from 'react-hot-toast'
import { Image } from 'lucide-react'
import { uploadImage, uploadAudio } from '../../../lib/cloudinary'

export function ImageUpload({ value, onChange, compact = false }) {
  const [uploading, setUploading] = useState(false)

  async function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Ảnh tối đa 5MB'); return }
    setUploading(true)
    try { onChange(await uploadImage(file)) } catch { toast.error('Tải ảnh lên thất bại') }
    finally { setUploading(false) }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {value && <img src={value} alt="" className="h-14 rounded-lg border object-cover" />}
      <label className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs border cursor-pointer transition ${uploading ? 'opacity-50 cursor-not-allowed' : 'border-gray-300 hover:bg-gray-50 text-gray-600'}`}>
        <Image size={12} />
        {uploading ? 'Đang tải...' : value ? 'Đổi' : compact ? 'Ảnh' : 'Thêm ảnh'}
        <input type="file" accept="image/*" onChange={handleFile} disabled={uploading} className="hidden" />
      </label>
      {value && (
        <button type="button" onClick={() => onChange('')} className="text-xs text-red-400 hover:text-red-600">Xóa</button>
      )}
    </div>
  )
}

// Component upload âm thanh — dùng Cloudinary
export function AudioUpload({ value, onChange }) {
  const [uploading, setUploading] = useState(false)

  async function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { toast.error('File âm thanh tối đa 10MB'); return }
    setUploading(true)
    try { onChange(await uploadAudio(file)) } catch { toast.error('Tải âm thanh lên thất bại') }
    finally { setUploading(false) }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {value && <audio controls src={value} className="h-8 max-w-48 rounded" />}
      <label className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs border cursor-pointer transition ${uploading ? 'opacity-50 cursor-not-allowed' : 'border-gray-300 hover:bg-gray-50 text-gray-600'}`}>
        🔊 {uploading ? 'Đang tải...' : value ? 'Đổi audio' : 'Thêm audio'}
        <input type="file" accept="audio/*" onChange={handleFile} disabled={uploading} className="hidden" />
      </label>
      {value && (
        <button type="button" onClick={() => onChange('')} className="text-xs text-red-400 hover:text-red-600">Xóa</button>
      )}
    </div>
  )
}
