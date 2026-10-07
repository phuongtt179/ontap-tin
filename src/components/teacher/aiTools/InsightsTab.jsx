import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { useGrades } from '../../../hooks/useGrades'
import { maskNames, unmaskNames } from '../../../utils/anonymize'
import toast from 'react-hot-toast'
import { Loader2, Sparkles, ShieldAlert, Lightbulb } from 'lucide-react'
import { apiFetch } from '../../../lib/apiFetch'

const PERIODS = { 30: '30 ngày', 90: '90 ngày', 0: 'Toàn bộ' }
const MODE_LABEL = { quiz: 'Trắc nghiệm', practice: 'Thực hành', theory: 'Lý thuyết' }

export default function InsightsTab() {
  const { grades } = useGrades()
  const [pickedGrade, setPickedGrade] = useState('')
  const grade = pickedGrade || grades[0] || ''
  const [lessons, setLessons] = useState([])
  const [lessonId, setLessonId] = useState('all')
  const [days, setDays] = useState(30)
  const [msgs, setMsgs] = useState(null)       // câu hỏi đã tải (đã kèm tên thật, CHỈ nằm trên máy giáo viên)
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState(null)

  function pickGrade(g) { setPickedGrade(g); setLessonId('all'); setMsgs(null); setResult(null) }

  useEffect(() => {
    if (!grade) return
    supabase.from('lessons').select('id, title').eq('grade', grade).eq('is_published', true).order('order')
      .then(({ data }) => setLessons(data || []))
  }, [grade])

  async function load() {
    setLoading(true); setResult(null)
    const ids = lessonId === 'all' ? lessons.map(l => l.id) : [lessonId]
    if (!ids.length) { setMsgs([]); setLoading(false); return }
    let q = supabase.from('messages').select('id, student_id, content, created_at, context')
      .eq('channel', 'ai').eq('sender_role', 'student').in('context->>lessonId', ids)
      .order('created_at', { ascending: false }).limit(300)
    if (days) q = q.gte('created_at', new Date(Date.now() - days * 864e5).toISOString())
    const { data, error } = await q
    if (error) { toast.error('Không tải được câu hỏi'); setLoading(false); return }
    const studentIds = [...new Set((data || []).map(m => m.student_id))]
    const { data: profs } = studentIds.length
      ? await supabase.from('profiles').select('id, full_name').in('id', studentIds) : { data: [] }
    const nameOf = Object.fromEntries((profs || []).map(p => [p.id, p.full_name]))
    setMsgs((data || []).map(m => ({ ...m, name: nameOf[m.student_id] || '?' })))
    setLoading(false)
  }

  async function analyze() {
    // Ẩn danh: mỗi học sinh 1 mã HSxx; tên học sinh tự gõ trong câu hỏi cũng bị thay bằng mã
    const codeOf = {}, codeToName = {}
    msgs.forEach(m => {
      if (!codeOf[m.student_id]) {
        const code = `HS${String(Object.keys(codeOf).length + 1).padStart(2, '0')}`
        codeOf[m.student_id] = code; codeToName[code] = m.name
      }
    })
    const questions = msgs.map((m, i) => ({ id: i, text: maskNames(String(m.content || ''), codeToName) }))
    const lessonLabel = lessonId === 'all' ? `khoá "${grade}"` : `bài "${lessons.find(l => l.id === lessonId)?.title}"`
    setAnalyzing(true)
    try {
      const res = await apiFetch('/api/teacher-ai', { action: 'insights', lessonLabel, questions })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) toast.error(res.status === 429 ? 'AI đang hết lượt, thử lại sau' : 'AI chưa phân tích được, thử lại')
      else setResult({ ...data, codeToName })
    } catch { toast.error('Lỗi kết nối') }
    setAnalyzing(false)
  }

  const byMode = (msgs || []).reduce((acc, m) => { const k = m.context?.mode || 'khác'; acc[k] = (acc[k] || 0) + 1; return acc }, {})
  const studentsCount = new Set((msgs || []).map(m => m.student_id)).size
  const total = msgs?.length || 0

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Học sinh hỏi gia sư AI rất nhiều nhưng thầy/cô không thể đọc hết. AI sẽ đọc các câu hỏi của một bài (hoặc cả khoá),
        gom thành <b>những điều lớp đang bối rối nhất</b> kèm gợi ý dạy lại, và <b>gắn cờ</b> các tin nhắn cần chú ý (nói tục, dấu hiệu buồn bã/bị bắt nạt, lộ thông tin cá nhân).
        Tên học sinh được ẩn trước khi gửi cho AI.
      </p>
      <div className="flex flex-wrap items-center gap-2 bg-white border border-gray-200 rounded-xl p-3">
        <select value={grade} onChange={e => pickGrade(e.target.value)} className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm">
          {grades.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        <select value={lessonId} onChange={e => { setLessonId(e.target.value); setMsgs(null); setResult(null) }}
          className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm max-w-xs">
          <option value="all">Tất cả bài trong khoá</option>
          {lessons.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
        </select>
        <select value={days} onChange={e => { setDays(Number(e.target.value)); setMsgs(null); setResult(null) }}
          className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm">
          {Object.entries(PERIODS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <button onClick={load} disabled={loading || !grade}
          className="text-sm font-semibold border border-indigo-300 text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-50 disabled:opacity-50">
          {loading ? <Loader2 size={13} className="inline animate-spin" /> : 'Tải câu hỏi'}
        </button>
        {total > 0 && (
          <button onClick={analyze} disabled={analyzing}
            className="ml-auto flex items-center gap-1 text-sm font-semibold bg-violet-600 hover:bg-violet-700 text-white px-3 py-1.5 rounded-lg disabled:opacity-50">
            {analyzing ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />} AI phân tích {total} câu
          </button>
        )}
      </div>

      {msgs && (
        total === 0 ? <p className="text-center text-gray-400 py-8">Chưa có câu hỏi nào trong phạm vi này.</p> : (
          <p className="text-sm text-gray-600">
            <b>{total}</b> câu hỏi{total === 300 ? ' (300 câu gần nhất)' : ''} từ <b>{studentsCount}</b> học sinh ·{' '}
            {Object.entries(byMode).map(([k, v]) => `${MODE_LABEL[k] || k}: ${v}`).join(' · ')}
          </p>
        )
      )}

      {result && (
        <div className="space-y-4">
          {result.summary && <p className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 text-sm text-indigo-900">{result.summary}</p>}

          {result.flags.length > 0 && (
            <section className="bg-red-50 border border-red-200 rounded-xl p-4">
              <h3 className="font-bold text-red-700 text-sm flex items-center gap-1.5 mb-2"><ShieldAlert size={15} /> Cần thầy/cô chú ý ({result.flags.length})</h3>
              <ul className="space-y-2">
                {result.flags.map(f => {
                  const m = msgs[f.id]
                  if (!m) return null
                  return (
                    <li key={f.id} className="text-sm bg-white rounded-lg px-3 py-2 border border-red-100">
                      <div className="text-xs text-gray-500">{m.name} · {new Date(m.created_at).toLocaleString('vi-VN')} · <span className="text-red-600 font-semibold">{f.reason}</span></div>
                      <div className="text-gray-800">{m.content}</div>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}

          <section className="space-y-3">
            <h3 className="font-bold text-gray-700 text-sm">Những điều học sinh hay thắc mắc</h3>
            {result.themes.length === 0 && <p className="text-sm text-gray-400">AI không tìm thấy chủ đề nổi bật.</p>}
            {result.themes.map((t, i) => {
              const count = Math.min(Number(t.count) || 0, total)
              return (
                <div key={i} className="bg-white border border-gray-200 rounded-xl p-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-800 flex-1">{t.title}</span>
                    <span className="text-xs font-bold text-violet-700">~{count} câu</span>
                  </div>
                  <div className="h-1.5 bg-violet-100 rounded-full overflow-hidden mt-1.5">
                    <div className="h-full bg-violet-500 rounded-full" style={{ width: `${(count / total) * 100}%` }} />
                  </div>
                  {(t.example_ids || []).slice(0, 3).map(id => msgs[id] && (
                    <p key={id} className="text-xs text-gray-500 mt-1.5">“{unmaskNames(String(msgs[id].content).slice(0, 200), result.codeToName)}”</p>
                  ))}
                  {t.suggestion && <p className="text-xs text-amber-800 bg-amber-50 rounded px-2 py-1 mt-2 flex gap-1"><Lightbulb size={12} className="shrink-0 mt-0.5" /> {t.suggestion}</p>}
                </div>
              )
            })}
            <p className="text-[11px] text-gray-400">Số câu mỗi chủ đề do AI ước lượng, chỉ mang tính tham khảo.</p>
          </section>
        </div>
      )}
    </div>
  )
}
