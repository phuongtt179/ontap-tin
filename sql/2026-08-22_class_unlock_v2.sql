-- Nâng cấp mô hình mở khoá bài học theo lớp: từ "đếm N bài đầu tiên xuyên
-- suốt mọi chủ đề" (class_unlock_progress.unlocked_count) sang 2 TẦNG khoá
-- độc lập:
--   1. Khoá CHỦ ĐỀ (class_topic_unlock) — chủ đề chưa mở thì học sinh không
--      bấm vào được, bất kể bài bên trong đã tick mở hay chưa.
--   2. Khoá BÀI trong chủ đề (class_lesson_unlock) — giáo viên tick TỪNG bài
--      cụ thể muốn mở, không bắt buộc theo thứ tự tuần tự nữa.
-- "topic" lưu chuỗi '__no_topic__' cho bài không gắn chủ đề — khớp quy ước
-- phía client (lessonSteps.js/LearnPage.jsx: l.topic || '__no_topic__') vì
-- UNIQUE constraint không hoạt động tốt với NULL trong Postgres.

create table if not exists class_topic_unlock (
  id         uuid primary key default gen_random_uuid(),
  grade      text not null,
  class_name text not null,
  topic      text not null,
  created_at timestamptz not null default now(),
  unique (grade, class_name, topic)
);

create table if not exists class_lesson_unlock (
  id         uuid primary key default gen_random_uuid(),
  grade      text not null,
  class_name text not null,
  lesson_id  uuid not null references lessons(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (grade, class_name, lesson_id)
);

alter table class_topic_unlock enable row level security;
create policy "teacher_assistant_all" on class_topic_unlock
  for all to authenticated
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role in ('teacher', 'assistant')))
  with check (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role in ('teacher', 'assistant')));
create policy "student_read" on class_topic_unlock
  for select to authenticated using (true);

alter table class_lesson_unlock enable row level security;
create policy "teacher_assistant_all" on class_lesson_unlock
  for all to authenticated
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role in ('teacher', 'assistant')))
  with check (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role in ('teacher', 'assistant')));
create policy "student_read" on class_lesson_unlock
  for select to authenticated using (true);

-- Chuyển dữ liệu cũ: với mỗi lớp đã có unlocked_count > 0, tính N bài đầu
-- tiên (đúng thứ tự order/created_at đang dùng ở client) rồi ghi thành các
-- dòng class_lesson_unlock + class_topic_unlock tương ứng (không cần biết
-- trước tên khoá/lớp cụ thể, join thẳng qua bảng cũ để tránh gõ nhầm dấu).
with ranked as (
  select
    l.id as lesson_id, l.grade, l.topic, p.class_name, p.unlocked_count,
    row_number() over (partition by l.grade order by l."order" nulls last, l.created_at) as rn
  from lessons l
  join class_unlock_progress p on p.grade = l.grade
  where l.is_published = true
)
insert into class_lesson_unlock (grade, class_name, lesson_id)
select grade, class_name, lesson_id from ranked where rn <= unlocked_count
on conflict do nothing;

with ranked as (
  select
    l.id as lesson_id, l.grade, coalesce(l.topic, '__no_topic__') as topic, p.class_name, p.unlocked_count,
    row_number() over (partition by l.grade order by l."order" nulls last, l.created_at) as rn
  from lessons l
  join class_unlock_progress p on p.grade = l.grade
  where l.is_published = true
)
insert into class_topic_unlock (grade, class_name, topic)
select distinct grade, class_name, topic from ranked where rn <= unlocked_count
on conflict do nothing;

drop table if exists class_unlock_progress;
