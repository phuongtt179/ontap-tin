// Phần thưởng — cửa sổ thêm / sửa quà: khoá, biểu tượng, tên, số sticker.
import { X, Loader2 } from 'lucide-react'

const EMOJI_PRESETS = ['🍬','🍭','🍫','🎮','📚','✏️','🖍️','🎨','🏆','⭐','🎯','🎁','🎀','🧸','🪀','🎲','🎵','📱','🍕','🍦','🎠','🌟','💎','🦄','🐱','🐶','🦋','🌈','🚀','💫']

export default function FormQua({ h, grades }) {
  const { showForm, setShowForm, editItem, formName, setFormName, formEmoji, setFormEmoji, formGrade, setFormGrade, formCost, setFormCost, saving, saveItem } = h
  return (
    <>
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
            onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-5 py-4 flex items-center justify-between">
              <h3 className="text-white font-black text-base">{editItem ? 'Sửa phần thưởng' : 'Thêm phần thưởng'}</h3>
              <button onClick={() => setShowForm(false)} className="text-white/70 hover:text-white"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              {/* Khóa học */}
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1.5 block">Áp dụng cho khóa</label>
                <select
                  value={formGrade}
                  onChange={e => setFormGrade(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white">
                  <option value="">Tất cả khóa (chung)</option>
                  {grades.map(g => <option key={g} value={g}>Khóa {g}</option>)}
                </select>
              </div>

              {/* Emoji */}
              <div>
                <label className="text-xs font-bold text-gray-500 mb-2 block">Chọn emoji</label>
                <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-xl max-h-28 overflow-y-auto">
                  {EMOJI_PRESETS.map(e => (
                    <button key={e} onClick={() => setFormEmoji(e)}
                      className={`w-9 h-9 text-xl rounded-lg transition-all hover:scale-110 ${formEmoji === e ? 'bg-indigo-100 ring-2 ring-indigo-400 scale-110' : 'hover:bg-gray-100'}`}>
                      {e}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-2xl">{formEmoji}</span>
                  <input value={formEmoji} onChange={e => setFormEmoji(e.target.value)}
                    className="w-20 border border-gray-200 rounded-lg px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    placeholder="emoji" maxLength={4} />
                  <span className="text-xs text-gray-400">hoặc gõ emoji khác</span>
                </div>
              </div>

              {/* Tên */}
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1.5 block">Tên phần thưởng</label>
                <input value={formName} onChange={e => setFormName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && saveItem()}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  placeholder="VD: Kẹo ngọt, Nhãn dán, Bút màu..." />
              </div>

              {/* Số sticker */}
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1.5 block">Số sticker cần để đổi</label>
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
                  <span className="text-base">⭐</span>
                  <input
                    type="number" min={1} max={9999}
                    value={formCost}
                    onChange={e => setFormCost(e.target.value)}
                    className="flex-1 bg-transparent text-sm font-black text-amber-700 focus:outline-none"
                    placeholder="VD: 50"
                  />
                  <span className="text-xs text-amber-600 font-semibold">sticker</span>
                </div>
              </div>

              {/* Preview */}
              <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
                <span className="text-3xl">{formEmoji}</span>
                <div>
                  <div className="font-bold text-gray-700 text-sm">{formName || 'Tên phần thưởng'}</div>
                  <div className="text-[11px] font-bold text-amber-600 mt-0.5">⭐ {formCost || 50} sticker</div>
                  <div className={`text-[10px] font-semibold mt-0.5 ${formGrade ? 'text-orange-600' : 'text-gray-400'}`}>
                    {formGrade ? `Chỉ khóa ${formGrade}` : 'Áp dụng tất cả khóa'}
                  </div>
                </div>
              </div>

              <button onClick={saveItem} disabled={saving || !formName.trim()}
                className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-black rounded-xl disabled:opacity-50 transition hover:opacity-90">
                {saving ? <Loader2 size={18} className="animate-spin mx-auto" /> : editItem ? 'Lưu thay đổi' : 'Thêm phần thưởng'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
