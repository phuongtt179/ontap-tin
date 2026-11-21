// Quy tắc trang Phần thưởng của giáo viên: gắn tên / lớp vào yêu cầu đổi quà, lọc + xếp, quà hiện theo khoá. Hàm thuần.

/** gắn tên + lớp của em vào từng yêu cầu; created_at / fulfilled_at lấy cột mới, thiếu thì cột cũ */
export function ganTenYeuCau(ds, tenCua = {}, lopCua = {}) {
  return ds.map(r => ({
    ...r,
    profiles: { full_name: tenCua[r.student_id] || 'Học sinh', id: r.student_id },
    class_name: lopCua[r.student_id] || '',
    created_at: r.created_at || r.requested_at,
    fulfilled_at: r.fulfilled_at || r.given_at,
  }))
}

const KHOA_XEP = {
  reward: r => r.reward_items?.name ?? '',
  student: r => r.profiles?.full_name ?? '',
  class: r => r.class_name ?? '',
}

/** yêu cầu theo trạng thái, xếp theo quà / tên / lớp (chữ, kiểu tiếng Việt) hoặc ngày (mặc định) */
export function locVaXepYeuCau(ds, { trangThai, theo = 'date', tangDan = false }) {
  const chieu = tangDan ? 1 : -1
  const lay = KHOA_XEP[theo]
  return ds.filter(r => r.status === trangThai).sort((a, b) => lay
    ? chieu * lay(a).localeCompare(lay(b), 'vi')
    : chieu * (new Date(a.created_at) - new Date(b.created_at)))
}

/** quà hiện khi lọc theo khoá: quà của khoá đó + quà chung; '__all__' → mọi quà */
export const quaTheoKhoa = (ds, khoa) => khoa === '__all__' ? ds : ds.filter(i => i.grade === khoa || !i.grade)
