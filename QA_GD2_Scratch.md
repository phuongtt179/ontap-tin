# GIÁO TRÌNH ÔN TẬP GIAI ĐOẠN 2 (GĐ2) - D1 SCRATCH

**CLB Kỹ Năng Số & Lập Trình Thiếu Nhi**
**Lớp D1 Scratch — Giai Đoạn 2 (Buổi 1–24 của GĐ2)**

Mỗi buổi gồm:
- 10 câu hỏi ôn tập (6 dạng: Trắc nghiệm, Đúng/Sai, Điền từ, Kéo thả từ, Sắp xếp, Nối đôi)
- 3 bài tập thực hành (mỗi bài tạo file .sb3)

---

## BUỔI 1: BIẾN (VARIABLES)

### CÂU HỎI ÔN TẬP

**Câu 1 (Trắc nghiệm):** Biến trong Scratch dùng để làm gì?
A. Lưu trữ một giá trị có thể thay đổi trong quá trình chạy chương trình
B. Tạo ra một sprite mới
C. Chuyển đổi backdrop
D. Phát âm thanh
**Đáp án: A**

**Câu 2 (Trắc nghiệm):** Khối lệnh nào CỘNG THÊM 3 vào giá trị hiện tại của biến score?
A. set [score] to (3)
B. change [score] by (3)
C. show variable [score]
D. set [score] to (score + 3)
**Đáp án: B**

**Câu 3 (Đúng/Sai):** Biến "For all sprites" có thể được đọc và thay đổi bởi tất cả các sprite trong dự án.
**Đáp án: Đúng**

**Câu 4 (Đúng/Sai):** Sau khi chạy khối "set [x] to (10)", nếu chạy tiếp "change [x] by (5)", giá trị của x là 5.
**Đáp án: Sai** (x = 10 + 5 = 15)

**Câu 5 (Điền từ):** Để tạo biến mới, vào danh mục ___, nhấn nút "Make a Variable".
**Đáp án: Variables**

**Câu 6 (Điền từ):** Biến loại ___ chỉ thuộc về một sprite duy nhất, sprite khác không thể thay đổi.
**Đáp án: For this sprite only**

**Câu 7 (Kéo thả từ):** Điền vào chỗ trống:
Để biến score hiện lên màn hình dùng khối ___ [score]. Để ẩn đi dùng khối ___ [score].
Ngân hàng từ: **show variable / hide variable / set / change**
**Đáp án: show variable / hide variable**

**Câu 8 (Sắp xếp):** Sắp xếp các bước tạo và dùng biến đếm điểm:
- [ ] Dùng "change [score] by (10)" khi nhặt vật phẩm
- [ ] Tạo biến mới tên "score"
- [ ] Đặt "set [score] to (0)" khi nhấn cờ xanh
- [ ] Chọn "For all sprites"
**Đáp án:** Tạo biến → Chọn For all sprites → Set score to 0 → Change score by 10

**Câu 9 (Nối đôi):** Nối khối lệnh với chức năng:
1. set [x] to (0) — A. Tăng giá trị biến x lên 5
2. change [x] by (5) — B. Đặt biến x bằng 0
3. show variable [x] — C. Ẩn biến khỏi màn hình
4. hide variable [x] — D. Hiển thị biến trên màn hình
**Đáp án: 1-B, 2-A, 3-D, 4-C**

**Câu 10 (Trắc nghiệm):** Biến "score" đang là 10. Chạy "change [score] by (-3)". Kết quả là:
A. 3
B. 7
C. 13
D. -3
**Đáp án: B**

### BÀI TẬP THỰC HÀNH

**Bài 1:** Tạo project "Bộ đếm" — Sprite có nút "+" và "-". Nhấn "+" tăng biến counter lên 1, nhấn "-" giảm 1. Hiển thị counter trên màn hình. Nhấn cờ xanh reset counter về 0.

**Bài 2:** Tạo project "Theo dõi nhiệt độ" — Sprite nhiệt kế có biến "nhiet_do". Phím mũi tên Lên tăng 1 độ, mũi tên Xuống giảm 1 độ. Khi nhiet_do > 37 đổi màu đỏ (color effect), khi <= 37 trở về bình thường.

**Bài 3:** Tạo project "Túi tiền" — 3 sprite đồng xu: 1000đ, 2000đ, 5000đ. Biến "tong_tien". Click vào đồng xu cộng giá trị tương ứng. Phím R reset về 0. Hiển thị tong_tien trên màn hình.

---

## BUỔI 2: ĐIỂM SỐ (SCORE SYSTEM)

### CÂU HỎI ÔN TẬP

**Câu 1 (Trắc nghiệm):** Để phân biệt nhiều loại vật phẩm có điểm khác nhau từ một sprite, ta dùng:
A. Nhiều sprite riêng biệt
B. Biến item_type kết hợp if/else
C. Nhiều backdrop
D. Biến score riêng cho từng loại
**Đáp án: B**

**Câu 2 (Trắc nghiệm):** Muốn reset điểm về 0 khi bắt đầu game mới, đặt khối nào dưới "when green flag clicked"?
A. change [score] by (0)
B. hide variable [score]
C. set [score] to (0)
D. show variable [score]
**Đáp án: C**

**Câu 3 (Đúng/Sai):** Sau khi nhân vật chạm vào vật phẩm và cộng điểm, nên ẩn vật phẩm đó để tránh cộng điểm nhiều lần.
**Đáp án: Đúng**

**Câu 4 (Đúng/Sai):** Một game Scratch chỉ có thể có một loại vật phẩm cho điểm.
**Đáp án: Sai**

**Câu 5 (Điền từ):** Để ẩn một vật phẩm sau khi thu thập, dùng khối lệnh ___.
**Đáp án: hide**

**Câu 6 (Điền từ):** Biến item_type = 1 cho đồng xu (+5 điểm), item_type = 2 cho ngôi sao (+20 điểm). Ta dùng câu lệnh ___ để kiểm tra loại và cộng đúng điểm.
**Đáp án: if...then (hoặc: if)**

**Câu 7 (Kéo thả từ):** Hoàn thành đoạn code xử lý điểm:
if (touching [nhân vật]?) then
  if (item_type = 1) then ___ [score] by (5)
  if (item_type = 2) then ___ [score] by (20)
  ___
Ngân hàng từ: **change / set / hide / show / delete**
**Đáp án: change / change / hide**

**Câu 8 (Sắp xếp):** Sắp xếp bước xây dựng hệ thống điểm cơ bản:
- [ ] Kiểm tra if touching [nhân vật] thì cộng điểm
- [ ] Tạo biến score và set về 0 khi bắt đầu
- [ ] Ẩn vật phẩm sau khi thu thập
- [ ] Hiển thị biến score trên màn hình
**Đáp án:** Tạo biến score → Hiển thị score → Kiểm tra touching → Cộng điểm → Ẩn vật phẩm

**Câu 9 (Nối đôi):** Nối loại vật phẩm với điểm tương ứng (thông thường):
1. Đồng xu đồng — A. +50 điểm
2. Ngôi sao — B. +5 điểm
3. Kim cương — C. +100 điểm
4. Đồng xu vàng — D. +10 điểm
**Đáp án: 1-B, 2-A, 3-C, 4-D**

**Câu 10 (Trắc nghiệm):** Vật phẩm loại "bom" khi thu thập sẽ:
A. Luôn cộng điểm
B. Không có tác dụng
C. Có thể trừ điểm hoặc trừ mạng tùy thiết kế
D. Kết thúc game ngay
**Đáp án: C**

### BÀI TẬP THỰC HÀNH

**Bài 1:** Tạo project "Thu thập sao" — Nhân vật di chuyển bằng phím mũi tên. 3 ngôi sao xuất hiện trên màn hình. Chạm sao +10 điểm và ẩn sao. Khi cờ xanh: reset score về 0 và hiện lại tất cả sao.

**Bài 2:** Tạo project "Phân loại vật phẩm" — 2 loại: táo (item_type=1, +5đ) và vàng (item_type=2, +20đ). Nhân vật di chuyển thu thập. Dùng if/else kiểm tra loại và cộng điểm đúng. Hiển thị tổng score.

**Bài 3:** Tạo project "Bảng xếp hạng mini" — Game thu thập vật phẩm trong 30 giây. 5 loại vật phẩm điểm khác nhau. Sau khi game kết thúc, sprite nói điểm và xếp loại: dưới 50 = "Cố lên!", 50–100 = "Tốt!", trên 100 = "Xuất sắc!".

---

## BUỔI 3: TOÁN TỬ (OPERATORS)

### CÂU HỎI ÔN TẬP

**Câu 1 (Trắc nghiệm):** Kết quả của (10 mod 3) trong Scratch là:
A. 3
B. 1
C. 0
D. 33
**Đáp án: B** (10 chia 3 dư 1)

**Câu 2 (Trắc nghiệm):** Muốn kiểm tra "cả hai điều kiện đều đúng", dùng khối nào?
A. or
B. not
C. and
D. if
**Đáp án: C**

**Câu 3 (Đúng/Sai):** Trong Scratch, khối "(5 > 3)" trả về giá trị true (đúng).
**Đáp án: Đúng**

**Câu 4 (Đúng/Sai):** Khối "not (false)" trả về kết quả false.
**Đáp án: Sai** (not(false) = true)

**Câu 5 (Điền từ):** Để làm tròn số thập phân về số nguyên gần nhất, dùng khối ___ trong mục Operators.
**Đáp án: round**

**Câu 6 (Điền từ):** Phép toán lấy phần dư trong Scratch gọi là ___.
**Đáp án: mod**

**Câu 7 (Kéo thả từ):** Điền vào chỗ trống:
Kiểm tra điểm lớn hơn 100 VÀ thời gian lớn hơn 0:
(score > 100) ___ (time > 0)
Ngân hàng từ: **and / or / not / then**
**Đáp án: and**

**Câu 8 (Sắp xếp):** Sắp xếp thứ tự ưu tiên phép toán (cao → thấp):
- [ ] Cộng (+) và Trừ (-)
- [ ] Nhân (*) và Chia (/)
- [ ] Ngoặc đơn ()
- [ ] Mod
**Đáp án:** Ngoặc đơn → Nhân/Chia → Mod → Cộng/Trừ

**Câu 9 (Nối đôi):** Nối phép toán với mô tả:
1. (a mod b) — A. Phần dư của a chia b
2. round(x) — B. Làm tròn x thành số nguyên
3. [abs v] of (x) — C. Giá trị tuyệt đối của x
4. (a) * (b) — D. Tích của a và b
**Đáp án: 1-A, 2-B, 3-C, 4-D**

**Câu 10 (Trắc nghiệm):** Điều kiện nào kiểm tra điểm trong khoảng 70 đến 100?
A. (score > 70) or (score < 100)
B. (score > 70) and (score < 100)
C. (70 < score < 100)
D. not (score < 70)
**Đáp án: B**

### BÀI TẬP THỰC HÀNH

**Bài 1:** Tạo project "Máy tính 4 phép" — Sprite hỏi người dùng nhập 2 số (ask and wait). Nhấn phím +/-/*/: để tính. Hiển thị kết quả bằng "say". Dùng phép toán tương ứng trong Operators.

**Bài 2:** Tạo project "Kiểm tra chẵn lẻ" — Sprite hỏi nhập số. Dùng mod để kiểm tra: nếu số mod 2 = 0 nói "Số chẵn!", ngược lại nói "Số lẻ!". Thêm kiểm tra số âm/dương.

**Bài 3:** Tạo project "Game điều kiện kép" — Nhân vật chỉ nhặt được vật phẩm khi thỏa MÃN CẢ HAI điều kiện: score < 100 AND lives > 1. Dùng khối "and" để kiểm tra. Nếu không đủ điều kiện, vật phẩm xuất hiện nhưng không thu thập được.

---

## BUỔI 4: RANDOM (SỐ NGẪU NHIÊN)

### CÂU HỎI ÔN TẬP

**Câu 1 (Trắc nghiệm):** Khối "pick random (1) to (10)" trả về:
A. Luôn luôn là 5
B. Một số nguyên ngẫu nhiên từ 1 đến 10
C. Tất cả số từ 1 đến 10 theo thứ tự
D. Một số thập phân ngẫu nhiên
**Đáp án: B**

**Câu 2 (Trắc nghiệm):** Muốn vật phẩm xuất hiện ở vị trí ngẫu nhiên trên màn hình, dùng:
A. go to x: (0) y: (0)
B. go to [random position v]
C. move (10) steps
D. point in direction (random)
**Đáp án: B**

**Câu 3 (Đúng/Sai):** "pick random (1) to (1)" luôn trả về giá trị là 1.
**Đáp án: Đúng**

**Câu 4 (Đúng/Sai):** Để tăng độ khó theo điểm, ta tăng giới hạn dưới của pick random để tốc độ tối thiểu cao hơn.
**Đáp án: Đúng**

**Câu 5 (Điền từ):** Để vật phẩm xuất hiện x ngẫu nhiên từ trái sang phải màn hình, viết: go to x: (pick random ___ to ___) y: (180).
**Đáp án: -240 / 240**

**Câu 6 (Điền từ):** Trong cơ chế combo streak, biến ___ đếm số lần thu thập thành công liên tiếp.
**Đáp án: streak (hoặc combo)**

**Câu 7 (Kéo thả từ):** Điền để tạo tốc độ tăng theo điểm:
set [speed] to (pick random (___ + 1) to (___ + 3))
Ngân hàng từ: **score/10 / score/5 / score / time**
**Đáp án: score/10 / score/10**

**Câu 8 (Sắp xếp):** Sắp xếp các bước tạo độ khó tăng dần theo điểm:
- [ ] Tính speed mới: set speed to (pick random (1+score/20) to (3+score/20))
- [ ] Mỗi lần cộng điểm, cập nhật speed
- [ ] Khi bắt đầu: set speed to 2
- [ ] Kiểm tra if score > ngưỡng thì tăng tốc
**Đáp án:** Set speed to 2 → Cộng điểm → Kiểm tra ngưỡng → Tính speed mới

**Câu 9 (Nối đôi):** Nối ứng dụng với cách dùng random:
1. Vị trí x ngẫu nhiên — A. pick random (-240) to (240)
2. Tốc độ tăng theo điểm — B. pick random (score/10) to (score/5)
3. Loại vật phẩm ngẫu nhiên — C. pick random (1) to (3)
4. Hướng di chuyển ngẫu nhiên — D. pick random (0) to (360)
**Đáp án: 1-A, 2-B, 3-C, 4-D**

**Câu 10 (Trắc nghiệm):** Cách viết điều kiện 50% cơ hội nhận thưởng:
A. if (pick random (1) to (10) > 5) then
B. if (pick random (1) to (2) = 1) then
C. Cả A và B đều đúng
D. Không thể làm được trong Scratch
**Đáp án: C**

### BÀI TẬP THỰC HÀNH

**Bài 1:** Tạo project "Mưa vật phẩm" — Mỗi 1 giây, một vật phẩm xuất hiện ở x ngẫu nhiên trên đỉnh màn hình và rơi xuống. Nhân vật hứng được +10 điểm. Vật phẩm chạm đất biến mất.

**Bài 2:** Tạo project "Kẻ thù tốc độ ngẫu nhiên" — 3 kẻ thù di chuyển từ phải sang trái với tốc độ pick random 1 to 5 riêng biệt. Ra khỏi màn hình trái → quay lại bên phải với tốc độ ngẫu nhiên mới. Mỗi giây sống sót +1 điểm.

**Bài 3:** Tạo project "Cơ hội may mắn" — Nhân vật đua xe. Cứ 5 giây có sự kiện ngẫu nhiên: pick random 1 to 3 → 1: +50 điểm bonus, 2: tốc độ tăng gấp đôi 5 giây, 3: xuất hiện chướng ngại vật. Hiển thị thông báo tương ứng.

---

## BUỔI 5: TIMER (ĐẾM NGƯỢC THỜI GIAN)

### CÂU HỎI ÔN TẬP

**Câu 1 (Trắc nghiệm):** Cách tốt nhất để tạo đếm ngược 30 giây trong Scratch là:
A. Dùng khối "timer" có sẵn
B. Tạo biến "time"=30, vòng lặp "wait 1s → change time by -1"
C. Dùng "wait (30) seconds" rồi kết thúc
D. Đặt backdrop tự động đếm
**Đáp án: B**

**Câu 2 (Trắc nghiệm):** Khi biến "time" về 0, thường xảy ra điều gì?
A. Game tự động reset
B. Điểm tăng gấp đôi
C. Game over — chuyển màn hình kết thúc
D. Nhân vật biến mất
**Đáp án: C**

**Câu 3 (Đúng/Sai):** Đồng hồ đếm ngược nên đặt trong "repeat (30)" với "wait (1) seconds" bên trong.
**Đáp án: Đúng**

**Câu 4 (Đúng/Sai):** Khi bắt đầu game mới, cần set biến time về 0.
**Đáp án: Sai** (Set về giá trị ban đầu như 30 hoặc 60)

**Câu 5 (Điền từ):** Câu lệnh kiểm tra game over: if (___ = 0) then [chuyển màn game over].
**Đáp án: time**

**Câu 6 (Điền từ):** Để thêm 10 giây thưởng khi nhặt vật phẩm đặc biệt, dùng: change [time] ___ (10).
**Đáp án: by**

**Câu 7 (Kéo thả từ):** Điền vào chỗ trống tạo đếm ngược:
set [time] to (30)
repeat (30)
  ___ (1) seconds
  change [time] ___ (-1)
end
Ngân hàng từ: **wait / by / change / to / set**
**Đáp án: wait / by**

**Câu 8 (Sắp xếp):** Sắp xếp bước xây dựng timer cho game:
- [ ] Kiểm tra if (time = 0) thì chuyển game over
- [ ] Tạo biến "time" và hiển thị trên màn hình
- [ ] Vòng lặp: wait 1s → change time by -1
- [ ] Set time về 30 khi nhấn cờ xanh
**Đáp án:** Tạo biến → Set time=30 → Vòng lặp đếm → Kiểm tra game over

**Câu 9 (Nối đôi):** Nối điều kiện với hành động:
1. time = 0 — A. Tăng tốc độ kẻ thù
2. time < 10 — B. Game over
3. Nhặt vật đặc biệt — C. Màn hình đổi màu đỏ cảnh báo
4. Nhấn chơi lại — D. Reset time về 30
**Đáp án: 1-B, 2-C, 3-A (tùy thiết kế), 4-D**

**Câu 10 (Trắc nghiệm):** Vòng lặp đếm ngược từ 60 về 0 nên dùng:
A. repeat until (time = 0)
B. repeat (60) với wait 1s và change time by -1
C. forever với wait 1s và change time by -1 kèm if time=0 stop
D. Cả B và C đều hoạt động
**Đáp án: D**

### BÀI TẬP THỰC HÀNH

**Bài 1:** Tạo project "Đua xếp số" — Màn hình hiển thị 3 số ngẫu nhiên. Người chơi có 30 giây nhập tổng (ask and wait). Đúng +50 điểm, sai hiện đáp án. Đếm ngược hiển thị. Hết giờ kết thúc.

**Bài 2:** Tạo project "Né đạn có thời gian" — Nhân vật né đạn trong 30 giây. Chạm đạn -5 giây (phạt). Sống sót đến hết giờ thì thắng. Màn game over khi time = 0.

**Bài 3:** Tạo project "Thử thách tốc độ" — Nhân vật thu thập vật phẩm với đếm ngược. Thu đủ 5 vật phẩm trong 10 giây → +10 giây thưởng thêm. Không đủ → -5 điểm. Game kết thúc khi time = 0.

---

## BUỔI 6: GAME HOÀN CHỈNH #1

### CÂU HỎI ÔN TẬP

**Câu 1 (Trắc nghiệm):** Một game hoàn chỉnh cơ bản cần tối thiểu mấy backdrop?
A. 1
B. 2 (chơi + kết thúc)
C. 3 (bắt đầu + chơi + kết thúc)
D. 4 trở lên
**Đáp án: C**

**Câu 2 (Trắc nghiệm):** Khối lệnh chuyển sang backdrop khác là:
A. go to [backdrop]
B. switch backdrop to [tên backdrop]
C. change backdrop by (1)
D. set backdrop
**Đáp án: B**

**Câu 3 (Đúng/Sai):** Màn hình bắt đầu cần có nút "Start" để người chơi nhấn trước khi game chạy.
**Đáp án: Đúng**

**Câu 4 (Đúng/Sai):** Không cần reset điểm và thời gian khi người chơi nhấn chơi lại.
**Đáp án: Sai**

**Câu 5 (Điền từ):** Trong màn game over, thường hiển thị ___ cuối cùng và nút chơi lại.
**Đáp án: điểm số / score**

**Câu 6 (Điền từ):** Khi nhấn "Chơi lại", cần ___ tất cả biến về giá trị ban đầu trước khi bắt đầu lại.
**Đáp án: reset / set lại**

**Câu 7 (Kéo thả từ):** Điền luồng game:
Cờ xanh: switch backdrop to [___] → Nhấn Start: switch backdrop to [___] + reset biến → time=0: switch backdrop to [___]
Ngân hàng từ: **start / game / game_over**
**Đáp án: start / game / game_over**

**Câu 8 (Sắp xếp):** Sắp xếp thứ tự các màn hình trong game:
- [ ] Màn game over với điểm cuối
- [ ] Game chơi chính
- [ ] Màn bắt đầu với nút Start
- [ ] Đếm ngược thời gian
**Đáp án:** Màn bắt đầu → Game chơi + đếm ngược → Màn game over

**Câu 9 (Nối đôi):** Nối thành phần với chức năng:
1. Start screen — A. Diễn ra hoạt động chính
2. Game screen — B. Thông báo kết thúc, điểm số
3. Game over screen — C. Giới thiệu, nút bắt đầu
4. Reset function — D. Đặt lại tất cả biến
**Đáp án: 1-C, 2-A, 3-B, 4-D**

**Câu 10 (Trắc nghiệm):** Để sprite chỉ hoạt động trong màn game, không hiện ở start/game over, ta:
A. Đặt sprite ngoài màn hình
B. Dùng "show" khi vào game, "hide" ở màn khác
C. Xóa sprite
D. Đổi màu sprite thành trong suốt
**Đáp án: B**

### BÀI TẬP THỰC HÀNH

**Bài 1:** Tạo project "Catch the Star" — 3 backdrop: start, game, gameover. Nhân vật hứng sao rơi trong 30 giây. Mỗi sao +10 điểm. Nút Start ở màn đầu, điểm hiển thị ở màn cuối. Có nút Chơi lại.

**Bài 2:** Tạo project "Né bom" — 3 backdrop đầy đủ. Nhân vật né bom ngẫu nhiên trong 45 giây. Chạm bom → game over ngay. Sống sót hết giờ → màn chiến thắng. Điểm tăng theo thời gian sống.

**Bài 3:** Tạo project "Quiz chạy đua" — 3 backdrop. Màn start giới thiệu luật. Game: 5 câu toán đơn giản, mỗi câu 20 giây. Đúng +10, sai -5. Game over screen hiển thị điểm và số câu đúng/sai.

---

## BUỔI 7: MẠNG SỐNG (LIVES SYSTEM)

### CÂU HỎI ÔN TẬP

**Câu 1 (Trắc nghiệm):** Hệ thống mạng sống thường dùng biến tên gì?
A. health
B. lives
C. hp
D. Cả A, B, C đều dùng được
**Đáp án: D**

**Câu 2 (Trắc nghiệm):** Cơ chế "vô địch tạm thời" (invincibility) sau khi bị thương dùng để:
A. Tăng tốc độ nhân vật
B. Tránh bị mất nhiều mạng liên tiếp trong thời gian ngắn
C. Tự hồi mạng
D. Tăng điểm thưởng
**Đáp án: B**

**Câu 3 (Đúng/Sai):** Có thể dùng hiệu ứng ghost nhấp nháy để thể hiện trạng thái vô địch tạm thời.
**Đáp án: Đúng**

**Câu 4 (Đúng/Sai):** Khi lives = 0, game tiếp tục chạy đến khi hết thời gian.
**Đáp án: Sai** (lives = 0 thì game over)

**Câu 5 (Điền từ):** Để nhân vật nhấp nháy khi bất tử, dùng vòng lặp thay đổi hiệu ứng ___ qua lại giữa 0 và 100.
**Đáp án: ghost**

**Câu 6 (Điền từ):** Biến ___ đặt = 1 khi vừa bị thương và = 0 khi hết thời gian bất tử, tránh trừ mạng liên tiếp.
**Đáp án: invincible**

**Câu 7 (Kéo thả từ):** Điền vào chỗ trống:
Khi chạm kẻ thù: if (___ = 0) then change [lives] by (-1) → set [___] to (1) → nhấp nháy 3 giây → set [invincible] to (0)
Ngân hàng từ: **invincible / lives / score / time**
**Đáp án: invincible / invincible**

**Câu 8 (Sắp xếp):** Sắp xếp xử lý khi nhân vật bị thương:
- [ ] Wait 2 giây (thời gian bất tử)
- [ ] Set invincible to 0
- [ ] Kiểm tra if invincible = 0
- [ ] Change lives by -1, set invincible to 1
- [ ] Nhấp nháy ghost effect
**Đáp án:** Kiểm tra invincible → Change lives + Set invincible 1 → Nhấp nháy → Wait 2s → Set invincible 0

**Câu 9 (Nối đôi):** Nối số mạng với trạng thái hiển thị icon tim:
1. lives = 3 — A. Ẩn tất cả 3 trái tim
2. lives = 2 — B. Hiện cả 3 trái tim
3. lives = 1 — C. Chỉ hiện 1 trái tim
4. lives = 0 — D. Chỉ hiện 2 trái tim
**Đáp án: 1-B, 2-D, 3-C, 4-A**

**Câu 10 (Trắc nghiệm):** Khối lệnh nào tạo hiệu ứng ghost cho sprite?
A. set [color v] effect to (50)
B. set [ghost v] effect to (100)
C. change [ghost v] effect by (25)
D. Cả B và C đều đúng tùy mục đích
**Đáp án: D**

### BÀI TẬP THỰC HÀNH

**Bài 1:** Tạo project "3 Mạng sống" — Nhân vật có 3 mạng (3 icon tim). Kẻ thù di chuyển ngẫu nhiên. Chạm kẻ thù: -1 mạng, ẩn 1 tim. lives=0 → game over. Reset khi chơi lại.

**Bài 2:** Tạo project "Bất tử tạm thời" — Thêm invincibility: khi bị thương nhân vật nhấp nháy ghost effect 3 giây, không thể bị thương lại. Sau 3 giây trở về bình thường. Hiển thị số mạng còn lại.

**Bài 3:** Tạo project "Hồi mạng" — Lives tối đa 5. Có kẻ thù (trừ mạng) và trái tim vật phẩm (+1 mạng, tối đa 5). Timer 60 giây. Sống sót hết giờ với ít nhất 1 mạng thì thắng.

---

## BUỔI 8: GAME HOÀN CHỈNH #2

### CÂU HỎI ÔN TẬP

**Câu 1 (Trắc nghiệm):** Game hoàn chỉnh cấp nâng cao cần tối thiểu mấy yếu tố?
A. 2 (điểm + thời gian)
B. 3 (điểm + thời gian + kẻ thù)
C. 5 (màn hình start/end + điểm + timer + lives + random)
D. Không giới hạn
**Đáp án: C**

**Câu 2 (Trắc nghiệm):** Yếu tố quan trọng nhất để game cảm giác "cân bằng" là:
A. Đồ họa đẹp
B. Độ khó tăng dần phù hợp
C. Âm thanh phong phú
D. Nhiều màn hình
**Đáp án: B**

**Câu 3 (Đúng/Sai):** Game hoàn chỉnh #2 nên có cả hệ thống lives lẫn đếm ngược thời gian.
**Đáp án: Đúng**

**Câu 4 (Đúng/Sai):** Khi tích hợp nhiều hệ thống, không cần lo thứ tự reset các biến khi chơi lại.
**Đáp án: Sai** (Phải reset tất cả biến đúng thứ tự)

**Câu 5 (Điền từ):** Khi tích hợp nhiều hệ thống vào một game, nên tổ chức code theo từng ___ riêng để dễ quản lý.
**Đáp án: sprite / script / phần**

**Câu 6 (Điền từ):** Màn hình chiến thắng (win screen) xuất hiện khi người chơi hoàn thành mục tiêu TRƯỚC KHI ___ về 0.
**Đáp án: time / thời gian**

**Câu 7 (Kéo thả từ):** Điền điều kiện game:
Game over khi: (___ = 0) OR (___ = 0)
Win khi: ___ đạt mục tiêu VÀ time > 0
Ngân hàng từ: **lives / time / score / level**
**Đáp án: lives / time / score**

**Câu 8 (Sắp xếp):** Sắp xếp thứ tự thiết kế game hoàn chỉnh:
- [ ] Test và điều chỉnh độ khó
- [ ] Thêm âm thanh và hiệu ứng
- [ ] Xây dựng gameplay cốt lõi (di chuyển, va chạm)
- [ ] Lên kế hoạch: mục tiêu, thành phần
- [ ] Tích hợp UI (lives, timer, score)
**Đáp án:** Lên kế hoạch → Gameplay cốt lõi → UI → Âm thanh/hiệu ứng → Test

**Câu 9 (Nối đôi):** Nối điều kiện với kết quả:
1. lives = 0 — A. Màn "You Win!"
2. time = 0 — B. Màn game over (thua)
3. score >= 100 trước hết giờ — C. Màn game over (hết giờ)
4. Nhấn Start — D. Reset biến và bắt đầu
**Đáp án: 1-B, 2-C, 3-A, 4-D**

**Câu 10 (Trắc nghiệm):** Cách tốt nhất để thông báo tất cả sprite cùng bắt đầu game:
A. Nhấn cờ xanh, mỗi sprite tự xử lý
B. Dùng "broadcast [start game]", sprite lắng nghe với "when I receive"
C. Dùng biến game_on = 1
D. Cả B và C đều hoạt động tốt
**Đáp án: D**

### BÀI TẬP THỰC HÀNH

**Bài 1:** Tạo project "Space Defender" — Tàu né thiên thạch. 3 backdrop (start/game/end), lives=3, timer=60, score tăng theo thời gian sống, thiên thạch vị trí random. Thiên thạch to -1 mạng, nhỏ -5 điểm.

**Bài 2:** Tạo project "Hái quả rừng" — 3 loại quả: xoài (+10), táo (+5), quả độc (-1 mạng). Timer 45s, lives=3. Win condition: đạt 100 điểm. 3 màn hình đầy đủ với điểm cuối.

**Bài 3:** Tạo project "Bảo vệ lâu đài" — Tên lửa bay vào lâu đài. Nhân vật đỡ tên lửa. Qua được +10 điểm. Trúng lâu đài -1 lives. Timer 60s. Win = 200 điểm. Lives=5. 3 màn hình hoàn chỉnh.

---

## BUỔI 9: CLONE CƠ BẢN

### CÂU HỎI ÔN TẬP

**Câu 1 (Trắc nghiệm):** Clone trong Scratch là gì?
A. Sprite hoàn toàn mới và độc lập
B. Bản sao của sprite, có thể có hành vi riêng
C. Backdrop được nhân đôi
D. Âm thanh được lặp lại
**Đáp án: B**

**Câu 2 (Trắc nghiệm):** Khối lệnh TẠO clone là:
A. when I start as a clone
B. create clone of [myself v]
C. delete this clone
D. clone sprite
**Đáp án: B**

**Câu 3 (Đúng/Sai):** Mỗi clone có thể chạy script riêng thông qua "when I start as a clone".
**Đáp án: Đúng**

**Câu 4 (Đúng/Sai):** Clone không cần xóa vì Scratch tự động xóa chúng khi ra ngoài màn hình.
**Đáp án: Sai** (Phải dùng "delete this clone")

**Câu 5 (Điền từ):** Để xóa một clone, dùng khối lệnh ___.
**Đáp án: delete this clone**

**Câu 6 (Điền từ):** Sprite gốc thường nên được ___ để không hiển thị, chỉ dùng để tạo clone.
**Đáp án: hide / ẩn**

**Câu 7 (Kéo thả từ):** Điền để tạo hệ thống clone:
Sprite gốc: ___ → mỗi 1 giây ___ of [myself] → clone: when I ___ as a clone → di chuyển → nếu ra rìa → ___ this clone
Ngân hàng từ: **hide / create clone / start / delete**
**Đáp án: hide / create clone / start / delete**

**Câu 8 (Sắp xếp):** Sắp xếp bước tạo hệ thống mưa kẻ thù bằng clone:
- [ ] Clone di chuyển xuống và xóa khi ra ngoài màn hình
- [ ] Sprite gốc ẩn đi
- [ ] Sprite gốc tạo clone mỗi 1 giây
- [ ] Clone xuất hiện ở x ngẫu nhiên trên đỉnh
**Đáp án:** Sprite gốc ẩn → Tạo clone → Clone xuất hiện ngẫu nhiên → Di chuyển và xóa

**Câu 9 (Nối đôi):** Nối khối lệnh với vai trò:
1. create clone of [myself v] — A. Script chạy ngay khi clone được tạo
2. when I start as a clone — B. Xóa bản sao hiện tại
3. delete this clone — C. Tạo bản sao
4. hide (sprite gốc) — D. Ẩn sprite gốc, chỉ clone hiển thị
**Đáp án: 1-C, 2-A, 3-B, 4-D**

**Câu 10 (Trắc nghiệm):** Scratch cho phép tối đa bao nhiêu clone cùng lúc?
A. 10
B. 100
C. 300
D. Không giới hạn
**Đáp án: C**

### BÀI TẬP THỰC HÀNH

**Bài 1:** Tạo project "Mưa sao" — Sprite sao ẩn. Mỗi 0.5 giây tạo 1 clone. Clone xuất hiện x ngẫu nhiên y=180, rơi xuống tốc độ 5. y < -180 → xóa clone. Nhân vật hứng sao ở dưới.

**Bài 2:** Tạo project "Pháo hoa" — Nhấn Space tạo 5 clone cùng lúc. Mỗi clone di chuyển hướng ngẫu nhiên (pick random 0 to 360) bước 5. Sau 20 bước, clone xóa. Clone xuất hiện từ vị trí nhân vật.

**Bài 3:** Tạo project "Đàn cá" — Sprite cá gốc ẩn. Tạo 10 clone lúc bắt đầu. Mỗi clone hướng và tốc độ riêng ngẫu nhiên (1–5), chạm rìa quay đầu. Click chuột tạo thêm 5 clone.

---

## BUỔI 10: CLONE NÂNG CAO

### CÂU HỎI ÔN TẬP

**Câu 1 (Trắc nghiệm):** Để mỗi clone có tốc độ riêng, cần dùng biến loại nào?
A. For all sprites
B. For this sprite only
C. Biến toàn cục
D. Không thể tạo biến riêng cho clone
**Đáp án: B**

**Câu 2 (Trắc nghiệm):** Tại sao cần dùng biến "For this sprite only" cho clone?
A. Clone không đọc được biến global
B. Mỗi clone cần giá trị riêng không ảnh hưởng clone khác
C. Biến global tốn bộ nhớ hơn
D. Scratch yêu cầu như vậy
**Đáp án: B**

**Câu 3 (Đúng/Sai):** Khi sprite gốc tạo clone, mỗi clone có bản sao biến "For this sprite only" với giá trị bằng sprite gốc tại thời điểm tạo.
**Đáp án: Đúng**

**Câu 4 (Đúng/Sai):** Mỗi clone có thể có kích thước (size) khác nhau nếu thay đổi size trong "when I start as a clone".
**Đáp án: Đúng**

**Câu 5 (Điền từ):** Để mỗi clone kẻ thù có tốc độ ngẫu nhiên, đặt biến speed (For this sprite only) = pick random ___ to ___ trong "when I start as a clone".
**Đáp án: 1 to 5 (hoặc khoảng hợp lý)**

**Câu 6 (Điền từ):** Khi clone va chạm nhân vật, chỉ xóa ___ đó mà không ảnh hưởng clone khác.
**Đáp án: clone này / this clone**

**Câu 7 (Kéo thả từ):** Điền để clone di chuyển với tốc độ riêng:
when I start as a clone:
set [speed] to (pick random 1 to ___)
forever: move (___ steps)
if y < -180 then ___ this clone
Ngân hàng từ: **5 / speed / delete / hide**
**Đáp án: 5 / speed / delete**

**Câu 8 (Sắp xếp):** Sắp xếp bước tạo clone nâng cao với tốc độ và kích thước riêng:
- [ ] Đặt speed ngẫu nhiên, size ngẫu nhiên trong "when I start as a clone"
- [ ] Tạo biến "speed" và "my_size" loại For this sprite only
- [ ] Clone di chuyển dùng biến speed của chính nó
- [ ] Sprite gốc ẩn và tạo clone định kỳ
**Đáp án:** Tạo biến For this sprite only → Sprite gốc ẩn + tạo clone → Đặt speed/size ngẫu nhiên → Di chuyển bằng biến riêng

**Câu 9 (Nối đôi):** Nối loại biến với đặc điểm:
1. For all sprites — A. Mỗi clone có bản riêng, độc lập
2. For this sprite only — B. Tất cả clone chia sẻ cùng giá trị
3. Biến speed trong clone — C. Được set ngay khi clone bắt đầu
4. Biến global — D. Có thể đọc từ bất kỳ sprite nào
**Đáp án: 1-B, 2-A, 3-C, 4-D**

**Câu 10 (Trắc nghiệm):** Nếu dùng biến "For all sprites" để lưu tốc độ của nhiều clone, vấn đề xảy ra là:
A. Không có vấn đề
B. Tất cả clone có cùng tốc độ bằng giá trị cuối cùng được set
C. Clone không di chuyển được
D. Scratch báo lỗi
**Đáp án: B**

### BÀI TẬP THỰC HÀNH

**Bài 1:** Tạo project "Kẻ thù tốc độ riêng" — Sprite kẻ thù tạo 1 clone mỗi 1.5 giây. Mỗi clone có biến speed (For this sprite only) = pick random 1 to 5. Clone rơi từ trên xuống. Chạm nhân vật: -1 lives và xóa clone đó.

**Bài 2:** Tạo project "Bong bóng đa dạng" — Clone bong bóng: kích thước ngẫu nhiên (20–100), màu ngẫu nhiên (color effect), tốc độ ngẫu nhiên. Click bong bóng để "nổ" (xóa, +điểm theo kích thước). Mục tiêu: đạt 200 điểm.

**Bài 3:** Tạo project "Thiên thạch phân nhánh" — Thiên thạch lớn (size=80) khi bị bắn tạo ra 2 thiên thạch nhỏ hơn (size=40). Thiên thạch nhỏ bị bắn → biến mất, điểm cao hơn. Mỗi loại có tốc độ riêng.

---

## BUỔI 11: NHIỀU LOẠI CLONE (ITEM_TYPE)

### CÂU HỎI ÔN TẬP

**Câu 1 (Trắc nghiệm):** Để tạo nhiều loại vật phẩm khác nhau từ một sprite, kỹ thuật nào được dùng?
A. Tạo nhiều sprite riêng biệt
B. Biến item_type kết hợp switch costume
C. Nhiều backdrop khác nhau
D. Copy sprite nhiều lần
**Đáp án: B**

**Câu 2 (Trắc nghiệm):** Nếu item_type = pick random (1) to (3), tạo được bao nhiêu loại clone?
A. 1
B. 2
C. 3
D. Vô hạn
**Đáp án: C**

**Câu 3 (Đúng/Sai):** Mỗi loại clone (item_type khác nhau) có thể có hành vi, điểm và costume riêng.
**Đáp án: Đúng**

**Câu 4 (Đúng/Sai):** Biến item_type nên là "For all sprites" để tất cả sprite biết loại vật phẩm.
**Đáp án: Sai** (item_type nên là "For this sprite only" để mỗi clone có loại riêng)

**Câu 5 (Điền từ):** Để clone tự chuyển sang costume tương ứng loại của nó, dùng ___ trong "when I start as a clone".
**Đáp án: switch costume to**

**Câu 6 (Điền từ):** Khi clone loại 1 cộng 5 điểm, loại 2 cộng 10 điểm, loại 3 trừ 1 mạng, cần dùng chuỗi ___ để xử lý từng loại.
**Đáp án: if/else if**

**Câu 7 (Kéo thả từ):** Điền để clone tự nhận dạng và đổi costume:
when I start as a clone:
set [item_type] to (pick random 1 to 3)
if (item_type = 1) ___ costume to [coin]
if (item_type = 2) ___ costume to [star]
if (item_type = 3) ___ costume to [bomb]
Ngân hàng từ: **switch / change / set / go**
**Đáp án: switch / switch / switch**

**Câu 8 (Sắp xếp):** Sắp xếp bước tạo hệ thống nhiều loại clone:
- [ ] Trong "when I start as a clone": set item_type = random, switch costume
- [ ] Tạo sprite với nhiều costume (xu, sao, bom)
- [ ] Xử lý va chạm theo từng loại
- [ ] Tạo biến item_type (For this sprite only)
**Đáp án:** Tạo sprite + costume → Tạo biến item_type → Clone nhận loại + đổi costume → Xử lý va chạm

**Câu 9 (Nối đôi):** Nối loại vật phẩm với tác động:
1. Đồng xu (item_type=1) — A. -1 mạng sống
2. Ngôi sao (item_type=2) — B. +5 điểm thường
3. Bom (item_type=3) — C. +30 giây thêm
4. Đồng hồ (item_type=4) — D. +20 điểm đặc biệt
**Đáp án: 1-B, 2-D, 3-A, 4-C**

**Câu 10 (Trắc nghiệm):** Lợi ích chính của nhiều loại clone từ một sprite so với nhiều sprite riêng:
A. Tiết kiệm số lượng sprite, code gọn hơn
B. Clone chạy nhanh hơn
C. Không thể tạo nhiều sprite trong Scratch
D. Clone ẩn/hiện tốt hơn
**Đáp án: A**

### BÀI TẬP THỰC HÀNH

**Bài 1:** Tạo project "3 loại vật phẩm" — Sprite có 3 costume: xu (+5), sao (+15), tim (+1 mạng). Mỗi giây tạo 1 clone với item_type ngẫu nhiên 1/2/3. Clone tự đổi costume. Nhân vật chạm: xử lý theo loại.

**Bài 2:** Tạo project "Phân loại rác" — 4 loại rác (giấy, nhựa, thủy tinh, hữu cơ), màu sắc costume khác nhau. Rác rơi ngẫu nhiên. Nhân vật là thùng đúng loại: thu đúng +10, thu sai -5.

**Bài 3:** Tạo project "Thời tiết ngẫu nhiên" — 5 loại vật thể rơi: mưa (+2), tuyết (+1), sét (-2 mạng), lửa (-1 mạng), cầu vồng (+20, +5 giây). Nhân vật né/hứng. Timer 30s. Mỗi loại costume riêng biệt.

---

## BUỔI 12: BẮN ĐẠN (SHOOTING WITH CLONE)

### CÂU HỎI ÔN TẬP

**Câu 1 (Trắc nghiệm):** Kỹ thuật tốt nhất để tạo hệ thống bắn đạn là:
A. Di chuyển sprite đạn từng bước
B. Sprite đạn ẩn, khi bắn tạo clone di chuyển
C. Tạo nhiều sprite đạn sẵn
D. Dùng backdrop vẽ đạn
**Đáp án: B**

**Câu 2 (Trắc nghiệm):** Sau khi đạn (clone) trúng kẻ thù, nên xảy ra điều gì?
A. Đạn tiếp tục di chuyển
B. Đạn xóa và gửi broadcast để kẻ thù biết
C. Chỉ cộng điểm, không xóa đạn
D. Đạn quay lại nhân vật
**Đáp án: B**

**Câu 3 (Đúng/Sai):** Clone đạn nên được tạo từ vị trí của nhân vật, không phải vị trí cố định.
**Đáp án: Đúng**

**Câu 4 (Đúng/Sai):** Nếu không xóa clone đạn khi ra khỏi màn hình, số clone có thể vượt 300 và gây lag.
**Đáp án: Đúng**

**Câu 5 (Điền từ):** Để đạn bay theo hướng nhân vật đang nhìn, dùng khối ___ trước khi tạo clone.
**Đáp án: point in direction (của nhân vật)**

**Câu 6 (Điền từ):** Khi đạn trúng kẻ thù, để kẻ thù biết và phản ứng, dùng khối ___ [hit].
**Đáp án: broadcast**

**Câu 7 (Kéo thả từ):** Điền để tạo hệ thống bắn đạn:
Nhân vật: nhấn Space → ___ clone of [đạn]
Đạn gốc: ___ (ẩn)
Đạn clone: go to [nhân vật] → forever (move 10 steps → if touching [kẻ thù] → ___ [hit] → delete this clone → if y > 180 → delete this clone)
Ngân hàng từ: **create / hide / broadcast / show**
**Đáp án: create / hide / broadcast**

**Câu 8 (Sắp xếp):** Sắp xếp bước tạo hệ thống bắn đạn:
- [ ] Đạn clone di chuyển, kiểm tra chạm kẻ thù hoặc rìa
- [ ] Nhân vật nhấn Space → tạo clone đạn
- [ ] Trúng: broadcast "hit", xóa đạn, kẻ thù lắng nghe và xử lý
- [ ] Sprite đạn gốc ẩn
**Đáp án:** Sprite đạn ẩn → Nhân vật bắn → Đạn di chuyển → Trúng: broadcast + xóa

**Câu 9 (Nối đôi):** Nối sự kiện với phản ứng trong bắn đạn:
1. Nhấn Space — A. Broadcast "hit", xóa clone đạn
2. Đạn chạm kẻ thù — B. Tạo clone đạn từ vị trí nhân vật
3. Đạn ra ngoài màn hình — C. Kẻ thù phản ứng (trừ HP, +điểm)
4. Kẻ thù nhận "hit" — D. Xóa clone đạn lãng phí
**Đáp án: 1-B, 2-A, 3-D, 4-C**

**Câu 10 (Trắc nghiệm):** Muốn giới hạn tốc độ bắn (không bắn liên tục quá nhanh), dùng kỹ thuật nào?
A. Thêm "wait (0.3) seconds" sau khi tạo clone đạn
B. Giảm tốc độ clone đạn
C. Làm đạn nhỏ hơn
D. Không thể giới hạn trong Scratch
**Đáp án: A**

### BÀI TẬP THỰC HÀNH

**Bài 1:** Tạo project "Bắn đạn cơ bản" — Nhân vật di chuyển trái/phải, nhấn Space bắn đạn clone bay lên. 3 kẻ thù di chuyển qua lại ở trên. Đạn trúng kẻ thù: +10 điểm, kẻ thù ẩn 1 giây rồi xuất hiện lại.

**Bài 2:** Tạo project "Tower Defense mini" — Tháp tự động bắn về phía kẻ thù (point towards). Kẻ thù di chuyển theo đường thẳng. Mỗi kẻ thù cần 3 đạn để tiêu diệt (biến hp For this sprite only). Kẻ thù qua được -1 lives.

**Bài 3:** Tạo project "Bắn nhiều hướng" — Nhân vật xoay theo chuột (point towards mouse). Nhấn Space bắn theo hướng đang nhìn. Kẻ thù xuất hiện ngẫu nhiên 4 phía. Biến ammo=20, thu thập vật phẩm hồi đạn. Timer 60s.

---

## BUá»”I 13: VA CHáº M MÃ€U Sáº®C (TOUCHING COLOR)

### CÃ‚U Há»ŽI Ã”N Táº¬P

**CÃ¢u 1 (Tráº¯c nghiá»‡m):** Khá»‘i "touching color [mÃ u]?" dÃ¹ng Ä‘á»ƒ:
A. Äá»•i mÃ u sprite
B. Kiá»ƒm tra sprite cÃ³ Ä‘ang cháº¡m vÃ¹ng mÃ u Ä‘Ã³ khÃ´ng
C. TÃ´ mÃ u backdrop
D. Kiá»ƒm tra mÃ u sprite khÃ¡c
**ÄÃ¡p Ã¡n: B**

**CÃ¢u 2 (Tráº¯c nghiá»‡m):** Trong game platformer dÃ¹ng touching color, mÃ u nÃ o thÆ°á»ng dÃ¹ng cho "tÆ°á»ng" (khÃ´ng Ä‘i qua Ä‘Æ°á»£c)?
A. Äá»
B. VÃ ng
C. Xanh lÃ¡
D. TÃ¹y thiáº¿t káº¿, thÆ°á»ng chá»n mÃ u dá»… phÃ¢n biá»‡t
**ÄÃ¡p Ã¡n: D**

**CÃ¢u 3 (ÄÃºng/Sai):** Ká»¹ thuáº­t "touching color" giÃºp táº¡o va cháº¡m chÃ­nh xÃ¡c hÆ¡n so vá»›i "touching [sprite]?" trong má»™t sá»‘ trÆ°á»ng há»£p.
**ÄÃ¡p Ã¡n: ÄÃºng**

**CÃ¢u 4 (ÄÃºng/Sai):** MÃ u Ä‘Æ°á»£c chá»n trong khá»‘i "touching color" pháº£i Ä‘Æ°á»£c váº½ chÃ­nh xÃ¡c trÃªn backdrop hoáº·c sprite.
**ÄÃ¡p Ã¡n: ÄÃºng**

**CÃ¢u 5 (Äiá»n tá»«):** Khi nhÃ¢n váº­t cháº¡m vÃ o tÆ°á»ng mÃ u xanh, ta "Ä‘áº©y ngÆ°á»£c" báº±ng cÃ¡ch di chuyá»ƒn nhÃ¢n váº­t vá» ___ vá»«a Ä‘á»§ Ä‘á»ƒ thoÃ¡t khá»i tÆ°á»ng.
**ÄÃ¡p Ã¡n: hÆ°á»›ng ngÆ°á»£c láº¡i / phÃ­a sau**

**CÃ¢u 6 (Äiá»n tá»«):** Trong game cÃ³ 3 loáº¡i mÃ u: xanh=tÆ°á»ng, Ä‘á»=báº«y, vÃ ng=cá»­a tháº¯ng. Khi cháº¡m mÃ u Ä‘á», ta ___ 1 máº¡ng vÃ  reset vá»‹ trÃ­ nhÃ¢n váº­t.
**ÄÃ¡p Ã¡n: trá»« / change lives by -1**

**CÃ¢u 7 (KÃ©o tháº£ tá»«):** Äiá»n Ä‘á»ƒ xá»­ lÃ½ va cháº¡m mÃ u:
if (touching color [xanh]?) then ___ (Ä‘áº©y ngÆ°á»£c)
if (touching color [Ä‘á»]?) then change [lives] ___ (-1)
if (touching color [vÃ ng]?) then ___ "win"
NgÃ¢n hÃ ng tá»«: **move -5 steps / by / broadcast / set**
**ÄÃ¡p Ã¡n: move -5 steps / by / broadcast**

**CÃ¢u 8 (Sáº¯p xáº¿p):** Sáº¯p xáº¿p bÆ°á»›c xÃ¢y dá»±ng maze game dÃ¹ng touching color:
- [ ] Kiá»ƒm tra if touching color [xanh] â†’ Ä‘áº©y ngÆ°á»£c
- [ ] Váº½ maze trÃªn backdrop vá»›i mÃ u xanh cho tÆ°á»ng, vÃ ng cho Ä‘Ã­ch
- [ ] NhÃ¢n váº­t di chuyá»ƒn báº±ng phÃ­m mÅ©i tÃªn
- [ ] Kiá»ƒm tra if touching color [vÃ ng] â†’ tháº¯ng
**ÄÃ¡p Ã¡n:** Váº½ maze â†’ NhÃ¢n váº­t di chuyá»ƒn â†’ Kiá»ƒm tra tÆ°á»ng â†’ Kiá»ƒm tra Ä‘Ã­ch

**CÃ¢u 9 (Ná»‘i Ä‘Ã´i):** Ná»‘i mÃ u vá»›i tÃ¡c Ä‘á»™ng trong maze game:
1. MÃ u xanh â€” A. Cá»­a tháº¯ng, káº¿t thÃºc level
2. MÃ u Ä‘á» â€” B. TÆ°á»ng, khÃ´ng Ä‘i qua Ä‘Æ°á»£c
3. MÃ u vÃ ng â€” C. Báº«y, máº¥t máº¡ng
4. MÃ u tráº¯ng â€” D. ÄÆ°á»ng Ä‘i bÃ¬nh thÆ°á»ng
**ÄÃ¡p Ã¡n: 1-B, 2-C, 3-A, 4-D**

**CÃ¢u 10 (Tráº¯c nghiá»‡m):** Äá»ƒ kiá»ƒm tra nhÃ¢n váº­t Ä‘ang Ä‘á»©ng trÃªn sÃ n (touching color sÃ n nÃ¢u), pháº§n nÃ o cá»§a sprite cáº§n cháº¡m mÃ u nÃ¢u?
A. Pháº§n Ä‘áº§u sprite
B. Pháº§n chÃ¢n/Ä‘Ã¡y sprite
C. Pháº§n giá»¯a sprite
D. ToÃ n bá»™ sprite
**ÄÃ¡p Ã¡n: B**

### BÃ€I Táº¬P THá»°C HÃ€NH

**BÃ i 1:** Táº¡o project "MÃª cung mÃ u sáº¯c" â€” Váº½ maze trÃªn backdrop: tÆ°á»ng xanh, Ä‘Ã­ch vÃ ng. NhÃ¢n váº­t di chuyá»ƒn 4 hÆ°á»›ng. Cháº¡m tÆ°á»ng: Ä‘áº©y ngÆ°á»£c. Cháº¡m Ä‘Ã­ch: "You Win!" vÃ  Ä‘áº¿m thá»i gian hoÃ n thÃ nh.

**BÃ i 2:** Táº¡o project "Ná»n nguy hiá»ƒm" â€” Backdrop cÃ³ 3 loáº¡i ná»n: xanh lÃ¡ (an toÃ n), Ä‘á» (báº«y -1 máº¡ng), xanh nÆ°á»›c (lÃ m cháº­m 50%). NhÃ¢n váº­t di chuyá»ƒn, kiá»ƒm tra touching color vÃ  pháº£n á»©ng tÆ°Æ¡ng á»©ng. Lives=3.

**BÃ i 3:** Táº¡o project "Platformer cÆ¡ báº£n" â€” NhÃ¢n váº­t cÃ³ trá»ng lá»±c Ä‘Æ¡n giáº£n. Ná»n sÃ n mÃ u nÃ¢u (touching color â†’ Ä‘á»©ng Ä‘Æ°á»£c). Ná»n báº«y mÃ u Ä‘á» (touching color â†’ máº¥t máº¡ng). Cá»­a mÃ u vÃ ng (touching color â†’ sang level tiáº¿p). 2 level.

---

## BUá»”I 14: TRá»ŒNG Lá»°C (GRAVITY SIMULATION)

### CÃ‚U Há»ŽI Ã”N Táº¬P

**CÃ¢u 1 (Tráº¯c nghiá»‡m):** Biáº¿n nÃ o thÆ°á»ng dÃ¹ng Ä‘á»ƒ mÃ´ phá»ng tá»‘c Ä‘á»™ rÆ¡i dá»c trong há»‡ thá»‘ng trá»ng lá»±c?
A. speed
B. vy (velocity y)
C. gravity
D. fall
**ÄÃ¡p Ã¡n: B**

**CÃ¢u 2 (Tráº¯c nghiá»‡m):** Äá»ƒ mÃ´ phá»ng trá»ng lá»±c, má»—i frame cáº§n lÃ m gÃ¬ vá»›i biáº¿n vy?
A. set vy to (0)
B. change vy by (-1) Ä‘á»ƒ vy giáº£m dáº§n (rÆ¡i nhanh hÆ¡n)
C. change vy by (1) Ä‘á»ƒ bay lÃªn
D. vy khÃ´ng thay Ä‘á»•i
**ÄÃ¡p Ã¡n: B**

**CÃ¢u 3 (ÄÃºng/Sai):** Khi nhÃ¢n váº­t cháº¡m sÃ n (touching color sÃ n), cáº§n set vy to (0) Ä‘á»ƒ khÃ´ng rÆ¡i xuyÃªn sÃ n.
**ÄÃ¡p Ã¡n: ÄÃºng**

**CÃ¢u 4 (ÄÃºng/Sai):** Äá»ƒ nháº£y, ta set vy vá» má»™t giÃ¡ trá»‹ Ã¢m lá»›n (vÃ­ dá»¥ -15) Ä‘á»ƒ nhÃ¢n váº­t bay lÃªn.
**ÄÃ¡p Ã¡n: Sai** (Äá»ƒ nháº£y lÃªn cáº§n set vy vá» giÃ¡ trá»‹ DÆ¯Æ NG lá»›n, vÃ¬ y tÄƒng thÃ¬ lÃªn cao)

**CÃ¢u 5 (Äiá»n tá»«):** Má»—i frame, nhÃ¢n váº­t di chuyá»ƒn theo chiá»u dá»c: change y by (___). GiÃ¡ trá»‹ vy Ã¢m â†’ rÆ¡i xuá»‘ng, dÆ°Æ¡ng â†’ bay lÃªn.
**ÄÃ¡p Ã¡n: vy**

**CÃ¢u 6 (Äiá»n tá»«):** Äiá»u kiá»‡n cho phÃ©p nháº£y: chá»‰ nháº£y Ä‘Æ°á»£c khi Ä‘ang ___ sÃ n, khÃ´ng cho nháº£y Ä‘Ã´i.
**ÄÃ¡p Ã¡n: Ä‘á»©ng trÃªn / touching color sÃ n**

**CÃ¢u 7 (KÃ©o tháº£ tá»«):** Äiá»n Ä‘á»ƒ táº¡o há»‡ thá»‘ng trá»ng lá»±c:
forever:
  change [vy] ___ (-1)
  change y ___ (vy)
  if (touching color [nÃ¢u]?) then
    set [vy] ___ (0)
    ___ until not (touching color [nÃ¢u]?)
NgÃ¢n hÃ ng tá»«: **by / by / to / repeat**
**ÄÃ¡p Ã¡n: by / by / to / repeat**

**CÃ¢u 8 (Sáº¯p xáº¿p):** Sáº¯p xáº¿p logic há»‡ thá»‘ng nháº£y cÃ³ trá»ng lá»±c:
- [ ] NhÃ¢n váº­t di chuyá»ƒn change y by (vy)
- [ ] Kiá»ƒm tra if touching color sÃ n â†’ set vy to 0, Ä‘áº©y lÃªn
- [ ] Má»—i frame: change vy by (-1)
- [ ] Khi nháº¥n Space vÃ  Ä‘ang Ä‘á»©ng sÃ n: set vy to (10)
**ÄÃ¡p Ã¡n:** Má»—i frame change vy by -1 â†’ Change y by vy â†’ Kiá»ƒm tra sÃ n â†’ Nháº¥n Space nháº£y

**CÃ¢u 9 (Ná»‘i Ä‘Ã´i):** Ná»‘i tráº¡ng thÃ¡i vá»›i giÃ¡ trá»‹ vy:
1. Äang rÆ¡i tá»± do â€” A. vy > 0 vÃ  tÄƒng
2. Vá»«a nháº£y lÃªn â€” B. vy = 0
3. Äá»©ng trÃªn sÃ n â€” C. vy < 0 vÃ  giáº£m dáº§n
4. Äang rÆ¡i vÃ  vy nhá» dáº§n â€” D. vy dÆ°Æ¡ng lá»›n (vd: 10)
**ÄÃ¡p Ã¡n: 1-C, 2-D, 3-B, 4-C** â†’ cháº¥p nháº­n: 1-C, 2-D, 3-B

**CÃ¢u 10 (Tráº¯c nghiá»‡m):** Váº¥n Ä‘á» gÃ¬ xáº£y ra náº¿u khÃ´ng Ä‘áº·t Ä‘iá»u kiá»‡n "Ä‘ang Ä‘á»©ng sÃ n" trÆ°á»›c khi cho phÃ©p nháº£y?
A. NhÃ¢n váº­t bay lÃªn vÃ´ háº¡n
B. NhÃ¢n váº­t cÃ³ thá»ƒ nháº£y nhiá»u láº§n trÃªn khÃ´ng (double/triple jump)
C. NhÃ¢n váº­t khÃ´ng nháº£y Ä‘Æ°á»£c
D. Trá»ng lá»±c bá»‹ vÃ´ hiá»‡u
**ÄÃ¡p Ã¡n: B**

### BÃ€I Táº¬P THá»°C HÃ€NH

**BÃ i 1:** Táº¡o project "Nháº£y cÆ¡ báº£n" â€” NhÃ¢n váº­t cÃ³ trá»ng lá»±c (vy giáº£m 1 má»—i frame). SÃ n mÃ u nÃ¢u (touching color â†’ set vy=0). Nháº¥n Space khi Ä‘á»©ng sÃ n â†’ vy=10 (nháº£y lÃªn). Di chuyá»ƒn trÃ¡i/pháº£i báº±ng phÃ­m mÅ©i tÃªn.

**BÃ i 2:** Táº¡o project "Thu tháº­p trÃªn khÃ´ng" â€” Platformer vá»›i nhiá»u bá»‡ (platform) mÃ u nÃ¢u á»Ÿ Ä‘á»™ cao khÃ¡c nhau. Váº­t pháº©m Ä‘áº·t trÃªn cÃ¡c bá»‡. NhÃ¢n váº­t nháº£y thu tháº­p. Báº«y mÃ u Ä‘á» á»Ÿ dÆ°á»›i (-1 máº¡ng). 3 máº¡ng, 10 váº­t pháº©m Ä‘á»ƒ tháº¯ng.

**BÃ i 3:** Táº¡o project "Trá»‘n thoÃ¡t" â€” Platformer cÃ³ timer 60 giÃ¢y. NhÃ¢n váº­t cáº§n Ä‘áº¿n cá»­a mÃ u vÃ ng trÆ°á»›c khi háº¿t giá». ChÆ°á»›ng ngáº¡i váº­t di chuyá»ƒn theo Ä‘Æ°á»ng ngang. CÃ³ trá»ng lá»±c Ä‘áº§y Ä‘á»§. 3 máº¡ng. Náº¿u háº¿t giá» hoáº·c háº¿t máº¡ng â†’ game over.

---

## BUá»”I 15: UI MÃ€N HÃŒNH (START/GAME OVER/WIN)

### CÃ‚U Há»ŽI Ã”N Táº¬P

**CÃ¢u 1 (Tráº¯c nghiá»‡m):** Sprite "nÃºt Start" nÃªn áº©n Ä‘i khi nÃ o?
A. Ngay khi dá»± Ã¡n má»Ÿ
B. Khi ngÆ°á»i chÆ¡i nháº¥n vÃ o nÃºt vÃ  game báº¯t Ä‘áº§u
C. Khi game over
D. KhÃ´ng cáº§n áº©n
**ÄÃ¡p Ã¡n: B**

**CÃ¢u 2 (Tráº¯c nghiá»‡m):** Khi ngÆ°á»i chÆ¡i nháº¥n "ChÆ¡i láº¡i" tá»« mÃ n game over, thá»© tá»± hÃ nh Ä‘á»™ng nÃ o Ä‘Ãºng?
A. Reset biáº¿n â†’ switch backdrop â†’ báº¯t Ä‘áº§u game
B. Switch backdrop â†’ reset biáº¿n â†’ báº¯t Ä‘áº§u game
C. Thá»© tá»± khÃ´ng quan trá»ng
D. Chá»‰ cáº§n switch backdrop lÃ  Ä‘á»§
**ÄÃ¡p Ã¡n: A**

**CÃ¢u 3 (ÄÃºng/Sai):** CÃ³ thá»ƒ dÃ¹ng "broadcast" Ä‘á»ƒ thÃ´ng bÃ¡o cho táº¥t cáº£ sprite biáº¿t game Ä‘Ã£ báº¯t Ä‘áº§u.
**ÄÃ¡p Ã¡n: ÄÃºng**

**CÃ¢u 4 (ÄÃºng/Sai):** MÃ n hÃ¬nh win vÃ  game over cÃ³ thá»ƒ dÃ¹ng cÃ¹ng má»™t backdrop náº¿u hiá»ƒn thá»‹ thÃ´ng bÃ¡o khÃ¡c nhau.
**ÄÃ¡p Ã¡n: ÄÃºng**

**CÃ¢u 5 (Äiá»n tá»«):** Khi nháº¥n cá» xanh, luÃ´n pháº£i switch backdrop to [___] Ä‘á»ƒ Ä‘áº£m báº£o game báº¯t Ä‘áº§u tá»« mÃ n hÃ¬nh Ä‘Ãºng.
**ÄÃ¡p Ã¡n: start (hoáº·c tÃªn backdrop mÃ n Ä‘áº§u)**

**CÃ¢u 6 (Äiá»n tá»«):** Sprite hiá»ƒn thá»‹ Ä‘iá»ƒm cuá»‘i á»Ÿ mÃ n game over nÃªn dÃ¹ng khá»‘i ___ Ä‘á»ƒ nÃ³i giÃ¡ trá»‹ biáº¿n score.
**ÄÃ¡p Ã¡n: say (join "Äiá»ƒm cá»§a báº¡n: " (score))**

**CÃ¢u 7 (KÃ©o tháº£ tá»«):** Äiá»n Ä‘á»ƒ xÃ¢y dá»±ng nÃºt "ChÆ¡i láº¡i":
when this sprite clicked:
  ___ [score] to (0)
  ___ [lives] to (3)
  ___ [time] to (30)
  ___ backdrop to [game]
NgÃ¢n hÃ ng tá»«: **set / switch / change / reset**
**ÄÃ¡p Ã¡n: set / set / set / switch**

**CÃ¢u 8 (Sáº¯p xáº¿p):** Sáº¯p xáº¿p cÃ¡c sá»± kiá»‡n khi game káº¿t thÃºc (thua):
- [ ] CÃ¡c sprite gameplay áº©n Ä‘i
- [ ] lives = 0 hoáº·c time = 0
- [ ] Switch backdrop to [game_over]
- [ ] Sprite thÃ´ng bÃ¡o hiá»‡n ra vÃ  nÃ³i Ä‘iá»ƒm sá»‘
**ÄÃ¡p Ã¡n:** lives=0 hoáº·c time=0 â†’ Switch backdrop game_over â†’ Sprite gameplay áº©n â†’ Sprite thÃ´ng bÃ¡o hiá»‡n vÃ  nÃ³i Ä‘iá»ƒm

**CÃ¢u 9 (Ná»‘i Ä‘Ã´i):** Ná»‘i backdrop vá»›i thá»i Ä‘iá»ƒm hiá»ƒn thá»‹:
1. Backdrop "start" â€” A. Khi ngÆ°á»i chÆ¡i Ä‘áº¡t má»¥c tiÃªu
2. Backdrop "game" â€” B. Khi má»Ÿ game, trÆ°á»›c khi báº¯t Ä‘áº§u
3. Backdrop "game_over" â€” C. Khi Ä‘ang chÆ¡i chÃ­nh
4. Backdrop "win" â€” D. Khi háº¿t máº¡ng hoáº·c háº¿t giá»
**ÄÃ¡p Ã¡n: 1-B, 2-C, 3-D, 4-A**

**CÃ¢u 10 (Tráº¯c nghiá»‡m):** CÃ¡ch hiá»ƒn thá»‹ Ä‘iá»ƒm trÃªn mÃ n game over trong Scratch:
A. Sprite nÃ³i: say (join "Score: " (score))
B. Tá»± Ä‘á»™ng hiá»ƒn thá»‹ vÃ¬ score lÃ  biáº¿n global
C. Cáº§n táº¡o biáº¿n má»›i "final_score"
D. KhÃ´ng thá»ƒ hiá»ƒn thá»‹ Ä‘iá»ƒm trÃªn mÃ n game over
**ÄÃ¡p Ã¡n: A** (vÃ  B cÅ©ng Ä‘Ãºng náº¿u biáº¿n score Ä‘Æ°á»£c show)

### BÃ€I Táº¬P THá»°C HÃ€NH

**BÃ i 1:** Táº¡o project "UI Ä‘áº§y Ä‘á»§" â€” Game thu tháº­p Ä‘Æ¡n giáº£n nhÆ°ng cÃ³ Ä‘áº§y Ä‘á»§ 4 mÃ n hÃ¬nh: start (nÃºt Start), game (gameplay), game_over (nÃºt ChÆ¡i láº¡i + Ä‘iá»ƒm), win (nÃºt ChÆ¡i láº¡i). Sprite khÃ¡c nhau hiá»‡n/áº©n theo backdrop.

**BÃ i 2:** Táº¡o project "Countdown báº¯t Ä‘áº§u" â€” TrÆ°á»›c khi game báº¯t Ä‘áº§u, thÃªm mÃ n "get_ready" Ä‘áº¿m ngÆ°á»£c 3-2-1 rá»“i tá»± chuyá»ƒn sang game. Sprite sá»‘ Ä‘áº¿m xuáº¥t hiá»‡n á»Ÿ giá»¯a mÃ n hÃ¬nh. Sau Ä‘Ã³ game chÆ¡i bÃ¬nh thÆ°á»ng.

**BÃ i 3:** Táº¡o project "High Score" â€” ThÃªm biáº¿n "high_score" vÃ o game hiá»‡n cÃ³. Khi game over: náº¿u score > high_score thÃ¬ cáº­p nháº­t high_score vÃ  thÃ´ng bÃ¡o "Ká»· lá»¥c má»›i!". MÃ n game over hiá»ƒn thá»‹ cáº£ score hiá»‡n táº¡i láº«n high_score.

---

## BUá»”I 16: Há»† THá»NG LEVEL

### CÃ‚U Há»ŽI Ã”N Táº¬P

**CÃ¢u 1 (Tráº¯c nghiá»‡m):** Biáº¿n nÃ o dÃ¹ng Ä‘á»ƒ lÆ°u level hiá»‡n táº¡i trong game cÃ³ nhiá»u mÃ n chÆ¡i?
A. score
B. stage
C. level
D. Cáº£ B vÃ  C Ä‘á»u dÃ¹ng Ä‘Æ°á»£c
**ÄÃ¡p Ã¡n: D**

**CÃ¢u 2 (Tráº¯c nghiá»‡m):** Äiá»u kiá»‡n Ä‘á»ƒ chuyá»ƒn sang level tiáº¿p theo thÆ°á»ng lÃ :
A. Háº¿t thá»i gian
B. Äáº¡t Ä‘á»§ Ä‘iá»ƒm quy Ä‘á»‹nh hoáº·c hoÃ n thÃ nh má»¥c tiÃªu cá»§a level
C. Nháº¥n phÃ­m Enter
D. Bá»‹ cháº¿t má»™t láº§n
**ÄÃ¡p Ã¡n: B**

**CÃ¢u 3 (ÄÃºng/Sai):** Má»—i level cÃ³ thá»ƒ dÃ¹ng má»™t backdrop khÃ¡c nhau Ä‘á»ƒ táº¡o cáº£m giÃ¡c tiáº¿n Ä‘á»™.
**ÄÃ¡p Ã¡n: ÄÃºng**

**CÃ¢u 4 (ÄÃºng/Sai):** Khi sang level má»›i, khÃ´ng cáº§n reset vá»‹ trÃ­ nhÃ¢n váº­t.
**ÄÃ¡p Ã¡n: Sai** (NÃªn reset vá»‹ trÃ­ nhÃ¢n váº­t vá» Ä‘iá»ƒm xuáº¥t phÃ¡t)

**CÃ¢u 5 (Äiá»n tá»«):** Khi biáº¿n level > 3 (game cÃ³ 3 level), chuyá»ƒn sang mÃ n ___ Ä‘á»ƒ thÃ´ng bÃ¡o chiáº¿n tháº¯ng.
**ÄÃ¡p Ã¡n: win / chiáº¿n tháº¯ng**

**CÃ¢u 6 (Äiá»n tá»«):** Lá»‡nh chuyá»ƒn backdrop theo sá»‘ level: switch backdrop to (join "level" (___)).
**ÄÃ¡p Ã¡n: level**

**CÃ¢u 7 (KÃ©o tháº£ tá»«):** Äiá»n Ä‘á»ƒ táº¡o há»‡ thá»‘ng chuyá»ƒn level:
if (score >= ___ * 50) then
  change [level] ___ (1)
  ___ backdrop to (join "level" (level))
  ___ [score] to (0)
NgÃ¢n hÃ ng tá»«: **level / by / switch / set**
**ÄÃ¡p Ã¡n: level / by / switch / set**

**CÃ¢u 8 (Sáº¯p xáº¿p):** Sáº¯p xáº¿p logic chuyá»ƒn level:
- [ ] Switch backdrop theo level má»›i
- [ ] Kiá»ƒm tra if Ä‘iá»u kiá»‡n tháº¯ng level (score Ä‘á»§)
- [ ] Change level by 1
- [ ] Reset vá»‹ trÃ­ nhÃ¢n váº­t vÃ  cÃ¡c biáº¿n cáº§n thiáº¿t
- [ ] Kiá»ƒm tra if level > max thÃ¬ chuyá»ƒn mÃ n win
**ÄÃ¡p Ã¡n:** Kiá»ƒm tra Ä‘iá»u kiá»‡n â†’ Change level+1 â†’ Kiá»ƒm tra level>max â†’ Switch backdrop â†’ Reset vá»‹ trÃ­

**CÃ¢u 9 (Ná»‘i Ä‘Ã´i):** Ná»‘i sá»± kiá»‡n vá»›i hÃ nh Ä‘á»™ng trong há»‡ thá»‘ng level:
1. Äáº¡t Ä‘á»§ Ä‘iá»ƒm level â€” A. Chuyá»ƒn mÃ n win
2. level > 3 (max) â€” B. Game over
3. lives = 0 trong level â€” C. Change level by 1, switch backdrop
4. Cháº¡m cá»­a mÃ u vÃ ng â€” D. Chuyá»ƒn level tiáº¿p
**ÄÃ¡p Ã¡n: 1-C, 2-A, 3-B, 4-D**

**CÃ¢u 10 (Tráº¯c nghiá»‡m):** CÃ¡ch tÄƒng Ä‘á»™ khÃ³ theo level, vÃ­ dá»¥ tá»‘c Ä‘á»™ káº» thÃ¹ tÄƒng:
A. set speed to (level * 2)
B. set speed to (pick random 1 to level)
C. Cáº£ A vÃ  B Ä‘á»u há»£p lÃ½
D. KhÃ´ng thá»ƒ thay Ä‘á»•i theo level
**ÄÃ¡p Ã¡n: C**

### BÃ€I Táº¬P THá»°C HÃ€NH

**BÃ i 1:** Táº¡o project "3 Level cÆ¡ báº£n" â€” Game thu tháº­p cÃ³ 3 level. Má»—i level cáº§n thu Ä‘á»§ 5 váº­t pháº©m Ä‘á»ƒ qua. Level 1: váº­t pháº©m cháº­m, Level 2: nhanh hÆ¡n, Level 3: nhanh nháº¥t. Má»—i level backdrop khÃ¡c nhau.

**BÃ i 2:** Táº¡o project "Level vá»›i timer riÃªng" â€” Má»—i level cÃ³ timer 30 giÃ¢y. Háº¿t giá» â†’ game over. Qua level (thu Ä‘á»§ má»¥c tiÃªu) â†’ timer reset vá» 30 cho level má»›i. 3 level. Level 3 â†’ win.

**BÃ i 3:** Táº¡o project "Platformer Ä‘a level" â€” Platformer 3 level vá»›i backdrop khÃ¡c nhau. Cháº¡m cá»­a vÃ ng â†’ sang level tiáº¿p. Lives dÃ¹ng chung giá»¯a cÃ¡c level. Level 4 â†’ mÃ n chiáº¿n tháº¯ng. Hiá»ƒn thá»‹ sá»‘ level hiá»‡n táº¡i.

---

## BUá»”I 17: THIáº¾T Káº¾ LEVEL (LEVEL DESIGN)

### CÃ‚U Há»ŽI Ã”N Táº¬P

**CÃ¢u 1 (Tráº¯c nghiá»‡m):** NguyÃªn táº¯c nÃ o quan trá»ng nháº¥t khi thiáº¿t káº¿ level Ä‘áº§u tiÃªn cá»§a game?
A. CÃ ng khÃ³ cÃ ng tá»‘t Ä‘á»ƒ thá»­ thÃ¡ch ngÆ°á»i chÆ¡i
B. Dá»… Ä‘á»ƒ ngÆ°á»i chÆ¡i há»c cÆ¡ cháº¿, dáº§n tÄƒng Ä‘á»™ khÃ³
C. Ngáº«u nhiÃªn hoÃ n toÃ n
D. Copy level tá»« game khÃ¡c
**ÄÃ¡p Ã¡n: B**

**CÃ¢u 2 (Tráº¯c nghiá»‡m):** Trong Scratch, Ä‘á»ƒ táº¡o backdrop má»›i cho level, ta dÃ¹ng:
A. ThÃªm sprite má»›i
B. Paint editor trong tab Backdrops
C. Import áº£nh tá»« thÆ° viá»‡n
D. Cáº£ B vÃ  C Ä‘á»u Ä‘Æ°á»£c
**ÄÃ¡p Ã¡n: D**

**CÃ¢u 3 (ÄÃºng/Sai):** Äá»ƒ táº¡o level 2 tá»« level 1 (chá»‰ thay Ä‘á»•i má»™t pháº§n), cÃ³ thá»ƒ duplicate backdrop rá»“i chá»‰nh sá»­a.
**ÄÃ¡p Ã¡n: ÄÃºng**

**CÃ¢u 4 (ÄÃºng/Sai):** Level cuá»‘i (boss level) nÃªn dá»… nháº¥t Ä‘á»ƒ táº¡o cáº£m giÃ¡c hoÃ n thÃ nh.
**ÄÃ¡p Ã¡n: Sai** (Level cuá»‘i thÆ°á»ng khÃ³ nháº¥t)

**CÃ¢u 5 (Äiá»n tá»«):** Khi thiáº¿t káº¿ maze, nÃªn váº½ tÆ°á»ng báº±ng mÃ u ___ cá»¥ thá»ƒ Ä‘á»ƒ cÃ³ thá»ƒ dÃ¹ng khá»‘i "touching color" kiá»ƒm tra va cháº¡m.
**ÄÃ¡p Ã¡n: má»™t mÃ u nháº¥t quÃ¡n (xanh, nÃ¢u, hoáº·c mÃ u báº¥t ká»³)**

**CÃ¢u 6 (Äiá»n tá»«):** NguyÃªn táº¯c "Ä‘Æ°á»ng dáº«n thá»‹ giÃ¡c" trong thiáº¿t káº¿ level: Ä‘áº·t váº­t pháº©m theo ___ Ä‘á»ƒ hÆ°á»›ng ngÆ°á»i chÆ¡i Ä‘áº¿n Ä‘Ã­ch.
**ÄÃ¡p Ã¡n: Ä‘Æ°á»ng / hÃ ng / hÆ°á»›ng**

**CÃ¢u 7 (KÃ©o tháº£ tá»«):** Äiá»n cÃ¡c yáº¿u tá»‘ thiáº¿t káº¿ level tá»‘t:
- Level 1: ___ Ä‘á»™ khÃ³, dáº¡y cÆ¡ cháº¿
- Level 2: ___ Ä‘á»™ khÃ³ vá»«a pháº£i
- Level 3: ___ thá»­ thÃ¡ch tá»‘i Ä‘a
- Má»—i level: cÃ³ ___ rÃµ rÃ ng vÃ  pháº§n thÆ°á»Ÿng khi hoÃ n thÃ nh
NgÃ¢n hÃ ng tá»«: **tháº¥p / trung bÃ¬nh / cao / má»¥c tiÃªu**
**ÄÃ¡p Ã¡n: tháº¥p / trung bÃ¬nh / cao / má»¥c tiÃªu**

**CÃ¢u 8 (Sáº¯p xáº¿p):** Sáº¯p xáº¿p quy trÃ¬nh thiáº¿t káº¿ má»™t level:
- [ ] Test vÃ  Ä‘iá»u chá»‰nh (quÃ¡ khÃ³/dá»…?)
- [ ] XÃ¡c Ä‘á»‹nh má»¥c tiÃªu cá»§a level
- [ ] Váº½ backdrop vÃ  Ä‘áº·t váº­t pháº©m/káº» thÃ¹
- [ ] LÃªn phÃ¡c tháº£o bá»‘ cá»¥c trÃªn giáº¥y
**ÄÃ¡p Ã¡n:** XÃ¡c Ä‘á»‹nh má»¥c tiÃªu â†’ PhÃ¡c tháº£o â†’ Váº½ backdrop â†’ Test vÃ  Ä‘iá»u chá»‰nh

**CÃ¢u 9 (Ná»‘i Ä‘Ã´i):** Ná»‘i yáº¿u tá»‘ vá»›i vá»‹ trÃ­ há»£p lÃ½ trong game:
1. Tutorial cÆ¡ báº£n â€” A. Gáº§n cuá»‘i game
2. Káº» thÃ¹ boss â€” B. Level Ä‘áº§u tiÃªn
3. Váº­t pháº©m há»“i phá»¥c â€” C. Ngay trÆ°á»›c khu vá»±c nguy hiá»ƒm
4. ChÆ°á»›ng ngáº¡i váº­t phá»©c táº¡p â€” D. CÃ¡c level sau
**ÄÃ¡p Ã¡n: 1-B, 2-A, 3-C, 4-D**

**CÃ¢u 10 (Tráº¯c nghiá»‡m):** "Curve of difficulty" (Ä‘Æ°á»ng cong Ä‘á»™ khÃ³) trong game design cÃ³ nghÄ©a lÃ :
A. Äá»™ khÃ³ tÄƒng Ä‘á»u tá»« Ä‘áº§u Ä‘áº¿n cuá»‘i
B. Äá»™ khÃ³ tÄƒng dáº§n nhÆ°ng cÃ³ nhá»¯ng Ä‘iá»ƒm dá»… thá»Ÿ (sau boss, sau thá»­ thÃ¡ch khÃ³)
C. Äá»™ khÃ³ giáº£m dáº§n cuá»‘i game
D. Äá»™ khÃ³ ngáº«u nhiÃªn
**ÄÃ¡p Ã¡n: B**

### BÃ€I Táº¬P THá»°C HÃ€NH

**BÃ i 1:** Táº¡o project "Thiáº¿t káº¿ 3 maze" â€” Váº½ 3 backdrop maze cÃ³ Ä‘á»™ phá»©c táº¡p tÄƒng dáº§n. Maze 1: Ä‘Æ°á»ng tháº³ng Ä‘Æ¡n giáº£n. Maze 2: cÃ³ nhÃ¡nh ráº½. Maze 3: nhiá»u ngÃ£ ráº½ vÃ  báº«y. NhÃ¢n váº­t cháº¡y qua cáº£ 3.

**BÃ i 2:** Táº¡o project "Platform 3 mÃ n" â€” Thiáº¿t káº¿ 3 level platformer: Level 1 cÃ³ 3 bá»‡ nháº£y, váº­t pháº©m dá»… láº¥y. Level 2 cÃ³ 5 bá»‡, káº» thÃ¹ di chuyá»ƒn cháº­m. Level 3 cÃ³ bá»‡ háº¹p hÆ¡n, káº» thÃ¹ nhanh hÆ¡n. Ãp dá»¥ng nguyÃªn táº¯c tÄƒng dáº§n.

**BÃ i 3:** Táº¡o project "Game thiáº¿t káº¿ hoÃ n chá»‰nh" â€” Thiáº¿t káº¿ game vá»›i Ä‘áº§y Ä‘á»§: 3 level backdrop khÃ¡c nhau theo chá»§ Ä‘á» (rá»«ng â†’ thÃ nh phá»‘ â†’ khÃ´ng gian), Ä‘á»™ khÃ³ tÄƒng dáº§n, cÃ³ yáº¿u tá»‘ dáº«n dáº¯t thá»‹ giÃ¡c (váº­t pháº©m theo hÃ ng chá»‰ hÆ°á»›ng). Viáº¿t chÃº thÃ­ch ngáº¯n vá» thiáº¿t káº¿ trong má»—i level.

---

## BUá»”I 18: DANH SÃCH (LISTS)

### CÃ‚U Há»ŽI Ã”N Táº¬P

**CÃ¢u 1 (Tráº¯c nghiá»‡m):** List (danh sÃ¡ch) trong Scratch dÃ¹ng Ä‘á»ƒ:
A. LÆ°u nhiá»u giÃ¡ trá»‹ trong má»™t biáº¿n duy nháº¥t
B. Liá»‡t kÃª cÃ¡c sprite
C. Hiá»ƒn thá»‹ backdrop theo thá»© tá»±
D. Táº¡o hiá»‡u á»©ng cuá»™n
**ÄÃ¡p Ã¡n: A**

**CÃ¢u 2 (Tráº¯c nghiá»‡m):** Khá»‘i lá»‡nh nÃ o thÃªm má»™t pháº§n tá»­ vÃ o cuá»‘i list?
A. insert (giÃ¡ trá»‹) at (1) of [list]
B. add (giÃ¡ trá»‹) to [list]
C. replace item (1) of [list] with (giÃ¡ trá»‹)
D. set [list] to (giÃ¡ trá»‹)
**ÄÃ¡p Ã¡n: B**

**CÃ¢u 3 (ÄÃºng/Sai):** Äá»ƒ láº¥y pháº§n tá»­ thá»© 3 trong list, dÃ¹ng khá»‘i "item (3) of [list]".
**ÄÃ¡p Ã¡n: ÄÃºng**

**CÃ¢u 4 (ÄÃºng/Sai):** Khá»‘i "length of [list]" tráº£ vá» sá»‘ pháº§n tá»­ hiá»‡n cÃ³ trong list.
**ÄÃ¡p Ã¡n: ÄÃºng**

**CÃ¢u 5 (Äiá»n tá»«):** Äá»ƒ xÃ³a táº¥t cáº£ pháº§n tá»­ trong list, dÃ¹ng khá»‘i ___ all of [list].
**ÄÃ¡p Ã¡n: delete**

**CÃ¢u 6 (Äiá»n tá»«):** Trong game quiz dÃ¹ng list, cÃ¢u há»i lÆ°u trong list "questions", Ä‘Ã¡p Ã¡n lÆ°u trong list "answers". DÃ¹ng biáº¿n ___ Ä‘á»ƒ theo dÃµi Ä‘ang á»Ÿ cÃ¢u há»i thá»© máº¥y.
**ÄÃ¡p Ã¡n: current_question (hoáº·c index / i)**

**CÃ¢u 7 (KÃ©o tháº£ tá»«):** Äiá»n Ä‘á»ƒ táº¡o quiz game vá»›i list:
add "Scratch do hÃ£ng nÃ o táº¡o ra?" to [questions]
add "MIT" to [answers]
say (item (___ of [questions])) for 3 seconds
if (answer = item (___ of [answers])) then change [score] by (10)
NgÃ¢n hÃ ng tá»«: **i / i / 1 / length**
**ÄÃ¡p Ã¡n: i / i**

**CÃ¢u 8 (Sáº¯p xáº¿p):** Sáº¯p xáº¿p bÆ°á»›c táº¡o quiz game vá»›i list:
- [ ] DÃ¹ng biáº¿n i Ä‘á»ƒ láº§n lÆ°á»£t há»i tá»«ng cÃ¢u
- [ ] ThÃªm cÃ¢u há»i vÃ o list "questions" vÃ  Ä‘Ã¡p Ã¡n vÃ o list "answers"
- [ ] Kiá»ƒm tra Ä‘Ã¡p Ã¡n vÃ  cá»™ng Ä‘iá»ƒm
- [ ] Táº¡o 2 list: "questions" vÃ  "answers"
**ÄÃ¡p Ã¡n:** Táº¡o 2 list â†’ ThÃªm cÃ¢u há»i/Ä‘Ã¡p Ã¡n â†’ DÃ¹ng biáº¿n i láº§n lÆ°á»£t â†’ Kiá»ƒm tra Ä‘Ã¡p Ã¡n

**CÃ¢u 9 (Ná»‘i Ä‘Ã´i):** Ná»‘i khá»‘i lá»‡nh list vá»›i chá»©c nÄƒng:
1. add (x) to [list] â€” A. Láº¥y giÃ¡ trá»‹ pháº§n tá»­ thá»© N
2. delete (1) of [list] â€” B. ThÃªm x vÃ o cuá»‘i list
3. item (N) of [list] â€” C. Sá»‘ pháº§n tá»­ trong list
4. length of [list] â€” D. XÃ³a pháº§n tá»­ thá»© 1
**ÄÃ¡p Ã¡n: 1-B, 2-D, 3-A, 4-C**

**CÃ¢u 10 (Tráº¯c nghiá»‡m):** Trong game quiz 5 cÃ¢u, biáº¿n i cháº¡y tá»« 1 Ä‘áº¿n 5. Khi i > 5, ta nÃªn:
A. Tiáº¿p tá»¥c há»i cÃ¢u ngáº«u nhiÃªn
B. Káº¿t thÃºc quiz, hiá»ƒn thá»‹ káº¿t quáº£
C. Reset i vá» 1 vÃ  há»i láº¡i
D. XÃ³a list
**ÄÃ¡p Ã¡n: B**

### BÃ€I Táº¬P THá»°C HÃ€NH

**BÃ i 1:** Táº¡o project "Quiz Scratch cÆ¡ báº£n" â€” Táº¡o list 5 cÃ¢u há»i vá» Scratch vÃ  Ä‘Ã¡p Ã¡n. Sprite há»i láº§n lÆ°á»£t tá»«ng cÃ¢u (ask and wait). ÄÃºng +10, sai hiá»‡n Ä‘Ã¡p Ã¡n Ä‘Ãºng. Káº¿t thÃºc: nÃ³i tá»•ng Ä‘iá»ƒm.

**BÃ i 2:** Táº¡o project "Danh sÃ¡ch mua sáº¯m" â€” Sprite há»i tÃªn Ä‘á»“ váº­t cáº§n mua (ask), thÃªm vÃ o list. Nháº¥n Space xÃ³a váº­t Ä‘áº§u tiÃªn trong list (Ä‘Ã£ mua). Nháº¥n phÃ­m C xÃ³a toÃ n bá»™ list. Hiá»ƒn thá»‹ list vÃ  sá»‘ lÆ°á»£ng cÃ²n láº¡i.

**BÃ i 3:** Táº¡o project "Báº£ng Ä‘iá»ƒm cao" â€” Sau má»—i vÃ¡n game, lÆ°u Ä‘iá»ƒm vÃ o list "high_scores". Chá»‰ giá»¯ top 5 Ä‘iá»ƒm cao nháº¥t (dÃ¹ng delete Ä‘á»ƒ bá» Ä‘iá»ƒm tháº¥p). Hiá»ƒn thá»‹ list "high_scores" trÃªn mÃ n game over.

---

## BUá»”I 19: MY BLOCKS (Táº O KHá»I Lá»†NH TÃ™Y CHá»ˆNH)

### CÃ‚U Há»ŽI Ã”N Táº¬P

**CÃ¢u 1 (Tráº¯c nghiá»‡m):** My Blocks trong Scratch dÃ¹ng Ä‘á»ƒ:
A. Táº¡o sprite má»›i
B. Äáº·t tÃªn cho má»™t nhÃ³m lá»‡nh hay dÃ¹ng, gá»i láº¡i báº±ng má»™t khá»‘i duy nháº¥t
C. Táº¡o backdrop tÃ¹y chá»‰nh
D. ThÃªm Ã¢m thanh má»›i
**ÄÃ¡p Ã¡n: B**

**CÃ¢u 2 (Tráº¯c nghiá»‡m):** Äá»ƒ táº¡o My Block má»›i, vÃ o danh má»¥c nÃ o?
A. Variables
B. Operators
C. My Blocks â†’ Make a Block
D. Control
**ÄÃ¡p Ã¡n: C**

**CÃ¢u 3 (ÄÃºng/Sai):** My Block cÃ³ thá»ƒ nháº­n tham sá»‘ (input) Ä‘á»ƒ thay Ä‘á»•i hÃ nh vi tÃ¹y theo giÃ¡ trá»‹ truyá»n vÃ o.
**ÄÃ¡p Ã¡n: ÄÃºng**

**CÃ¢u 4 (ÄÃºng/Sai):** My Block giÃºp trÃ¡nh viáº¿t láº·p láº¡i cÃ¹ng má»™t Ä‘oáº¡n code nhiá»u láº§n.
**ÄÃ¡p Ã¡n: ÄÃºng**

**CÃ¢u 5 (Äiá»n tá»«):** Trong My Block "reset game", ta viáº¿t code Ä‘áº·t láº¡i ___ táº¥t cáº£ biáº¿n vÃ  vá»‹ trÃ­ nhÃ¢n váº­t vá» giÃ¡ trá»‹ ban Ä‘áº§u.
**ÄÃ¡p Ã¡n: set / táº¥t cáº£**

**CÃ¢u 6 (Äiá»n tá»«):** Khi gá»i My Block cÃ³ tham sá»‘, vÃ­ dá»¥ "spawn enemy (speed)", giÃ¡ trá»‹ ___ Ä‘Æ°á»£c truyá»n vÃ o vÃ  dÃ¹ng bÃªn trong block Ä‘Ã³.
**ÄÃ¡p Ã¡n: speed / tham sá»‘**

**CÃ¢u 7 (KÃ©o tháº£ tá»«):** Äiá»n Ä‘á»ƒ táº¡o My Block "reset game":
define reset game
  ___ [score] to (0)
  ___ [lives] to (3)
  ___ [time] to (30)
  ___ backdrop to [start]
NgÃ¢n hÃ ng tá»«: **set / switch / change / show**
**ÄÃ¡p Ã¡n: set / set / set / switch**

**CÃ¢u 8 (Sáº¯p xáº¿p):** Sáº¯p xáº¿p bÆ°á»›c táº¡o vÃ  dÃ¹ng My Block:
- [ ] Gá»i My Block báº±ng cÃ¡ch kÃ©o khá»‘i mÃ u há»“ng vÃ o script
- [ ] Viáº¿t cÃ¡c lá»‡nh bÃªn trong "define [tÃªn block]"
- [ ] VÃ o My Blocks â†’ Make a Block, Ä‘áº·t tÃªn
- [ ] ThÃªm tham sá»‘ náº¿u cáº§n
**ÄÃ¡p Ã¡n:** Make a Block â†’ Äáº·t tÃªn + tham sá»‘ â†’ Viáº¿t lá»‡nh trong define â†’ Gá»i My Block

**CÃ¢u 9 (Ná»‘i Ä‘Ã´i):** Ná»‘i My Block vá»›i mÃ´ táº£ tá»‘t nháº¥t:
1. "reset game" â€” A. Táº¡o káº» thÃ¹ vá»›i tá»‘c Ä‘á»™ tÃ¹y chá»‰nh
2. "spawn enemy (speed)" â€” B. Äáº·t láº¡i táº¥t cáº£ biáº¿n vá» Ä‘áº§u
3. "game over animation" â€” C. Hiá»‡u á»©ng khi nhÃ¢n váº­t tháº¯ng
4. "win celebration" â€” D. Hiá»‡u á»©ng vÃ  backdrop khi game káº¿t thÃºc
**ÄÃ¡p Ã¡n: 1-B, 2-A, 3-D, 4-C**

**CÃ¢u 10 (Tráº¯c nghiá»‡m):** Lá»£i Ã­ch lá»›n nháº¥t cá»§a My Blocks khi game cÃ³ nhiá»u sprite cÃ¹ng cáº§n reset:
A. Má»—i sprite gá»i cÃ¹ng 1 My Block "reset" thay vÃ¬ viáº¿t láº¡i
B. My Block cháº¡y nhanh hÆ¡n code thÆ°á»ng
C. My Block khÃ´ng tá»‘n bá»™ nhá»›
D. Scratch yÃªu cáº§u dÃ¹ng My Block
**ÄÃ¡p Ã¡n: A**

### BÃ€I Táº¬P THá»°C HÃ€NH

**BÃ i 1:** Táº¡o project "My Block reset game" â€” Táº¡o My Block "reset_all" gom táº¥t cáº£ lá»‡nh reset: set score=0, lives=3, time=30, switch backdrop start. NÃºt "ChÆ¡i láº¡i" vÃ  cá» xanh Ä‘á»u gá»i My Block nÃ y.

**BÃ i 2:** Táº¡o project "Spawn cÃ³ tham sá»‘" â€” Táº¡o My Block "spawn_enemy (speed, size)". Khi gá»i: clone káº» thÃ¹ vá»›i speed vÃ  size Ä‘Æ°á»£c truyá»n vÃ o. Level 1 gá»i spawn_enemy(2, 50), Level 2 gá»i spawn_enemy(4, 30).

**BÃ i 3:** Táº¡o project "Hiá»‡u á»©ng Ä‘áº·c biá»‡t" â€” Táº¡o 3 My Block: "win_effect" (phÃ¡o hoa + Ã¢m thanh), "lose_effect" (mÃ n Ä‘á» + Ã¢m thanh buá»“n), "level_up_effect" (nháº¥p nhÃ¡y + Ã¢m thanh vui). Gá»i Ä‘Ãºng block tÆ°Æ¡ng á»©ng khi sá»± kiá»‡n xáº£y ra.

---

## BUá»”I 20: HIá»†U á»¨NG & Ã‚M THANH

### CÃ‚U Há»ŽI Ã”N Táº¬P

**CÃ¢u 1 (Tráº¯c nghiá»‡m):** Hiá»‡u á»©ng nÃ o lÃ m sprite má» dáº§n (trong suá»‘t)?
A. color effect
B. brightness effect
C. ghost effect
D. fisheye effect
**ÄÃ¡p Ã¡n: C**

**CÃ¢u 2 (Tráº¯c nghiá»‡m):** Äá»ƒ phÃ¡t Ã¢m thanh vÃ  tiáº¿p tá»¥c cháº¡y code NGAY (khÃ´ng chá» háº¿t Ã¢m thanh), dÃ¹ng khá»‘i nÃ o?
A. play sound [tÃªn] until done
B. start sound [tÃªn]
C. play sound [tÃªn]
D. Cáº£ B vÃ  C
**ÄÃ¡p Ã¡n: D** (start sound vÃ  play sound Ä‘á»u khÃ´ng chá»)

**CÃ¢u 3 (ÄÃºng/Sai):** Hiá»‡u á»©ng "color" thay Ä‘á»•i mÃ u sáº¯c cá»§a sprite.
**ÄÃ¡p Ã¡n: ÄÃºng**

**CÃ¢u 4 (ÄÃºng/Sai):** DÃ¹ng "clear graphic effects" Ä‘á»ƒ xÃ³a táº¥t cáº£ hiá»‡u á»©ng Ä‘á»“ há»a Ä‘ang Ã¡p dá»¥ng lÃªn sprite.
**ÄÃ¡p Ã¡n: ÄÃºng**

**CÃ¢u 5 (Äiá»n tá»«):** Äá»ƒ sprite nháº¥p nhÃ¡y khi bá»‹ thÆ°Æ¡ng, dÃ¹ng vÃ²ng láº·p thay Ä‘á»•i hiá»‡u á»©ng ___ tá»« 0 Ä‘áº¿n 100 rá»“i vá» láº¡i 0.
**ÄÃ¡p Ã¡n: ghost**

**CÃ¢u 6 (Äiá»n tá»«):** Khá»‘i "set [pitch v] effect to (200)" trong Ã¢m thanh dÃ¹ng Ä‘á»ƒ thay Ä‘á»•i ___ cá»§a Ã¢m thanh phÃ¡t ra.
**ÄÃ¡p Ã¡n: cao Ä‘á»™ / tá»‘c Ä‘á»™ / pitch**

**CÃ¢u 7 (KÃ©o tháº£ tá»«):** Äiá»n Ä‘á»ƒ táº¡o hiá»‡u á»©ng nháº·t váº­t pháº©m:
when touching [váº­t pháº©m]:
  start sound [coin]
  set [___ v] effect to (50)
  wait (0.2) seconds
  ___ graphic effects
NgÃ¢n hÃ ng tá»«: **color / ghost / clear / play**
**ÄÃ¡p Ã¡n: color / clear**

**CÃ¢u 8 (Sáº¯p xáº¿p):** Sáº¯p xáº¿p hiá»‡u á»©ng tÆ°Æ¡ng á»©ng vá»›i sá»± kiá»‡n game:
- [ ] Ã‚m thanh "game over" khi lives = 0
- [ ] Hiá»‡u á»©ng ghost khi bá»‹ thÆ°Æ¡ng (invincible)
- [ [ Ã‚m thanh "coin" khi nháº·t xu
- [ ] Hiá»‡u á»©ng color khi nháº·t power-up
**ÄÃ¡p Ã¡n:** (cÃ¡c sá»± kiá»‡n Ä‘á»™c láº­p, sáº¯p xáº¿p theo thá»© tá»± game thÆ°á»ng gáº·p:) Ã‚m thanh coin â†’ Color effect power-up â†’ Ghost effect bá»‹ thÆ°Æ¡ng â†’ Ã‚m thanh game over

**CÃ¢u 9 (Ná»‘i Ä‘Ã´i):** Ná»‘i hiá»‡u á»©ng vá»›i tÃ¡c dá»¥ng:
1. ghost effect (100) â€” A. Sprite Ä‘á»•i mÃ u sáº¯c
2. color effect (50) â€” B. Sprite hoÃ n toÃ n trong suá»‘t
3. brightness effect (200) â€” C. Sprite mÃ©o nhÆ° máº¯t cÃ¡
4. fisheye effect (50) â€” D. Sprite sÃ¡ng hÆ¡n bÃ¬nh thÆ°á»ng
**ÄÃ¡p Ã¡n: 1-B, 2-A, 3-D, 4-C**

**CÃ¢u 10 (Tráº¯c nghiá»‡m):** CÃ¡ch tá»‘t nháº¥t Ä‘á»ƒ thÃªm Ã¢m thanh ná»n (background music) liÃªn tá»¥c:
A. play sound [nháº¡c] until done (láº·p láº¡i)
B. forever: start sound [nháº¡c], wait (thá»i_gian_nháº¡c) seconds
C. play sound [nháº¡c] once
D. Scratch khÃ´ng há»— trá»£ nháº¡c ná»n
**ÄÃ¡p Ã¡n: B**

### BÃ€I Táº¬P THá»°C HÃ€NH

**BÃ i 1:** Táº¡o project "Game cÃ³ hiá»‡u á»©ng Ä‘áº§y Ä‘á»§" â€” ThÃªm vÃ o game hiá»‡n cÃ³: hiá»‡u á»©ng ghost khi bá»‹ thÆ°Æ¡ng, color effect khi nháº·t power-up, brightness giáº£m khi sáº¯p háº¿t giá» (time < 10). Clear effects sau má»—i hiá»‡u á»©ng.

**BÃ i 2:** Táº¡o project "Game cÃ³ Ã¢m thanh" â€” ThÃªm Ã¢m thanh vÃ o game: nháº¡c ná»n (láº·p), Ã¢m thanh nháº·t xu (coin), Ã¢m thanh bá»‹ thÆ°Æ¡ng (ouch), Ã¢m thanh tháº¯ng (fanfare), Ã¢m thanh thua (game over). DÃ¹ng Ã¢m thanh tá»« thÆ° viá»‡n Scratch.

**BÃ i 3:** Táº¡o project "NhÃ¢n váº­t biá»ƒu cáº£m" â€” Sprite nhÃ¢n váº­t thay Ä‘á»•i hiá»‡u á»©ng theo tráº¡ng thÃ¡i: bÃ¬nh thÆ°á»ng (no effect), vui (color effect nháº£y sá»‘), buá»“n (ghost 30%), sá»£ (fisheye effect), tá»©c (brightness cao). Nháº¥n cÃ¡c phÃ­m sá»‘ 1â€“5 Ä‘á»ƒ chuyá»ƒn tráº¡ng thÃ¡i.

---

## BUá»”I 21: DEBUG & Tá»I Æ¯U CODE

### CÃ‚U Há»ŽI Ã”N Táº¬P

**CÃ¢u 1 (Tráº¯c nghiá»‡m):** "Debug" trong láº­p trÃ¬nh cÃ³ nghÄ©a lÃ :
A. ThÃªm tÃ­nh nÄƒng má»›i
B. TÃ¬m vÃ  sá»­a lá»—i trong chÆ°Æ¡ng trÃ¬nh
C. XÃ³a sprite khÃ´ng cáº§n thiáº¿t
D. Tá»‘i Æ°u tá»‘c Ä‘á»™
**ÄÃ¡p Ã¡n: B**

**CÃ¢u 2 (Tráº¯c nghiá»‡m):** Lá»—i phá»• biáº¿n nháº¥t khi dÃ¹ng clone lÃ  gÃ¬?
A. KhÃ´ng táº¡o Ä‘á»§ clone
B. QuÃªn xÃ³a clone khi khÃ´ng cáº§n, gÃ¢y trÃ n giá»›i háº¡n 300
C. Clone di chuyá»ƒn quÃ¡ nhanh
D. Clone khÃ´ng nháº­n Ä‘Æ°á»£c broadcast
**ÄÃ¡p Ã¡n: B**

**CÃ¢u 3 (ÄÃºng/Sai):** QuÃªn "set [score] to (0)" khi báº¯t Ä‘áº§u game má»›i lÃ  má»™t lá»—i phá»• biáº¿n khiáº¿n Ä‘iá»ƒm bá»‹ cá»™ng dá»“n tá»« vÃ¡n trÆ°á»›c.
**ÄÃ¡p Ã¡n: ÄÃºng**

**CÃ¢u 4 (ÄÃºng/Sai):** Sprite gá»‘c khi Ä‘ang dÃ¹ng clone nÃªn Ä‘Æ°á»£c áº©n Ä‘i, náº¿u quÃªn thÃ¬ sprite gá»‘c hiá»‡n lÃªn vÃ  trÃ´ng nhÆ° má»™t clone thá»«a.
**ÄÃ¡p Ã¡n: ÄÃºng**

**CÃ¢u 5 (Äiá»n tá»«):** Khi game cháº¡y cháº­m (lag), má»™t trong nhá»¯ng cÃ¡ch tá»‘i Æ°u lÃ  giáº£m sá»‘ lÆ°á»£ng ___ tá»“n táº¡i cÃ¹ng lÃºc vÃ  xÃ³a clone khi ra ngoÃ i mÃ n hÃ¬nh.
**ÄÃ¡p Ã¡n: clone**

**CÃ¢u 6 (Äiá»n tá»«):** Lá»—i "___ loop" xáº£y ra khi hai sprite gá»­i broadcast cho nhau liÃªn tá»¥c vÃ  khÃ´ng cÃ³ Ä‘iá»u kiá»‡n dá»«ng.
**ÄÃ¡p Ã¡n: infinite / vÃ´ háº¡n**

**CÃ¢u 7 (KÃ©o tháº£ tá»«):** Äiá»n cÃ¡c lá»—i thÆ°á»ng gáº·p:
- QuÃªn reset biáº¿n â†’ ___ dá»“n tá»« vÃ¡n trÆ°á»›c
- Sprite gá»‘c khÃ´ng hide â†’ xuáº¥t hiá»‡n nhÆ° ___ thá»«a
- KhÃ´ng xÃ³a clone â†’ trÃ n giá»›i háº¡n ___
- VÃ²ng láº·p vÃ´ háº¡n â†’ game bá»‹ ___
NgÃ¢n hÃ ng tá»«: **Ä‘iá»ƒm / clone / 300 / treo**
**ÄÃ¡p Ã¡n: Ä‘iá»ƒm / clone / 300 / treo**

**CÃ¢u 8 (Sáº¯p xáº¿p):** Sáº¯p xáº¿p quy trÃ¬nh debug má»™t lá»—i:
- [ ] Sá»­a lá»—i vÃ  test láº¡i
- [ ] Quan sÃ¡t hÃ nh vi báº¥t thÆ°á»ng
- [ ] XÃ¡c Ä‘á»‹nh nguyÃªn nhÃ¢n (quÃªn reset? clone thá»«a? sai Ä‘iá»u kiá»‡n?)
- [ ] DÃ¹ng "say" táº¡m thá»i Ä‘á»ƒ xem giÃ¡ trá»‹ biáº¿n
**ÄÃ¡p Ã¡n:** Quan sÃ¡t báº¥t thÆ°á»ng â†’ DÃ¹ng say xem biáº¿n â†’ XÃ¡c Ä‘á»‹nh nguyÃªn nhÃ¢n â†’ Sá»­a vÃ  test

**CÃ¢u 9 (Ná»‘i Ä‘Ã´i):** Ná»‘i lá»—i vá»›i biá»ƒu hiá»‡n:
1. QuÃªn reset score â€” A. NhÃ¢n váº­t biáº¿n máº¥t khi game báº¯t Ä‘áº§u
2. QuÃªn hide sprite gá»‘c â€” B. Äiá»ƒm báº¯t Ä‘áº§u tá»« vÃ¡n trÆ°á»›c
3. Clone khÃ´ng xÃ³a â€” C. CÃ³ 2 nhÃ¢n váº­t trÃªn mÃ n hÃ¬nh
4. Sai Ä‘iá»u kiá»‡n if â€” D. Game lag dáº§n vÃ  Ä‘Ã³ng bÄƒng
**ÄÃ¡p Ã¡n: 1-B, 2-C, 3-D, 4-A**

**CÃ¢u 10 (Tráº¯c nghiá»‡m):** CÃ¡ch nhanh nháº¥t kiá»ƒm tra giÃ¡ trá»‹ biáº¿n trong khi game Ä‘ang cháº¡y:
A. Dá»«ng game vÃ  Ä‘á»c code
B. Tick vÃ o checkbox biáº¿n Ä‘á»ƒ hiá»ƒn thá»‹ trÃªn mÃ n hÃ¬nh hoáº·c dÃ¹ng "say (biáº¿n)"
C. ThÃªm comment trong code
D. Äá»c lá»‹ch sá»­ broadcast
**ÄÃ¡p Ã¡n: B**

### BÃ€I Táº¬P THá»°C HÃ€NH

**BÃ i 1:** Táº¡o project "TÃ¬m vÃ  sá»­a lá»—i" â€” Má»Ÿ má»™t project game cÅ© (cá»§a buá»•i trÆ°á»›c). Cá»‘ tÃ¬nh táº¡o 3 lá»—i: bá» reset score, bá» hide sprite gá»‘c, bá» delete this clone. Rá»“i tá»± debug vÃ  sá»­a láº¡i. Ghi chÃº lá»—i tÃ¬m Ä‘Æ°á»£c.

**BÃ i 2:** Táº¡o project "Tá»‘i Æ°u clone" â€” Táº¡o game cÃ³ nhiá»u clone (50+ clone cÃ¹ng lÃºc). Äo hiá»‡u nÄƒng báº±ng cÃ¡ch quan sÃ¡t tá»‘c Ä‘á»™. Tá»‘i Æ°u báº±ng cÃ¡ch: xÃ³a clone ngay khi ra mÃ n hÃ¬nh, giá»›i háº¡n sá»‘ clone tá»‘i Ä‘a báº±ng biáº¿n Ä‘áº¿m.

**BÃ i 3:** Táº¡o project "Checklist debug" â€” Táº¡o game hoÃ n chá»‰nh vÃ  tá»± kiá»ƒm tra 6 Ä‘iá»ƒm: 1) Táº¥t cáº£ biáº¿n reset khi chÆ¡i láº¡i. 2) Sprite gá»‘c cá»§a clone Ä‘Ã£ áº©n. 3) Clone Ä‘Æ°á»£c xÃ³a khi cáº§n. 4) KhÃ´ng cÃ³ vÃ²ng láº·p vÃ´ háº¡n. 5) Äiá»u kiá»‡n if Ä‘Ãºng. 6) Broadcast Ä‘Æ°á»£c nháº­n Ä‘Ãºng chá»—.

---

## BUá»”I 22â€“23: THá»°C HÃ€NH Tá»”NG Há»¢P

### CÃ‚U Há»ŽI Ã”N Táº¬P

**CÃ¢u 1 (Tráº¯c nghiá»‡m):** Trong Ä‘á» bÃ i "NgÆ°á»i hÃ¹ng thu tháº­p xu vÃ ng", nhÃ¢n váº­t chÃ­nh cáº§n cÃ³ kháº£ nÄƒng nÃ o?
A. Chá»‰ di chuyá»ƒn trÃ¡i/pháº£i
B. Di chuyá»ƒn 4 hÆ°á»›ng, thu tháº­p xu, nÃ© káº» thÃ¹
C. Chá»‰ Ä‘á»©ng yÃªn vÃ  báº¯n
D. Di chuyá»ƒn ngáº«u nhiÃªn
**ÄÃ¡p Ã¡n: B**

**CÃ¢u 2 (Tráº¯c nghiá»‡m):** Xu vÃ ng trong game nÃªn Ä‘Æ°á»£c táº¡o báº±ng cÃ¡ch nÃ o Ä‘á»ƒ xuáº¥t hiá»‡n liÃªn tá»¥c?
A. Váº½ trá»±c tiáº¿p trÃªn backdrop
B. Táº¡o clone tá»« sprite xu má»—i vÃ i giÃ¢y
C. DÃ¹ng nhiá»u sprite xu riÃªng biá»‡t
D. Xu chá»‰ xuáº¥t hiá»‡n má»™t láº§n
**ÄÃ¡p Ã¡n: B**

**CÃ¢u 3 (ÄÃºng/Sai):** Game "NgÆ°á»i hÃ¹ng thu tháº­p xu vÃ ng" cÃ³ thá»ƒ tÃ­ch há»£p cáº£ 5 yáº¿u tá»‘: score, timer, lives, random, 3 mÃ n hÃ¬nh.
**ÄÃ¡p Ã¡n: ÄÃºng**

**CÃ¢u 4 (ÄÃºng/Sai):** Khi thiáº¿t káº¿ game thá»±c hÃ nh, khÃ´ng cáº§n lo vá» cÃ¢n báº±ng Ä‘á»™ khÃ³.
**ÄÃ¡p Ã¡n: Sai**

**CÃ¢u 5 (Äiá»n tá»«):** Trong game thu tháº­p xu, káº» thÃ¹ nÃªn di chuyá»ƒn theo ___ Ä‘á»ƒ táº¡o thÃ¡ch thá»©c, khÃ´ng chá»‰ Ä‘á»©ng yÃªn.
**ÄÃ¡p Ã¡n: hÆ°á»›ng ngáº«u nhiÃªn / Ä‘Æ°á»ng cá»‘ Ä‘á»‹nh / pattern**

**CÃ¢u 6 (Äiá»n tá»«):** Äá»ƒ game "NgÆ°á»i hÃ¹ng thu tháº­p xu vÃ ng" cÃ³ chiá»u sÃ¢u, cÃ³ thá»ƒ thÃªm xu ___ trá»‹ giÃ¡ Ä‘iá»ƒm cao hÆ¡n xu thÆ°á»ng.
**ÄÃ¡p Ã¡n: Ä‘áº·c biá»‡t / vÃ ng Ä‘áº·c biá»‡t / lá»›n**

**CÃ¢u 7 (KÃ©o tháº£ tá»«):** Äiá»n cÃ¡c thÃ nh pháº§n cáº§n thiáº¿t trong game thá»±c hÃ nh:
- Sprite nhÃ¢n váº­t: di chuyá»ƒn báº±ng ___ mÅ©i tÃªn
- Sprite xu: ___ clone má»—i 1 giÃ¢y
- Biáº¿n score: ___ má»—i khi nháº·t xu
- Biáº¿n timer: ___ ngÆ°á»£c tá»« 60
NgÃ¢n hÃ ng tá»«: **phÃ­m / táº¡o / tÄƒng / Ä‘áº¿m**
**ÄÃ¡p Ã¡n: phÃ­m / táº¡o / tÄƒng / Ä‘áº¿m**

**CÃ¢u 8 (Sáº¯p xáº¿p):** Sáº¯p xáº¿p thá»© tá»± phÃ¡t triá»ƒn game thá»±c hÃ nh:
- [ ] ThÃªm káº» thÃ¹ vÃ  há»‡ thá»‘ng máº¡ng sá»‘ng
- [ ] Táº¡o sprite vÃ  di chuyá»ƒn nhÃ¢n váº­t
- [ ] ThÃªm há»‡ thá»‘ng xu (clone) vÃ  Ä‘iá»ƒm sá»‘
- [ ] HoÃ n thiá»‡n UI (3 mÃ n hÃ¬nh) vÃ  test tá»•ng thá»ƒ
- [ ] ThÃªm timer vÃ  Ä‘iá»u kiá»‡n káº¿t thÃºc
**ÄÃ¡p Ã¡n:** NhÃ¢n váº­t di chuyá»ƒn â†’ Xu + Ä‘iá»ƒm â†’ Timer + káº¿t thÃºc â†’ Káº» thÃ¹ + lives â†’ UI + test

**CÃ¢u 9 (Ná»‘i Ä‘Ã´i):** Ná»‘i sprite vá»›i chá»©c nÄƒng trong game "NgÆ°á»i hÃ¹ng thu tháº­p xu vÃ ng":
1. Sprite nhÃ¢n váº­t â€” A. Táº¡o clone má»—i 1 giÃ¢y á»Ÿ vá»‹ trÃ­ ngáº«u nhiÃªn
2. Sprite xu vÃ ng â€” B. Di chuyá»ƒn 4 hÆ°á»›ng, thu tháº­p, nÃ© trÃ¡nh
3. Sprite káº» thÃ¹ â€” C. Hiá»ƒn thá»‹ Ä‘iá»ƒm, máº¡ng, thá»i gian
4. Sprite UI â€” D. Di chuyá»ƒn ngáº«u nhiÃªn, cháº¡m nhÃ¢n váº­t -1 máº¡ng
**ÄÃ¡p Ã¡n: 1-B, 2-A, 3-D, 4-C**

**CÃ¢u 10 (Tráº¯c nghiá»‡m):** TÃ­nh nÄƒng nÃ o giÃºp game "NgÆ°á»i hÃ¹ng thu tháº­p xu vÃ ng" thÃº vá»‹ hÆ¡n?
A. Tá»‘c Ä‘á»™ xuáº¥t hiá»‡n xu tÄƒng theo score
B. Káº» thÃ¹ ngÃ y cÃ ng nhiá»u vÃ  nhanh hÆ¡n
C. CÃ³ xu Ä‘áº·c biá»‡t xuáº¥t hiá»‡n ngáº«u nhiÃªn vá»›i Ä‘iá»ƒm cao
D. Táº¥t cáº£ cÃ¡c tÃ­nh nÄƒng trÃªn
**ÄÃ¡p Ã¡n: D**

### BÃ€I Táº¬P THá»°C HÃ€NH

**BÃ i 1 (Buá»•i 22):** Táº¡o project "NgÆ°á»i hÃ¹ng thu tháº­p xu vÃ ng - Pháº§n 1" â€” XÃ¢y dá»±ng ná»n táº£ng: nhÃ¢n váº­t di chuyá»ƒn 4 hÆ°á»›ng, xu xuáº¥t hiá»‡n báº±ng clone ngáº«u nhiÃªn má»—i 1 giÃ¢y, nháº·t xu +10 Ä‘iá»ƒm, Ä‘áº¿m ngÆ°á»£c 60 giÃ¢y, mÃ n game over khi háº¿t giá».

**BÃ i 2 (Buá»•i 23):** Táº¡o project "NgÆ°á»i hÃ¹ng thu tháº­p xu vÃ ng - Pháº§n 2" â€” Tiáº¿p tá»¥c tá»« Pháº§n 1: thÃªm káº» thÃ¹ (clone, di chuyá»ƒn ngáº«u nhiÃªn, cháº¡m -1 máº¡ng), lives=3, xu Ä‘áº·c biá»‡t (xuáº¥t hiá»‡n 20% cÆ¡ há»™i, +50 Ä‘iá»ƒm), mÃ n win khi Ä‘áº¡t 200 Ä‘iá»ƒm, hoÃ n thiá»‡n 3 mÃ n hÃ¬nh start/game/end.

**BÃ i 3:** Táº¡o project "PhiÃªn báº£n nÃ¢ng cáº¥p" â€” Tá»« game hoÃ n chá»‰nh, thÃªm Ã­t nháº¥t 2 trong sá»‘: há»‡ thá»‘ng level (3 level), Ã¢m thanh Ä‘áº§y Ä‘á»§, hiá»‡u á»©ng Ä‘á»“ há»a, My Blocks Ä‘á»ƒ tá»• chá»©c code gá»n, báº£ng Ä‘iá»ƒm cao (list top 3).

---

## BUá»”I 24: Tá»”NG Káº¾T GÄ2 & PREVIEW GÄ3

### CÃ‚U Há»ŽI Ã”N Táº¬P

**CÃ¢u 1 (Tráº¯c nghiá»‡m):** Trong GÄ2, khá»‘i lá»‡nh nÃ o dÃ¹ng Ä‘á»ƒ táº¡o báº£n sao cá»§a sprite cÃ³ thá»ƒ hoáº¡t Ä‘á»™ng Ä‘á»™c láº­p?
A. duplicate sprite
B. create clone of [myself v]
C. copy sprite
D. spawn sprite
**ÄÃ¡p Ã¡n: B**

**CÃ¢u 2 (Tráº¯c nghiá»‡m):** Ká»¹ thuáº­t nÃ o trong GÄ2 cho phÃ©p mÃ´ phá»ng váº­t lÃ½ rÆ¡i tá»± do?
A. Touching color
B. My Blocks
C. Biáº¿n vy káº¿t há»£p trá»ng lá»±c (change vy by -1)
D. Lists
**ÄÃ¡p Ã¡n: C**

**CÃ¢u 3 (ÄÃºng/Sai):** Lists trong GÄ2 cÃ³ thá»ƒ dÃ¹ng Ä‘á»ƒ lÆ°u trá»¯ danh sÃ¡ch cÃ¢u há»i quiz hoáº·c báº£ng Ä‘iá»ƒm cao.
**ÄÃ¡p Ã¡n: ÄÃºng**

**CÃ¢u 4 (ÄÃºng/Sai):** My Blocks giÃºp code ngáº¯n gá»n hÆ¡n báº±ng cÃ¡ch gom nhÃ³m cÃ¡c lá»‡nh hay dÃ¹ng láº¡i.
**ÄÃ¡p Ã¡n: ÄÃºng**

**CÃ¢u 5 (Äiá»n tá»«):** Trong GÄ2, Ä‘á»ƒ táº¡o nhiá»u loáº¡i káº» thÃ¹ tá»« má»™t sprite, ta dÃ¹ng biáº¿n ___ káº¿t há»£p vá»›i switch costume.
**ÄÃ¡p Ã¡n: item_type**

**CÃ¢u 6 (Äiá»n tá»«):** GÄ3 sáº½ há»c vá» giao tiáº¿p giá»¯a cÃ¡c sprite qua ___ vÃ  cÃ¡c ká»¹ thuáº­t nÃ¢ng cao hÆ¡n.
**ÄÃ¡p Ã¡n: broadcast / tin nháº¯n**

**CÃ¢u 7 (KÃ©o tháº£ tá»«):** Ná»‘i ká»¹ thuáº­t GÄ2 vá»›i á»©ng dá»¥ng:
Clone cÆ¡ báº£n â†’ táº¡o ___ váº­t pháº©m
Touching color â†’ kiá»ƒm tra ___ vá»›i tÆ°á»ng/sÃ n
My Blocks â†’ tá»• chá»©c code ___ hÆ¡n
Lists â†’ lÆ°u danh sÃ¡ch ___ cao
NgÃ¢n hÃ ng tá»«: **nhiá»u / va cháº¡m / gá»n / Ä‘iá»ƒm**
**ÄÃ¡p Ã¡n: nhiá»u / va cháº¡m / gá»n / Ä‘iá»ƒm**

**CÃ¢u 8 (Sáº¯p xáº¿p):** Sáº¯p xáº¿p cÃ¡c ká»¹ thuáº­t GÄ2 theo thá»© tá»± há»c (tá»« Ä‘áº§u Ä‘áº¿n cuá»‘i):
- [ ] Clone nÃ¢ng cao (For this sprite only)
- [ ] Biáº¿n (Variables) vÃ  Ä‘iá»ƒm sá»‘
- [ ] Lists vÃ  My Blocks
- [ ] Game hoÃ n chá»‰nh #1 (5 yáº¿u tá»‘)
- [ ] Trá»ng lá»±c vÃ  touching color
**ÄÃ¡p Ã¡n:** Biáº¿n + Ä‘iá»ƒm sá»‘ â†’ Game hoÃ n chá»‰nh #1 â†’ Clone nÃ¢ng cao â†’ Touching color + trá»ng lá»±c â†’ Lists + My Blocks

**CÃ¢u 9 (Ná»‘i Ä‘Ã´i):** Ná»‘i buá»•i há»c vá»›i ká»¹ thuáº­t chÃ­nh:
1. Buá»•i 1â€“2 â€” A. Clone, nhiá»u loáº¡i clone, báº¯n Ä‘áº¡n
2. Buá»•i 3â€“5 â€” B. Biáº¿n, Ä‘iá»ƒm sá»‘
3. Buá»•i 6â€“8 â€” C. ToÃ¡n tá»­, random, timer
4. Buá»•i 9â€“12 â€” D. Game hoÃ n chá»‰nh, lives
**ÄÃ¡p Ã¡n: 1-B, 2-C, 3-D, 4-A**

**CÃ¢u 10 (Tráº¯c nghiá»‡m):** Ká»¹ nÄƒng nÃ o tá»« GÄ2 sáº½ dÃ¹ng NHIá»€U NHáº¤T trong GÄ3 (dá»± Ã¡n lá»›n)?
A. Chá»‰ clone
B. Tá»•ng há»£p táº¥t cáº£: clone + lives + timer + score + My Blocks + UI Ä‘áº§y Ä‘á»§
C. Chá»‰ Lists
D. Chá»‰ touching color
**ÄÃ¡p Ã¡n: B**

### BÃ€I Táº¬P THá»°C HÃ€NH

**BÃ i 1:** Táº¡o project "Ã”n táº­p GÄ2 â€” Mini game tá»•ng há»£p" â€” Game 2 phÃºt sá»­ dá»¥ng Táº¤T Cáº¢ ká»¹ thuáº­t GÄ2: clone nhiá»u loáº¡i (item_type), touching color cho tÆ°á»ng, trá»ng lá»±c, lives, timer, score, My Block reset, List lÆ°u top 3 Ä‘iá»ƒm. 3 mÃ n hÃ¬nh Ä‘áº§y Ä‘á»§.

**BÃ i 2:** Táº¡o project "Showcase GÄ2" â€” Táº¡o báº£n trÃ¬nh bÃ y 24 ká»¹ thuáº­t há»c trong GÄ2. Má»—i "slide" (backdrop) giá»›i thiá»‡u má»™t ká»¹ thuáº­t vá»›i vÃ­ dá»¥ mini cÃ³ thá»ƒ tÆ°Æ¡ng tÃ¡c. DÃ¹ng phÃ­m mÅ©i tÃªn Ä‘á»ƒ chuyá»ƒn slide.

**BÃ i 3:** Táº¡o project "Dá»± Ã¡n tá»± chá»n GÄ2" â€” Tá»± thiáº¿t káº¿ má»™t game hoÃ n chá»‰nh theo chá»§ Ä‘á» yÃªu thÃ­ch (khÃ´ng pháº£i "NgÆ°á»i hÃ¹ng thu tháº­p xu"). YÃªu cáº§u sá»­ dá»¥ng Ã­t nháº¥t 8 ká»¹ thuáº­t tá»« GÄ2. Viáº¿t mÃ´ táº£ ngáº¯n vá» game vÃ  cÃ¡c ká»¹ thuáº­t Ä‘Ã£ dÃ¹ng trong pháº§n chÃº thÃ­ch cá»§a dá»± Ã¡n.
