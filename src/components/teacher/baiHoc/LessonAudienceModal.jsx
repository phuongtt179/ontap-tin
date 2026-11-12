// Chọn nhanh ai được xem bài học, không cần mở form sửa đầy đủ.
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { X, Loader2 } from 'lucide-react'
import ChonHocSinhXem from './ChonHocSinhXem'
import { layTenHocSinhCuaKhoa } from '../../../data/ghiDanh'
import { capNhatBaiHoc, layNguoiXemBai, ghiNguoiXemBai } from '../../../data/baiHoc'

export default function LessonAudienceModal({ lesson, onClose, onDone }) {
  const [restricted, setRestricted] = useState(lesson.restricted_audience)
  const [roster, setRoster] = useState([])
  const [selected, setSelected] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([layTenHocSinhCuaKhoa(lesson.grade), layNguoiXemBai(lesson.id)])
      .then(([{ data: ds }, { data: dangXem }]) => {
        setRoster(ds)
        setSelected(dangXem)
        setLoading(false)
      })
  }, [lesson.id, lesson.grade])

  function toggleStudent(id) {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  }

  async function handleSave() {
    setSaving(true)
    const { error } = await capNhatBaiHoc(lesson.id, { restricted_audience: restricted })
    if (error) { setSaving(false); toast.error('Lưu thất bại: ' + error.message); return }
    const { error: loiGhi } = await ghiNguoiXemBai(lesson.id, restricted ? selected : [])
    if (loiGhi) { setSaving(false); toast.error('Lưu thất bại: ' + loiGhi.message); return }
    setSaving(false)
    toast.success('Đã cập nhật')
    onDone()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
          <h2 className="text-base font-bold text-gray-800 truncate">Ai được xem "{lesson.title}"?</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 shrink-0 ml-2"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="audience" checked={!restricted} onChange={() => setRestricted(false)}
              className="w-4 h-4 text-indigo-600 focus:ring-indigo-500" />
            <span className="text-sm font-medium text-gray-700">Tất cả học sinh khoá này</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="audience" checked={restricted} onChange={() => setRestricted(true)}
              className="w-4 h-4 text-indigo-600 focus:ring-indigo-500" />
            <span className="text-sm font-medium text-gray-700">Chỉ một số học sinh</span>
          </label>

          {restricted && (
            loading ? (
              <div className="flex justify-center py-6"><Loader2 size={20} className="animate-spin text-indigo-400" /></div>
            ) : (
              <div className="ml-6">
                <ChonHocSinhXem roster={roster} chon={selected} onDoi={toggleStudent} cao="max-h-56" />
              </div>
            )
          )}
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Hủy</button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 transition">
            {saving && <Loader2 size={14} className="animate-spin" />}
            Lưu
          </button>
        </div>
      </div>
    </div>
  )
}
