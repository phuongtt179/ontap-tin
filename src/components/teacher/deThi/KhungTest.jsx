// Test của đề Python: học sinh nộp code, máy chủ chạy với từng test (tối đa 2 giây/test) và so output.
import { X } from 'lucide-react'

export default function KhungTest({ tests, setTests }) {
  const doi = (i, k, v) => setTests(ts => ts.map((t, j) => (j === i ? { ...t, [k]: v } : t)))
  const tong = tests.reduce((x, t) => x + (Number(t.diem) || 0), 0)
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">Test chấm tự động ({tests.length} test, tổng {tong} điểm → quy về thang 10)</label>
        <button type="button" onClick={() => setTests(ts => [...ts, { input: '', expected: '', diem: 1 }])}
          className="text-xs font-semibold text-indigo-600 hover:underline">+ Thêm test</button>
      </div>
      <p className="text-[11px] text-gray-500">Học sinh không xem được test. Output so từng dòng, bỏ khoảng trắng thừa cuối dòng. Mỗi test chạy tối đa 2 giây.</p>
      {tests.map((t, i) => (
        <div key={i} className="grid grid-cols-[auto_1fr_1fr_auto_auto] gap-2 items-start">
          <span className="text-xs font-bold text-gray-500 pt-2">#{i + 1}</span>
          <textarea value={t.input} onChange={e => doi(i, 'input', e.target.value)} rows={2} placeholder="Input (mỗi lần input() là 1 dòng)"
            className="border border-gray-300 rounded-lg px-2 py-1 text-xs font-mono resize-y" />
          <textarea value={t.expected} onChange={e => doi(i, 'expected', e.target.value)} rows={2} placeholder="Output mong đợi"
            className="border border-gray-300 rounded-lg px-2 py-1 text-xs font-mono resize-y" />
          <input type="number" min={0.25} step={0.25} value={t.diem} onChange={e => doi(i, 'diem', e.target.value)} title="Điểm của test"
            className="w-14 border border-gray-300 rounded-lg px-1 py-1 text-xs text-center" />
          <button type="button" onClick={() => setTests(ts => ts.filter((_, j) => j !== i))} className="text-red-500 pt-1" title="Xoá test"><X size={14} /></button>
        </div>
      ))}
    </div>
  )
}
