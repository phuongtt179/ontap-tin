-- Bảng vinh danh theo lớp — SECURITY DEFINER để học sinh xem được bạn cùng lớp
-- (RLS profiles chỉ cho HS đọc profile của chính mình)
create or replace function public.get_class_leaderboard()
returns table (user_id uuid, full_name text, class_name text, sticker_total int, streak_days int, streak_max int)
language sql security definer set search_path = public as $$
  with me as (
    select distinct se.class_name from student_enrollments se
    where se.user_id = auth.uid() and se.is_approved = true
  )
  select p.id, p.full_name,
    (select se2.class_name from student_enrollments se2
      where se2.user_id = p.id and se2.is_approved = true limit 1) as class_name,
    coalesce(p.sticker_total, 0), coalesce(p.streak_days, 0), coalesce(p.streak_max, 0)
  from profiles p
  where p.role = 'student'
    and exists (
      select 1 from student_enrollments se
      where se.user_id = p.id and se.is_approved = true
        and se.class_name in (select class_name from me)
    )
  order by coalesce(p.sticker_total, 0) desc, coalesce(p.streak_max, 0) desc;
$$;

grant execute on function public.get_class_leaderboard() to authenticated;
