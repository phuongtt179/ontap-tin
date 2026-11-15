// ✅ CHẤM BÀI (29/10/2026) — giáo viên đánh giá bài thực hành theo mức T/H/C, AI chỉ gợi ý.
//   • Theo bài: chọn bài + lớp → danh sách học sinh đã nộp, gợi ý của AI theo tiêu chí, cột T/H/C để duyệt / đổi.
//   • Theo học sinh: chọn lớp + học sinh → các bài em đã nộp TRONG KHOÁ ĐANG CHỌN, xếp theo Chủ đề → bài như "Theo bài".
//   Mỗi bài có nút Xem bài: xem ngay tại trang (Scratch, Python, Word, PowerPoint, ảnh), không phải tải về.
// AI chấm nháp chỉ khi giáo viên bấm (chạy trên máy giáo viên). Học sinh chỉ thấy mức + nhận xét sau khi duyệt.
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Loader2, Bot, Check, ClipboardCheck, User, BookOpen } from 'lucide-react'
import { layTenLopCuaKhoa } from '../../data/khoaHoc'
import { layHocSinhKemHoSo } from '../../data/ghiDanh'
import { useGrades } from '../../hooks/useGrades'
import { MUC, CAC_MUC, mucTuDiem } from '../../utils/muc'
import { aiChamNhap, luuDanhGia } from '../../utils/danhGia'
import { parseTasks } from '../../domain/baiThucHanh'
import { phanCua, goiYCua, coNhapCua, nhomBaiNopTheoMuc } from '../../domain/chamBai'
import DongBaiCham from '../../components/teacher/chamBai/DongBaiCham'
import { nhomBaiTheoChuDe } from '../../domain/thuTuBaiHoc'
import { layBaiThucHanhTheoKhoa, layDeThucHanhTheoIds } from '../../data/baiHoc'
import { layBaiNopDeChamTheoBai, layBaiNopDeChamTheoHs } from '../../data/baiNop'

const lsGet = k => { try { return localStorage.getItem(k) || '' } catch { return '' } }
const lsSet = (k, v) => { try { localStorage.setItem(k, v) } catch { /* trình duyệt chặn */ } }
const SEL = 'border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300'
const taskIdx = sub => Number(phanCua(sub))
const boDau = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd')

export default function GradingPage() {
  const { grades } = useGrades()
  const [cach, setCach] = useState(() => lsGet('chamCach') || 'bai')
  const [grade, setGrade] = useState(() => lsGet('chamGrade'))
  const [lops, setLops] = useState([]), [lop, setLop] = useState('')
  const [baiHocs, setBaiHocs] = useState([]), [baiId, setBaiId] = useState('')
  const [hss, setHss] = useState([]), [hsId, setHsId] = useState('')
  const [subs, setSubs] = useState(null), [lessonMap, setLessonMap] = useState({})
  const [chuaDuyet, setChuaDuyet] = useState(true)
  const [locMuc, setLocMuc] = useState('')   // '' | 'T' | 'H' | 'C' | 'none' (chưa có gợi ý) — theo mức AI gợi ý
  const [ban, setBan] = useState('')
  const [timTen, setTimTen] = useState('')   // Theo bài: tìm học sinh theo tên
  const [locBai, setLocBai] = useState('')   // Theo học sinh: chỉ xem 1 bài của em đó

  useEffect(() => { setTimTen('') }, [cach, baiId])
  useEffect(() => { setLocBai('') }, [cach, hsId])
  useEffect(() => { if (!grade && grades.length) setGrade(grades[0]) }, [grades, grade])
  useEffect(() => { lsSet('chamCach', cach) }, [cach])
  useEffect(() => {
    if (!grade) return
    lsSet('chamGrade', grade); setLop(''); setBaiId(''); setHsId(''); setSubs(null)
    layTenLopCuaKhoa(grade).then(setLops)
    // xếp theo Chủ đề → Đơn vị → thứ tự bài, giống trang Học bài (không chỉ theo cột order — order chỉ là thứ tự trong đơn vị)
    layBaiThucHanhTheoKhoa(grade).then(({ baiHoc, donVi }) => {
      setBaiHocs(nhomBaiTheoChuDe(baiHoc, donVi))
      setLessonMap(Object.fromEntries(baiHoc.map(l => [l.id, l])))
    }).catch(() => toast.error('Không tải được danh sách bài'))
  }, [grade])
  // danh sách học sinh của lớp (hoặc cả khoá)
  useEffect(() => {
    if (!grade) return
    layHocSinhKemHoSo({ grade, lop }).then(({ data }) => setHss((data || []).map(e => ({ id: e.user_id, ten: e.profiles.full_name || '(chưa có tên)', lop: e.class_name }))
      .sort((a, b) => a.ten.split(' ').pop().localeCompare(b.ten.split(' ').pop(), 'vi'))))
  }, [grade, lop])

  // tải bài nộp
  useEffect(() => {
    setSubs(null)
    if (cach === 'bai') {
      if (!baiId || !hss.length) { setSubs(baiId ? [] : null); return }
      layBaiNopDeChamTheoBai(baiId, hss.map(h => h.id))
        .then(({ data, error }) => { if (error) toast.error('Không tải được bài nộp'); setSubs(data || []) })
    } else {
      if (!hsId) return
      layBaiNopDeChamTheoHs(hsId, grade)
        .then(async ({ data, error }) => {
          if (error) toast.error('Không tải được bài nộp')
          const thieu = [...new Set((data || []).map(s => s.lesson_id))].filter(id => !lessonMap[id])
          if (thieu.length) {
            const { data: ls } = await layDeThucHanhTheoIds(thieu)
            setLessonMap(m => ({ ...m, ...Object.fromEntries((ls || []).map(l => [l.id, l])) }))
          }
          setSubs(data || [])
        })
    }
  }, [cach, baiId, hsId, hss, grade])   // eslint-disable-line react-hooks/exhaustive-deps

  const tenHs = useMemo(() => Object.fromEntries(hss.map(h => [h.id, h.ten])), [hss])
  // Theo học sinh: các bài em đã nộp, nhóm theo Chủ đề → bài (thứ tự chương trình) cho ô chọn bài
  const mucCuaHs = useMemo(() => (cach === 'hs' && subs ? nhomBaiNopTheoMuc(subs, baiHocs, lessonMap) : []), [cach, subs, baiHocs, lessonMap])
  const soBaiCuaHs = mucCuaHs.reduce((n, g) => n + g.bai.length, 0)
  const hien = useMemo(() => {
    let ds = (subs || []).filter(s => !chuaDuyet || !s.reviewed_at)
    if (locMuc) ds = ds.filter(s => { const g = goiYCua(s); return locMuc === 'none' ? !g : g === locMuc })
    if (cach === 'bai' && timTen.trim()) ds = ds.filter(s => boDau(tenHs[s.user_id]).includes(boDau(timTen.trim())))
    if (cach === 'hs' && locBai) ds = ds.filter(s => s.lesson_id === locBai)
    if (cach === 'bai') ds = ds.sort((a, b) => (tenHs[a.user_id] || '').split(' ').pop().localeCompare((tenHs[b.user_id] || '').split(' ').pop(), 'vi') || taskIdx(a) - taskIdx(b))
    return ds
  }, [subs, chuaDuyet, cach, tenHs, locMuc, timTen, locBai])
  const taskDefCua = sub => parseTasks(lessonMap[sub.lesson_id]?.practice_instructions)[taskIdx(sub)] || {}
  const doi = moi => setSubs(prev => prev.map(s => (s.id === moi.id ? moi : s)))
  const canGoiY = hien.filter(s => !s.reviewed_at && !coNhapCua(s))
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
        <span className="text-xs text-gray-500">Mức: <b>T</b> Hoàn thành tốt · <b>H</b> Hoàn thành · <b>C</b> Chưa hoàn thành — sticker khi duyệt T 3 · H 1 · C 0 (nộp lại mà mức tăng: cộng phần chênh)</span>
      </div>

      <div className="flex flex-wrap items-center gap-2 bg-white border border-gray-200 rounded-xl p-3">
        <select className={SEL} value={grade} onChange={e => setGrade(e.target.value)}>{grades.map(g => <option key={g}>{g}</option>)}</select>
        <select className={SEL} value={lop} onChange={e => { setLop(e.target.value); setHsId('') }}>
          <option value="">Tất cả lớp</option>{lops.map(l => <option key={l}>{l}</option>)}</select>
        {cach === 'bai'
          ? <select className={SEL + ' min-w-[240px]'} value={baiId} onChange={e => setBaiId(e.target.value)}>
              <option value="">— Chọn bài học —</option>{baiHocs.map(g => <optgroup key={g.topic} label={g.topic || 'Chưa có chủ đề'}>{g.lessons.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}</optgroup>)}</select>
          : <select className={SEL + ' min-w-[220px]'} value={hsId} onChange={e => setHsId(e.target.value)}>
              <option value="">— Chọn học sinh ({hss.length}) —</option>{hss.map(h => <option key={h.id} value={h.id}>{h.ten}{!lop && h.lop ? ` (${h.lop})` : ''}</option>)}</select>}
        {cach === 'bai' && baiId && (
          <input className={SEL + ' w-44'} value={timTen} onChange={e => setTimTen(e.target.value)} placeholder="Tìm theo tên học sinh" />
        )}
        {cach === 'hs' && hsId && (
          <select className={SEL + ' min-w-[200px]'} value={locBai} onChange={e => setLocBai(e.target.value)}>
            <option value="">Tất cả bài của em ({soBaiCuaHs})</option>
            {mucCuaHs.map(g => <optgroup key={g.topic} label={g.topic || 'Chưa có chủ đề'}>{g.bai.map(({ lesson }) => <option key={lesson.id} value={lesson.id}>{lesson.title}</option>)}</optgroup>)}</select>
        )}
        <select className={SEL} value={locMuc} onChange={e => setLocMuc(e.target.value)} title="Lọc theo mức AI gợi ý">
          <option value="">Mọi mức AI gợi ý</option>
          {CAC_MUC.map(m => <option key={m} value={m}>AI gợi ý {m} · {MUC[m].ten}</option>)}
          <option value="none">Chưa có gợi ý</option>
        </select>
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
        : hien.length === 0 ? <p className="text-center text-gray-400 py-12">{timTen.trim() || locBai || locMuc ? 'Không có bài nào khớp bộ lọc.' : chuaDuyet ? 'Không còn bài nào chờ duyệt 🎉' : 'Chưa có bài nộp.'}</p>
          : cach === 'bai'
            ? <div className="space-y-2">{hien.map(s => (
              <DongBaiCham key={s.id} sub={s} taskDef={taskDefCua(s)} onDoi={doi} dangBan={!!ban} tieuDe={tenHs[s.user_id] || 'Học sinh'} />))}</div>
            : <div className="space-y-4">{nhomBaiNopTheoMuc(hien, baiHocs, lessonMap).map(g => (
              <section key={g.topic} className="space-y-2">
                <h2 className="text-sm font-bold text-indigo-700 border-b border-indigo-100 pb-1">{g.topic || 'Chưa có chủ đề'}</h2>
                {g.bai.flatMap(({ lesson, subs: ds }) => ds.map(s => (
                  <DongBaiCham key={s.id} sub={s} taskDef={taskDefCua(s)} onDoi={doi} dangBan={!!ban} tieuDe={lesson.title} />)))}
              </section>))}</div>}
    </div>
  )
}
