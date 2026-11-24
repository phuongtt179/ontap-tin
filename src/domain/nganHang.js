// Quy tắc ngân hàng bài (phòng thi): danh mục ứng dụng / dạng / độ khó, kiểm tra bài trước khi lưu, chọn đề ngẫu nhiên.
// Hàm thuần: không gọi mạng, không giao diện → kiểm tra tự động được (nganHang.test.js).
import { coChua } from './ten'

/** ứng dụng của bài → nhãn hiển thị */
export const UNG_DUNG = { python: '🐍 Python', scratch: '🐱 Scratch', word: '📝 Word', ppt: '📊 PowerPoint', go_phim: '⌨️ Gõ phím', thu_muc: '📁 Thư mục – tệp' }
/** cách chấm → nhãn hiển thị */
export const CACH_CHAM = { test: 'Test tự động', tieu_chi: 'Theo tiêu chí', do_tu_dong: 'Đo tự động', cau_truc: 'Kiểm tra cấu trúc' }
/** độ khó → nhãn hiển thị */
export const DO_KHO = { de: 'Dễ', trung_binh: 'Trung bình', kho: 'Khó' }

/** dạng bài Python — khớp chuyên đề khoá Cơ bản + 8 chuyên đề khoá Nâng cao (chuẩn hoá 25/11/2026 theo dạng bài codemath) */
export const DANG_PYTHON = [
  'Nhập xuất – tính toán', 'Rẽ nhánh', 'Chia dư – làm tròn', 'Vòng lặp', 'Xâu', 'Danh sách', 'Hàm',
  'Dãy số quy luật', 'Chia hết – ước bội', 'Chữ số – tạo số', 'Thời gian – mô phỏng', 'Xâu nâng cao',
  'Bảng – lưới – đếm hình', 'Danh sách nâng cao', 'Kĩ thuật làm nhanh', 'Tổng hợp',
]

/** kiểm tra bài trước khi lưu → câu báo lỗi, hoặc null nếu được. tests: [{ expected }] */
export function loiBaiLuyen(bai, tests = []) {
  if (!String(bai.ten || '').trim()) return 'Nhập tên bài'
  if (!UNG_DUNG[bai.ung_dung]) return 'Chọn ứng dụng'
  if (!CACH_CHAM[bai.cach_cham]) return 'Chọn cách chấm'
  if (bai.do_kho && !DO_KHO[bai.do_kho]) return 'Độ khó không hợp lệ'
  if (bai.cach_cham === 'test' && !tests.some(t => String(t.expected ?? '').trim() !== '')) return 'Bài chấm bằng test cần ít nhất 1 test có output mong đợi'
  return null
}

/** trộn danh sách (Fisher–Yates) với hàm ngẫu nhiên cho trước — để kiểm tra được */
function tron(ds, rand) {
  const a = [...ds]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Chọn đề ngẫu nhiên từ ngân hàng.
 * cacBai: [{ id, dang, do_kho, tu_khoa_hoc }]; yeuCau: [{ so, do_kho?, dang? }] (mỗi dòng: lấy `so` bài thoả điều kiện);
 * boQua: Set id không lấy (đã dùng / đã có trong đề); tranhKhoaHoc: bỏ bài chép từ khoá học.
 * → { ids } hoặc { loi: 'câu báo' } nếu không đủ bài. Một bài không bị chọn 2 lần.
 */
export function chonNgauNhien(cacBai, yeuCau, { boQua = new Set(), tranhKhoaHoc = false, rand = Math.random } = {}) {
  const daChon = new Set()
  const ids = []
  for (const y of yeuCau) {
    const so = Number(y.so) || 0
    if (so <= 0) continue
    const hop = cacBai.filter(b => !boQua.has(b.id) && !daChon.has(b.id)
      && (!y.do_kho || b.do_kho === y.do_kho) && (!y.dang || b.dang === y.dang) && !(tranhKhoaHoc && b.tu_khoa_hoc))
    if (hop.length < so) {
      const ten = [y.dang, y.do_kho && DO_KHO[y.do_kho]].filter(Boolean).join(' – ') || 'bất kì'
      return { loi: `Không đủ bài "${ten}": cần ${so}, chỉ còn ${hop.length}` }
    }
    for (const b of tron(hop, rand).slice(0, so)) { daChon.add(b.id); ids.push(b.id) }
  }
  return { ids }
}

/** lọc danh sách bài: tìm (không dấu) theo tên / nguồn, dạng, độ khó, khoá được mở, bỏ bài từ khoá học */
export function locBai(ds, { tim = '', dang = '', do_kho = '', khoa = '', boKhoaHoc = false } = {}) {
  return ds.filter(b => (!tim || coChua(`${b.ten} ${b.nguon || ''}`, tim))
    && (!dang || b.dang === dang) && (!do_kho || b.do_kho === do_kho)
    && (!khoa || (b.khoa || []).includes(khoa)) && !(boKhoaHoc && b.tu_khoa_hoc))
}

/** bộ lọc rỗng (mặc định) cho locBai */
export const LOC_TRONG = { tim: '', dang: '', do_kho: '', khoa: '', boKhoaHoc: false }
