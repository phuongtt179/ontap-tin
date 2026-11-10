# Prompt tạo câu hỏi Tin học tiểu học

Sao chép toàn bộ prompt bên dưới, điền vào các chỗ `[...]`, rồi gửi cho AI (ChatGPT, Claude, Gemini...).

---

## PROMPT (copy từ đây)

```
Bạn là chuyên gia soạn câu hỏi Tin học tiểu học Việt Nam.
Hãy tạo [SỐ LƯỢNG] câu hỏi về chủ đề "[CHỦ ĐỀ]" dành cho học sinh [KHỐI LỚP].
Mức độ: [dễ / trung bình / khó].
Loại câu hỏi cần tạo: [liệt kê loại, ví dụ: trắc nghiệm, điền từ, sắp xếp, ghép đôi...].

QUAN TRỌNG — Xuất ra ĐÚNG định dạng sau, KHÔNG giải thích thêm, KHÔNG đánh số lại, KHÔNG thêm tiêu đề:

═══════════════════════════════════════
QUY TẮC ĐỊNH DẠNG
═══════════════════════════════════════

1. Mỗi câu BẮT BUỘC bắt đầu bằng "Câu N:" (N là số thứ tự).
2. Đặt mã loại câu ngay sau "Câu N:" — xem bảng mã bên dưới.
3. Câu hỏi có code: dùng ---python / --- (không dùng backtick).
4. Mỗi câu cách nhau 1 dòng trống.

BẢNG MÃ LOẠI CÂU HỎI:
  [TN] = Trắc nghiệm (4 đáp án A B C D)
  [DS] = Đúng / Sai
  [DT] = Điền từ (dùng ___ cho chỗ trống)
  [KT] = Kéo thả từ (có dòng "Từ:" liệt kê từ gây nhiễu)
  [SX] = Sắp xếp thứ tự (dùng 1. 2. 3. ...)
  [ND] = Ghép đôi (dùng dấu | để nối cặp)
  [ST] = Sắp xếp từ thành câu (có dòng "Câu đúng:")
  [TL] = Tự luận

═══════════════════════════════════════
VÍ DỤ TỪNG LOẠI (làm theo đúng mẫu này)
═══════════════════════════════════════

--- Trắc nghiệm [TN] ---
Câu 1: [TN] Thiết bị nào sau đây dùng để nhập dữ liệu vào máy tính?
A. Màn hình
B. Bàn phím
C. Loa
D. Máy in
Đáp án: B
Gợi ý: Thiết bị nhập (INPUT) là thiết bị đưa dữ liệu vào máy tính.

--- Đúng / Sai [DS] ---
Câu 2: [DS] CPU được gọi là bộ não của máy tính. Đúng hay sai?
Đáp án: Đúng
Gợi ý: CPU (Central Processing Unit) xử lý mọi lệnh của máy tính.

--- Điền từ 1 chỗ trống [DT] ---
Câu 3: [DT] ___ là thiết bị dùng để di chuyển con trỏ trên màn hình.
Đáp án: Chuột
Gợi ý: Thiết bị này có hình dạng nhỏ, cầm tay, kết nối với máy tính.

--- Điền từ nhiều chỗ trống [DT] ---
Câu 4: [DT] ___ là thiết bị nhập văn bản, ___ hiển thị kết quả, ___ xử lý dữ liệu.
Đáp án: Bàn phím, Màn hình, CPU
Gợi ý: Nhớ 3 thành phần chính: nhập - xuất - xử lý.

--- Kéo thả từ [KT] ---
Câu 5: [KT] Phần mềm ___ dùng để soạn thảo văn bản, phần mềm ___ dùng để tính toán bảng tính.
Từ: Word, Excel, PowerPoint, Paint
Đáp án: Word, Excel
Gợi ý: Word → văn bản, Excel → bảng tính/số liệu.

--- Sắp xếp thứ tự [SX] ---
Câu 6: [SX] Sắp xếp các bước tắt máy tính đúng thứ tự
1. Đóng tất cả chương trình đang chạy
2. Bấm nút Start
3. Chọn Shut down
4. Chờ máy tắt hoàn toàn
Gợi ý: Không tắt nguồn đột ngột, tránh mất dữ liệu.

--- Ghép đôi [ND] ---
Câu 7: [ND] Ghép thiết bị với chức năng tương ứng
Bàn phím | Nhập văn bản và lệnh
Chuột | Di chuyển và click chọn
Máy in | In tài liệu ra giấy
Loa | Phát âm thanh
Gợi ý: Phân loại: thiết bị nhập, thiết bị xuất.

--- Sắp xếp từ thành câu [ST] ---
Câu 8: [ST] Sắp xếp các từ sau thành câu hoàn chỉnh
Câu đúng: Bàn phím là thiết bị nhập dữ liệu vào máy tính
Gợi ý: Câu bắt đầu bằng tên thiết bị.

--- Tự luận [TL] ---
Câu 9: [TL] Em hãy nêu sự khác nhau giữa thiết bị nhập và thiết bị xuất. Cho ví dụ mỗi loại.
Gợi ý: Thiết bị nhập đưa dữ liệu VÀO máy (bàn phím, chuột). Thiết bị xuất đưa kết quả RA ngoài (màn hình, máy in).

--- Câu hỏi có code Python [TN] ---
Câu 10: [TN] Đoạn code sau in ra kết quả gì?
---python
x = 10
y = 3
print(x + y)
---
A. 10
B. 3
C. 13
D. 103
Đáp án: C
Gợi ý: Toán tử + cộng hai số nguyên lại với nhau.

--- Điền từ có code [DT] ---
Câu 11: [DT] Điền lệnh còn thiếu vào chỗ ___ để chương trình in ra "Xin chào"
---python
___("Xin chào")
---
Đáp án: print
Gợi ý: Lệnh dùng để hiển thị thông tin ra màn hình trong Python.

═══════════════════════════════════════
LƯU Ý BẮT BUỘC
═══════════════════════════════════════
- Câu hỏi phải BẮT ĐẦU bằng "Câu N:" — không dùng "1." hay "Question 1"
- Mã loại [TN][DS]... đặt ngay sau dấu ":" không có khoảng trắng trước
- Dòng "Đáp án:" bắt buộc với mọi câu (trừ tự luận, có thể bỏ)
- Dòng "Gợi ý:" nên có để học sinh hiểu khi làm sai
- Câu sắp xếp [SX]: items dùng 1. 2. 3. (không phải A B C)
- Câu ghép đôi [ND]: dùng dấu | để phân cách hai vế
- Code block: dùng ---python / --- (không dùng backtick ```)
- KHÔNG thêm chú thích, giải thích, hay markdown ngoài format trên

Bây giờ hãy tạo [SỐ LƯỢNG] câu hỏi về "[CHỦ ĐỀ]" cho học sinh [KHỐI LỚP], mức độ [dễ/trung bình/khó].
```

---

## Cách dùng

1. Copy toàn bộ phần trong khung ``` ở trên
2. Thay các chỗ `[...]`:
   - `[SỐ LƯỢNG]` → ví dụ: `10`
   - `[CHỦ ĐỀ]` → ví dụ: `Thiết bị máy tính`
   - `[KHỐI LỚP]` → ví dụ: `lớp 3`
   - `[dễ / trung bình / khó]` → chọn 1
   - `[liệt kê loại]` → ví dụ: `trắc nghiệm (5 câu), điền từ (3 câu), sắp xếp (2 câu)`
3. Gửi cho AI → nhận kết quả → paste vào ô nhập câu hỏi trong app

---

## Ví dụ prompt hoàn chỉnh

```
Bạn là chuyên gia soạn câu hỏi Tin học tiểu học Việt Nam.
Hãy tạo 10 câu hỏi về chủ đề "Lập trình Scratch" dành cho học sinh lớp 4.
Mức độ: trung bình.
Loại câu hỏi cần tạo: trắc nghiệm (4 câu), điền từ (2 câu), sắp xếp (2 câu), ghép đôi (2 câu).

QUAN TRỌNG — Xuất ra ĐÚNG định dạng sau...
[phần còn lại của prompt như trên]
```

---

## Gợi ý chủ đề theo khối

| Khối | Chủ đề phù hợp |
|------|----------------|
| Lớp 3 | Làm quen máy tính, Bàn phím và chuột, Phần mềm học tập, Paint cơ bản |
| Lớp 4 | Thiết bị I/O, Scratch cơ bản, Word cơ bản, Internet an toàn |
| Lớp 5 | Lập trình Scratch nâng cao, PowerPoint, Excel cơ bản, Bảo mật thông tin |
