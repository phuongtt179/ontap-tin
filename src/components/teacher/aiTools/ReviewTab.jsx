import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { adjustStickerCount, scoreToBonus } from '../../../utils/stickerAward'
import toast from 'react-hot-toast'
import { Loader2, Check, Pencil, ExternalLink } from 'lucide-react'

const REASONS = {
  empty: { label: 'Bài gần như trống mà có điểm', cls: 'bg-red-100 text-red-700' },
  suspect: { label: 'Nghi dùng AI viết hộ', cls: 'bg-orange-100 text-orange-700' },
  low: { label: 'Điểm dưới 5', cls: 'bg-amber-100 text-amber-700' },
  first: { label: '3 bài đầu AI chấm của bài học', cls: 'bg-blue-100 text-blue-700' },
  sample: { label: 'Mẫu ngẫu nhiên (đo độ chính xác)', cls: 'bg-gray-100 text-gray-700' },
  normal: { label: 'Bài bình thường', cls: 'bg-green-100 text-green-700' },
}
// Nhóm được phép "đồng ý cả trang" — nhóm cảnh báo (trống, nghi gian lận, điểm thấp) phải xem từng bài
const BULK_OK = ['normal', 'first', 'sample']

// Duyệt 1 bài: đồng ý điểm AI (edit=false) hoặc lưu điểm giáo viên sửa. Cộng sticker như luồng duyệt cũ.
async function saveReview(item, { edit = false, score, comment } = {}) {
  const newScore = edit ? score : Number(item.score)
  const awardSticker = !item.sticker_awarded && newScore != null
  const updates = {
    reviewed_at: new Date().toISOString(),
    // Bài AI chấm trước khi có cột ai_score: điểm hiện tại CHÍNH LÀ điểm AI gốc → lưu lại để đo độ khớp
    ai_score: Number(item.score),
    ...(edit && { score: newScore, teacher_comment: comment, graded_by: 'teacher' }),
    ...(awardSticker && { sticker_awarded: true }),
  }
  const { error } = await supabase.from('lesson_submissions').update(updates).eq('id', item.id)
  if (error) { toast.error('Lưu thất bại: ' + error.message); return false }
  if (awardSticker) {
    const bonus = scoreToBonus(newScore)
    if (bonus > 0) {
      const { error: e } = await adjustStickerCount(item.user_id, bonus, { affectsTotal: true })
      if (e) toast.error('Không cộng được sticker: ' + e.message)
    }
  }
  return true
}

function ReviewCard({ item, onDone, selected, onToggle }) {
  const [editing, setEditing] = useState(false)
  const [score, setScore] = useState(String(item.score ?? ''))
  const [comment, setComment] = useState(item.teacher_comment || '')
  const [saving, setSaving] = useState(false)
  const taskIdx = item.content_json?.task_index ?? 0

  async function save(edit) {
    const newScore = edit ? parseFloat(score) : Number(item.score)
    if (edit && (isNaN(newScore) || newScore < 0 || newScore > 10)) { toast.error('Điểm từ 0 đến 10'); return }
    setSaving(true)
    const ok = await saveReview(item, { edit, score: newScore, comment })
    if (!ok) { setSaving(false); return }
    toast.success(edit ? 'Đã lưu điểm sửa' : 'Đã đồng ý điểm AI')
    onDone(item)
  }

  const reason = REASONS[item.reason] || REASONS.sample
  return (
    <div className={`bg-white border rounded-xl p-4 space-y-2 ${selected ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-gray-200'}`}>
      <div className="flex items-start gap-2 flex-wrap">
        <input type="checkbox" checked={selected} onChange={() => onToggle(item.id)}
          className="mt-1 w-4 h-4 accent-indigo-600 cursor-pointer" title="Chọn bài này để đặt điểm hàng loạt" />
        <div className="flex-1 min-w-0">
          <div className="font-bold text-gray-800">{item.student_name}</div>
          <div className="text-xs text-gray-500">{item.lesson_title} · bài {taskIdx + 1} · {item.grade} · nộp {new Date(item.submitted_at).toLocaleDateString('vi-VN')}</div>
        </div>
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${reason.cls}`}>{reason.label}</span>
        <span className="text-xl font-black text-violet-600">{item.score}</span>
      </div>

      {item.ai_suspect_reason && <p className="text-xs text-orange-700 bg-orange-50 rounded px-2 py-1">AI nghi ngờ: {item.ai_suspect_reason}</p>}

      <div className="text-xs bg-gray-50 rounded-lg p-2 max-h-40 overflow-y-auto">
        {item.file_url ? (
          <a href={item.file_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-indigo-600 font-semibold hover:underline">
            <ExternalLink size={12} /> Mở file bài làm {item.file_name ? `(${item.file_name})` : ''}
          </a>
        ) : null}
        {item.text_content
          ? <pre className="whitespace-pre-wrap font-mono text-gray-700 mt-1">{item.text_content}</pre>
          : !item.file_url && <span className="text-red-600 font-semibold">Không có file và không có nội dung gõ.</span>}
      </div>

      {Array.isArray(item.ai_breakdown) && item.ai_breakdown.length > 0 && (
        <table className="w-full text-xs">
          <tbody>
            {item.ai_breakdown.map((b, i) => (
              <tr key={i} className="border-t border-gray-100">
                <td className="py-1 pr-2 text-gray-700">{b.criterion}{b.note && <div className="text-gray-400">{b.note}</div>}</td>
                <td className={`py-1 text-right font-semibold whitespace-nowrap ${b.earned < b.max ? 'text-amber-600' : 'text-green-600'}`}>{b.earned}/{b.max}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {editing ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            Điểm: <input type="number" min="0" max="10" step="0.5" value={score} onChange={e => setScore(e.target.value)}
              className="w-20 border border-gray-300 rounded-lg px-2 py-1" />
          </div>
          <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3}
            className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm" placeholder="Nhận xét cho học sinh" />
        </div>
      ) : (
        item.teacher_comment && <p className="text-sm text-gray-600"><b className="text-gray-500 text-xs">Nhận xét AI:</b> {item.teacher_comment}</p>
      )}

      <div className="flex gap-2 justify-end">
        {editing ? (
          <>
            <button onClick={() => setEditing(false)} className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600">Huỷ</button>
            <button onClick={() => save(true)} disabled={saving}
              className="text-sm px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold disabled:opacity-50">Lưu điểm sửa</button>
          </>
        ) : (
          <>
            <button onClick={() => setEditing(true)} disabled={saving}
              className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"><Pencil size={13} /> Sửa điểm</button>
            <button onClick={() => save(false)} disabled={saving}
              className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold disabled:opacity-50">
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Đồng ý điểm AI
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// Số bài mỗi trang — máy chủ (ai_review_queue) cho tối đa 100
const PAGE_SIZES = [20, 50, 100]
const EMPTY_COMMENT = 'Bài nộp gần như trống nên thầy/cô chưa chấm được. Em làm lại và nộp bài đầy đủ nhé!'

function readPageSize() {
  try { const n = Number(localStorage.getItem('aiReviewPageSize')); return PAGE_SIZES.includes(n) ? n : 20 } catch { return 20 }
}

export default function ReviewTab({ summary, onChanged }) {
  const [reason, setReason] = useState(null)
  const [items, setItems] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [bulk, setBulk] = useState(false)
  const [progress, setProgress] = useState('')
  const [pageSize, setPageSize] = useState(readPageSize)
  const [selected, setSelected] = useState(() => new Set())
  const [bulkScore, setBulkScore] = useState('0')
  const [bulkComment, setBulkComment] = useState(EMPTY_COMMENT)

  function pickReason(r) {
    setReason(r); setItems(null)
    // Nhóm "bài gần như trống" thường cho 0 điểm kèm lời nhắc nộp lại; nhóm khác để thầy/cô tự gõ
    setBulkComment(r === 'empty' ? EMPTY_COMMENT : '')
  }

  function changePageSize(n) {
    setPageSize(n); setItems(null)
    try { localStorage.setItem('aiReviewPageSize', String(n)) } catch { /* trình duyệt chặn lưu — không sao */ }
  }

  function toggle(id) {
    setSelected(prev => { const s = new Set(prev); if (s.has(id)) s.delete(id); else s.add(id); return s })
  }
  const allSelected = items?.length > 0 && items.every(i => selected.has(i.id))
  function toggleAll() { setSelected(allSelected ? new Set() : new Set(items.map(i => i.id))) }

  // Lưu lần lượt từng bài (không chạy song song: sticker của cùng một học sinh không được cộng chồng lên nhau)
  async function runBulk(list, opts, doneMsg) {
    setBulk(true)
    let ok = 0
    for (let i = 0; i < list.length; i++) {
      setProgress(`Đang lưu ${i + 1}/${list.length}...`)
      if (await saveReview(list[i], opts)) ok++
    }
    setBulk(false); setProgress('')
    toast.success(doneMsg(ok))
    setItems(null); setReloadKey(k => k + 1)
    onChanged?.()
  }

  // Duyệt cả trang — chỉ cho nhóm an toàn (bài bình thường, bài đầu, mẫu ngẫu nhiên)
  async function approvePage() {
    if (!confirm(`Đồng ý điểm AI cho ${items.length} bài đang hiện? Thầy/cô nên lướt qua trước khi đồng ý.`)) return
    await runBulk(items, {}, ok => `Đã duyệt ${ok} bài`)
  }

  // Đặt cùng một điểm (và nhận xét) cho các bài đã chọn — dùng ở mọi nhóm, hay dùng nhất là "bài gần như trống"
  async function setScoreSelected() {
    const list = items.filter(i => selected.has(i.id))
    const score = parseFloat(bulkScore)
    if (!list.length) { toast.error('Chưa chọn bài nào'); return }
    if (isNaN(score) || score < 0 || score > 10) { toast.error('Điểm từ 0 đến 10'); return }
    if (!confirm(`Đặt ${score} điểm cho ${list.length} bài đã chọn?${bulkComment.trim() ? '\nNhận xét gửi học sinh: ' + bulkComment.trim() : ''}`)) return
    await runBulk(list, { edit: true, score, comment: bulkComment.trim() }, ok => `Đã đặt ${score} điểm cho ${ok} bài`)
  }

  useEffect(() => {
    supabase.rpc('ai_review_queue', { p_reason: reason, p_limit: pageSize }).then(({ data, error }) => {
      if (error) { toast.error('Không tải được hàng đợi duyệt'); setItems([]) } else setItems(data || [])
      setSelected(new Set())
    })
  }, [reason, reloadKey, pageSize])

  function handleDone(item) {
    setItems(prev => prev.filter(i => i.id !== item.id))
    setSelected(prev => { const s = new Set(prev); s.delete(item.id); return s })
    onChanged?.()
  }

  const counts = summary?.review || {}
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Có <b>{(summary?.ai_unreviewed ?? 0).toLocaleString('vi-VN')}</b> bài AI đã chấm nhưng chưa được thầy/cô xem lại.
        Nhóm <b>cảnh báo</b> nên xem từng bài; nhóm <b>bài bình thường</b> có thể lướt rồi đồng ý cả trang. Học sinh chỉ thấy điểm AI chấm sau khi thầy/cô duyệt.
        Mỗi bài thầy/cô đồng ý hoặc sửa điểm sẽ được dùng để đo độ chính xác của AI (trang Báo cáo tác động).
      </p>
      <div className="flex flex-wrap gap-2">
        <button onClick={() => pickReason(null)}
          className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${reason === null ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-300'}`}>
          Theo mức ưu tiên
        </button>
        {Object.entries(REASONS).map(([k, r]) => (
          <button key={k} onClick={() => pickReason(k)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${reason === k ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-300'}`}>
            {r.label} ({(counts[k] ?? 0).toLocaleString('vi-VN')})
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-gray-600">Mỗi trang:</span>
        {PAGE_SIZES.map(n => (
          <button key={n} onClick={() => changePageSize(n)} disabled={bulk}
            className={`text-xs font-semibold px-3 py-1 rounded-full border ${pageSize === n ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-300'}`}>
            {n} bài
          </button>
        ))}
      </div>
      {items?.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-xl px-3 py-2 text-sm">
          <label className="flex items-center gap-1.5 font-semibold text-indigo-800 cursor-pointer">
            <input type="checkbox" checked={allSelected} onChange={toggleAll} disabled={bulk} className="w-4 h-4 accent-indigo-600" />
            Chọn tất cả ({items.length})
          </label>
          <span className="text-indigo-700">· Đã chọn <b>{selected.size}</b></span>
          <span className="ml-auto flex items-center gap-1">
            Đặt điểm
            <input type="number" min="0" max="10" step="0.5" value={bulkScore} onChange={e => setBulkScore(e.target.value)} disabled={bulk}
              className="w-16 border border-gray-300 rounded-lg px-2 py-1" />
          </span>
          <input value={bulkComment} onChange={e => setBulkComment(e.target.value)} disabled={bulk}
            placeholder="Nhận xét gửi học sinh (để trống nếu không cần)"
            className="flex-1 min-w-[200px] border border-gray-300 rounded-lg px-2 py-1" />
          <button onClick={setScoreSelected} disabled={bulk || selected.size === 0}
            className="flex items-center gap-1 font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg disabled:opacity-50">
            {bulk ? <Loader2 size={13} className="animate-spin" /> : <Pencil size={13} />} Đặt điểm cho {selected.size} bài
          </button>
          {progress && <span className="w-full text-xs text-indigo-700">{progress}</span>}
        </div>
      )}
      {BULK_OK.includes(reason) && items?.length > 0 && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
          <p className="text-sm text-green-800 flex-1">Lướt qua các bài bên dưới; nếu điểm AI đều hợp lý, đồng ý cả trang một lần.</p>
          <button onClick={approvePage} disabled={bulk}
            className="flex items-center gap-1 text-sm font-semibold bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg disabled:opacity-50">
            {bulk ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Đồng ý cả trang ({items.length} bài)
          </button>
        </div>
      )}
      {items === null ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-indigo-400" /></div>
      ) : items.length === 0 ? (
        <p className="text-center text-gray-400 py-10">Không còn bài nào trong nhóm này 🎉</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {items.map(it => <ReviewCard key={it.id} item={it} onDone={handleDone} selected={selected.has(it.id)} onToggle={toggle} />)}
        </div>
      )}
    </div>
  )
}
