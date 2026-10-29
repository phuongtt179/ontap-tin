// ✅ CHẤM BÀI (29/10/2026) — giáo viên đánh giá bài thực hành theo mức T/H/C, AI chỉ gợi ý.
//   • Theo bài: chọn bài + lớp → danh sách học sinh đã nộp, gợi ý của AI theo tiêu chí, cột T/H/C để duyệt / đổi.
//   • Theo học sinh: chọn lớp + học sinh → các bài em đã nộp theo thời gian, gợi ý của AI, cột T/H/C.
// AI chấm nháp chỉ khi giáo viên bấm (chạy trên máy giáo viên). Học sinh chỉ thấy mức + nhận xét sau khi duyệt.
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Loader2, Bot, Check, ExternalLink, ClipboardCheck, User, BookOpen } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useGrades } from '../../hooks/useGrades'
import { MUC, CAC_MUC, mucCua, mucTuDiem } from '../../utils/muc'
import { parseTasks, aiChamNhap, luuDanhGia } from '../../utils/danhGia'

const COT = 'id,user_id,lesson_id,file_url,file_name,text_content,content_json,submitted_at,score,ai_score,muc,teacher_comment,graded_by,reviewed_at,ai_breakdown,ai_suspect,ai_suspect_reason,sticker_awarded,allow_resubmit,ra_soat'
const lsGet = k => { try { return localStorage.getItem(k) || '' } catch { return '' } }
const lsSet = (k, v) => { try { localStorage.setItem(k, v) } catch { /* trình duyệt chặn */ } }
const SEL = 'border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300'
const taskIdx = sub => Number(sub.content_json?.task_index ?? 0)

function ChonMuc({ value, onChange, goiY }) {
  return (
    <span className="inline-flex gap-1">
      {CAC_MUC.map(m => (
        <button key={m} type="button" onClick={() => onChange(m)} title={MUC[m].ten + (goiY === m ? ' (AI gợi ý)' : '')}
          className={`relative w-9 h-8 rounded-lg font-black text-sm border ${value === m ? MUC[m].nut + ' border-transparent' : 'bg-white text-gray-600 border-gray-300'}`}>
          {m}{goiY === m && <span className="absolute -top-1.5 -right-1.5 text-[9px] leading-none bg-violet-500 text-white rounded-full px-1 py-0.5">AI</span>}
        </button>
      ))}
    </span>
  )
}

/** 1 dòng bài nộp: thông tin bài · gợi ý AI theo tiêu chí · chọn mức + nhận xét · Duyệt */
function DongBai({ sub, tieuDe, taskDef, onDoi, dangBan }) {
  const goiY = sub.graded_by === 'ai' || sub.ai_score != null ? mucTuDiem(sub.ai_score ?? sub.score) : null
  const [muc, setMuc] = useState(sub.muc || mucCua(sub) || '')
  const [nx, setNx] = useState(sub.teacher_comment || '')
  const [dang, setDang] = useState('')
  useEffect(() => { setMuc(sub.muc || mucCua(sub) || ''); setNx(sub.teacher_comment || '') }, [sub.id, sub.muc, sub.score, sub.teacher_comment])   // eslint-disable-line react-hooks/exhaustive-deps
  const coNhap = sub.graded_by === 'ai' || sub.ai_breakdown?.length > 0

  async function goiYAI() {
    setDang('ai')
    try { onDoi(await aiChamNhap(sub, taskDef)) } catch (e) { toast.error(e.quotaType === 'quota_rpd' ? 'AI đã hết lượt hôm nay' : 'AI lỗi: ' + e.message) }
    setDang('')
  }
  async function duyet() {
    if (!muc) { toast.error('Chọn mức T, H hoặc C'); return }
    setDang('luu')
    const { moi, loi } = await luuDanhGia(sub, { muc, comment: nx })
    setDang('')
    if (loi) { toast.error('Lưu thất bại: ' + loi); return }
    toast.success(`Đã chốt mức ${muc}`)
    onDoi(moi)
  }

  return (
    <div className={`rounded-xl border p-3 bg-white space-y-2 ${sub.reviewed_at ? 'border-green-200' : 'border-gray-200'}`}>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-800 truncate">{tieuDe} <span className="text-xs font-normal text-gray-500">· Bài {taskIdx(sub) + 1}</span></div>
          <div className="text-xs text-gray-500">Nộp {new Date(sub.submitted_at).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
            {sub.ra_soat?.phien === sub.submitted_at && <> · em đã rà soát {sub.ra_soat.lan} lần (đạt {sub.ra_soat.ket_qua.filter(k => k.dat).length}/{sub.ra_soat.ket_qua.length})</>}
          </div>
        </div>
        {sub.reviewed_at
          ? <span className={`text-xs font-bold px-2 py-1 rounded-lg border ${MUC[mucCua(sub)]?.cls || ''}`}>Đã chốt: {mucCua(sub)}</span>
          : coNhap ? <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-violet-50 text-violet-700 border border-violet-200">AI đã gợi ý — chờ duyệt</span>
            : <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-gray-100 text-gray-600">Chưa có gợi ý</span>}
      </div>

      <div className="text-xs flex flex-wrap gap-x-3 gap-y-1">
        {sub.file_url && <a href={sub.file_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-indigo-600 font-semibold hover:underline"><ExternalLink size={12} />Mở file {sub.file_name || ''}</a>}
        {sub.text_content && <span className="text-gray-600 line-clamp-2">Ghi chú của em: {sub.text_content}</span>}
        {!sub.file_url && !sub.text_content && <span className="text-red-600 font-semibold">Bài trống</span>}
      </div>

      {sub.ai_suspect && <p className="text-xs text-rose-700 bg-rose-50 rounded px-2 py-1">🚩 AI nghi dùng AI viết hộ: {sub.ai_suspect_reason}</p>}
      {sub.ai_breakdown?.length > 0 && (
        <ul className="text-xs grid sm:grid-cols-2 gap-x-4 gap-y-0.5 bg-gray-50 rounded-lg p-2">
          {sub.ai_breakdown.map((b, i) => (
            <li key={i} className="flex gap-1.5"><span>{Number(b.earned) >= Number(b.max) ? '✅' : '⚠️'}</span>
              <span className="text-gray-700">{b.criterion}{b.note && <span className="text-gray-400"> — {b.note}</span>}</span></li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-start gap-2">
        <div className="flex items-center gap-2"><span className="text-xs text-gray-500">Mức:</span><ChonMuc value={muc} onChange={setMuc} goiY={goiY} /></div>
        <textarea value={nx} onChange={e => setNx(e.target.value)} rows={2} placeholder="Nhận xét gửi học sinh (AI soạn nháp, thầy cô sửa)"
          className="flex-1 min-w-[220px] border border-gray-300 rounded-lg px-2 py-1.5 text-sm" />
        <div className="flex flex-col gap-1">
          {!sub.reviewed_at && !coNhap && (
            <button onClick={goiYAI} disabled={!!dang || dangBan}
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-violet-300 text-violet-700 hover:bg-violet-50 disabled:opacity-50">
              {dang === 'ai' ? <Loader2 size={12} className="animate-spin" /> : <Bot size={12} />} AI gợi ý</button>
          )}
          <button onClick={duyet} disabled={!!dang || dangBan || !muc}
            className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white disabled:opacity-50">
            {dang === 'luu' ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} {sub.reviewed_at ? 'Lưu lại' : 'Duyệt'}</button>
        </div>
      </div>
    </div>
  )
}

export default function GradingPage() {
  const { grades } = useGrades()
  const [cach, setCach] = useState(() => lsGet('chamCach') || 'bai')
  const [grade, setGrade] = useState(() => lsGet('chamGrade'))
  const [lops, setLops] = useState([]), [lop, setLop] = useState('')
  const [baiHocs, setBaiHocs] = useState([]), [baiId, setBaiId] = useState('')
  const [hss, setHss] = useState([]), [hsId, setHsId] = useState('')
  const [subs, setSubs] = useState(null), [lessonMap, setLessonMap] = useState({})
  const [chuaDuyet, setChuaDuyet] = useState(true)
  const [ban, setBan] = useState('')

  useEffect(() => { if (!grade && grades.length) setGrade(grades[0]) }, [grades, grade])
  useEffect(() => { lsSet('chamCach', cach) }, [cach])
  useEffect(() => {
    if (!grade) return
    lsSet('chamGrade', grade); setLop(''); setBaiId(''); setHsId(''); setSubs(null)
    supabase.from('classes').select('name').eq('grade', grade).order('name').then(({ data }) => setLops((data || []).map(c => c.name)))
    supabase.from('lessons').select('id, title, "order", practice_instructions').eq('grade', grade).eq('has_practice', true).order('order')
      .then(({ data }) => { setBaiHocs(data || []); setLessonMap(Object.fromEntries((data || []).map(l => [l.id, l]))) })
  }, [grade])
  // danh sách học sinh của lớp (hoặc cả khoá)
  useEffect(() => {
    if (!grade) return
    let q = supabase.from('student_enrollments').select('user_id, class_name, profiles!inner(full_name)').eq('grade', grade).eq('is_approved', true)
    if (lop) q = q.eq('class_name', lop)
    q.then(({ data }) => setHss((data || []).map(e => ({ id: e.user_id, ten: e.profiles.full_name || '(chưa có tên)', lop: e.class_name }))
      .sort((a, b) => a.ten.split(' ').pop().localeCompare(b.ten.split(' ').pop(), 'vi'))))
  }, [grade, lop])

  // tải bài nộp
  useEffect(() => {
    setSubs(null)
    if (cach === 'bai') {
      if (!baiId || !hss.length) { setSubs(baiId ? [] : null); return }
      supabase.from('lesson_submissions').select(COT).eq('lesson_id', baiId).in('user_id', hss.map(h => h.id))
        .then(({ data, error }) => { if (error) toast.error('Không tải được bài nộp'); setSubs(data || []) })
    } else {
      if (!hsId) return
      supabase.from('lesson_submissions').select(COT).eq('user_id', hsId).order('submitted_at', { ascending: false }).limit(100)
        .then(async ({ data, error }) => {
          if (error) toast.error('Không tải được bài nộp')
          const thieu = [...new Set((data || []).map(s => s.lesson_id))].filter(id => !lessonMap[id])
          if (thieu.length) {
            const { data: ls } = await supabase.from('lessons').select('id, title, "order", practice_instructions').in('id', thieu)
            setLessonMap(m => ({ ...m, ...Object.fromEntries((ls || []).map(l => [l.id, l])) }))
          }
          setSubs(data || [])
        })
    }
  }, [cach, baiId, hsId, hss])   // eslint-disable-line react-hooks/exhaustive-deps

  const tenHs = useMemo(() => Object.fromEntries(hss.map(h => [h.id, h.ten])), [hss])
  const hien = useMemo(() => {
    let ds = (subs || []).filter(s => !chuaDuyet || !s.reviewed_at)
    if (cach === 'bai') ds = ds.sort((a, b) => (tenHs[a.user_id] || '').split(' ').pop().localeCompare((tenHs[b.user_id] || '').split(' ').pop(), 'vi') || taskIdx(a) - taskIdx(b))
    return ds
  }, [subs, chuaDuyet, cach, tenHs])
  const taskDefCua = sub => parseTasks(lessonMap[sub.lesson_id]?.practice_instructions)[taskIdx(sub)] || {}
  const doi = moi => setSubs(prev => prev.map(s => (s.id === moi.id ? moi : s)))
  const canGoiY = hien.filter(s => !s.reviewed_at && !(s.graded_by === 'ai' || s.ai_breakdown?.length))
  const coGoiY = hien.filter(s => !s.reviewed_at && s.graded_by === 'ai' && mucTuDiem(s.score))
  const chuaNop = cach === 'bai' && subs ? hss.filter(h => !subs.some(s => s.user_id === h.id)).length : 0

  async function goiYTatCa() {
    if (!confirm(`AI gợi ý cho ${canGoiY.length} bài? AI chấm lần lượt trên máy thầy cô, mỗi bài vài giây.`)) return
    for (let i = 0; i < canGoiY.length; i++) {
      setBan(`AI đang gợi ý ${i + 1}/${canGoiY.length}…`)
      try { doi(await aiChamNhap(canGoiY[i], taskDefCua(canGoiY[i]))) } catch (e) {
        if (e.quotaType === 'quota_rpd') { toast.error('AI đã hết lượt hôm nay'); break }
        toast.error('Lỗi 1 bài: ' + e.message)
      }
    }
    setBan('')
  }
  async function duyetTheoGoiY() {
    if (!confirm(`Chốt ${coGoiY.length} bài theo mức AI gợi ý (kèm nhận xét AI soạn)? Thầy cô nên lướt qua trước.`)) return
    let ok = 0
    for (let i = 0; i < coGoiY.length; i++) {
      setBan(`Đang chốt ${i + 1}/${coGoiY.length}…`)
      const { moi } = await luuDanhGia(coGoiY[i], { muc: mucTuDiem(coGoiY[i].score), comment: coGoiY[i].teacher_comment || '' })
      if (moi) { ok++; doi(moi) }
    }
    setBan(''); toast.success(`Đã chốt ${ok} bài`)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-xl font-bold text-gray-800 mr-2 flex items-center gap-2"><ClipboardCheck size={22} className="text-indigo-600" />Chấm bài</h1>
        <div className="inline-flex rounded-xl border border-gray-200 bg-white p-0.5">
          <button onClick={() => setCach('bai')} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold ${cach === 'bai' ? 'bg-indigo-600 text-white' : 'text-gray-600'}`}><BookOpen size={14} />Theo bài</button>
          <button onClick={() => setCach('hs')} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold ${cach === 'hs' ? 'bg-indigo-600 text-white' : 'text-gray-600'}`}><User size={14} />Theo học sinh</button>
        </div>
        <span className="text-xs text-gray-500">Mức: <b>T</b> Hoàn thành tốt · <b>H</b> Hoàn thành · <b>C</b> Chưa hoàn thành — sticker khi duyệt T 3 · H 1 · C 0</span>
      </div>

      <div className="flex flex-wrap items-center gap-2 bg-white border border-gray-200 rounded-xl p-3">
        <select className={SEL} value={grade} onChange={e => setGrade(e.target.value)}>{grades.map(g => <option key={g}>{g}</option>)}</select>
        <select className={SEL} value={lop} onChange={e => { setLop(e.target.value); setHsId('') }}>
          <option value="">Tất cả lớp</option>{lops.map(l => <option key={l}>{l}</option>)}</select>
        {cach === 'bai'
          ? <select className={SEL + ' min-w-[240px]'} value={baiId} onChange={e => setBaiId(e.target.value)}>
              <option value="">— Chọn bài học —</option>{baiHocs.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}</select>
          : <select className={SEL + ' min-w-[220px]'} value={hsId} onChange={e => setHsId(e.target.value)}>
              <option value="">— Chọn học sinh ({hss.length}) —</option>{hss.map(h => <option key={h.id} value={h.id}>{h.ten}{!lop && h.lop ? ` (${h.lop})` : ''}</option>)}</select>}
        <label className="flex items-center gap-1.5 text-sm text-gray-600 ml-auto cursor-pointer">
          <input type="checkbox" checked={chuaDuyet} onChange={e => setChuaDuyet(e.target.checked)} className="w-4 h-4 accent-indigo-600" />Chỉ bài chưa duyệt</label>
      </div>

      {subs && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-gray-600"><b>{hien.length}</b> bài{cach === 'bai' && <> · {chuaNop} em chưa nộp</>}</span>
          {canGoiY.length > 0 && <button onClick={goiYTatCa} disabled={!!ban}
            className="flex items-center gap-1 font-semibold px-3 py-1.5 rounded-lg border border-violet-300 text-violet-700 bg-white hover:bg-violet-50 disabled:opacity-50"><Bot size={14} />AI gợi ý {canGoiY.length} bài chưa có</button>}
          {coGoiY.length > 0 && <button onClick={duyetTheoGoiY} disabled={!!ban}
            className="flex items-center gap-1 font-semibold px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"><Check size={14} />Duyệt {coGoiY.length} bài theo gợi ý</button>}
          {ban && <span className="flex items-center gap-1 text-indigo-700"><Loader2 size={14} className="animate-spin" />{ban}</span>}
        </div>
      )}

      {subs === null
        ? <p className="text-center text-gray-400 py-12">{cach === 'bai' ? 'Chọn bài học để xem các bài học sinh đã nộp.' : 'Chọn học sinh để xem các bài em đã nộp.'}</p>
        : hien.length === 0 ? <p className="text-center text-gray-400 py-12">{chuaDuyet ? 'Không còn bài nào chờ duyệt 🎉' : 'Chưa có bài nộp.'}</p>
          : <div className="space-y-2">{hien.map(s => (
            <DongBai key={s.id} sub={s} taskDef={taskDefCua(s)} onDoi={doi} dangBan={!!ban}
              tieuDe={cach === 'bai' ? (tenHs[s.user_id] || 'Học sinh') : (lessonMap[s.lesson_id]?.title || 'Bài học')} />))}</div>}
    </div>
  )
}
