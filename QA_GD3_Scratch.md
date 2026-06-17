# GIÁO TRÌNH ÔN TẬP GIAI ĐOẠN 3 (GĐ3) - D1 SCRATCH

**CLB Kỹ Năng Số & Lập Trình Thiếu Nhi**
**Lớp D1 Scratch — Giai Đoạn 3: Các thể loại game thi (16 buổi)**

Mỗi buổi gồm:
- 10 câu hỏi ôn tập (6 dạng: Trắc nghiệm, Đúng/Sai, Điền từ, Kéo thả từ, Sắp xếp, Nối đôi)
- 3 bài tập thực hành (mỗi bài tạo file .sb3)

---

## BUỔI 1: CATCHING GAME — CỐT LÕI

### CÂU HỎI ÔN TẬP

**Câu 1 (Trắc nghiệm):** Trong Catching Game, vật thể rơi từ trên xuống nên được tạo bằng cách nào?
A. Tạo nhiều sprite riêng biệt cho từng vật
B. Dùng clone từ một sprite vật thể gốc
C. Vẽ trực tiếp trên backdrop
D. Dùng backdrop thay đổi
**Đáp án: B**

**Câu 2 (Trắc nghiệm):** Nhân vật bắt vật chỉ di chuyển theo chiều nào trong Catching Game?
A. Lên xuống (trục Y)
B. Sang trái/phải (trục X)
C. Cả 4 hướng
D. Tự động theo vật rơi
**Đáp án: B**

**Câu 3 (Đúng/Sai):** Clone vật thể nên được xóa khi y < -170 (chạm đáy màn hình) dù chưa bị bắt.
**Đáp án: Đúng**

**Câu 4 (Đúng/Sai):** Biến "speed" dùng để lưu tốc độ rơi của vật thể nên là loại "For this sprite only".
**Đáp án: Sai** (speed dùng chung cho tất cả vật thể → For all sprites; nếu muốn mỗi clone tốc độ riêng thì mới dùng For this sprite only)

**Câu 5 (Điền từ):** Khi nhân vật bắt được vật tốt, cộng điểm và ___ clone đó để không cộng nhiều lần.
**Đáp án: xóa / delete**

**Câu 6 (Điền từ):** Để kiểm tra nhân vật có bắt được vật hay không, clone vật dùng khối ___ [nhân vật]?.
**Đáp án: touching**

**Câu 7 (Kéo thả từ):** Điền để tạo Catching Game cốt lõi:
Vật thể gốc: ___ → mỗi 1 giây ___ clone
Clone: go to x: (pick random -200 to 200) y: (180) → rơi xuống → if ___ [nhân vật]? then +điểm, delete → if y < -170 then ___
Ngân hàng từ: **hide / create / touching / delete this clone**
**Đáp án: hide / create / touching / delete this clone**

**Câu 8 (Sắp xếp):** Sắp xếp các bước code Catching Game cốt lõi theo thứ tự hợp lý:
- [ ] Clone kiểm tra touching nhân vật → +điểm + xóa
- [ ] Sprite gốc ẩn và tạo clone định kỳ
- [ ] Clone xuất hiện x ngẫu nhiên ở y=180, rơi xuống
- [ ] Nhân vật di chuyển trái/phải bằng phím mũi tên
**Đáp án:** Nhân vật di chuyển → Sprite gốc ẩn + tạo clone → Clone xuất hiện + rơi → Kiểm tra touching

**Câu 9 (Nối đôi):** Nối tình huống với xử lý trong Catching Game:
1. Vật tốt chạm nhân vật — A. Không có hành động (bỏ qua)
2. Vật xấu chạm nhân vật — B. Xóa clone (bỏ sót)
3. Vật chạm đáy (y < -170) — C. +điểm và xóa clone
4. Nhân vật đứng yên — D. -1 mạng và xóa clone
**Đáp án: 1-C, 2-D, 3-B, 4-A**

**Câu 10 (Trắc nghiệm):** Để nhân vật không di chuyển ra ngoài màn hình, cần thêm điều kiện nào?
A. if x > 240 then stop
B. if (x > 220) then set x to (220) — và tương tự cho cạnh trái
C. Dùng "if on edge, bounce"
D. Catching game không cần giới hạn
**Đáp án: B**

### BÀI TẬP THỰC HÀNH

**Bài 1:** Tạo project "Catching cốt lõi" — Nhân vật rổ di chuyển trái/phải. Sprite táo ẩn, tạo clone mỗi 1 giây. Clone xuất hiện x ngẫu nhiên y=170, rơi xuống 5 bước/frame. Bắt được +10 điểm. Chạm đáy: xóa clone. Timer 30s.

**Bài 2:** Tạo project "Rơi có tốc độ" — Tiếp tục từ Bài 1, thêm biến speed=3 (toàn cục). Clone rơi với tốc độ = speed. Cứ 10 giây tăng speed thêm 1. Quan sát độ khó tăng dần.

**Bài 3:** Tạo project "Nhiều loại vật" — Thêm sprite thứ 2 (vật xấu, màu đỏ). Cả 2 sprite tạo clone xen kẽ ngẫu nhiên. Bắt được vật tốt +10, chạm vật xấu -1 mạng. Lives=3. Khi lives=0 → dừng game.

---

## BUỔI 2: CATCHING GAME — HOÀN THIỆN

### CÂU HỎI ÔN TẬP

**Câu 1 (Trắc nghiệm):** Vật phẩm đặc biệt "x3 điểm" trong Catching Game nên xuất hiện với tần suất:
A. Mọi lần như vật thường
B. Ít hơn, ngẫu nhiên (ví dụ: 20% cơ hội)
C. Không bao giờ
D. Liên tục để game dễ hơn
**Đáp án: B**

**Câu 2 (Trắc nghiệm):** Cơ chế "bất tử 2 giây" sau khi bị vật xấu trúng giúp:
A. Tăng điểm số
B. Tránh mất nhiều mạng liên tiếp trong 2 giây
C. Tự động hồi mạng
D. Tăng tốc độ nhân vật
**Đáp án: B**

**Câu 3 (Đúng/Sai):** Icon trái tim hiển thị số mạng nên show/hide tương ứng với biến lives.
**Đáp án: Đúng**

**Câu 4 (Đúng/Sai):** Để tốc độ tăng mỗi 15 giây, ta dùng: if (timer mod 15 = 0) then change speed by 1.
**Đáp án: Sai** (timer của Scratch là biến đếm lên, cần dùng biến time tự tạo hoặc điều kiện khác; hoặc dùng wait 15s trong loop riêng)

**Câu 5 (Điền từ):** Màn hình kết thúc (game over) hiển thị điểm cuối bằng: say (join "Điểm: " (___)).
**Đáp án: score**

**Câu 6 (Điền từ):** Nhạc nền liên tục dùng vòng lặp: forever → ___ sound [nhạc nền] → wait (___ giây).
**Đáp án: play / thời_gian_nhạc**

**Câu 7 (Kéo thả từ):** Điền để tạo vật phẩm đặc biệt x3 điểm:
Khi tạo clone: set [item_type] to (pick random 1 to ___)
if item_type = 3 then: điểm cộng = ___ * 3
if item_type = 3 then switch costume to [___]
Ngân hàng từ: **5 / score_per_item / star / bomb**
**Đáp án: 5 / score_per_item / star**

**Câu 8 (Sắp xếp):** Sắp xếp tính năng cần thêm để hoàn thiện Catching Game (theo thứ tự ưu tiên):
- [ ] Nhạc nền + hiệu ứng âm thanh
- [ ] 3 mạng + icon tim + bất tử 2 giây
- [ ] Tốc độ tăng dần mỗi 15 giây
- [ ] Start screen + game over screen
- [ ] Vật xấu (bom) và vật đặc biệt (x3 điểm)
**Đáp án:** Vật xấu + vật đặc biệt → Mạng + bất tử → Tốc độ tăng → Start/Game over → Nhạc + hiệu ứng

**Câu 9 (Nối đôi):** Nối tính năng với cách thực hiện:
1. Tốc độ tăng dần — A. Sprite riêng show/hide theo biến lives
2. Icon tim hiển thị mạng — B. change speed by 1 sau mỗi N giây
3. Bất tử 2 giây — C. set [invincible] to (1), wait 2s, set to (0)
4. Điểm x3 — D. if item_type = 3 then change score by (30) thay vì (10)
**Đáp án: 1-B, 2-A, 3-C, 4-D**

**Câu 10 (Trắc nghiệm):** Game over screen nên được hiển thị bằng cách nào?
A. Xóa tất cả sprite
B. Switch backdrop to [game_over] và hiện sprite thông báo điểm
C. Dừng game ngay mà không thông báo
D. Làm màn hình tối đen
**Đáp án: B**

### BÀI TẬP THỰC HÀNH

**Bài 1:** Tạo project "Catching Game hoàn chỉnh v1" — Từ buổi 1 thêm: vật xấu (-1 mạng), vật đặc biệt (+30 điểm, 20% cơ hội). Lives=3 với icon tim. Bất tử 2 giây khi bị trúng. Tốc độ tăng mỗi 15 giây.

**Bài 2:** Tạo project "Catching Game hoàn chỉnh v2" — Thêm 3 màn hình: start (tên game + nút bắt đầu), game (gameplay), game_over (điểm cuối + nút chơi lại). Tất cả sprite show/hide đúng theo backdrop.

**Bài 3:** Tạo project "Catching Game final" — Thêm nhạc nền lặp, âm thanh khi bắt được vật (coin sound), âm thanh khi mất mạng (ouch sound). Hiệu ứng ghost khi bất tử. Test toàn bộ game từ start đến game over và chơi lại.

---

## BUỔI 3: CATCHING GAME — DEMO & PHÂN TÍCH

### CÂU HỎI ÔN TẬP

**Câu 1 (Trắc nghiệm):** Lỗi phổ biến nhất khi làm Catching Game là:
A. Nhân vật không di chuyển được
B. Bỏ sót vật nhưng không xóa clone, gây tràn 300 clone
C. Điểm không hiển thị
D. Backdrop không chuyển được
**Đáp án: B**

**Câu 2 (Trắc nghiệm):** Catching Game là thể loại nào trong 5 thể loại của GĐ3?
A. Khó nhất
B. Dễ code nhất và phù hợp khi không chắc thể loại khác
C. Ít được dùng nhất trong thi
D. Chỉ phù hợp cho đề thi đơn giản
**Đáp án: B**

**Câu 3 (Đúng/Sai):** Vật tốt và vật xấu có thể dùng cùng một sprite với item_type khác nhau thay vì 2 sprite riêng.
**Đáp án: Đúng**

**Câu 4 (Đúng/Sai):** Catching Game không thể có nhiều màn (level) vì vật chỉ rơi từ trên xuống.
**Đáp án: Sai** (Có thể có level bằng cách tăng tốc độ, thêm loại vật, đổi backdrop theo level)

**Câu 5 (Điền từ):** Khi tốc độ clone tăng quá nhanh, game trở nên không thể chơi được. Cần đặt giới hạn tốc độ tối đa bằng: if (speed > ___) then set speed to (giá trị tối đa).
**Đáp án: giá trị tối đa (ví dụ: 15)**

**Câu 6 (Điền từ):** Lỗi "clone không xóa" sau khi bị bắt thường do quên thêm khối ___ this clone trong điều kiện touching.
**Đáp án: delete**

**Câu 7 (Kéo thả từ):** Điền lỗi và cách sửa:
- Clone xuất hiện ở giữa màn hình → sprite gốc quên ___
- Điểm không reset → thiếu ___ [score] to (0) trong when flag clicked
- Nhiều clone chồng lên nhau → tăng ___ giữa mỗi lần tạo clone
Ngân hàng từ: **hide / set / wait / delete**
**Đáp án: hide / set / wait**

**Câu 8 (Sắp xếp):** Sắp xếp quy trình demo và nhận xét game Catching:
- [ ] Sửa lỗi tìm được
- [ ] Chạy game và quan sát
- [ ] Kiểm tra checklist: clone xóa chưa, biến reset chưa, start/end screen đúng chưa
- [ ] Thử chơi đến game over và nhấn chơi lại kiểm tra
**Đáp án:** Chạy và quan sát → Kiểm tra checklist → Thử chơi đến game over → Sửa lỗi

**Câu 9 (Nối đôi):** Nối lỗi với biểu hiện trong Catching Game:
1. Sprite gốc không hide — A. Game lag dần sau vài chục giây
2. Clone không xóa khi bỏ sót — B. Điểm từ ván trước còn lại
3. Quên set score to 0 — C. Có vật thể ở giữa màn ngay khi bắt đầu
4. Tốc độ tăng không có giới hạn — D. Game không thể chơi được sau 1-2 phút
**Đáp án: 1-C, 2-A, 3-B, 4-D**

**Câu 10 (Trắc nghiệm):** Catching Game phù hợp nhất khi:
A. Đề thi yêu cầu game nhảy qua chướng ngại vật
B. Đề thi mô tả nhân vật bắt/né vật rơi từ trên
C. Đề thi yêu cầu bắn tiêu diệt kẻ thù
D. Đề thi yêu cầu giải mê cung
**Đáp án: B**

### BÀI TẬP THỰC HÀNH

**Bài 1:** Tạo project "Debug Catching" — Mở game Catching đã làm, tìm ít nhất 3 lỗi tiềm ẩn bằng cách test có chủ đích: chơi đến game over → nhấn chơi lại (xem biến có reset không), để vật rơi xuống đáy 20 lần (xem có lag không), tốc độ có giới hạn không.

**Bài 2:** Tạo project "Catching Game nâng cấp" — Thêm vào game: level system (cứ 50 điểm lên 1 level, tối đa level 3), mỗi level backdrop khác nhau, level 3 có thêm vật thể di chuyển zigzag thay vì rơi thẳng.

**Bài 3:** Tạo project "Catching phong cách riêng" — Tạo game Catching hoàn toàn mới với chủ đề tự chọn (không phải bắt táo/sao). Ví dụ: rổ bắt cá, ô che mưa, nhặt tiền xu. Phải có đủ: 3 loại vật, lives, timer, speed tăng, 3 màn hình.

---

## BUỔI 4: PLATFORMER GAME — CỐT LÕI

### CÂU HỎI ÔN TẬP

**Câu 1 (Trắc nghiệm):** Yếu tố cốt lõi quan trọng nhất của Platformer Game là:
A. Đồ họa đẹp
B. Hệ thống trọng lực (gravity) và nhảy hoạt động đúng
C. Nhiều kẻ thù
D. Âm thanh phong phú
**Đáp án: B**

**Câu 2 (Trắc nghiệm):** Để nhân vật đứng được trên sàn (platform), cần dùng kỹ thuật nào?
A. set y to (0)
B. touching color [màu sàn] → set vy to (0)
C. if on edge, bounce
D. go to [random position]
**Đáp án: B**

**Câu 3 (Đúng/Sai):** Biến vy (velocity y) cần giảm dần mỗi frame (change vy by -1) để mô phỏng trọng lực.
**Đáp án: Đúng**

**Câu 4 (Đúng/Sai):** Nhân vật có thể nhảy nhiều lần trên không (double jump) nếu không kiểm tra điều kiện "đang đứng sàn" trước khi nhảy.
**Đáp án: Đúng** (và đây là lỗi cần tránh, trừ khi thiết kế intentional double jump)

**Câu 5 (Điền từ):** Khi nhân vật chạm vào sàn màu nâu, cần set [vy] to (0) và ___ nhân vật lên từng pixel cho đến khi không còn chạm sàn nữa.
**Đáp án: đẩy / move**

**Câu 6 (Điền từ):** Điều kiện để nhân vật được phép nhảy: chỉ khi đang ___ sàn (touching color sàn), không cho nhảy trên không.
**Đáp án: đứng trên / touching color**

**Câu 7 (Kéo thả từ):** Điền để tạo hệ thống trọng lực + nhảy:
forever:
  change [vy] ___ (-1)
  change y ___ (vy)
  if touching color [nâu]? then
    ___ [vy] to (0)
    repeat until not touching color [nâu]: change y ___ (1)
  if key [space] pressed and touching color [nâu]: ___ [vy] to (10)
Ngân hàng từ: **by / by / set / by / set**
**Đáp án: by / by / set / by / set**

**Câu 8 (Sắp xếp):** Sắp xếp thứ tự code Platformer cốt lõi:
- [ ] Thêm jumping: nhấn Space khi đứng sàn → set vy to 10
- [ ] Vẽ backdrop với platform màu nâu
- [ ] Code trọng lực: change vy by -1 và change y by vy
- [ ] Code nhân vật di chuyển trái/phải
- [ ] Xử lý va chạm sàn: set vy=0, đẩy ra khỏi sàn
**Đáp án:** Vẽ backdrop → Di chuyển trái/phải → Trọng lực → Va chạm sàn → Jumping

**Câu 9 (Nối đôi):** Nối trạng thái với giá trị vy tương ứng:
1. Nhân vật đứng yên trên sàn — A. vy = 0 và không thay đổi
2. Nhân vật vừa nhảy — B. vy = 10 (dương, đi lên)
3. Nhân vật đang rơi — C. vy < 0 (âm, đi xuống)
4. Nhân vật chạm sàn lần nữa — D. vy được set về 0
**Đáp án: 1-A, 2-B, 3-C, 4-D**

**Câu 10 (Trắc nghiệm):** Platformer được đánh giá là thể loại nào trong 5 thể loại thi?
A. Dễ code nhất
B. Ít điểm nhất
C. Ấn tượng nhất nhưng phức tạp nhất — chỉ chọn khi tự tin về trọng lực
D. Không bao giờ xuất hiện trong đề thi
**Đáp án: C**

### BÀI TẬP THỰC HÀNH

**Bài 1:** Tạo project "Platformer trọng lực" — Vẽ backdrop có sàn ngang màu nâu. Nhân vật có trọng lực (vy giảm 1/frame). Di chuyển trái/phải. Đứng được trên sàn. Nhảy bằng Space chỉ khi đang đứng sàn.

**Bài 2:** Tạo project "Platformer đa sàn" — Vẽ backdrop có 4 platform ở các độ cao khác nhau. Nhân vật nhảy từ platform này sang platform khác. Thêm bẫy màu đỏ ở dưới đất (-1 mạng, reset vị trí). Lives=3.

**Bài 3:** Tạo project "Platformer thu thập" — Đặt 5 xu vàng trên các platform. Nhân vật thu thập xu (+10 điểm). Thu đủ 5 xu → "Level Clear!". Cửa màu vàng ở cuối màn dẫn đến level 2 (backdrop mới). Lives=3, hiển thị điểm.

---

## BUỔI 5: PLATFORMER GAME — HOÀN THIỆN

### CÂU HỎI ÔN TẬP

**Câu 1 (Trắc nghiệm):** Lỗi "nhân vật rung trên sàn" trong Platformer xảy ra vì:
A. Tốc độ nhân vật quá nhanh
B. Trọng lực và đẩy ra khỏi sàn không khớp nhau, nhân vật bị đẩy qua lại
C. Backdrop vẽ sai màu
D. Biến vy quá lớn
**Đáp án: B**

**Câu 2 (Trắc nghiệm):** Cách fix lỗi nhân vật xuyên qua sàn khi rơi quá nhanh là:
A. Giảm trọng lực xuống rất nhỏ
B. Chia di chuyển thành nhiều bước nhỏ mỗi frame thay vì 1 bước lớn
C. Tăng kích thước sàn
D. Dùng backdrop màu khác
**Đáp án: B**

**Câu 3 (Đúng/Sai):** Kẻ thù trong Platformer nên di chuyển qua lại trên platform và quay đầu khi chạm tường.
**Đáp án: Đúng**

**Câu 4 (Đúng/Sai):** Trong Platformer 3 màn, biến lives nên reset về 3 khi sang màn mới.
**Đáp án: Sai** (Lives được giữ nguyên xuyên suốt các màn, không reset khi lên màn)

**Câu 5 (Điền từ):** Cửa dẫn sang màn tiếp theo thường được vẽ bằng màu ___ và kiểm tra bằng "touching color".
**Đáp án: vàng**

**Câu 6 (Điền từ):** UI hiển thị số màn hiện tại dùng: say (join "Màn: " (___)).
**Đáp án: level**

**Câu 7 (Kéo thả từ):** Điền để xử lý kẻ thù di chuyển qua lại:
forever:
  move (___ steps)
  if touching color [tường]? then
    turn ___ (180) degrees
  if touching [nhân vật]? then
    change [lives] ___ (-1)
Ngân hàng từ: **3 / left / right / by / 180**
**Đáp án: 3 / 180 / by** (turn 180 degrees)

**Câu 8 (Sắp xếp):** Sắp xếp thứ tự hoàn thiện Platformer:
- [ ] Thêm UI: điểm, mạng, số màn
- [ ] Vẽ 3 backdrop màn 1, 2, 3 với platform và màu sàn nhất quán
- [ ] Thêm kẻ thù di chuyển qua lại
- [ ] Thêm vật phẩm cần thu thập và điều kiện qua màn
- [ ] Fix lỗi rung và xuyên sàn nếu có
**Đáp án:** Fix lỗi → Vẽ 3 backdrop → Thêm kẻ thù → Vật phẩm + điều kiện qua màn → UI

**Câu 9 (Nối đôi):** Nối màu trên backdrop với chức năng:
1. Màu nâu — A. Bẫy, mất mạng
2. Màu đỏ — B. Sàn đứng được (platform)
3. Màu vàng — C. Tường không đi qua được
4. Màu xanh — D. Cửa dẫn sang màn tiếp theo
**Đáp án: 1-B, 2-A, 3-D, 4-C**

**Câu 10 (Trắc nghiệm):** Lỗi phổ biến nhất cần kiểm tra khi demo Platformer là:
A. Nhân vật không đổi costume
B. Nhân vật rung hoặc xuyên sàn trong một số tình huống
C. Backdrop không có màu đẹp
D. Điểm số hiển thị sai vị trí
**Đáp án: B**

### BÀI TẬP THỰC HÀNH

**Bài 1:** Tạo project "Fix lỗi Platformer" — Tạo tình huống lỗi rung và xuyên sàn. Sau đó sửa: thêm vòng lặp đẩy ra từng pixel (repeat until not touching color), kiểm tra vy không quá lớn (if vy < -10 then set vy to -10).

**Bài 2:** Tạo project "Platformer 3 màn" — Vẽ 3 backdrop với platform và màu sắc nhất quán. Màn 1: dễ (ít platform, kẻ thù chậm). Màn 2: trung bình. Màn 3: khó (platform hẹp hơn, kẻ thù nhanh hơn). Qua cửa vàng chuyển màn.

**Bài 3:** Tạo project "Platformer hoàn chỉnh" — Thêm: start screen, game over screen (lives=0), win screen (qua màn 3), nhạc nền, âm thanh nhảy, âm thanh nhặt xu, hiệu ứng mất mạng. Hiển thị đầy đủ: điểm, lives, số màn.

---

## BUỔI 6: PLATFORMER GAME — DEMO & PHÂN TÍCH

### CÂU HỎI ÔN TẬP

**Câu 1 (Trắc nghiệm):** Để Platformer ấn tượng trong thi, yếu tố nào quan trọng nhất?
A. Hệ thống trọng lực mượt, không rung, không xuyên sàn
B. Backdrop đẹp với nhiều màu sắc
C. Có nhiều loại kẻ thù
D. Có nhiều âm thanh
**Đáp án: A**

**Câu 2 (Trắc nghiệm):** So với Catching Game, Platformer mất thêm bao nhiêu thời gian để hoàn thành trong thi?
A. Ít hơn (dễ hơn)
B. Bằng nhau
C. Nhiều hơn khoảng 30–40 phút
D. Nhiều hơn gấp 3 lần
**Đáp án: C** (Catching ~45 phút, Platformer ~80 phút theo bảng so sánh GĐ3)

**Câu 3 (Đúng/Sai):** Nên chọn làm Platformer khi không tự tin về cơ chế trọng lực.
**Đáp án: Sai** (Chỉ chọn Platformer khi TỰ TIN về trọng lực)

**Câu 4 (Đúng/Sai):** Platformer và Maze Game đều dùng kỹ thuật "touching color" để xử lý va chạm với môi trường.
**Đáp án: Đúng**

**Câu 5 (Điền từ):** Lỗi "nhân vật bị kẹt trong tường" trong Platformer thường do bước di chuyển quá ___, cần giảm số pixel mỗi bước.
**Đáp án: lớn**

**Câu 6 (Điền từ):** Khi vẽ backdrop cho Platformer, cần đảm bảo màu sàn ___ ở tất cả các màn để touching color hoạt động đúng.
**Đáp án: nhất quán / giống nhau**

**Câu 7 (Kéo thả từ):** Điền đánh giá ưu/nhược điểm:
Platformer — Ưu điểm: ___, Nhược điểm: ___
Catching — Ưu điểm: ___, Nhược điểm: ___
Ngân hàng từ: **ấn tượng / phức tạp / dễ code / ít ấn tượng hơn**
**Đáp án: Platformer: ấn tượng / phức tạp; Catching: dễ code / ít ấn tượng hơn**

**Câu 8 (Sắp xếp):** Sắp xếp checklist kiểm tra Platformer trước khi nộp thi:
- [ ] Vật phẩm thu thập và điểm số hoạt động đúng
- [ ] Test chơi từ đầu đến cuối không bị lỗi
- [ ] Nhân vật không rung và không xuyên sàn
- [ ] Tất cả 3 màn hoạt động, cửa vàng chuyển màn đúng
- [ ] Biến reset khi chơi lại
**Đáp án:** Nhân vật không rung/xuyên → 3 màn + cửa vàng → Vật phẩm + điểm → Biến reset → Test toàn bộ

**Câu 9 (Nối đôi):** Nối vấn đề với giải pháp trong Platformer:
1. Nhân vật rung trên sàn — A. Giới hạn vy tối thiểu (if vy < -10 then set vy to -10)
2. Nhân vật xuyên sàn — B. repeat until not touching color: change y by 1
3. Nhân vật kẹt trong tường — C. Giảm pixel di chuyển ngang xuống 2-3px
4. Rơi quá nhanh — D. Điều chỉnh trọng lực nhỏ hơn (change vy by -0.5)
**Đáp án: 1-B, 2-A, 3-C, 4-D**

**Câu 10 (Trắc nghiệm):** Khi nào nên chọn Platformer trong bài thi?
A. Khi đề yêu cầu nhân vật bắt vật rơi
B. Khi đề mô tả nhân vật di chuyển và nhảy, có sàn/platform rõ ràng, và em đã thành thạo trọng lực
C. Khi đề có quiz câu hỏi
D. Khi chỉ còn 30 phút
**Đáp án: B**

### BÀI TẬP THỰC HÀNH

**Bài 1:** Tạo project "Phân tích Platformer" — Mở game Platformer đã làm, liệt kê ít nhất 5 điểm có thể cải thiện (lỗi kỹ thuật, trải nghiệm người chơi, thiếu tính năng). Sửa ít nhất 3 điểm trong số đó.

**Bài 2:** Tạo project "Platformer tốc ký" — Làm lại Platformer 1 màn từ đầu nhưng lần này tự đặt bộ đồng hồ: thử hoàn thành trong 30 phút (cốt lõi đúng, di chuyển ổn, 1 màn). So sánh với lần đầu làm.

**Bài 3:** Tạo project "So sánh thể loại" — Tạo 2 mini-game: 1 Catching mini (1 phút) và 1 Platformer mini (1 phút). So sánh thời gian code, độ phức tạp, và ấn tượng. Viết nhận xét trong phần "Notes" của dự án.

---

## BUỔI 7: MAZE GAME — CỐT LÕI

### CÂU HỎI ÔN TẬP

**Câu 1 (Trắc nghiệm):** Trong Maze Game, nhân vật nên di chuyển mấy hướng?
A. 2 hướng (trái/phải)
B. 3 hướng
C. 4 hướng (trái/phải/lên/xuống)
D. 8 hướng
**Đáp án: C**

**Câu 2 (Trắc nghiệm):** Để nhân vật không đi xuyên tường trong Maze, sau khi di chuyển cần kiểm tra:
A. if touching [tường sprite]?
B. if touching color [màu tường]? then di chuyển ngược lại
C. if on edge, bounce
D. set x to (0)
**Đáp án: B**

**Câu 3 (Đúng/Sai):** Mỗi bước di chuyển trong Maze nên nhỏ (2–3 pixels) để tránh nhân vật bị kẹt trong tường.
**Đáp án: Đúng**

**Câu 4 (Đúng/Sai):** Màu tường trong maze phải giống hệt nhau ở tất cả các màn để touching color hoạt động.
**Đáp án: Đúng**

**Câu 5 (Điền từ):** Khi nhân vật chạm bẫy đỏ trong maze, cần trừ mạng và ___ nhân vật về vị trí xuất phát.
**Đáp án: reset / go to (vị trí ban đầu)**

**Câu 6 (Điền từ):** Cửa ra của maze thường được vẽ bằng màu ___ và kiểm tra bằng "touching color [vàng]?".
**Đáp án: vàng**

**Câu 7 (Kéo thả từ):** Điền để nhân vật di chuyển trong maze không xuyên tường:
if key [right arrow] pressed: change x ___ (3), if touching color [xanh]? then change x ___ (-3)
if key [left arrow] pressed: change x ___ (-3), if touching color [xanh]? then change x ___ (3)
Ngân hàng từ: **by / by / by / by**
**Đáp án: by / by / by / by** (tất cả đều là "by")

**Câu 8 (Sắp xếp):** Sắp xếp bước code Maze cốt lõi:
- [ ] Kiểm tra touching color [đỏ] → mất mạng + reset vị trí
- [ ] Nhân vật di chuyển 4 hướng
- [ ] Kiểm tra touching color [tường] → đẩy ngược
- [ ] Kiểm tra touching color [vàng] → qua màn
- [ ] Vẽ maze backdrop với màu sắc rõ ràng
**Đáp án:** Vẽ maze → Di chuyển 4 hướng → Đẩy ngược khi chạm tường → Kiểm tra bẫy đỏ → Kiểm tra cửa vàng

**Câu 9 (Nối đôi):** Nối màu với chức năng trong Maze Game:
1. Màu xanh lá — A. Đường đi bình thường
2. Màu đỏ — B. Bẫy, mất mạng
3. Màu vàng — C. Tường, không đi qua
4. Màu trắng/nền — D. Cửa ra, qua màn
**Đáp án: 1-C, 2-B, 3-D, 4-A**

**Câu 10 (Trắc nghiệm):** Phần khó nhất khi làm Maze Game là:
A. Code logic di chuyển
B. Vẽ backdrop maze chính xác và căn chỉnh màu sắc touching color
C. Thêm điểm số
D. Tạo timer
**Đáp án: B**

### BÀI TẬP THỰC HÀNH

**Bài 1:** Tạo project "Maze đơn giản" — Vẽ maze 1 màn với tường màu xanh, cửa vàng. Nhân vật di chuyển 4 hướng, không xuyên tường (đẩy ngược). Chạm cửa vàng → "Bạn thoát ra rồi!".

**Bài 2:** Tạo project "Maze có bẫy" — Thêm vào Bài 1: bẫy đỏ (5 vị trí trong maze), khi chạm bẫy -1 mạng và reset vị trí. Lives=3. Timer 60s. Hiển thị lives và time.

**Bài 3:** Tạo project "Maze thu thập" — Thêm 5 chìa khóa (sprite nhỏ) ẩn trong maze. Phải thu thập đủ 5 chìa trước khi cửa vàng mở (biến keys_collected). Cửa vàng chỉ tác dụng khi keys_collected = 5.

---

## BUỔI 8: MAZE GAME — HOÀN THIỆN

### CÂU HỎI ÔN TẬP

**Câu 1 (Trắc nghiệm):** Kẻ thù tuần tra trong Maze nên di chuyển như thế nào?
A. Ngẫu nhiên hoàn toàn
B. Theo đường cố định qua lại trong maze, quay đầu khi chạm tường
C. Đứng yên tại chỗ
D. Theo dõi và đuổi nhân vật
**Đáp án: B**

**Câu 2 (Trắc nghiệm):** Để qua màn trong Maze Game nâng cao, điều kiện nào phổ biến?
A. Chỉ cần đến cửa vàng
B. Thu thập đủ số lượng vật phẩm VÀ đến cửa vàng
C. Tiêu diệt tất cả kẻ thù
D. Hết thời gian
**Đáp án: B**

**Câu 3 (Đúng/Sai):** Mỗi maze backdrop phải được vẽ riêng biệt với màu sắc tường nhất quán để touching color hoạt động đúng.
**Đáp án: Đúng**

**Câu 4 (Đúng/Sai):** Kẻ thù tuần tra có thể va chạm với tường maze và bị kẹt nếu không xử lý đúng.
**Đáp án: Đúng**

**Câu 5 (Điền từ):** Biến ___ đếm số vật phẩm đã thu thập. Khi = số vật phẩm cần thu, cửa vàng mới có tác dụng.
**Đáp án: keys_collected / items_collected (tên biến bất kỳ)**

**Câu 6 (Điền từ):** Lỗi "nhân vật bị kẹt trong tường" thường xảy ra khi bước di chuyển quá lớn. Cách sửa: giảm bước xuống ___ pixels và thêm vòng lặp repeat đẩy ra từng bước.
**Đáp án: 2-3 / nhỏ hơn**

**Câu 7 (Kéo thả từ):** Điền để tạo điều kiện qua màn có thu thập vật phẩm:
if touching color [vàng]? and (___ = 5) then:
  change [level] ___ (1)
  switch backdrop to (join "maze" (___))
  set [keys_collected] ___ (0)
Ngân hàng từ: **keys_collected / by / level / to**
**Đáp án: keys_collected / by / level / to**

**Câu 8 (Sắp xếp):** Sắp xếp thứ tự hoàn thiện Maze Game:
- [ ] Thêm timer + UI điểm, mạng, màn
- [ ] Vẽ 3 maze backdrop độ khó tăng dần
- [ ] Fix lỗi kẹt tường (nếu có)
- [ ] Thêm kẻ thù tuần tra trong maze
- [ ] Thêm vật phẩm cần thu thập, điều kiện qua màn
**Đáp án:** Fix lỗi → Vẽ 3 maze → Kẻ thù tuần tra → Vật phẩm + điều kiện → Timer + UI

**Câu 9 (Nối đôi):** Nối kỹ thuật với ứng dụng trong Maze Game:
1. touching color [tường] — A. Điều kiện qua màn
2. touching color [bẫy] — B. Không đi xuyên tường
3. touching color [cửa] và keys=N — C. Mất mạng, reset vị trí
4. touching [kẻ thù] — D. Mất mạng, kẻ thù tiếp tục tuần tra
**Đáp án: 1-B, 2-C, 3-A, 4-D**

**Câu 10 (Trắc nghiệm):** Maze Game có ưu điểm nào so với Platformer?
A. Phức tạp hơn
B. Logic game đơn giản hơn, không cần xử lý trọng lực
C. Ấn tượng hơn trong thi
D. Dùng ít sprite hơn
**Đáp án: B**

### BÀI TẬP THỰC HÀNH

**Bài 1:** Tạo project "3 Maze backdrop" — Vẽ 3 maze backdrop tăng độ phức tạp: Maze 1 đơn giản (đường thẳng ít ngoặt), Maze 2 có nhánh rẽ, Maze 3 có nhiều ngã rẽ. Màu sắc nhất quán.

**Bài 2:** Tạo project "Maze Game hoàn chỉnh" — Từ maze 3 màn, thêm: 5 chìa mỗi màn (reset khi sang màn mới), kẻ thù tuần tra mỗi màn, timer 60 giây, 3 mạng, điểm số (+10 mỗi chìa). Điều kiện qua màn: 5 chìa + cửa vàng.

**Bài 3:** Tạo project "Maze nâng cao" — Thêm vào game: kẻ thù tốc độ tăng theo màn (level*speed), hint hệ thống: nhấn H để hiện đường đi ngắn nhất (sprite mũi tên), vật phẩm hồi thời gian (+10 giây). 3 màn hình start/game/end.

---

## BUỔI 9: MAZE GAME — DEMO & PHÂN TÍCH

### CÂU HỎI ÔN TẬP

**Câu 1 (Trắc nghiệm):** So với Platformer và Catching, Maze Game ở vị trí nào về độ khó code?
A. Khó hơn cả Platformer
B. Dễ hơn Catching
C. Dễ về logic game nhưng khó về việc vẽ backdrop và căn chỉnh màu
D. Bằng Platformer
**Đáp án: C**

**Câu 2 (Trắc nghiệm):** Lỗi hay gặp nhất khi test Maze Game là:
A. Nhân vật xuyên tường ở một số góc cụ thể
B. Timer chạy quá nhanh
C. Nhạc nền không phát
D. Điểm số hiển thị sai
**Đáp án: A**

**Câu 3 (Đúng/Sai):** Nếu màu tường có nhiều sắc thái khác nhau (do vẽ không đều), touching color có thể không nhận ra một số vị trí.
**Đáp án: Đúng**

**Câu 4 (Đúng/Sai):** Maze Game có thể kết hợp với hệ thống điểm (thu thập vật phẩm) để game phong phú hơn.
**Đáp án: Đúng**

**Câu 5 (Điền từ):** Để test xem touching color có hoạt động đúng không, cần dùng khối ___ (tên màu) để sprite nói ra giá trị true/false trong khi chạy thử.
**Đáp án: say (touching color [màu]?)**

**Câu 6 (Điền từ):** Khi vẽ maze bằng Paint editor, nên dùng công cụ ___ để tô màu vùng lớn đồng đều thay vì vẽ từng pixel.
**Đáp án: Fill (Bucket tool / tô màu)**

**Câu 7 (Kéo thả từ):** Nối thể loại với thời gian ước tính:
Catching: ___ phút; Platformer: ___ phút; Maze: ___ phút; Shooting: ___ phút
Ngân hàng từ: **45 / 80 / 50 / 60**
**Đáp án: Catching: 45 / Platformer: 80 / Maze: 50 / Shooting: 60**

**Câu 8 (Sắp xếp):** Sắp xếp bước kiểm tra Maze Game trước khi nộp:
- [ ] Kiểm tra màu tường đồng đều, touching color hoạt động
- [ ] Test chạy qua cả 3 màn không lỗi
- [ ] Kiểm tra kẻ thù không bị kẹt
- [ ] Kiểm tra biến reset khi chơi lại
- [ ] Test nhân vật không xuyên tường ở các góc
**Đáp án:** Màu tường đồng đều → Không xuyên tường ở góc → Kẻ thù không kẹt → Test 3 màn → Biến reset

**Câu 9 (Nối đôi):** Nối lỗi Maze với cách sửa:
1. Nhân vật xuyên tường góc — A. Tô lại màu bằng Fill tool đồng đều
2. Nhân vật bị kẹt trong tường — B. Giảm bước di chuyển xuống 2px
3. Touching color không nhận — C. Tăng bước di chuyển lên 3-4px
4. Kẻ thù bị kẹt — D. Đặt điểm spawn kẻ thù trong đường đi, không trong tường
**Đáp án: 1-C, 2-B, 3-A, 4-D**

**Câu 10 (Trắc nghiệm):** Khi nào nên chọn Maze thay vì Catching trong bài thi?
A. Khi đề mô tả nhân vật tìm đường qua mê cung hoặc né tường
B. Khi đề yêu cầu bắt vật rơi từ trên
C. Khi chỉ còn 20 phút
D. Maze không bao giờ xuất hiện trong đề thi D1
**Đáp án: A**

### BÀI TẬP THỰC HÀNH

**Bài 1:** Tạo project "Maze Debug marathon" — Vẽ 1 maze có 5 chỗ lỗi cố tình: 3 chỗ tường màu không đồng đều, 2 chỗ góc có thể xuyên qua. Tự tìm và sửa tất cả 5 lỗi.

**Bài 2:** Tạo project "Maze tốc ký" — Làm Maze 1 màn từ đầu trong 20 phút: vẽ maze, code di chuyển không xuyên tường, thêm cửa vàng và timer. Đánh giá xem có kịp thêm gì nữa không.

**Bài 3:** Tạo project "Maze sáng tạo" — Tạo Maze Game với chủ đề đặc biệt: không gian, dưới nước, hay ma quái. Maze có cơ chế đặc biệt (ví dụ: cửa mở khi nhấn nút, tường vô hình xuất hiện theo thời gian). 2 màn hình.

---

## BUá»”I 10: SHOOTING GAME â€” Cá»T LÃ•I

### CÃ‚U Há»ŽI Ã”N Táº¬P

**CÃ¢u 1 (Tráº¯c nghiá»‡m):** Trong Shooting Game, Ä‘áº¡n nÃªn Ä‘Æ°á»£c táº¡o báº±ng cÃ¡ch nÃ o?
A. Sprite Ä‘áº¡n di chuyá»ƒn tá»« tá»«
B. Sprite Ä‘áº¡n áº©n, khi báº¯n táº¡o clone di chuyá»ƒn nhanh
C. DÃ¹ng hiá»‡u á»©ng Ä‘á»“ há»a thay vÃ¬ sprite tháº­t
D. Váº½ Ä‘áº¡n trá»±c tiáº¿p lÃªn backdrop
**ÄÃ¡p Ã¡n: B**

**CÃ¢u 2 (Tráº¯c nghiá»‡m):** Káº» thÃ¹ trong Shooting Game cÅ©ng nÃªn dÃ¹ng clone vÃ¬:
A. Clone Ä‘áº¹p hÆ¡n sprite thÆ°á»ng
B. Cáº§n nhiá»u káº» thÃ¹ cÃ¹ng lÃºc, clone tiáº¿t kiá»‡m sá»‘ lÆ°á»£ng sprite
C. Sprite thÆ°á»ng khÃ´ng thá»ƒ di chuyá»ƒn
D. Scratch yÃªu cáº§u nhÆ° váº­y
**ÄÃ¡p Ã¡n: B**

**CÃ¢u 3 (ÄÃºng/Sai):** Khi Ä‘áº¡n trÃºng káº» thÃ¹, cáº§n xÃ³a cáº£ Ä‘áº¡n láº«n káº» thÃ¹ (hoáº·c trá»« HP káº» thÃ¹) Ä‘á»ƒ trÃ¡nh va cháº¡m nhiá»u láº§n.
**ÄÃ¡p Ã¡n: ÄÃºng**

**CÃ¢u 4 (ÄÃºng/Sai):** Clone Ä‘áº¡n cáº§n xÃ³a ngay khi ra khá»i mÃ n hÃ¬nh Ä‘á»ƒ khÃ´ng vÆ°á»£t quÃ¡ giá»›i háº¡n 300 clone.
**ÄÃ¡p Ã¡n: ÄÃºng**

**CÃ¢u 5 (Äiá»n tá»«):** Äá»ƒ káº» thÃ¹ khÃ´ng bá»‹ trÃºng Ä‘áº¡n nhiá»u láº§n trong má»™t frame, dÃ¹ng biáº¿n ___ = 1 ngay khi bá»‹ trÃºng láº§n Ä‘áº§u.
**ÄÃ¡p Ã¡n: hit / invincible**

**CÃ¢u 6 (Äiá»n tá»«):** NhÃ¢n váº­t báº¯n Ä‘áº¡n khi nháº¥n phÃ­m Space: khi Space Ä‘Æ°á»£c nháº¥n â†’ ___ clone of [Ä‘áº¡n] tá»« vá»‹ trÃ­ nhÃ¢n váº­t.
**ÄÃ¡p Ã¡n: create**

**CÃ¢u 7 (KÃ©o tháº£ tá»«):** Äiá»n Ä‘á»ƒ táº¡o há»‡ thá»‘ng báº¯n-trÃºng cÆ¡ báº£n:
Äáº¡n clone: go to [nhÃ¢n váº­t] â†’ forever: move 10 â†’ if ___ [káº» thÃ¹]? then: ___ "hit" â†’ ___ this clone; if y > 180 then delete
Káº» thÃ¹: when I receive "hit" â†’ change [score] by (10) â†’ ___
NgÃ¢n hÃ ng tá»«: **touching / broadcast / delete / hide**
**ÄÃ¡p Ã¡n: touching / broadcast / delete / hide**

**CÃ¢u 8 (Sáº¯p xáº¿p):** Sáº¯p xáº¿p bÆ°á»›c code Shooting Game cá»‘t lÃµi:
- [ ] Káº» thÃ¹ clone rÆ¡i xuá»‘ng vÃ  kiá»ƒm tra cháº¡m nhÃ¢n váº­t
- [ ] Äáº¡n clone di chuyá»ƒn lÃªn, kiá»ƒm tra cháº¡m káº» thÃ¹
- [ ] NhÃ¢n váº­t di chuyá»ƒn trÃ¡i/pháº£i + báº¯n khi Space
- [ ] Sprite Ä‘áº¡n vÃ  káº» thÃ¹ gá»‘c Ä‘á»u áº©n
- [ ] Xá»­ lÃ½ va cháº¡m: Ä‘áº¡n+káº» thÃ¹ â†’ +Ä‘iá»ƒm, káº» thÃ¹+nhÃ¢n váº­t â†’ -máº¡ng
**ÄÃ¡p Ã¡n:** Sprite gá»‘c áº©n â†’ NhÃ¢n váº­t di chuyá»ƒn + báº¯n â†’ Äáº¡n di chuyá»ƒn + kiá»ƒm tra â†’ Káº» thÃ¹ rÆ¡i + kiá»ƒm tra â†’ Xá»­ lÃ½ va cháº¡m

**CÃ¢u 9 (Ná»‘i Ä‘Ã´i):** Ná»‘i sá»± kiá»‡n vá»›i káº¿t quáº£ trong Shooting Game:
1. Äáº¡n cháº¡m káº» thÃ¹ â€” A. Äáº¡n xÃ³a, khÃ´ng tÃ¡c dá»¥ng
2. Káº» thÃ¹ cháº¡m nhÃ¢n váº­t â€” B. +Ä‘iá»ƒm, xÃ³a Ä‘áº¡n, káº» thÃ¹ áº©n/xÃ³a
3. Äáº¡n ra ngoÃ i mÃ n hÃ¬nh â€” C. -1 máº¡ng, invincible 2 giÃ¢y
4. Káº» thÃ¹ ra dÆ°á»›i mÃ n hÃ¬nh â€” D. XÃ³a clone káº» thÃ¹ (bá» lá»¡)
**ÄÃ¡p Ã¡n: 1-B, 2-C, 3-A, 4-D**

**CÃ¢u 10 (Tráº¯c nghiá»‡m):** Váº¥n Ä‘á» clone khi cÃ³ quÃ¡ nhiá»u Ä‘áº¡n vÃ  káº» thÃ¹ Ä‘á»“ng thá»i lÃ :
A. Äáº¡n vÃ  káº» thÃ¹ va cháº¡m sai vá»‹ trÃ­
B. Sá»‘ clone cÃ³ thá»ƒ vÆ°á»£t 300, gÃ¢y game Ä‘Ã³ng bÄƒng
C. Äiá»ƒm sá»‘ tÃ­nh sai
D. Ã‚m thanh bá»‹ mÃ©o
**ÄÃ¡p Ã¡n: B**

### BÃ€I Táº¬P THá»°C HÃ€NH

**BÃ i 1:** Táº¡o project "Shooting cá»‘t lÃµi" â€” NhÃ¢n váº­t di chuyá»ƒn trÃ¡i/pháº£i. Nháº¥n Space báº¯n Ä‘áº¡n clone bay lÃªn. Káº» thÃ¹ clone rÆ¡i xuá»‘ng má»—i 1.5 giÃ¢y. Äáº¡n trÃºng káº» thÃ¹: +10 Ä‘iá»ƒm, xÃ³a cáº£ hai. Káº» thÃ¹ cháº¡m nhÃ¢n váº­t: -1 máº¡ng. Lives=3.

**BÃ i 2:** Táº¡o project "Shooting cÃ³ giá»›i háº¡n Ä‘áº¡n" â€” ThÃªm biáº¿n ammo=15 (Ä‘áº¡n). Má»—i láº§n báº¯n -1 ammo. ammo=0 khÃ´ng báº¯n Ä‘Æ°á»£c. CÃ³ váº­t pháº©m Ä‘áº¡n rÆ¡i xuá»‘ng (+5 ammo). Hiá»ƒn thá»‹ ammo trÃªn mÃ n hÃ¬nh.

**BÃ i 3:** Táº¡o project "Shooting káº» thÃ¹ pattern" â€” Káº» thÃ¹ cÃ³ 2 loáº¡i: loáº¡i 1 rÆ¡i tháº³ng (item_type=1), loáº¡i 2 di chuyá»ƒn zigzag (item_type=2, change x by 3 rá»“i Ä‘áº£o chiá»u má»—i 30 bÆ°á»›c). TiÃªu diá»‡t loáº¡i 2 Ä‘Æ°á»£c nhiá»u Ä‘iá»ƒm hÆ¡n.

---

## BUá»”I 11: SHOOTING GAME â€” HOÃ€N THIá»†N

### CÃ‚U Há»ŽI Ã”N Táº¬P

**CÃ¢u 1 (Tráº¯c nghiá»‡m):** Káº» thÃ¹ "boss" trong Shooting Game cáº§n bao nhiÃªu Ä‘áº¡n má»›i tiÃªu diá»‡t?
A. LuÃ´n luÃ´n 1 Ä‘áº¡n
B. Phá»¥ thuá»™c vÃ o biáº¿n HP (health points) cá»§a boss, thÆ°á»ng 3â€“5 Ä‘áº¡n
C. KhÃ´ng thá»ƒ tiÃªu diá»‡t
D. Ngáº«u nhiÃªn má»—i láº§n
**ÄÃ¡p Ã¡n: B**

**CÃ¢u 2 (Tráº¯c nghiá»‡m):** Wave system trong Shooting Game hoáº¡t Ä‘á»™ng tháº¿ nÃ o?
A. Káº» thÃ¹ xuáº¥t hiá»‡n liÃªn tá»¥c khÃ´ng theo wave
B. Cá»© Ä‘á»§ Ä‘iá»ƒm (hoáº·c tiÃªu diá»‡t Ä‘á»§ káº» thÃ¹) thÃ¬ wave má»›i báº¯t Ä‘áº§u vá»›i sá»‘ lÆ°á»£ng nhiá»u hÆ¡n, nhanh hÆ¡n
C. Wave Ä‘áº·t theo giá» thá»±c
D. Chá»‰ cÃ³ 1 wave duy nháº¥t
**ÄÃ¡p Ã¡n: B**

**CÃ¢u 3 (ÄÃºng/Sai):** Power-up "báº¯n 3 hÆ°á»›ng" táº¡o 3 clone Ä‘áº¡n cÃ¹ng lÃºc vá»›i gÃ³c -15, 0, +15 Ä‘á»™.
**ÄÃ¡p Ã¡n: ÄÃºng**

**CÃ¢u 4 (ÄÃºng/Sai):** Biáº¿n HP cá»§a káº» thÃ¹ boss nÃªn lÃ  "For all sprites" Ä‘á»ƒ táº¥t cáº£ Ä‘áº¡n cÃ³ thá»ƒ giáº£m HP.
**ÄÃ¡p Ã¡n: Sai** (HP nÃªn lÃ  "For this sprite only" â€” má»—i boss clone cÃ³ HP riÃªng)

**CÃ¢u 5 (Äiá»n tá»«):** Äá»ƒ giá»›i háº¡n sá»‘ Ä‘áº¡n clone tá»‘i Ä‘a tá»“n táº¡i cÃ¹ng lÃºc (trÃ¡nh lag), dÃ¹ng biáº¿n ___ Ä‘áº¿m sá»‘ Ä‘áº¡n hiá»‡n táº¡i, khÃ´ng cho báº¯n khi Ä‘Ã£ Ä‘áº¡t giá»›i háº¡n.
**ÄÃ¡p Ã¡n: bullet_count (hoáº·c ammo_count)**

**CÃ¢u 6 (Äiá»n tá»«):** Khi nháº·t power-up shield, nhÃ¢n váº­t Ä‘Æ°á»£c ___ táº¡m thá»i â€” káº» thÃ¹ cháº¡m khÃ´ng trá»« máº¡ng trong thá»i gian Ä‘Ã³.
**ÄÃ¡p Ã¡n: báº¥t tá»­ / shield / invincible**

**CÃ¢u 7 (KÃ©o tháº£ tá»«):** Äiá»n Ä‘á»ƒ táº¡o há»‡ thá»‘ng boss cÃ³ HP:
when I start as a clone:
set [hp] to (3)
when I receive "hit":
  change [hp] ___ (-1)
  if (hp <= 0) then: change [score] ___ (50) â†’ ___
NgÃ¢n hÃ ng tá»«: **by / by / delete this clone / hide**
**ÄÃ¡p Ã¡n: by / by / delete this clone**

**CÃ¢u 8 (Sáº¯p xáº¿p):** Sáº¯p xáº¿p tÃ­nh nÄƒng nÃ¢ng cao cho Shooting Game theo thá»© tá»± thÃªm vÃ o:
- [ ] UI: Ä‘iá»ƒm, máº¡ng, sá»‘ wave
- [ ] Boss káº» thÃ¹ vá»›i HP 3 Ä‘áº¡n
- [ ] Wave system (wave 1: 5 káº» thÃ¹, wave 2: 8 káº» thÃ¹ nhanh hÆ¡n)
- [ ] Power-up ngáº«u nhiÃªn: báº¯n 3 hÆ°á»›ng, Ä‘áº¡n to, shield
**ÄÃ¡p Ã¡n:** Wave system â†’ Boss vá»›i HP â†’ Power-up â†’ UI

**CÃ¢u 9 (Ná»‘i Ä‘Ã´i):** Ná»‘i power-up vá»›i tÃ¡c dá»¥ng:
1. Triple shot â€” A. NhÃ¢n váº­t khÃ´ng máº¥t máº¡ng trong 5 giÃ¢y
2. Big bullet â€” B. Táº¡o 3 clone Ä‘áº¡n cÃ¹ng lÃºc theo 3 hÆ°á»›ng
3. Shield â€” C. Äáº¡n to, cÃ³ thá»ƒ trÃºng nhiá»u káº» thÃ¹
4. Speed up â€” D. NhÃ¢n váº­t di chuyá»ƒn nhanh hÆ¡n 2x
**ÄÃ¡p Ã¡n: 1-B, 2-C, 3-A, 4-D**

**CÃ¢u 10 (Tráº¯c nghiá»‡m):** Äá»ƒ trÃ¡nh lag khi cÃ³ nhiá»u clone Ä‘áº¡n, cáº§n:
A. DÃ¹ng sprite nhá» hÆ¡n cho Ä‘áº¡n
B. Giá»›i háº¡n 5â€“10 Ä‘áº¡n tá»“n táº¡i cÃ¹ng lÃºc, xÃ³a ngay khi ra ngoÃ i
C. LÃ m Ä‘áº¡n bay cháº­m hÆ¡n
D. Giáº£m sá»‘ lÆ°á»£ng káº» thÃ¹
**ÄÃ¡p Ã¡n: B**

### BÃ€I Táº¬P THá»°C HÃ€NH

**BÃ i 1:** Táº¡o project "Shooting vá»›i boss" â€” ThÃªm káº» thÃ¹ boss (to hÆ¡n, hp=3) xuáº¥t hiá»‡n má»—i 5 káº» thÆ°á»ng. Boss cáº§n 3 Ä‘áº¡n, káº» thÆ°á»ng 1 Ä‘áº¡n. Boss cháº¿t +50 Ä‘iá»ƒm. DÃ¹ng biáº¿n hp (For this sprite only).

**BÃ i 2:** Táº¡o project "Wave system" â€” Wave 1: 5 káº» thÃ¹ tá»‘c Ä‘á»™ cháº­m. Wave 2 (khi háº¿t wave 1): 8 káº» thÃ¹ nhanh hÆ¡n. Wave 3: 12 káº» thÃ¹ + 1 boss. Hiá»ƒn thá»‹ sá»‘ wave hiá»‡n táº¡i. Tháº¯ng khi qua wave 3.

**BÃ i 3:** Táº¡o project "Shooting hoÃ n chá»‰nh" â€” TÃ­ch há»£p: wave system (3 wave), boss vá»›i HP, 2 power-up (triple shot, shield), giá»›i háº¡n 8 clone Ä‘áº¡n cÃ¹ng lÃºc, 3 mÃ n hÃ¬nh start/game/end, nháº¡c ná»n + Ã¢m thanh Ä‘áº§y Ä‘á»§.

---

## BUá»”I 12: SHOOTING GAME â€” DEMO & PHÃ‚N TÃCH

### CÃ‚U Há»ŽI Ã”N Táº¬P

**CÃ¢u 1 (Tráº¯c nghiá»‡m):** Lá»—i phá»• biáº¿n nháº¥t khi lÃ m Shooting Game lÃ :
A. NhÃ¢n váº­t khÃ´ng báº¯n Ä‘Æ°á»£c
B. Äáº¡n trÃºng káº» thÃ¹ nhiá»u láº§n (1 Ä‘áº¡n trá»« nhiá»u HP hoáº·c cá»™ng nhiá»u Ä‘iá»ƒm)
C. Káº» thÃ¹ khÃ´ng di chuyá»ƒn
D. Backdrop khÃ´ng Ä‘áº¹p
**ÄÃ¡p Ã¡n: B**

**CÃ¢u 2 (Tráº¯c nghiá»‡m):** Shooting Game Ä‘Æ°á»£c Ä‘Ã¡nh giÃ¡ nhÆ° tháº¿ nÃ o trong 5 thá»ƒ loáº¡i?
A. Dá»… nháº¥t
B. áº¤n tÆ°á»£ng cao nhÆ°ng clone nhiá»u dá»… gÃ¢y lag
C. Ãt áº¥n tÆ°á»£ng nháº¥t
D. KhÃ´ng phÃ¹ há»£p cho thi D1
**ÄÃ¡p Ã¡n: B**

**CÃ¢u 3 (ÄÃºng/Sai):** Lá»—i "1 Ä‘áº¡n cá»™ng Ä‘iá»ƒm 2 láº§n" xáº£y ra khi Ä‘áº¡n cháº¡m káº» thÃ¹ nhÆ°ng khÃ´ng xÃ³a ngay, frame tiáº¿p theo váº«n touching.
**ÄÃ¡p Ã¡n: ÄÃºng**

**CÃ¢u 4 (ÄÃºng/Sai):** Giáº£i phÃ¡p cho lá»—i "Ä‘áº¡n cá»™ng Ä‘iá»ƒm nhiá»u láº§n" lÃ  thÃªm biáº¿n "hit" = 1 ngay khi xá»­ lÃ½, kiá»ƒm tra if hit = 0 trÆ°á»›c khi xá»­ lÃ½.
**ÄÃ¡p Ã¡n: ÄÃºng**

**CÃ¢u 5 (Äiá»n tá»«):** Äá»ƒ debug lá»—i "Ä‘iá»ƒm tÄƒng báº¥t thÆ°á»ng", cÃ³ thá»ƒ dÃ¹ng khá»‘i ___ (score) Ä‘á»ƒ theo dÃµi Ä‘iá»ƒm thay Ä‘á»•i trong khi game cháº¡y.
**ÄÃ¡p Ã¡n: say**

**CÃ¢u 6 (Äiá»n tá»«):** Khi game lag nhiá»u, báº­t "show" táº¥t cáº£ biáº¿n Ä‘á»ƒ quan sÃ¡t â€” náº¿u biáº¿n ___ tÄƒng liÃªn tá»¥c khÃ´ng dá»«ng, cÃ³ nghÄ©a lÃ  clone Ä‘ang tÃ­ch lÅ©y.
**ÄÃ¡p Ã¡n: sá»‘ clone / bullet_count (hoáº·c báº¥t ká»³ biáº¿n Ä‘áº¿m clone)**

**CÃ¢u 7 (KÃ©o tháº£ tá»«):** Äiá»n lá»—i vÃ  cÃ¡ch sá»­a trong Shooting:
- Äáº¡n cá»™ng Ä‘iá»ƒm 2 láº§n â†’ thÃªm biáº¿n ___ = 1 trÆ°á»›c khi xá»­ lÃ½
- Game lag â†’ giá»›i háº¡n tá»‘i Ä‘a ___ clone Ä‘áº¡n cÃ¹ng lÃºc
- Káº» thÃ¹ boss khÃ´ng cháº¿t â†’ kiá»ƒm tra biáº¿n hp cÃ³ pháº£i ___ khÃ´ng
NgÃ¢n hÃ ng tá»«: **hit / 10 / For this sprite only**
**ÄÃ¡p Ã¡n: hit / 10 / For this sprite only**

**CÃ¢u 8 (Sáº¯p xáº¿p):** Sáº¯p xáº¿p checklist Shooting Game trÆ°á»›c khi ná»™p:
- [ ] Test báº¯n nhanh liÃªn tá»¥c: Ä‘iá»ƒm cÃ³ tÄƒng Ä‘Ãºng khÃ´ng
- [ ] Kiá»ƒm tra sá»‘ clone tá»‘i Ä‘a (báº­t show, quan sÃ¡t)
- [ ] Test tá»« Ä‘áº§u Ä‘áº¿n cuá»‘i qua táº¥t cáº£ wave
- [ ] Kiá»ƒm tra power-up hoáº¡t Ä‘á»™ng Ä‘Ãºng
- [ ] Biáº¿n reset khi chÆ¡i láº¡i
**ÄÃ¡p Ã¡n:** Báº¯n nhanh kiá»ƒm tra Ä‘iá»ƒm â†’ Kiá»ƒm tra sá»‘ clone â†’ Power-up â†’ Test toÃ n bá»™ â†’ Biáº¿n reset

**CÃ¢u 9 (Ná»‘i Ä‘Ã´i):** Ná»‘i triá»‡u chá»©ng vá»›i nguyÃªn nhÃ¢n trong Shooting Game:
1. Äiá»ƒm tÄƒng báº¥t thÆ°á»ng (2x, 3x) â€” A. Thiáº¿u delete clone Ä‘áº¡n sau khi trÃºng
2. Game lag dáº§n sau vÃ i chá»¥c giÃ¢y â€” B. Biáº¿n hit khÃ´ng Ä‘áº·t = 1 sau xá»­ lÃ½
3. Äáº¡n bay qua káº» thÃ¹ khÃ´ng trÃºng â€” C. Tá»‘c Ä‘á»™ Ä‘áº¡n quÃ¡ nhanh, bá» qua hitbox
4. Káº» thÃ¹ "ghost" (khÃ´ng cháº¿t) â€” D. Biáº¿n hp lÃ  For all sprites thay vÃ¬ For this sprite only
**ÄÃ¡p Ã¡n: 1-B, 2-A, 3-C, 4-D**

**CÃ¢u 10 (Tráº¯c nghiá»‡m):** Khi nÃ o nÃªn chá»n Shooting thay vÃ¬ Catching trong bÃ i thi?
A. Khi Ä‘á» mÃ´ táº£ nhÃ¢n váº­t báº¯n tiÃªu diá»‡t káº» thÃ¹ hoáº·c váº­t thá»ƒ
B. Khi Ä‘á» mÃ´ táº£ báº¯t váº­t rÆ¡i
C. Khi Ä‘á» yÃªu cáº§u maze
D. Khi khÃ´ng biáº¿t lÃ m thá»ƒ loáº¡i nÃ o
**ÄÃ¡p Ã¡n: A**

### BÃ€I Táº¬P THá»°C HÃ€NH

**BÃ i 1:** Táº¡o project "Fix Shooting lag" â€” Táº¡o Shooting Game cÃ³ bug cá»‘ Ã½: khÃ´ng giá»›i háº¡n clone Ä‘áº¡n. Quan sÃ¡t game lag sau 30 giÃ¢y. Sau Ä‘Ã³ fix: thÃªm biáº¿n bullet_count, giá»›i háº¡n 8 Ä‘áº¡n. So sÃ¡nh trÆ°á»›c/sau.

**BÃ i 2:** Táº¡o project "Fix Ä‘iá»ƒm Ä‘Ã´i" â€” Táº¡o bug cá»‘ Ã½: Ä‘áº¡n khÃ´ng xÃ³a sau khi trÃºng. Quan sÃ¡t Ä‘iá»ƒm tÄƒng báº¥t thÆ°á»ng. Fix báº±ng biáº¿n hit. Viáº¿t comment giáº£i thÃ­ch cÃ¡ch fix trong code.

**BÃ i 3:** Táº¡o project "Shooting tá»‘c kÃ½" â€” LÃ m Shooting Game cÆ¡ báº£n tá»« Ä‘áº§u trong 25 phÃºt: nhÃ¢n váº­t báº¯n, káº» thÃ¹ rÆ¡i, va cháº¡m + Ä‘iá»ƒm, lives=3, start/end screen. ÄÃ¡nh giÃ¡ pháº§n hoÃ n thÃ nh Ä‘Æ°á»£c.

---

## BUá»”I 13: QUIZ / INTERACTIVE GAME â€” Cá»T LÃ•I

### CÃ‚U Há»ŽI Ã”N Táº¬P

**CÃ¢u 1 (Tráº¯c nghiá»‡m):** Trong Quiz Game, cÃ¢u há»i vÃ  Ä‘Ã¡p Ã¡n Ä‘Ãºng thÆ°á»ng Ä‘Æ°á»£c lÆ°u á»Ÿ Ä‘Ã¢u?
A. Trá»±c tiáº¿p trong tá»«ng script riÃªng biá»‡t
B. Trong 2 list: "questions" vÃ  "answers"
C. Trong biáº¿n toÃ n cá»¥c
D. Trong backdrop
**ÄÃ¡p Ã¡n: B**

**CÃ¢u 2 (Tráº¯c nghiá»‡m):** Biáº¿n q_index trong Quiz Game dÃ¹ng Ä‘á»ƒ:
A. LÆ°u Ä‘iá»ƒm sá»‘
B. Theo dÃµi Ä‘ang há»i cÃ¢u thá»© máº¥y
C. Äáº¿m sá»‘ cÃ¢u sai
D. LÆ°u tÃªn ngÆ°á»i chÆ¡i
**ÄÃ¡p Ã¡n: B**

**CÃ¢u 3 (ÄÃºng/Sai):** 4 sprite nÃºt Ä‘Ã¡p Ã¡n (A/B/C/D) nÃªn Ä‘á»•i mÃ u xanh khi Ä‘Ãºng vÃ  Ä‘á» khi sai.
**ÄÃ¡p Ã¡n: ÄÃºng**

**CÃ¢u 4 (ÄÃºng/Sai):** Sau khi ngÆ°á»i chÆ¡i chá»n Ä‘Ã¡p Ã¡n, game tá»± Ä‘á»™ng sang cÃ¢u tiáº¿p theo sau 2 giÃ¢y.
**ÄÃ¡p Ã¡n: ÄÃºng**

**CÃ¢u 5 (Äiá»n tá»«):** Äá»ƒ láº¥y cÃ¢u há»i thá»© i, dÃ¹ng: say (item (___ of [questions])) for 3 seconds.
**ÄÃ¡p Ã¡n: q_index (hoáº·c i)**

**CÃ¢u 6 (Äiá»n tá»«):** Khi ngÆ°á»i chÆ¡i click nÃºt A vÃ  Ä‘Ã¡p Ã¡n Ä‘Ãºng lÃ  "A", kiá»ƒm tra: if (answer = item (___ of [answers])) then â†’ Ä‘Ãºng.
**ÄÃ¡p Ã¡n: q_index**

**CÃ¢u 7 (KÃ©o tháº£ tá»«):** Äiá»n Ä‘á»ƒ táº¡o Quiz Game cÆ¡ báº£n:
add "Scratch do hÃ£ng nÃ o táº¡o ra?" to [questions]
add "MIT" to [answers]
set [q_index] to (1)
repeat (length of [questions]):
  say (item (___ of [questions]))
  ask "" and wait
  if (answer = item (___ of [answers])) then change [score] by (___)
  change [q_index] by (1)
NgÃ¢n hÃ ng tá»«: **q_index / q_index / 10**
**ÄÃ¡p Ã¡n: q_index / q_index / 10**

**CÃ¢u 8 (Sáº¯p xáº¿p):** Sáº¯p xáº¿p bÆ°á»›c táº¡o Quiz Game cá»‘t lÃµi:
- [ ] Láº·p qua tá»«ng cÃ¢u há»i vá»›i biáº¿n q_index
- [ ] Táº¡o list "questions" vÃ  list "answers"
- [ ] Hiá»‡n káº¿t quáº£ tá»•ng khi háº¿t cÃ¢u há»i
- [ ] ThÃªm ná»™i dung cÃ¢u há»i vÃ  Ä‘Ã¡p Ã¡n vÃ o list
- [ ] Kiá»ƒm tra Ä‘Ã¡p Ã¡n ngÆ°á»i chÆ¡i chá»n, cá»™ng Ä‘iá»ƒm náº¿u Ä‘Ãºng
**ÄÃ¡p Ã¡n:** Táº¡o list â†’ ThÃªm ná»™i dung â†’ Láº·p qua cÃ¢u há»i â†’ Kiá»ƒm tra Ä‘Ã¡p Ã¡n â†’ Hiá»‡n káº¿t quáº£

**CÃ¢u 9 (Ná»‘i Ä‘Ã´i):** Ná»‘i khá»‘i lá»‡nh vá»›i vai trÃ² trong Quiz Game:
1. item (q_index) of [questions] â€” A. Sá»‘ cÃ¢u há»i cÃ³ trong list
2. length of [questions] â€” B. CÃ¢u há»i thá»© q_index
3. add (x) to [questions] â€” C. ThÃªm cÃ¢u há»i má»›i vÃ o list
4. delete all of [answers] â€” D. XÃ³a toÃ n bá»™ Ä‘Ã¡p Ã¡n (dÃ¹ng khi reset)
**ÄÃ¡p Ã¡n: 1-B, 2-A, 3-C, 4-D**

**CÃ¢u 10 (Tráº¯c nghiá»‡m):** Quiz Game cÃ³ Æ°u Ä‘iá»ƒm nÃ o trong bÃ i thi?
A. Code nhanh nháº¥t trong 5 thá»ƒ loáº¡i (~40 phÃºt)
B. áº¤n tÆ°á»£ng nháº¥t vá»›i ban giÃ¡m kháº£o
C. KhÃ´ng cáº§n dÃ¹ng clone
D. Cáº£ A vÃ  C
**ÄÃ¡p Ã¡n: D**

### BÃ€I Táº¬P THá»°C HÃ€NH

**BÃ i 1:** Táº¡o project "Quiz Scratch 5 cÃ¢u" â€” 5 cÃ¢u há»i vá» Scratch trong list. Sprite há»i láº§n lÆ°á»£t (ask and wait). ÄÃºng +10 Ä‘iá»ƒm vÃ  Ä‘á»•i mÃ u xanh, sai hiá»‡n Ä‘Ã¡p Ã¡n Ä‘Ãºng vÃ  Ä‘á»•i mÃ u Ä‘á». Sau 2 giÃ¢y tá»± Ä‘á»™ng sang cÃ¢u tiáº¿p. Káº¿t thÃºc: nÃ³i Ä‘iá»ƒm tá»•ng.

**BÃ i 2:** Táº¡o project "Quiz 4 nÃºt" â€” Thay vÃ¬ ask and wait, táº¡o 4 sprite nÃºt (A/B/C/D) hiá»ƒn thá»‹ 4 lá»±a chá»n. NgÆ°á»i chÆ¡i click nÃºt. NÃºt Ä‘Ãºng Ä‘á»•i xanh, nÃºt sai Ä‘á»•i Ä‘á». Sau 2 giÃ¢y reset mÃ u vÃ  sang cÃ¢u tiáº¿p.

**BÃ i 3:** Táº¡o project "Quiz vá»›i thá»i gian" â€” Má»—i cÃ¢u há»i cÃ³ 10 giÃ¢y Ä‘á»ƒ tráº£ lá»i (biáº¿n question_time). Tráº£ lá»i Ä‘Ãºng trong 5 giÃ¢y Ä‘áº§u: +20 Ä‘iá»ƒm, trong 5â€“10 giÃ¢y: +10 Ä‘iá»ƒm, háº¿t giá» khÃ´ng tráº£ lá»i: -5 Ä‘iá»ƒm. 7 cÃ¢u há»i. Hiá»ƒn thá»‹ Ä‘iá»ƒm cuá»‘i.

---

## BUá»”I 14: QUIZ + GAME HÃ€NH Äá»˜NG Káº¾T Há»¢P

### CÃ‚U Há»ŽI Ã”N Táº¬P

**CÃ¢u 1 (Tráº¯c nghiá»‡m):** Trong game Quiz káº¿t há»£p hÃ nh Ä‘á»™ng, nhÃ¢n váº­t tiáº¿n lÃªn khi nÃ o?
A. LuÃ´n luÃ´n tiáº¿n lÃªn
B. Khi tráº£ lá»i cÃ¢u há»i Ä‘Ãºng
C. Khi háº¿t thá»i gian
D. Ngáº«u nhiÃªn
**ÄÃ¡p Ã¡n: B**

**CÃ¢u 2 (Tráº¯c nghiá»‡m):** Khi ngÆ°á»i chÆ¡i tráº£ lá»i sai trong game káº¿t há»£p, hÃ nh Ä‘á»™ng phÃ¹ há»£p nháº¥t lÃ :
A. Game over ngay
B. NhÃ¢n váº­t lÃ¹i láº¡i, máº¥t máº¡ng, hoáº·c xuáº¥t hiá»‡n chÆ°á»›ng ngáº¡i váº­t
C. KhÃ´ng cÃ³ hÃ nh Ä‘á»™ng gÃ¬
D. CÃ¢u há»i tá»± Ä‘á»™ng tráº£ lá»i Ä‘Ãºng
**ÄÃ¡p Ã¡n: B**

**CÃ¢u 3 (ÄÃºng/Sai):** Game Quiz káº¿t há»£p hÃ nh Ä‘á»™ng thÆ°á»ng phá»©c táº¡p hÆ¡n Quiz thuáº§n tÃºy vÃ¬ cáº§n code cáº£ pháº§n di chuyá»ƒn nhÃ¢n váº­t.
**ÄÃ¡p Ã¡n: ÄÃºng**

**CÃ¢u 4 (ÄÃºng/Sai):** Má»™t game káº¿t há»£p cÃ³ thá»ƒ dÃ¹ng cÃ¢u há»i Ä‘á»ƒ "má»Ÿ khÃ³a" cá»­a, sau Ä‘Ã³ nhÃ¢n váº­t Ä‘i qua.
**ÄÃ¡p Ã¡n: ÄÃºng**

**CÃ¢u 5 (Äiá»n tá»«):** Khi tráº£ lá»i Ä‘Ãºng 5 cÃ¢u liÃªn tiáº¿p, nhÃ¢n váº­t Ä‘áº¿n ___ vÃ  game káº¿t thÃºc tháº¯ng.
**ÄÃ¡p Ã¡n: Ä‘Ã­ch / cá»­a / finish**

**CÃ¢u 6 (Äiá»n tá»«):** Biáº¿n correct_streak Ä‘áº¿m sá»‘ cÃ¢u tráº£ lá»i Ä‘Ãºng ___ tiáº¿p. Reset vá» 0 khi tráº£ lá»i sai.
**ÄÃ¡p Ã¡n: liÃªn**

**CÃ¢u 7 (KÃ©o tháº£ tá»«):** Äiá»n Ä‘á»ƒ káº¿t há»£p quiz vÃ  di chuyá»ƒn:
Khi tráº£ lá»i Ä‘Ãºng: change x ___ (50) (nhÃ¢n váº­t tiáº¿n)
Khi tráº£ lá»i sai: change x ___ (-30) (nhÃ¢n váº­t lÃ¹i) + change [lives] ___ (-1)
if x >= 200: ___ "win" (vá» Ä‘Ã­ch)
NgÃ¢n hÃ ng tá»«: **by / by / by / broadcast**
**ÄÃ¡p Ã¡n: by / by / by / broadcast**

**CÃ¢u 8 (Sáº¯p xáº¿p):** Sáº¯p xáº¿p bÆ°á»›c táº¡o game Quiz káº¿t há»£p hÃ nh Ä‘á»™ng:
- [ ] Káº¿t ná»‘i: tráº£ lá»i Ä‘Ãºng â†’ tiáº¿n, sai â†’ lÃ¹i/máº¥t máº¡ng
- [ ] Táº¡o quiz pháº§n cÃ¢u há»i (list + q_index)
- [ ] Kiá»ƒm tra Ä‘iá»u kiá»‡n tháº¯ng (x Ä‘áº¡t Ä‘Ã­ch)
- [ ] Code nhÃ¢n váº­t di chuyá»ƒn theo biáº¿n x
**ÄÃ¡p Ã¡n:** Quiz cÃ¢u há»i â†’ NhÃ¢n váº­t di chuyá»ƒn â†’ Káº¿t ná»‘i Ä‘Ãºng/sai â†’ Äiá»u kiá»‡n tháº¯ng

**CÃ¢u 9 (Ná»‘i Ä‘Ã´i):** Ná»‘i sá»± kiá»‡n vá»›i hÃ nh Ä‘á»™ng trong Quiz hÃ nh Ä‘á»™ng:
1. Tráº£ lá»i Ä‘Ãºng â€” A. NhÃ¢n váº­t tiáº¿n 50px vá» phÃ­a Ä‘Ã­ch
2. Tráº£ lá»i sai â€” B. Game over
3. Äáº¿n Ä‘Ã­ch â€” C. -1 máº¡ng, nhÃ¢n váº­t lÃ¹i 30px
4. lives = 0 â€” D. "You Win!", hiá»‡n Ä‘iá»ƒm
**ÄÃ¡p Ã¡n: 1-A, 2-C, 3-D, 4-B**

**CÃ¢u 10 (Tráº¯c nghiá»‡m):** Quiz káº¿t há»£p hÃ nh Ä‘á»™ng thÆ°á»ng xuáº¥t hiá»‡n trong Ä‘á» thi dáº¡ng nÃ o?
A. Äá» yÃªu cáº§u game báº¯t váº­t rÆ¡i
B. Äá» yÃªu cáº§u game sÃ¡ng táº¡o â€” nhÃ¢n váº­t pháº£i vÆ°á»£t thá»­ thÃ¡ch báº±ng kiáº¿n thá»©c
C. Äá» yÃªu cáº§u game báº¯n sÃºng
D. Äá» yÃªu cáº§u mÃª cung
**ÄÃ¡p Ã¡n: B**

### BÃ€I Táº¬P THá»°C HÃ€NH

**BÃ i 1:** Táº¡o project "NhÃ¢n váº­t tráº£ lá»i cÃ¢u há»i" â€” NhÃ¢n váº­t Ä‘á»©ng á»Ÿ bÃªn trÃ¡i mÃ n hÃ¬nh. 5 cÃ¢u há»i láº§n lÆ°á»£t hiá»‡n ra. Tráº£ lá»i Ä‘Ãºng: nhÃ¢n váº­t tiáº¿n 60px. Tráº£ lá»i sai: nhÃ¢n váº­t lÃ¹i 30px. Äáº¿n bÃªn pháº£i mÃ n hÃ¬nh = tháº¯ng.

**BÃ i 2:** Táº¡o project "Quiz vÆ°á»£t chÆ°á»›ng ngáº¡i" â€” ÄÆ°á»ng Ä‘i cá»§a nhÃ¢n váº­t cÃ³ 5 chÆ°á»›ng ngáº¡i váº­t. Má»—i chÆ°á»›ng ngáº¡i xuáº¥t hiá»‡n má»™t cÃ¢u há»i. Tráº£ lá»i Ä‘Ãºng: chÆ°á»›ng ngáº¡i má»Ÿ ra (áº©n Ä‘i). Tráº£ lá»i sai: nhÃ¢n váº­t bá»‹ Ä‘áº©y lÃ¹i. Lives=3.

**BÃ i 3:** Táº¡o project "Quiz hÃ nh Ä‘á»™ng hoÃ n chá»‰nh" â€” Káº¿t há»£p: quiz 7 cÃ¢u, nhÃ¢n váº­t tiáº¿n/lÃ¹i theo Ä‘Ãºng/sai, cÃ³ káº» thÃ¹ di chuyá»ƒn trÃªn Ä‘Æ°á»ng (touching â†’ -1 máº¡ng), timer 120 giÃ¢y, 3 mÃ n hÃ¬nh Ä‘áº§y Ä‘á»§. Tháº¯ng khi tráº£ lá»i Ä‘Ãºng háº¿t 7 cÃ¢u.

---

## BUá»”I 15: SO SÃNH THá»‚ LOáº I & CHIáº¾N LÆ¯á»¢C THI

### CÃ‚U Há»ŽI Ã”N Táº¬P

**CÃ¢u 1 (Tráº¯c nghiá»‡m):** Theo báº£ng so sÃ¡nh, thá»ƒ loáº¡i nÃ o dá»… code nháº¥t vÃ  nhanh hoÃ n thÃ nh nháº¥t?
A. Platformer
B. Shooting
C. Catching (~45 phÃºt)
D. Quiz (~40 phÃºt)
**ÄÃ¡p Ã¡n: D** (Quiz ~40 phÃºt < Catching ~45 phÃºt, nhÆ°ng Catching thÆ°á»ng Ä‘Æ°á»£c chá»n hÆ¡n vÃ¬ Ä‘a nÄƒng hÆ¡n)

**CÃ¢u 2 (Tráº¯c nghiá»‡m):** Khi Ä‘á»c Ä‘á» thi, bÆ°á»›c Ä‘áº§u tiÃªn cáº§n lÃ m lÃ :
A. Má»Ÿ Scratch vÃ  báº¯t Ä‘áº§u code ngay
B. Äá»c háº¿t toÃ n bá»™ Ä‘á» 1 láº§n trÆ°á»›c khi code báº¥t ká»³ thá»© gÃ¬
C. Táº¡o táº¥t cáº£ sprite cáº§n thiáº¿t
D. Chá»n backdrop phÃ¹ há»£p
**ÄÃ¡p Ã¡n: B**

**CÃ¢u 3 (ÄÃºng/Sai):** NÃªn Æ°u tiÃªn code pháº§n cá»‘t lÃµi (gameplay) trÆ°á»›c, sau Ä‘Ã³ má»›i thÃªm UI vÃ  hiá»‡u á»©ng.
**ÄÃ¡p Ã¡n: ÄÃºng**

**CÃ¢u 4 (ÄÃºng/Sai):** Khi Ä‘á»c Ä‘á», nÃªn báº¯t Ä‘áº§u code ngay khi Ä‘á»c xong cÃ¢u Ä‘áº§u tiÃªn Ä‘á»ƒ tiáº¿t kiá»‡m thá»i gian.
**ÄÃ¡p Ã¡n: Sai** (Pháº£i Ä‘á»c toÃ n bá»™ Ä‘á», gáº¡ch chÃ¢n yÃªu cáº§u, lÃªn káº¿ hoáº¡ch trÆ°á»›c)

**CÃ¢u 5 (Äiá»n tá»«):** Khi gáº·p Ä‘á» thi khÃ´ng rÃµ rÃ ng vá» thá»ƒ loáº¡i, hÃ£y xÃ¡c Ä‘á»‹nh: nhÃ¢n váº­t lÃ m gÃ¬? â†’ báº¯t váº­t = Catching, nháº£y platform = ___, tÃ¬m Ä‘Æ°á»ng = Maze, báº¯n tiÃªu diá»‡t = Shooting.
**ÄÃ¡p Ã¡n: Platformer**

**CÃ¢u 6 (Äiá»n tá»«):** Trong 5 phÃºt lÃªn káº¿ hoáº¡ch, cáº§n liá»‡t kÃª: sprites cáº§n táº¡o, cÆ¡ cháº¿ ___ cáº§n code trÆ°á»›c, Æ°á»›c tÃ­nh thá»i gian tá»«ng pháº§n.
**ÄÃ¡p Ã¡n: cá»‘t lÃµi**

**CÃ¢u 7 (KÃ©o tháº£ tá»«):** Äiá»n vÃ o báº£ng so sÃ¡nh:
Catching: thá»i gian â‰ˆ ___ phÃºt, Ä‘á»™ khÃ³: ___
Platformer: thá»i gian â‰ˆ ___ phÃºt, Ä‘á»™ khÃ³: ___
Maze: thá»i gian â‰ˆ ___ phÃºt, Ä‘á»™ khÃ³: Dá»…â€“Trung
Shooting: thá»i gian â‰ˆ ___ phÃºt, Ä‘á»™ khÃ³: Trung
NgÃ¢n hÃ ng tá»«: **45 / Dá»… / 80 / KhÃ³ / 50 / 60**
**ÄÃ¡p Ã¡n: Catching: 45/Dá»…; Platformer: 80/KhÃ³; Maze: 50/Dá»…â€“Trung; Shooting: 60/Trung**

**CÃ¢u 8 (Sáº¯p xáº¿p):** Sáº¯p xáº¿p quy trÃ¬nh lÃ m bÃ i thi theo Ä‘Ãºng thá»© tá»±:
- [ ] Code pháº§n UI (Ä‘iá»ƒm, máº¡ng, thá»i gian)
- [ ] Äá»c Ä‘á» vÃ  gáº¡ch chÃ¢n yÃªu cáº§u
- [ ] Code cá»‘t lÃµi (di chuyá»ƒn, va cháº¡m, Ä‘iá»u kiá»‡n tháº¯ng/thua)
- [ ] ThÃªm Ã¢m thanh vÃ  hiá»‡u á»©ng (náº¿u cÃ²n thá»i gian)
- [ ] LÃªn káº¿ hoáº¡ch: sprites, cÆ¡ cháº¿, thá»© tá»± code
**ÄÃ¡p Ã¡n:** Äá»c Ä‘á» â†’ LÃªn káº¿ hoáº¡ch â†’ Code cá»‘t lÃµi â†’ Code UI â†’ Ã‚m thanh/hiá»‡u á»©ng

**CÃ¢u 9 (Ná»‘i Ä‘Ã´i):** Ná»‘i tá»« khÃ³a trong Ä‘á» thi vá»›i thá»ƒ loáº¡i:
1. "báº¯t váº­t rÆ¡i, há»©ng, nÃ© váº­t xáº¥u" â€” A. Shooting Game
2. "nháº£y qua chÆ°á»›ng ngáº¡i, Ä‘áº¿n Ä‘Ã­ch" â€” B. Quiz Game
3. "báº¯n tiÃªu diá»‡t, wave káº» thÃ¹" â€” C. Platformer Game
4. "tráº£ lá»i cÃ¢u há»i, chá»n Ä‘Ã¡p Ã¡n" â€” D. Catching Game
**ÄÃ¡p Ã¡n: 1-D, 2-C, 3-A, 4-B**

**CÃ¢u 10 (Tráº¯c nghiá»‡m):** Khi gáº·p Ä‘á» thi vá»›i yÃªu cáº§u phá»©c táº¡p vÃ  cÃ²n 10 phÃºt, nÃªn lÃ m gÃ¬?
A. Cá»‘ gáº¯ng lÃ m táº¥t cáº£ yÃªu cáº§u
B. Äáº£m báº£o pháº§n cá»‘t lÃµi cháº¡y Ä‘Æ°á»£c, bá» bá»›t yÃªu cáº§u nÃ¢ng cao
C. Ná»™p bÃ i tráº¯ng
D. XÃ³a toÃ n bá»™ vÃ  lÃ m láº¡i
**ÄÃ¡p Ã¡n: B**

### BÃ€I Táº¬P THá»°C HÃ€NH

**BÃ i 1:** Táº¡o project "Äá»c Ä‘á» vÃ  lÃªn káº¿ hoáº¡ch" â€” GV Ä‘Æ°a Ä‘á» thi máº«u. HS khÃ´ng code, chá»‰ viáº¿t káº¿ hoáº¡ch: loáº¡i game, danh sÃ¡ch sprites, cÆ¡ cháº¿ cáº§n code, thá»© tá»± Æ°u tiÃªn, Æ°á»›c tÃ­nh thá»i gian. Sau 5 phÃºt trÃ¬nh bÃ y káº¿ hoáº¡ch vá»›i GV.

**BÃ i 2:** Táº¡o project "LÃ m theo Ä‘á»" â€” Sau khi lÃªn káº¿ hoáº¡ch (BÃ i 1), thá»±c hiá»‡n code theo Ä‘Ãºng thá»© tá»± káº¿ hoáº¡ch. Ghi láº¡i thá»i gian thá»±c táº¿ tá»«ng pháº§n vÃ  so sÃ¡nh vá»›i Æ°á»›c tÃ­nh.

**BÃ i 3:** Táº¡o project "Luyá»‡n chá»n thá»ƒ loáº¡i" â€” GV Ä‘Æ°a 5 Ä‘á» thi ngáº¯n. HS Ä‘á»c vÃ  quyáº¿t Ä‘á»‹nh trong 1 phÃºt: chá»n thá»ƒ loáº¡i nÃ o, lÃ½ do gÃ¬. Tá»‘c Ä‘á»™ vÃ  Ä‘á»™ chÃ­nh xÃ¡c cá»§a viá»‡c nháº­n dáº¡ng thá»ƒ loáº¡i lÃ  má»¥c tiÃªu.

---

## BUá»”I 16: MINI THI THá»¬

### CÃ‚U Há»ŽI Ã”N Táº¬P

**CÃ¢u 1 (Tráº¯c nghiá»‡m):** Trong 75 phÃºt lÃ m bÃ i thi, bao nhiÃªu phÃºt nÃªn dÃ nh cho Ä‘á»c Ä‘á» vÃ  lÃªn káº¿ hoáº¡ch?
A. KhÃ´ng cáº§n, code ngay
B. 5 phÃºt
C. 20 phÃºt
D. 30 phÃºt
**ÄÃ¡p Ã¡n: B**

**CÃ¢u 2 (Tráº¯c nghiá»‡m):** TiÃªu chÃ­ nÃ o Ä‘Æ°á»£c cháº¥m Ä‘iá»ƒm nhiá»u nháº¥t trong thi?
A. Äá»“ há»a Ä‘áº¹p (4 Ä‘iá»ƒm)
B. Game cháº¡y Ä‘Æ°á»£c khÃ´ng lá»—i (4 Ä‘iá»ƒm) + Ä‘Ãºng yÃªu cáº§u cÆ¡ báº£n (4 Ä‘iá»ƒm)
C. Ã‚m thanh phong phÃº (4 Ä‘iá»ƒm)
D. Nhiá»u tÃ­nh nÄƒng nÃ¢ng cao (10 Ä‘iá»ƒm)
**ÄÃ¡p Ã¡n: B**

**CÃ¢u 3 (ÄÃºng/Sai):** TrÆ°á»›c khi ná»™p bÃ i thi, cáº§n thá»­ chÆ¡i tá»« Ä‘áº§u Ä‘áº¿n cuá»‘i Ã­t nháº¥t 1 láº§n Ä‘á»ƒ Ä‘áº£m báº£o khÃ´ng bá»‹ lá»—i.
**ÄÃ¡p Ã¡n: ÄÃºng**

**CÃ¢u 4 (ÄÃºng/Sai):** NÃªn Æ°u tiÃªn thÃªm hiá»‡u á»©ng Ä‘áº¹p trÆ°á»›c khi Ä‘áº£m báº£o gameplay cÆ¡ báº£n hoáº¡t Ä‘á»™ng.
**ÄÃ¡p Ã¡n: Sai**

**CÃ¢u 5 (Äiá»n tá»«):** Game cháº¡y Ä‘Æ°á»£c vÃ  Ä‘Ãºng yÃªu cáº§u cÆ¡ báº£n quan trá»ng hÆ¡n game ___ nhÆ°ng lá»—i.
**ÄÃ¡p Ã¡n: Ä‘áº¹p / phá»©c táº¡p**

**CÃ¢u 6 (Äiá»n tá»«):** Khi ná»™p bÃ i, lÆ°u file dÆ°á»›i dáº¡ng ___ hoáº·c share link Scratch theo yÃªu cáº§u cá»§a ban tá»• chá»©c.
**ÄÃ¡p Ã¡n: .sb3**

**CÃ¢u 7 (KÃ©o tháº£ tá»«):** Äiá»n thá»© tá»± Æ°u tiÃªn khi lÃ m bÃ i thi:
1. Code ___ (di chuyá»ƒn, va cháº¡m, Ä‘iá»u kiá»‡n tháº¯ng/thua)
2. ThÃªm ___ (Ä‘iá»ƒm, máº¡ng, timer)
3. ThÃªm ___ (start screen, end screen)
4. ThÃªm ___ (Ã¢m thanh, hiá»‡u á»©ng) náº¿u cÃ²n thá»i gian
NgÃ¢n hÃ ng tá»«: **cá»‘t lÃµi / UI / mÃ n hÃ¬nh / Ã¢m thanh**
**ÄÃ¡p Ã¡n: cá»‘t lÃµi / UI / mÃ n hÃ¬nh / Ã¢m thanh**

**CÃ¢u 8 (Sáº¯p xáº¿p):** Sáº¯p xáº¿p checklist cuá»‘i giá» thi (15 phÃºt cuá»‘i):
- [ ] Cháº¡y thá»­ tá»« Ä‘áº§u Ä‘áº¿n cuá»‘i
- [ ] Kiá»ƒm tra biáº¿n reset khi chÆ¡i láº¡i
- [ ] ThÃªm Ã¢m thanh náº¿u chÆ°a cÃ³ (3 phÃºt)
- [ ] Tick tá»«ng yÃªu cáº§u Ä‘á» Ä‘Ã£ lÃ m chÆ°a
- [ ] LÆ°u file vÃ  chuáº©n bá»‹ ná»™p
**ÄÃ¡p Ã¡n:** Tick yÃªu cáº§u Ä‘á» â†’ Kiá»ƒm tra biáº¿n reset â†’ ThÃªm Ã¢m thanh â†’ Cháº¡y thá»­ â†’ LÆ°u vÃ  ná»™p

**CÃ¢u 9 (Ná»‘i Ä‘Ã´i):** Ná»‘i Ä‘iá»ƒm vá»›i tiÃªu chÃ­ cháº¥m:
1. 4 Ä‘iá»ƒm â€” A. ThÃªm yáº¿u tá»‘ sÃ¡ng táº¡o nÃ¢ng cao
2. 4 Ä‘iá»ƒm â€” B. ÄÃºng yÃªu cáº§u cÆ¡ báº£n cá»§a Ä‘á»
3. 2 Ä‘iá»ƒm â€” C. Game cháº¡y Ä‘Æ°á»£c, khÃ´ng lá»—i
4. 0 Ä‘iá»ƒm â€” D. Game khÃ´ng cháº¡y Ä‘Æ°á»£c
**ÄÃ¡p Ã¡n: 1-C (hoáº·c B), 2-B (hoáº·c C), 3-A, 4-D**

**CÃ¢u 10 (Tráº¯c nghiá»‡m):** Khi bá»‹ stuck á»Ÿ má»™t pháº§n trong khi thi, nÃªn lÃ m gÃ¬?
A. Tiáº¿p tá»¥c cá»‘ gáº¯ng sá»­a dÃ¹ máº¥t háº¿t thá»i gian
B. Bá» qua pháº§n Ä‘Ã³, lÃ m pháº§n khÃ¡c, quay láº¡i sau
C. XÃ³a toÃ n bá»™ code vÃ  lÃ m láº¡i
D. Ná»™p bÃ i sá»›m
**ÄÃ¡p Ã¡n: B**

### BÃ€I Táº¬P THá»°C HÃ€NH

**BÃ i 1:** Táº¡o project "Thi thá»­ GÄ3" â€” GV Ä‘Æ°a Ä‘á» thi (1 trang). HS cÃ³ 75 phÃºt: 5 phÃºt Ä‘á»c + káº¿ hoáº¡ch, 65 phÃºt code, 5 phÃºt kiá»ƒm tra. Ná»™p file .sb3. GV cháº¡y thá»­ vÃ  nháº­n xÃ©t.

**BÃ i 2:** Táº¡o project "Cáº£i thiá»‡n game thi" â€” Tá»« game thi thá»­ (BÃ i 1), cÃ³ thÃªm 30 phÃºt Ä‘á»ƒ cáº£i thiá»‡n: fix lá»—i náº¿u cÃ³, thÃªm tÃ­nh nÄƒng cÃ²n thiáº¿u theo checklist, hoÃ n thiá»‡n UI. So sÃ¡nh trÆ°á»›c/sau.

**BÃ i 3:** Táº¡o project "Tá»± Ä‘Ã¡nh giÃ¡" â€” Dá»±a trÃªn game thi thá»­, tá»± cháº¥m Ä‘iá»ƒm theo 3 tiÃªu chÃ­: game cháº¡y Ä‘Æ°á»£c (/4), Ä‘Ãºng yÃªu cáº§u (/4), nÃ¢ng cao (/2). Viáº¿t danh sÃ¡ch nhá»¯ng gÃ¬ lÃ m Ä‘Æ°á»£c vÃ  chÆ°a lÃ m Ä‘Æ°á»£c.
