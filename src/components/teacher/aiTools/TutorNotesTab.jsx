import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../../lib/supabase'
import { useGrades } from '../../../hooks/useGrades'
import { extractSlideText } from '../../../utils/slideText'
import toast from 'react-hot-toast'
import { Loader2, Sparkles, Save, Square } from 'lucide-react'

async function draftNotes(lesson) {
  const isPdf = lesson.pptx_url.split('?')[0].toLowerCase().endsWith('.pdf')
  const slidesText = await extractSlideText(lesson.pptx_url).catch(() => '')
  // PDF xuất dạng ảnh không có chữ → máy chủ gửi nguyên file PDF cho AI đọc bằng thị giác
  if (slidesText.trim().length < 40 && !isPdf) throw new Error('Không đọc được chữ trong slide (slide toàn ảnh)')
  const res = await fetch('/api/teacher-ai', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'lesson_notes', title: lesson.title, grade: lesson.grade, topic: lesson.topic, slidesText,
      ...(isPdf && { pdfUrl: lesson.pptx_url }),
    }),
  })
  const data = await res.json().catch(() => ({}))
  if (res.status === 429) { const e = new Error('AI hết lượt, thử lại sau'); e.quota = data.error; throw e }
  if (!res.ok || !data.notes) throw new Error('AI chưa soạn được')
  if (/KHÔNG ĐỦ NỘI DUNG/.test(data.notes)) throw new Error('Slide không đủ nội dung để soạn')
  return data.notes
}

export default function TutorNotesTab() {
  const { grades } = useGrades()
  const [pickedGrade, setPickedGrade] = useState('')
  const grade = pickedGrade || grades[0] || ''
  const [onlyMissing, setOnlyMissing] = useState(true)
  const [lessons, setLessons] = useState(null)
  const [drafts, setDrafts] = useState({})   // lessonId -> text (bản nháp chưa lưu)
  const [busy, setBusy] = useState({})       // lessonId -> 'draft' | 'save'
  const [errors, setErrors] = useState({})
  const [batchRunning, setBatchRunning] = useState(false)
  const stopRef = useRef(false)

  useEffect(() => {
    if (!grade) return
    supabase.from('lessons').select('id, title, grade, topic, pptx_url, ai_context, ai_tutor_notes')
      .eq('grade', grade).eq('is_published', true).not('pptx_url', 'is', null).order('order')
      .then(({ data }) => setLessons(data || []))
  }, [grade])

  const shown = (lessons || []).filter(l => !onlyMissing || (!l.ai_context?.trim() && !l.ai_tutor_notes?.trim()))
  const hasNotes = l => !!l.ai_tutor_notes?.trim()

  async function makeDraft(l) {
    setBusy(b => ({ ...b, [l.id]: 'draft' })); setErrors(e => ({ ...e, [l.id]: null }))
    try {
      const notes = await draftNotes(l)
      setDrafts(d => ({ ...d, [l.id]: notes }))
      return true
    } catch (err) {
      setErrors(e => ({ ...e, [l.id]: err.message }))
      if (err.quota === 'quota_rpd') throw err
      return false
    } finally {
      setBusy(b => ({ ...b, [l.id]: null }))
    }
  }

  async function save(l, text) {
    setBusy(b => ({ ...b, [l.id]: 'save' }))
    const value = text.trim() || null
    const { error } = await supabase.from('lessons').update({ ai_tutor_notes: value }).eq('id', l.id)
    setBusy(b => ({ ...b, [l.id]: null }))
    if (error) { toast.error('Lưu thất bại: ' + error.message); return false }
    setLessons(ls => ls.map(x => x.id === l.id ? { ...x, ai_tutor_notes: value } : x))
    setDrafts(d => { const n = { ...d }; delete n[l.id]; return n })
    return true
  }

  async function draftAll() {
    stopRef.current = false; setBatchRunning(true)
    const todo = shown.filter(l => !hasNotes(l) && drafts[l.id] == null)
    try {
      for (let i = 0; i < todo.length && !stopRef.current; i++) {
        await makeDraft(todo[i])
        if (i < todo.length - 1) await new Promise(r => setTimeout(r, 4000))
      }
    } catch { toast.error('AI hết lượt hôm nay — dừng soạn hàng loạt') }
    setBatchRunning(false)
  }

  async function saveAllDrafts() {
    const ids = Object.keys(drafts)
    if (!ids.length || !confirm(`Lưu ${ids.length} bản nháp? Thầy/cô nên đọc qua từng bản trước khi lưu.`)) return
    let ok = 0
    for (const id of ids) {
      const l = lessons.find(x => x.id === id)
      if (l && await save(l, drafts[id])) ok++
    }
    toast.success(`Đã lưu ${ok} bài`)
  }

  const missingCount = (lessons || []).filter(l => !l.ai_context?.trim() && !l.ai_tutor_notes?.trim()).length
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Gia sư AI trả lời câu hỏi lý thuyết dựa trên nội dung bài. Nhiều bài chỉ có slide nên gia sư <b>không biết bài dạy gì</b>.
        AI sẽ đọc slide (.pptx/.pdf) và soạn <b>ghi chú riêng cho gia sư</b> — học sinh không thấy ghi chú này, không làm thay đổi bước học của bài.
        Thầy/cô đọc, sửa nếu cần, rồi bấm Lưu.
      </p>
      <div className="flex flex-wrap items-center gap-3 bg-white border border-gray-200 rounded-xl p-3">
        <select value={grade} onChange={e => { setPickedGrade(e.target.value); setLessons(null) }} className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm">
          {grades.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        <label className="text-sm flex items-center gap-1.5">
          <input type="checkbox" checked={onlyMissing} onChange={e => setOnlyMissing(e.target.checked)} /> Chỉ bài gia sư chưa có nội dung
        </label>
        {lessons && <span className="text-sm text-gray-500">{missingCount} bài thiếu nội dung</span>}
        <div className="ml-auto flex gap-2">
          {batchRunning ? (
            <button onClick={() => { stopRef.current = true }} className="flex items-center gap-1 text-sm font-semibold bg-red-600 text-white px-3 py-1.5 rounded-lg"><Square size={13} /> Dừng</button>
          ) : (
            <button onClick={draftAll} disabled={!shown.some(l => !hasNotes(l))}
              className="flex items-center gap-1 text-sm font-semibold bg-violet-600 hover:bg-violet-700 text-white px-3 py-1.5 rounded-lg disabled:opacity-50"><Sparkles size={13} /> Soạn nháp hàng loạt</button>
          )}
          {Object.keys(drafts).length > 0 && (
            <button onClick={saveAllDrafts} className="flex items-center gap-1 text-sm font-semibold bg-green-600 text-white px-3 py-1.5 rounded-lg">
              <Save size={13} /> Lưu {Object.keys(drafts).length} bản nháp
            </button>
          )}
        </div>
      </div>

      {lessons === null ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-indigo-400" /></div>
      ) : shown.length === 0 ? (
        <p className="text-center text-gray-400 py-10">Không có bài nào cần soạn 🎉</p>
      ) : (
        <div className="space-y-3">
          {shown.map(l => {
            const draft = drafts[l.id]
            const editingText = draft ?? l.ai_tutor_notes ?? ''
            const isPdf = l.pptx_url.split('?')[0].toLowerCase().endsWith('.pdf')
            return (
              <div key={l.id} className="bg-white border border-gray-200 rounded-xl p-3 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-800 flex-1 min-w-0">{l.title}</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{isPdf ? 'PDF' : 'PPTX'}</span>
                  {l.ai_context?.trim() && <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Có lý thuyết GV</span>}
                  {hasNotes(l) && draft == null && <span className="text-[11px] px-2 py-0.5 rounded-full bg-green-100 text-green-700">Đã có ghi chú gia sư</span>}
                  {draft != null && <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Bản nháp chưa lưu</span>}
                  <button onClick={() => makeDraft(l)} disabled={!!busy[l.id] || batchRunning}
                    className="flex items-center gap-1 text-xs font-semibold border border-violet-300 text-violet-700 px-2.5 py-1 rounded-lg hover:bg-violet-50 disabled:opacity-50">
                    {busy[l.id] === 'draft' ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                    {hasNotes(l) || draft != null ? 'Soạn lại' : 'AI soạn từ slide'}
                  </button>
                </div>
                {errors[l.id] && <p className="text-xs text-red-600">{errors[l.id]}</p>}
                {(draft != null || hasNotes(l)) && (
                  <>
                    <textarea value={editingText} rows={8}
                      onChange={e => setDrafts(d => ({ ...d, [l.id]: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm font-mono" />
                    {draft != null && (
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setDrafts(d => { const n = { ...d }; delete n[l.id]; return n })}
                          className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600">Bỏ nháp</button>
                        <button onClick={async () => { if (await save(l, draft)) toast.success('Đã lưu') }} disabled={busy[l.id] === 'save'}
                          className="flex items-center gap-1 text-xs font-semibold bg-green-600 text-white px-3 py-1.5 rounded-lg disabled:opacity-50"><Save size={12} /> Lưu</button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
