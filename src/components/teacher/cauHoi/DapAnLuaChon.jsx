// Ô đáp án: trắc nghiệm (bấm chữ chọn đúng, ảnh từng lựa chọn), đúng / sai, nối đôi (ảnh 2 bên), sắp xếp thứ tự.
import { Plus, Trash2 } from 'lucide-react'
import { ImageUpload } from './TaiAnhAmThanh'

export default function DapAnLuaChon({ form, setForm }) {
  const setOption = (i, field, value) => { const opts = [...form.options]; opts[i] = { ...opts[i], [field]: value }; setForm({ ...form, options: opts }) }
  const setPair = (i, field, value) => { const pairs = [...form.pairs]; pairs[i] = { ...pairs[i], [field]: value }; setForm({ ...form, pairs }) }
  const setItem = (i, value) => { const items = [...form.items]; items[i] = value; setForm({ ...form, items }) }
  return (
    <>
    {/* Multiple choice */}
    {form.type === 'multiple_choice' && (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Đáp án (bấm chữ để chọn đúng)</label>
        <div className="space-y-3">
          {form.options.map((opt, i) => (
            <div key={opt.key}>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setForm({ ...form, correct_answer: opt.key })}
                  className={`w-8 h-8 rounded-full text-sm font-bold shrink-0 border-2 transition ${form.correct_answer === opt.key ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 text-gray-500 hover:border-green-400'}`}>
                  {opt.key}
                </button>
                <input value={opt.text} onChange={e => setOption(i, 'text', e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder={`Đáp án ${opt.key}`} />
              </div>
              <div className="pl-10 mt-1">
                <ImageUpload value={opt.image_url} onChange={v => setOption(i, 'image_url', v)} compact />
              </div>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* True/false */}
    {form.type === 'true_false' && (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Đáp án đúng</label>
        <div className="flex gap-3">
          {['Đúng', 'Sai'].map(v => (
            <button key={v} onClick={() => setForm({ ...form, correct_answer: v })}
              className={`px-5 py-2 rounded-lg text-sm font-medium border-2 transition ${form.correct_answer === v ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 text-gray-600 hover:border-green-400'}`}>
              {v}
            </button>
          ))}
        </div>
      </div>
    )}
    {/* Matching */}
    {form.type === 'matching' && (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Các cặp nối (trái ↔ phải)</label>
        <div className="space-y-3">
          {form.pairs.map((pair, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-xs font-semibold text-gray-400 w-4 shrink-0 mt-2">{String.fromCharCode(65 + i)}</span>
              {/* Left side */}
              <div className="flex-1 flex items-center gap-1.5 border border-gray-300 rounded-lg bg-white px-2 py-1.5">
                <input value={pair.left} onChange={e => setPair(i, 'left', e.target.value)}
                  className="flex-1 text-sm focus:outline-none min-w-0"
                  placeholder="Cột trái" />
                <ImageUpload value={pair.leftImage} onChange={v => setPair(i, 'leftImage', v)} compact />
              </div>
              <span className="text-gray-400 font-bold shrink-0 mt-2">↔</span>
              {/* Right side */}
              <div className="flex-1 flex items-center gap-1.5 border border-gray-300 rounded-lg bg-white px-2 py-1.5">
                <input value={pair.right} onChange={e => setPair(i, 'right', e.target.value)}
                  className="flex-1 text-sm focus:outline-none min-w-0"
                  placeholder="Cột phải" />
                <ImageUpload value={pair.rightImage} onChange={v => setPair(i, 'rightImage', v)} compact />
              </div>
              {form.pairs.length > 2 && (
                <button onClick={() => setForm({ ...form, pairs: form.pairs.filter((_, idx) => idx !== i) })}
                  className="text-red-400 hover:text-red-600 shrink-0 mt-2"><Trash2 size={14} /></button>
              )}
            </div>
          ))}
          <button onClick={() => setForm({ ...form, pairs: [...form.pairs, { left: '', leftImage: '', right: '', rightImage: '' }] })}
            className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800">
            <Plus size={14} /> Thêm cặp
          </button>
        </div>
      </div>
    )}

    {/* Ordering */}
    {form.type === 'ordering' && (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Thứ tự đúng (từ trên xuống dưới)</label>
        <div className="space-y-2">
          {form.items.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
              <input value={item} onChange={e => setItem(i, e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder={`Mục thứ ${i + 1}`} />
              {form.items.length > 2 && (
                <button onClick={() => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) })}
                  className="text-red-400 hover:text-red-600 shrink-0"><Trash2 size={14} /></button>
              )}
            </div>
          ))}
          <button onClick={() => setForm({ ...form, items: [...form.items, ''] })}
            className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800">
            <Plus size={14} /> Thêm mục
          </button>
        </div>
      </div>
    )}
    </>
  )
}
