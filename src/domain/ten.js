// Quy tắc so khớp và xếp thứ tự theo tên (học sinh, lớp). Hàm thuần — dùng chung, đừng viết lại ở trang.

/** chữ thường, bỏ dấu tiếng Việt (đ → d) — để tìm tên không cần gõ dấu */
export const boDau = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd')

/** tên có chứa chữ cần tìm không (không phân biệt hoa thường, có dấu hay không); tìm rỗng → true */
export const coChua = (ten, tim) => boDau(ten).includes(boDau(String(tim || '').trim()))

/** chuẩn hoá để so khớp gần đúng: bỏ dấu, bỏ khoảng trắng / dấu câu, viết hoa — "lop kn 46", "KN-46" → "LOPKN46", "KN46" */
export const soKhop = s => boDau(s).toUpperCase().replace(/[^A-Z0-9]/g, '')

/** tên gọi = chữ cuối của họ tên ("Nguyễn Văn An" → "An") */
export const tenGoi = s => String(s || '').trim().split(/\s+/).pop()

/** so sánh 2 họ tên theo tên gọi (cách xếp danh sách lớp ở Việt Nam) — dùng trong .sort */
export const xepTheoTenGoi = (a, b) => tenGoi(a).localeCompare(tenGoi(b), 'vi')

/** so sánh 2 học sinh { class_name, full_name }: theo lớp rồi theo họ tên — dùng trong .sort */
export const xepTheoLopRoiTen = (a, b) =>
  (a.class_name || '').localeCompare(b.class_name || '') || (a.full_name || '').localeCompare(b.full_name || '')
