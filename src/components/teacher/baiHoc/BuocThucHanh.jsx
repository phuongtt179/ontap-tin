// Bước 3 của form bài học: các bài thực hành (chuyển qua lại từng bài, thêm / xoá, dán nhiều bài một lúc tự tách).
// Chỉ sửa form.practice_tasks của form cha; bài đang mở (currentTaskIdx) do form cha giữ vì AI soạn xong cũng đặt lại.
import { useState } from 'react'
import toast from 'react-hot-toast'
import { Plus, ClipboardList } from 'lucide-react'
import TaskEditor from './TaskEditor'
import { parsePracticeTasks } from '../../../utils/practiceTaskParser'
import { baiCoNoiDung } from '../../../domain/baiThucHanh'

export default function BuocThucHanh({ form, setForm, currentTaskIdx, setCurrentTaskIdx }) {
  const [showBulkPaste, setShowBulkPaste] = useState(false)
  const [bulkText, setBulkText] = useState('')

  function addTask() {
    setForm(f => {
      const next = [...f.practice_tasks, { instructions: '', instruction_file_url: '' }]
      setCurrentTaskIdx(next.length - 1)
      return { ...f, practice_tasks: next }
    })
  }

  function handleBulkSplit() {
    const parsed = parsePracticeTasks(bulkText)
    if (parsed.length === 0) { toast.error('Không tách được bài nào, kiểm tra lại nội dung dán vào'); return }
    setForm(f => {
      // Giữ lại các bài đã soạn có nội dung; bỏ bài trống mặc định ban đầu
      const kept = f.practice_tasks.filter(baiCoNoiDung)
      const next = [...kept, ...parsed.map(p => ({ instructions: p.instructions, rubric: p.rubric, instruction_file_url: '' }))]
      setCurrentTaskIdx(kept.length)
      return { ...f, practice_tasks: next }
    })
    toast.success(`Đã tách thành ${parsed.length} bài`)
    setBulkText('')
    setShowBulkPaste(false)
  }
  function removeTask(idx) {
    setForm(f => {
      const next = f.practice_tasks.filter((_, i) => i !== idx)
      setCurrentTaskIdx(prev => Math.min(prev, next.length - 1))
      return { ...f, practice_tasks: next }
    })
  }
  function updateTask(idx, taskObj) {
    setForm(f => ({ ...f, practice_tasks: f.practice_tasks.map((t, i) => i === idx ? taskObj : t) }))
  }

  return (
    <div className="space-y-3">
      {/* Navigation bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {form.practice_tasks.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrentTaskIdx(i)}
              className={`w-7 h-7 rounded-full text-xs font-bold transition
                ${currentTaskIdx === i
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            >
              {i + 1}
            </button>
          ))}
          <button
            type="button"
            onClick={addTask}
            className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-lg font-bold flex items-center justify-center transition"
            title="Thêm bài tập"
          >
            <Plus size={14} />
          </button>
          <button
            type="button"
            onClick={() => setShowBulkPaste(v => !v)}
            className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition ml-1
              ${showBulkPaste ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
            title="Dán 1 đoạn text nhiều bài, tự tách thành từng bài + tiêu chí chấm"
          >
            <ClipboardList size={13} /> Dán nhiều bài
          </button>
        </div>
        {!showBulkPaste && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentTaskIdx === 0}
              onClick={() => setCurrentTaskIdx(i => i - 1)}
              className="px-2 py-1 text-xs rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 disabled:opacity-30 transition"
            >
              ← Trước
            </button>
            <span className="text-xs text-gray-400">{currentTaskIdx + 1}/{form.practice_tasks.length}</span>
            <button
              type="button"
              disabled={currentTaskIdx === form.practice_tasks.length - 1}
              onClick={() => setCurrentTaskIdx(i => i + 1)}
              className="px-2 py-1 text-xs rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 disabled:opacity-30 transition"
            >
              Sau →
            </button>
          </div>
        )}
      </div>

      {showBulkPaste ? (
        /* Dán nhiều bài cùng lúc — tự tách theo "BÀI <số>" và tự tách "Tiêu chí chấm" ở cuối mỗi bài */
        <div className="border border-indigo-200 rounded-xl overflow-hidden">
          <div className="bg-indigo-50 border-b border-indigo-100 px-3 py-2 text-xs text-indigo-700 space-y-0.5">
            <p>Dán đề nhiều bài vào đây. Mỗi bài bắt đầu bằng dòng <strong>"BÀI 1 – ..."</strong>, <strong>"BÀI 2 – ..."</strong> (nếu chỉ 1 bài thì không cần).</p>
            <p>Trong mỗi bài, nếu có phần <strong>"Tiêu chí chấm"</strong> ở cuối thì sẽ tự tách riêng vào ô Rubric (chỉ AI đọc) — không bắt buộc phải có.</p>
          </div>
          <textarea
            value={bulkText}
            onChange={e => setBulkText(e.target.value)}
            rows={12}
            autoFocus
            placeholder={'BÀI 1 – Tên bài...\n(nội dung đề bài)\n\nTiêu chí chấm\n(tiêu chí, có thể bỏ trống)\n\nBÀI 2 – Tên bài...\n...'}
            className="w-full px-3 py-2.5 text-sm focus:outline-none resize-y font-mono min-h-[220px]"
          />
          <div className="flex justify-end gap-2 bg-gray-50 border-t border-gray-100 px-3 py-2">
            <button type="button" onClick={() => { setShowBulkPaste(false); setBulkText('') }}
              className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 rounded-lg">Hủy</button>
            <button type="button" onClick={handleBulkSplit} disabled={!bulkText.trim()}
              className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-40 transition">
              Tách bài tập
            </button>
          </div>
        </div>
      ) : (
        <TaskEditor
          key={currentTaskIdx}
          index={currentTaskIdx}
          task={form.practice_tasks[currentTaskIdx]}
          onChange={taskObj => updateTask(currentTaskIdx, taskObj)}
          onRemove={form.practice_tasks.length > 1 ? () => removeTask(currentTaskIdx) : null}
          autoFocus
        />
      )}

      <p className="text-xs text-gray-400">Mỗi bài yêu cầu học sinh nộp 1 file (.pptx · .docx · .sb3).</p>
    </div>
  )
}
