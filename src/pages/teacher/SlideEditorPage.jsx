// ✏️ SOẠN BÀI GIẢNG WEB cho 1 bài học (chuyển từ app Lớp học số): danh sách slide (thêm / chép / xoá / đổi chỗ)
// · xem trước · biểu mẫu tự sinh theo loại slide / khối (slideModel.js) · AI soạn 2 bước (kịch bản → slide)
// · lấy câu hỏi A–D / Đúng–Sai từ ngân hàng câu hỏi của bài. Lưu vào bảng lesson_slides.
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ArrowLeft, Save, Sparkles, Eye, Play, Code2, Plus, Trash2, Copy, ChevronUp, ChevronDown, Loader2, ListChecks, Upload, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { apiFetch } from '../../lib/apiFetch'
import { uploadImage } from '../../lib/cloudinary'
import { useAuth } from '../../context/AuthContext'
import SlidePlayer from '../../components/slides/SlidePlayer.jsx'
import { TEN_ICON } from '../../components/slides/Icon.jsx'
import { LOAI_SLIDE, LOAI_KHOI, MAU, TEN_MAU, TRUONG_SLIDE, TRUONG_KHOI, SLIDE_MOI, KHOI_MOI, kiemTraBai, lamSachBai, cauHoiThanhSlide } from '../../components/slides/slideModel.js'

const sao = x => JSON.parse(JSON.stringify(x))
const doiCho = (a, i, j) => { if (j < 0 || j >= a.length) return a; const b = a.slice(); [b[i], b[j]] = [b[j], b[i]]; return b }
const INP = 'w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300'
const BTN = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50'
const BTN_NHO = 'inline-flex items-center justify-center gap-1 px-2 py-1 rounded-md text-xs border border-gray-200 bg-white hover:bg-gray-50'

const AI_LOI = { quota_rpd: 'AI đã hết lượt hôm nay, thử lại ngày mai', quota_rpm: 'AI đang bận, chờ 1 phút rồi thử lại', parse_error: 'AI trả về chưa đúng dạng, bấm thử lại', empty: 'AI chưa trả về nội dung, bấm thử lại' }
async function goiAI(body) {
  const r = await apiFetch('/api/teacher-ai', body)
  const d = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(AI_LOI[d.error] || (r.status === 504 ? 'AI chạy quá lâu, bấm thử lại' : 'Lỗi AI: ' + (d.error || r.status)))
  return d
}

function OAnh({ v = {}, onDoi }) {
  const [dang, setDang] = useState(false)
  const tai = async e => {
    const f = e.target.files?.[0]; if (!f) return
    setDang(true)
    try { onDoi({ ...v, url: await uploadImage(f) }) } catch (err) { toast.error(err.message) } finally { setDang(false); e.target.value = '' }
  }
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-2 items-center">
        <input className={INP} value={v.url || ''} placeholder="Dán link ảnh https://… hoặc tải ảnh lên" onChange={e => onDoi({ ...v, url: e.target.value || undefined })} />
        <label className={BTN + ' cursor-pointer whitespace-nowrap'}>{dang ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}Tải ảnh<input type="file" accept="image/*" className="hidden" onChange={tai} /></label>
      </div>
      {v.url && <img src={v.url} alt="" className="max-h-28 self-start rounded border" />}
    </div>
  )
}

/** 1 ô nhập theo kiểu */
function O({ kieu, gt, onDoi }) {
  const dong = a => (a || []).join('\n'), tach = t => t.split('\n')
  switch (kieu) {
    case 'chu': return <input className={INP} value={gt ?? ''} onChange={e => onDoi(e.target.value)} />
    case 'dai': return <textarea className={INP} rows={2} value={gt ?? ''} onChange={e => onDoi(e.target.value)} />
    case 'code': return <textarea className={INP + ' font-mono text-[13px] bg-slate-50'} spellCheck={false} rows={Math.max(4, String(gt || '').split('\n').length + 1)} value={gt ?? ''}
      onChange={e => onDoi(e.target.value)}
      onKeyDown={e => { if (e.key === 'Tab') { e.preventDefault(); const t = e.target, s = t.selectionStart, v = String(gt || ''); onDoi(v.slice(0, s) + '    ' + v.slice(t.selectionEnd)); requestAnimationFrame(() => { t.selectionStart = t.selectionEnd = s + 4 }) } }} />
    case 'ds': return <textarea className={INP} rows={Math.max(2, (gt || []).length + 1)} value={dong(gt)} onChange={e => onDoi(tach(e.target.value))} onBlur={e => onDoi(tach(e.target.value).filter(x => x.trim()))} />
    case 'so': return <input className={INP + ' w-28'} type="number" value={gt ?? ''} onChange={e => onDoi(e.target.value === '' ? undefined : +e.target.value)} />
    case 'co': return <input type="checkbox" className="w-4 h-4" checked={gt !== false && !!gt} onChange={e => onDoi(e.target.checked)} />
    case 'mau': return <select className={INP + ' w-auto'} value={gt || 'ngoc'} onChange={e => onDoi(e.target.value)}>{MAU.map(m => <option key={m} value={m}>{TEN_MAU[m]}</option>)}</select>
    case 'icon': return <select className={INP + ' w-auto'} value={gt || ''} onChange={e => onDoi(e.target.value)}><option value="">(mặc định)</option>{TEN_ICON.map(t => <option key={t}>{t}</option>)}</select>
    case 'chon_dung': return <select className={INP + ' w-auto'} value={gt ?? 0} onChange={e => onDoi(+e.target.value)}>{'ABCD'.split('').map((c, i) => <option key={i} value={i}>{c}</option>)}</select>
    case 'dung_sai': return <select className={INP + ' w-auto'} value={gt ? '1' : '0'} onChange={e => onDoi(e.target.value === '1')}><option value="1">ĐÚNG (O)</option><option value="0">SAI (X)</option></select>
    case 'doi': return <textarea className={INP} rows={Math.max(2, (gt || []).length + 1)} value={(gt || []).map(x => (x.ai || '') + ': ' + (x.chu || '')).join('\n')}
      onChange={e => onDoi(e.target.value.split('\n').map(l => { const i = l.indexOf(':'); return i < 0 ? { ai: '', chu: l } : { ai: l.slice(0, i).trim(), chu: l.slice(i + 1).trim() } }))} />
    case 'the': return (
      <div className="flex flex-col gap-2">{(gt || []).map((x, i) => (
        <div key={i} className="border border-gray-200 rounded-lg p-2 flex flex-col gap-1 bg-gray-50">
          <div className="flex gap-2 items-center"><O kieu="icon" gt={x.icon} onDoi={v => onDoi(gt.map((y, j) => j === i ? { ...y, icon: v } : y))} />
            <input className={INP} placeholder="Tiêu đề thẻ" value={x.tieu || ''} onChange={e => onDoi(gt.map((y, j) => j === i ? { ...y, tieu: e.target.value } : y))} />
            <button className="text-gray-400 hover:text-red-500" title="Xoá thẻ" onClick={() => onDoi(gt.filter((_, j) => j !== i))}><X size={16} /></button></div>
          <textarea className={INP} rows={2} placeholder="Nội dung" value={x.chu || ''} onChange={e => onDoi(gt.map((y, j) => j === i ? { ...y, chu: e.target.value } : y))} />
          <input className={INP} placeholder="Ví dụ (chữ nhạt)" value={x.vd || ''} onChange={e => onDoi(gt.map((y, j) => j === i ? { ...y, vd: e.target.value } : y))} />
        </div>))}
        {(gt || []).length < 3 && <button className={BTN_NHO + ' self-start'} onClick={() => onDoi([...(gt || []), { icon: 'bong_den', tieu: '', chu: '' }])}><Plus size={12} />Thêm thẻ</button>}
      </div>)
    case 'anh': return <OAnh v={gt} onDoi={onDoi} />
    case 'khoi': return <DsKhoi ds={gt || []} onDoi={onDoi} />
    default: return null
  }
}

function BieuMau({ truong, dt, onDoi }) {
  return truong.map(([k, kieu, nhan]) => (
    <div key={k} className={kieu === 'co' ? 'flex items-center gap-2' : 'flex flex-col gap-1'}>
      {kieu === 'co' && <O kieu={kieu} gt={k === 'chay' && dt[k] === undefined ? true : dt[k]} onDoi={v => onDoi({ ...dt, [k]: v })} />}
      <span className="text-xs font-semibold text-gray-600">{nhan}</span>
      {kieu !== 'co' && <O kieu={kieu} gt={dt[k]} onDoi={v => onDoi({ ...dt, [k]: v })} />}
    </div>))
}

function DsKhoi({ ds, onDoi }) {
  const [them, setThem] = useState('cau')
  return (
    <div className="flex flex-col gap-2 pl-2 border-l-4 border-dashed border-indigo-100">
      {ds.map((k, i) => (
        <div key={i} className="border border-gray-200 rounded-lg p-2.5 flex flex-col gap-1.5 bg-white">
          <div className="flex flex-wrap items-center gap-2">
            <b className="text-sm text-indigo-700">{LOAI_KHOI[k.loai] || k.loai}</b>
            {k.loai !== 'hai_cot' && <label className="text-xs flex items-center gap-1"><input type="checkbox" checked={!!k.an} onChange={e => onDoi(ds.map((x, j) => j === i ? { ...x, an: e.target.checked } : x))} />bấm mới hiện</label>}
            {k.an && ['the', 'buoc', 'danh_sach'].includes(k.loai) && <label className="text-xs flex items-center gap-1"><input type="checkbox" checked={!!k.tung} onChange={e => onDoi(ds.map((x, j) => j === i ? { ...x, tung: e.target.checked } : x))} />hiện từng mục</label>}
            <span className="ml-auto flex gap-1">
              <button className={BTN_NHO} title="Lên" onClick={() => onDoi(doiCho(ds, i, i - 1))}><ChevronUp size={12} /></button>
              <button className={BTN_NHO} title="Xuống" onClick={() => onDoi(doiCho(ds, i, i + 1))}><ChevronDown size={12} /></button>
              <button className={BTN_NHO + ' hover:text-red-600'} title="Xoá khối" onClick={() => onDoi(ds.filter((_, j) => j !== i))}><Trash2 size={12} /></button>
            </span>
          </div>
          <BieuMau truong={TRUONG_KHOI[k.loai] || []} dt={k} onDoi={v => onDoi(ds.map((x, j) => j === i ? v : x))} />
        </div>))}
      <div className="flex gap-2 items-center">
        <select className={INP + ' w-auto'} value={them} onChange={e => setThem(e.target.value)}>{Object.entries(LOAI_KHOI).map(([k, t]) => <option key={k} value={k}>{t}</option>)}</select>
        <button className={BTN_NHO} onClick={() => onDoi([...ds, KHOI_MOI[them]()])}><Plus size={12} />Thêm khối</button>
      </div>
    </div>
  )
}

/** AI soạn 2 bước: ① kịch bản chữ (giáo viên sửa) → ② dựng slide */
function AiSoan({ lesson, bai, setBai, onMoi }) {
  const [yc, setYc] = useState(''), [dang, setDang] = useState('')
  const chay = async (ten, fn) => { setDang(ten); try { await fn() } catch (e) { toast.error(e.message) } finally { setDang('') } }
  const vietKichBan = () => chay('kb', async () => {
    if (bai.kich_ban && !confirm('Viết lại kịch bản? Kịch bản hiện tại sẽ bị thay.')) return
    let tasks = []
    try { const a = JSON.parse(lesson.practice_instructions || '[]'); tasks = Array.isArray(a) ? a : [] } catch { tasks = lesson.practice_instructions ? [{ instructions: lesson.practice_instructions }] : [] }
    const thucHanh = tasks.filter(t => !t.optional && String(t.instructions || '').trim()).map((t, i) => `Bài thực hành ${i + 1}: ${String(t.instructions).replace(/\[test[^\n]*\]/gi, '').trim()}`).join('\n\n')
    const sourceText = [lesson.description, lesson.ai_context, lesson.ai_tutor_notes, thucHanh].filter(s => String(s || '').trim()).join('\n\n')
    const { data: qs } = lesson.question_ids?.length
      ? await supabase.from('questions').select('question, type, options, correct_answer').in('id', lesson.question_ids)
      : { data: [] }
    const questions = (qs || []).map(q => q.question + (q.options?.length ? ' | ' + q.options.map(o => o.key + '. ' + o.text).join(' ') : '') + ' (đáp án: ' + q.correct_answer + ')')
    const r = await goiAI({ action: 'slide_script', lessonTitle: lesson.title, grade: lesson.grade, topic: lesson.topic, sourceText, questions, extra: yc })
    setBai({ ...bai, kich_ban: r.text }); toast.success('AI đã viết kịch bản – thầy cô đọc, sửa rồi bấm bước 2')
  })
  const dungSlide = () => chay('sl', async () => {
    if (!String(bai.kich_ban || '').trim()) { toast.error('Chưa có kịch bản'); return }
    if ((bai.slides || []).length > 1 && !confirm('Dựng lại toàn bộ slide từ kịch bản? Các slide hiện tại sẽ bị thay.')) return
    const r = await goiAI({ action: 'slide_build', kichBan: bai.kich_ban })
    const ds = lamSachBai(r.slides)
    if (!ds.length) throw new Error('AI chưa trả về slide hợp lệ, bấm thử lại')
    if (ds[0].loai !== 'bia') ds.unshift({ loai: 'bia', nhan: lesson.grade || '', tieu: String(lesson.title || '').toUpperCase(), phu: '', khau_hieu: '' })
    setBai({ ...bai, slides: ds }); onMoi()
    const loi = kiemTraBai(ds)
    toast.success(loi.length ? `AI đã dựng ${ds.length} slide, còn lỗi: ${loi.slice(0, 2).join(' · ')}` : `AI đã dựng ${ds.length} slide – thầy cô xem và sửa từng slide`)
  })
  const Nut = ({ k, onClick, children, chinh }) => (
    <button className={chinh ? 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50' : BTN} disabled={!!dang} onClick={onClick}>
      {dang === k ? <><Loader2 size={14} className="animate-spin" />AI đang làm… (15–50 giây)</> : children}
    </button>)
  return (
    <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2"><Sparkles size={18} className="text-violet-600" /><h3 className="font-semibold text-violet-900">AI soạn bài giảng</h3>
        <span className="text-xs text-violet-700">AI dựa trên lý thuyết, bài thực hành và câu hỏi đã có của bài “{lesson.title}”</span></div>
      <section className="bg-white rounded-lg p-3 flex flex-col gap-2">
        <b className="text-sm text-violet-800">① Kịch bản chữ</b>
        <input className={INP} value={yc} onChange={e => setYc(e.target.value)} placeholder="Yêu cầu thêm cho AI (không bắt buộc), vd: lớp 3 cần chậm hơn, thêm ví dụ về trò chơi…" />
        <div><Nut k="kb" onClick={vietKichBan} chinh={!bai.kich_ban}><Sparkles size={14} />{bai.kich_ban ? 'AI viết lại kịch bản' : 'AI viết kịch bản'}</Nut></div>
        <textarea className={INP + ' font-mono text-[13px]'} rows={bai.kich_ban ? 14 : 3} value={bai.kich_ban || ''} onChange={e => setBai({ ...bai, kich_ban: e.target.value })} placeholder="Kịch bản hiện ở đây – thầy cô sửa trực tiếp trước khi sang bước 2." />
      </section>
      <section className="bg-white rounded-lg p-3 flex flex-col gap-2">
        <b className="text-sm text-violet-800">② Dựng slide từ kịch bản</b>
        <p className="text-xs text-gray-500">AI chuyển kịch bản thành slide (câu hỏi A–D, O/X, code Python chạy được…). Xong thầy cô xem thử, sửa từng slide ở dưới rồi bấm Lưu.</p>
        <div><Nut k="sl" onClick={dungSlide} chinh={!!bai.kich_ban && (bai.slides || []).length <= 1}><Sparkles size={14} />AI dựng slide</Nut></div>
      </section>
    </div>
  )
}

/** chọn câu hỏi A–D / Đúng–Sai trong ngân hàng của bài → slide */
function ChonCauHoi({ lesson, onChon, onDong }) {
  const [qs, setQs] = useState(null), [chon, setChon] = useState(new Set())
  useEffect(() => {
    if (!lesson.question_ids?.length) { setQs([]); return }
    supabase.from('questions').select('id, question, type, options, correct_answer, hint').in('id', lesson.question_ids)
      .then(({ data }) => setQs((data || []).filter(q => q.type === 'multiple_choice' || q.type === 'true_false')))
  }, [lesson.question_ids])
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onDong}>
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b flex items-center gap-2"><ListChecks size={18} className="text-indigo-600" /><h3 className="font-semibold">Thêm câu hỏi từ ngân hàng của bài</h3>
          <button className="ml-auto text-gray-400 hover:text-gray-600" onClick={onDong}><X size={18} /></button></div>
        <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-2">
          {qs === null && <p className="text-sm text-gray-500">Đang tải…</p>}
          {qs?.length === 0 && <p className="text-sm text-gray-500">Bài này chưa có câu hỏi trắc nghiệm A–D hoặc Đúng/Sai.</p>}
          {qs?.map(q => (
            <label key={q.id} className={'flex gap-2 items-start p-2 rounded-lg border cursor-pointer ' + (chon.has(q.id) ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200')}>
              <input type="checkbox" className="mt-1" checked={chon.has(q.id)} onChange={() => setChon(s => { const n = new Set(s); n.has(q.id) ? n.delete(q.id) : n.add(q.id); return n })} />
              <span className="text-sm"><span className="text-xs text-gray-400 mr-1">{q.type === 'true_false' ? 'Đ/S' : 'A–D'}</span>{q.question.slice(0, 220)}</span>
            </label>))}
        </div>
        <div className="p-4 border-t flex justify-end gap-2">
          <button className={BTN} onClick={onDong}>Huỷ</button>
          <button className="px-3 py-1.5 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50" disabled={!chon.size}
            onClick={() => onChon(qs.filter(q => chon.has(q.id)).map(cauHoiThanhSlide).filter(Boolean))}>Thêm {chon.size || ''} slide</button>
        </div>
      </div>
    </div>
  )
}

export default function SlideEditorPage() {
  const { id } = useParams(), navigate = useNavigate(), { user } = useAuth()
  const [lesson, setLesson] = useState(null), [bai, setBaiRaw] = useState(null)
  const [chon, setChon] = useState(0), [doi, setDoi] = useState(false), [ai, setAi] = useState(false), [luu, setLuu] = useState(false)
  const [chieu, setChieu] = useState(false), [json, setJson] = useState(null), [loaiMoi, setLoaiMoi] = useState('noi_dung'), [chonCau, setChonCau] = useState(false)

  useEffect(() => {
    (async () => {
      const [{ data: l, error }, { data: s }] = await Promise.all([
        supabase.from('lessons').select('id, title, grade, topic, description, ai_context, ai_tutor_notes, practice_instructions, question_ids').eq('id', id).single(),
        supabase.from('lesson_slides').select('slides, kich_ban').eq('lesson_id', id).maybeSingle(),
      ])
      if (error || !l) { toast.error('Không tìm thấy bài học'); return }
      setLesson(l)
      const slides = s?.slides?.length ? s.slides : [{ loai: 'bia', nhan: l.grade || '', tieu: String(l.title || '').toUpperCase(), phu: '', khau_hieu: '' }]
      setBaiRaw({ slides, kich_ban: s?.kich_ban || '' })
      setAi(!s?.slides?.length)
    })()
  }, [id])
  useEffect(() => { const f = e => { if (doi) { e.preventDefault(); e.returnValue = '' } }; addEventListener('beforeunload', f); return () => removeEventListener('beforeunload', f) }, [doi])

  if (!bai || !lesson) return <div className="p-8 text-gray-500 flex items-center gap-2"><Loader2 className="animate-spin" size={18} />Đang mở bài giảng…</div>
  const setBai = b => { setBaiRaw(b); setDoi(true) }
  const ds = bai.slides || [], s = ds[Math.min(chon, ds.length - 1)]
  const datDs = (d, c = chon) => { setBai({ ...bai, slides: d }); setChon(Math.max(0, Math.min(c, d.length - 1))) }
  const loi = kiemTraBai(ds)

  async function luuBai() {
    setLuu(true)
    const { error } = await supabase.from('lesson_slides').upsert({ lesson_id: id, slides: ds, kich_ban: bai.kich_ban || null, updated_at: new Date().toISOString(), updated_by: user?.id })
    setLuu(false)
    if (error) { toast.error('Lưu thất bại: ' + error.message); return false }
    setDoi(false); toast.success('Đã lưu bài giảng'); return true
  }

  if (chieu) return <div className="fixed inset-0 z-50 bg-black"><SlidePlayer ds={ds} batDau={chon} /><button className="absolute top-2 right-2 z-10 px-3 py-1 rounded-lg bg-white/90 text-sm" onClick={() => setChieu(false)}>✕ Thoát xem thử</button></div>

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white rounded-xl border border-gray-200 p-3 flex flex-wrap items-center gap-2">
        <button className={BTN} onClick={() => { if (!doi || confirm('Chưa lưu thay đổi. Vẫn quay lại?')) navigate('/teacher/lessons') }}><ArrowLeft size={14} />Bài học</button>
        <div className="flex-1 min-w-48"><div className="text-xs text-gray-400">Bài giảng web · {lesson.grade}</div><div className="font-semibold text-gray-800 truncate">{lesson.title}</div></div>
        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50" disabled={luu || !doi} onClick={luuBai}>
          {luu ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}{luu ? 'Đang lưu…' : doi ? 'Lưu' : 'Đã lưu'}</button>
        <button className={BTN + (ai ? ' !bg-violet-100 !border-violet-300' : '')} onClick={() => setAi(!ai)}><Sparkles size={14} className="text-violet-600" />AI soạn</button>
        <button className={BTN} onClick={() => setChonCau(true)}><ListChecks size={14} />Câu hỏi từ ngân hàng</button>
        <button className={BTN} onClick={() => setChieu(true)}><Eye size={14} />Xem thử</button>
        <button className={BTN} onClick={async () => { if (doi && !(await luuBai())) return; navigate(`/teacher/lessons/${id}/teach`) }}><Play size={14} className="text-green-600" />Dạy</button>
        <button className={BTN} onClick={() => setJson(json == null ? JSON.stringify(ds, null, 1) : null)}><Code2 size={14} />{json == null ? 'Sửa dạng mã' : 'Về biểu mẫu'}</button>
        {loi.length > 0 && <p className="w-full text-xs text-red-600">⚠ {loi.slice(0, 3).join(' · ')}</p>}
      </div>

      {ai && <AiSoan lesson={lesson} bai={bai} setBai={setBai} onMoi={() => setChon(0)} />}
      {chonCau && <ChonCauHoi lesson={lesson} onDong={() => setChonCau(false)} onChon={moi => { setChonCau(false); if (!moi.length) return; datDs([...ds.slice(0, chon + 1), ...moi, ...ds.slice(chon + 1)], chon + 1); toast.success(`Đã thêm ${moi.length} slide câu hỏi`) }} />}

      {json != null ? (
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-2">
          <p className="text-xs text-gray-500">Toàn bộ slide dạng mã (JSON) – dán bài soạn sẵn vào đây rồi bấm Áp dụng.</p>
          <textarea className={INP + ' font-mono text-xs'} rows={24} value={json} onChange={e => setJson(e.target.value)} />
          <button className="self-start px-3 py-1.5 rounded-lg text-sm font-medium bg-indigo-600 text-white" onClick={() => { try { const d = JSON.parse(json); if (!Array.isArray(d)) throw new Error('cần một mảng slide'); datDs(lamSachBai(d), 0); setJson(null) } catch (e) { toast.error('Mã chưa đúng: ' + e.message) } }}>Áp dụng</button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-4 items-start">
          <section className="bg-white rounded-xl border border-gray-200 p-3 flex-[1_1_220px] max-w-[270px] flex flex-col gap-1.5">
            <h3 className="font-semibold text-sm text-gray-700">Các slide ({ds.length})</h3>
            <div className="flex flex-col gap-1 max-h-[60vh] overflow-y-auto">
              {ds.map((x, i) => (
                <div key={i} onClick={() => setChon(i)} className={'px-2 py-1.5 rounded-lg cursor-pointer text-sm flex items-center gap-2 border ' + (i === chon ? 'bg-amber-50 border-amber-300' : 'border-transparent hover:bg-gray-50')}>
                  <b className="w-6 text-indigo-600">{i + 1}</b>
                  <span className="flex-1 min-w-0"><span className="block text-[11px] text-gray-400">{LOAI_SLIDE[x.loai]}</span><span className="block truncate font-medium">{x.tieu || x.cau || '(chưa có tiêu đề)'}</span></span>
                </div>))}
            </div>
            {s && <div className="flex flex-wrap gap-1 mt-1">
              <button className={BTN_NHO} title="Lên" onClick={() => datDs(doiCho(ds, chon, chon - 1), chon - 1)}><ChevronUp size={12} /></button>
              <button className={BTN_NHO} title="Xuống" onClick={() => datDs(doiCho(ds, chon, chon + 1), chon + 1)}><ChevronDown size={12} /></button>
              <button className={BTN_NHO} title="Nhân đôi slide" onClick={() => datDs([...ds.slice(0, chon + 1), sao(s), ...ds.slice(chon + 1)], chon + 1)}><Copy size={12} /></button>
              <button className={BTN_NHO + ' hover:text-red-600'} title="Xoá slide" onClick={() => { if (ds.length > 1 && confirm('Xoá slide ' + (chon + 1) + '?')) datDs(ds.filter((_, j) => j !== chon)) }}><Trash2 size={12} /></button>
            </div>}
            <div className="flex gap-1 mt-2">
              <select className={INP + ' text-xs'} value={loaiMoi} onChange={e => setLoaiMoi(e.target.value)}>{Object.entries(LOAI_SLIDE).map(([k, t]) => <option key={k} value={k}>{t}</option>)}</select>
              <button className={BTN_NHO + ' whitespace-nowrap'} onClick={() => datDs([...ds.slice(0, chon + 1), SLIDE_MOI[loaiMoi](), ...ds.slice(chon + 1)], chon + 1)}><Plus size={12} />Thêm</button>
            </div>
          </section>

          <section className="flex-[999_1_520px] min-w-0 flex flex-col gap-3">
            <div className="relative w-full rounded-lg overflow-hidden shadow" style={{ aspectRatio: '16 / 9' }}>
              {s && <SlidePlayer key={chon + '|' + ds.length} ds={ds} batDau={chon} phimTat={false} dieuKhien={false} hienHet chiXem />}
            </div>
            {s && <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-3">
              <h3 className="font-semibold text-gray-800">Slide {chon + 1}: {LOAI_SLIDE[s.loai]}</h3>
              <BieuMau truong={TRUONG_SLIDE[s.loai] || []} dt={s} onDoi={v => datDs(ds.map((x, j) => j === chon ? v : x))} />
              <div className="flex flex-col gap-1"><span className="text-xs font-semibold text-gray-600">Ghi chú cho thầy cô (không chiếu)</span>
                <textarea className={INP} rows={2} value={s.ghi_chu || ''} onChange={e => datDs(ds.map((x, j) => j === chon ? { ...x, ghi_chu: e.target.value } : x))} /></div>
            </div>}
          </section>
        </div>
      )}
    </div>
  )
}
