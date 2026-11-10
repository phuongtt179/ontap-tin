-- Trang Tổng quan giáo viên: gộp 3 lệnh đếm bài nộp thành 1 lần quét (05/11/2026)
-- Trước đây mỗi lần mở trang đếm riêng 3 lần trên hơn 10.000 bài chưa duyệt, có lệnh chậm tới 7,6 giây (giới hạn 8 giây).
-- Chạy với quyền người gọi (RLS vẫn áp dụng): học sinh gọi chỉ đếm được bài của chính mình.
-- Cách chạy: Supabase → SQL Editor → dán toàn bộ → Run.

create or replace function public.dem_bai_tong_quan() returns json
language sql stable as $$
  select json_build_object(
    'chua_cham', count(*) filter (where score is null and graded_by is null and submitted_at >= now() - interval '30 days'),
    'ai_chua_duyet', count(*) filter (where graded_by = 'ai'),
    'cho_duyet', count(*)
  )
  from public.lesson_submissions
  where reviewed_at is null
$$;

revoke all on function public.dem_bai_tong_quan() from public, anon;
grant execute on function public.dem_bai_tong_quan() to authenticated;

notify pgrst, 'reload schema';
