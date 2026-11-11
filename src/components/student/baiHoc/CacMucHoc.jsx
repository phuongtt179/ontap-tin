// Các khung học ở cột trái trang Học bài: Lý thuyết, Video, Bài giảng (web / PDF / PowerPoint), Bài tập (quiz).
// Chỉ hiển thị — đánh dấu đã học / nộp quiz báo lên trang qua on…
// an = cột trái đang bị ẩn trên desktop: KHÔNG dựng video / bài giảng lúc đó (máy yếu bị treo / trắng trang).
import { lazy, Suspense } from 'react'
import { BookOpen, FileText, Lightbulb, PlayCircle } from 'lucide-react'
import MarkdownContent from '../../ui/MarkdownContent'
import PDFViewer from '../../ui/PDFViewer'
import { DoneChip, ActionButton, SectionCard } from './KhungMuc'
import { LessonQuiz } from './LessonQuiz'
import { getEmbedUrl } from '../../../utils/video'
// Bài giảng web (trình chiếu) – tải khi bài có bài giảng web
const LessonSlidesViewer = lazy(() => import('../../slides/LessonSlidesViewer.jsx'))

export function MucLyThuyet({ noiDung, xong, dangDanhDau, onDanhDau }) {
  return (
    <SectionCard icon={<Lightbulb size={18} />} iconBg="bg-amber-100" iconColor="text-amber-600"
      title="Lý thuyết" done={xong} locked={false} lockMessage="">
      <div className="mb-4">
        <MarkdownContent text={noiDung} />
      </div>
      {xong
        ? <DoneChip label="Đã đọc lý thuyết" />
        : <ActionButton onClick={onDanhDau} disabled={dangDanhDau} loading={dangDanhDau} color="amber">
            Đánh dấu đã đọc
          </ActionButton>}
    </SectionCard>
  )
}

export function MucVideo({ videoUrl, xong, an, dangDanhDau, onDanhDau }) {
  const embedUrl = getEmbedUrl(videoUrl)
  return (
    <SectionCard icon={<PlayCircle size={18} />} iconBg="bg-blue-100" iconColor="text-blue-600"
      title="Video bài giảng" done={xong} locked={false} lockMessage="">
      {/* Cột này bị ẩn hẳn (display:none) khi cột trái bị ẩn (an) trên desktop — không
          render iframe/video lúc đó để tránh giữ tài nguyên chạy ngầm trong lúc ẩn
          (video/pptx/pdf nặng, một số máy cấu hình yếu bị treo/trắng trang). */}
      {an ? null : embedUrl ? (
        <div className="w-full aspect-video rounded-xl overflow-hidden bg-black mb-4">
          <iframe src={embedUrl} title="Lesson video" className="w-full h-full"
            frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
        </div>
      ) : (
        <div className="mb-4">
          <a href={videoUrl} target="_blank" rel="noopener noreferrer"
            className="text-indigo-600 hover:underline text-sm">{videoUrl}</a>
        </div>
      )}
      {xong
        ? <DoneChip label="Đã xem video" />
        : <ActionButton onClick={onDanhDau} disabled={dangDanhDau} loading={dangDanhDau} color="blue">
            Đánh dấu đã xem video
          </ActionButton>}
    </SectionCard>
  )
}

export function MucBaiGiang({ pptxUrl, webSlides, xong, daXem, an, dangDanhDau, onDanhDau }) {
  const isPdf = pptxUrl?.split('?')[0].toLowerCase().endsWith('.pdf')
  return (
    <SectionCard icon={<FileText size={18} />} iconBg="bg-orange-100" iconColor="text-orange-600"
      title={webSlides ? 'Bài giảng' : isPdf ? 'Bài giảng (PDF)' : 'Bài giảng (PowerPoint)'} done={xong} locked={false}
      lockMessage="Xem video trước để mở khóa">
      {an ? null : webSlides ? (
        <Suspense fallback={<div className="w-full rounded-xl bg-gray-100 mb-4 flex items-center justify-center text-sm text-gray-400" style={{ aspectRatio: '16/9' }}>Đang tải bài giảng…</div>}>
          <LessonSlidesViewer slides={webSlides} onXemHet={() => { if (!daXem && !dangDanhDau) onDanhDau() }} />
        </Suspense>
      ) : !pptxUrl ? (
        <div className="w-full rounded-xl bg-gray-100 mb-4 flex items-center justify-center text-sm text-gray-400" style={{ aspectRatio: '16/9' }}>Đang tải bài giảng…</div>
      ) : isPdf ? (
        <div className="mb-4">
          <PDFViewer url={pptxUrl} />
        </div>
      ) : (
        <div className="w-full rounded-xl overflow-hidden border border-gray-200 mb-4" style={{ aspectRatio: '16/9' }}>
          <iframe src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(pptxUrl)}`}
            width="100%" height="100%" frameBorder="0" title="Bài giảng PPTX" className="w-full h-full block" allowFullScreen />
        </div>
      )}
      {xong
        ? <DoneChip label="Đã xem bài giảng" />
        : <ActionButton onClick={onDanhDau} disabled={dangDanhDau} loading={dangDanhDau} color="orange">
            Đánh dấu đã xem bài giảng
          </ActionButton>}
    </SectionCard>
  )
}

export function MucBaiTap({ questions, progress, xong, dangLam, coBaiGiang, batDauTuCau, soDungLucDau,
  onBatDau, onLamLai, onHoiTroGiang, onTienDo, onNop }) {
  return (
    <SectionCard icon={<BookOpen size={18} />} iconBg="bg-indigo-100" iconColor="text-indigo-600"
      title="Bài tập" badge={`${questions.length} câu`}
      done={xong && !dangLam} locked={false}
      lockMessage={coBaiGiang ? 'Xem bài giảng trước để mở khóa' : 'Xem video trước để mở khóa'}>
      {xong && !dangLam ? (
        <div className="flex items-center gap-4 flex-wrap">
          <DoneChip label={`Đạt · ${progress?.quiz_correct ?? 0}/${progress?.quiz_total ?? questions.length} câu đúng`} />
          <button onClick={onLamLai} className="text-xs text-indigo-600 hover:underline font-medium">Làm lại</button>
        </div>
      ) : !dangLam ? (
        (() => {
          const hasResume = progress?.quiz_current_idx > 0 && !progress?.quiz_passed
          return hasResume ? (
            <div className="flex flex-col gap-3">
              <ActionButton onClick={() => onBatDau(false)} color="indigo">
                Tiếp tục từ câu {progress.quiz_current_idx + 1}/{questions.length}
              </ActionButton>
              <button onClick={() => onBatDau(true)} className="text-xs text-gray-400 hover:text-gray-600 underline text-left">
                Làm lại từ đầu
              </button>
            </div>
          ) : (
            <ActionButton onClick={() => onBatDau()} color="indigo">Bắt đầu làm bài</ActionButton>
          )
        })()
      ) : (
        <LessonQuiz
          questions={questions}
          initialCurrent={batDauTuCau}
          initialCorrectCount={soDungLucDau}
          onAskTutor={onHoiTroGiang}
          onProgress={onTienDo}
          onSubmit={onNop}
        />
      )}
    </SectionCard>
  )
}
