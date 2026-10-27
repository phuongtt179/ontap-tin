// Kết quả CHẠY THỬ bài Python của học sinh, hiện ngay sau khi nộp — máy chạy code thật (Pyodide trong trình
// duyệt), KHÔNG phải AI, nên không vướng quy định "học sinh không nhận nội dung AI chưa qua giáo viên duyệt".
// Điểm và nhận xét vẫn chờ giáo viên duyệt. Lần chạy thử ghi trong Tiêu chí chấm (rubric) là ẩn với học sinh
// → chỉ báo đúng/sai, không lộ dữ liệu vào và kết quả mong đợi.
import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { parseTestCases, runPython } from '../../utils/gradePrep.js'

export default function PyTestStatus({ fileUrl, task }) {
  const [kq, setKq] = useState(null)   // null = đang chạy · [] = không có lần chạy thử · [{…}]
  const laPy = /\.py(\?|$)/i.test(fileUrl || '')
  useEffect(() => {
    if (!laPy) return
    let song = true
    ;(async () => {
      const hien = parseTestCases(task?.instructions || '').map(t => ({ ...t, an: false }))
      const an = parseTestCases(task?.rubric || '').map(t => ({ ...t, an: true }))
      const tests = [...hien, ...an]
      if (!tests.length) { if (song) setKq([]); return }
      let code
      try { const r = await fetch(fileUrl); code = await r.text() } catch { if (song) setKq([]); return }
      const out = []
      for (const t of tests) {
        const r = await runPython(code, t.input.replace(/\\n/g, '\n'))
        if (r.error) { if (song) setKq([]); return }   // không chạy được (mất mạng…) → không hiện gì
        const exp = t.expected.replace(/\\n/g, '\n').trim()
        out.push({ ...t, actual: r.stdout.trim(), passed: r.stdout.trim() === exp, loi: r.stderr })
      }
      if (song) setKq(out)
    })()
    return () => { song = false }
  }, [fileUrl, task?.instructions, task?.rubric, laPy])

  if (!laPy || (kq && !kq.length)) return null
  if (!kq) return (
    <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-200">
      <Loader2 size={13} className="animate-spin" /> Đang chạy thử chương trình của em…
    </div>
  )
  const dung = kq.filter(t => t.passed).length, het = dung === kq.length
  const sai = kq.filter(t => !t.passed)
  return (
    <div className={`rounded-xl p-3 border text-sm ${het ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
      <div className={`font-bold ${het ? 'text-green-700' : 'text-orange-700'}`}>
        {het ? '✅' : '🔧'} Chạy thử: đúng {dung}/{kq.length} lần
      </div>
      {!het && <ul className="mt-1.5 space-y-1 text-xs text-gray-700">
        {sai.slice(0, 3).map((t, i) => t.an
          ? <li key={i}>• Một lần chạy thử ẩn chưa đúng — em kiểm tra lại các trường hợp khác nhé.</li>
          : <li key={i}>• Nhập <code className="bg-white px-1 rounded">{t.input}</code> → cần in <code className="bg-white px-1 rounded">{t.expected}</code>, chương trình của em in <code className="bg-white px-1 rounded">{t.actual || (t.loi ? 'lỗi' : '(không in gì)')}</code></li>)}
      </ul>}
      <p className="mt-1.5 text-[11px] text-gray-500">Đây là máy chạy thử chương trình. Điểm và nhận xét sẽ có sau khi thầy cô xem bài.</p>
    </div>
  )
}
