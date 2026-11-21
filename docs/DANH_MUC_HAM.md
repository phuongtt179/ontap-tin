# Danh mục hàm dùng chung

> **Tệp tự sinh — đừng sửa tay.** Chạy `npm run danh-muc` sau khi thêm / sửa hàm (kiểm tra tự động báo đỏ nếu quên).
> **Trước khi viết hàm mới:** tìm ở đây (Ctrl+F theo việc cần làm) — có rồi thì dùng lại, gần giống thì mở rộng hàm cũ.
> Mô tả lấy từ chú thích ngay trên mỗi hàm trong mã. Hàm thiếu mô tả ghi ⚠.

Tổng: **386** hàm / hằng · thiếu mô tả: **65**

## src/domain/ — Quy tắc nghiệp vụ (hàm thuần, có kiểm tra tự động)

### baiThucHanh.js — Đề thực hành của một bài học — cột lessons.practice_instructions. Có 2 dạng lưu: (1) chuỗi JSON mảng [{ instructions, ... }, ...] khi bài có nhiều bài tập; (2) chuỗi thường (bài cũ, chỉ 1 đề). Hàm DUY NHẤT để đọc — dùng cả ở trang web lẫn máy chủ (api/). Hàm thuần: không gọi mạng, không giao diện.

- `parseTasks(instructions)` — chuỗi practice_instructions → mảng bài tập (luôn có ít nhất 1 phần tử)
- `hocLieuCua(t)` — học liệu kèm bài tập (tệp mẫu, ảnh, âm thanh để học sinh tải về dùng) → [{ url, ten }] hợp lệ
- `TOI_DA_MB_HOC_LIEU` *(hằng)* — dung lượng tối đa 1 tệp học liệu (MB) — giới hạn tải lên của gói Cloudinary miễn phí
- `tepCuaBaiTap(t)` — mọi tệp của 1 bài tập: tệp đề + học liệu
- `baiCoNoiDung(t)` — bài tập có nội dung thật (đề, tiêu chí, tệp đề hoặc học liệu) — bài trống không lưu
- `tieuChiThanhChu(rubric)` — tiêu chí chấm AI soạn lỡ trả dạng object { tiêu chí: điểm } → chữ đọc được
- `tepKhongConDung(baiCu, pptxMoi, baiTapMoi = [])` — Tệp trên Cloudinary không còn bài nào dùng sau khi sửa bài (thay bài giảng / gỡ tệp đề) → nên xoá. @param baiCu { pptx_url, practice_instructions } · @param pptxMoi · @param baiTapMoi [{ instruction_file_url, hoc_lieu }]

### cayNoiDung.js — Quy tắc cây nội dung (chủ đề → đơn vị → tiêu đề nhỏ) của giáo viên. Hàm thuần.

- `docDanhSachTen(text, tenDaCo = [])` — Đọc danh sách tên dán vào (mỗi dòng 1 tên) → [{ name, isDup (đã có), isRepeat (lặp trong chính danh sách) }]. So trùng không phân biệt hoa thường.
- `dongSeThem(ds)` — các dòng sẽ thêm (không trùng)
- `doiCho(ds, idx, dir)` — đổi chỗ phần tử idx với phần tử kế bên (dir = -1 lên, 1 xuống) → mảng mới; ra ngoài mép → null

### chamBai.js — Quy tắc chấm bài thực hành. Hàm thuần: không gọi mạng, không giao diện. Dùng cả ở trang web lẫn máy chủ (api/).

- `capNhatTuKetQuaAi(r, luc = new Date()` — Kết quả AI chấm 1 bài ({ score, comment, breakdown, ai_suspect, ai_suspect_reason }) → các cột ghi vào lesson_submissions. Điểm AI chỉ là NHÁP: giáo viên duyệt mới thành mức T/H/C cho học sinh thấy.
- `phanCua(sub)` — bài nộp thuộc phần thực hành thứ mấy (bài cũ không ghi → phần 0)
- `baiCuaPhan(subs, i)` — bài nộp của phần thứ i trong danh sách bài nộp của 1 học sinh
- `gomTheoHocSinh(dong, nhieu)` — gom danh sách dòng theo user_id: nhieu=true → { id: [dòng...] }, ngược lại { id: dòng }
- `capNhatKhiGvChot(sub, muc, nhanXet, luc = new Date()` — Giáo viên chốt mức + nhận xét 1 bài → các cột ghi vào lesson_submissions. Giữ điểm AI nếu giáo viên giữ đúng mức AI gợi ý; đổi mức → điểm nội bộ theo mức (học sinh không thấy điểm). Trả null nếu mức không hợp lệ.
- `capNhatKhiDuyetAi(sub, luc = new Date()` — giáo viên duyệt nguyên mức AI gợi ý (không sửa) → các cột ghi
- `canAiCham(subs)` — học sinh có bài mới cần AI chấm (chưa duyệt, AI chưa chấm)
- `locVaXepHocSinh(hocSinh, { lop = '', tim = '' } = {}, bainop = {})` — Lọc theo lớp + tên, rồi xếp: em nộp nhiều bài lên trước, cùng số bài thì theo lớp → tên. bainop: { userId: [bài nộp] }
- `thongKeLop(hocSinh, tienDo, bainop, { coVideo, coQuiz, coThucHanh, soPhan })` — số liệu các thẻ tổng kết; mục bài không có → null
- `nhapCu(sub)` — học sinh nộp lại: điểm + nhận xét đã xoá nhưng ai_score / ai_breakdown còn của BẢN CŨ → không dùng làm gợi ý cho bản mới
- `goiYCua(sub)` — mức AI gợi ý (T/H/C) hoặc null
- `coNhapCua(sub)` — bài đã có nháp AI (bảng tiêu chí) chờ duyệt
- `mucBanDau(sub)` — mức chọn sẵn khi mở bài
- `nhomBaiNopTheoMuc(subs, nhomBai, lessonMap = {})` — Bài nộp của 1 học sinh → xếp theo mục giống "Theo bài": Chủ đề → bài học (thứ tự chương trình) → phần thực hành. nhomBai = kết quả nhomBaiTheoChuDe (domain/thuTuBaiHoc). Bài nộp thuộc bài không có trong nhomBai → nhóm "Bài khác" ở cuối. Trả [{ topic, bai: [{ lesson, subs }] }], bỏ chủ đề / bài không có bài nộp.

### chamPython.js — Quy tắc chấm phần thực hành PYTHON của đề thi (máy chủ dùng: api/thi-python.js). Hàm thuần: không gọi mạng, không đọc cơ sở dữ liệu → kiểm tra tự động được (chamPython.test.js).

- `TOI_DA_LAN` *(hằng)* — Quy tắc chấm phần thực hành PYTHON của đề thi (máy chủ dùng: api/thi-python.js). Hàm thuần: không gọi mạng, không đọc cơ sở dữ liệu → kiểm tra tự động được (chamPython.test.js).
- `GIAY_MOI_TEST` *(hằng)* — ⚠ chưa có mô tả
- `GIA_HAN_PHUT` *(hằng)* — ⚠ chưa có mô tả
- `DO_DAI_TOI_DA` *(hằng)* — ⚠ chưa có mô tả
- `chuanHoaKetQua(s)` — So kết quả: bỏ khoảng trắng cuối mỗi dòng và dòng trống cuối bài (giống cách chấm thông thường)
- `trangThaiTest(k, mongDoi)` — Trạng thái 1 test từ kết quả chạy { tle } | { rc, out }: 'qua_gio' | 'loi' | 'dung' | 'sai'
- `chamLanNop(tests, ketQuaChay)` — Chấm 1 lần nộp. tests: [{ expected, diem }], ketQuaChay: kết quả chạy theo đúng thứ tự test. Học sinh chỉ nhận { stt, trang_thai } — không thấy input / output. @returns { ket_qua: [{stt, trang_thai}], diem (thang 10, làm tròn 2 chữ số) }
- `loiKhongDuocNop(bt, userId, bayGio = Date.now()` — Bài thi này có được nộp thêm lần nữa không. Trả về mã lỗi, hoặc null nếu được. @param bt { user_id, practical_type, submitted_at, started_at, time_limit (phút), practical_lan }

### dapAn.js — Quy tắc so đáp án và tính điểm phần trắc nghiệm (quiz trong bài, luyện tập, đề thi lý thuyết). Trước 11/11/2026 có 3 bản chép khác nhau (utils/normalizeAnswer, student/ExamsPage, student/LessonPage) → gộp về đây. Hàm thuần: không gọi mạng, không giao diện. ⚠️ Hiện trình duyệt tự chấm rồi ghi điểm — máy chủ chưa tự tính lại (vá bảo mật đợt 3, bước 5).

- `dungDapAn(type, ans, correct)` — Câu trả lời có đúng không. Câu tự luận (essay) luôn false — không chấm tự động, giáo viên chấm. - matching: các cặp "1-a,2-b" không phân biệt thứ tự cặp - drag_word / fill_blank: nhiều ô cách nhau dấu phẩy, so từng ô theo thứ tự, không phân biệt hoa thường - word_order: so cả câu (xem sameSentence) - còn lại: so nguyên câu, bỏ khoảng trắng hai đầu, không phân biệt hoa thường
- `diemTuDong(questions, answers, thangDiem = 10)` — Điểm phần tự chấm của một lượt làm bài. Câu tự luận KHÔNG tính vào mẫu số. @param questions [{ type, correct_answer }] @param answers câu trả lời theo vị trí câu (mảng hoặc object { 0: '...', 1: '...' }) @param thangDiem điểm tối đa phần tự chấm (mặc định 10) @returns { soDung, soCau, diem (làm tròn 1 chữ số), phanTram (số nguyên) }

### deThi.js — Quy tắc đề thi. Hàm thuần: không gọi mạng, không giao diện.

- `diemTongLuot(de, luot)` — điểm tổng 1 lượt (thang 10): đề có thực hành = lý thuyết × hệ số + thực hành × hệ số, làm tròn 1 chữ số
- `diemCaoNhat(de, cacLuot)` — điểm cao nhất trong các lượt ĐÃ NỘP (bỏ lượt bỏ dở, submitted_at null); chưa lượt nào nộp → null
- `testHopLe(tests)` — test Python dùng được: có output mong đợi
- `loiDeThi(form, tests = [])` — kiểm tra đề trước khi lưu → câu báo lỗi, hoặc null nếu được
- `duLieuDeThi(form)` — form → dữ liệu ghi vào exams. Đề chỉ có thực hành → 100% điểm thực hành; không thực hành → 100% lý thuyết
- `deDanhChoLop(de, lop)` — đề hiện cho lớp đang lọc: đề không giới hạn lớp, hoặc có lớp đó trong danh sách

### dinhDangCauHoi.js — Đọc định dạng nội dung câu hỏi (cột questions.question / options) — dùng chung cho mọi nơi hiển thị câu hỏi. Hàm thuần: không gọi mạng, không giao diện.

- `tachChoTrong(deBai = '')` — Câu điền chỗ trống / kéo thả từ: tách đề thành các mảnh để vẽ. "___" là 1 ô trống; ô trống nằm trong khối ```code``` thì giữ nguyên khối code (code-with-blanks). @returns { tokens: [{type:'text',content} | {type:'blank',index} | {type:'code',lang,content} | {type:'code-with-blanks',lang,segs,startIdx}], soCho: số ô trống }
- `chuanHoaLuaChon(options)` — Lựa chọn trắc nghiệm lưu nhiều kiểu (chuỗi, { key, text }, { A: '...' }, { text|value|label }) → [{ key, text, image_url }]. Thiếu khoá thì đặt A, B, C… theo thứ tự.

### hocSinh.js — Quy tắc trang Học sinh của giáo viên: đọc danh sách dán vào, ghép hồ sơ + ghi danh, lọc, chờ duyệt. Hàm thuần.

- `TEN_DANG_NHAP_HOP_LE` *(hằng)* — tên đăng nhập hợp lệ: chữ không dấu, số, _ và .
- `MAT_KHAU_TOI_THIEU` *(hằng)* — ⚠ chưa có mô tả
- `docDanhSachNhap(text)` — Đọc danh sách học sinh dán vào (mỗi dòng: họ tên, tên đăng nhập, mật khẩu, khoá (tuỳ chọn), ca (tuỳ chọn) — cách nhau bằng dấu phẩy hoặc tab). Mỗi dòng trả kèm _line (số dòng) và _errors (rỗng = hợp lệ).
- `tenDangNhapCanKiemTra(dong)` — các tên đăng nhập trong danh sách (để hỏi máy chủ tên nào đã có)
- `danhDauTrung(dong, daCo)` — đánh dấu dòng hợp lệ mà tên đăng nhập đã có tài khoản
- `loiTaoTaiKhoan(msg)` — lỗi tạo tài khoản → câu dễ hiểu
- `ghepGhiDanh(hoSo, ghiDanh)` — Ghép hồ sơ học sinh + các ghi danh (khoá / lớp). Khoá / lớp hiển thị = ghi danh đầu tiên (theo tên khoá); chưa có ghi danh → rỗng.
- `locTheoKhoaLop(hocSinh, { khoa = '', lop = '' } = {})` — lọc theo khoá / lớp (học sinh có ghi danh khớp), xếp theo lớp rồi tên
- `chiaTheoDuyet(hocSinh)` — chờ duyệt: tài khoản chưa duyệt hoặc còn ghi danh chưa duyệt; còn lại là đã duyệt
- `timTheoTen(hocSinh, tim)` — tìm theo tên (không phân biệt hoa thường)
- `mauTheoKhoa(cacKhoa)` — màu nhãn cho từng khoá (theo thứ tự khoá, lặp lại sau 5 màu)

### hoiThoai.js — Quy tắc hộp thư giáo viên: gom tin thành cuộc trò chuyện theo học sinh, lọc, đếm chưa đọc. Hàm thuần.

- `gomHoiThoai(tinGiaoVien, mocAi, hocSinh = {})` — Gom tin thầy–trò + mốc giờ hỏi AI (đã xếp cũ → mới) thành cuộc trò chuyện từng em, mới hoạt động nhất lên đầu. hocSinh: { id: { id, full_name, class_name } } — em không có tên → "Học sinh". Mốc AI chỉ có giờ (nội dung tải riêng khi mở em đó) → đánh dấu _moc.
- `themTinMoi(hoiThoai, tinMoi)` — thêm tin mới vào cuộc trò chuyện (bỏ tin đã có) → cuộc trò chuyện mới, hoặc chính nó nếu không có gì mới
- `boTin(hoiThoai, tinId)` — bỏ 1 tin khỏi cuộc trò chuyện
- `locHoiThoai(ds, { tim = '', lop = '', chuaDoc = false } = {})` — lọc theo tên / lớp (ô tìm), lớp, chỉ chưa đọc

### moKhoaBai.js — Khoá bài theo lớp (2 tầng): giáo viên mở CHỦ ĐỀ cho lớp (class_topic_unlock) rồi tick từng BÀI trong chủ đề (class_lesson_unlock). Học sinh không thuộc lớp nào → moKhoa = null → coi như mở hết bài đã xuất bản. Hàm thuần: không gọi mạng, không giao diện. Dùng ở trang Học bài (chặn vào thẳng URL) và trang Con đường bài học.

- `baiDaMoChoLop(lesson, moKhoa)` — @param lesson { id, topic } @param moKhoa { chuDe: Set<topic>, bai: Set|Map<lesson_id> } | null
- `loTrinhKhoa(donVi = [], baiHoc = [], moKhoa = null)` — Lộ trình khoá cho AI trả lời câu hỏi chương trình học: "• Đơn vị: bài, bài" — CHỈ bài đã mở cho lớp (không để AI biết / gợi ý tên bài học sinh chưa được mở). @param donVi đơn vị đã sắp theo thứ tự · @param baiHoc bài đã xuất bản (đã sắp theo thứ tự bài)

### phanThuong.js — Quy tắc trang Phần thưởng của giáo viên: gắn tên / lớp vào yêu cầu đổi quà, lọc + xếp, quà hiện theo khoá. Hàm thuần.

- `ganTenYeuCau(ds, tenCua = {}, lopCua = {})` — gắn tên + lớp của em vào từng yêu cầu; created_at / fulfilled_at lấy cột mới, thiếu thì cột cũ
- `locVaXepYeuCau(ds, { trangThai, theo = 'date', tangDan = false })` — yêu cầu theo trạng thái, xếp theo quà / tên / lớp (chữ, kiểu tiếng Việt) hoặc ngày (mặc định)
- `quaTheoKhoa(ds, khoa)` — quà hiện khi lọc theo khoá: quà của khoá đó + quà chung; '__all__' → mọi quà

### soanCauHoi.js — Quy tắc soạn câu hỏi (cửa sổ thêm / sửa của giáo viên): form trống, form từ câu đã lưu, kiểm tra + dữ liệu lưu theo 8 loại. Hàm thuần: không gọi mạng, không giao diện (lỗi trả về dạng chữ để nơi gọi hiện thông báo).

- `LOAI_CAU_HOI` *(hằng)* — ⚠ chưa có mô tả
- `formMoi({ grade, topic, unitId } = {})` — form câu hỏi mới
- `formTuCauHoi(q)` — form để sửa 1 câu đã lưu (mỗi loại đổi đáp án đã lưu về dạng ô nhập)
- `soChoTrong(cauHoi)` — số chỗ trống ___ trong đề
- `duLieuDapAn(form)` — phần đáp án theo loại → { duLieu: { options?, match_options?, correct_answer } } hoặc { loi }
- `duLieuCauHoi(form)` — toàn bộ dữ liệu lưu vào questions → { duLieu } hoặc { loi }
- `dongLuuCauNhap(q, meta, userId)` — câu nhập hàng loạt (đã phân tích từ chữ dán vào) → dòng lưu vào questions; khoá / chủ đề / bài / mức độ lấy chung từ meta

### sticker.js — Quy tắc sticker / phần thưởng / chuỗi ngày học. Hàm thuần: không gọi mạng, không giao diện. Phần nào do MÁY CHỦ quyết định (trình duyệt không đổi được) — sửa ở SQL, không sửa ở đây: · sticker làm quiz / nộp bài 1 lần mỗi bài: award_sticker_once (sql/2026-10-13_sticker_once.sql) · chuỗi ngày học + sticker mốc chuỗi: record_activity (sql/2026-10-13_secure_profiles.sql) · đổi quà (trừ sticker): redeem_reward (sql/2026-10-13_secure_profiles.sql)

- `NGUONG_DOI_QUA_MAC_DINH` *(hằng)* — Ngưỡng sticker để đổi quà khi giáo viên chưa cài cho khoá (bảng reward_configs)
- `GIA_QUA_MAC_DINH` *(hằng)* — Giá 1 món quà khi chưa đặt (khớp DEFAULT 50 của cột reward_items.sticker_cost)
- `stickerTheoMuc(muc)` — Sticker thưởng khi giáo viên duyệt bài thực hành theo mức: T = 3, H = 1, C = 0
- `stickerConThieu(daThuong, muc)` — Bài đã được thưởng `daThuong` sticker, nay giáo viên duyệt mức `muc` → cộng thêm bao nhiêu. Chỉ cộng phần còn thiếu (C → T: +3, H → T: +2); giữ nguyên hoặc hạ mức thì 0 — không bao giờ trừ.
- `MOC_CHUOI_NGAY` *(hằng)* — Nhãn các mốc chuỗi ngày học. CHỈ để hiển thị — số sticker thật do record_activity trên máy chủ quyết định (3 / 7 / 14 / 30 ngày → 3 / 7 / 14 / 30 sticker). Đổi mốc phải đổi CẢ hai nơi.
- `mocChuoi(soNgay, bonus)` — mốc chuỗi để hiện khi máy chủ báo vừa cộng `bonus` sticker ở ngày thứ `soNgay` (null nếu không có thưởng)

### ten.js — Quy tắc so khớp và xếp thứ tự theo tên (học sinh, lớp). Hàm thuần — dùng chung, đừng viết lại ở trang.

- `boDau(s)` — chữ thường, bỏ dấu tiếng Việt (đ → d) — để tìm tên không cần gõ dấu
- `coChua(ten, tim)` — tên có chứa chữ cần tìm không (không phân biệt hoa thường, có dấu hay không); tìm rỗng → true
- `soKhop(s)` — chuẩn hoá để so khớp gần đúng: bỏ dấu, bỏ khoảng trắng / dấu câu, viết hoa — "lop kn 46", "KN-46" → "LOPKN46", "KN46"
- `tenGoi(s)` — tên gọi = chữ cuối của họ tên ("Nguyễn Văn An" → "An")
- `xepTheoTenGoi(a, b)` — so sánh 2 họ tên theo tên gọi (cách xếp danh sách lớp ở Việt Nam) — dùng trong .sort
- `xepTheoLopRoiTen(a, b)` — so sánh 2 học sinh { class_name, full_name }: theo lớp rồi theo họ tên — dùng trong .sort

### tepNop.js — Nhận biết loại tệp (bài nộp, tệp đề) từ đường dẫn — để chọn cách hiển thị. Hàm thuần.

- `duoiTep(url)` — đuôi tệp viết thường, bỏ phần ?... sau đuôi ('' nếu không có url)
- `tenTep(url, tenGoc)` — tên tệp để hiện: tên học sinh đặt (nếu có), không thì lấy cuối đường dẫn
- `loaiTep(url)` — nhóm loại tệp
- `linkXemOffice(url)` — link xem tệp Word / PowerPoint trực tuyến (Office Online)

### thuTuBaiHoc.js — Thứ tự bài học giống trang Học bài của học sinh: Chủ đề (theo tên, "Chủ đề 2" trước "Chủ đề 10") → Đơn vị (sort_order, rồi tên) → bài (order, rồi ngày tạo). Bài chưa gắn đơn vị đứng cuối chủ đề. Hàm thuần: không gọi mạng, không giao diện.

- `nhomBaiTheoChuDe(lessons = [], units = [])` — @param lessons [{ id, title, topic, unit_id, order, created_at }] @param units [{ id, name, sort_order }] @returns [{ topic, lessons: [...] }] — các chủ đề theo đúng thứ tự, bài trong mỗi chủ đề đã sắp

### tienDoBaiHoc.js — Quy tắc tiến độ một bài học của học sinh: quiz thế nào là đạt, bài có những bước nào, bước nào đã xong, khi nào cả bài tính là hoàn thành. Hàm thuần: không gọi mạng, không giao diện. ⚠️ Hiện máy chủ CHƯA tự kiểm tra các quy tắc này (vá bảo mật đợt 3) — trình duyệt tự tính rồi ghi lesson_progress.

- `NGUONG_DAT_QUIZ` *(hằng)* — Quiz trong bài học đạt khi đúng ít nhất 2/3 số câu
- `datQuiz(soDung, tongSo)` — ⚠ chưa có mô tả
- `trangThaiBuoc(lesson, progress, soCauQuiz)` — Các bước của bài và bước nào đã xong. @param lesson { ai_context, video_url, pptx_url, has_slides, has_practice, question_ids } @param progress dòng lesson_progress (có thể null) @param soCauQuiz số câu quiz của bài. Không truyền → đếm theo lesson.question_ids. (Trang Học bài truyền số câu THỰC TẾ tải được — có thể ít hơn nếu câu hỏi đã bị xoá khỏi ngân hàng.) @returns { co: {theory, video, pptx, quiz, practice}, xong: {...}, tongBuoc, soBuocXong, hoanThanh }

### xepHang.js — Xếp hạng điểm của học sinh (trang tổng quan giáo viên). Hàm thuần.

- `gomDiemTheoEm(cacLuot, ten = {}, lop = {})` — Gom lượt làm bài theo em → { full_name, class_name, scores, count, avg (1 chữ số), best }. Chỉ tính lượt CÓ ĐIỂM — lượt bỏ dở (chưa nộp, score null) không kéo điểm trung bình xuống. ten: { id: full_name }, lop: { id: tên lớp (hoặc khoá) }

## src/data/ — Đọc / ghi cơ sở dữ liệu — mọi truy vấn bảng đi qua đây

### baiHoc.js — Tầng dữ liệu — bảng lessons (bài học). Trang không gọi thẳng supabase.from('lessons'), mà gọi các hàm ở đây (chọn sẵn đúng cột, có giới hạn dòng). Đổi cơ sở dữ liệu chỉ sửa tệp này. Mỗi hàm trả { data, error } (hoặc { count }) như supabase. Học sinh chỉ thấy bài đã xuất bản: RLS trên Neon quyết định.

- `layBaiHocTheoId(id)` — 1 bài, đủ cột (trang Học bài, trang Bài nộp)
- `layBaiEmDuocXem(userId)` — id các bài giới hạn người xem mà em có tên trong danh sách → Set
- `emDuocXemBai(lessonId, userId)` — bài giới hạn người xem: em có tên trong danh sách không (lesson_visibility)
- `layNguoiXemBai(lessonId)` — giáo viên: danh sách học sinh được xem 1 bài giới hạn người xem → mảng user_id
- `ghiNguoiXemBai(lessonId, userIds = [])` — giáo viên: ghi lại danh sách học sinh được xem bài (xoá hết rồi ghi lại) — trả { error }
- `layBaiGiangWeb(lessonId)` — các trang bài giảng web của bài (lesson_slides) — null nếu chưa có
- `layTenBaiHoc(id)` — tên bài (chế độ Dạy)
- `layNguonAiCuaBai(id)` — nội dung bài làm nguồn cho AI soạn (slide, hỏi đáp mẫu)
- `layDanhSachBai(grade, { xuatBan, topic } = {})` — Danh sách bài của 1 khoá, theo thứ tự bài. @param xuatBan true = chỉ bài đã xuất bản · false = chỉ bài chưa xuất bản · bỏ trống = tất cả @param topic lọc theo chủ đề (không bắt buộc)
- `layBaiDaXuatBanCuaCacKhoa(grades)` — bài đã xuất bản của nhiều khoá
- `demBaiDaXuatBan(grades)` — ⚠ chưa có mô tả
- `layBaiHocDeSua(grade)` — trang Quản lý bài học: mọi bài của khoá, đủ cột (để sửa)
- `layBaiKemTaiLieuAi(grade)` — bài kèm tài liệu AI (soạn câu hỏi bằng AI) — mọi bài của khoá
- `layBaiCoFileBaiGiang(grade)` — bài đã xuất bản có file PPTX/PDF (ghi chú cho gia sư AI)
- `layDeThucHanhTheoIds(ids)` — đề thực hành của vài bài (trang Chấm bài, theo học sinh)
- `layBaiThucHanhTheoKhoa(grade)` — bài có phần thực hành của một khoá + đơn vị của khoá đó (để xếp thứ tự) — dùng ở trang Chấm bài
- `taoBaiHoc(dong)` — ───────── ghi (giáo viên) ─────────
- `luuBaiHoc(id, thayDoi)` — sửa cả bài, trả dòng mới
- `capNhatBaiHoc(id, thayDoi)` — sửa vài cột (xuất bản, giới hạn người xem, ghi chú AI…)
- `xoaBaiHoc(id)` — ⚠ chưa có mô tả
- `doiChuDeCuaBaiHoc(grade, chuDeCu, chuDeMoi)` — đổi tên chủ đề trong 1 khoá → chuyển mọi bài sang tên mới
- `layBaiGiangDeSua(lessonId)` — bài giảng web để soạn: các trang + kịch bản (null nếu chưa có)
- `luuBaiGiang({ lessonId, slides, kichBan, userId })` — lưu bài giảng web (tạo mới hoặc ghi đè)

### baiLam.js — Tầng dữ liệu — bài làm: exam_sessions (lượt thi), quiz_sessions (luyện tập), exam_nop_python (lần nộp chấm Python). Đề: data/deThi.js. Mỗi hàm trả { data, error } như supabase (trừ khi ghi khác). Học sinh chỉ ghi bài của mình: RLS trên Neon quyết định. ⚠ Điểm hiện do trình duyệt tính rồi gửi lên — bước 5 (vá bảo mật đợt 3) sẽ chuyển cho máy chủ tự chấm.

- `batDauLuotThi({ examId, userId, total, attemptNumber })` — bắt đầu làm đề: ghi lượt NGAY (chưa có điểm) để đếm đúng số lần làm kể cả khi em đóng tab giữa chừng → { data: lượt }
- `nopBaiThi(sessionId, { correct, score, answers, practical_content })` — nộp đề thi: cập nhật dòng đã tạo sẵn lúc bắt đầu làm (không tạo dòng mới). practical_content: bài Word / PPT soạn ngay trong trang
- `luuLuotLuyenTap({ userId, mode, questions, correct, score, answers })` — lưu 1 lượt luyện tập / ôn tập
- `demLuotThiCuaEm(userId, examIds)` — số lượt em đã làm từng đề → { exam_id: số }
- `layTepThucHanh(sessionId)` — tên tệp thực hành đã nộp của lượt thi (null nếu chưa)
- `nopTepThucHanh(sessionId, url, ten)` — nộp tệp thực hành (Scratch …) vào lượt thi
- `layLanNopPython(sessionId, { kemCode = false } = {})` — các lần nộp chấm Python của 1 lượt thi; kemCode = giáo viên xem cả code
- `layLuotThiCuaEm(userId)` — lịch sử: 50 lượt thi gần nhất của em
- `layLuotLuyenTapCuaEm(userId)` — lịch sử: 50 lượt luyện tập gần nhất của em
- `layLuotThiCuaDe(examId)` — mọi lượt của 1 đề (trang kết quả): lượt đã nộp mới nhất trước, lượt bỏ dở (chưa nộp) xếp cuối
- `layLuotThiCuaCacDe(examIds)` — lượt của nhiều đề — bảng thống kê (kèm đáp án để xem chi tiết)
- `layDiemThiCuaEm(userId)` — điểm thi của 1 em kèm tên đề (báo cáo thành tích)
- `suaLuotThi(sessionId, thayDoi)` — giáo viên chấm / AI chấm nháp phần thực hành của 1 lượt
- `xoaLuotThi(sessionId)` — xoá lượt (vd đóng tab do sự cố) — em được tính lại số lần làm
- `layDiemThiDeXepHang()` — điểm mọi lượt thi ĐÃ CÓ ĐIỂM (xếp hạng trang tổng quan)
- `layDiemLuyenTapDeXepHang()` — điểm mọi lượt luyện tập (xếp hạng trang tổng quan)
- `demLuotLamBaiTuLuc(tuLuc)` — số lượt thi + luyện tập bắt đầu từ mốc giờ (chỉ đếm)

### baiNop.js — Tầng dữ liệu — bảng lesson_submissions (bài nộp thực hành). Mọi đọc / ghi bài nộp đi qua đây. Mỗi hàm trả { data, error } (hoặc { count }) như supabase. Quyền thật do RLS + trigger trên Neon quyết định.

- `layBaiNopCuaEm(userId, lessonId)` — mọi bài em đã nộp trong 1 bài học (mỗi bài tập 1 dòng)
- `layTieuChiGanDay(userId)` — bảng tiêu chí AI của 15 bài gần nhất → hồ sơ lỗi hay gặp cho gia sư AI
- `layTrangThaiCham(ids)` — cột nhẹ để hỏi định kỳ "bài đang chờ đã chấm xong chưa"
- `layBaiNopTheoIds(ids)` — ⚠ chưa có mô tả
- `nopBaiMoi(dong)` — nộp lần đầu 1 bài tập — máy chủ chặn nộp trùng (lỗi 23505 / duplicate_submission)
- `nopLaiBai(id, thayDoi)` — nộp lại: ghi đè bài cũ, trả dòng mới
- `capNhatBaiNop(id, thayDoi)` — sửa 1 bài nộp (chấm, duyệt, cho nộp lại, lưu kết quả AI…)
- `layBaiNopCuaLop(lessonId, userIds)` — bài nộp của 1 nhóm học sinh trong 1 bài học — trang Bài nộp (đủ cột)
- `layDauVetBaiNop(lessonId, userIds)` — cột nhẹ để trang Bài nộp hỏi định kỳ "có gì mới không"
- `layBaiNopDeChamTheoBai(lessonId, userIds)` — trang Chấm bài — theo bài: bài nộp của các học sinh đang xem
- `layBaiNopDeChamTheoHs(userId, grade)` — trang Chấm bài — theo học sinh: bài em nộp CHỈ trong khoá đang chọn (em học nhiều khoá không lẫn bài khoá khác), tối đa 500 bài gần nhất
- `layTrangThaiDuyet(userIds, lessonIds)` — đã nộp / đã duyệt chưa — trang Trợ lý giáo viên
- `layBaiNopChoBaoCao(userId)` — bài nộp của 1 học sinh cho báo cáo cá nhân
- `laySoStickerDaThuong(id)` — ───────── sticker thưởng theo mức (cột sticker_thuong) ─────────
- `ghiStickerDaThuong(id, cu, moi)` — ghi số sticker đã thưởng CHỈ KHI số cũ chưa đổi (2 tab / duyệt trùng không cộng 2 lần); data rỗng = có người ghi trước
- `demBaiChuaCham(dk)` — ⚠ chưa có mô tả
- `layBaiChuaCham(dk)` — 200 bài chưa chấm mới nhất (để liệt kê)
- `layBaiChuaChamDeCham(dk, gioiHan)` — bài chưa chấm kèm file + đề (để đưa AI chấm), tối đa `gioiHan` bài
- `demLuotRaSoat(lessonId, taskIdx)` — số lần em đã dùng "rà soát lỗi" cho 1 phần thực hành (hàm máy chủ ra_soat_dem)

### cauHoi.js — Tầng dữ liệu — bảng questions (ngân hàng câu hỏi). Mỗi hàm trả { data, error } (hoặc { count }) như supabase. ⚠️ Bảo mật đợt 3 (chưa làm): học sinh đang đọc được cả đáp án (correct_answer) khi làm bài — sẽ chuyển chấm về máy chủ và bỏ cột đáp án khỏi các hàm phía học sinh (layCauHoiTheoIds khi gọi từ trang học sinh, layCauHoiLuyenTap).

- `layCauHoiTheoIds(ids)` — câu hỏi đầy đủ theo danh sách mã, đúng thứ tự — làm bài trong bài học / đề thi, xem lại câu của bài
- `layCauHoiKemDapAn(ids)` — câu hỏi + đáp án (xem chi tiết bài làm của học sinh), đúng thứ tự
- `layCauHoiTomTat(ids)` — nội dung câu hỏi của bài làm nguồn cho AI / slide, đúng thứ tự
- `layCauHoiLuyenTap(grade, { topics = [], difficulty } = {})` — câu hỏi luyện tập tự chọn (học sinh)
- `locCauHoi(grade, { topic, unitId, lessonTitleId, difficulty } = {})` — chọn câu cho đề thi / bài học: lọc theo chủ đề, đơn vị, tiêu đề nhỏ, độ khó — mới nhất trước
- `layNganHangCauHoi(grade)` — trang Ngân hàng câu hỏi: cả khoá, đủ cột + tên đơn vị
- `demCauHoi()` — ⚠ chưa có mô tả
- `demCauThieuGoiY(grade)` — ⚠ chưa có mô tả
- `layCauThieuGoiY(grade, soCau)` — ⚠ chưa có mô tả
- `themCauHoi(dong)` — thêm 1 câu hoặc nhiều câu, trả mã các câu mới
- `capNhatCauHoi(id, thayDoi)` — ⚠ chưa có mô tả
- `xoaCauHoi(id)` — ⚠ chưa có mô tả
- `doiChuDeCuaCauHoi(grade, chuDeCu, chuDeMoi)` — ⚠ chưa có mô tả

### chuDe.js — Tầng dữ liệu — cây nội dung: topics (chủ đề) → units (đơn vị) → lesson_titles (tiêu đề nhỏ). Mỗi hàm trả { data, error } như supabase (trừ khi ghi khác). Chỉ giáo viên / trợ giảng sửa được: RLS trên Neon quyết định.

- `xepTheoTen(a, b)` — xếp tên theo kiểu người đọc: "Chủ đề 2" trước "Chủ đề 10"
- `layChuDe(cacKhoa)` — chủ đề (mọi khoá, hoặc các khoá trong danh sách — thường kèm 'all' = dùng chung), đã xếp theo tên
- `themChuDe(dong)` — thêm 1 hoặc nhiều chủ đề
- `suaChuDe(id, thayDoi)` — ⚠ chưa có mô tả
- `xoaChuDe(id)` — ⚠ chưa có mô tả
- `layDonVi(grade, topic)` — đơn vị của 1 khoá (1 chủ đề nếu có), theo chủ đề → thứ tự → tên
- `layDonViCuaKhoa(grade)` — đơn vị của cả khoá theo thứ tự đơn vị (không gom theo chủ đề) — lộ trình bài cho AI (domain/moKhoaBai.loTrinhKhoa)
- `demDonViTheoChuDe()` — số đơn vị theo từng "khoá||chủ đề" (cột nhẹ)
- `themDonVi(dong)` — thêm 1 hoặc nhiều đơn vị
- `suaDonVi(id, thayDoi)` — ⚠ chưa có mô tả
- `xoaDonVi(id)` — ⚠ chưa có mô tả
- `doiChuDeCuaDonVi(grade, tenCu, tenMoi)` — chủ đề đổi tên → đơn vị thuộc chủ đề đó (trong khoá) đổi theo
- `doiKhoaDonViCuaChuDe(topic, khoaCu, khoaMoi)` — chủ đề chuyển khoá → đơn vị của chủ đề chuyển theo
- `layTieuDe(unitId)` — tiêu đề nhỏ của 1 đơn vị theo thứ tự
- `demTieuDeTheoDonVi(unitIds)` — số tiêu đề nhỏ của từng đơn vị → { unitId: số }
- `themTieuDe(dong)` — ⚠ chưa có mô tả
- `suaTieuDe(id, thayDoi)` — ⚠ chưa có mô tả
- `xoaTieuDe(id)` — ⚠ chưa có mô tả
- `ghiThuTu(bang, ds)` — ghi lại thứ tự sau khi kéo / bấm lên xuống: chỉ ghi dòng có thứ tự đổi
- `suaChuDeVaLienQuan(id, { tenCu, khoaCu, tenMoi, khoaMoi })` — Sửa tên / khoá của chủ đề + kéo theo: đổi tên → bài học, câu hỏi, đơn vị đổi theo; đổi khoá → đơn vị chuyển khoá. Đổi tên đơn vị TRƯỚC rồi mới chuyển khoá (bước sau tìm đơn vị theo tên mới — chạy song song thì có thể sót). Trả { error } của bước sửa chủ đề.

### deThi.js — Tầng dữ liệu — đề thi: exams (đề), exam_tests (test chấm Python, học sinh KHÔNG đọc được). Lượt làm bài (exam_sessions, quiz_sessions, exam_nop_python) ở data/baiLam.js. Mỗi hàm trả { data, error } như supabase.

- `layTatCaDeThi()` — mọi đề (trang Đề thi của giáo viên), mới nhất trước
- `layDeThi(id)` — 1 đề (trang kết quả)
- `layDeThiCuaKhoa(grade)` — đề của khoá cho thống kê (cột nhẹ)
- `layTenDeThi(ids)` — tên đề theo id → { id: tên }
- `layDeThiChoEm(grade, className)` — đề đang mở cho em: đúng khoá, dành cho cả khoá hoặc cho lớp của em
- `luuDeThi(id, duLieu)` — tạo (id rỗng) hoặc sửa đề → { data: { id } }
- `xoaDeThi(id)` — ⚠ chưa có mô tả
- `datMoDeThi(id, mo)` — ⚠ chưa có mô tả
- `layTestPython(examId)` — test chấm Python của đề (thứ tự)
- `ghiTestPython(examId, tests)` — thay toàn bộ test của đề bằng danh sách mới (rỗng = xoá hết). Trả { error }
- `demDeThi()` — số đề thi (chỉ đếm)

### diemDanh.js — Tầng dữ liệu — điểm danh: attendance_sessions (buổi, giáo viên mở / đóng), attendance_records (lượt em điểm danh). RLS trên Neon: học sinh chỉ thấy buổi ĐANG MỞ của khoá mình và chỉ ghi lượt của chính mình.

- `layBuoiDiemDanh(grade, className)` — các buổi của 1 khoá (1 lớp nếu có), mới nhất trước
- `layLuotDiemDanh(sessionIds)` — lượt điểm danh của các buổi
- `moBuoiDiemDanh({ grade, className, userId })` — ⚠ chưa có mô tả
- `dongBuoiDiemDanh(id)` — ⚠ chưa có mô tả
- `layBuoiDangMo()` — các buổi đang mở (trang tổng quan)
- `layIdBuoiTrongNgay(ngay)` — id các buổi của 1 ngày (YYYY-MM-DD)
- `demLuotDiemDanh(sessionIds)` — số lượt điểm danh của các buổi (chỉ đếm)
- `layBuoiDangMoCuaEm()` — 1 buổi đang mở mà em thấy được (RLS: đúng khoá của em) → buổi hoặc null
- `daDiemDanh(sessionId, userId)` — em đã điểm danh buổi này chưa
- `diemDanh(sessionId, userId)` — ⚠ chưa có mô tả

### ghiChu.js — Tầng dữ liệu — bảng student_notes (ghi chú học tập của học sinh). Em chỉ đọc / sửa ghi chú của mình; giáo viên xem / xoá được.

- `layGhiChuCuaEm(userId)` — ghi chú của em: ghim trước, mới sửa trước
- `layGhiChuCuaCacHs(userIds)` — ghi chú của nhiều em (trang giáo viên), mới sửa trước
- `themGhiChu(dong)` — ⚠ chưa có mô tả
- `suaGhiChu(id, thayDoi)` — sửa (tự đặt giờ sửa)
- `xoaGhiChu(id)` — ⚠ chưa có mô tả

### ghiDanh.js — Tầng dữ liệu — bảng student_enrollments (ghi danh học sinh ↔ khoá / lớp, cần giáo viên duyệt). Mỗi hàm trả { data, error } như supabase. Học sinh chỉ đọc được ghi danh của mình: RLS trên Neon quyết định. Khoá ngoại user_id → profiles ON DELETE CASCADE nên mọi ghi danh đều có hồ sơ (nối profiles!inner không mất dòng).

- `layKhoaCuaEm(userId)` — các khoá em đã được duyệt
- `layLopCuaEm(userId, grade)` — lớp của em trong 1 khoá (null nếu chưa có lớp)
- `layHocSinhKemHoSo({ grade, lop } = {})` — Học sinh đã duyệt kèm hồ sơ — điểm danh, chấm bài, dạy, giới hạn người xem bài… @param grade khoá (bỏ trống = mọi khoá) · @param lop lớp (bỏ trống = cả khoá) Mỗi dòng: { user_id, class_name, grade, profiles: { id, full_name, username, is_active, notes_warning } }
- `layTenHocSinhCuaKhoa(grade)` — tên học sinh đã duyệt của 1 khoá, xếp theo tên → [{ id, full_name }] (chọn người xem bài)
- `layGhiDanh({ grade, lop, cacLop, daDuyet = true } = {})` — Ghi danh (không kèm hồ sơ) — đếm sĩ số, tìm học sinh của lớp… @param daDuyet true (mặc định) = đã duyệt · false = đang chờ duyệt · null = tất cả @param cacLop danh sách tên lớp (lọc nhiều lớp một lúc)
- `layLopCuaCacHs(userIds, { grade, chiDaDuyet = false } = {})` — lớp của một nhóm học sinh (gắn tên lớp vào tin nhắn, bài thi, yêu cầu đổi quà…)
- `layGhiDanhDayDuCuaCacHs(userIds)` — trang Học sinh: mọi ghi danh (kể cả chờ duyệt) của các học sinh đang xem
- `ghiDanhHocSinh(dong)` — thêm / cập nhật ghi danh (đã duyệt). `dong` là 1 dòng hoặc mảng; trùng (học sinh, khoá) thì ghi đè
- `xoaGhiDanh(id)` — ⚠ chưa có mô tả
- `duyetGhiDanhCuaHs(userId)` — duyệt mọi ghi danh đang chờ của 1 học sinh
- `tuChoiGhiDanhCuaHs(userId)` — từ chối: xoá các ghi danh đang chờ của 1 học sinh

### hoSo.js — Tầng dữ liệu — bảng profiles (hồ sơ: tên, vai trò, sticker, chuỗi ngày học…). Mỗi hàm trả { data, error } như supabase. Học sinh KHÔNG tự sửa được vai trò / sticker / chuỗi ngày (trigger trên Neon, xem sql/2026-10-13_secure_profiles.sql); sticker của học sinh được cộng qua hàm máy chủ (award_sticker_once, record_activity), không qua đây.

- `layHoSo(userId)` — hồ sơ đầy đủ của người đang đăng nhập (dùng khi đăng nhập)
- `laySticker(userId)` — sticker + chuỗi ngày học của 1 học sinh
- `layTenCacHs(ids)` — tên của một nhóm người — gắn tên vào bài nộp, tin nhắn, bài thi… (lớp: xem layLopCuaCacHs ở data/ghiDanh.js)
- `layTatCaHocSinh()` — trang Học sinh: mọi tài khoản học sinh (khoá / lớp lấy từ ghi danh, data/ghiDanh.js)
- `layHocSinhDaDuyet()` — học sinh đã duyệt (soạn tin nhắn mới)
- `layHocSinhChoDuyet()` — học sinh đang chờ duyệt tài khoản
- `demHocSinh()` — ⚠ chưa có mô tả
- `layTroGiang()` — ⚠ chưa có mô tả
- `timTenDangNhapDaCo(usernames)` — tên đăng nhập nào trong danh sách đã có người dùng (nhập học sinh hàng loạt)
- `capNhatHoSo(id, thayDoi)` — sửa tên, duyệt tài khoản, cảnh báo ghi chép… (RLS + trigger chặn cột không được phép)
- `docSoSticker(userId)` — ───────── sticker: đọc rồi ghi có khoá (giáo viên cộng / trừ khi duyệt, hoàn quà) ─────────
- `ghiStickerNeuChuaDoi(userId, cu, soMoi, tongMoi)` — ghi số sticker mới CHỈ KHI sticker_count vẫn = `cu` (có người ghi xen giữa thì 0 dòng → gọi lại)
- `thuongStickerMotLan(kind, lessonId, taskIdx = 0)` — thưởng sticker "nộp bài" / "đạt quiz" 1 lần mỗi bài — máy chủ tự kiểm tra đã nộp / đạt thật chưa (sql/2026-10-13_sticker_once.sql)
- `ghiHoatDongHomNay()` — ghi nhận em vừa học hôm nay (hàm máy chủ record_activity: chuỗi ngày + sticker mốc, có khoá chống cộng trùng)
- `layBangXepHangLop()` — bảng xếp hạng lớp của em (hàm máy chủ get_class_leaderboard)
- `layNoiDungTroGiangSoan(bang, userId)` — nội dung 1 trợ giảng đã soạn (chủ đề / câu hỏi / bài học), mới trước — tên trả về ở cột chung `ten`

### hoiDapMau.js — Tầng dữ liệu — bảng lesson_faq: hỏi đáp mẫu của từng bài (giáo viên / AI soạn, giáo viên duyệt; học sinh chỉ thấy câu đã duyệt). Mỗi hàm trả { data, error } như supabase.

- `layHoiDapCuaBai(lessonId)` — mọi câu của 1 bài: chưa duyệt trước, rồi theo thứ tự
- `layHoiDapMauChoEm(lessonId)` — câu đã duyệt cho học sinh xem (hay được hỏi trước)
- `demHoiDapDaDuyet(lessonIds)` — số câu đã duyệt của từng bài → { lessonId: số }
- `themHoiDap(dong)` — thêm 1 hoặc nhiều câu → { data: dòng vừa thêm }
- `suaHoiDap(id, thayDoi)` — sửa 1 câu → { data: dòng sau khi sửa }
- `duyetHoiDap(ids)` — duyệt nhiều câu một lần
- `xoaHoiDap(id)` — ⚠ chưa có mô tả

### hoiThayCo.js — Tầng dữ liệu — bảng student_questions (học sinh hỏi thầy cô trong bài, chế độ giáo viên trung gian) + student_question_drafts (nháp AI soạn cho giáo viên — học sinh KHÔNG đọc được). Mỗi hàm trả { data, error } như supabase.

- `demTraLoiChuaXem(studentId, lessonId)` — số câu thầy cô đã trả lời mà em chưa xem, trong 1 bài (chỉ đếm)
- `layCauHoiCuaEm(studentId, lessonId)` — 50 câu em đã hỏi trong 1 bài (lessonId rỗng = câu hỏi chung), cũ → mới
- `danhDauDaXem(ids)` — em đã xem câu trả lời
- `guiCauHoi({ studentId, lessonId, mode, cauHoi, context })` — em gửi câu hỏi → { data: câu vừa gửi }
- `layCauHoiChoTraLoi({ grade, hocSinh } = {})` — câu chờ trả lời (cũ trước), kèm tên em + bài; lọc khoá / danh sách em của lớp nếu có
- `layNhapTraLoi(ids)` — nháp AI của các câu → { questionId: { text, skip } }
- `luuNhapTraLoi(dong)` — lưu nháp AI (dòng { question_id, draft, skip_reason })
- `traLoiCauHoi(id, { status, traLoi, nguoiTraLoi })` — giáo viên trả lời ('answered', kèm câu trả lời) hoặc bỏ qua câu hỏi
- `layTongQuanCongCuAi(grade, lop)` — số liệu tóm tắt trang Công cụ AI theo khoá / lớp
- `layHangDoiDuyet({ lyDo, soDong, grade, lop, muc })` — hàng đợi bài AI chấm cần giáo viên duyệt
- `demCauHoiDangCho()` — số câu học sinh hỏi đang chờ thầy cô (chỉ đếm)
- `demBaiTongQuan()` — 3 số đếm bài nộp của trang tổng quan gộp 1 lần quét (hàm máy chủ dem_bai_tong_quan)
- `layBaoCaoTacDong()` — số liệu báo cáo tác động (hàm máy chủ impact_stats)

### khoaHoc.js — Tầng dữ liệu — cấu hình của một khoá: grades (mô tả cho AI), units (đơn vị), reward_configs (ngưỡng đổi quà), class_topic_unlock + class_lesson_unlock (chủ đề / bài đã mở cho từng lớp). Mỗi hàm chọn sẵn cột, có giới hạn dòng.

- `layMoTaKhoaChoAi(grade)` — mô tả khoá cho AI trợ giảng ('' nếu chưa có)
- `layNguongDoiQua(grade)` — ngưỡng sticker đổi quà của khoá (null = chưa đặt → dùng mặc định)
- `layMoKhoaCuaLop(grade, className)` — Chủ đề / bài đã mở cho 1 lớp — đưa vào domain/moKhoaBai.js. @returns null nếu không có lớp (coi như mở hết) · { chuDe: Set<topic>, bai: Map<lesson_id, lúc mở> }
- `layCacLop()` — mọi lớp (ca học) của mọi khoá, xếp theo khoá rồi tên
- `layCacKhoa()` — tên các khoá (value) theo thứ tự
- `themKhoa(value)` — ⚠ chưa có mô tả
- `luuMoTaKhoaChoAi(value, moTa)` — mô tả phạm vi khoá cho AI trợ giảng ('' → xoá)
- `doiTenKhoa(cu, moi)` — đổi tên khoá + mọi dữ liệu gắn với khoá. Trả { error } của bước đổi tên, { loiBang: [tên bảng lỗi] } nếu bảng nào lỗi
- `xoaKhoa(value)` — xoá khoá + lớp và ghi danh của khoá (bài học / câu hỏi / đề thi giữ lại). Trả { error }
- `layLopDayDu(grade)` — lớp đầy đủ (trang Lớp), lọc theo khoá nếu có
- `layTenLopCuaKhoa(grade)` — tên các lớp của 1 khoá → mảng tên (lỗi → mảng rỗng)
- `themLop(dong)` — ⚠ chưa có mô tả
- `suaLop(id, thayDoi)` — ⚠ chưa có mô tả
- `xoaLop(id)` — ⚠ chưa có mô tả
- `datMoChuDe(grade, className, topic, moKhoa)` — mở (moKhoa=true) hoặc khoá 1 chủ đề cho lớp; mở trùng không tính là lỗi
- `datMoBai(grade, className, lessonId, moKhoa)` — mở hoặc khoá 1 bài cho lớp; mở trùng không tính là lỗi

### phanThuong.js — Tầng dữ liệu — phần thưởng: reward_items (quà), reward_requests (yêu cầu đổi quà), reward_configs (ngưỡng theo khoá). Học sinh đổi quà qua hàm máy chủ redeem_reward (trừ sticker có khoá), không ghi thẳng reward_requests.

- `layQua()` — mọi quà (giáo viên)
- `layQuaChoEm(grade)` — quà đang mở cho em: quà chung (không gắn khoá) + quà của khoá em, rẻ trước
- `themQua(dong)` — ⚠ chưa có mô tả
- `suaQua(id, thayDoi)` — ⚠ chưa có mô tả
- `xoaQua(id)` — ⚠ chưa có mô tả
- `layYeuCauDoiQua()` — 2000 yêu cầu gần nhất kèm tên + biểu tượng quà
- `layTrangThaiDoiQuaCuaEm(userId)` — trạng thái các yêu cầu của 1 em (báo cáo thành tích)
- `layLanNhanQuaGanNhat(userId)` — lần gần nhất em được trao quà (null nếu chưa) — để báo "có quà mới"
- `xuLyYeuCau(id, trangThai)` — Đổi trạng thái 1 yêu cầu CÒN ĐANG CHỜ ('fulfilled' = đã trao, 'cancelled' = từ chối). Trả { doi: true } nếu đổi được; yêu cầu đã được xử lý trước đó (2 tab, bấm 2 lần) → { doi: false } — không hoàn sticker lần 2.
- `doiQua(itemId)` — học sinh đổi quà: máy chủ tự lấy giá, kiểm đủ sticker, trừ + tạo yêu cầu trong 1 giao dịch → { data: { ok, reason } }
- `layNguongCacKhoa()` — ngưỡng của mọi khoá → { grade: số sticker }
- `luuNguong(grade, soSticker)` — ⚠ chưa có mô tả
- `layYeuCauCuaEm(userId)` — các yêu cầu đổi quà của em kèm tên quà (thành tích của em)

### taiKhoan.js — Tầng dữ liệu — tài khoản đăng nhập (Supabase Auth) qua Edge Function create-user / update-user / delete-user. Máy chủ tự kiểm tra người gọi là giáo viên (khoá quản trị chỉ nằm ở máy chủ, không ở trang web). Mỗi hàm NÉM lỗi (Error có câu dễ hiểu) khi máy chủ từ chối.

- `taoTaiKhoan(email, password, metadata)` — tạo tài khoản (metadata: full_name, role, …) → user vừa tạo
- `suaTaiKhoan(userId, thayDoi)` — đổi thông tin đăng nhập (vd { password })
- `xoaTaiKhoan(userId)` — xoá hẳn tài khoản

### tienDo.js — Tầng dữ liệu — bảng lesson_progress (tiến độ học từng bài của học sinh). Mỗi hàm trả { data, error } (hoặc { count }). Học sinh chỉ đọc / ghi tiến độ của mình: RLS trên Neon quyết định. Quy tắc hoàn thành bài: domain/tienDoBaiHoc.js.

- `layTienDoBai(userId, lessonId)` — tiến độ của em ở 1 bài (null nếu chưa học)
- `layTienDoCuaEm(userId)` — tiến độ của em ở mọi bài (ít dòng: 1 dòng / bài đã học)
- `layTienDoChoBaoCao(userId)` — tiến độ của 1 em kèm tên bài (báo cáo thành tích của giáo viên)
- `demBaiHoanThanh(userId)` — số bài em đã hoàn thành (chỉ đếm, không tải dòng)
- `luuTienDo(dong)` — ghi tiến độ 1 bài (tạo mới hoặc sửa), trả dòng sau khi ghi
- `layTienDoCuaLop(lessonId, userIds)` — tiến độ cả lớp ở 1 bài (trang chấm bài của giáo viên) — chỉ các cột trang dùng
- `layDauVetTienDo(lessonId, userIds)` — dấu vết nhẹ (id + giờ sửa) để biết tiến độ cả lớp có đổi không trước khi tải đầy đủ
- `layTienDoCuaCacHs(userIds, lessonIds)` — tiến độ của nhiều em ở nhiều bài (trợ lý AI của giáo viên) — chỉ cột cần

### tinNhan.js — Tầng dữ liệu — bảng messages: chat học sinh ↔ giáo viên (channel 'teacher' / null cũ) và nhật ký hỏi đáp AI (channel 'ai'). Mỗi hàm trả { data, error } như supabase. Ai đọc / ghi được tin nào: RLS trên Neon quyết định.

- `layHopThu()` — hộp thư: 2000 tin thầy–trò GẦN NHẤT + mốc giờ 1000 lượt hỏi AI gần nhất (log AI rất nhiều — nội dung tải riêng khi mở 1 em)
- `layTinMoi(studentId, sauLuc)` — tin thầy–trò mới của 1 em sau mốc giờ (hỏi định kỳ khi đang mở cuộc trò chuyện)
- `layNhatKyAi(studentId)` — nhật ký hỏi đáp AI của 1 em (500 lượt gần nhất theo thứ tự thời gian)
- `layCauHoiAiTheoBai(lessonIds, soNgay)` — câu học sinh hỏi AI trong các bài (thống kê câu hay hỏi), trong `soNgay` ngày gần nhất nếu có
- `danhDauDaDoc(studentId)` — đánh dấu đã đọc mọi tin học sinh gửi trong cuộc trò chuyện
- `guiTinGiaoVien(studentId, noiDung)` — giáo viên nhắn 1 em → { data: tin vừa gửi }
- `guiTinNhieuEm(studentIds, noiDung)` — giáo viên nhắn cả lớp: 1 tin cho từng em
- `xoaTin(id)` — ⚠ chưa có mô tả
- `ghiNhatKyAi(studentId, cauHoi, traLoi, context)` — ghi nhật ký 1 lượt hỏi AI (câu hỏi + câu trả lời) để giáo viên xem lại. Không chờ, lỗi không chặn em học tiếp

## src/hooks/ — Hook giao diện (tải dữ liệu + trạng thái cho trang)

### useBaiThucHanh.js — Phần THỰC HÀNH của trang Học bài: danh sách bài nộp theo từng ô bài, chọn tệp / ghi chú, nộp, nộp lại, chờ thầy cô nhận xét (hỏi lại định kỳ, nhẹ), AI chấm (chỉ khi bật chế độ AI trực tiếp — hiện tắt cố định). Trang Học bài chỉ việc gọi hook này và truyền kết quả xuống BanDoBaiThucHanh / ChiTietBaiThucHanh.

- `useBaiThucHanh({ id, user, lesson, loading, upsertProgress, recordActivity, taiLai })` — @param id mã bài học @param user người đang đăng nhập @param lesson bài học (null khi chưa tải) @param loading trang còn đang tải @param upsertProgress ghi tiến độ bài (đánh dấu đã nộp đủ thực hành) @param recordActivity ghi ngày học (chuỗi ngày) @param taiLai tải lại cả trang (khi phát hiện đã nộp ở tab khác)

### useChamBaiThucHanh.js — Thao tác chấm bài thực hành của giáo viên: chốt mức + nhận xét, cho nộp lại, AI chấm nháp, duyệt mức AI. Quy tắc (cột ghi, ai cần chấm) ở domain/chamBai.js; sticker ở utils/stickerAward.js; ghi qua data/baiNop.js.

- `useChamBaiThucHanh({ lesson, submissionMap, suaBaiTaiCho })` — ⚠ chưa có mô tả

### useEnrollments.js

- `useEnrollments(userId)` — Danh sách enrollment đã duyệt của học sinh
- `useSelectedGrade(userId)` — Enrollment + grade đang chọn (dùng cho LearnPage, PracticePage, ExamsPage)

### useGrades.js

- `useGrades()` — ⚠ chưa có mô tả

### useHocSinh.js — Dữ liệu + thao tác trang Học sinh: tải mọi học sinh kèm ghi danh 1 lần (lọc khoá / lớp làm tại chỗ, không tải lại), duyệt / từ chối đăng ký, xoá tài khoản. Lưu / xoá xong thì tải ngầm, giữ nguyên danh sách đang xem.

- `useHocSinh()` — ⚠ chưa có mô tả

### useHopThu.js — Hộp thư giáo viên: tải cuộc trò chuyện, mở 1 em (đánh dấu đã đọc, tải log AI), hỏi tin mới mỗi 15 giây khi tab mở, trả lời, xoá tin, nhắn em mới, nhắn cả lớp. Đọc ghi qua data/tinNhan.js; gom / lọc ở domain/hoiThoai.js. (Không dùng Supabase Realtime — nó làm máy chủ gói miễn phí quá tải.)

- `useHopThu()` — ⚠ chưa có mô tả

### useLearnData.js

- `useLearnData(user, selectedGrade, className)` — Bóc loadData() + các useMemo dẫn xuất của LearnPage.jsx ra hook riêng — hành vi giữ nguyên 100%. `className`: lớp học sinh đang thuộc (cho khoá đang chọn) — dùng để lấy đúng khoá 2 tầng riêng của lớp đó (class_topic_unlock + class_lesson_unlock). Không thuộc lớp nào (null) → coi như mở hết, không bị chặn bởi tiến độ lớp.

### useLessonTitles.js

- `useLessonTitles(unitId)` — ⚠ chưa có mô tả

### usePhanThuong.js — Trang Phần thưởng của giáo viên: quà (thêm / sửa / bật tắt / xoá), yêu cầu đổi quà (trao / từ chối + hoàn sticker), ngưỡng sticker theo khoá. Đọc ghi qua data/phanThuong.js; lọc / xếp ở domain/phanThuong.js.

- `usePhanThuong()` — ⚠ chưa có mô tả

### useTienDoLop.js — Dữ liệu trang chấm bài thực hành: bài học, học sinh cả khoá, tiến độ + bài nộp từng em. Tự làm mới khi tab đang mở: mỗi 2 phút hỏi nhẹ vài cột (dấu vết), chỉ khi có thay đổi mới tải đầy đủ. (Trước đây dùng Supabase Realtime — bỏ vì dò thay đổi liên tục làm máy chủ gói miễn phí quá tải.)

- `useTienDoLop(lessonId)` — ⚠ chưa có mô tả

### useTopics.js

- `useTopics()` — ⚠ chưa có mô tả

### useUnits.js

- `useUnits(grade, topic)` — ⚠ chưa có mô tả
- `useUnitsByGrade(grade)` — Fetch all units for a grade (all topics)

## src/utils/ — Tiện ích cũ (chưa chuyển về domain / data)

### aiGrader.js

- `gradeStudent(submissions, taskDefs)` — Bundle all tasks for a student into 1 API call submissions: array indexed by task (null = not submitted) taskDefs: array of {instructions} objects Returns: { results: [{taskIndex, score, comment}] }

### anonymize.js — Ẩn họ tên học sinh trước khi gửi dữ liệu sang AI bên ngoài, rồi khôi phục khi hiển thị. Bảng tra mã ↔ tên chỉ nằm trên máy giáo viên, không bao giờ rời trình duyệt.

- `anonymizeSnapshot(snapshot)` — Thay `students[].name` trong snapshot bằng mã HS01, HS02... Trả về { snapshot đã ẩn danh, codeToName }
- `maskNames(text, codeToName)` — Thay tên thật (nếu giáo viên gõ trong câu hỏi) bằng mã. Tên dài khớp trước để không thay nửa chừng.
- `unmaskNames(text, codeToName)` — Đổi mã HS01... trong câu trả lời của AI về tên thật

### danhGia.js — Đánh giá bài thực hành (giáo viên): AI chấm nháp gợi ý mức + tiêu chí → giáo viên duyệt / đổi mức T/H/C. Dùng cho trang Chấm bài (theo bài / theo học sinh).

- `aiChamNhap(sub, taskDef)` — AI chấm nháp 1 bài (chạy trên máy giáo viên) → cập nhật DB, trả về bản ghi mới. Học sinh chưa thấy gì.
- `luuDanhGia(sub, { muc, comment, choNopLai = false, breakdown = null })` — Giáo viên chốt đánh giá: mức T/H/C + nhận xét → học sinh thấy. Cộng sticker theo mức (T 3 · H 1 · C 0); nộp lại mà mức tăng thì cộng phần chênh. Trả về bản ghi mới (null nếu lỗi).

### gradePrep.js — Chuẩn bị bài nộp để gửi AI chấm: đọc file (Scratch/Word/PowerPoint/Python), chạy thử Python. Không phụ thuộc trình duyệt → dùng chung cho trang web (aiGrader.js) và máy chủ (api/grade-pending.js). Import ghi rõ đuôi .js để Node (Vercel) chạy được.

- `parseTestCases(instructions)` — Parse [test:Xđ] Input: ... → Output: ... lines from rubric
- `runPython(code, stdin = '')` — Chạy 1 chương trình Python với stdin cho trước → { stdout, stderr } hoặc { error: true } khi không chạy được
- `prepareTasks(submissions, taskDefs)` — submissions: mảng theo thứ tự ô bài (null = chưa nộp); taskDefs: [{instructions, rubric, optional}] Trả về mảng task đã chuẩn bị để gửi /api/grade

### lessonSource.js — Gom nội dung một bài học để AI dựa vào (soạn câu hỏi...): lý thuyết + ghi chú gia sư, thiếu thì đọc thêm chữ trong slide; slide PDF dạng ảnh thì trả pdfUrl để máy chủ gửi file cho AI đọc.

- `getLessonSource(lesson)` — ⚠ chưa có mô tả

### lessonSteps.js — Tính state (done/current/todo/locked) + số sao + cờ "bài mới nhất" cho con đường học tập, dùng chung giữa LearnPage và bất kỳ nơi nào khác cần hiển thị. Khoá 3 tầng: 1. is_published=false (giáo viên chưa xong) → 'locked' 2. chủ đề của bài chưa được mở cho LỚP học sinh (class_topic_unlock) → 'locked' — khoá CẢ chủ đề, không quan tâm bài bên trong đã tick hay chưa. 3. chủ đề đã mở nhưng BÀI CỤ THỂ đó chưa được tick mở (class_lesson_unlock) → 'locked'. `unlockedTopics/unlockedLessonMap = null` nghĩa là học sinh không thuộc lớp nào — coi như mở hết mọi bài đã publish (không bị chặn bởi tiến độ lớp).

- `topicKeyOf(lesson)` — ⚠ chưa có mô tả
- `decorateLessons(publishedLessons, lockedLessons, progressMap, unlockedTopics, unlockedLessonMap)` — Trả về mảng gộp (bài đã publish + bài chưa publish), đã sort đúng thứ tự hiển thị, mỗi phần tử thêm { state, stars, isNewest }. `publishedLessons`: bài is_published=true của khoá (đầy đủ cột). `lockedLessons`: bài is_published=false của khoá (cột tối thiểu). `unlockedTopics`: Set các chủ đề đã mở cho lớp — null = không giới hạn. `unlockedLessonMap`: Map lesson_id -> thời điểm mở (ISO string) — null = không giới hạn.

### muc.js — Đánh giá bài thực hành theo MỨC (Thông tư 27): T = Hoàn thành tốt · H = Hoàn thành · C = Chưa hoàn thành. Từ 29/10/2026 không hiện điểm số nữa; giáo viên chọn mức (cột lesson_submissions.muc). Điểm AI chấm nháp (cột score, nội bộ) chỉ dùng để GỢI Ý mức cho giáo viên.

- `MUC` *(hằng)* — Đánh giá bài thực hành theo MỨC (Thông tư 27): T = Hoàn thành tốt · H = Hoàn thành · C = Chưa hoàn thành. Từ 29/10/2026 không hiện điểm số nữa; giáo viên chọn mức (cột lesson_submissions.muc). Điểm AI chấm nháp (cột score, nội bộ) chỉ dùng để GỢI Ý mức cho giáo viên.
- `CAC_MUC` *(hằng)* — ⚠ chưa có mô tả
- `mucTuDiem(score)` — gợi ý mức từ điểm AI chấm nháp (thang 10)
- `mucCua(sub)` — mức của 1 bài nộp: mức giáo viên đã chọn; bài cũ (trước khi có mức) thì quy từ điểm
- `DIEM_DAI_DIEN` *(hằng)* — điểm đại diện khi giáo viên đổi mức (giữ cho các báo cáo nội bộ dùng điểm vẫn có số liệu hợp lý)

### pptxAnimations.js — Đọc HIỆU ỨNG (animation) và CHUYỂN TRANG (transition) từ XML 1 slide PowerPoint để AI chấm bài "biết" học sinh đã làm gì — trước đây AI chỉ thấy chữ/định dạng/ảnh nên không chấm được bài Animation. Hàm thuần xử lý chuỗi (không phụ thuộc trình duyệt) để test được bằng Node.

- `shapeLabels(slideXml)` — Bảng id → mô tả ngắn của từng đối tượng trên slide (để nói hiệu ứng gắn vào đối tượng nào)
- `describeTransition(slideXml)` — Chuyển trang của slide, ví dụ "Fade". Trả về '' nếu không có.
- `describeAnimations(slideXml)` — Danh sách hiệu ứng theo đúng thứ tự chạy trên slide
- `animationLines(slideXml)` — Các dòng chú thích gắn vào cuối nội dung của slide khi gửi cho AI chấm

### practiceTaskParser.js — Tách 1 đoạn text dán vào thành nhiều bài thực hành, mỗi bài tự tách luôn phần "Tiêu chí chấm" (nếu có) ra khỏi đề bài — tiêu chí chấm luôn nằm ở CUỐI mỗi bài.

- `parsePracticeTasks(rawText)` — ⚠ chưa có mô tả

### questionCheck.js — Soát lỗi cấu trúc các câu hỏi đã parse (từ utils/questionParser.js) — dùng sau khi AI soạn câu hỏi, để giáo viên biết câu nào cần sửa trước khi lưu. Trả về [{ index, msg }].

- `checkParsedQuestions(parsed)` — Soát lỗi cấu trúc các câu hỏi đã parse (từ utils/questionParser.js) — dùng sau khi AI soạn câu hỏi, để giáo viên biết câu nào cần sửa trước khi lưu. Trả về [{ index, msg }].

### questionParser.js

- `parseQuestions(rawText)` — ⚠ chưa có mô tả

### sb3Text.js — Extracted from Sb3Viewer.jsx — generate plain text summary of a Scratch project for AI grading

- `describeInput(blocks, input)` — Chuỗi mô tả 1 input để AI phân biệt rõ: chữ gõ tay trong ngoặc kép "…", số giữ nguyên, biến [biến x], khối lồng (a + b) — trước đây khối/biến cũng bị đặt trong ngoặc kép như chữ gõ tay nên AI tưởng em "chưa dùng phép toán".
- `generateSb3Text(project)` — ⚠ chưa có mô tả

### slideText.js — Đọc CHỮ THUẦN từ slide bài giảng (.pptx hoặc .pdf) để AI soạn ghi chú cho gia sư. Khác extractContent trong aiGrader.js: ở đây không cần định dạng (đậm/màu/căn lề), chỉ cần nội dung.

- `extractSlideText(url)` — ⚠ chưa có mô tả
- `docChuFile(file)` — Chữ + ghi chú của file .pptx / .pdf trên máy → làm nguồn cho AI soạn kịch bản
- `pdfThanhAnh(file, onTrang, toiDa = 60)` — Vẽ từng trang PDF thành ảnh JPEG (rộng 1600px như khung slide). onTrang(i, tong, blob) gọi lần lượt từng trang.

### stickerAward.js

- `adjustStickerCount(userId, delta, { affectsTotal = false, minResultCount = 0 } = {})` — Cộng/trừ sticker theo kiểu "đọc rồi ghi có khoá" (compare-and-swap): đọc sticker_count hiện tại, ghi lại CHỈ KHI nó vẫn đúng bằng giá trị vừa đọc — nếu có nơi khác (2 tab, 2 lượt cộng gần nhau, học sinh vừa đổi quà...) vừa ghi đè xen giữa, update sẽ không khớp dòng nào và tự thử lại. Tránh kiểu ghi đè tuyệt đối "sticker_count = số cũ + delta" từng gây mất sticker khi 2 lượt ghi chồng lên nhau.  `affectsTotal`: true khi đây là 1 lượt TRAO sticker mới (tăng luôn sticker_total, chỉ tiêu tích luỹ) — false khi chỉ điều chỉnh sticker_count hiện có (vd hoàn sticker vì từ chối yêu cầu đổi quà — sticker đó đã được tính vào sticker_total từ lúc trao ban đầu rồi, hoàn lại không tính thêm lần nữa). `minResultCount`: chặn không cho sticker_count sau khi cộng/trừ thấp hơn mức này (mặc định 0 — không cho âm). Trả về `insufficient: true` nếu chặn.
- `thuongStickerTheoMuc(subId, userId, muc)` — Thưởng sticker khi giáo viên duyệt: cộng phần còn thiếu so với số bài này đã được thưởng (cột sticker_thuong). Lần đầu cộng đủ theo mức; nộp lại mà mức tăng thì cộng phần chênh (C → T: +3); giữ nguyên hoặc giảm thì không cộng, không trừ. Đọc lại từ DB và chỉ ghi khi số cũ chưa đổi, nên duyệt trùng / 2 tab cũng không cộng 2 lần.

### tieuChi.js — Tách "Tiêu chí chấm" (rubric giáo viên viết, nhiều kiểu: dòng "Tên: 1đ", bảng | Tiêu chí | Điểm |, gạch đầu dòng "* … **2 điểm**") thành danh sách câu tiêu chí NGUYÊN VĂN của giáo viên — bỏ phần điểm, bỏ dòng chạy thử ẩn [test:…]. Dùng cho "Rà soát lỗi": AI chỉ phân loại đạt / chưa đạt từng câu này, học sinh thấy đúng câu của giáo viên. Không phụ thuộc trình duyệt (dùng chung cho api/ra-soat.js).

- `TIEU_CHI_CHUNG` *(hằng)* — Tách "Tiêu chí chấm" (rubric giáo viên viết, nhiều kiểu: dòng "Tên: 1đ", bảng | Tiêu chí | Điểm |, gạch đầu dòng "* … **2 điểm**") thành danh sách câu tiêu chí NGUYÊN VĂN của giáo viên — bỏ phần điểm, bỏ dòng chạy thử ẩn [test:…]. Dùng cho "Rà soát lỗi": AI chỉ phân loại đạt / chưa đạt từng câu này, học sinh thấy đúng câu của giáo viên. Không phụ thuộc trình duyệt (dùng chung cho api/ra-soat.js).
- `tachTieuChi(rubric)` — ⚠ chưa có mô tả
- `tieuChiRaSoat(task)` — tiêu chí dùng để rà soát 1 bài: từ rubric, không có thì 1 tiêu chí chung

### updateStreak.js

- `updateStreak(userId)` — Ghi nhận hoạt động học hôm nay qua hàm máy chủ record_activity (migration_secure_profiles.sql): tính chuỗi ngày học + cộng sticker mốc chuỗi trong 1 giao dịch có khoá dòng → mở nhiều tab cũng chỉ tính 1 lần, học sinh không tự sửa được chuỗi/sticker. `userId` giữ để tương thích, máy chủ tự lấy từ phiên đăng nhập. eslint-disable-next-line no-unused-vars

### video.js — Link video giáo viên dán → link nhúng YouTube (null nếu không nhận ra — khi đó hiện link thường).

- `getEmbedUrl(url)` — Link video giáo viên dán → link nhúng YouTube (null nếu không nhận ra — khi đó hiện link thường).

### weakness.js — Phân tích bảng điểm AI (lesson_submissions.ai_breakdown = [{ criterion, earned, max, note? }]) để tìm "lỗi hay gặp" — dùng cho (1) gia sư AI cá nhân hóa theo từng em, (2) thẻ lỗi chung của lớp.

- `buildWeaknessProfile(rows, { top = 4, maxChars = 700 } = {})` — rows: [{ ai_breakdown, lessons: { title } }] — mới nhất trước. Trả về chuỗi ngắn gọn cho gia sư AI, hoặc '' nếu chưa có dữ liệu.
- `summarizeClassErrors(submissions, { minSample = 3, topNotes = 2 } = {})` — submissions: mảng bài nộp của nhiều học sinh trong CÙNG 1 bài học. Trả về các tiêu chí xếp theo tỉ lệ học sinh bị mất điểm giảm dần.

### wordOrder.js — Câu hỏi "Sắp xếp thành câu" (word_order) tách theo CỤM TỪ thay vì từng tiếng. Tiếng Việt viết cách từng tiếng ("Bàn phím là thiết bị") → tách theo dấu cách ra quá nhiều mảnh lẻ, khó sắp xếp. - Giáo viên tự chia cụm bằng dấu "/": "Hiệu ứng / giúp bài trình bày / sinh động hơn" - Không có "/" (kể cả câu hỏi cũ đã lưu theo từng tiếng): tự gom thành cụm 2–3 tiếng liền nhau.

- `autoChunk(words)` — Gom các tiếng liền nhau thành cụm: câu ≤ 4 tiếng giữ nguyên; dài hơn chia thành 3–6 cụm đều nhau
- `splitPhrases(input)` — Chuỗi giáo viên nhập → { sentence: câu đúng (không còn "/"), chunks: các cụm theo đúng thứ tự }
- `storedPhrases(q)` — Tách options đã lưu thành { chunks (đúng thứ tự, ghép lại = câu đúng), distractors (từ gây nhiễu) }
- `phraseBank(q)` — Các "thẻ" hiện cho học sinh bấm/kéo (chưa xáo trộn)
- `sameSentence(answer, correct)` — So câu học sinh ghép (các thẻ nối bằng ",") với câu đúng — bỏ qua hoa/thường, dấu phẩy, khoảng trắng thừa

### xaoTron.js — Xáo trộn danh sách (Fisher–Yates: mọi thứ tự có khả năng như nhau). Không sửa mảng gốc. Xáo xong mà vẫn y nguyên thứ tự ban đầu (dễ gặp khi ít phần tử) thì xoay 1 nấc — để học sinh không nhận sẵn đáp án đúng ở câu sắp xếp / ghép cặp / kéo thả.

- `xaoTron(arr)` — Xáo trộn danh sách (Fisher–Yates: mọi thứ tự có khả năng như nhau). Không sửa mảng gốc. Xáo xong mà vẫn y nguyên thứ tự ban đầu (dễ gặp khi ít phần tử) thì xoay 1 nấc — để học sinh không nhận sẵn đáp án đúng ở câu sắp xếp / ghép cặp / kéo thả.

## src/lib/ — Kết nối dịch vụ ngoài (Supabase, Cloudinary, API)

### aiMode.js — Chế độ AI phía học sinh — đồng bộ với api/_auth.js. TẮT CỐ ĐỊNH từ 27/10/2026 (mô hình "giáo viên làm trung gian"): học sinh không tương tác trực tiếp với AI (điều khoản Gemini API không cho dùng trong ứng dụng hướng tới người dưới 18 tuổi); AI chỉ chấm nháp / soạn nháp trả lời cho giáo viên, học sinh nhận nội dung SAU KHI giáo viên duyệt. Biến môi trường VITE_STUDENT_AI_DIRECT không còn tác dụng — muốn bật lại phải sửa code ở đây và api/_auth.js.

- `STUDENT_AI_DIRECT` *(hằng)* — Chế độ AI phía học sinh — đồng bộ với api/_auth.js. TẮT CỐ ĐỊNH từ 27/10/2026 (mô hình "giáo viên làm trung gian"): học sinh không tương tác trực tiếp với AI (điều khoản Gemini API không cho dùng trong ứng dụng hướng tới người dưới 18 tuổi); AI chỉ chấm nháp / soạn nháp trả lời cho giáo viên, học sinh nhận nội dung SAU KHI giáo viên duyệt. Biến môi trường VITE_STUDENT_AI_DIRECT không còn tác dụng — muốn bật lại phải sửa code ở đây và api/_auth.js.
- `MEDIATED_SINCE` *(hằng)* — Mốc chuyển sang mô hình giáo viên làm trung gian. Bài AI chấm TRƯỚC mốc này học sinh đã xem rồi (giai đoạn AI trả lời trực tiếp 11/10–27/10/2026), vẫn để hiện như cũ; bài AI chấm SAU mốc này chỉ hiện khi giáo viên đã duyệt. (Lần chuyển đầu 07/10/2026; dời mốc khi chuyển lại 27/10/2026 để không ẩn lại ~1.300 bài học sinh đã xem điểm.)
- `feedbackVisible(sub)` — Học sinh có được thấy điểm/nhận xét của bài nộp này không

### apiFetch.js

- `apiFetch(path, body)` — Gọi API serverless (/api/...) kèm access token của phiên đăng nhập — máy chủ dùng nó để xác minh người gọi là ai, vai trò gì (xem api/_auth.js). Trả về Response như fetch.

### cloudinary.js

- `uploadImage(file)` — tải ảnh lên Cloudinary → đường dẫn https
- `uploadAudio(file)` — Upload âm thanh (Cloudinary xếp audio vào nhóm video)
- `uploadFile(file)` — Upload any file type — dùng /raw để file luôn accessible trực tiếp (PDF, docx, sb3...)
- `uploadHocLieu(file)` — tải 1 tệp học liệu lên đúng nhóm (ảnh / âm thanh / tệp khác giữ nguyên) → { url, ten } — ten là tên gốc để học sinh tải về
- `deleteFile(url)` — Xóa file trên Cloudinary (best-effort — không chặn luồng nếu lỗi)

### maDangNhap.js

- `maDangNhap()` — Thẻ đăng nhập của người đang dùng — các chức năng quản lý tài khoản (create/update/delete-user) kiểm tra thẻ này là giáo viên / trợ giảng. Trước 07/11/2026 gửi khoá công khai nên ai cũng gọi được.

### supabase.js

- `NOI_DU_LIEU` *(hằng)* — ⚠ chưa có mô tả
- `supabase` *(hằng)* — ⚠ chưa có mô tả

### taiVe.js — Tải tệp trên mạng về máy với đúng tên gốc (học liệu bài học). Thẻ <a download> không đổi được tên khi tệp nằm ở trang khác (Cloudinary), nên tải về dạng blob rồi lưu; lỗi thì mở tệp ở tab mới.

- `luuTepVeMay(url, ten)` — tải tệp ở url về máy, đặt tên `ten`; không tải được thì mở tab mới để em tự lưu

## api/ — Máy chủ Vercel — chỉ tệp dùng chung `_*.js`

### _auth.js — Xác minh người gọi API AI (file bắt đầu bằng "_" nên Vercel KHÔNG tạo route cho nó). Client gửi kèm access token của phiên Supabase ở header Authorization: Bearer <token>.

- `DATA_REST` *(hằng)* — Nơi đọc ghi dữ liệu: Neon nếu có VITE_NEON_DATA_URL (công tắc, xem src/lib/supabase.js), không thì Supabase. Đăng nhập luôn ở Supabase; Neon nhận thẻ đăng nhập của Supabase.
- `studentAiDirect()` — Chế độ học sinh tương tác TRỰC TIẾP với AI (gia sư trả lời ngay, AI chấm ngay khi nộp). TẮT CỐ ĐỊNH từ 27/10/2026 — điều khoản Gemini API không cho dùng trong ứng dụng hướng tới người dưới 18 tuổi, nên học sinh chỉ nhận nội dung AI sau khi giáo viên duyệt. Biến môi trường VITE_STUDENT_AI_DIRECT không còn tác dụng (đồng bộ với src/lib/aiMode.js).
- `STAFF` *(hằng)* — ⚠ chưa có mô tả
- `requireUser(req, res, roles = null)` — Trả về { id, role } nếu hợp lệ; nếu không thì tự trả lỗi 401/403 và trả về null. roles: danh sách vai trò được phép (bỏ trống = mọi tài khoản đã đăng nhập, đang hoạt động).

### _gemini.js — Tiện ích dùng chung: xoay vòng nhiều API key Gemini để né giới hạn ngày (RPD). File bắt đầu bằng "_" nên Vercel KHÔNG tạo route cho nó.

- `getGeminiKeys()` — Lấy tất cả key đã cấu hình: GEMINI_API_KEY, GEMINI_API_KEY_2 ... GEMINI_API_KEY_6
- `isDailyLimit(obj)` — Nhận diện lỗi 429 do hết hạn mức NGÀY (RPD) — để phân biệt với giới hạn/phút (RPM)
- `callGeminiRotate({ model, keys, payload, primaryTimeoutMs })` — Gọi Gemini generateContent: tự xoay vòng key khi gặp 429; model chính quá tải thì thử lại 1 lần rồi lần lượt chuyển sang model dự phòng. Trả về đối tượng Response (chưa đọc body) để caller tự xử lý; res.aiModel / res.aiTries cho biết model nào đã trả lời và sau mấy lần gọi (để chẩn đoán chậm). primaryTimeoutMs (tuỳ chọn, cho việc cần trả lời nhanh như chấm bài / trợ giảng): model chính quá thời gian này chưa trả lời thì bỏ, chuyển ngay sang model dự phòng (20/10/2026 3.1-flash-lite có lúc mất ~20 giây/lần).

### _gradeCore.js — Lõi AI chấm bài (file bắt đầu bằng "_" nên Vercel KHÔNG tạo route cho nó). Dùng chung cho api/grade.js (trình duyệt gọi) và api/grade-pending.js (máy chủ tự chấm bài còn sót).

- `gradeTasks(tasks)` — tasks: mảng task đã chuẩn bị (src/utils/gradePrep.js) → { status, body } — body giống hệt phản hồi của /api/grade

### _hoiDapPrompt.js — Lời nhắc AI soạn HỎI ĐÁP MẪU cho 1 bài học (giáo viên duyệt trước khi học sinh thấy). File bắt đầu bằng "_" nên Vercel KHÔNG tạo route cho nó. Chỉ nội dung bài học, không dữ liệu học sinh.

- `hoiDapPrompt({ lessonTitle, grade, sourceText, questions, daCo, soCau })` — Lời nhắc AI soạn HỎI ĐÁP MẪU cho 1 bài học (giáo viên duyệt trước khi học sinh thấy). File bắt đầu bằng "_" nên Vercel KHÔNG tạo route cho nó. Chỉ nội dung bài học, không dữ liệu học sinh.

### _slidePrompts.js — Lời nhắc AI soạn bài giảng web: ① kịch bản chữ (giáo viên duyệt) → ② slide JSON (src/components/slides/slideModel.js). Chuyển từ app Lớp học số (api/_lib/soan-bai.js), đổi nguồn từ SGK sang nội dung bài học có sẵn trong app. File bắt đầu bằng "_" nên Vercel KHÔNG tạo route cho nó. Chỉ nội dung bài học, không dữ liệu học sinh.

- `slideScriptPrompt({ lessonTitle, grade, topic, sourceText, questions, extra, slideNguon })` — ⚠ chưa có mô tả
- `slideBuildPrompt({ kichBan })` — ⚠ chưa có mô tả
