đề bài:
Có 1 nhân vật Nhà thám hiểm, đặt tên: nhà thám hiểm.
Có 1 nhân vật Rương kho báu, đặt tên: rương kho báu.
Điều khiển Nhà thám hiểm bằng các phím mũi tên.
Rương kho báu có hiệu ứng đổi trang phục sau 2 giây, liên tục
Khi chạm vào Rương kho báu, hiệu ứng đổi trang phục sẽ mất và hiện lời nói "Chúc mừng!" trong 2 giây.
Kết thúc trò chơi.
Yêu cầu bắt buộc
Sử dụng khối Lặp cho đến khi (Repeat Until).
Không sử dụng biến.
rubic
1. Tên nhân vật đúng "Nhà thám hiểm": 1 điểm
   - Chấp nhận: "Nha tham hiem", "nhà thám hiểm", "NhaThámHiểm" (không phân biệt hoa thường, dấu)
   - Không chấp nhận: tên khác hoàn toàn (Mèo, Hero, Sprite1...)

2. Tên nhân vật đúng "Rương kho báu": 1 điểm
   - Chấp nhận tương tự, không phân biệt dấu/hoa thường
   - Không chấp nhận: tên khác hoàn toàn

3. Điều khiển Nhà thám hiểm bằng 4 phím mũi tên: 3 điểm
   Chấp nhận 2 cách:
   - Cách 1 (sự kiện): có 4 khối "Khi bấm phím mũi tên [lên/xuống/trái/phải]" kèm di chuyển
   - Cách 2 (vòng lặp + if): trong vòng lặp có 4 khối "Nếu phím mũi tên [lên/xuống/trái/phải] được nhấn"
   - Đủ 4 hướng: 3 điểm | 3 hướng: 2 điểm | 1-2 hướng: 1 điểm | không có: 0 điểm

4. Có khối "Lặp cho đến khi" (Repeat Until): 2 điểm

5. Điều kiện của "Lặp cho đến khi" là chạm vào nhà thám hiểm: 1 điểm

6. lệnh cho rương khó báu: Khi chạm nhà thám hiểm sẽ dừng vòng lặp và lệnh tiếp theo nói "Chúc mừng!" trong 2 giây, lệnh trong vòng lặp khi chạm rương khó báu là các lệnh : đổi trang phục và đợi 2 giây: ---1 điểm

7. Kết thúc trò chơi sau khi chạm (khối Dừng tất cả hoặc Dừng script này): 1 điểm

Lưu ý:
- Trừ 2 điểm nếu có sử dụng biến (khối "Đặt ... = ..." hoặc "Thay đổi ... thêm ...")
- Nếu điểm âm thì tính là 0
Nhận xét AI: 
🤖 AI nhận xét
6/10
Bạn đã đặt tên nhân vật chính xác và sử dụng tốt vòng lặp. Cần kiểm tra lại điều kiện chạm và nội dung lời nói để hoàn thiện trò chơi nhé!