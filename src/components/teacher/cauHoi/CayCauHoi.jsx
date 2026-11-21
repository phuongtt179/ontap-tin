// Ngân hàng câu hỏi — thanh bên: chọn khoá, cây chủ đề → đơn vị → tiêu đề nhỏ (kèm số câu), đóng / mở trên điện thoại.
import { BookOpen, ChevronDown, ChevronRight, X } from 'lucide-react'

export default function CayCauHoi({ GRADES, countByLessonTitle, countByTopic, countByUnit, expandedTopics, gradeTopics, handleGradeChange, handleTopicClick, handleUnitClick, loading, selectedGrade, selectedLessonTitle, selectedTopic, selectedUnit, setSelectedLessonTitle, setSelectedTopic, setSidebarOpen, sidebarOpen, topicsLoading, unitLessonTitles, unitsByTopic }) {
  return (
    <>
    <aside className={sidebarOpen
      ? 'flex fixed inset-y-0 left-0 z-40 shadow-2xl w-64 shrink-0 bg-white border-r border-gray-200 flex-col min-h-0'
      : 'hidden md:flex md:relative w-64 shrink-0 bg-white border-r border-gray-200 flex-col min-h-0'
    }>
      {/* Grade selector */}
      <div className="px-4 pt-5 pb-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-bold text-gray-800">Ngân hàng câu hỏi</h1>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-400 hover:text-gray-600 p-1 -mr-1"><X size={18} /></button>
        </div>
        <select value={selectedGrade} onChange={e => handleGradeChange(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
          {GRADES.length === 0 && <option value="">-- Chọn khoá --</option>}
          {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      {/* Topic + Unit tree */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        {topicsLoading ? (
          <div className="space-y-1 pt-1">
            {[1,2,3,4].map(i => <div key={i} className="h-9 bg-gray-100 rounded-lg animate-pulse" />)}
          </div>
        ) : gradeTopics.length === 0 ? (
          <p className="text-xs text-gray-400 text-center px-4 pt-6">Chưa có chủ đề nào</p>
        ) : (
          gradeTopics.map(t => {
            const topicCount = countByTopic[t.name] || 0
            const topicActive = selectedTopic === t.name && !selectedUnit
            const isExpanded = !!expandedTopics[t.name]
            const topicUnits = unitsByTopic[t.name] || []

            return (
              <div key={t.id} className="mb-0.5">
                {/* Topic row */}
                <button
                  onClick={() => handleTopicClick(t.name)}
                  className={`w-full flex items-center gap-1.5 px-2 py-2.5 rounded-lg text-left text-sm transition
                    ${topicActive
                      ? 'bg-indigo-600 text-white font-medium'
                      : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  {topicUnits.length > 0 ? (
                    isExpanded
                      ? <ChevronDown size={13} className="shrink-0 opacity-60" />
                      : <ChevronRight size={13} className="shrink-0 opacity-60" />
                  ) : <span className="w-[13px] shrink-0" />}
                  <span className="flex-1 leading-tight line-clamp-2 text-xs">{t.name}</span>
                  <span className={`shrink-0 text-xs px-1.5 py-0.5 rounded-full font-semibold
                    ${topicActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    {loading ? '·' : topicCount}
                  </span>
                </button>

                {/* Unit rows (expanded) */}
                {isExpanded && topicUnits.length > 0 && (
                  <div className="ml-4 mt-0.5 space-y-0.5 border-l-2 border-gray-100 pl-2">
                    {topicUnits.map(u => {
                      const uCount = countByUnit[u.id] || 0
                      const uActive = selectedUnit?.id === u.id
                      return (
                        <div key={u.id}>
                        <button
                          onClick={() => { setSelectedTopic(t.name); handleUnitClick(u) }}
                          className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left text-xs transition
                            ${uActive
                              ? 'bg-indigo-100 text-indigo-800 font-medium'
                              : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                          <BookOpen size={11} className="shrink-0 opacity-50" />
                          <span className="flex-1 leading-tight line-clamp-2">{u.name}</span>
                          <span className={`shrink-0 text-xs px-1 py-0.5 rounded-full
                            ${uActive ? 'bg-indigo-200 text-indigo-700' : 'bg-gray-100 text-gray-400'}`}>
                            {uCount}
                          </span>
                        </button>
                        {uActive && unitLessonTitles.length > 0 && (
                          <div className="ml-4 mt-0.5 space-y-0.5 border-l-2 border-indigo-100 pl-2">
                            {unitLessonTitles.map(lt => {
                              const ltActive = selectedLessonTitle?.id === lt.id
                              const ltCount = countByLessonTitle[lt.id] || 0
                              return (
                                <button
                                  key={lt.id}
                                  onClick={() => setSelectedLessonTitle(prev => prev?.id === lt.id ? null : lt)}
                                  className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-left text-xs transition
                                    ${ltActive ? 'bg-indigo-600 text-white font-medium' : 'text-gray-500 hover:bg-gray-100'}`}
                                >
                                  <span className="flex-1 leading-tight line-clamp-2">{lt.name}</span>
                                  <span className={`shrink-0 text-xs px-1 py-0.5 rounded-full
                                    ${ltActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                    {ltCount}
                                  </span>
                                </button>
                              )
                            })}
                          </div>
                        )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })
        )}
      </nav>
    </aside>
    </>
  )
}
