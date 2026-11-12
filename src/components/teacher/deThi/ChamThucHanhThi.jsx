// Phần thực hành của 1 lượt thi (giáo viên): xem bài (Word / PPT / Scratch / các lần nộp Python), AI chấm nháp, chấm điểm + nhận xét.
// key = id lượt → đổi lượt thì ô điểm / nhận xét nạp lại từ lượt mới.
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { Loader2, CheckCircle, Bot, ExternalLink } from 'lucide-react'
import WordEditor from '../../editor/WordEditor'
import PPTEditor from '../../editor/PPTEditor'
import Sb3Viewer from '../../ui/Sb3Viewer'
import { gradeStudent } from '../../../utils/aiGrader'
import { layLanNopPython, suaLuotThi } from '../../../data/baiLam'

const NHAN_THUC_HANH = { word: '📝 Word', ppt: '📊 PowerPoint', python: '🐍 Python', scratch: '🐱 Scratch' }
const KY_TEST = { dung: '✅', sai: '❌', loi: '💥', qua_gio: '⏱️' }

export default function ChamThucHanhThi({ exam, luot: selectedSession, onCapNhat }) {
  const [practicalScore, setPracticalScore] = useState(selectedSession.practical_score ?? '')
  const [practicalComment, setPracticalComment] = useState(selectedSession.practical_comment || '')
  const [savingPractical, setSavingPractical] = useState(false)
  const [nopPython, setNopPython] = useState([])   // các lần nộp chấm Python của lượt này
  const [aiDang, setAiDang] = useState(false)

  useEffect(() => {
    if (exam.practical_type !== 'python') return
    layLanNopPython(selectedSession.id, { kemCode: true }).then(({ data }) => setNopPython(data || []))
  }, [selectedSession.id, exam.practical_type])

  // AI chấm nháp bài Scratch / Word / PPT theo tiêu chí của đề — chỉ giáo viên thấy, giáo viên sửa rồi lưu
  async function aiChamNhap() {
    if (!selectedSession?.practical_file_url) { toast.error('Học sinh chưa nộp file'); return }
    setAiDang(true)
    try {
      const { results } = await gradeStudent(
        [{ file_url: selectedSession.practical_file_url, file_name: selectedSession.practical_file_name, content_json: { task_index: 0 } }],
        [{ instructions: exam.practical_instructions || '', rubric: exam.practical_rubric || '' }])
      const r = results?.[0]
      if (!r) throw new Error('AI chưa trả về kết quả')
      const practical_ai = { score: r.score, comment: r.comment, breakdown: r.breakdown || [], at: new Date().toISOString() }
      const { error } = await suaLuotThi(selectedSession.id, { practical_ai })
      if (error) throw error
      onCapNhat({ ...selectedSession, practical_ai })
      setPracticalScore(r.score ?? '')
      setPracticalComment(r.comment || '')
      toast.success('AI đã chấm nháp — thầy cô xem, sửa rồi bấm Lưu')
    } catch (e) {
      toast.error(e.quotaType === 'quota_rpd' ? 'AI đã hết lượt hôm nay' : 'AI lỗi: ' + e.message)
    } finally {
      setAiDang(false)
    }
  }

  async function savePractical() {
    if (!selectedSession) return
    setSavingPractical(true)
    const scoreVal = practicalScore !== '' ? parseFloat(practicalScore) : null
    const updates = {
      practical_comment: practicalComment,
      practical_reviewed_at: new Date().toISOString(),
      ...(scoreVal != null && !isNaN(scoreVal) ? { practical_score: scoreVal } : {}),
    }
    const { error } = await suaLuotThi(selectedSession.id, updates)
    setSavingPractical(false)
    if (error) { toast.error('Lưu thất bại: ' + error.message); return }
    toast.success('Đã lưu điểm thực hành')
    onCapNhat({ ...selectedSession, ...updates })
  }

  return (
    <>
  {/* Practical section */}
  {exam.has_practical && (selectedSession.practical_content || selectedSession.practical_file_url || nopPython.length > 0) && (
    <div className="space-y-3 pt-2 border-t border-gray-100">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        Phần thực hành {NHAN_THUC_HANH[exam.practical_type] || ''}
      </p>
      {exam.practical_type === 'python' && (
        <div className="space-y-2">
          <p className="text-sm text-gray-600">Máy chấm tự động · {nopPython.length}/10 lần nộp · điểm lấy lần cao nhất: <b className="text-orange-600">{selectedSession.practical_score ?? 0}</b>/10</p>
          {nopPython.map(l => (
            <details key={l.lan} className="border border-gray-200 rounded-lg">
              <summary className="cursor-pointer px-3 py-2 text-sm flex flex-wrap items-center gap-2">
                <b>Lần {l.lan}</b> · {l.diem} điểm · <span className="text-xs">{(l.ket_qua || []).map(k => KY_TEST[k.trang_thai]).join(' ')}</span>
                <span className="text-xs text-gray-400">{new Date(l.created_at).toLocaleTimeString('vi-VN')}</span>
              </summary>
              <pre className="bg-gray-900 text-gray-100 text-xs p-3 overflow-auto max-h-72 whitespace-pre-wrap">{l.code}</pre>
            </details>
          ))}
        </div>
      )}
      {exam.practical_type === 'scratch' && selectedSession.practical_file_url && (
        <div className="space-y-2">
          <a href={selectedSession.practical_file_url} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-indigo-600 font-semibold hover:underline"><ExternalLink size={13} />Tải file {selectedSession.practical_file_name || ''}</a>
          <Sb3Viewer url={selectedSession.practical_file_url} />
        </div>
      )}
      {exam.practical_type !== 'python' && selectedSession.practical_file_url && (
        <div className="space-y-2">
          <button onClick={aiChamNhap} disabled={aiDang}
            className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg border border-violet-300 text-violet-700 hover:bg-violet-50 disabled:opacity-50">
            {aiDang ? <Loader2 size={14} className="animate-spin" /> : <Bot size={14} />} AI chấm nháp theo tiêu chí
          </button>
          {selectedSession.practical_ai?.breakdown?.length > 0 && (
            <ul className="text-xs grid sm:grid-cols-2 gap-x-4 gap-y-0.5 bg-gray-50 rounded-lg p-2">
              {selectedSession.practical_ai.breakdown.map((b, i) => (
                <li key={i} className="flex gap-1.5"><span>{Number(b.earned) >= Number(b.max) ? '✅' : '⚠️'}</span>
                  <span className="text-gray-700">{b.criterion}{b.note && <span className="text-gray-400"> — {b.note}</span>}</span></li>
              ))}
            </ul>
          )}
          {selectedSession.practical_ai && <p className="text-[11px] text-gray-500">AI gợi ý {selectedSession.practical_ai.score} điểm — chỉ thầy cô thấy; học sinh thấy điểm thầy cô lưu.</p>}
        </div>
      )}
      {exam.practical_type === 'word' && (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <WordEditor content={selectedSession.practical_content} readonly />
        </div>
      )}
      {exam.practical_type === 'ppt' && (
        <PPTEditor content={selectedSession.practical_content} readonly />
      )}

      {/* Grading form */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
        <p className="text-sm font-semibold text-gray-700">Chấm điểm thực hành</p>
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600 shrink-0">Điểm (0–10):</label>
          <input
            type="number" min={0} max={10} step={0.5}
            value={practicalScore}
            onChange={e => setPracticalScore(e.target.value)}
            placeholder="VD: 8.5"
            className="w-24 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {selectedSession.practical_score != null && (
            <span className="text-sm text-gray-400">Hiện tại: <b className="text-orange-600">{selectedSession.practical_score}</b></span>
          )}
        </div>
        <textarea
          value={practicalComment}
          onChange={e => setPracticalComment(e.target.value)}
          rows={3}
          placeholder="Nhận xét phần thực hành..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
        <button
          onClick={savePractical}
          disabled={savingPractical}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition"
        >
          {savingPractical ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
          Lưu điểm thực hành
        </button>
      </div>
    </div>
  )}

  {exam.has_practical && !selectedSession.practical_content && !selectedSession.practical_file_url && nopPython.length === 0 && (
    <p className="text-sm text-gray-400 italic pt-2 border-t border-gray-100">Học sinh chưa nộp phần thực hành</p>
  )}
    </>
  )
}
