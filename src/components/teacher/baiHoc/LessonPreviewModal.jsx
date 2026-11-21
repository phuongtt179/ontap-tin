// Xem trước bài học như học sinh (không lưu kết quả): mô tả, video, bài giảng, đề thực hành, quiz.
import { useState, useEffect } from 'react'
import { X, Loader2, PlayCircle, FileText, ClipboardList, BookOpen, Eye } from 'lucide-react'
import MarkdownContent from '../../ui/MarkdownContent'
import QuizSession from '../../student/QuizSession'
import { layCauHoiTheoIds } from '../../../data/cauHoi'
import { parseTasks } from '../../../domain/baiThucHanh'
import { getEmbedUrl } from '../../../utils/video'

export default function LessonPreviewModal({ lesson, onClose }) {
  const [questions, setQuestions] = useState([])
  const [loadingQ, setLoadingQ] = useState(false)
  const [quizKey, setQuizKey] = useState(0)

  useEffect(() => {
    if (!lesson.question_ids?.length) return
    setLoadingQ(true)
    layCauHoiTheoIds(lesson.question_ids)
      .then(({ data }) => {
        const map = {}
        ;(data || []).forEach(q => { map[q.id] = q })
        setQuestions(lesson.question_ids.map(id => map[id]).filter(Boolean))
        setLoadingQ(false)
      })
  }, [lesson.id])

  const hasContent = lesson.video_url || lesson.pptx_url || lesson.description
  const tasks = lesson.practice_instructions ? parseTasks(lesson.practice_instructions) : []
  const embedUrl = getEmbedUrl(lesson.video_url)

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex flex-col">
      <div className="bg-white flex items-center justify-between px-6 py-3 border-b shrink-0">
        <div>
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <Eye size={16} className="text-indigo-500" />
            Xem trước: {lesson.title}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">Chế độ xem trước · không lưu kết quả</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

          {/* Lesson content */}
          {hasContent && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
              {lesson.description && (
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{lesson.description}</p>
              )}
              {lesson.video_url && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                    <PlayCircle size={12} /> Video bài học
                  </p>
                  {embedUrl ? (
                    <div className="aspect-video rounded-xl overflow-hidden bg-black">
                      <iframe
                        src={embedUrl}
                        title="Video bài học"
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <a href={lesson.video_url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline">
                      <PlayCircle size={14} /> Mở video
                    </a>
                  )}
                </div>
              )}
              {lesson.pptx_url && (
                <a href={lesson.pptx_url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-orange-600 hover:underline">
                  <FileText size={14} /> Tải bài trình chiếu (PPTX)
                </a>
              )}
            </div>
          )}

          {/* Practice tasks */}
          {lesson.has_practice && tasks.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
              <p className="text-xs font-semibold text-amber-700 mb-3 flex items-center gap-1.5">
                <ClipboardList size={13} /> Thực hành
              </p>
              {tasks.map((t, i) => t?.instructions && (
                <div key={i}>
                  {tasks.length > 1 && <p className="text-xs font-semibold text-amber-700 mb-1">Bài {i + 1}:</p>}
                  <MarkdownContent text={t.instructions} className="text-amber-900 text-sm" />
                </div>
              ))}
            </div>
          )}

          {/* Quiz */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-3 flex items-center gap-1.5">
              <BookOpen size={12} /> {questions.length} câu hỏi kiểm tra
            </p>
            {loadingQ ? (
              <div className="flex justify-center py-10">
                <Loader2 size={28} className="animate-spin text-indigo-400" />
              </div>
            ) : questions.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm bg-white rounded-2xl border border-gray-200">
                Bài học này chưa có câu hỏi
              </div>
            ) : (
              <QuizSession
                key={quizKey}
                questions={questions}
                mode="practice"
                preview={true}
                showAnswer={true}
                showScore={true}
                examMode={false}
                onFinish={() => setQuizKey(k => k + 1)}
              />
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
