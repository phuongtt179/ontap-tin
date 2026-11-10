-- Sửa các cảnh báo Security Advisor của Supabase (07/11/2026)
-- Cách chạy: Supabase → SQL Editor → dán toàn bộ → Run. Nên chạy lúc không có lớp.
-- Không đổi quyền xem/sửa dữ liệu của giáo viên hay học sinh (xem chú thích từng khối).

-- 1) [ERROR] Bảng journal_entries tắt RLS → ai có khoá công khai cũng đọc/ghi được qua API.
--    Bảng không được app dùng (0 dòng). Bật RLS và không thêm policy = chặn hết qua API.
alter table public.journal_entries enable row level security;

-- 2) [WARN] Hàm SECURITY DEFINER khách chưa đăng nhập (anon) gọi được qua /rest/v1/rpc/...
--    Các hàm này chỉ dùng khi đã đăng nhập (bên trong đã kiểm tra quyền), nên thu quyền của anon.
--    GIỮ NGUYÊN current_user_role() và is_teacher(): các policy áp cho mọi vai trò có gọi 2 hàm này.
revoke execute on function public.ai_review_queue(text, integer, text, text, text) from anon, public;
revoke execute on function public.ai_tools_summary(text, text) from anon, public;
revoke execute on function public.get_class_leaderboard() from anon, public;
grant execute on function public.ai_review_queue(text, integer, text, text, text) to authenticated;
grant execute on function public.ai_tools_summary(text, text) to authenticated;
grant execute on function public.get_class_leaderboard() to authenticated;

-- 3) [WARN] Hàm chưa cố định search_path → cố định về public (đúng với chỗ các hàm đang đọc bảng).
alter function public.handle_new_user() set search_path = public;
alter function public.is_teacher() set search_path = public;
alter function public.protect_profile_columns() set search_path = public;
alter function public.protect_submission_grading() set search_path = public;
alter function public.dem_bai_tong_quan() set search_path = public;

-- 4) [WARN hiệu năng] lesson_submissions có 2 policy SELECT trùng ý: "read" đã cho học sinh xem bài của mình
--    và cho cả teacher + assistant; "teacher read" chỉ lặp lại phần đó (riêng teacher). Bỏ policy thừa
--    để mỗi lần đọc bài nộp bớt 1 điều kiện phải xét. Quyền xem không đổi.
drop policy if exists "lesson_submissions: teacher read" on public.lesson_submissions;

-- Kiểm tra sau khi chạy (phải ra: true | 1 | 0)
select
  (select relrowsecurity from pg_class where oid = 'public.journal_entries'::regclass) as journal_rls_bat,
  (select count(*) from pg_policies where tablename = 'lesson_submissions' and cmd = 'SELECT') as so_policy_select_bai_nop,
  (select count(*) from pg_proc p where p.pronamespace = 'public'::regnamespace and p.proname in ('ai_review_queue', 'ai_tools_summary', 'get_class_leaderboard')
     and has_function_privilege('anon', p.oid, 'execute')) as ham_anon_con_goi_duoc;
