-- Bật lại RLS (Row Level Security) cho 4 bảng đang bị TẮT HOÀN TOÀN — phát
-- hiện khi rà soát lỗ hổng "học sinh vào được bài bị khoá qua trợ lý AI":
-- kiểm tra sâu hơn thì thấy is_published/khoá-theo-lớp không phải vấn đề duy
-- nhất — 4 bảng dưới đây hoàn toàn KHÔNG có RLS, nghĩa là AI CŨNG NHƯ BẤT KỲ
-- AI KHÔNG CÓ TÀI KHOẢN nào cũng đọc/ghi thẳng được qua API công khai của
-- Supabase, không cần đăng nhập.
--
-- lesson_progress/lesson_submissions đã CÓ SẴN policy SELECT từ trước (tạo
-- lúc thiết kế ban đầu) nhưng KHÔNG có tác dụng vì RLS chưa từng được bật —
-- chỉ cần bật cờ + bổ sung policy ghi (insert/update) còn thiếu.

alter table lessons enable row level security;
create policy "lessons: authenticated read" on lessons
  for select to authenticated using (true);

alter table grades enable row level security;
create policy "grades: authenticated read" on grades
  for select to authenticated using (true);

alter table lesson_progress enable row level security;
create policy "lesson_progress: own insert" on lesson_progress
  for insert to authenticated with check (auth.uid() = user_id);
create policy "lesson_progress: own update" on lesson_progress
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table lesson_submissions enable row level security;
create policy "lesson_submissions: own insert" on lesson_submissions
  for insert to authenticated with check (auth.uid() = user_id);
create policy "lesson_submissions: own update" on lesson_submissions
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Ghi chú: bảng journal_entries cũng đang tắt RLS nhưng KHÔNG được dùng ở
-- app này (grep toàn bộ src/ không có kết quả) — có thể thuộc project khác
-- dùng chung Supabase (NHAT-KY-DOC-SACH). Không đụng vào ở đây để tránh làm
-- hỏng app khác — cần kiểm tra riêng trước khi bật RLS cho bảng đó.
