// 📽 TRÌNH CHIẾU BÀI GIẢNG WEB (phong cách kraft, chuyển từ app Lớp học số). Dữ liệu: mảng slide – xem slideModel.js.
// Bấm "tiếp" (→ / Space / PageDown / bút trình chiếu / bấm vào slide): còn mục ẩn thì hiện, hết thì sang slide sau. ← lùi lại.
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import Icon from './Icon.jsx'
import { demBuoc, demKhoi, tachChu, tachCode, DONG_TAC } from './slideModel.js'
import { ring3, beep, moAmThanh } from './sound.js'
import { runPython } from '../../utils/gradePrep.js'
import './slides.css'

const MAU_AI = ['thep', 'ngoc', 'dat', 'mutat']
const T = ({ t }) => tachChu(t).map((p, i) => p.b ? <b key={i}>{p.t}</b> : p.h ? <span key={i} className="vang">{p.t}</span> : p.c ? <code key={i} className="ma">{p.t}</code> : <span key={i}>{p.t}</span>)
const m = c => 'm-' + (c || 'ngoc')

export function MayTinh({ className = 'may', kinhLup = true }) {
  return (
    <svg className={className} viewBox="0 0 200 200" style={{ filter: 'drop-shadow(0 8px 10px rgba(60,40,10,.35))' }} aria-label="Bạn Máy Tính">
      <g stroke="#fff" strokeWidth="10" strokeLinejoin="round" paintOrder="stroke"><rect x="20" y="22" width="160" height="118" rx="18" fill="#457b9d" /><rect x="85" y="140" width="30" height="24" fill="#264653" /><rect x="55" y="162" width="90" height="16" rx="8" fill="#264653" /></g>
      <rect x="34" y="36" width="132" height="90" rx="10" fill="#fdf6e3" /><circle cx="100" cy="80" r="34" fill="#e9c46a" /><circle cx="88" cy="74" r="4.5" fill="#264653" /><circle cx="112" cy="74" r="4.5" fill="#264653" />
      <path d="M84 88q16 14 32 0" stroke="#264653" strokeWidth="4.5" fill="none" strokeLinecap="round" />
      {kinhLup && <g transform="translate(128 44) rotate(20)"><circle r="20" fill="none" stroke="#e76f51" strokeWidth="7" /><path d="M14 14l16 16" stroke="#e76f51" strokeWidth="9" strokeLinecap="round" /></g>}
    </svg>
  )
}

const CODE_STYLE = { margin: 0, background: '#fff', fontSize: 27 }

/** khối code Python: tô màu, sửa trực tiếp trên màn chiếu, ▶ Chạy ngay trong trình duyệt (Pyodide) */
function KhoiCode({ k, chiXem }) {
  const [code, setCode] = useState(k.chu || ''), [sua, setSua] = useState(false)
  const [nhap, setNhap] = useState(k.stdin || ''), [kq, setKq] = useState(null), [dang, setDang] = useState(false)
  useEffect(() => { setCode(k.chu || ''); setNhap(k.stdin || ''); setKq(null) }, [k.chu, k.stdin])
  const coInput = /input\s*\(/.test(code)
  const chay = async e => {
    e.stopPropagation(); setDang(true); setKq(null)
    const r = await runPython(code, nhap.endsWith('\n') || !nhap ? nhap : nhap + '\n')
    setKq(r); setDang(false)
  }
  return (
    <div className="bgw-code" onClick={e => e.stopPropagation()}>
      <div className="dau-code"><Icon ten="may" co="26px" />Python
        {!chiXem && <span style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          <button className="sua-nut" onClick={e => { e.stopPropagation(); setSua(!sua) }}>{sua ? 'Xong' : '✎ Sửa'}</button>
          {k.chay !== false && <button className="chay-nut" disabled={dang} onClick={chay}>{dang ? 'Đang chạy…' : '▶ Chạy'}</button>}
        </span>}
      </div>
      {sua
        ? <textarea value={code} spellCheck={false} rows={Math.min(14, code.split('\n').length + 1)} onChange={e => setCode(e.target.value)}
            onKeyDown={e => { if (e.key === 'Tab') { e.preventDefault(); const t = e.target, s = t.selectionStart; setCode(code.slice(0, s) + '    ' + code.slice(t.selectionEnd)); requestAnimationFrame(() => { t.selectionStart = t.selectionEnd = s + 4 }) } }} />
        : <SyntaxHighlighter language="python" style={oneLight} customStyle={CODE_STYLE} codeTagProps={{ style: { fontSize: 27 } }}>{code}</SyntaxHighlighter>}
      {!chiXem && k.chay !== false && coInput && <div className="nhap">Dữ liệu nhập (mỗi dòng 1 lần input):
        <textarea rows={Math.min(3, nhap.split('\n').length)} value={nhap} onChange={e => setNhap(e.target.value)} /></div>}
      {kq && <div className="ket-qua">
        <small>Kết quả chạy</small>
        {kq.error ? <span className="loi">Không chạy được chương trình (mất mạng?) – thử lại.</span>
          : <>{kq.stdout || (!kq.stderr && <span style={{ opacity: .6 }}>(chương trình không in gì)</span>)}{kq.stderr && <span className="loi">{kq.stderr}</span>}</>}
      </div>}
    </div>
  )
}

/** chữ câu hỏi có thể chứa ```code``` */
function CauCoCode({ t, style }) {
  const phan = tachCode(t)
  return phan.map((p, i) => p.code != null
    ? <div key={i} className="bgw-code bgw-cau-code"><SyntaxHighlighter language="python" style={oneLight} customStyle={CODE_STYLE} codeTagProps={{ style: { fontSize: 27 } }}>{p.code}</SyntaxHighlighter></div>
    : <div key={i} className="bgw-cau" style={style}><T t={p.chu} /></div>)
}

function AnhKhoi({ k }) {
  const url = k.anh?.url
  if (!url) return null
  return <figure className="bgw-anh" style={k.rong ? { width: k.rong } : {}}><img className="du" src={url} alt={k.chu_thich || 'Hình'} />{k.chu_thich && <figcaption>{k.chu_thich}</figcaption>}</figure>
}

function DongHo({ giay }) {
  const [het, setHet] = useState(null), [now, setNow] = useState(0)
  useEffect(() => { if (!het) return; const id = setInterval(() => setNow(Date.now()), 250); return () => clearInterval(id) }, [het])
  const con = het ? Math.max(0, Math.ceil((het - now) / 1000)) : giay, xong = het && con <= 0
  useEffect(() => { if (xong) ring3() }, [xong])
  const mm = s => String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0')
  return (
    <div className="bgw-dh">
      <div className="so">{xong ? 'HẾT GIỜ' : mm(con)}</div>
      <div className="ray"><div className={'chay' + (xong ? ' het' : '')} style={{ width: (xong ? 100 : con / giay * 100) + '%' }} /></div>
      <button onClick={e => { e.stopPropagation(); moAmThanh(); beep(880, .12); setNow(Date.now()); setHet(Date.now() + giay * 1000) }}>{het ? 'Chạy lại' : 'Chạy'}</button>
    </div>
  )
}

/** vẽ 1 khối; dau = số thứ tự lần bấm của mục ẩn đầu tiên trong khối, mo = số lần đã bấm */
function Khoi({ k, dau, mo, chiXem }) {
  const cls = n => (n < mo ? ' ra' : ' an')
  const motLan = k.loai !== 'hai_cot' && k.an && !(k.tung && ['the', 'buoc', 'danh_sach'].includes(k.loai)) ? cls(dau) : ''
  let j = 0; const tung = k.an && k.tung ? () => cls(dau + j++) : () => ''
  switch (k.loai) {
    case 'loi': return <div className={'bgw-loi ' + m(k.mau || (k.ai === 'may' ? 'reu' : 'thep')) + motLan}>{k.ai === 'may' ? <MayTinh kinhLup={false} /> : <div className="ai">{k.ai}</div>}<div className="bb"><T t={k.chu} /></div></div>
    case 'hoi_thoai': {
      const ten = [...new Set((k.cac || []).map(x => x.ai))]
      return <div className={'flex flex-col gap-[20px]' + motLan}>{(k.cac || []).map((x, i) => <div key={i} className={'bgw-loi ' + m(MAU_AI[ten.indexOf(x.ai) % 4])}><div className="ai">{x.ai}</div><div className="bb"><T t={x.chu} /></div></div>)}</div>
    }
    case 'cau': return <div className={'bgw-cau' + motLan}><T t={k.chu} /></div>
    case 'the': {
      const ds2 = k.cac || [], mau = ['thep', 'ngoc', 'dat']
      return <div className={'bgw-the' + motLan} style={{ gridTemplateColumns: `repeat(${Math.max(1, ds2.length)},1fr)` }}>{ds2.map((x, i) => (
        <div key={i} className={'bgw-nhan ' + m(x.mau || mau[i % 3]) + tung()}>
          <div className="dau"><div className="bgw-tron"><Icon ten={x.icon || 'bong_den'} co="36px" net={2.4} /></div><T t={x.tieu} /></div>
          {x.chu && <p><T t={x.chu} /></p>}{x.vd && <p className="vd"><T t={x.vd} /></p>}
        </div>))}</div>
    }
    case 'buoc': {
      const ds2 = k.cac || [], mau = ['thep', 'ngoc', 'dat', 'mutat', 'reu']
      if (k.ngang) return <div className={'bgw-buoc ngang' + motLan}>{ds2.map((x, i) => [i > 0 && <div key={'m' + i} className="mui">➜</div>,
        <div key={i} className={'b ' + m(mau[i % 5]) + tung()}><div className="so" style={{ background: 'var(--c)' }}>{i + 1}</div><div><T t={x} /></div></div>])}</div>
      return <div className={'bgw-buoc' + motLan}>{ds2.map((x, i) => <div key={i} className={'b' + tung()}><div className="so">{i + 1}</div><div><T t={x} /></div></div>)}</div>
    }
    case 'danh_sach': return <div className={'bgw-ds ' + m(k.mau) + motLan}>{(k.cac || []).map((x, i) => <div key={i} className={'d' + tung()}><span><Icon ten={k.icon || 'dung'} co="26px" net={3} /></span><span><T t={x} /></span></div>)}</div>
    case 'ghi_nho': return <div className={'bgw-ghinho' + motLan}><i>Ghi nhớ!</i><T t={k.chu} /></div>
    case 'dap_an': return <div className={'bgw-dapan' + motLan}><i>Đáp án</i><span><T t={k.chu} /></span></div>
    case 'code': return <div className={motLan.trim()}><KhoiCode k={k} chiXem={chiXem} /></div>
    case 'hinh': return <div className={motLan.trim()}><AnhKhoi k={k} /></div>
    case 'dong_ho': return <div className={motLan.trim()}><DongHo giay={+k.giay || 60} /></div>
    case 'hai_cot': {
      const t = k.trai || [], p = k.phai || [], dauT = viTri(t, dau), dauP = viTri(p, dau + t.reduce((a, x) => a + demKhoi(x), 0))
      return (
        <div className="bgw-hai" style={{ gridTemplateColumns: k.ti_le || '1fr 1fr' }}>
          <div>{t.map((x, i) => <Khoi key={i} k={x} dau={dauT[i]} mo={mo} chiXem={chiXem} />)}</div>
          <div>{p.map((x, i) => <Khoi key={i} k={x} dau={dauP[i]} mo={mo} chiXem={chiXem} />)}</div>
        </div>)
    }
    default: return null
  }
}

/** khung nội dung tự thu nhỏ khi dài quá chỗ */
function VuaKhung({ children, khoa }) {
  const ngoai = useRef(null), trong = useRef(null)
  useLayoutEffect(() => {
    const vua = () => { const a = ngoai.current, b = trong.current; if (!a || !b) return; b.style.zoom = 1; const h = b.scrollHeight, H = a.clientHeight; b.style.zoom = h > H ? Math.max(.55, H / h) : 1 }
    vua(); document.fonts && document.fonts.ready.then(vua)
    const imgs = trong.current ? [...trong.current.querySelectorAll('img')] : []; imgs.forEach(im => im.addEventListener('load', vua))
    return () => imgs.forEach(im => im.removeEventListener('load', vua))
  }, [khoa])
  return <div className="bgw-than" ref={ngoai}><div className="bgw-co" ref={trong}>{children}</div></div>
}

/** số thứ tự lần bấm bắt đầu của từng khối trong danh sách */
function viTri(ds, dau = 0) { const out = []; let n = dau; (ds || []).forEach(k => { out.push(n); n += demKhoi(k) }); return out }

function Slide({ s, mo, setMo, chiXem }) {
  const tem = s.tem && <span className={'bgw-tem ' + m(s.mau)}>{s.tem}</span>
  if (s.loai === 'bia') {
    return (
      <div className="bgw-to bgw-ke bgw-bia">
        {s.nhan && <span className="nhanbia">{s.nhan}</span>}
        <div className="chinh">
          <h1><T t={s.tieu} /></h1>
          {s.phu && <div className="dong-phu"><T t={s.phu} /></div>}
          {s.khau_hieu && <div className="kh"><T t={s.khau_hieu} /></div>}
        </div>
        <MayTinh />
      </div>
    )
  }
  if (s.loai === 'trac_nghiem') {
    const ra = mo >= 1, L = 'ABCD', MM = ['thep', 'ngoc', 'dat', 'mutat']
    return (
      <div className="bgw-to"><h2 className="bgw-tieu"><T t={s.tieu || 'Chọn đáp án đúng'} /></h2>{tem}
        <VuaKhung khoa={s}>
          <CauCoCode t={s.cau} />
          <div className="bgw-dapan4">{(s.lua_chon || []).map((x, i) => (
            <div key={i} className={'bgw-note ' + m(MM[i]) + (ra && i !== s.dung ? ' mo' : '')} onClick={e => { e.stopPropagation(); setMo(1) }}>
              <div className="chu">{L[i]}</div><div><T t={x} /><small>{DONG_TAC[i]}</small></div>
              <span className={'bgw-dau' + (ra && i === s.dung ? ' ra' : '')}>ĐÚNG!</span>
            </div>))}</div>
          {s.giai_thich && <div className={'bgw-ghinho bgw-giai ' + (ra ? 'ra' : 'an')}><i>Vì sao?</i><T t={s.giai_thich} /></div>}
        </VuaKhung>
      </div>
    )
  }
  if (s.loai === 'dung_sai') {
    const ra = mo >= 1
    return (
      <div className="bgw-to"><h2 className="bgw-tieu"><T t={s.tieu || 'Đúng hay sai? Giơ tay nào!'} /></h2>{tem}
        <VuaKhung khoa={s}>
          <CauCoCode t={s.cau} style={{ textAlign: 'center', fontSize: 46 }} />
          <div className="bgw-ox">
            <div className={'o' + (ra && !s.dung ? ' mo' : '')} onClick={e => { e.stopPropagation(); setMo(1) }}><span className="ky">O</span><span>ĐÚNG<br />hai tay tạo chữ O</span><span className={'bgw-dau' + (ra && s.dung ? ' ra' : '')}>ĐÁP ÁN</span></div>
            <div className={'x' + (ra && s.dung ? ' mo' : '')} onClick={e => { e.stopPropagation(); setMo(1) }}><span className="ky">X</span><span>SAI<br />hai tay bắt chéo</span><span className={'bgw-dau' + (ra && !s.dung ? ' ra' : '')}>ĐÁP ÁN</span></div>
          </div>
          {s.giai_thich && <div className={'bgw-ghinho bgw-giai ' + (ra ? 'ra' : 'an')}><i>Vì sao?</i><T t={s.giai_thich} /></div>}
        </VuaKhung>
      </div>
    )
  }
  return (   // noi_dung
    <div className="bgw-to"><h2 className="bgw-tieu"><T t={s.tieu} /></h2>{tem}
      <VuaKhung khoa={s}>{(() => { const v = viTri(s.khoi); return (s.khoi || []).map((k, i) => <Khoi key={i} k={k} dau={v[i]} mo={mo} chiXem={chiXem} />) })()}</VuaKhung>
    </div>
  )
}

/**
 * ds: mảng slide · batDau: slide mở đầu · onDoi(i): báo đổi slide (chế độ dạy xoá nét vẽ; học sinh: đánh dấu đã xem hết)
 * phimTat: nghe phím → ← trên cả trang · dieuKhien: hiện nút nhỏ góc dưới · hienHet: hiện mọi mục ẩn (xem trước khi soạn)
 * chiXem: không sửa/chạy code (ô xem trước trong trình soạn)
 */
export default function SlidePlayer({ ds, batDau = 0, onDoi, phimTat = true, dieuKhien = true, hienHet = false, chiXem = false }) {
  const [i, setI] = useState(Math.min(batDau, Math.max(0, (ds || []).length - 1))), [mo, setMo] = useState(0)
  const goc = useRef(null), [k, setK] = useState(.5)
  useLayoutEffect(() => {
    const el = goc.current; if (!el) return
    const co = () => { const r = el.getBoundingClientRect(); setK(Math.min(r.width / 1600, r.height / 900)) }
    co(); const ro = new ResizeObserver(co); ro.observe(el); return () => ro.disconnect()
  }, [])
  const s = (ds || [])[i], tong = demBuoc(s)
  const den = (n, m2) => { setI(n); setMo(m2); onDoi && onDoi(n) }
  const tiep = () => { if (mo < tong) setMo(mo + 1); else if (i < ds.length - 1) den(i + 1, 0) }
  const lui = () => { if (mo > 0) setMo(mo - 1); else if (i > 0) den(i - 1, demBuoc(ds[i - 1])) }
  const r = useRef(); r.current = { tiep, lui }
  useEffect(() => {
    if (!phimTat) return
    const f = e => {
      if (e.target.closest && e.target.closest('input,textarea,select,[contenteditable="true"]')) return
      if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'].includes(e.key)) { e.preventDefault(); r.current.tiep() }
      else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(e.key)) { e.preventDefault(); r.current.lui() }
    }
    document.addEventListener('keydown', f); return () => document.removeEventListener('keydown', f)
  }, [phimTat])
  if (!s) return <div className="bgw" ref={goc}><p style={{ padding: 40, fontSize: 28 }}>Bài giảng chưa có slide.</p></div>
  const bam = e => { if (e.target.closest('button,a,input,textarea,.bgw-note,.bgw-ox,.bgw-dh,.bgw-code')) return; tiep() }
  return (
    <div className="bgw" ref={goc} onClick={bam}>
      <div className="bgw-khung" style={{ transform: `translate(-50%,-50%) scale(${k})` }}>
        <div className="bgw-slide" key={i}><Slide s={s} mo={hienHet ? 999 : mo} setMo={setMo} chiXem={chiXem} /></div>
      </div>
      {dieuKhien && <div className="bgw-dk"><button onClick={e => { e.stopPropagation(); lui() }} title="Lùi (←)">◀</button><span>{i + 1} / {ds.length}</span><button onClick={e => { e.stopPropagation(); tiep() }} title="Tiếp (→)">▶</button></div>}
    </div>
  )
}
