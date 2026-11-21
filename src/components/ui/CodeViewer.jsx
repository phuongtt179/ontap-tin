// Xem nội dung tệp mã học sinh nộp (.py, .txt…). choChay: hiện nút chạy thử Python (trang chấm bài của giáo viên).
import { useState } from 'react'
import { Loader2, Play, TerminalSquare } from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { runPython } from '../../utils/gradePrep.js'

export default function CodeViewer({ url, ext, choChay = false }) {
  const [content, setContent] = useState(null)
  const [shown, setShown] = useState(false)
  const [loading, setLoading] = useState(false)
  const [stdin, setStdin] = useState('')
  const [running, setRunning] = useState(false)
  const [output, setOutput] = useState(null) // { stdout, stderr, ok }

  async function toggle() {
    if (shown) { setShown(false); return }
    if (content !== null) { setShown(true); return }
    setLoading(true)
    try {
      const res = await fetch(url)
      setContent(await res.text())
    } catch {
      setContent('(Không thể tải nội dung file)')
    }
    setLoading(false)
    setShown(true)
  }

  async function runCode() {
    if (!content) return
    setRunning(true)
    setOutput(null)
    try {
      // Chạy ngay trong trình duyệt (Pyodide), không được thì Wandbox — xem utils/gradePrep.js
      const r = await runPython(content, stdin)
      if (r.error) throw new Error('không chạy được chương trình, thử lại sau')
      setOutput({ stdout: r.stdout, stderr: r.stderr, ok: !r.stderr })
    } catch (err) {
      setOutput({ stdout: '', stderr: 'Lỗi kết nối: ' + err.message, ok: false })
    }
    setRunning(false)
  }

  const needsInput = content && /input\s*\(/.test(content)

  return (
    <div className="space-y-2">
      <button onClick={toggle} disabled={loading}
        className="text-xs text-indigo-600 hover:underline disabled:opacity-50">
        {loading ? 'Đang tải...' : shown ? 'Ẩn nội dung' : 'Xem nội dung'}
      </button>

      {shown && content !== null && (
        <div className="space-y-2">
          {ext === 'py'
            ? <SyntaxHighlighter language="python" style={oneLight}
                customStyle={{ borderRadius: '8px', fontSize: '12px', margin: 0 }}>
                {content}
              </SyntaxHighlighter>
            : <pre className="bg-gray-50 border rounded-lg p-3 text-xs text-gray-700 whitespace-pre-wrap overflow-auto max-h-64">{content}</pre>
          }

          {choChay && ext === 'py' && (
            <div className="space-y-2">
              {needsInput && (
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">
                    Input (stdin) — mỗi dòng một giá trị
                  </label>
                  <textarea
                    value={stdin}
                    onChange={e => setStdin(e.target.value)}
                    rows={3}
                    placeholder="Nhập dữ liệu đầu vào..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  />
                </div>
              )}
              <button
                onClick={runCode}
                disabled={running}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition disabled:opacity-50"
              >
                {running ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
                {running ? 'Đang chạy...' : 'Chạy code'}
              </button>

              {output !== null && (
                <div className="rounded-lg border overflow-hidden text-xs font-mono">
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium ${output.ok && !output.stderr ? 'bg-green-50 text-green-700 border-b border-green-200' : 'bg-red-50 text-red-700 border-b border-red-200'}`}>
                    <TerminalSquare size={13} />
                    Kết quả
                  </div>
                  {output.stdout && (
                    <pre className="px-3 py-2 bg-gray-900 text-green-300 whitespace-pre-wrap overflow-auto max-h-48">{output.stdout}</pre>
                  )}
                  {output.stderr && (
                    <pre className="px-3 py-2 bg-red-950 text-red-300 whitespace-pre-wrap overflow-auto max-h-48">{output.stderr}</pre>
                  )}
                  {!output.stdout && !output.stderr && (
                    <pre className="px-3 py-2 bg-gray-900 text-gray-500 italic">(Không có output)</pre>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
