import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { ShieldCheck, RefreshCw, BookOpenText, MessagesSquare, Lightbulb } from 'lucide-react'
import HintsTab from '../../components/teacher/aiTools/HintsTab'
import ReviewTab from '../../components/teacher/aiTools/ReviewTab'
import BackfillTab from '../../components/teacher/aiTools/BackfillTab'
import TutorNotesTab from '../../components/teacher/aiTools/TutorNotesTab'
import InsightsTab from '../../components/teacher/aiTools/InsightsTab'

const TABS = [
  { key: 'review', label: 'Duyệt bài AI chấm', icon: ShieldCheck },
  { key: 'backfill', label: 'Chấm bù', icon: RefreshCw },
  { key: 'notes', label: 'Nội dung gia sư', icon: BookOpenText },
  { key: 'insights', label: 'HS đang thắc mắc', icon: MessagesSquare },
  { key: 'hints', label: 'Gợi ý câu hỏi', icon: Lightbulb },
]

export default function AiToolsPage() {
  const [params, setParams] = useSearchParams()
  const tab = TABS.some(t => t.key === params.get('tab')) ? params.get('tab') : 'review'
  const [summary, setSummary] = useState(null)

  const loadSummary = useCallback(() => {
    supabase.rpc('ai_tools_summary').then(({ data }) => setSummary(data || null))
  }, [])
  useEffect(() => { loadSummary() }, [loadSummary])

  const badge = key => {
    if (!summary) return null
    const n = key === 'review' ? summary.ai_unreviewed : key === 'backfill' ? summary.ungraded : null
    return n ? <span className="ml-1 text-[10px] bg-red-500 text-white rounded-full px-1.5">{n > 999 ? '999+' : n}</span> : null
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4">
      <div>
        <h1 className="text-xl font-black text-gray-800">Trung tâm AI</h1>
        <p className="text-sm text-gray-500">Kiểm soát chất lượng AI chấm bài, chấm bù bài bị sót, chuẩn bị nội dung cho gia sư và nắm bắt thắc mắc của học sinh.</p>
      </div>
      <div className="flex gap-1 overflow-x-auto border-b border-gray-200">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setParams({ tab: t.key })}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px ${tab === t.key ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <t.icon size={15} /> {t.label}{badge(t.key)}
          </button>
        ))}
      </div>
      {tab === 'review' && <ReviewTab summary={summary} onChanged={loadSummary} />}
      {tab === 'backfill' && <BackfillTab onChanged={loadSummary} />}
      {tab === 'notes' && <TutorNotesTab />}
      {tab === 'insights' && <InsightsTab />}
      {tab === 'hints' && <HintsTab />}
    </div>
  )
}
