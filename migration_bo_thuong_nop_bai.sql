-- Bỏ thưởng sticker khi nộp bài thực hành (07/11/2026). Học sinh nộp file sai loại / file bừa để lấy +1 mỗi ô.
-- Từ nay sticker bài thực hành chỉ cộng khi giáo viên duyệt (T 3 · H 1 · C 0, phần chênh khi mức tăng). Thưởng quiz giữ nguyên.
-- Chặn ở máy chủ nên trang cũ còn mở cũng không lấy được. Chạy được nhiều lần.

CREATE OR REPLACE FUNCTION public.award_sticker_once(p_kind text, p_lesson uuid, p_task integer DEFAULT 0)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  uid uuid := auth.uid();
  k text;
  amt int;
  pr record;
  pct numeric;
  prof record;
begin
  if uid is null then raise exception 'not_authenticated'; end if;

  -- 07/11/2026: bỏ thưởng khi NỘP bài (học sinh nộp file bừa để lấy sticker). Sticker bài thực hành chỉ cộng khi giáo viên duyệt (T 3 · H 1 · C 0).
  if p_kind = 'submit' then
    return json_build_object('awarded', false, 'reason', 'khong_thuong_nop');
  end if;

  if p_kind = 'submit' then
    if not exists (select 1 from lesson_submissions s where s.user_id = uid and s.lesson_id = p_lesson
                   and coalesce(s.content_json->>'task_index', '0') = coalesce(p_task, 0)::text) then
      return json_build_object('awarded', false, 'reason', 'no_submission');
    end if;
    k := 'submit:' || p_lesson || ':' || coalesce(p_task, 0);
    amt := 1;
  elsif p_kind = 'quiz' then
    select quiz_passed, quiz_correct, quiz_total into pr from lesson_progress where user_id = uid and lesson_id = p_lesson;
    if not coalesce(pr.quiz_passed, false) then
      return json_build_object('awarded', false, 'reason', 'not_passed');
    end if;
    pct := case when coalesce(pr.quiz_total, 0) > 0 then pr.quiz_correct::numeric / pr.quiz_total else 0 end;
    amt := case when pct >= 1 then 5 when pct >= 0.9 then 4 when pct >= 0.85 then 3 when pct >= 0.75 then 2 else 1 end;
    k := 'quiz:' || p_lesson;
  else
    raise exception 'bad_kind';
  end if;

  insert into sticker_awards (user_id, award_key, amount) values (uid, k, amt) on conflict do nothing;
  if not found then
    return json_build_object('awarded', false, 'reason', 'already');
  end if;

  update profiles set sticker_count = coalesce(sticker_count, 0) + amt, sticker_total = coalesce(sticker_total, 0) + amt
    where id = uid returning sticker_count, sticker_total into prof;
  return json_build_object('awarded', true, 'count', amt, 'sticker_count', prof.sticker_count, 'sticker_total', prof.sticker_total);
end $function$
;
