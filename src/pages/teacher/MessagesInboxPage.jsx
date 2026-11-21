// Hộp thư giáo viên (/teacher/messages). Xử lý: hooks/useHopThu · phần giao diện: components/teacher/hopThu/.
import { useHopThu } from '../../hooks/useHopThu'
import DanhSachHoiThoai from '../../components/teacher/hopThu/DanhSachHoiThoai'
import KhungChat from '../../components/teacher/hopThu/KhungChat'
import NhanEmMoi from '../../components/teacher/hopThu/NhanEmMoi'
import NhanCaLop from '../../components/teacher/hopThu/NhanCaLop'

export default function MessagesInboxPage() {
  const h = useHopThu()
  return (
    <>
      <div className="flex h-full overflow-hidden bg-gray-50">
        <DanhSachHoiThoai h={h} />
        <KhungChat h={h} />
      </div>
      <NhanEmMoi h={h} />
      <NhanCaLop h={h} />
    </>
  )
}
