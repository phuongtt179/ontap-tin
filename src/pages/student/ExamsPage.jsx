import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import QuizSession from '../../components/student/QuizSession'
import WordEditor from '../../components/editor/WordEditor'
import PPTEditor from '../../components/editor/PPTEditor'
import toast from 'react-hot-toast'
import { Clock, PlayCircle, CheckCircle, Loader2, Send } from 'lucide-react'

/* ── Timer display ───────────────────────────────────────────── */
function TimerBadge({ seconds }) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  const urgent = seconds < 60
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold tabular-nums ${urgent ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-indigo-100 text-indigo-700'}`}>
      <Clock size={14} />
      {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
    </span>
  )
}

/* ── Single question renderer (all-on-one-page style) ────────── */
function QuestionItem({ q, index, answer, onAnswer }) {
  const opts = q.type === 'true_false'
    ? [{ key: 'true', text: 'Đúng' }, { key: 'false', text: 'Sai' }]
    : (q.options || [])

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <p className="text-sm font-medium text-gray-800 mb-3">
        <span className="text-indigo-500 font-bold mr-1">Câu {index + 1}.</span>
        {q.question}
      </p>
      {q.image_url && <img src={q.image_url} alt="" className="rounded-lg max-h-40 mb-3 object-contain" />}

      {(q.type === 'multiple_choice' || q.type === 'true_false') && (
        <div className="space-y-2">
          {opts.map(opt => {
            const key = typeof opt === 'object' ? opt.key : opt
            const text = typeof opt === 'object' ? opt.text : opt
            const chosen = answer === key
            return (
              <button key={key} type="button" onClick={() => onAnswer(key)}
                className={`w-full text-left px-3 py-2 rounded-lg border-2 text-sm transition
                  ${chosen ? 'border-indigo-500 bg-indigo-50 font-medium' : 'border-gray-200 hover:border-indigo-300'}`}>
                {text}
              </button>
            )
          })}
        </div>
      )}

      {q.type === 'fill_blank' && (
        <input
          type="text"
          value={answer || ''}
          onChange={e => onAnswer(e.target.value)}
          placeholder="Nhập câu trả lời..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      )}

      {!['multiple_choice', 'true_false', 'fill_blank'].includes(q.type) && (
        <p className="text-sm text-gray-400 italic">Câu hỏi loại {q.type} — trả lời bằng văn bản:</p>
      )}
    </div>
  )
}

/* ── ExamWithPractical ───────────────────────────────────────── */
function ExamWithPractical({ exam, questions, attemptNumber, onFinish }) {
  const { user } = useAuth()
  const [answers, setAnswers] = useState({})
  const [practicalContent, setPracticalContent] = useState(null)
  const [timeLeft, setTimeLeft] = useState(exam.time_limit ? exam.time_limit * 60 : null)
  const [submitting, setSubmitting] = useState(false)
  const submitted = useRef(false)

  useEffect(() => {
    if (!timeLeft) return
    if (timeLeft <= 0) { handleSubmit(true); return }
    const t = setTimeout(() => setTimeLeft(tl => tl - 1), 1000)
    return () => clearTimeout(t)
  }, [timeLeft])

  function normalizeAnswer(type, ans, correct) {
    if (!ans) return false
    if (type === 'matching') {
      const norm = s => s?.split(',').map(p => p.trim()).sort().join(',')
      return norm(ans) === norm(correct)
    }
    return ans.toString().toLowerCase() === (correct || '').toString().toLowerCase()
  }

  async function handleSubmit(autoSubmit = false) {
    if (submitted.current) return
    submitted.current = true
    setSubmitting(true)

    let correct = 0
    questions.forEach((q, i) => {
      if (normalizeAnswer(q.type, answers[i], q.correct_answer)) correct++
    })
    const theoryScore = questions.length > 0 ? Math.round((correct / questions.length) * 10 * 10) / 10 : 0

    try {
      await supabase.from('exam_sessions').insert({
        exam_id: exam.id,
        user_id: user.id,
        total: questions.length,
        correct,
        score: theoryScore,
        answers,
        attempt_number: attemptNumber,
        submitted_at: new Date().toISOString(),
        practical_content: practicalContent || null,
      })
      toast.success(autoSubmit ? 'Hết giờ — đã tự động nộp bài!' : 'Đã nộp bài thành công!')
    } catch {
      toast.error('Nộp bài thất bại')
    }
    setSubmitting(false)
    onFinish()
  }

  const answeredCount = Object.keys(answers).filter(k => answers[k]).length

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 py-3 mb-6 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-bold text-gray-800 text-base">{exam.title}</h1>
          <p className="text-xs text-gray-400 mt-0.5">{answeredCount}/{questions.length} câu lý thuyết đã trả lời</p>
        </div>
        <div className="flex items-center gap-3">
          {timeLeft != null && <TimerBadge seconds={timeLeft} />}
          <button
            onClick={() => handleSubmit(false)}
            disabled={submitting}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition disabled:opacity-50"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            Nộp bài
          </button>
        </div>
      </div>

      {/* Phần 1: Lý thuyết */}
      {questions.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 bg-indigo-500 rounded-full" />
            <h2 className="font-bold text-gray-800">
              Phần 1 — Lý thuyết
              {exam.theory_weight > 0 && <span className="text-sm font-normal text-gray-400 ml-1">({exam.theory_weight}%)</span>}
            </h2>
          </div>
          <div className="space-y-3">
            {questions.map((q, i) => (
              <QuestionItem
                key={q.id}
                q={q}
                index={i}
                answer={answers[i]}
                onAnswer={val => setAnswers(prev => ({ ...prev, [i]: val }))}
              />
            ))}
          </div>
        </section>
      )}

      {/* Phần 2: Thực hành */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 bg-orange-500 rounded-full" />
          <h2 className="font-bold text-gray-800">
            Phần 2 — Thực hành {exam.practical_type === 'word' ? '📝 Word' : '📊 PowerPoint'}
            {exam.practical_weight > 0 && <span className="text-sm font-normal text-gray-400 ml-1">({exam.practical_weight}%)</span>}
          </h2>
        </div>

        {exam.practical_instructions && (
          <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-amber-700 mb-1">Yêu cầu:</p>
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{exam.practical_instructions}</p>
          </div>
        )}

        {exam.practical_type === 'word' && (
          <WordEditor content={practicalContent} onChange={setPracticalContent} />
        )}
        {exam.practical_type === 'ppt' && (
          <PPTEditor content={practicalContent} onChange={setPracticalContent} />
        )}
      </section>

      {/* Bottom submit */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={() => handleSubmit(false)}
          disabled={submitting}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-lg text-sm font-bold transition disabled:opacity-50"
        >
          {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          Nộp bài
        </button>
      </div>
    </div>
  )
}

/* ── StudentExamsPage ────────────────────────────────────────── */
export default function StudentExamsPage() {
  const { profile, user } = useAuth()
  const [exams, setExams] = useState([])
  const [attemptsMap, setAttemptsMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [activeExam, setActiveExam] = useState(null)

  useEffect(() => {
    if (profile) loadExams()
  }, [profile?.id])

  async function loadExams() {
    setLoading(true)
    let q = supabase.from('exams').select('*').eq('is_active', true).eq('grade', profile.grade)
    if (profile.class_name) {
      q = q.or(`class_names.is.null,class_names.cs.{"${profile.class_name}"}`)
    } else {
      q = q.is('class_names', null)
    }
    const { data: examData } = await q.order('created_at', { ascending: false })

    if (examData?.length > 0) {
      const { data: sessionData } = await supabase
        .from('exam_sessions')
        .select('exam_id')
        .eq('user_id', user.id)
        .in('exam_id', examData.map(e => e.id))

      const map = {}
      ;(sessionData || []).forEach(s => {
        map[s.exam_id] = (map[s.exam_id] || 0) + 1
      })
      setAttemptsMap(map)
    }

    setExams(examData || [])
    setLoading(false)
  }

  async function startExam(exam) {
    if (!exam.question_ids?.length && !exam.has_practical) {
      toast.error('Đề thi chưa có nội dung'); return
    }
    let questions = []
    if (exam.question_ids?.length) {
      const { data, error } = await supabase.from('questions').select('*').in('id', exam.question_ids)
      if (error || !data) { toast.error('Không tải được câu hỏi'); return }
      questions = exam.question_ids.map(id => data.find(q => q.id === id)).filter(Boolean)
    }
    setActiveExam({ exam, questions })
  }

  if (activeExam) {
    const used = attemptsMap[activeExam.exam.id] || 0

    // Đề thi có phần thực hành → dùng ExamWithPractical
    if (activeExam.exam.has_practical) {
      return (
        <ExamWithPractical
          exam={activeExam.exam}
          questions={activeExam.questions}
          attemptNumber={used + 1}
          onFinish={() => { setActiveExam(null); loadExams() }}
        />
      )
    }

    // Đề thi thuần lý thuyết → dùng QuizSession như cũ
    return (
      <QuizSession
        questions={activeExam.questions}
        mode="exam"
        examMode={true}
        examId={activeExam.exam.id}
        timeLimit={activeExam.exam.time_limit}
        attemptNumber={used + 1}
        showAnswer={activeExam.exam.show_answer}
        showScore={activeExam.exam.show_score}
        onFinish={() => { setActiveExam(null); loadExams() }}
      />
    )
  }

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Đề thi</h1>
      <p className="text-gray-500 mb-6">
        {profile?.class_name ? `Lớp ${profile.class_name}` : `Khối ${profile?.grade}`} — Các đề thi đang mở
      </p>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      ) : exams.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">Chưa có đề thi nào</p>
          <p className="text-sm mt-1">Giáo viên chưa mở đề thi cho lớp bạn</p>
        </div>
      ) : (
        <div className="space-y-3 max-w-xl">
          {exams.map(exam => {
            const used = attemptsMap[exam.id] || 0
            const max = exam.max_attempts
            const canTake = max === 0 || used < max
            const done = used > 0

            return (
              <div key={exam.id} className="bg-white rounded-2xl border border-gray-200 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-800">{exam.title}</h3>
                      {done && (
                        <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                          <CheckCircle size={11} /> Đã làm
                        </span>
                      )}
                      {exam.has_practical && (
                        <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
                          {exam.practical_type === 'word' ? '📝' : '📊'} Có thực hành
                        </span>
                      )}
                    </div>
                    <div className="flex gap-3 mt-1.5 text-xs text-gray-400 flex-wrap">
                      {exam.question_ids?.length > 0 && <span>{exam.question_ids.length} câu lý thuyết</span>}
                      {exam.has_practical && (
                        <span>{exam.theory_weight}% lý thuyết + {exam.practical_weight}% thực hành</span>
                      )}
                      {exam.time_limit
                        ? <span className="flex items-center gap-1"><Clock size={11} />{exam.time_limit} phút</span>
                        : <span>Không giới hạn thời gian</span>
                      }
                      <span>{max === 0 ? `Đã làm ${used} lần` : `${used}/${max} lần`}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => canTake && startExam(exam)}
                    disabled={!canTake}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition shrink-0 ${
                      canTake ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <PlayCircle size={15} />
                    {canTake ? (done ? 'Làm lại' : 'Làm bài') : 'Hết lượt'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
