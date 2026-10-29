// 💡 HỎI ĐÁP MẪU — giáo viên nhờ AI soạn các cặp "câu học sinh hay hỏi – câu trả lời" cho từng bài, sửa rồi DUYỆT.
// Học sinh hỏi trong bài → AI chỉ phân loại câu hỏi khớp câu mẫu nào → em nhận đúng câu trả lời đã duyệt (api/hoi-dap.js).
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Loader2, Sparkles, Check, Trash2, Plus, EyeOff, Save } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { apiFetch } from '../../../lib/apiFetch'
import { useAuth } from '../../../context/AuthContext'

const SEL = 'border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm bg-white'
const AI_LOI = { quota_rpd: 'AI đã hết lượt hôm nay', quota_rpm: 'AI đang bận, chờ 1 phút rồi thử lại', parse_error: 'AI trả về chưa đúng dạng, bấm thử lại' }

function nguonBai(les) {
  let tasks = []
  try { const a = JSON.parse(les.practice_instructions || '[]'); tasks = Array.isArray(a) ? a : [] } catch { tasks = les.practice_instructions ? [{ instructions: les.practice_instructions }] : [] }
  const th = tasks.filter(t => !t.optional && String(t.instructions || '').trim())
    .map((t, i) => `Bài thực hành ${i + 1}: ${String(t.instructions).replace(/\[test[^\n]*\]/gi, '').trim()}`).join('\n\n')
  return [les.description, les.ai_context, les.ai_tutor_notes, th].filter(s => String(s || '').trim()).join('\n\n')
}

function DongFaq({ f, onDoi, onXoa }) {
  const [hoi, setHoi] = useState(f.question), [dap, setDap] = useState(f.answer), [dang, setDang] = useState(false)
  const doi = hoi !== f.question || dap !== f.answer
  async function luu(approved = f.approved) {
    if (hoi.trim().length < 3 || dap.trim().length < 3) { toast.error('Câu hỏi và câu trả lời không được để trống'); return }
    setDang(true)
    const { data, error } = await supabase.from('lesson_faq')
      .update({ question: hoi.trim(), answer: dap.trim(), approved, approved_at: approved ? new Date().toISOString() : null })
      .eq('id', f.id).select().single()
    setDang(false)
    if (error) { toast.error('Lưu thất bại: ' + error.message); return }
    onDoi(data)
  }
  return (
    <div className={`rounded-xl border p-3 space-y-2 bg-white ${f.approved ? 'border-green-200' : 'border-amber-200'}`}>
      <div className="flex items-center gap-2 text-xs">
        {f.approved ? <span className="font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded">✓ Đã duyệt — học sinh dùng được</span>
          : <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">Chờ duyệt</span>}
        <span className="text-gray-400">{f.source === 'ai' ? 'AI soạn' : f.source === 'student' ? 'Từ câu học sinh hỏi' : 'Thầy cô thêm'}</span>
        {f.use_count > 0 && <span className="text-indigo-600 font-semibold">· đã trả lời {f.use_count} lần</span>}
      </div>
      <input value={hoi} onChange={e => setHoi(e.target.value)} className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm font-semibold" placeholder="Câu học sinh hay hỏi" />
      <textarea value={dap} onChange={e => setDap(e.target.value)} rows={3} className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm" placeholder="Câu trả lời (gợi mở, không đưa đáp án)" />
      <div className="flex flex-wrap gap-2 justify-end">
        <button onClick={() => { if (confirm('Xoá câu hỏi đáp này?')) onXoa(f) }} className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:text-red-600"><Trash2 size={12} />Xoá</button>
        {doi && <button onClick={() => luu()} disabled={dang} className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-indigo-300 text-indigo-700"><Save size={12} />Lưu sửa</button>}
        {f.approved
          ? <button onClick={() => luu(false)} disabled={dang} className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-gray-300 text-gray-600"><EyeOff size={12} />Bỏ duyệt</button>
          : <button onClick={() => luu(true)} disabled={dang} className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-green-600 text-white disabled:opacity-50">
            {dang ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}{doi ? 'Lưu & duyệt' : 'Duyệt'}</button>}
      </div>
    </div>
  )
}

export default function FaqTab({ loc = {} }) {
  const { user } = useAuth()
  const [baiHocs, setBaiHocs] = useState([]), [baiId, setBaiId] = useState('')
  const [ds, setDs] = useState(null), [dang, setDang] = useState(''), [soCau, setSoCau] = useState(12)
  const [dem, setDem] = useState({})   // lesson_id -> số câu đã duyệt (để biết bài nào chưa có)

  useEffect(() => {
    setBaiId(''); setDs(null)
    if (!loc.grade) { setBaiHocs([]); return }
    supabase.from('lessons').select('id, title, "order"').eq('grade', loc.grade).order('order').then(({ data }) => setBaiHocs(data || []))
  }, [loc.grade])
  useEffect(() => {
    if (!baiHocs.length) { setDem({}); return }
    supabase.from('lesson_faq').select('lesson_id').eq('approved', true).in('lesson_id', baiHocs.map(b => b.id))
      .then(({ data }) => { const m = {}; (data || []).forEach(r => { m[r.lesson_id] = (m[r.lesson_id] || 0) + 1 }); setDem(m) })
  }, [baiHocs, ds])
  useEffect(() => {
    if (!baiId) { setDs(null); return }
    supabase.from('lesson_faq').select('*').eq('lesson_id', baiId).order('approved').order('sort_order').order('created_at')
      .then(({ data }) => setDs(data || []))
  }, [baiId])

  async function aiSoan() {
    setDang('ai')
    try {
      const { data: les } = await supabase.from('lessons').select('title, grade, description, ai_context, ai_tutor_notes, practice_instructions, question_ids').eq('id', baiId).single()
      const { data: qs } = les.question_ids?.length ? await supabase.from('questions').select('question').in('id', les.question_ids) : { data: [] }
      const r = await apiFetch('/api/teacher-ai', { action: 'faq', lessonTitle: les.title, grade: les.grade, sourceText: nguonBai(les), soCau,
        questions: (qs || []).map(q => q.question), daCo: (ds || []).map(f => f.question) })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(AI_LOI[d.error] || 'Lỗi AI: ' + (d.error || r.status))
      if (!d.items?.length) throw new Error('AI chưa soạn được câu nào, bấm thử lại')
      const { data: moi, error } = await supabase.from('lesson_faq')
        .insert(d.items.map((x, i) => ({ lesson_id: baiId, question: x.hoi, answer: x.dap, source: 'ai', sort_order: (ds?.length || 0) + i, created_by: user?.id })))
        .select()
      if (error) throw error
      setDs(prev => [...(prev || []), ...moi]); toast.success(`AI đã soạn ${moi.length} câu — thầy cô đọc, sửa rồi duyệt`)
    } catch (e) { toast.error(e.message) }
    setDang('')
  }
  async function themTay() {
    const { data, error } = await supabase.from('lesson_faq')
      .insert({ lesson_id: baiId, question: 'Câu học sinh hay hỏi…', answer: 'Câu trả lời của thầy cô…', source: 'teacher', sort_order: ds?.length || 0, created_by: user?.id }).select().single()
    if (error) { toast.error(error.message); return }
    setDs(prev => [...(prev || []), data])
  }
  async function duyetHet() {
    const cho = (ds || []).filter(f => !f.approved)
    if (!cho.length || !confirm(`Duyệt cả ${cho.length} câu đang chờ? Thầy cô nên đọc qua trước.`)) return
    setDang('duyet')
    const { error } = await supabase.from('lesson_faq').update({ approved: true, approved_at: new Date().toISOString() }).in('id', cho.map(f => f.id))
    setDang('')
    if (error) { toast.error(error.message); return }
    setDs(prev => prev.map(f => (cho.some(c => c.id === f.id) ? { ...f, approved: true } : f)))
  }
  async function xoa(f) {
    const { error } = await supabase.from('lesson_faq').delete().eq('id', f.id)
    if (error) { toast.error(error.message); return }
    setDs(prev => prev.filter(x => x.id !== f.id))
  }

  const daDuyet = (ds || []).filter(f => f.approved).length
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Soạn sẵn <b>hỏi đáp mẫu</b> cho từng bài: AI soạn nháp → thầy cô sửa và <b>duyệt</b>. Khi học sinh bấm <b>Hỏi thầy cô</b> trong bài, máy chỉ <b>tìm câu mẫu cùng ý</b>
        và hiện câu trả lời thầy cô đã duyệt (AI không viết chữ mới cho học sinh). Không khớp câu nào thì câu hỏi gửi thầy cô như cũ.
      </p>
      {!loc.grade ? <p className="text-center text-gray-400 py-10">Chọn <b>khoá</b> ở thanh lọc phía trên để xem các bài học.</p> : (
        <>
          <div className="flex flex-wrap items-center gap-2 bg-white border border-gray-200 rounded-xl p-3">
            <select className={SEL + ' min-w-[280px]'} value={baiId} onChange={e => setBaiId(e.target.value)}>
              <option value="">— Chọn bài học —</option>
              {baiHocs.map(b => <option key={b.id} value={b.id}>{dem[b.id] ? `✓ ${dem[b.id]} câu · ` : '○ '}{b.title}</option>)}
            </select>
            {baiId && <>
              <select className={SEL} value={soCau} onChange={e => setSoCau(+e.target.value)}>{[6, 10, 12, 15, 20].map(n => <option key={n} value={n}>{n} câu</option>)}</select>
              <button onClick={aiSoan} disabled={!!dang} className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg bg-violet-600 text-white disabled:opacity-50">
                {dang === 'ai' ? <><Loader2 size={14} className="animate-spin" />AI đang soạn… (15–40 giây)</> : <><Sparkles size={14} />AI soạn hỏi đáp</>}</button>
              <button onClick={themTay} disabled={!!dang} className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg border border-gray-300"><Plus size={14} />Thêm câu</button>
              {(ds || []).some(f => !f.approved) && <button onClick={duyetHet} disabled={!!dang} className="flex items-center gap-1 text-sm font-semibold px-3 py-1.5 rounded-lg bg-green-600 text-white disabled:opacity-50"><Check size={14} />Duyệt tất cả</button>}
              {ds && <span className="text-xs text-gray-500 ml-auto">{daDuyet}/{ds.length} câu đã duyệt</span>}
            </>}
          </div>
          {baiId && ds === null && <div className="flex justify-center py-8"><Loader2 className="animate-spin text-indigo-400" /></div>}
          {ds?.length === 0 && <p className="text-center text-gray-400 py-8">Bài này chưa có hỏi đáp mẫu. Bấm <b>AI soạn hỏi đáp</b> để bắt đầu.</p>}
          <div className="grid md:grid-cols-2 gap-3">
            {(ds || []).map(f => <DongFaq key={f.id} f={f} onDoi={moi => setDs(prev => prev.map(x => (x.id === moi.id ? moi : x)))} onXoa={xoa} />)}
          </div>
        </>
      )}
    </div>
  )
}
