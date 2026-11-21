// Quy tắc chấm phần thực hành PYTHON của đề thi (máy chủ dùng: api/thi-python.js).
// Hàm thuần: không gọi mạng, không đọc cơ sở dữ liệu → kiểm tra tự động được (chamPython.test.js).

export const TOI_DA_LAN = 10      // mỗi bài thi tối đa 10 lần nộp, tính lần cao nhất
export const GIAY_MOI_TEST = 2    // mỗi test chạy tối đa 2 giây
export const GIA_HAN_PHUT = 2     // nộp trễ tối đa 2 phút sau khi hết giờ (mạng chậm)
export const DO_DAI_TOI_DA = 20000

/** So kết quả: bỏ khoảng trắng cuối mỗi dòng và dòng trống cuối bài (giống cách chấm thông thường) */
export const chuanHoaKetQua = s =>
  String(s ?? '').replace(/\r\n/g, '\n').split('\n').map(l => l.replace(/\s+$/, '')).join('\n').replace(/\n+$/, '')

/** Trạng thái 1 test từ kết quả chạy { tle } | { rc, out }: 'qua_gio' | 'loi' | 'dung' | 'sai' */
export function trangThaiTest(k, mongDoi) {
  if (k?.tle) return 'qua_gio'
  if (k?.rc !== 0) return 'loi'
  return chuanHoaKetQua(k.out) === chuanHoaKetQua(mongDoi) ? 'dung' : 'sai'
}

/**
 * Chấm 1 lần nộp. tests: [{ expected, diem }], ketQuaChay: kết quả chạy theo đúng thứ tự test.
 * Học sinh chỉ nhận { stt, trang_thai } — không thấy input / output.
 * @returns { ket_qua: [{stt, trang_thai}], diem (thang 10, làm tròn 2 chữ số) }
 */
export function chamLanNop(tests, ketQuaChay) {
  const tong = tests.reduce((x, t) => x + Number(t.diem), 0)
  let duoc = 0
  const ket_qua = tests.map((t, i) => {
    const trang_thai = trangThaiTest(ketQuaChay[i], t.expected)
    if (trang_thai === 'dung') duoc += Number(t.diem)
    return { stt: i + 1, trang_thai }
  })
  return { ket_qua, diem: tong > 0 ? Math.round((duoc / tong) * 10 * 100) / 100 : 0 }
}

/**
 * Bài thi này có được nộp thêm lần nữa không. Trả về mã lỗi, hoặc null nếu được.
 * @param bt  { user_id, practical_type, submitted_at, started_at, time_limit (phút), practical_lan }
 */
export function loiKhongDuocNop(bt, userId, bayGio = Date.now()) {
  if (!bt || bt.user_id !== userId) return 'forbidden'
  if (bt.practical_type !== 'python') return 'khong_phai_de_python'
  if (bt.submitted_at) return 'da_nop_bai'
  if (bt.time_limit && bt.started_at &&
      bayGio > new Date(bt.started_at).getTime() + (bt.time_limit + GIA_HAN_PHUT) * 60000) return 'het_gio'
  if (bt.practical_lan >= TOI_DA_LAN) return 'het_luot'
  return null
}
