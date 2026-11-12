// Nhập câu hỏi — sửa 1 câu sau khi phân tích: nội dung, ảnh, đáp án theo loại, gợi ý, đổi loại; cảnh báo lỗi cấu trúc.
import { ImagePlus, Trash2 } from 'lucide-react'
import { LOAI_CAU_HOI } from '../../../domain/soanCauHoi'
import { splitPhrases } from '../../../utils/wordOrder'

const QUESTION_TYPES = Object.fromEntries(LOAI_CAU_HOI.map(t => [t.value, t.label]))

export default function SuaCauNhap({ q, i, issues, updateQuestion, updateOption, updateMatchOption, updateWordBank, doiNhieu, removeQuestion, handleImageUpload }) {
  return (
    <div className="border border-gray-200 rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-semibold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
          Câu {i + 1} — {QUESTION_TYPES[q.type] || q.type}
        </span>
        <button onClick={() => removeQuestion(i)} className="text-red-400 hover:text-red-600">
          <Trash2 size={16} />
        </button>
      </div>
      {/* Cảnh báo lỗi cấu trúc (thiếu chỗ trống, đáp án không khớp...) — cập nhật ngay khi sửa */}
      {issues.filter(x => x.index === i).map((x, k) => (
        <p key={k} className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1">⚠ {x.msg}</p>
      ))}

      {/* Question text */}
      <textarea
        value={q.question}
        onChange={e => updateQuestion(i, 'question', e.target.value)}
        rows={2}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
      />

      {/* Image */}
      <div className="flex items-center gap-3">
        {q.image_url ? (
          <div className="flex items-center gap-2">
            <img src={q.image_url} alt="" className="h-16 rounded border" />
            <button onClick={() => updateQuestion(i, 'image_url', null)}
              className="text-xs text-red-500 hover:underline">Xóa ảnh</button>
          </div>
        ) : (
          <label className="flex items-center gap-1.5 text-xs text-indigo-600 cursor-pointer hover:underline">
            <ImagePlus size={14} /> Thêm ảnh
            <input type="file" accept="image/*" className="hidden"
              onChange={e => e.target.files[0] && handleImageUpload(i, e.target.files[0])} />
          </label>
        )}
      </div>

      {/* Options for multiple choice */}
      {q.type === 'multiple_choice' && (
        <div className="space-y-1.5">
          {q.options.map((opt, oi) => (
            <div key={oi} className="flex items-center gap-2">
              <button
                onClick={() => updateQuestion(i, 'correct_answer', opt.key)}
                className={`w-7 h-7 rounded-full text-xs font-bold border-2 flex-shrink-0 transition
                  ${q.correct_answer === opt.key
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'border-gray-300 text-gray-500 hover:border-indigo-400'}`}
              >
                {opt.key}
              </button>
              <input
                value={opt.text}
                onChange={e => updateOption(i, oi, e.target.value)}
                className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
              />
            </div>
          ))}
          <p className="text-xs text-gray-400">Bấm vào chữ cái để chọn đáp án đúng</p>
        </div>
      )}

      {/* True/False */}
      {q.type === 'true_false' && (
        <div className="flex gap-2">
          {['Đúng', 'Sai'].map(val => (
            <button key={val}
              onClick={() => updateQuestion(i, 'correct_answer', val)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium border-2 transition
                ${q.correct_answer === val
                  ? 'bg-green-500 border-green-500 text-white'
                  : 'border-gray-300 text-gray-600 hover:border-indigo-400'}`}
            >
              {val}
            </button>
          ))}
        </div>
      )}

      {/* Fill blank */}
      {q.type === 'fill_blank' && (
        <div>
          <label className="text-xs text-gray-500 block mb-1">Đáp án</label>
          <input
            value={q.correct_answer || ''}
            onChange={e => updateQuestion(i, 'correct_answer', e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400 w-full"
          />
        </div>
      )}

      {/* Drag word */}
      {q.type === 'drag_word' && (
        <div className="space-y-2">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Từ vựng (cách nhau bằng dấu phẩy)</label>
            <input
              value={q.options.map(o => o.text).join(', ')}
              onChange={e => updateWordBank(i, e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400 w-full"
              placeholder="từ1, từ2, từ3..."
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Đáp án (thứ tự từ cần điền)</label>
            <input
              value={q.correct_answer || ''}
              onChange={e => updateQuestion(i, 'correct_answer', e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400 w-full"
              placeholder="từ1, từ2..."
            />
          </div>
        </div>
      )}

      {/* Ordering */}
      {q.type === 'ordering' && (
        <div className="space-y-1.5">
          <label className="text-xs text-gray-500 block">Các mục (thứ tự hiện tại = đáp án đúng)</label>
          {q.options.map((opt, oi) => (
            <div key={oi} className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0">
                {oi + 1}
              </span>
              <input
                value={opt.text}
                onChange={e => updateOption(i, oi, e.target.value)}
                className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
              />
            </div>
          ))}
        </div>
      )}

      {/* Matching */}
      {q.type === 'matching' && (
        <div className="space-y-1.5">
          <label className="text-xs text-gray-500 block">Cặp ghép đôi (trái | phải)</label>
          {q.options.map((opt, oi) => (
            <div key={oi} className="flex items-center gap-2">
              <span className="w-6 text-xs font-bold text-indigo-600 text-center shrink-0">{opt.key}</span>
              <input
                value={opt.text}
                onChange={e => updateOption(i, oi, e.target.value)}
                className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
              />
              <span className="text-gray-400 text-xs shrink-0">→</span>
              <input
                value={(q.match_options || [])[oi]?.text || ''}
                onChange={e => updateMatchOption(i, oi, e.target.value)}
                className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
              />
            </div>
          ))}
        </div>
      )}

      {/* Word Order */}
      {q.type === 'word_order' && (
        <div className="space-y-2">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Câu đúng (đáp án)</label>
            <input
              value={q.correct_answer || ''}
              onChange={e => {
                // Giữ nguyên chữ giáo viên gõ (kể cả "/"); tách cụm để xem trước — lưu sẽ bỏ "/"
                const sentence = e.target.value
                const { chunks } = splitPhrases(sentence)
                doiNhieu(i, { correct_answer: sentence, options: chunks.map((text, wi) => ({ key: String.fromCharCode(65 + wi), text })) })
              }}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400 w-full"
              placeholder="Ví dụ: Bàn phím là thiết bị nhập dữ liệu"
            />
          </div>
          {q.options.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {q.options.map((opt, oi) => (
                <span key={oi} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded-full border border-indigo-200">
                  {opt.text}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Essay */}
      {q.type === 'essay' && (
        <div>
          <label className="text-xs text-gray-500 block mb-1">Gợi ý / Đáp án mẫu (tùy chọn)</label>
          <textarea
            value={q.correct_answer || ''}
            onChange={e => updateQuestion(i, 'correct_answer', e.target.value)}
            rows={2}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400 resize-none"
            placeholder="Nhập đáp án mẫu (không bắt buộc, giáo viên sẽ chấm)"
          />
        </div>
      )}

      {/* Hint */}
      {q.type !== 'essay' && (
        <div>
          <label className="text-xs text-amber-600 block mb-1">Gợi ý khi sai (tùy chọn)</label>
          <input
            value={q.hint || ''}
            onChange={e => updateQuestion(i, 'hint', e.target.value)}
            className="border border-amber-200 bg-amber-50 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400 w-full"
            placeholder="Nhập gợi ý cho học sinh khi trả lời sai..."
          />
        </div>
      )}

      {/* Type selector */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-500">Dạng:</label>
        <select
          value={q.type}
          onChange={e => updateQuestion(i, 'type', e.target.value)}
          className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400"
        >
          {Object.entries(QUESTION_TYPES).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
