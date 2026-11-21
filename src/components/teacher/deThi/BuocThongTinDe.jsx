// Bước 1 soạn đề: tên, khoá, lớp được làm, giờ, số lần, hiện đáp án / điểm, phần thực hành (loại, đề, tiêu chí, hệ số, test Python).
import { useEffect, useState } from 'react'
import { useGrades } from '../../../hooks/useGrades'
import { layTenLopCuaKhoa } from '../../../data/khoaHoc'
import KhungTest from './KhungTest'

const LOAI_THUC_HANH = [
  { value: 'word', label: '📝 Word' }, { value: 'ppt', label: '📊 PowerPoint' },
  { value: 'python', label: '🐍 Python' }, { value: 'scratch', label: '🐱 Scratch' },
]

export default function BuocThongTinDe({ form, setForm, tests, setTests }) {
  const { grades: GRADES } = useGrades()
  const [classes, setClasses] = useState([])
  useEffect(() => { layTenLopCuaKhoa(form.grade).then(setClasses) }, [form.grade])

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tên đề thi</label>
        <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Ví dụ: Kiểm tra giữa kỳ Tin học khối 3" autoFocus />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Khoá học</label>
        <select value={form.grade}
          onChange={e => setForm({ ...form, grade: e.target.value, class_names: [] })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-sm font-medium text-gray-700">
            Lớp <span className="text-gray-400 font-normal">(tuỳ chọn — không chọn = tất cả lớp)</span>
          </label>
          {form.class_names.length > 0 && (
            <button type="button" onClick={() => setForm(f => ({ ...f, class_names: [] }))}
              className="text-xs text-gray-400 hover:text-gray-600">Bỏ chọn</button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {classes.map(c => {
            const selected = form.class_names.includes(c)
            return (
              <button key={c} type="button"
                onClick={() => setForm(f => ({
                  ...f,
                  class_names: selected
                    ? f.class_names.filter(x => x !== c)
                    : [...f.class_names, c],
                }))}
                className={`px-3 py-1 rounded-full text-sm border-2 transition font-medium ${
                  selected
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'border-gray-200 text-gray-600 hover:border-indigo-300'
                }`}
              >
                {c}
              </button>
            )
          })}
          {classes.length === 0 && (
            <p className="text-xs text-gray-400">Chưa có lớp nào cho khối {form.grade}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian (phút)</label>
          <input type="number" min={0} value={form.time_limit}
            onChange={e => setForm({ ...form, time_limit: Number(e.target.value) })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <p className="text-xs text-gray-400 mt-0.5">0 = không giới hạn</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Số lần làm</label>
          <input type="number" min={0} value={form.max_attempts}
            onChange={e => setForm({ ...form, max_attempts: Number(e.target.value) })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <p className="text-xs text-gray-400 mt-0.5">0 = không giới hạn</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button type="button"
          onClick={() => setForm({ ...form, is_active: !form.is_active })}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${form.is_active ? 'bg-indigo-600' : 'bg-gray-300'}`}>
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${form.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
        <span className="text-sm text-gray-700">
          {form.is_active ? <span className="text-green-600 font-medium">Đang mở</span> : <span className="text-gray-500">Đang tắt</span>}
          <span className="text-gray-400 text-xs ml-1">(học sinh {form.is_active ? 'thấy' : 'không thấy'})</span>
        </span>
      </div>

      <div className="border-t border-gray-100 pt-3 space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Sau khi làm bài</p>
        <div className="flex items-center gap-3">
          <button type="button"
            onClick={() => setForm({ ...form, show_answer: !form.show_answer })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition shrink-0 ${form.show_answer ? 'bg-indigo-600' : 'bg-gray-300'}`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${form.show_answer ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
          <span className="text-sm text-gray-700">
            Hiện đáp án đúng/sai sau mỗi câu
            <span className="text-gray-400 text-xs ml-1">(tắt = chế độ thi nghiêm túc)</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button type="button"
            onClick={() => setForm({ ...form, show_score: !form.show_score })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition shrink-0 ${form.show_score ? 'bg-indigo-600' : 'bg-gray-300'}`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${form.show_score ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
          <span className="text-sm text-gray-700">
            Hiện điểm và kết quả sau khi nộp
            <span className="text-gray-400 text-xs ml-1">(tắt = học sinh chỉ thấy "Đã nộp bài")</span>
          </span>
        </div>
      </div>

      {/* Phần thực hành */}
      <div className="border-t border-gray-100 pt-3 space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Phần thực hành</p>
        <div className="flex items-center gap-3">
          <button type="button"
            onClick={() => setForm({ ...form, has_practical: !form.has_practical })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition shrink-0 ${form.has_practical ? 'bg-indigo-600' : 'bg-gray-300'}`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${form.has_practical ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
          <span className="text-sm text-gray-700">Có phần thực hành (Word, PowerPoint, Python, Scratch)</span>
        </div>

        {form.has_practical && (
          <div className="space-y-3 pl-2 border-l-2 border-indigo-200">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {LOAI_THUC_HANH.map(opt => (
                <button key={opt.value} type="button"
                  onClick={() => setForm({ ...form, practical_type: opt.value })}
                  className={`flex-1 py-2 px-3 rounded-lg border-2 text-sm transition ${form.practical_type === opt.value ? 'border-indigo-500 bg-indigo-50 font-medium' : 'border-gray-200 hover:border-indigo-300'}`}>
                  {opt.label}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Yêu cầu thực hành</label>
              <textarea
                value={form.practical_instructions}
                onChange={e => setForm({ ...form, practical_instructions: e.target.value })}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                placeholder="Ví dụ: Soạn thảo đoạn văn giới thiệu về mùa xuân, có tiêu đề in đậm, ít nhất 1 hình ảnh..."
              />
            </div>

            {form.practical_type === 'python' && <KhungTest tests={tests} setTests={setTests} />}
            {form.practical_type !== 'python' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu chí chấm (cho AI chấm nháp, học sinh không thấy)</label>
                <textarea value={form.practical_rubric} onChange={e => setForm({ ...form, practical_rubric: e.target.value })} rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
                  placeholder={'Mỗi dòng 1 tiêu chí, ví dụ:\nCó nhân vật mèo và táo: 2đ\nTáo rơi từ trên xuống: 3đ\nMèo di chuyển bằng phím: 3đ\nĐếm điểm khi hứng được táo: 2đ'} />
              </div>
            )}
            <p className="text-[11px] text-gray-500">Đề chỉ có thực hành: ở bước 2 không chọn câu hỏi nào — điểm tính 100% thực hành.</p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tỉ lệ điểm</label>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Lý thuyết</span>
                  <input type="number" min={0} max={100} value={form.theory_weight}
                    onChange={e => setForm({ ...form, theory_weight: Number(e.target.value), practical_weight: 100 - Number(e.target.value) })}
                    className="w-16 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center" />
                  <span className="text-sm text-gray-500">%</span>
                </div>
                <span className="text-gray-400">+</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Thực hành</span>
                  <input type="number" min={0} max={100} value={form.practical_weight}
                    onChange={e => setForm({ ...form, practical_weight: Number(e.target.value), theory_weight: 100 - Number(e.target.value) })}
                    className="w-16 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center" />
                  <span className="text-sm text-gray-500">%</span>
                </div>
                <span className="text-sm text-gray-400">= 100%</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
