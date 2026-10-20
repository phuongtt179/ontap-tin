// 🎬 CHẾ ĐỘ DẠY – chiếu bài giảng web toàn màn hình + thanh công cụ nổi (ý tưởng từ app Lớp học số):
//   ✏️ Vẽ lên slide (tự xoá khi sang slide khác) · ⏱ Đồng hồ đếm ngược · 🎯 Gọi tên ngẫu nhiên · 👥 Chia nhóm
//   · ⭐ Trao sticker ngay trên lớp (cộng vào sticker của học sinh) · 📝 Ghi chú của slide (chỉ giáo viên thấy).
// Danh sách học sinh lấy theo lớp đã ghi danh (student_enrollments) của khoá bài học.
import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { adjustStickerCount } from '../../utils/stickerAward'
import SlidePlayer from '../../components/slides/SlidePlayer.jsx'
import { beep, ting, fanfare, ring3, moAmThanh } from '../../components/slides/sound.js'

const MAU_BUT = ['#ef4444', '#2563eb', '#16a34a', '#facc15', '#111827', '#ffffff']
const MAU_NHOM = ['#2563eb', '#16a34a', '#ea580c', '#9333ea', '#db2777', '#0891b2', '#ca8a04', '#dc2626']
const lsGet = k => { try { return JSON.parse(localStorage.getItem(k) || 'null') } catch { return null } }
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* trình duyệt chặn */ } }
const tenNgan = s => String(s || '').trim().split(/\s+/).slice(-2).join(' ')
const tron = a => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[b[i], b[j]] = [b[j], b[i]] } return b }
const homNay = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' })

/** lớp vẽ trong suốt phủ lên slide */
function LopVe({ bat, mau, nonce }) {
  const ref = useRef(null), net = useRef([]), dang = useRef(null)
  const ve = () => {
    const c = ref.current; if (!c) return
    const d = window.devicePixelRatio || 1, w = Math.round(innerWidth * d), h = Math.round(innerHeight * d)
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h }
    const x = c.getContext('2d'); x.setTransform(d, 0, 0, d, 0, 0); x.clearRect(0, 0, innerWidth, innerHeight)
    for (const s of [...net.current, dang.current].filter(Boolean)) {
      x.strokeStyle = s.c; x.lineWidth = 5; x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath()
      s.p.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); if (s.p.length === 1) x.lineTo(s.p[0][0] + .1, s.p[0][1]); x.stroke()
    }
  }
  useEffect(() => { net.current = []; dang.current = null; ve() }, [nonce])
  useEffect(() => { addEventListener('resize', ve); return () => removeEventListener('resize', ve) })
  return <canvas ref={ref} className="fixed inset-0 z-20" style={{ pointerEvents: bat ? 'auto' : 'none', cursor: bat ? 'crosshair' : 'default', touchAction: 'none', width: '100vw', height: '100vh' }}
    onPointerDown={e => { if (!bat) return; e.currentTarget.setPointerCapture(e.pointerId); dang.current = { c: mau, p: [[e.clientX, e.clientY]] }; ve() }}
    onPointerMove={e => { if (dang.current) { dang.current.p.push([e.clientX, e.clientY]); ve() } }}
    onPointerUp={() => { if (dang.current) { net.current.push(dang.current); dang.current = null; ve() } }} />
}

function DongHoNoi({ onDong }) {
  const [giay, setGiay] = useState(120), [het, setHet] = useState(null), [now, setNow] = useState(0)
  useEffect(() => { if (!het) return; const id = setInterval(() => setNow(Date.now()), 250); return () => clearInterval(id) }, [het])
  const con = het ? Math.max(0, Math.ceil((het - now) / 1000)) : giay, xong = het && con <= 0
  useEffect(() => { if (xong) ring3() }, [xong])
  const mm = s => String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0')
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-30 bg-white/95 rounded-2xl shadow-xl px-5 py-3 flex items-center gap-3">
      <span className={'text-4xl font-black tabular-nums ' + (xong ? 'text-red-600 animate-pulse' : 'text-slate-800')}>{xong ? 'HẾT GIỜ' : mm(con)}</span>
      {!het && [60, 120, 180, 300].map(g => <button key={g} onClick={() => setGiay(g)} className={'px-2 py-1 rounded text-sm ' + (giay === g ? 'bg-indigo-600 text-white' : 'bg-gray-100')}>{g / 60}′</button>)}
      <button className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm font-semibold" onClick={() => { moAmThanh(); beep(880, .12); setNow(Date.now()); setHet(Date.now() + giay * 1000) }}>{het ? 'Chạy lại' : 'Bắt đầu'}</button>
      <button className="text-gray-400 hover:text-gray-700 text-xl" onClick={onDong}>×</button>
    </div>
  )
}

function Bang({ tieu, onDong, children, rong = 'max-w-xl' }) {
  return (
    <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4" onClick={onDong}>
      <div className={'bg-white rounded-2xl shadow-2xl w-full max-h-[85vh] overflow-y-auto p-5 ' + rong} onClick={e => e.stopPropagation()}>
        <div className="flex items-center mb-3"><h3 className="text-lg font-bold text-slate-800">{tieu}</h3><button className="ml-auto text-gray-400 hover:text-gray-700 text-2xl leading-none" onClick={onDong}>×</button></div>
        {children}
      </div>
    </div>
  )
}

function GoiTen({ hs, lopKey, onDong, onTrao }) {
  const key = `goiTen:${lopKey}:${homNay()}`
  const [daGoi, setDaGoi] = useState(() => lsGet(key) || []), [ten, setTen] = useState(null), [quay, setQuay] = useState(false)
  const conLai = hs.filter(h => !daGoi.includes(h.id))
  const quayTen = () => {
    const nguon = conLai.length ? conLai : hs; if (!nguon.length) return
    moAmThanh(); setQuay(true); let n = 0
    const chon = nguon[Math.floor(Math.random() * nguon.length)]
    const id = setInterval(() => {
      setTen(nguon[Math.floor(Math.random() * nguon.length)]); beep(600 + Math.random() * 400, .05, .15); n++
      if (n > 18) { clearInterval(id); setTen(chon); setQuay(false); ting(); const moi = [...(conLai.length ? daGoi : []), chon.id]; setDaGoi(moi); lsSet(key, moi) }
    }, 70)
  }
  return (
    <Bang tieu="🎯 Gọi tên ngẫu nhiên" onDong={onDong}>
      <div className="text-center py-6">
        <div className={'text-5xl font-black ' + (quay ? 'text-slate-400' : 'text-indigo-700')}>{ten ? ten.full_name : '?'}</div>
        <p className="text-sm text-gray-500 mt-3">Hôm nay đã gọi {daGoi.length}/{hs.length} em · không gọi lại em đã gọi cho đến khi hết lượt</p>
      </div>
      <div className="flex justify-center gap-2">
        <button className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold disabled:opacity-50" disabled={quay || !hs.length} onClick={quayTen}>Quay tên</button>
        {ten && !quay && <button className="px-4 py-2.5 rounded-xl bg-amber-400 text-amber-950 font-bold" onClick={() => onTrao([ten])}>⭐ Trao sticker cho {tenNgan(ten.full_name)}</button>}
        <button className="px-3 py-2.5 rounded-xl bg-gray-100 text-sm" onClick={() => { setDaGoi([]); lsSet(key, []) }}>Bắt đầu lượt mới</button>
      </div>
    </Bang>
  )
}

function ChiaNhom({ hs, onDong }) {
  const [so, setSo] = useState(4), [nhom, setNhom] = useState(null)
  const chia = () => { const t = tron(hs), g = Array.from({ length: so }, () => []); t.forEach((h, i) => g[i % so].push(h)); setNhom(g); beep(880, .1) }
  return (
    <Bang tieu="👥 Chia nhóm ngẫu nhiên" onDong={onDong} rong="max-w-4xl">
      <div className="flex items-center gap-2 mb-4">
        Số nhóm {[2, 3, 4, 5, 6, 8].map(n => <button key={n} onClick={() => setSo(n)} className={'w-9 h-9 rounded-lg font-bold ' + (so === n ? 'bg-indigo-600 text-white' : 'bg-gray-100')}>{n}</button>)}
        <button className="ml-2 px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold disabled:opacity-50" disabled={!hs.length} onClick={chia}>Chia</button>
      </div>
      {nhom && <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(4, so)}, minmax(0,1fr))` }}>
        {nhom.map((g, i) => <div key={i} className="rounded-xl p-3 text-white" style={{ background: MAU_NHOM[i % MAU_NHOM.length] }}>
          <div className="font-black text-lg mb-1">Nhóm {i + 1}</div>{g.map(h => <div key={h.id} className="text-sm font-semibold">{h.full_name}</div>)}</div>)}
      </div>}
    </Bang>
  )
}

function TraoSticker({ hs, chonSan, onDong }) {
  const [chon, setChon] = useState(() => new Set((chonSan || []).map(h => h.id))), [so, setSo] = useState(1), [dang, setDang] = useState(false), [loc, setLoc] = useState('')
  const ds = hs.filter(h => !loc || h.full_name.toLowerCase().includes(loc.toLowerCase()))
  const trao = async () => {
    setDang(true); let ok = 0
    for (const id of chon) { const { error } = await adjustStickerCount(id, so, { affectsTotal: true }); if (!error) ok++ }
    setDang(false)
    if (ok) { fanfare(); toast.success(`Đã trao ${so} sticker cho ${ok} em 🎉`) } else toast.error('Chưa trao được sticker')
    onDong()
  }
  return (
    <Bang tieu="⭐ Trao sticker" onDong={onDong} rong="max-w-3xl">
      <div className="flex items-center gap-2 mb-3">
        <input className="flex-1 border rounded-lg px-3 py-1.5 text-sm" placeholder="Tìm tên…" value={loc} onChange={e => setLoc(e.target.value)} />
        Số sticker {[1, 2, 3].map(n => <button key={n} onClick={() => setSo(n)} className={'w-9 h-9 rounded-lg font-bold ' + (so === n ? 'bg-amber-400 text-amber-950' : 'bg-gray-100')}>{n}</button>)}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mb-4">
        {ds.map(h => <label key={h.id} className={'flex items-center gap-2 px-2 py-1.5 rounded-lg border text-sm cursor-pointer ' + (chon.has(h.id) ? 'bg-amber-50 border-amber-400' : 'border-gray-200')}>
          <input type="checkbox" checked={chon.has(h.id)} onChange={() => setChon(s => { const n = new Set(s); n.has(h.id) ? n.delete(h.id) : n.add(h.id); return n })} />{h.full_name}</label>)}
      </div>
      <div className="flex justify-end gap-2">
        <button className="px-4 py-2 rounded-xl bg-gray-100" onClick={onDong}>Huỷ</button>
        <button className="px-5 py-2 rounded-xl bg-amber-400 text-amber-950 font-bold disabled:opacity-50" disabled={!chon.size || dang} onClick={trao}>{dang ? 'Đang trao…' : `Trao ${so} sticker cho ${chon.size} em`}</button>
      </div>
    </Bang>
  )
}

export default function TeachPage() {
  const { id } = useParams(), navigate = useNavigate()
  const [lesson, setLesson] = useState(null), [ds, setDs] = useState(null), [iSlide, setISlide] = useState(0)
  const [lops, setLops] = useState([]), [lop, setLop] = useState(() => lsGet('dayLop') || ''), [hs, setHs] = useState([])
  const [ve, setVe] = useState(false), [mauBut, setMauBut] = useState(MAU_BUT[0]), [nonce, setNonce] = useState(0)
  const [bang, setBang] = useState(''), [dongHo, setDongHo] = useState(false), [ghiChu, setGhiChu] = useState(false), [traoCho, setTraoCho] = useState(null), [an, setAn] = useState(false)

  useEffect(() => {
    (async () => {
      const [{ data: l }, { data: s }] = await Promise.all([
        supabase.from('lessons').select('id, title, grade').eq('id', id).single(),
        supabase.from('lesson_slides').select('slides').eq('lesson_id', id).maybeSingle(),
      ])
      if (!l) { toast.error('Không tìm thấy bài học'); return }
      setLesson(l); setDs(s?.slides || [])
      const { data: c } = await supabase.from('classes').select('name').eq('grade', l.grade).order('name')
      setLops((c || []).map(x => x.name))
    })()
  }, [id])
  useEffect(() => {
    if (!lesson) return
    lsSet('dayLop', lop)
    let q = supabase.from('student_enrollments').select('user_id, class_name, profiles!inner(id, full_name, is_active)').eq('grade', lesson.grade).eq('is_approved', true)
    if (lop) q = q.eq('class_name', lop)
    q.then(({ data }) => setHs((data || []).filter(e => e.profiles.is_active !== false).map(e => ({ id: e.user_id, full_name: e.profiles.full_name || '(chưa có tên)' })).sort((a, b) => tenNgan(a.full_name).localeCompare(tenNgan(b.full_name), 'vi'))))
  }, [lesson, lop])

  const toanManHinh = () => { if (document.fullscreenElement) document.exitFullscreen?.(); else document.documentElement.requestFullscreen?.().catch(() => {}) }
  const slide = ds?.[iSlide]
  const nut = useMemo(() => 'w-11 h-11 rounded-xl flex items-center justify-center text-xl hover:bg-white/20 transition', [])

  if (!ds || !lesson) return <div className="fixed inset-0 bg-slate-900 text-white flex items-center justify-center">Đang mở bài giảng…</div>
  if (!ds.length) return (
    <div className="fixed inset-0 bg-slate-900 text-white flex flex-col items-center justify-center gap-4">
      <p>Bài “{lesson.title}” chưa có bài giảng web.</p>
      <div className="flex gap-2"><button className="px-4 py-2 rounded-lg bg-indigo-600" onClick={() => navigate(`/teacher/lessons/${id}/slides`)}>Soạn bài giảng</button>
        <button className="px-4 py-2 rounded-lg bg-white/10" onClick={() => navigate('/teacher/lessons')}>Quay lại</button></div>
    </div>)

  return (
    <div className="fixed inset-0 bg-black">
      <SlidePlayer ds={ds} onDoi={n => { setISlide(n); setNonce(x => x + 1) }} />
      <LopVe bat={ve} mau={mauBut} nonce={nonce} />
      {dongHo && <DongHoNoi onDong={() => setDongHo(false)} />}

      {an
        ? <button className="fixed bottom-3 left-3 z-30 w-9 h-9 rounded-full bg-slate-800/70 text-white text-sm" title="Hiện thanh công cụ" onClick={() => setAn(false)}>☰</button>
        : <div className="fixed bottom-3 left-3 z-30 flex items-center gap-1 bg-slate-800/85 text-white rounded-2xl px-2 py-1.5 shadow-xl backdrop-blur">
          <button className={nut + (ve ? ' bg-white/25' : '')} title="Vẽ lên slide" onClick={() => setVe(!ve)}>✏️</button>
          {ve && <span className="flex gap-1 px-1">{MAU_BUT.map(c => <button key={c} onClick={() => setMauBut(c)} className={'w-6 h-6 rounded-full border-2 ' + (mauBut === c ? 'border-white scale-110' : 'border-white/30')} style={{ background: c }} />)}
            <button className="px-2 text-xs rounded bg-white/15" onClick={() => setNonce(x => x + 1)}>Xoá nét</button></span>}
          <button className={nut} title="Đồng hồ" onClick={() => setDongHo(!dongHo)}>⏱</button>
          <button className={nut} title="Gọi tên ngẫu nhiên" onClick={() => setBang('goi')}>🎯</button>
          <button className={nut} title="Chia nhóm" onClick={() => setBang('nhom')}>👥</button>
          <button className={nut} title="Trao sticker" onClick={() => { setTraoCho(null); setBang('trao') }}>⭐</button>
          <button className={nut + (ghiChu ? ' bg-white/25' : '')} title="Ghi chú của slide (chỉ thầy cô thấy)" onClick={() => setGhiChu(!ghiChu)}>📝</button>
          <select className="bg-white/10 rounded-lg text-sm px-2 py-1.5 max-w-36" value={lop} onChange={e => setLop(e.target.value)} title="Lớp đang dạy">
            <option value="" className="text-black">Cả khoá ({lesson.grade})</option>{lops.map(l => <option key={l} value={l} className="text-black">{l}</option>)}
          </select>
          <span className="text-xs text-white/60 px-1">{hs.length} em</span>
          <button className={nut} title="Toàn màn hình" onClick={toanManHinh}>⛶</button>
          <button className={nut} title="Ẩn thanh công cụ" onClick={() => setAn(true)}>▾</button>
          <button className={nut} title="Thoát" onClick={() => { if (document.fullscreenElement) document.exitFullscreen?.(); navigate('/teacher/lessons') }}>✕</button>
        </div>}

      {ghiChu && <div className="fixed bottom-20 left-3 z-30 max-w-md bg-amber-50 text-amber-950 rounded-xl shadow-xl p-3 text-sm whitespace-pre-wrap">
        <b>Ghi chú slide {iSlide + 1}:</b> {slide?.ghi_chu || '(không có)'}</div>}

      {bang === 'goi' && <GoiTen hs={hs} lopKey={lesson.grade + '|' + (lop || '*')} onDong={() => setBang('')} onTrao={c => { setTraoCho(c); setBang('trao') }} />}
      {bang === 'nhom' && <ChiaNhom hs={hs} onDong={() => setBang('')} />}
      {bang === 'trao' && <TraoSticker hs={hs} chonSan={traoCho} onDong={() => setBang('')} />}
    </div>
  )
}
