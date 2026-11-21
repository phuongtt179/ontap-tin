// Phần thưởng — tab danh sách quà: lọc theo khoá, bật / tắt, sửa, xoá.
import { Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { GIA_QUA_MAC_DINH } from '../../../domain/sticker'

export default function TabQua({ h, grades }) {
  const { tab, gradeFilter, setGradeFilter, openAdd, openEdit, deleteItem, toggleActive, displayItems } = h
  return (
    <>
      {tab === 'items' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Grade filter */}
            <div className="flex gap-1.5 flex-wrap flex-1">
              <button onClick={() => setGradeFilter('__all__')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${gradeFilter === '__all__' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-300'}`}>
                Tất cả
              </button>
              <button onClick={() => setGradeFilter('')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${gradeFilter === '' ? 'bg-gray-600 text-white border-gray-600' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}`}>
                Chung (mọi khóa)
              </button>
              {grades.map(g => (
                <button key={g} onClick={() => setGradeFilter(g)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${gradeFilter === g ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-500 border-gray-200 hover:border-orange-300'}`}>
                  Khóa {g}
                </button>
              ))}
            </div>
            <button onClick={openAdd}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition shadow-md shadow-indigo-200 shrink-0">
              <Plus size={16} /> Thêm quà
            </button>
          </div>

          {displayItems.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-300 py-16 text-center">
              <div className="text-5xl mb-3">🎁</div>
              <p className="text-gray-500 font-medium">Chưa có phần thưởng nào</p>
              <p className="text-gray-400 text-sm mt-1">Thêm quà để học sinh có thể đổi sticker</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {displayItems.map(item => (
                <div key={item.id}
                  className={`bg-white rounded-2xl border-2 p-4 flex flex-col items-center gap-2 transition-all relative ${item.is_active ? 'border-indigo-100 shadow-sm' : 'border-gray-100 opacity-50'}`}>
                  {/* Grade badge */}
                  <span className={`absolute top-2 left-2 text-[9px] font-black px-1.5 py-0.5 rounded-md ${item.grade ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'}`}>
                    {item.grade ? `Khóa ${item.grade}` : 'Chung'}
                  </span>
                  <span className="text-4xl mt-2">{item.emoji}</span>
                  <span className="text-sm font-bold text-gray-700 text-center leading-tight">{item.name}</span>
                  <div className="text-[11px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    ⭐ {item.sticker_cost ?? GIA_QUA_MAC_DINH}
                  </div>
                  <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {item.is_active ? 'Đang hiện' : 'Đã ẩn'}
                  </div>
                  <div className="flex gap-2 mt-1">
                    <button onClick={() => toggleActive(item)} className="text-gray-400 hover:text-indigo-500 transition" title={item.is_active ? 'Ẩn' : 'Hiện'}>
                      {item.is_active ? <ToggleRight size={18} className="text-green-500" /> : <ToggleLeft size={18} />}
                    </button>
                    <button onClick={() => openEdit(item)}
                      className="text-xs text-indigo-500 hover:text-indigo-700 font-semibold px-2 py-0.5 rounded-lg hover:bg-indigo-50 transition">
                      Sửa
                    </button>
                    <button onClick={() => deleteItem(item.id)} className="text-gray-300 hover:text-red-500 transition">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </>
  )
}
