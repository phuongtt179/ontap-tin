// 📽 BÀI GIẢNG WEB – mô tả dữ liệu slide (JSON) + quy tắc "bấm để hiện". Không phụ thuộc React → dùng chung cho
// trình chiếu, trình soạn, AI. Chuyển từ app Lớp học số (domain/bai-giang.js), thêm khối CODE chạy được và
// chữ `code` cho môn lập trình; bỏ huy hiệu / ảnh trang SGK (app này dùng sticker và ảnh tải lên).
//
// Một bài giảng = mảng slide. Mỗi slide có "loai":
//   bia         { nhan, tieu, phu, khau_hieu }                                 – trang bìa
//   noi_dung    { tieu, tem, mau, khoi: [khối…] }                             – slide thường, xếp các khối từ trên xuống
//   trac_nghiem { tieu, tem, mau, cau, lua_chon: ['…'×2–4], dung: 0-3, giai_thich } – câu A–D, bấm để đóng dấu ĐÚNG
//   dung_sai    { tieu, tem, mau, cau, dung: true|false, giai_thich }        – O / X
// Chung cho mọi slide: ghi_chu (ghi chú cho giáo viên, không chiếu).
//
// Các khối trong slide noi_dung (thêm "an": true = ẩn, bấm mới hiện; với the/buoc/danh_sach thêm "tung": true = hiện từng mục):
//   loi       { ai: 'may' | 'Khoa' | …, chu }        – lời thoại (ai = 'may' → Bạn Máy Tính)
//   hoi_thoai { cac: [{ ai, chu }] }
//   cau       { chu }                                 – khung câu hỏi
//   the       { cac: [{ icon, tieu, chu, vd }] }      – 1–3 thẻ kiến thức
//   buoc      { cac: ['…'], ngang }                   – các bước có số (ngang = xếp ngang có mũi tên)
//   danh_sach { cac: ['…'], icon }                    – danh sách có dấu tích
//   ghi_nho   { chu }
//   dap_an    { chu }
//   code      { chu, chay, stdin }                    – đoạn code Python tô màu; chay = có nút ▶ Chạy (Pyodide)
//   hinh      { anh: { url }, chu_thich, rong }
//   dong_ho   { giay }
//   hai_cot   { trai: [khối…], phai: [khối…], ti_le: '3fr 2fr' }
// Chữ trong mọi trường: **đậm**, ==tô vàng==, `code`. Riêng câu hỏi (cau) còn nhận khối ```python … ```.

export const LOAI_SLIDE = { bia: 'Trang bìa', noi_dung: 'Nội dung', trac_nghiem: 'Câu hỏi A–D', dung_sai: 'Đúng / Sai (O–X)' }
export const LOAI_KHOI = {
  loi: 'Lời thoại', hoi_thoai: 'Hội thoại', cau: 'Câu hỏi', the: 'Thẻ kiến thức', buoc: 'Các bước', danh_sach: 'Danh sách',
  ghi_nho: 'Ghi nhớ', dap_an: 'Đáp án', code: 'Code Python', hinh: 'Hình', dong_ho: 'Đồng hồ', hai_cot: 'Hai cột',
}
export const MAU = ['ngoc', 'dat', 'mutat', 'thep', 'reu']
export const TEN_MAU = { ngoc: 'Xanh ngọc', dat: 'Cam đất', mutat: 'Vàng mù tạt', thep: 'Xanh thép', reu: 'Xanh rêu' }
export const DONG_TAC = ['chạm đầu', 'chạm vai', 'chạm tai', 'chạm mũi']
const CO_MUC = { the: 1, buoc: 1, danh_sach: 1 }

/** số lần bấm "hiện" của 1 khối / 1 slide (cùng thứ tự với lúc vẽ) */
export function demKhoi(k) {
  if (!k) return 0
  if (k.loai === 'hai_cot') return (k.trai || []).reduce((s, x) => s + demKhoi(x), 0) + (k.phai || []).reduce((s, x) => s + demKhoi(x), 0)
  if (!k.an) return 0
  return k.tung && CO_MUC[k.loai] ? (k.cac || []).length : 1
}
export function demBuoc(s) {
  if (!s) return 0
  if (s.loai === 'trac_nghiem' || s.loai === 'dung_sai') return 1   // bấm 1 lần: hiện đáp án
  if (s.loai === 'noi_dung') return (s.khoi || []).reduce((t, k) => t + demKhoi(k), 0)
  return 0
}

/** chữ có **đậm**, ==tô vàng==, `code` → các đoạn để vẽ */
export function tachChu(t) {
  const out = []; const re = /\*\*(.+?)\*\*|==(.+?)==|`([^`]+)`/g; let m, i = 0; t = String(t ?? '')
  while ((m = re.exec(t))) {
    if (m.index > i) out.push({ t: t.slice(i, m.index) })
    out.push(m[1] != null ? { t: m[1], b: 1 } : m[2] != null ? { t: m[2], h: 1 } : { t: m[3], c: 1 })
    i = re.lastIndex
  }
  if (i < t.length) out.push({ t: t.slice(i) })
  return out
}

/** tách câu hỏi có khối ```code``` → [{ chu } | { code }] */
export function tachCode(t) {
  const out = []; const re = /```[a-zA-Z]*\n?([\s\S]*?)```/g; let m, i = 0; t = String(t ?? '')
  while ((m = re.exec(t))) {
    if (m.index > i && t.slice(i, m.index).trim()) out.push({ chu: t.slice(i, m.index).trim() })
    out.push({ code: m[1].replace(/\n$/, '') })
    i = re.lastIndex
  }
  if (i < t.length && t.slice(i).trim()) out.push({ chu: t.slice(i).trim() })
  return out
}

/** kiểm tra bài giảng (trả về mảng lỗi, rỗng = hợp lệ) – dùng khi lưu và khi AI trả kết quả */
export function kiemTraBai(ds) {
  const loi = []
  if (!Array.isArray(ds) || !ds.length) return ['Bài giảng chưa có slide nào']
  ds.forEach((s, i) => {
    const n = 'Slide ' + (i + 1) + ': '
    if (!s || !LOAI_SLIDE[s.loai]) { loi.push(n + 'loại slide không hợp lệ'); return }
    if (s.loai === 'trac_nghiem') {
      if (!Array.isArray(s.lua_chon) || s.lua_chon.length < 2 || s.lua_chon.length > 4) loi.push(n + 'cần 2–4 lựa chọn')
      else if (!(s.dung >= 0 && s.dung < s.lua_chon.length)) loi.push(n + 'chưa chọn đáp án đúng')
    }
    if (s.loai === 'dung_sai' && typeof s.dung !== 'boolean') loi.push(n + 'chưa chọn Đúng hay Sai')
    const xet = (k, ten) => {
      if (!k || !LOAI_KHOI[k.loai]) loi.push(n + ten + ' không hợp lệ')
      else if (k.loai === 'hai_cot') [...(k.trai || []), ...(k.phai || [])].forEach(x => xet(x, 'khối trong hai cột'))
    }
    if (s.loai === 'noi_dung') (s.khoi || []).forEach((k, j) => xet(k, 'khối ' + (j + 1)))
  })
  return loi
}

/** bỏ slide / khối AI trả sai loại (giữ phần dùng được thay vì báo lỗi cả bài) */
export function lamSachBai(ds) {
  const khoiOk = k => k && LOAI_KHOI[k.loai]
  const sach = k => k.loai === 'hai_cot' ? { ...k, trai: (k.trai || []).filter(khoiOk), phai: (k.phai || []).filter(khoiOk) } : k
  return (Array.isArray(ds) ? ds : []).filter(s => s && LOAI_SLIDE[s.loai]).map(s => {
    if (s.loai === 'noi_dung') return { ...s, khoi: (s.khoi || []).filter(khoiOk).map(sach) }
    if (s.loai === 'trac_nghiem') return { ...s, lua_chon: (s.lua_chon || []).slice(0, 4), dung: Math.max(0, Math.min(+s.dung || 0, (s.lua_chon || []).length - 1)) }
    if (s.loai === 'dung_sai') return { ...s, dung: s.dung === true || s.dung === 'true' }
    return s
  })
}

/** câu hỏi trong ngân hàng (multiple_choice / true_false) → slide; null nếu không đổi được */
export function cauHoiThanhSlide(q) {
  if (q.type === 'multiple_choice') {
    const opts = (q.options || []).slice(0, 4)
    const dung = opts.findIndex(o => String(o.key).trim().toUpperCase() === String(q.correct_answer).trim().toUpperCase())
    if (opts.length < 2 || dung < 0) return null
    return { loai: 'trac_nghiem', tieu: 'Chọn đáp án đúng', tem: 'CÂU HỎI', mau: 'mutat', cau: q.question, lua_chon: opts.map(o => o.text), dung, giai_thich: q.hint || '', tu_cau_hoi: q.id }
  }
  if (q.type === 'true_false') {
    return { loai: 'dung_sai', tieu: 'Đúng hay sai? Giơ tay nào!', tem: 'O / X', mau: 'reu', cau: q.question, dung: /^đúng$/i.test(String(q.correct_answer).trim()), giai_thich: q.hint || '', tu_cau_hoi: q.id }
  }
  return null
}

// ---- Trình soạn: các trường của từng loại (tên, kiểu ô nhập, nhãn) ----
// kiểu: chu (1 dòng) · dai (nhiều dòng) · ds (mỗi dòng 1 mục) · mau · so · co (đánh dấu) · icon · chon_dung (A–D)
//       · dung_sai · doi (Ai: lời) · the · anh · khoi · code
const DAU = [['tieu', 'chu', 'Tiêu đề'], ['tem', 'chu', 'Nhãn góc phải (KHỞI ĐỘNG, KIẾN THỨC…)'], ['mau', 'mau', 'Màu nhãn']]
export const TRUONG_SLIDE = {
  bia: [['nhan', 'chu', 'Nhãn nhỏ (vd: Python A · Bài 5)'], ['tieu', 'chu', 'Tên bài (chữ to)'], ['phu', 'chu', 'Dòng viết tay màu xanh'], ['khau_hieu', 'chu', 'Khẩu hiệu']],
  noi_dung: [...DAU, ['khoi', 'khoi', 'Các khối nội dung']],
  trac_nghiem: [...DAU, ['cau', 'dai', 'Câu hỏi (có thể chèn ```python … ```)'], ['lua_chon', 'ds', 'Lựa chọn (mỗi dòng 1, tối đa 4)'], ['dung', 'chon_dung', 'Đáp án đúng'], ['giai_thich', 'dai', 'Giải thích (hiện cùng đáp án)']],
  dung_sai: [...DAU, ['cau', 'dai', 'Câu nhận định (có thể chèn ```python … ```)'], ['dung', 'dung_sai', 'Đáp án'], ['giai_thich', 'dai', 'Giải thích']],
}
export const TRUONG_KHOI = {
  loi: [['ai', 'chu', 'Ai nói (gõ "may" = Bạn Máy Tính)'], ['chu', 'dai', 'Lời nói']],
  hoi_thoai: [['cac', 'doi', 'Lời thoại (mỗi dòng: Tên: lời nói)']],
  cau: [['chu', 'dai', 'Câu hỏi']],
  the: [['cac', 'the', 'Các thẻ (1–3)']],
  buoc: [['cac', 'ds', 'Các bước (mỗi dòng 1)'], ['ngang', 'co', 'Xếp ngang có mũi tên']],
  danh_sach: [['cac', 'ds', 'Các ý (mỗi dòng 1)'], ['icon', 'icon', 'Biểu tượng']],
  ghi_nho: [['chu', 'dai', 'Nội dung ghi nhớ']],
  dap_an: [['chu', 'dai', 'Đáp án']],
  code: [['chu', 'code', 'Code Python'], ['chay', 'co', 'Có nút ▶ Chạy trên màn chiếu'], ['stdin', 'dai', 'Dữ liệu nhập sẵn cho input() (mỗi dòng 1 lần nhập)']],
  hinh: [['anh', 'anh', 'Hình'], ['chu_thich', 'chu', 'Chú thích'], ['rong', 'chu', 'Độ rộng (vd 860px, để trống = vừa khung)']],
  dong_ho: [['giay', 'so', 'Số giây']],
  hai_cot: [['ti_le', 'chu', 'Tỉ lệ 2 cột (vd 3fr 2fr)'], ['trai', 'khoi', 'Cột trái'], ['phai', 'khoi', 'Cột phải']],
}
export const SLIDE_MOI = {
  bia: () => ({ loai: 'bia', nhan: '', tieu: '', phu: '', khau_hieu: '' }),
  noi_dung: () => ({ loai: 'noi_dung', tieu: '', tem: '', mau: 'ngoc', khoi: [] }),
  trac_nghiem: () => ({ loai: 'trac_nghiem', tieu: 'Chọn đáp án đúng', tem: 'CÂU HỎI', mau: 'mutat', cau: '', lua_chon: ['', '', '', ''], dung: 0, giai_thich: '' }),
  dung_sai: () => ({ loai: 'dung_sai', tieu: 'Đúng hay sai? Giơ tay nào!', tem: 'O / X', mau: 'reu', cau: '', dung: true, giai_thich: '' }),
}
export const KHOI_MOI = {
  loi: () => ({ loai: 'loi', ai: 'may', chu: '' }), hoi_thoai: () => ({ loai: 'hoi_thoai', cac: [] }), cau: () => ({ loai: 'cau', chu: '' }),
  the: () => ({ loai: 'the', cac: [{ icon: 'bong_den', tieu: '', chu: '', vd: '' }] }), buoc: () => ({ loai: 'buoc', cac: [] }),
  danh_sach: () => ({ loai: 'danh_sach', cac: [] }), ghi_nho: () => ({ loai: 'ghi_nho', chu: '' }), dap_an: () => ({ loai: 'dap_an', chu: '', an: true }),
  code: () => ({ loai: 'code', chu: 'print("Xin chào!")', chay: true, stdin: '' }),
  hinh: () => ({ loai: 'hinh', anh: {}, chu_thich: '' }), dong_ho: () => ({ loai: 'dong_ho', giay: 60 }),
  hai_cot: () => ({ loai: 'hai_cot', ti_le: '1fr 1fr', trai: [], phai: [] }),
}
