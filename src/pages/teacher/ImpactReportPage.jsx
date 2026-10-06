import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { Loader2, Download, Users, School, BookOpenCheck, FileCheck2, Bot, MessageCircleQuestion, ShieldCheck, Timer } from 'lucide-react'

const nf = n => (n ?? 0).toLocaleString('vi-VN')
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0)
const monthLabel = m => `${m.slice(5, 7)}/${m.slice(0, 4)}`

function Kpi({ icon, label, value, sub, color = 'text-indigo-600' }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 flex items-start gap-3">
      <div className={`${color} mt-0.5`}>{icon}</div>
      <div className="min-w-0">
        <div className="text-2xl font-black text-gray-800 leading-tight">{value}</div>
        <div className="text-xs text-gray-500">{label}</div>
        {sub && <div className="text-[11px] text-gray-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  )
}

// Biểu đồ cột đơn giản (CSS) — không thêm thư viện
function Bars({ rows, valueKey, labelKey, color = 'bg-indigo-500', format = nf }) {
  const max = Math.max(1, ...rows.map(r => Number(r[valueKey]) || 0))
  return (
    <div className="space-y-1.5">
      {rows.map(r => {
        const v = Number(r[valueKey]) || 0
        return (
          <div key={r[labelKey]} className="flex items-center gap-2 text-xs">
            <div className="w-16 shrink-0 text-gray-500">{r.label}</div>
            <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
              <div className={`${color} h-full rounded-full`} style={{ width: `${(v / max) * 100}%` }} />
            </div>
            <div className="w-14 text-right font-semibold text-gray-700">{format(v)}</div>
          </div>
        )
      })}
    </div>
  )
}

export default function ImpactReportPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [minutes, setMinutes] = useState(2) // số phút giáo viên ước tính để chấm tay 1 bài

  useEffect(() => {
    supabase.rpc('impact_stats').then(({ data, error }) => {
      if (error) {
        toast.error('Chưa tải được số liệu — đã chạy migration_impact_report.sql chưa?')
        console.error(error)
      } else setData(data)
      setLoading(false)
    })
  }, [])

  const monthly = useMemo(() => (data?.monthly || []).map(m => ({ ...m, label: monthLabel(m.month) })), [data])
  const weekly = useMemo(() => (data?.weekly_active || []).map(w => ({ ...w, label: w.week.slice(8, 10) + '/' + w.week.slice(5, 7) })), [data])

  function exportCsv() {
    const t = data.totals
    const lines = [
      ['Chỉ số', 'Giá trị'],
      ['Học sinh (đã duyệt)', t.students], ['Lớp', t.classes], ['Bài học đã xuất bản', t.lessons_published],
      ['Lượt hoàn thành bài học', t.lessons_completed], ['Bài thực hành đã nộp', t.submissions],
      ['Bài do AI chấm', t.ai_graded], ['Bài giáo viên chấm', t.teacher_graded],
      ['Câu hỏi hỏi gia sư AI', t.ai_questions], ['Học sinh dùng gia sư AI', t.ai_questions_students],
      ['Lượt làm đề thi', t.exam_sessions], ['Lượt luyện tập', t.quiz_sessions],
      [],
      ['Tháng', 'HS hoạt động', 'Bài nộp', 'AI chấm', 'Điểm TB', 'Câu hỏi gia sư AI', 'Lượt hoàn thành bài'],
      ...monthly.map(m => [m.month, m.active_students, m.submissions, m.ai_graded, m.avg_score ?? '', m.ai_questions, m.lessons_completed]),
    ]
    const csv = '﻿' + lines.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    a.download = `bao-cao-tac-dong-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin text-indigo-400" /></div>
  if (!data) return <div className="p-6 text-center text-gray-500">Không có dữ liệu.</div>

  const t = data.totals
  const ag = data.ai_agreement || {}
  const savedHours = Math.round((t.ai_graded * minutes) / 60)
  const since = t.first_activity ? new Date(t.first_activity).toLocaleDateString('vi-VN') : '—'

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-black text-gray-800">Báo cáo tác động</h1>
          <p className="text-sm text-gray-500">Số liệu sử dụng thực tế từ {since} đến nay · cập nhật {new Date(data.generated_at).toLocaleString('vi-VN')}</p>
        </div>
        <button onClick={exportCsv}
          className="flex items-center gap-1.5 text-sm font-bold bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg">
          <Download size={15} /> Xuất CSV
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi icon={<Users size={20} />} label="Học sinh" value={nf(t.students)} />
        <Kpi icon={<School size={20} />} label="Lớp" value={nf(t.classes)} sub={`${nf(t.lessons_published)} bài học`} />
        <Kpi icon={<BookOpenCheck size={20} />} label="Lượt hoàn thành bài học" value={nf(t.lessons_completed)} color="text-green-600" />
        <Kpi icon={<FileCheck2 size={20} />} label="Bài thực hành đã nộp" value={nf(t.submissions)} color="text-green-600" />
        <Kpi icon={<Bot size={20} />} label="Bài do AI chấm" value={nf(t.ai_graded)} sub={`${pct(t.ai_graded, t.submissions)}% tổng bài nộp`} color="text-violet-600" />
        <Kpi icon={<MessageCircleQuestion size={20} />} label="Câu hỏi gia sư AI" value={nf(t.ai_questions)} sub={`${nf(t.ai_questions_students)} học sinh đã dùng`} color="text-violet-600" />
        <Kpi icon={<ShieldCheck size={20} />} label="Bài AI chấm được GV xác nhận" value={nf(t.ai_reviewed_ok)} sub={`${nf(t.teacher_graded)} bài GV chấm trực tiếp`} color="text-amber-600" />
        <Kpi icon={<Timer size={20} />} label="Lượt làm đề thi / luyện tập" value={`${nf(t.exam_sessions)} / ${nf(t.quiz_sessions)}`} color="text-amber-600" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <section className="bg-white rounded-2xl border border-gray-200 p-4">
          <h2 className="font-bold text-gray-700 text-sm mb-3">Học sinh hoạt động theo tháng</h2>
          <Bars rows={monthly} valueKey="active_students" labelKey="month" />
        </section>
        <section className="bg-white rounded-2xl border border-gray-200 p-4">
          <h2 className="font-bold text-gray-700 text-sm mb-3">Bài thực hành nộp theo tháng</h2>
          <Bars rows={monthly} valueKey="submissions" labelKey="month" color="bg-green-500" />
        </section>
        <section className="bg-white rounded-2xl border border-gray-200 p-4">
          <h2 className="font-bold text-gray-700 text-sm mb-3">Câu hỏi hỏi gia sư AI theo tháng</h2>
          <Bars rows={monthly} valueKey="ai_questions" labelKey="month" color="bg-violet-500" />
        </section>
        <section className="bg-white rounded-2xl border border-gray-200 p-4">
          <h2 className="font-bold text-gray-700 text-sm mb-3">Điểm thực hành trung bình theo tháng</h2>
          <Bars rows={monthly.filter(m => m.avg_score != null)} valueKey="avg_score" labelKey="month" color="bg-amber-500" format={v => v.toFixed(1)} />
        </section>
      </div>

      <section className="bg-white rounded-2xl border border-gray-200 p-4">
        <h2 className="font-bold text-gray-700 text-sm mb-3">Học sinh hoạt động mỗi tuần (khoảng 12 tuần gần nhất, mốc là ngày đầu tuần)</h2>
        <Bars rows={weekly} valueKey="active_students" labelKey="week" />
      </section>

      <div className="grid md:grid-cols-2 gap-4">
        <section className="bg-white rounded-2xl border border-gray-200 p-4">
          <h2 className="font-bold text-gray-700 text-sm mb-2">Độ khớp giữa AI chấm và giáo viên chấm</h2>
          {ag.compared > 0 ? (
            <ul className="text-sm text-gray-700 space-y-1">
              <li>Số bài đã so sánh: <b>{nf(ag.compared)}</b></li>
              <li>Chênh lệch điểm trung bình: <b>{ag.avg_abs_diff}</b> điểm</li>
              <li>Lệch không quá 1 điểm: <b>{pct(ag.within_1, ag.compared)}%</b></li>
              <li>Giáo viên giữ nguyên điểm AI: <b>{pct(ag.identical, ag.compared)}%</b></li>
            </ul>
          ) : (
            <p className="text-sm text-gray-500">Chưa có dữ liệu. Vào Trung tâm AI → "Duyệt bài AI chấm": mỗi bài thầy/cô đồng ý hoặc sửa điểm sẽ được tính vào đây.</p>
          )}
        </section>
        <section className="bg-white rounded-2xl border border-gray-200 p-4">
          <h2 className="font-bold text-gray-700 text-sm mb-2">Ước tính thời gian chấm bài tiết kiệm được</h2>
          <label className="text-sm text-gray-600 flex items-center gap-2 flex-wrap">
            Chấm tay 1 bài mất khoảng
            <input type="number" min="0.5" step="0.5" value={minutes}
              onChange={e => setMinutes(Math.max(0.5, Number(e.target.value) || 0.5))}
              className="w-16 border border-gray-300 rounded-lg px-2 py-1 text-sm" /> phút
          </label>
          <p className="mt-2 text-sm text-gray-700">≈ <b className="text-2xl text-violet-600">{nf(savedHours)}</b> giờ chấm bài cho {nf(t.ai_graded)} bài do AI chấm</p>
          <p className="text-[11px] text-gray-400 mt-1">Đây là số ước tính theo số phút giáo viên tự nhập, không phải số đo thực tế.</p>
        </section>
      </div>

      <p className="text-[11px] text-gray-400">
        Ghi chú: "học sinh hoạt động" = có cập nhật tiến độ, nộp bài hoặc hỏi gia sư AI trong kỳ. "Lượt hoàn thành bài" tính theo thời điểm cập nhật cuối của tiến độ bài học.
        Báo cáo chỉ gồm số tổng hợp, không chứa tên học sinh.
      </p>
    </div>
  )
}
