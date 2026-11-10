# Thư mục SQL — thay đổi cấu trúc cơ sở dữ liệu

Mỗi tệp đặt tên `NĂM-THÁNG-NGÀY_ten.sql` theo ngày tạo → đọc theo thứ tự tên là đúng thứ tự đã chạy.
Đầu mỗi tệp có chú thích: chạy ở đâu, để làm gì, chạy lại được không.

## Chạy ở đâu?
| Thời gian | Dữ liệu | Đăng nhập |
|---|---|---|
| Đến hết 07/11/2026 | Supabase | Supabase |
| Từ 07/11/2026 23h | **Neon** | Supabase |

- Các tệp **trước 07/11** đã chạy trên Supabase. Cấu trúc này đã được chép sang Neon khi chuyển nhà
  (`scripts/chep-supabase-sang-neon.mjs`), **không cần chạy lại** trên Neon.
- Từ 07/11, tệp mới **chạy trên Neon** (Neon → SQL Editor), trừ tệp ghi rõ "CHẠY TRÊN SUPABASE"
  (chỉ liên quan đăng nhập, ví dụ `2026-11-10_supabase_khoa_dang_ky.sql`).
- Sau khi chạy tệp có bảng / hàm mới trên Neon: bấm **Refresh schema cache** ở Neon → Data API.

## Lưu ý
- `2026-03-13_supabase_schema_goc.sql` là cấu trúc gốc lúc khởi tạo, đã cũ (còn ràng buộc `grade in ('3','4','5')`).
  Cấu trúc đầy đủ hiện tại nằm trong bản sao lưu: `SaoLuu/neon_<ngày>/cau-truc.json` (`scripts/sao-luu-neon.mjs`).
- Tệp `*.local.sql` chứa mật khẩu → **không đưa lên Git** (đã chặn trong `.gitignore`).
