import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { adjustStickerCount } from '../../../utils/stickerAward'
import { MUC, CAC_MUC, mucTuDiem, stickerTheoMuc, DIEM_DAI_DIEN } from '../../../utils/muc'
import toast from 'react-hot-toast'
import { Loader2, Check, Pencil, ExternalLink } from 'lucide-react'

const REASONS = {
  empty: { label: 'Bài gần như trống mà AI chấm đạt', cls: 'bg-red-100 text-red-700' },
  suspect: { label: 'Nghi dùng AI viết hộ', cls: 'bg-orange-100 text-orange-700' },
  low: { label: 'AI gợi ý mức C', cls: 'bg-amber-100 text-amber-700' },
  first: { label: '3 bài đầu AI chấm của bài học', cls: 'bg-blue-100 text-blue-700' },
  sample: { label: 'Mẫu ngẫu nhiên (đo độ chính xác)', cls: 'bg-gray-100 text-gray-700' },
  normal: { label: 'Bài bình thường', cls: 'bg-green-100 text-green-700' },
}
// Nhóm được phép "đồng ý cả trang" — nhóm cảnh báo (trống, nghi gian lận, mức C) phải xem từng bài
const BULK_OK = ['normal', 'first', 'sample']

// Duyệt 1 bài: đồng ý mức AI gợi ý (edit=false) hoặc lưu mức giáo viên chọn. Học sinh chỉ thấy MỨC (T/H/C), không thấy điểm.
// Sticker khi duyệt theo mức: T = 3, H = 1, C = 0.
async function saveReview(item, { edit = false, muc, comment, allowResubmit = false } = {}) {
  const goiY = mucTuDiem(item.score)
  const newMuc = edit ? muc : (item.muc || goiY)
  const awardSticker = !item.sticker_awarded && newMuc != null
  const updates = {
    reviewed_at: new Date().toISOString(),
    muc: newMuc,
    // Bài AI chấm trước khi có cột ai_score: điểm hiện tại CHÍNH LÀ điểm AI gốc → lưu lại để đo độ khớp
    ai_score: Number(item.score),
    ...(edit && {
      teacher_comment: comment, graded_by: 'teacher',
      // đổi mức khác gợi ý → điểm nội bộ theo mức mới (báo cáo cũ dùng điểm vẫn hợp lý)
      ...(newMuc !== goiY && { score: DIEM_DAI_DIEN[newMuc] }),
    }),
    ...(awardSticker && { sticker_awarded: true }),
    // Bài chấm tay mặc định bị khoá nộp lại → mở khoá khi thầy/cô yêu cầu học sinh làm lại
    ...(allowResubmit && { allow_resubmit: true }),
  }
  const { error } = await supabase.from('lesson_submissions').update(updates).eq('id', item.id)
  if (error) { toast.error('Lưu thất bại: ' + error.message); return false }
  if (awardSticker) {
    const bonus = stickerTheoMuc(newMuc)
    if (bonus > 0) {
      const { error: e } = await adjustStickerCount(item.user_id, bonus, { affectsTotal: true })
      if (e) toast.error('Không cộng được sticker: ' + e.message)
    }
  }
  return true
}

function ChonMuc({ value, onChange, disabled }) {
  return (
    <span className="inline-flex gap-1">
      {CAC_MUC.map(m => (
        <button key={m} type="button" disabled={disabled} onClick={() => onChange(m)} title={MUC[m].ten}
          className={`w-9 h-8 rounded-lg font-black text-sm border ${value === m ? MUC[m].nut + ' border-transparent' : 'bg-white text-gray-600 border-gray-300'}`}>{m}</button>
      ))}
    </span>
  )
}

function ReviewCard({ item, onDone, selected, onToggle }) {
  const [editing, setEditing] = useState(false)
  const goiY = item.muc || mucTuDiem(item.score)
  const [muc, setMuc] = useState(goiY || 'H')
  const [comment, setComment] = useState(item.teacher_comment || '')
  const [saving, setSaving] = useState(false)
  const taskIdx = item.content_json?.task_index ?? 0

  async function save(edit) {
    setSaving(true)
    const ok = await saveReview(item, { edit, muc, comment })
    if (!ok) { setSaving(false); return }
    toast.success(edit ? `Đã lưu mức ${muc}` : `Đã đồng ý mức ${goiY}`)
    onDone(item)
  }

  const reason = REASONS[item.reason] || REASONS.sample
  return (
    <div className={`bg-white border rounded-xl p-4 space-y-2 ${selected ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-gray-200'}`}>
      <div className="flex items-start gap-2 flex-wrap">
        <input type="checkbox" checked={selected} onChange={() => onToggle(item.id)}
          className="mt-1 w-4 h-4 accent-indigo-600 cursor-pointer" title="Chọn bài này để đặt mức hàng loạt" />
        <div className="flex-1 min-w-0">
          <div className="font-bold text-gray-800">{item.student_name}</div>
          <div className="text-xs text-gray-500">{item.lesson_title} · bài {taskIdx + 1} · {item.grade} · nộp {new Date(item.submitted_at).toLocaleDateString('vi-VN')}</div>
        </div>
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${reason.cls}`}>{reason.label}</span>
        {goiY && <span className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${MUC[goiY].cls}`} title="Mức AI gợi ý">AI gợi ý: {goiY} · {MUC[goiY].ten}</span>}
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
                <td className={`py-1 text-right font-semibold whitespace-nowrap ${b.earned < b.max ? 'text-amber-600' : 'text-green-600'}`}>{b.earned >= b.max ? '✓ đạt' : '⚠ chưa đủ'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {editing ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            Mức: <ChonMuc value={muc} onChange={setMuc} /> <span className="text-xs text-gray-500">{MUC[muc]?.ten}</span>
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
              className="text-sm px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold disabled:opacity-50">Lưu mức {muc}</button>
          </>
        ) : (
          <>
            <button onClick={() => setEditing(true)} disabled={saving}
              className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"><Pencil size={13} /> Sửa mức / nhận xét</button>
            <button onClick={() => save(false)} disabled={saving}
              className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold disabled:opacity-50">
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Đồng ý mức {goiY || ''}
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

export default function ReviewTab({ summary, onChanged, loc = {} }) {
  const [reason, setReason] = useState(null)
  const [locMuc, setLocMuc] = useState(null)   // lọc theo mức AI gợi ý: null | 'T' | 'H' | 'C'
  const [items, setItems] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [bulk, setBulk] = useState(false)
  const [progress, setProgress] = useState('')
  const [pageSize, setPageSize] = useState(readPageSize)
  const [selected, setSelected] = useState(() => new Set())
  const [bulkMuc, setBulkMuc] = useState('C')
  const [bulkComment, setBulkComment] = useState(EMPTY_COMMENT)
  const [bulkResubmit, setBulkResubmit] = useState(true)

  function pickReason(r) {
    setReason(r); setItems(null)
    // Nhóm "bài gần như trống" thường cho mức C kèm lời nhắc nộp lại; nhóm khác để thầy/cô tự gõ
    setBulkComment(r === 'empty' ? EMPTY_COMMENT : '')
    setBulkResubmit(r === 'empty')
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
    if (!confirm(`Đồng ý mức AI gợi ý cho ${items.length} bài đang hiện? Thầy/cô nên lướt qua trước khi đồng ý.`)) return
    await runBulk(items, {}, ok => `Đã duyệt ${ok} bài`)
  }

  // Đặt cùng một mức (và nhận xét) cho các bài đã chọn — dùng ở mọi nhóm, hay dùng nhất là "bài gần như trống"
  async function setMucSelected() {
    const list = items.filter(i => selected.has(i.id))
    if (!list.length) { toast.error('Chưa chọn bài nào'); return }
    const nx = bulkComment.trim()
    if (!confirm(`Đặt mức ${bulkMuc} (${MUC[bulkMuc].ten}) cho ${list.length} bài đã chọn?` + (nx ? '\nNhận xét gửi học sinh: ' + nx : '') + (bulkResubmit ? '\nHọc sinh được nộp lại bài.' : ''))) return
    await runBulk(list, { edit: true, muc: bulkMuc, comment: nx, allowResubmit: bulkResubmit }, ok => `Đã đặt mức ${bulkMuc} cho ${ok} bài`)
  }

  useEffect(() => {
    if (loc.lop && !loc.hsLop) return   // đang tải danh sách lớp
    setItems(null)
    supabase.rpc('ai_review_queue', { p_reason: reason, p_limit: pageSize, p_grade: loc.grade, p_class: loc.lop, p_muc: locMuc }).then(({ data, error }) => {
      if (error) { toast.error('Không tải được hàng đợi duyệt'); setItems([]) } else setItems(data || [])
      setSelected(new Set())
    })
  }, [reason, reloadKey, pageSize, loc.grade, loc.lop, loc.hsLop, locMuc])   // eslint-disable-line react-hooks/exhaustive-deps

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
        Nhóm <b>cảnh báo</b> nên xem từng bài; nhóm <b>bài bình thường</b> có thể lướt rồi đồng ý cả trang. Học sinh chỉ thấy <b>mức T/H/C</b> và nhận xét sau khi thầy/cô duyệt (không thấy điểm). Sticker khi duyệt: T = 3, H = 1, C = 0.
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
        <span className="text-gray-600">Mức AI gợi ý:</span>
        {[null, ...CAC_MUC].map(m => (
          <button key={m || 'all'} onClick={() => { setLocMuc(m); setItems(null) }} disabled={bulk} title={m ? MUC[m].ten : 'Mọi mức'}
            className={`text-xs font-semibold px-3 py-1 rounded-full border ${locMuc === m ? (m ? MUC[m].nut + ' border-transparent' : 'bg-gray-800 text-white border-gray-800') : 'bg-white text-gray-600 border-gray-300'}`}>
            {m ? `${m} · ${MUC[m].ten}` : 'Tất cả'}
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
            Đặt mức <ChonMuc value={bulkMuc} onChange={setBulkMuc} disabled={bulk} />
          </span>
          <input value={bulkComment} onChange={e => setBulkComment(e.target.value)} disabled={bulk}
            placeholder="Nhận xét gửi học sinh (để trống nếu không cần)"
            className="flex-1 min-w-[200px] border border-gray-300 rounded-lg px-2 py-1" />
          <label className="flex items-center gap-1 text-indigo-800 cursor-pointer" title="Bài thầy/cô chấm tay mặc định bị khoá; tích ô này để học sinh vẫn nộp lại được">
            <input type="checkbox" checked={bulkResubmit} onChange={e => setBulkResubmit(e.target.checked)} disabled={bulk} className="w-4 h-4 accent-indigo-600" />
            Cho phép nộp lại
          </label>
          <button onClick={setMucSelected} disabled={bulk || selected.size === 0}
            className="flex items-center gap-1 font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg disabled:opacity-50">
            {bulk ? <Loader2 size={13} className="animate-spin" /> : <Pencil size={13} />} Đặt mức {bulkMuc} cho {selected.size} bài
          </button>
          {progress && <span className="w-full text-xs text-indigo-700">{progress}</span>}
        </div>
      )}
      {BULK_OK.includes(reason) && items?.length > 0 && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
          <p className="text-sm text-green-800 flex-1">Lướt qua các bài bên dưới; nếu mức AI gợi ý đều hợp lý, đồng ý cả trang một lần.</p>
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
