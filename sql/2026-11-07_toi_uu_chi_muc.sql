-- Tối ưu chỉ mục theo gợi ý Performance Advisor của Supabase (07/11/2026)
-- • Thêm chỉ mục cho khoá ngoại hay được lọc / bị xoá dây chuyền khi xoá học sinh, bài học, đề thi, quà.
--   Bỏ qua các cột created_by / updated_by / answered_by: chỉ trỏ tới tài khoản giáo viên, hầu như không xoá.
-- • Bỏ lesson_submissions_pending_idx: chỉ dành cho lịch chấm bù grade-pending (đã gỡ 27/10), 0 lần dùng;
--   bỏ đi thì mỗi lần nộp / chấm bài bớt 1 chỉ mục phải cập nhật. Cần lại thì chạy lại khối "nếu cần" ở cuối.
-- • ANALYZE: nhiều bảng chưa từng được phân tích lại sau lần khởi động 29/10.
-- Bảng đều nhỏ (dưới vài nghìn dòng) nên tạo chỉ mục mất chưa tới 1 giây. Chạy lúc không có lớp.

create index if not exists attendance_records_user_idx on public.attendance_records (user_id);
create index if not exists class_lesson_unlock_lesson_idx on public.class_lesson_unlock (lesson_id);
create index if not exists exam_sessions_exam_idx on public.exam_sessions (exam_id);
create index if not exists exam_sessions_user_idx on public.exam_sessions (user_id);
create index if not exists quiz_sessions_exam_idx on public.quiz_sessions (exam_id);
create index if not exists reward_requests_item_idx on public.reward_requests (reward_item_id);
create index if not exists student_notes_user_idx on public.student_notes (user_id);
create index if not exists student_notes_lesson_idx on public.student_notes (lesson_id);
create index if not exists student_questions_lesson_idx on public.student_questions (lesson_id);

drop index if exists public.lesson_submissions_pending_idx;

analyze public.lessons, public.questions, public.units, public.topics, public.classes, public.grades,
  public.student_enrollments, public.class_topic_unlock, public.class_lesson_unlock, public.lesson_visibility,
  public.exam_sessions, public.quiz_sessions, public.sticker_awards, public.lesson_submissions, public.lesson_progress,
  public.profiles, public.student_questions, public.lesson_faq, public.reward_requests, public.messages;

-- Nếu cần lại chỉ mục chấm bù:
-- create index lesson_submissions_pending_idx on public.lesson_submissions (submitted_at desc)
--   where score is null and graded_by is null and ai_graded_at is null;
