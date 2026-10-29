-- TĂNG TỐC TRUNG TÂM AI + LỌC THEO KHOÁ / LỚP (29/10/2026)
-- Lỗi: mở Trung tâm AI báo 500 ở ai_tools_summary / ai_review_queue (quá 8 giây khi máy chủ đang tải).
-- Nguyên nhân: ai_tools_summary gọi ai_review_queue 6 lần; mỗi lần quét + xếp hạng TOÀN BỘ >9.000 bài AI từng chấm
-- (kể cả bài đã duyệt). 8.853 bài "chưa duyệt" phần lớn thuộc giai đoạn AI trả kết quả thẳng (11–27/10) — học sinh đã xem.
-- Sửa: chỉ xét bài CHƯA DUYỆT nộp trong 30 ngày gần đây (dùng index lesson_submissions_ai_unreviewed_idx);
--       ai_tools_summary đếm các nhóm trong 1 lần quét. Kết quả trả về giữ nguyên cấu trúc.
-- Thêm tham số p_grade (khoá — theo bài học) và p_class (lớp — theo ghi danh), bỏ trống = tất cả.

drop function if exists public.ai_review_queue(text, integer);
drop function if exists public.ai_tools_summary();

create or replace function public.ai_review_queue(p_reason text default null, p_limit integer default 30, p_grade text default null, p_class text default null)
returns table(id uuid, user_id uuid, lesson_id uuid, student_name text, lesson_title text, grade text, score numeric,
              ai_breakdown jsonb, teacher_comment text, ai_suspect_reason text, file_url text, file_name text,
              text_content text, content_json jsonb, submitted_at timestamptz, sticker_awarded boolean, reason text, reason_total bigint)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
begin
  if coalesce((select public.current_user_role()), '') not in ('teacher', 'assistant') then
    raise exception 'forbidden';
  end if;

  return query
  with ai as (
    select s.*, row_number() over (partition by s.lesson_id order by s.ai_graded_at) as rn_in_lesson
    from public.lesson_submissions s
    where s.reviewed_at is null and s.graded_by = 'ai' and s.score is not null
      and s.submitted_at >= now() - interval '30 days'
      and (p_grade is null or exists (select 1 from public.lessons lx where lx.id = s.lesson_id and lx.grade = p_grade))
      and (p_class is null or exists (select 1 from public.student_enrollments e where e.user_id = s.user_id
                                      and e.class_name = p_class and e.is_approved and (p_grade is null or e.grade = p_grade)))
  ),
  ranked as (
    select a.*,
      case
        when a.score >= 5 and a.file_url is null and length(trim(coalesce(a.text_content, ''))) < 15 then 'empty'
        when a.ai_suspect then 'suspect'
        when a.score < 5 then 'low'
        when a.rn_in_lesson <= 3 then 'first'
        when abs(hashtext(a.id::text)) % 20 = 0 then 'sample'
        else 'normal'
      end as why
    from ai a
  ),
  counted as (
    select r.*, count(*) over (partition by r.why) as why_total from ranked r
  )
  select c.id, c.user_id, c.lesson_id, p.full_name, l.title, l.grade,
         c.score, c.ai_breakdown, c.teacher_comment, c.ai_suspect_reason,
         c.file_url, c.file_name, left(c.text_content, 3000), c.content_json,
         c.submitted_at, c.sticker_awarded, c.why, c.why_total
  from counted c
  join public.profiles p on p.id = c.user_id
  join public.lessons  l on l.id = c.lesson_id
  where (p_reason is null and c.why <> 'normal') or c.why = p_reason
  order by case c.why when 'empty' then 95 when 'suspect' then 90 when 'low' then 70 when 'first' then 50 when 'sample' then 20 else 10 end desc,
           c.submitted_at desc
  limit greatest(1, least(p_limit, 100));
end $$;

create or replace function public.ai_tools_summary(p_grade text default null, p_class text default null)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare result jsonb;
begin
  if coalesce((select public.current_user_role()), '') not in ('teacher', 'assistant') then
    raise exception 'forbidden';
  end if;

  with ai as (
    select s.id, s.score, s.file_url, s.text_content, s.ai_suspect,
           row_number() over (partition by s.lesson_id order by s.ai_graded_at) as rn_in_lesson
    from public.lesson_submissions s
    where s.reviewed_at is null and s.graded_by = 'ai' and s.score is not null
      and s.submitted_at >= now() - interval '30 days'
      and (p_grade is null or exists (select 1 from public.lessons lx where lx.id = s.lesson_id and lx.grade = p_grade))
      and (p_class is null or exists (select 1 from public.student_enrollments e where e.user_id = s.user_id
                                      and e.class_name = p_class and e.is_approved and (p_grade is null or e.grade = p_grade)))
  ),
  ranked as (
    select case
        when a.score >= 5 and a.file_url is null and length(trim(coalesce(a.text_content, ''))) < 15 then 'empty'
        when a.ai_suspect then 'suspect'
        when a.score < 5 then 'low'
        when a.rn_in_lesson <= 3 then 'first'
        when abs(hashtext(a.id::text)) % 20 = 0 then 'sample'
        else 'normal'
      end as why
    from ai a
  ),
  dem as (select why, count(*) n from ranked group by why)
  select jsonb_build_object(
    'review', (select jsonb_object_agg(r, coalesce((select n from dem where dem.why = r), 0))
               from unnest(array['empty', 'suspect', 'low', 'first', 'sample', 'normal']) as r),
    'ai_unreviewed', (select coalesce(sum(n), 0) from dem),
    'ungraded', (select count(*) from public.lesson_submissions s
                 where s.score is null and s.graded_by is null and s.reviewed_at is null
                   and s.submitted_at >= now() - interval '30 days'
                   and (p_grade is null or exists (select 1 from public.lessons lx where lx.id = s.lesson_id and lx.grade = p_grade))
                   and (p_class is null or exists (select 1 from public.student_enrollments e where e.user_id = s.user_id
                                                   and e.class_name = p_class and e.is_approved and (p_grade is null or e.grade = p_grade)))),
    'questions_pending', (select count(*) from public.student_questions q
                          where q.status = 'pending'
                            and (p_grade is null or exists (select 1 from public.lessons lx where lx.id = q.lesson_id and lx.grade = p_grade))
                            and (p_class is null or exists (select 1 from public.student_enrollments e where e.user_id = q.student_id
                                                            and e.class_name = p_class and e.is_approved and (p_grade is null or e.grade = p_grade))))
  ) into result;
  return result;
end $$;

grant execute on function public.ai_review_queue(text, integer, text, text) to authenticated;
grant execute on function public.ai_tools_summary(text, text) to authenticated;
revoke execute on function public.ai_review_queue(text, integer, text, text) from anon;
revoke execute on function public.ai_tools_summary(text, text) from anon;
