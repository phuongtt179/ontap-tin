import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { demDeThi } from '../../data/deThi'
import { demBaiTongQuan, demCauHoiDangCho } from '../../data/hoiThayCo'
import { layBuoiDangMo, layIdBuoiTrongNgay, demLuotDiemDanh } from '../../data/diemDanh'
import { layDiemThiDeXepHang, layDiemLuyenTapDeXepHang, demLuotLamBaiTuLuc } from '../../data/baiLam'
import { gomDiemTheoEm } from '../../domain/xepHang'
import { demHocSinh, layHocSinhChoDuyet, layTenCacHs } from '../../data/hoSo'
import { demCauHoi } from '../../data/cauHoi'
import { layGhiDanh, layLopCuaCacHs } from '../../data/ghiDanh'
import { Trophy, BookOpen, Users, ClipboardCheck, CheckSquare, Activity, Sparkles, RefreshCw } from 'lucide-react'

// Trang này chạy hơn 15 truy vấn, có lệnh đếm trên >10.000 bài (máy chủ nano dễ quá 8 giây khi thiếu RAM).
// Giữ kết quả 5 phút trong tab để quay lại trang / F5 không đếm lại; muốn số mới thì bấm Làm mới.
const GIU_MS = 5 * 60000
const khoaNho = id => `tongQuanGV:${id}`
function docNho(id) {
  try {
    const o = JSON.parse(sessionStorage.getItem(khoaNho(id)))
    return o && Date.now() - o.luc < GIU_MS ? o : null
  } catch { return null }
}

export default function TeacherDashboard() {
  const { profile } = useAuth()
  const [nho] = useState(() => docNho(profile?.id))
  const [stats, setStats] = useState(nho?.stats ?? { questions: null, exams: null, students: null })
  const [actions, setActions] = useState(nho?.actions ?? null)   // { pendingStudents, pendingSubmissions, openSessions, openAttendees }
  const [todayData, setTodayData] = useState(nho?.todayData ?? null) // { attended, active }
  const [examRanking, setExamRanking] = useState(nho?.examRanking ?? null)
  const [practiceRanking, setPracticeRanking] = useState(nho?.practiceRanking ?? null)
  const [aiAlert, setAiAlert] = useState(nho?.aiAlert ?? null) // { ungraded, unreviewed, questions }
  const [luc, setLuc] = useState(nho?.luc ?? null)   // lúc tải xong số liệu đang hiện
  const [dangTai, setDangTai] = useState(false)
  const coLoi = useRef(false)

  useEffect(() => { if (!nho) taiLai() }, [])   // eslint-disable-line react-hooks/exhaustive-deps

  // Lưu lại khi đã có đủ số liệu; lần tải bị lỗi thì không lưu để lần sau tải lại
  useEffect(() => {
    if (!luc || !profile?.id) return
    try {
      sessionStorage.setItem(khoaNho(profile.id), JSON.stringify({ luc, stats, actions, todayData, examRanking, practiceRanking, aiAlert }))
    } catch { /* trình duyệt chặn */ }
  }, [luc])   // eslint-disable-line react-hooks/exhaustive-deps

  async function taiLai() {
    setDangTai(true)
    coLoi.current = false
    const demBai = layDemBai()
    await Promise.all([fetchAiAlert(demBai), fetchStats(), fetchActions(demBai), fetchToday(), fetchExamRanking(), fetchPracticeRanking()])
    setLuc(coLoi.current ? null : Date.now())
    setDangTai(false)
  }

  // 3 số đếm bài nộp gộp trong 1 lần quét (rpc dem_bai_tong_quan)
  async function layDemBai() {
    const { data, error } = await demBaiTongQuan()
    if (error) { coLoi.current = true; return {} }
    return data || {}
  }

  async function fetchAiAlert(demBai) {
    const [dem, { count }] = await Promise.all([
      demBai,
      demCauHoiDangCho(),
    ])
    setAiAlert({ ungraded: dem.chua_cham || 0, unreviewed: dem.ai_chua_duyet || 0, questions: count || 0 })
  }

  async function fetchStats() {
    const [q, e, s] = await Promise.all([
      demCauHoi(),
      demDeThi(),
      demHocSinh(),
    ])
    setStats({ questions: q.count ?? 0, exams: e.count ?? 0, students: s.count ?? 0 })
  }

  async function fetchActions(demBai) {
    const [
      { data: pendingProfileUsers },
      { data: pendingEnrollUsers },
      dem,
      { data: openSessions, error: sessErr },
    ] = await Promise.all([
      layHocSinhChoDuyet(),
      layGhiDanh({ daDuyet: false }),
      demBai,
      layBuoiDangMo(),
    ])
    const pendingUserIds = new Set([
      ...(pendingProfileUsers || []).map(p => p.id),
      ...(pendingEnrollUsers || []).map(e => e.user_id),
    ])
    const pendingStudents = pendingUserIds.size

    const openAttendees = sessErr ? 0 : await demLuotDiemDanh((openSessions || []).map(s => s.id))

    setActions({
      pendingStudents: pendingStudents ?? 0,
      pendingSubmissions: dem.cho_duyet ?? 0,
      openSessions: sessErr ? [] : (openSessions || []),
      openAttendees,
    })
  }

  async function fetchToday() {
    const todayStr = new Date().toISOString().split('T')[0]
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0)
    const since = startOfDay.toISOString()

    const [idBuoi, active] = await Promise.all([layIdBuoiTrongNgay(todayStr), demLuotLamBaiTuLuc(since)])
    setTodayData({ attended: await demLuotDiemDanh(idBuoi), active })
  }

  /** tên + lớp của các em có lượt làm bài → xếp hạng (domain/xepHang: chỉ tính lượt có điểm) */
  async function buildRanking(sessions) {
    if (!sessions?.length) return []
    const ids = [...new Set(sessions.map(s => s.user_id))]
    const [{ data: ten }, { data: lop }] = await Promise.all([layTenCacHs(ids), layLopCuaCacHs(ids, { chiDaDuyet: true })])
    const lopCua = {}
    ;(lop || []).forEach(e => { if (!lopCua[e.user_id]) lopCua[e.user_id] = e.class_name || e.grade })
    return gomDiemTheoEm(sessions, Object.fromEntries((ten || []).map(p => [p.id, p.full_name])), lopCua)
  }

  async function fetchExamRanking() {
    const { data } = await layDiemThiDeXepHang()
    const ranked = await buildRanking(data)
    setExamRanking(ranked.sort((a, b) => b.avg - a.avg))
  }

  async function fetchPracticeRanking() {
    const { data, error } = await layDiemLuyenTapDeXepHang()
    if (error) { setPracticeRanking([]); return }
    const ranked = await buildRanking(data)
    setPracticeRanking(ranked.sort((a, b) => b.count - a.count))
  }

  const openSession = actions?.openSessions?.[0]

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <button onClick={taiLai} disabled={dangTai} title="Tải lại số liệu mới nhất"
          className="float-right flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-60">
          <RefreshCw size={13} className={dangTai ? 'animate-spin' : ''} />
          {dangTai ? 'Đang tải…' : `Làm mới${luc ? ` · số liệu lúc ${new Date(luc).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}` : ''}`}
        </button>
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Xin chào, {profile?.full_name}!</h1>
        <p className="text-gray-400 text-sm">{new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>

      {/* ── Action items ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Chờ duyệt học sinh */}
        <Link to="/teacher/students" className="group relative bg-white border-2 rounded-xl p-4 flex items-center gap-4 hover:shadow-md transition
          border-amber-200 hover:border-amber-400">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0 group-hover:bg-amber-200 transition">
            <Users size={18} className="text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400">Chờ duyệt học sinh</p>
            <p className="text-xl font-bold text-gray-800 leading-tight">
              {actions === null
                ? <span className="inline-block w-8 h-5 bg-gray-100 rounded animate-pulse" />
                : actions.pendingStudents}
            </p>
          </div>
          {actions !== null && actions.pendingStudents > 0 && (
            <span className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
          )}
        </Link>

        {/* Bài nộp chưa chấm */}
        <Link to="/teacher/lessons" className="group relative bg-white border-2 rounded-xl p-4 flex items-center gap-4 hover:shadow-md transition
          border-orange-200 hover:border-orange-400">
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0 group-hover:bg-orange-200 transition">
            <ClipboardCheck size={18} className="text-orange-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400">Bài nộp chưa chấm</p>
            <p className="text-xl font-bold text-gray-800 leading-tight">
              {actions === null
                ? <span className="inline-block w-8 h-5 bg-gray-100 rounded animate-pulse" />
                : actions.pendingSubmissions}
            </p>
          </div>
          {actions !== null && actions.pendingSubmissions > 0 && (
            <span className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-orange-400 animate-pulse" />
          )}
        </Link>

        {/* Điểm danh */}
        <Link to="/teacher/attendance" className={`group relative bg-white border-2 rounded-xl p-4 flex items-center gap-4 hover:shadow-md transition
          ${openSession ? 'border-green-300 hover:border-green-500' : 'border-gray-200 hover:border-gray-300'}`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition
            ${openSession ? 'bg-green-100 group-hover:bg-green-200' : 'bg-gray-100 group-hover:bg-gray-200'}`}>
            <CheckSquare size={18} className={openSession ? 'text-green-600' : 'text-gray-400'} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400">Điểm danh hôm nay</p>
            {actions === null ? (
              <span className="inline-block w-12 h-5 bg-gray-100 rounded animate-pulse mt-1" />
            ) : openSession ? (
              <>
                <p className="text-sm font-semibold text-green-700 leading-tight truncate">
                  {openSession.class_name || openSession.grade} — đang mở
                </p>
                <p className="text-xs text-gray-400">{actions.openAttendees} học sinh đã điểm danh</p>
              </>
            ) : (
              <p className="text-sm font-medium text-gray-400">Chưa mở buổi nào</p>
            )}
          </div>
          {openSession && (
            <span className="absolute top-3 right-3 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
            </span>
          )}
        </Link>
      </div>

      {/* ── Hôm nay ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-indigo-50 rounded-xl p-4 flex items-center gap-3">
          <CheckSquare size={20} className="text-indigo-500 shrink-0" />
          <div>
            <p className="text-xs text-indigo-400">Đã điểm danh hôm nay</p>
            <p className="text-xl font-bold text-indigo-700">
              {todayData === null
                ? <span className="inline-block w-8 h-5 bg-indigo-100 rounded animate-pulse" />
                : todayData.attended}
              <span className="text-sm font-normal text-indigo-400 ml-1">lượt</span>
            </p>
          </div>
        </div>
        <div className="bg-purple-50 rounded-xl p-4 flex items-center gap-3">
          <Activity size={20} className="text-purple-500 shrink-0" />
          <div>
            <p className="text-xs text-purple-400">Làm bài hôm nay</p>
            <p className="text-xl font-bold text-purple-700">
              {todayData === null
                ? <span className="inline-block w-8 h-5 bg-purple-100 rounded animate-pulse" />
                : todayData.active}
              <span className="text-sm font-normal text-purple-400 ml-1">lượt</span>
            </p>
          </div>
        </div>
      </div>

      {/* ── Trung tâm AI: bài AI chưa duyệt / bài bị sót chưa có điểm ── */}
      {aiAlert && (aiAlert.ungraded > 0 || aiAlert.unreviewed > 0 || aiAlert.questions > 0) && (
        <Link to={aiAlert.questions > 0 ? '/teacher/ai-tools?tab=questions' : aiAlert.ungraded > 0 ? '/teacher/ai-tools?tab=backfill' : '/teacher/ai-tools?tab=review'}
          className="flex items-center gap-3 bg-violet-50 border border-violet-200 rounded-xl px-4 py-3 hover:bg-violet-100 transition">
          <Sparkles size={20} className="text-violet-500 shrink-0" />
          <p className="text-sm text-violet-900 flex-1">
            {aiAlert.questions > 0 && <><b>{aiAlert.questions.toLocaleString('vi-VN')}</b> câu hỏi học sinh chờ trả lời. </>}
            {aiAlert.ungraded > 0 && <><b>{aiAlert.ungraded.toLocaleString('vi-VN')}</b> bài nộp mới chưa chấm. </>}
            {aiAlert.unreviewed > 0 && <><b>{aiAlert.unreviewed.toLocaleString('vi-VN')}</b> bài AI đã chấm chưa được duyệt.</>}
          </p>
          <span className="text-xs font-semibold text-violet-700">Trung tâm AI →</span>
        </Link>
      )}

      {/* ── Tổng (nhỏ hơn) ───────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <SmallStat label="Câu hỏi" value={stats.questions} />
        <SmallStat label="Đề thi" value={stats.exams} />
        <SmallStat label="Học sinh" value={stats.students} />
      </div>

      {/* ── Rankings ─────────────────────────────────────────── */}
      <div className="space-y-4">
        <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
            <Trophy size={16} className="text-yellow-500" />
            <h2 className="font-semibold text-gray-800 text-sm">Xếp hạng đề thi</h2>
            <span className="ml-auto text-xs text-gray-400">Theo điểm trung bình</span>
          </div>
          {examRanking === null ? <LoadingRows /> : examRanking.length === 0 ? (
            <Empty text="Chưa có học sinh nào nộp bài" />
          ) : (
            <div className="divide-y divide-gray-50">
              {examRanking.slice(0, 10).map((s, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3">
                  <RankBadge rank={i + 1} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">{s.full_name}</div>
                    <div className="text-xs text-gray-400">Lớp {s.class_name} · {s.count} lần thi</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`text-base font-bold ${s.avg >= 8 ? 'text-green-600' : s.avg >= 5 ? 'text-orange-500' : 'text-red-500'}`}>{s.avg}</div>
                    <div className="text-xs text-gray-400">TB</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-semibold text-indigo-600">{s.best}</div>
                    <div className="text-xs text-gray-400">Cao nhất</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
            <BookOpen size={16} className="text-indigo-500" />
            <h2 className="font-semibold text-gray-800 text-sm">Luyện tập</h2>
            <span className="ml-auto text-xs text-gray-400">Theo số lần luyện</span>
          </div>
          <div className="px-5 py-2.5 bg-indigo-50 border-b border-indigo-100">
            <p className="text-xs text-indigo-600">Học sinh tự chọn chủ đề và mức độ để luyện tập ngẫu nhiên.</p>
          </div>
          {practiceRanking === null ? <LoadingRows /> : practiceRanking.length === 0 ? (
            <Empty text="Chưa có học sinh nào luyện tập" />
          ) : (
            <div className="divide-y divide-gray-50">
              {practiceRanking.slice(0, 10).map((s, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3">
                  <RankBadge rank={i + 1} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">{s.full_name}</div>
                    <div className="text-xs text-gray-400">Lớp {s.class_name}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-base font-bold text-indigo-600">{s.count}</div>
                    <div className="text-xs text-gray-400">lần</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`text-sm font-semibold ${s.avg >= 8 ? 'text-green-600' : s.avg >= 5 ? 'text-orange-500' : 'text-red-500'}`}>{s.avg}</div>
                    <div className="text-xs text-gray-400">TB</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function SmallStat({ label, value }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between gap-2">
      <span className="text-xs text-gray-400">{label}</span>
      <span className="text-lg font-bold text-gray-700">
        {value === null ? <span className="inline-block w-6 h-4 bg-gray-100 rounded animate-pulse" /> : value}
      </span>
    </div>
  )
}

function RankBadge({ rank }) {
  const colors = ['bg-yellow-400 text-white', 'bg-gray-300 text-white', 'bg-orange-300 text-white']
  return (
    <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${colors[rank - 1] || 'bg-gray-100 text-gray-500'}`}>
      {rank}
    </span>
  )
}

function LoadingRows() {
  return (
    <div className="p-5 space-y-3">
      {[1, 2, 3].map(i => <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />)}
    </div>
  )
}

function Empty({ text }) {
  return <div className="px-5 py-10 text-center text-sm text-gray-400">{text}</div>
}
