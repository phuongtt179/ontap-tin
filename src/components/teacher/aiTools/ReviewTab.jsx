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

function ReviewCard({ item, onDone }) {
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
    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
      <div className="flex items-start gap-2 flex-wrap">
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

export default function ReviewTab({ summary, onChanged }) {
  const [reason, setReason] = useState(null)
  const [items, setItems] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [bulk, setBulk] = useState(false)

  function pickReason(r) { setReason(r); setItems(null) }

  // Duyệt cả trang — chỉ cho nhóm an toàn (bài bình thường, bài đầu, mẫu ngẫu nhiên)
  async function approvePage() {
    if (!confirm(`Đồng ý điểm AI cho ${items.length} bài đang hiện? Thầy/cô nên lướt qua trước khi đồng ý.`)) return
    setBulk(true)
    let ok = 0
    for (const it of items) if (await saveReview(it)) ok++
    setBulk(false)
    toast.success(`Đã duyệt ${ok} bài`)
    setItems(null); setReloadKey(k => k + 1)
    onChanged?.()
  }

  useEffect(() => {
    supabase.rpc('ai_review_queue', { p_reason: reason, p_limit: 20 }).then(({ data, error }) => {
      if (error) { toast.error('Không tải được hàng đợi duyệt'); setItems([]) } else setItems(data || [])
    })
  }, [reason, reloadKey])

  function handleDone(item) {
    setItems(prev => prev.filter(i => i.id !== item.id))
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
          {items.map(it => <ReviewCard key={it.id} item={it} onDone={handleDone} />)}
        </div>
      )}
    </div>
  )
}
