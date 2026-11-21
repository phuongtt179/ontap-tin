// Phần thưởng — tab ngưỡng sticker đổi quà theo từng khoá.
import { Loader2, Save } from 'lucide-react'
import { NGUONG_DOI_QUA_MAC_DINH } from '../../../domain/sticker'

export default function TabNguong({ h, grades }) {
  const { tab, items, configs, editingThreshold, setEditingThreshold, savingConfig, saveThreshold } = h
  return (
    <>
      {tab === 'config' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 text-sm text-blue-700">
            <strong>Ngưỡng sticker</strong>: số sticker học sinh cần tích lũy để đổi 1 phần thưởng. Mặc định {NGUONG_DOI_QUA_MAC_DINH} nếu chưa cài đặt.
          </div>

          {grades.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-300 py-14 text-center">
              <p className="text-gray-400 text-sm">Chưa có khóa học nào. Tạo khóa tại trang <strong>Khối lớp</strong>.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {grades.map(grade => {
                const current = configs[grade] ?? NGUONG_DOI_QUA_MAC_DINH
                const editing = editingThreshold[grade] ?? current
                const changed = parseInt(editing) !== current
                return (
                  <div key={grade} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-black text-gray-800">Khóa {grade}</span>
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold">
                          {items.filter(i => i.grade === grade || !i.grade).length} quà áp dụng
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">Ngưỡng hiện tại: <strong>{current} sticker</strong></p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                        <span className="text-sm">⭐</span>
                        <input
                          type="number"
                          min={1}
                          max={9999}
                          value={editing}
                          onChange={e => setEditingThreshold(prev => ({ ...prev, [grade]: e.target.value }))}
                          className="w-16 bg-transparent text-sm font-black text-gray-800 focus:outline-none text-center"
                        />
                        <span className="text-xs text-gray-400">sticker</span>
                      </div>
                      <button
                        onClick={() => saveThreshold(grade)}
                        disabled={!changed || savingConfig === grade}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all
                          ${changed ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200' : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}>
                        {savingConfig === grade ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                        Lưu
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Hiển thị quà theo từng khóa */}
          <div className="mt-6 space-y-3">
            <h3 className="font-bold text-gray-700 text-sm">Quà theo từng khóa</h3>
            <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
              <div className="px-4 py-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-600">Chung (hiện cho tất cả khóa)</span>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  {items.filter(i => !i.grade).length} quà
                </span>
              </div>
              {grades.map(grade => (
                <div key={grade} className="px-4 py-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-600">Khóa {grade}</span>
                  <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                    {items.filter(i => i.grade === grade).length} quà riêng
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </>
  )
}
