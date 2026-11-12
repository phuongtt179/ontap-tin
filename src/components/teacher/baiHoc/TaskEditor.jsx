// Soạn 1 bài thực hành trong form bài học: đề (markdown, dán bảng từ Word/Excel), tiêu chí chấm (chỉ AI đọc), tệp đề.
import { useState, useRef } from 'react'
import toast from 'react-hot-toast'
import JSZip from 'jszip'
import { FileText, X, Loader2, Upload } from 'lucide-react'
import MarkdownContent from '../../ui/MarkdownContent'
import { uploadFile } from '../../../lib/cloudinary'
import { generateSb3Text } from '../../../utils/sb3Text'

export default function TaskEditor({ index, task, onChange, onRemove, autoFocus }) {
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
