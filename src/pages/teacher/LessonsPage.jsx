import { useState, useEffect, useMemo, useRef } from 'react'
import { useGrades } from '../../hooks/useGrades'
import { useTopics } from '../../hooks/useTopics'
import { useUnitsByGrade } from '../../hooks/useUnits'
import { useLessonTitles } from '../../hooks/useLessonTitles'
import toast from 'react-hot-toast'
import { Plus, BookOpen, Filter } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { layBaiHocDeSua, capNhatBaiHoc, xoaBaiHoc } from '../../data/baiHoc'
import CayChuDe from '../../components/teacher/baiHoc/CayChuDe'
import DongBaiHoc from '../../components/teacher/baiHoc/DongBaiHoc'
import LessonFormModal from '../../components/teacher/baiHoc/LessonFormModal'
import LessonAudienceModal from '../../components/teacher/baiHoc/LessonAudienceModal'
import LessonPreviewModal from '../../components/teacher/baiHoc/LessonPreviewModal'

// Trang Bài học (giáo viên): cây chủ đề bên trái + danh sách bài; tạo / sửa / xem trước / người xem ở components/teacher/baiHoc/

export default function LessonsPage() {
  const { canDelete } = useAuth()
  const { grades: GRADES } = useGrades()
  const { topics } = useTopics()

  const [selectedGrade, setSelectedGrade] = useState(() => sessionStorage.getItem('lessons_grade') || '')
  const [selectedTopic, setSelectedTopic] = useState(() => sessionStorage.getItem('lessons_topic') || '')
  const [selectedUnit, setSelectedUnit] = useState(null)
  const [selectedLessonTitle, setSelectedLessonTitle] = useState(null)
  const [expandedTopics, setExpandedTopics] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('lessons_expanded') || '{}') } catch { return {} }
  })
  const [allLessons, setAllLessons] = useState([])
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [editLesson, setEditLesson] = useState(null)
  const [previewLesson, setPreviewLesson] = useState(null)
  const [audienceLesson, setAudienceLesson] = useState(null)

  const { units: gradeUnits } = useUnitsByGrade(selectedGrade)
  const { lessonTitles: unitLessonTitles } = useLessonTitles(selectedUnit?.id)

  useEffect(() => { if (selectedGrade) sessionStorage.setItem('lessons_grade', selectedGrade) }, [selectedGrade])
  useEffect(() => { if (selectedTopic) sessionStorage.setItem('lessons_topic', selectedTopic) }, [selectedTopic])
  useEffect(() => { sessionStorage.setItem('lessons_expanded', JSON.stringify(expandedTopics)) }, [expandedTopics])

  useEffect(() => {
    if (GRADES.length > 0 && topics.length > 0 && !selectedGrade) {
      const g = GRADES[0]
      const t = topics.find(t => t.grade === g || t.grade === 'all')
      setSelectedGrade(g)
      if (t) {
        setSelectedTopic(t.name)
        setExpandedTopics({ [t.name]: true })
      }
    }
  }, [GRADES, topics])

  useEffect(() => { if (selectedGrade) fetchLessons() }, [selectedGrade])

  // Chỉ hiện vòng xoay khi đổi bộ lọc; lưu / xoá xong thì tải ngầm để giữ nguyên danh sách và vị trí đang xem
  const daTai = useRef(null)
  async function fetchLessons() {
    if (daTai.current !== selectedGrade) { daTai.current = selectedGrade; setLoading(true) }
    const { data } = await layBaiHocDeSua(selectedGrade)
    setAllLessons(data || [])
    setLoading(false)
  }

  function handleGradeChange(grade) {
    setSelectedGrade(grade)
    const first = topics.find(t => t.grade === grade || t.grade === 'all')
    setSelectedTopic(first?.name || '')
    setSelectedUnit(null)
    setExpandedTopics(first ? { [first.name]: true } : {})
  }

  function handleTopicClick(topicName) {
    if (selectedTopic === topicName) {
      setExpandedTopics(prev => ({ ...prev, [topicName]: !prev[topicName] }))
    } else {
      setSelectedTopic(topicName)
      setSelectedUnit(null)
      setSelectedLessonTitle(null)
      setExpandedTopics(prev => ({ ...prev, [topicName]: true }))
    }
  }

  function handleUnitClick(unit) {
    setSelectedUnit(prev => prev?.id === unit.id ? null : unit)
    setSelectedLessonTitle(null)
  }

  const gradeTopics = useMemo(
    () => topics.filter(t => t.grade === selectedGrade || t.grade === 'all'),
    [topics, selectedGrade]
  )

  const unitsByTopic = useMemo(() => {
    const map = {}
    gradeUnits.forEach(u => {
      if (!map[u.topic]) map[u.topic] = []
      map[u.topic].push(u)
    })
    return map
  }, [gradeUnits])

  const countByTopic = useMemo(() => {
    const map = {}
    allLessons.forEach(l => { map[l.topic] = (map[l.topic] || 0) + 1 })
    return map
  }, [allLessons])

  const countByUnit = useMemo(() => {
    const map = {}
    allLessons.forEach(l => {
      if (l.unit_id) map[l.unit_id] = (map[l.unit_id] || 0) + 1
    })
    return map
  }, [allLessons])

  const countByLessonTitle = useMemo(() => {
    const map = {}
    allLessons.forEach(l => {
      if (l.lesson_title_id) map[l.lesson_title_id] = (map[l.lesson_title_id] || 0) + 1
    })
    return map
  }, [allLessons])

  const displayedLessons = useMemo(() => {
    let ls = allLessons
    if (selectedTopic) ls = ls.filter(l => l.topic === selectedTopic)
    if (selectedUnit) ls = ls.filter(l => l.unit_id === selectedUnit.id)
    if (selectedLessonTitle) ls = ls.filter(l => l.lesson_title_id === selectedLessonTitle.id)
    return ls
  }, [allLessons, selectedTopic, selectedUnit, selectedLessonTitle])

  async function handleDelete(id, title) {
    if (!confirm(`Xóa bài học "${title}"?`)) return
    const { error } = await xoaBaiHoc(id)
    if (error) toast.error('Xóa thất bại')
    else { toast.success('Đã xóa bài học'); fetchLessons() }
  }

  async function handleTogglePublish(lesson) {
    const { error } = await capNhatBaiHoc(lesson.id, { is_published: !lesson.is_published })
    if (error) toast.error('Cập nhật thất bại')
    else fetchLessons()
  }

  const panelTitle = selectedLessonTitle
    ? selectedLessonTitle.name
    : selectedUnit
      ? selectedUnit.name
      : selectedTopic || 'Tất cả bài học'

  return (
    <div className="flex h-full min-h-0 relative overflow-hidden">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ─────────────────────────────── */}
      <CayChuDe dangMo={sidebarOpen} onDong={() => setSidebarOpen(false)} GRADES={GRADES}
        selectedGrade={selectedGrade} onDoiKhoa={handleGradeChange} gradeTopics={gradeTopics} loading={loading}
        countByTopic={countByTopic} countByUnit={countByUnit} countByLessonTitle={countByLessonTitle}
        expandedTopics={expandedTopics} unitsByTopic={unitsByTopic} unitLessonTitles={unitLessonTitles}
        selectedTopic={selectedTopic} selectedUnit={selectedUnit} selectedLessonTitle={selectedLessonTitle}
        onChonChuDe={handleTopicClick}
        onChonDonVi={(chuDe, u) => { setSelectedTopic(chuDe); handleUnitClick(u) }}
        onChonTieuDe={lt => setSelectedLessonTitle(prev => prev?.id === lt.id ? null : lt)} />

      {/* ── Main panel ──────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-0 bg-gray-50">
        <div className="flex items-center justify-between gap-2 md:gap-4 px-4 md:px-6 py-4 bg-white border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden shrink-0 flex items-center gap-1 text-sm text-gray-600 border border-gray-300 rounded-lg px-2.5 py-1.5">
              <Filter size={14} /> Lọc
            </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {selectedLessonTitle ? (
                <>
                  <span className="text-xs text-gray-400">{selectedTopic} /</span>
                  <span className="text-xs text-gray-400">{selectedUnit?.name} /</span>
                </>
              ) : selectedUnit ? (
                <span className="text-xs text-gray-400">{selectedTopic} /</span>
              ) : null}
              <h2 className="font-semibold text-gray-800 truncate">{panelTitle}</h2>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              {loading ? '...' : `${displayedLessons.length} bài học`}
            </p>
          </div>
          </div>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition shrink-0">
            <Plus size={15} /> Tạo bài học
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
          ) : displayedLessons.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
              <BookOpen size={40} className="mb-3 opacity-20" />
              <p className="text-sm">Chưa có bài học nào</p>
              <button onClick={() => setShowCreate(true)}
                className="mt-3 text-sm text-indigo-500 hover:text-indigo-700 font-medium">
                + Tạo bài học đầu tiên
              </button>
            </div>
          ) : (
            <div className="space-y-3 max-w-4xl">
              {displayedLessons.map((lesson, i) => (
                <DongBaiHoc key={lesson.id} lesson={lesson} stt={i + 1} canDelete={canDelete}
                  onDoiXuatBan={() => handleTogglePublish(lesson)} onNguoiXem={() => setAudienceLesson(lesson)}
                  onXemTruoc={() => setPreviewLesson(lesson)} onSua={() => setEditLesson(lesson)}
                  onXoa={() => handleDelete(lesson.id, lesson.title)} />
              ))}
            </div>
          )}
        </div>
      </div>

      {(showCreate || editLesson) && (
        <LessonFormModal
          lesson={editLesson}
          defaultGrade={selectedGrade}
          defaultTopic={selectedTopic}
          defaultUnitId={selectedUnit?.id || null}
          onClose={() => { setShowCreate(false); setEditLesson(null) }}
          onDone={() => { setShowCreate(false); setEditLesson(null); fetchLessons() }}
        />
      )}
      {previewLesson && (
        <LessonPreviewModal lesson={previewLesson} onClose={() => setPreviewLesson(null)} />
      )}
      {audienceLesson && (
        <LessonAudienceModal
          lesson={audienceLesson}
          onClose={() => setAudienceLesson(null)}
          onDone={() => { setAudienceLesson(null); fetchLessons() }}
        />
      )}
    </div>
  )
}
