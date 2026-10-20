// Học sinh xem lại bài giảng web của bài học (thay cho file PPTX/PDF khi bài có bài giảng web).
// Xem trong khung 16:9 (bấm vào slide / nút ◀ ▶) hoặc toàn màn hình (dùng phím mũi tên).
// Xem tới slide cuối → báo onXemHet() để đánh dấu "đã xem bài giảng".
import { useState } from 'react'
import { Maximize2, X } from 'lucide-react'
import SlidePlayer from './SlidePlayer.jsx'

export default function LessonSlidesViewer({ slides, onXemHet }) {
  const [toan, setToan] = useState(false), [i, setI] = useState(0)
  const doi = n => { setI(n); if (n >= slides.length - 1) onXemHet?.() }
  return (
    <>
      <div className="relative w-full rounded-xl overflow-hidden border border-gray-200 mb-2" style={{ aspectRatio: '16/9' }}>
        {!toan && <SlidePlayer ds={slides} batDau={i} onDoi={doi} phimTat={false} />}
        <button onClick={() => setToan(true)} title="Xem toàn màn hình"
          className="absolute top-2 right-2 z-10 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/90 text-xs font-medium text-gray-700 shadow">
          <Maximize2 size={13} /> Toàn màn hình
        </button>
      </div>
      <p className="text-xs text-gray-400 mb-3">Bấm vào slide hoặc nút ▶ để xem tiếp — có câu hỏi, em tự trả lời trước rồi bấm để xem đáp án nhé!</p>
      {toan && (
        <div className="fixed inset-0 z-50 bg-black">
          <SlidePlayer ds={slides} batDau={i} onDoi={doi} />
          <button onClick={() => setToan(false)} className="absolute top-2 right-2 z-10 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/90 text-sm font-medium">
            <X size={14} /> Thoát
          </button>
        </div>
      )}
    </>
  )
}
