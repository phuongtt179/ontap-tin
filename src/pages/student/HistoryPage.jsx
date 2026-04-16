import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { CheckCircle, Clock, ClipboardList, PenSquare } from 'lucide-react'

export default function HistoryPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState('exams')
  const [practiceSessions, setPracticeSessions] = useState([])
  const [examSessions, setExamSessions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: practice }, { data: exams }] = await Promise.all([
        supabase
          .from('quiz_sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('exam_sessions')
          .select('*, exams(title)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50),
      ])
      setPracticeSessions(practice || [])
      setExamSessions(exams || [])
      setLoading(false)
    }
    load()
  }, [user.id])

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
    </div>
  )

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-5">Kết quả</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 max-w-xs">
        <button
          onClick={() => setTab('exams')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition ${
            tab === 'exams' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <ClipboardList size={15} /> Đề thi
          {examSessions.length > 0 && (
            <span className="bg-indigo-100 text-indigo-600 text-xs px-1.5 rounded-full">{examSessions.length}</span>
          )}
        </button>
        <button
          onClick={() => setTab('practice')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition ${
            tab === 'practice' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <PenSquare size={15} /> Luyện tập
          {practiceSessions.length > 0 && (
            <span className="bg-indigo-100 text-indigo-600 text-xs px-1.5 rounded-full">{practiceSessions.length}</span>
          )}
        </button>
      </div>

      {/* Exam sessions */}
      {tab === 'exams' && (
        examSessions.length === 0 ? (
          <div className="text-center py-16 text-gray-400">Chưa làm đề thi nào</div>
        ) : (
          <div className="space-y-3 max-w-2xl">
            {examSessions.map(s => {
              const percent = Math.round((s.correct / s.total) * 100)
              const date = new Date(s.created_at).toLocaleDateString('vi-VN', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })
              return (
                <div key={s.id} className="bg-white rounded-xl border border-gray-200 px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-sm truncate">
                        {s.exams?.title || 'Đề thi'}
                      </p>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-sm text-gray-600">
                          {s.correct}/{s.total} câu đúng
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${percent >= 70 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-600'}`}>
                          {percent}%
                        </span>
                        {s.attempt_number > 1 && (
                          <span className="text-xs text-gray-400">Lần {s.attempt_number}</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                        <Clock size={12} /> {date}
                      </div>
                    </div>
                    <div className={`text-2xl font-bold shrink-0 ${percent >= 70 ? 'text-green-600' : 'text-orange-500'}`}>
                      {s.score}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}

      {/* Practice sessions */}
      {tab === 'practice' && (
        practiceSessions.length === 0 ? (
          <div className="text-center py-16 text-gray-400">Chưa có bài luyện tập nào</div>
        ) : (
          <div className="space-y-3 max-w-2xl">
            {practiceSessions.map(s => {
              const percent = Math.round((s.correct / s.total) * 100)
              const date = new Date(s.created_at).toLocaleDateString('vi-VN', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })
              return (
                <div key={s.id} className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-800">
                        {s.correct}/{s.total} câu đúng
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${percent >= 70 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-600'}`}>
                        {percent}%
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock size={12} /> {date}
                    </div>
                  </div>
                  <div className={`text-2xl font-bold ${percent >= 70 ? 'text-green-600' : 'text-orange-500'}`}>
                    {s.score}
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}
    </div>
  )
}
