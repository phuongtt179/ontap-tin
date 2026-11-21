// Trang Quản lý học sinh (/teacher/students): danh sách đã duyệt, chờ duyệt, nhập hàng loạt, sửa, ghi danh, xoá.
// Dữ liệu + thao tác: hooks/useHocSinh · quy tắc: domain/hocSinh.js · phần giao diện: components/teacher/hocSinh/.
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Upload, Clock } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useGrades } from '../../hooks/useGrades'
import { useHocSinh } from '../../hooks/useHocSinh'
import { locTheoKhoaLop, chiaTheoDuyet, timTheoTen, mauTheoKhoa } from '../../domain/hocSinh'
import StudentReportModal from '../../components/teacher/StudentReportModal'
import NhapHocSinhModal from '../../components/teacher/hocSinh/NhapHocSinhModal'
import SuaHocSinhModal from '../../components/teacher/hocSinh/SuaHocSinhModal'
import GhiDanhModal from '../../components/teacher/hocSinh/GhiDanhModal'
import DanhSachChoDuyet from '../../components/teacher/hocSinh/DanhSachChoDuyet'
import ThanhLocHocSinh from '../../components/teacher/hocSinh/ThanhLocHocSinh'
import BangHocSinh from '../../components/teacher/hocSinh/BangHocSinh'

export default function StudentsPage() {
  const { canDelete } = useAuth()
  const [searchParams] = useSearchParams()
  const { grades: cacKhoa } = useGrades()
  const { hocSinh, cacLop, loading, dangDuyet, taiLai, duyet, tuChoi, xoa, xoaNhieu } = useHocSinh()

  const [khoa, setKhoa] = useState(searchParams.get('grade') || '')
  const [lop, setLop] = useState(searchParams.get('class') || '')
  const [tim, setTim] = useState('')
  const [daChon, setDaChon] = useState(new Set())
  const [dangXoa, setDangXoa] = useState(false)
  const [moNhap, setMoNhap] = useState(false)
  const [moChoDuyet, setMoChoDuyet] = useState(false)
  const [hsSua, setHsSua] = useState(null)
  const [hsGhiDanh, setHsGhiDanh] = useState(null)
  const [hsThanhTich, setHsThanhTich] = useState(null)

  const { choDuyet, daDuyet } = chiaTheoDuyet(locTheoKhoaLop(hocSinh, { khoa, lop }))
  const dangHien = timTheoTen(daDuyet, tim)
  const lopCuaKhoa = khoa ? cacLop.filter(c => c.grade === khoa) : cacLop

  // đổi bộ lọc thì bỏ chọn (tránh xoá nhầm em đã khuất khỏi danh sách)
  const loc = fn => v => { fn(v); setDaChon(new Set()) }
  function doiChon(id) {
    setDaChon(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n })
  }
  const chonHet = () => setDaChon(daChon.size === dangHien.length ? new Set() : new Set(dangHien.map(s => s.id)))
  async function xoaDaChon() {
    setDangXoa(true)
    if (await xoaNhieu(dangHien.filter(s => daChon.has(s.id)), khoa)) setDaChon(new Set())
    setDangXoa(false)
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản lý học sinh</h1>
          <p className="text-gray-400 text-sm mt-0.5">{daDuyet.length} học sinh</p>
        </div>
        <div className="flex items-center gap-2">
          {choDuyet.length > 0 && (
            <button onClick={() => setMoChoDuyet(v => !v)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition border
                ${moChoDuyet ? 'bg-amber-500 border-amber-500 text-white' : 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100'}`}>
              <Clock size={15} /> Chờ duyệt
              <span className="bg-amber-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{choDuyet.length}</span>
            </button>
          )}
          <button onClick={() => setMoNhap(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
            <Upload size={16} /> Nhập học sinh
          </button>
        </div>
      </div>

      {moChoDuyet && choDuyet.length > 0 && (
        <DanhSachChoDuyet ds={choDuyet} dangDuyet={dangDuyet} onDuyet={duyet} onTuChoi={tuChoi}
          onSua={s => { setHsSua(s); setMoChoDuyet(false) }} />
      )}

      <ThanhLocHocSinh tim={tim} onTim={loc(setTim)} khoa={khoa} onKhoa={loc(v => { setKhoa(v); setLop('') })}
        lop={lop} onLop={loc(setLop)} cacKhoa={cacKhoa} cacLop={lopCuaKhoa}
        onXoaLoc={loc(() => { setKhoa(''); setLop(''); setTim('') })}
        coQuyenXoa={canDelete} soHien={dangHien.length} soChon={daChon.size} onChonHet={chonHet}
        dangXoa={dangXoa} onXoaChon={xoaDaChon} onBoChon={() => setDaChon(new Set())} />

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      ) : dangHien.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">Chưa có học sinh nào</p>
          <p className="text-sm mt-1">Bấm "Nhập học sinh" để thêm hàng loạt</p>
        </div>
      ) : (
        <BangHocSinh ds={dangHien} mauKhoa={mauTheoKhoa(cacKhoa)} coQuyenXoa={canDelete} daChon={daChon}
          onChon={doiChon} onChonHet={chonHet}
          onThanhTich={setHsThanhTich} onGhiDanh={setHsGhiDanh} onSua={setHsSua} onXoa={xoa} />
      )}

      {/* nhập xong vẫn để cửa sổ mở cho giáo viên xem em nào lỗi; danh sách phía sau tải lại ngay */}
      {moNhap && <NhapHocSinhModal onClose={() => setMoNhap(false)} onDone={taiLai} />}
      {hsSua && (
        <SuaHocSinhModal student={hsSua} classes={cacLop} gradeValues={cacKhoa}
          onClose={() => setHsSua(null)} onDone={() => { setHsSua(null); taiLai() }} />
      )}
      {hsGhiDanh && (
        <GhiDanhModal student={hsGhiDanh} classes={cacLop} gradeValues={cacKhoa}
          onDone={() => { setHsGhiDanh(null); taiLai() }} />
      )}
      {hsThanhTich && <StudentReportModal student={hsThanhTich} onClose={() => setHsThanhTich(null)} />}
    </div>
  )
}
