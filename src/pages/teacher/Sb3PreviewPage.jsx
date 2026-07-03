import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Upload, Copy, Check, FileCode } from 'lucide-react'
import JSZip from 'jszip'
import { generateSb3Text } from '../../utils/sb3Text'

export default function Sb3PreviewPage() {
  const navigate = useNavigate()
  const inputRef = useRef()
  const [text, setText] = useState('')
  const [fileName, setFileName] = useState('')
  const [dragging, setDragging] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  async function processFile(file) {
    if (!file?.name.endsWith('.sb3')) {
      setError('Chỉ hỗ trợ file .sb3')
      return
    }
    setError('')
    setText('')
    setFileName(file.name)
    try {
      const buf = await file.arrayBuffer()
      const zip = await JSZip.loadAsync(buf)
      const jsonStr = await zip.file('project.json').async('string')
      const output = generateSb3Text(JSON.parse(jsonStr))
      setText(output)
    } catch {
      setError('Không đọc được file. Hãy thử xuất lại từ Scratch.')
    }
  }

  function onDrop(e) {
    e.preventDefault()
    setDragging(false)
    processFile(e.dataTransfer.files[0])
  }

  async function copyText() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-lg font-black text-gray-800 flex items-center gap-2">
            <FileCode size={20} className="text-indigo-500" /> Xem AI đọc file Scratch
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">Upload file .sb3 để xem text mà AI dùng khi chấm bài</p>
        </div>
      </div>

      {/* Upload zone */}
      <div
        onClick={() => inputRef.current.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition
          ${dragging ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'}`}
      >
        <Upload size={32} className="mx-auto mb-3 text-gray-300" />
        <p className="font-semibold text-gray-600">Kéo thả file .sb3 vào đây</p>
        <p className="text-sm text-gray-400 mt-1">hoặc bấm để chọn file</p>
        <input ref={inputRef} type="file" accept=".sb3" className="hidden"
          onChange={e => processFile(e.target.files[0])} />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          ⚠️ {error}
        </div>
      )}

      {/* Output */}
      {text && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-gray-700">
              📄 {fileName} — Text AI đọc được
            </p>
            <button onClick={copyText}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition
                ${copied ? 'bg-green-100 text-green-700' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'}`}>
              {copied ? <><Check size={13} /> Đã copy</> : <><Copy size={13} /> Copy toàn bộ</>}
            </button>
          </div>
          <pre className="bg-gray-900 text-green-300 text-xs rounded-2xl p-5 overflow-auto max-h-[60vh] leading-relaxed whitespace-pre-wrap">
            {text}
          </pre>

          {/* Hướng dẫn dùng */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 space-y-1">
            <p className="font-bold">Cách dùng text này làm code mẫu:</p>
            <ol className="list-decimal list-inside space-y-0.5 text-xs leading-relaxed">
              <li>Bấm <strong>Copy toàn bộ</strong> ở trên</li>
              <li>Vào <strong>Bài học → Soạn task thực hành → ô Rubric</strong></li>
              <li>Thêm vào cuối rubric dòng <code className="bg-amber-100 px-1 rounded">=== CODE MẪU ===</code></li>
              <li>Dán text vừa copy phía dưới</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  )
}
