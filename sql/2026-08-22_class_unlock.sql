-- Tiến độ mở khoá bài học theo TỪNG LỚP (không phải theo khoá/grade chung).
-- Vì is_published là cờ toàn cục theo grade, nhiều lớp dùng chung 1 khoá ở
-- các thời điểm khác nhau (lớp A học xong hết, lớp B mở khoá sau) sẽ thấy
-- lệch tiến độ nếu chỉ dựa is_published. Bảng này là lớp khoá THỨ HAI nằm
-- trên is_published: bài chỉ thực sự mở cho học sinh 1 lớp khi VỪA published
-- VỪA nằm trong N bài đầu tiên (unlocked_count) của lớp đó.
create table if not exists class_unlock_progress (
  id             uuid primary key default gen_random_uuid(),
  grade          text not null,
  class_name     text not null,
  unlocked_count integer not null default 0,
  updated_at     timestamptz not null default now(),
  unique (grade, class_name)
);

alter table class_unlock_progress enable row level security;

create policy "teacher_assistant_all" on class_unlock_progress
  for all to authenticated
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role in ('teacher', 'assistant')))
  with check (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role in ('teacher', 'assistant')));

create policy "student_read" on class_unlock_progress
  for select to authenticated
  using (true);
