// Đầu trang Học bài: tên bài, mô tả, thanh các bước (lý thuyết → video → bài giảng → bài tập → thực hành), bước hiện tại.
import { ArrowLeft, BookOpen, CheckCircle, FileText, Lightbulb, Lock, PlayCircle, Upload } from 'lucide-react'

/** buoc: kết quả trangThaiBuoc (src/domain/tienDoBaiHoc.js) */
export default function DauBaiHoc({ lesson, buoc, onQuayLai }) {
  const { co, xong } = buoc
  const totalSteps = buoc.tongBuoc, doneSteps = buoc.soBuocXong
  const steps = [
    co.theory && { key: 'theory', label: 'Lý thuyết', icon: <Lightbulb size={16} />, done: xong.theory, locked: false },
    co.video && { key: 'video', label: 'Video', icon: <PlayCircle size={16} />, done: xong.video, locked: false },
    co.pptx && { key: 'pptx', label: 'Bài giảng', icon: <FileText size={16} />, done: xong.pptx, locked: false },
    co.quiz && { key: 'quiz', label: 'Bài tập', icon: <BookOpen size={16} />, done: xong.quiz, locked: false },
    co.practice && { key: 'practice', label: 'Thực hành', icon: <Upload size={16} />, done: xong.practice, locked: false },
  ].filter(Boolean)

  return (
    <div className="bg-gradient-to-r from-[#003d8f] via-[#0055bb] to-[#0077dd] text-white px-5 pt-5 pb-4 md:px-8 shrink-0">
      <div className="max-w-5xl mx-auto">
        <button onClick={onQuayLai}
          className="flex items-center gap-1.5 text-white/60 hover:text-white text-sm mb-4 transition">
          <ArrowLeft size={15} /> Bài học
        </button>
        <h1 className="text-xl md:text-2xl font-bold leading-tight">{lesson.title}</h1>
        {lesson.description && <p className="text-blue-200 text-sm mt-1">{lesson.description}</p>}

        {/* Stepper */}
        {steps.length > 0 && (
          <div className="flex items-center mt-6 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {steps.map((step, i) => (
              <div key={step.key} className="flex items-center flex-1 min-w-0">
                <div className="flex flex-col items-center shrink-0">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center border-2 transition-all duration-300
                    ${step.done
                      ? 'bg-green-400 border-green-300 shadow-lg shadow-green-500/40'
                      : !step.locked
                      ? 'bg-white border-white shadow-lg'
                      : 'bg-white/10 border-white/20'}`}
                    style={!step.done && !step.locked ? { animation: 'node-breathe 2s ease-in-out infinite' } : {}}>
                    {step.done
                      ? <CheckCircle size={20} className="text-white" />
                      : step.locked
                      ? <Lock size={15} className="text-white/30" />
                      : <span className="text-indigo-700">{step.icon}</span>}
                  </div>
                  <span className={`text-[10px] font-semibold mt-1.5 whitespace-nowrap
                    ${step.done ? 'text-green-300' : !step.locked ? 'text-white' : 'text-white/30'}`}>
                    {step.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 mb-4 rounded-full min-w-[16px] transition-all duration-500
                    ${step.done ? 'bg-green-400/70' : 'bg-white/20'}`} />
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
          <span className="text-blue-200 text-xs font-medium">
            {doneSteps === totalSteps && totalSteps > 0
              ? '🎉 Hoàn thành bài học!'
              : `Bước ${Math.min(doneSteps + 1, totalSteps)}/${totalSteps}`}
          </span>
          {doneSteps === totalSteps && totalSteps > 0 && (
            <span className="text-xs bg-green-400/20 text-green-300 font-semibold px-3 py-1 rounded-full">✓ Xong</span>
          )}
        </div>
      </div>
    </div>
  )
}
