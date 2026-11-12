// Trang tiến độ + chấm bài thực hành 1 bài học (/teacher/lessons/:id/submissions).
// Tải + tự làm mới: hooks/useTienDoLop · thao tác chấm: hooks/useChamBaiThucHanh · phần giao diện: components/teacher/chamBai/.
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { parseTasks } from '../../domain/baiThucHanh'
import { baiCuaPhan, locVaXepHocSinh, thongKeLop } from '../../domain/chamBai'
import { useTienDoLop } from '../../hooks/useTienDoLop'
import { useChamBaiThucHanh } from '../../hooks/useChamBaiThucHanh'
import LoiHayGap from '../../components/teacher/chamBai/LoiHayGap'
import ThanhLoc from '../../components/teacher/chamBai/ThanhLoc'
import TheTongKet from '../../components/teacher/chamBai/TheTongKet'
import BangTienDo from '../../components/teacher/chamBai/BangTienDo'
import ChiTietHocSinh from '../../components/teacher/chamBai/ChiTietHocSinh'
import BangAiDaCham from '../../components/teacher/chamBai/BangAiDaCham'
import ModalChamBai from '../../components/teacher/chamBai/ModalChamBai'

export default function LessonSubmissionsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { lesson, students, classes, progressMap, submissionMap, lastRefresh, loading, suaBaiTaiCho } = useTienDoLop(id)
  const cham = useChamBaiThucHanh({ lesson, submissionMap, suaBaiTaiCho })

  const [lop, setLop] = useState('')
  const [tim, setTim] = useState('')
  const [hsDangXem, setHsDangXem] = useState(null)   // em đang mở trang chi tiết
  const [chamNhanh, setChamNhanh] = useState(null)   // { hs, phan } — cửa sổ chấm nhanh 1 phần
  const [xemAi, setXemAi] = useState(false)

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    )
  }

  const tasks = parseTasks(lesson?.practice_instructions)
  const coVideo = !!lesson?.video_url
  const coQuiz = (lesson?.question_ids?.length || 0) > 0
  const coThucHanh = !!lesson?.has_practice
  const hocSinh = locVaXepHocSinh(students, { lop, tim }, submissionMap)
  const tk = thongKeLop(hocSinh, progressMap, submissionMap, { coVideo, coQuiz, coThucHanh, soPhan: tasks.length })
  const baiNopDangHien = hocSinh.flatMap(s => submissionMap[s.id] || [])
  const subChamNhanh = chamNhanh && baiCuaPhan(submissionMap[chamNhanh.hs.id], chamNhanh.phan)

  function moChiTiet(hs) {
    setHsDangXem(hs)
    cham.moSoan(submissionMap[hs.id] || [], { thayHet: true })
  }
  function moChamNhanh(hs, phan) {
    const sub = baiCuaPhan(submissionMap[hs.id], phan)
    if (!sub) return   // chưa nộp, không mở
    cham.moSoan([sub])
    setChamNhanh({ hs, phan })
  }

  return (
    <div className={hsDangXem ? 'p-4 md:p-6 max-w-4xl mx-auto' : 'p-4 md:p-6'}>
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4 transition">
        <ArrowLeft size={16} /> Bài học
      </button>
      <h1 className="text-xl font-bold text-gray-800 mb-1">{lesson?.title}</h1>
      <p className="text-sm text-gray-500 mb-5">{lesson?.grade} · Tiến độ học sinh</p>

      <LoiHayGap baiNop={baiNopDangHien} />
      <ThanhLoc classes={classes} lop={lop} onLop={setLop} tim={tim} onTim={setTim} soHs={tk.tong}
        coThucHanh={coThucHanh} aiDangCham={cham.aiDangCham} soBaiAi={baiNopDangHien.filter(s => s.graded_by === 'ai').length}
        onAiCham={() => cham.aiChamTatCa(hocSinh)} onXemAi={() => setXemAi(true)} lanLamMoi={lastRefresh} />
      <TheTongKet tk={tk} />

      {hsDangXem ? (
        <ChiTietHocSinh hs={hsDangXem} subs={submissionMap[hsDangXem.id] || []} tasks={tasks} cham={cham} onQuayLai={() => setHsDangXem(null)} />
      ) : (
        <BangTienDo hocSinh={hocSinh} tienDo={progressMap} baiNop={submissionMap} lesson={lesson}
          coVideo={coVideo} coQuiz={coQuiz} coThucHanh={coThucHanh} soPhan={tasks.length}
          onChonHs={moChiTiet} onChamNhanh={moChamNhanh} />
      )}

      {xemAi && (
        <BangAiDaCham hocSinh={hocSinh} baiNop={submissionMap} dangDuyetHet={cham.dangDuyetHet}
          onDuyet={cham.duyetMucAi}
          onDuyetHet={async () => { if (await cham.duyetHetMucAi(hocSinh)) setXemAi(false) }}
          onSua={(hs, phan) => { setXemAi(false); moChamNhanh(hs, phan) }}
          onDong={() => setXemAi(false)} />
      )}
      {subChamNhanh && (
        <ModalChamBai hs={chamNhanh.hs} sub={subChamNhanh} task={tasks[chamNhanh.phan]} phan={chamNhanh.phan}
          cham={cham} onDong={() => setChamNhanh(null)} />
      )}
    </div>
  )
}
