// Trang Chủ đề (/teacher/topics): danh sách chủ đề theo khoá, thêm / sửa / xoá; đơn vị + tiêu đề nhỏ trong components/teacher/chuDe/.
import { useState, useEffect } from 'react'
import { useTopics } from '../../hooks/useTopics'
import { useGrades } from '../../hooks/useGrades'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, Check, X, Upload, BookOpen } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { themChuDe, xoaChuDe, suaChuDeVaLienQuan, demDonViTheoChuDe } from '../../data/chuDe'
import NhapChuDeModal from '../../components/teacher/chuDe/NhapChuDeModal'
import QuanLyDonViModal from '../../components/teacher/chuDe/QuanLyDonViModal'

export default function TopicsPage() {
  const { canDelete, user } = useAuth()
  const { topics, loading, refetch } = useTopics()
  const { grades: gradeValues } = useGrades()
  const GRADES = [{ value: 'all', label: 'Tất cả khoá' }, ...gradeValues.map(g => ({ value: g, label: g }))]

  const [filterGrade, setFilterGrade] = useState('all')
  const [newName, setNewName] = useState('')
  const [newGrade, setNewGrade] = useState('')
  const [adding, setAdding] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [editId, setEditId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editGrade, setEditGrade] = useState('')
  const [editOldName, setEditOldName] = useState('')
  const [editOldGrade, setEditOldGrade] = useState('')
  const [unitTopic, setUnitTopic] = useState(null) // topic object for UnitManagerModal
  const [unitCounts, setUnitCounts] = useState({}) // topicName+grade → count

  useEffect(() => { if (gradeValues.length && !newGrade) setNewGrade(gradeValues[0]) }, [gradeValues])

  // số đơn vị của từng chủ đề (tải lại khi danh sách chủ đề đổi / đóng cửa sổ đơn vị)
  const taiSoDonVi = () => demDonViTheoChuDe().then(({ data }) => setUnitCounts(data))
  useEffect(() => { if (topics.length) taiSoDonVi() }, [topics])

  const displayed = filterGrade === 'all' ? topics : topics.filter(t => t.grade === filterGrade)

  async function handleAdd() {
    if (!newName.trim()) return
    const { error } = await themChuDe({ name: newName.trim(), grade: newGrade, created_by: user.id })
    if (error) toast.error(error.message.includes('unique') ? 'Chủ đề đã tồn tại' : 'Thêm thất bại')
    else { toast.success('Đã thêm chủ đề'); setNewName(''); setAdding(false); refetch() }
  }

  async function handleUpdate(id) {
    if (!editName.trim()) return
    const newName = editName.trim()
    const newGrade = editGrade
    // bài học, câu hỏi, đơn vị đổi theo (data/chuDe.suaChuDeVaLienQuan)
    const { error } = await suaChuDeVaLienQuan(id, { tenCu: editOldName, khoaCu: editOldGrade, tenMoi: newName, khoaMoi: newGrade })
    if (error) { toast.error('Cập nhật thất bại'); return }
    toast.success('Đã cập nhật')
    setEditId(null)
    refetch()
  }

  async function handleDelete(id, name) {
    if (!confirm(`Xóa chủ đề "${name}"? Các câu hỏi và bài học thuộc chủ đề này sẽ không bị xóa.`)) return
    const { error } = await xoaChuDe(id)
    if (error) toast.error('Xóa thất bại')
    else { toast.success('Đã xóa'); refetch() }
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Chủ đề</h1>
          <p className="text-gray-400 text-sm mt-0.5">{displayed.length} chủ đề</p>
        </div>
        {!adding && (
          <div className="flex gap-2">
            <button onClick={() => setShowImport(true)}
              className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium transition">
              <Upload size={15} /> Nhập hàng loạt
            </button>
            <button onClick={() => setAdding(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
              <Plus size={16} /> Thêm chủ đề
            </button>
          </div>
        )}
      </div>

      {/* Grade filter tabs */}
      <div className="flex flex-wrap gap-2 mb-5">
        {GRADES.map(g => (
          <button key={g.value} onClick={() => setFilterGrade(g.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition ${filterGrade === g.value ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {g.label}
          </button>
        ))}
      </div>

      {/* Add single topic */}
      {adding && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-4 flex items-center gap-3">
          <input autoFocus value={newName} onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="Tên chủ đề..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <select value={newGrade} onChange={e => setNewGrade(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            {GRADES.slice(1).map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
          </select>
          <button onClick={handleAdd} className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-lg"><Check size={16} /></button>
          <button onClick={() => { setAdding(false); setNewName('') }} className="text-gray-400 hover:text-gray-600 p-2"><X size={16} /></button>
        </div>
      )}

      {/* Topic list */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-7 w-7 border-b-2 border-indigo-600" /></div>
      ) : (
        <div className="space-y-2">
          {displayed.map(topic => {
            const unitCount = unitCounts[`${topic.grade}||${topic.name}`] || 0
            return (
              <div key={topic.id} className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3">
                {editId === topic.id ? (
                  <>
                    <input autoFocus value={editName} onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleUpdate(topic.id, topic.name, topic.grade)}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    <select value={editGrade} onChange={e => setEditGrade(e.target.value)}
                      className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      {GRADES.slice(1).map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                    </select>
                    <button onClick={() => handleUpdate(topic.id, topic.name, topic.grade)} className="text-green-600 hover:text-green-700 p-1"><Check size={16} /></button>
                    <button onClick={() => setEditId(null)} className="text-gray-400 hover:text-gray-600 p-1"><X size={16} /></button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm font-medium text-gray-800">{topic.name}</span>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{topic.grade}</span>
                    {/* Unit count badge + manage button */}
                    <button
                      onClick={() => setUnitTopic(topic)}
                      className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border transition
                        hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 border-gray-200 text-gray-500"
                      title="Quản lý danh sách bài"
                    >
                      <BookOpen size={12} />
                      {unitCount > 0 ? `${unitCount} bài` : 'Thêm bài'}
                    </button>
                    <button onClick={() => { setEditId(topic.id); setEditName(topic.name); setEditGrade(topic.grade); setEditOldName(topic.name); setEditOldGrade(topic.grade) }}
                      className="text-gray-400 hover:text-indigo-600 p-1 transition"><Pencil size={15} /></button>
                    {canDelete && (
                      <button onClick={() => handleDelete(topic.id, topic.name)}
                        className="text-gray-400 hover:text-red-500 p-1 transition"><Trash2 size={15} /></button>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}

      {showImport && (
        <NhapChuDeModal grades={gradeValues} existingTopics={topics}
          defaultGrade={filterGrade !== 'all' ? filterGrade : gradeValues[0]}
          user={user} onClose={() => setShowImport(false)}
          onDone={() => { setShowImport(false); refetch() }} />
      )}

      {unitTopic && (
        <QuanLyDonViModal topic={unitTopic} user={user} canDelete={canDelete}
          onClose={() => { setUnitTopic(null); taiSoDonVi() }} />
      )}
    </div>
  )
}
