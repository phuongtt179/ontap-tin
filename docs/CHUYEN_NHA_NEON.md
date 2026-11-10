# Chuyển dữ liệu sang Neon — danh sách kiểm tra

Đăng nhập vẫn ở Supabase. Chỉ dữ liệu (bài học, bài nộp, sticker…) chuyển sang Neon.
Công tắc là biến `VITE_NEON_DATA_URL` trên Vercel: có biến thì dùng Neon, không có thì dùng Supabase như cũ.

## Trước khi bắt đầu
- [ ] Chọn lúc **không có lớp** (không học sinh nào đang học). Giáo viên, trợ giảng cũng tạm không dùng app.
- [ ] Code có công tắc đã ở nhánh `main` (gộp từ nhánh `neon`). Chưa có biến thì app vẫn chạy Supabase như cũ.

## Các bước (khoảng 30 phút)
| # | Việc | Ai làm | Kiểm tra |
|---|------|--------|----------|
| 1 | `node scripts/sao-luu-supabase.mjs` | Claude | Dòng cuối ghi `0 lỗi` |
| 2 | `node scripts/chep-supabase-sang-neon.mjs --that-su` | Claude | `31/31` bảng khớp, `So loi: 0` |
| 3 | `node scripts/chep-neon-ve-supabase.mjs` (so sánh) | Claude | `31/31 bảng bằng số dòng` |
| 4 | `node scripts/thu-neon-client.mjs` | Claude | Đọc ghi được, dòng "Sửa điểm" bị chặn |
| 5 | Vercel → Settings → Environment Variables: sửa `VITE_NEON_DATA_URL`, tích thêm **Production** | Giáo viên | Biến có cả Production |
| 6 | Vercel → Deployments → bản Production mới nhất → Redeploy | Giáo viên | Status **Ready** |
| 7 | Mở `laptrinhsangtao.vercel.app` (Ctrl+F5), đăng nhập giáo viên | Giáo viên | Tổng quan, Chấm bài, Bài học hiện đúng số liệu mới nhất |
| 8 | Thử: duyệt 1 bài, đổi mật khẩu 1 học sinh thử | Giáo viên | Không báo lỗi; Claude kiểm tra bài đó đã ghi vào Neon |
| 9 | Đăng nhập `giamkhao1`: mở bài, làm quiz, nộp bài | Giáo viên | Không lỗi |

## Sau khi chuyển
- Tab học sinh mở từ trước sẽ hiện "Trang vừa có bản mới" → bấm Tải lại.
- Vài ngày đầu: xem Neon → Monitoring / Usage (CU-giờ), báo Claude nếu chậm hoặc lỗi.
- Từ nay mọi thay đổi cấu trúc bảng chạy trên **Neon**. Supabase chỉ còn lo đăng nhập.
- Supabase gói miễn phí tạm dừng dự án nếu 7 ngày không ai đăng nhập → kỳ nghỉ dài cần vào dashboard bật lại.

## Nếu có sự cố — quay lại Supabase
1. Báo học sinh tạm dừng.
2. `node scripts/sao-luu-supabase.mjs`, rồi `node scripts/chep-neon-ve-supabase.mjs --thu` (phải không lỗi).
3. `node scripts/chep-neon-ve-supabase.mjs --that-su` — chép dữ liệu Neon (gồm phần mới) về Supabase.
4. Vercel: bỏ tích Production ở biến `VITE_NEON_DATA_URL` → Redeploy bản Production.
