// Quy tắc trang Học sinh của giáo viên: đọc danh sách dán vào, ghép hồ sơ + ghi danh, lọc, chờ duyệt. Hàm thuần.

/** tên đăng nhập hợp lệ: chữ không dấu, số, _ và . */
export const TEN_DANG_NHAP_HOP_LE = /^[a-zA-Z0-9_.]+$/
export const MAT_KHAU_TOI_THIEU = 6

/**
 * Đọc danh sách học sinh dán vào (mỗi dòng: họ tên, tên đăng nhập, mật khẩu, khoá (tuỳ chọn), ca (tuỳ chọn) —
 * cách nhau bằng dấu phẩy hoặc tab). Mỗi dòng trả kèm _line (số dòng) và _errors (rỗng = hợp lệ).
 */
export function docDanhSachNhap(text) {
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map((line, index) => {
      const parts = line.split(/[,\t]/).map(p => p.trim())
      if (parts.length < 3) {
        return { _raw: line, _line: index + 1, _errors: [`Dòng ${index + 1}: cần ít nhất 3 cột (tên, đăng nhập, mật khẩu)`] }
      }
      const [full_name, username, password, grade = '', class_name = ''] = parts
      const errors = []
      if (!full_name) errors.push('Thiếu họ tên')
      if (!username) errors.push('Thiếu tên đăng nhập')
      else if (!TEN_DANG_NHAP_HOP_LE.test(username)) errors.push('Tên đăng nhập chỉ gồm a-z, 0-9, _ .')
      if (!password) errors.push('Thiếu mật khẩu')
      else if (password.length < MAT_KHAU_TOI_THIEU) errors.push(`Mật khẩu ít nhất ${MAT_KHAU_TOI_THIEU} ký tự`)
      return { full_name, username, password, grade, class_name, _raw: line, _line: index + 1, _errors: errors }
    })
}

/** các tên đăng nhập trong danh sách (để hỏi máy chủ tên nào đã có) */
export const tenDangNhapCanKiemTra = dong => dong.filter(r => r.username).map(r => r.username)

/** đánh dấu dòng hợp lệ mà tên đăng nhập đã có tài khoản */
export function danhDauTrung(dong, daCo) {
  return dong.map(r => r._errors.length || !daCo.has(r.username) ? r
    : { ...r, _duplicate: true, _errors: [`Tên đăng nhập "${r.username}" đã tồn tại`] })
}

/** lỗi tạo tài khoản → câu dễ hiểu */
export const loiTaoTaiKhoan = msg =>
  /already (been )?registered/.test(msg || '') ? 'Tên đăng nhập đã tồn tại' : msg

/**
 * Ghép hồ sơ học sinh + các ghi danh (khoá / lớp). Khoá / lớp hiển thị = ghi danh đầu tiên (theo tên khoá);
 * chưa có ghi danh → rỗng.
 */
export function ghepGhiDanh(hoSo, ghiDanh) {
  const theoHs = {}
  ;(ghiDanh || []).forEach(e => { (theoHs[e.user_id] ||= []).push(e) })
  return (hoSo || []).map(s => {
    const ds = (theoHs[s.id] || []).sort((a, b) => a.grade.localeCompare(b.grade))
    return { ...s, enrollments: ds, grade: ds[0]?.grade || '', class_name: ds[0]?.class_name || '' }
  })
}

/** lọc theo khoá / lớp (học sinh có ghi danh khớp), xếp theo lớp rồi tên */
export function locTheoKhoaLop(hocSinh, { khoa = '', lop = '' } = {}) {
  return hocSinh
    .filter(s => (!khoa || s.enrollments.some(e => e.grade === khoa)) && (!lop || s.enrollments.some(e => e.class_name === lop)))
    .sort((a, b) => (a.class_name || '').localeCompare(b.class_name || '') || a.full_name.localeCompare(b.full_name))
}

/** chờ duyệt: tài khoản chưa duyệt hoặc còn ghi danh chưa duyệt; còn lại là đã duyệt */
export function chiaTheoDuyet(hocSinh) {
  const cho = s => s.is_approved === false || s.enrollments?.some(e => !e.is_approved)
  return { choDuyet: hocSinh.filter(cho), daDuyet: hocSinh.filter(s => !cho(s)) }
}

/** tìm theo tên (không phân biệt hoa thường) */
export const timTheoTen = (hocSinh, tim) =>
  tim ? hocSinh.filter(s => s.full_name?.toLowerCase().includes(tim.toLowerCase())) : hocSinh

const BANG_MAU = ['bg-blue-100 text-blue-700', 'bg-green-100 text-green-700', 'bg-purple-100 text-purple-700', 'bg-orange-100 text-orange-700', 'bg-pink-100 text-pink-700']
/** màu nhãn cho từng khoá (theo thứ tự khoá, lặp lại sau 5 màu) */
export const mauTheoKhoa = cacKhoa => Object.fromEntries(cacKhoa.map((g, i) => [g, BANG_MAU[i % BANG_MAU.length]]))
