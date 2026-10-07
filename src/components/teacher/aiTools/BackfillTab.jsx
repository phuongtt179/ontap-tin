import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../../lib/supabase'
import { gradeStudent } from '../../../utils/aiGrader'
import toast from 'react-hot-toast'
import { Loader2, Play, Square } from 'lucide-react'

function parseTasks(instructions) {
  if (!instructions) return [{ instructions: '' }]
  try {
    const arr = JSON.parse(instructions)
    if (Array.isArray(arr) && arr.length > 0) return arr
  } catch { /* không phải JSON → coi cả chuỗi là 1 đề */ }
  return [{ instructions }]
}

// Đề rỗng (hoặc chỉ là "[]") → AI không có gì để đối chiếu, từng cho 10 điểm cho bài gõ "1" → bỏ qua
const isEmptyTask = t => !t || !String(t.instructions || '').trim() || String(t.instructions).trim() === '[]'

const SINCE = {
  '30d': { label: '30 ngày gần đây', date: () => new Date(Date.now() - 30 * 864e5).toISOString() },
  jul: { label: 'Từ 01/07/2026', date: () => '2026-07-01T00:00:00Z' },
  all: { label: 'Toàn bộ', date: () => null },
}
const DELAY_MS = 6000  // giãn nhịp giữa các bài để không giành lượt Gemini với học sinh đang học

export default function BackfillTab({ onChanged }) {
  const [since, setSince] = useState('30d')
  const [batch, setBatch] = useState(20)
  const [count, setCount] = useState(null)
  const [running, setRunning] = useState(false)
  const [status, setStatus] = useState('')
  const [log, setLog] = useState([])
  const stopRef = useRef(false)

  function baseQuery(q) {
    q = q.is('score', null).is('graded_by', null).is('reviewed_at', null)
    const d = SINCE[since].date()
    return d ? q.gte('submitted_at', d) : q
  }

  useEffect(() => {
    setCount(null)
    baseQuery(supabase.from('lesson_submissions').select('id', { count: 'exact', head: true }))
      .then(({ count }) => setCount(count ?? 0))
  }, [since]) // eslint-disable-line react-hooks/exhaustive-deps

  const addLog = (entry) => setLog(prev => [entry, ...prev].slice(0, 200))
  const sleep = ms => new Promise(r => setTimeout(r, ms))

  async function run() {
    stopRef.current = false
    setRunning(true); setLog([])
    const { data: pool, error } = await baseQuery(
      supabase.from('lesson_submissions')
        .select('id, user_id, lesson_id, file_url, file_name, text_content, content_json, submitted_at, profiles(full_name), lessons(title, practice_instructions)')
    ).order('submitted_at', { ascending: false }).limit(Math.min(batch * 5, 250))
    if (error) { toast.error('Không tải được danh sách bài'); setRunning(false); return }

    // Lấy dư rồi lọc: bài thuộc bài học không có đề thực hành sẽ luôn chưa có điểm — nếu không lọc,
    // chúng chiếm chỗ đầu danh sách mãi và các lượt chấm sau không tiến lên được.
    const withTask = pool.map(sub => ({ sub, taskDef: parseTasks(sub.lessons?.practice_instructions)[sub.content_json?.task_index ?? 0] }))
    const skipped = withTask.filter(x => isEmptyTask(x.taskDef)).length
    if (skipped) addLog({ who: `${skipped} bài thuộc bài học không có đề thực hành`, state: 'skip', msg: 'Bỏ qua — thầy/cô kiểm tra lại đề' })
    const subs = withTask.filter(x => !isEmptyTask(x.taskDef)).slice(0, batch)

    let ok = 0
    for (let i = 0; i < subs.length && !stopRef.current; i++) {
      const { sub, taskDef } = subs[i]
      const who = `${sub.profiles?.full_name || '?'} — ${sub.lessons?.title || '?'}`

      setStatus(`Đang chấm ${i + 1}/${subs.length}: ${who}`)
      try {
        const { results } = await gradeStudent([sub], [taskDef])
        const r = results?.[0]
        if (!r) throw new Error('AI không trả kết quả')
        const updates = {
          score: r.score, ai_score: r.score, teacher_comment: r.comment, graded_by: 'ai',
          ai_graded_at: new Date().toISOString(), ai_breakdown: r.breakdown || null,
          ai_suspect: !!r.ai_suspect, ai_suspect_reason: r.ai_suspect_reason || null,
        }
        const { error: upErr } = await supabase.from('lesson_submissions').update(updates).eq('id', sub.id)
        if (upErr) throw upErr
        ok++
        addLog({ who, state: 'ok', msg: `${r.score} điểm` })
      } catch (err) {
        if (err.quotaType === 'quota_rpd') { addLog({ who, state: 'err', msg: 'Hết lượt AI hôm nay — dừng lại' }); break }
        if (err.quotaType === 'quota_rpm') {
          for (let s = 60; s > 0 && !stopRef.current; s--) { setStatus(`AI đang bận, chờ ${s}s rồi thử lại...`); await sleep(1000) }
          i--; continue
        }
        addLog({ who, state: 'err', msg: err.message || 'Lỗi' })
      }
      if (i < subs.length - 1) await sleep(DELAY_MS)
    }
    setStatus(''); setRunning(false)
    toast.success(`AI đã chấm nháp ${ok} bài — vào thẻ Duyệt bài để duyệt`)
    setCount(c => (c == null ? c : Math.max(0, c - ok)))
    onChanged?.()
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Học sinh nộp bài xong sẽ <b>chờ thầy/cô chấm</b> (học sinh không tự gọi AI). Bấm nút dưới để AI chấm nháp các bài mới;
        sau đó vào thẻ <b>Duyệt bài AI chấm</b> để duyệt — học sinh chỉ thấy điểm khi đã duyệt. AI chấm lần lượt từng bài, mỗi bài cách nhau {DELAY_MS / 1000} giây để không giành lượt AI với học sinh đang học
        — nên chạy vào buổi tối hoặc ngoài giờ học. Không chọn "Toàn bộ" để giữ nguyên số liệu tháng 6 (giai đoạn chấm tay) làm minh chứng trước/sau.
      </p>
      <div className="flex flex-wrap items-center gap-3 bg-white border border-gray-200 rounded-xl p-3">
        <select value={since} onChange={e => setSince(e.target.value)} disabled={running}
          className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm">
          {Object.entries(SINCE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <span className="text-sm">
          {count === null ? <Loader2 size={14} className="inline animate-spin" /> : <b>{count.toLocaleString('vi-VN')}</b>} bài chưa có điểm
        </span>
        <label className="text-sm flex items-center gap-1 ml-auto">
          Mỗi lượt chấm
          <select value={batch} onChange={e => setBatch(Number(e.target.value))} disabled={running}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm">
            {[10, 20, 50].map(n => <option key={n} value={n}>{n} bài</option>)}
          </select>
        </label>
        {running ? (
          <button onClick={() => { stopRef.current = true }}
            className="flex items-center gap-1 text-sm font-semibold bg-red-600 text-white px-3 py-1.5 rounded-lg"><Square size={13} /> Dừng</button>
        ) : (
          <button onClick={run} disabled={!count}
            className="flex items-center gap-1 text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg disabled:opacity-50"><Play size={13} /> AI chấm nháp</button>
        )}
      </div>
      {status && <p className="text-sm text-indigo-700 flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> {status}</p>}
      {log.length > 0 && (
        <ul className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 text-sm max-h-96 overflow-y-auto">
          {log.map((l, i) => (
            <li key={i} className="px-3 py-1.5 flex gap-2">
              <span className={l.state === 'ok' ? 'text-green-600' : l.state === 'skip' ? 'text-gray-400' : 'text-red-600'}>
                {l.state === 'ok' ? '✓' : l.state === 'skip' ? '–' : '✗'}
              </span>
              <span className="flex-1 min-w-0 truncate">{l.who}</span>
              <span className="text-gray-500 text-xs">{l.msg}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
