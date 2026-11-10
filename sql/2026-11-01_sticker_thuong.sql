-- Sticker theo mức cao nhất của từng bài nộp (01/11/2026)
-- Học sinh được nộp lại thoải mái. Duyệt lại mà mức TĂNG thì chỉ cộng phần chênh lệch (C → T: +3, H → T: +2);
-- mức giữ nguyên hoặc giảm thì không cộng, không trừ. sticker_thuong = số sticker bài này đã được thưởng.
-- Cách chạy: Supabase → SQL Editor → dán toàn bộ → Run.

alter table public.lesson_submissions add column if not exists sticker_thuong smallint not null default 0;

-- Bài đã thưởng trước đây: suy ra từ mức hiện tại; bài đang chờ duyệt lại thì lấy từ điểm lần trước trong lịch sử;
-- không suy ra được thì coi như đã thưởng tối đa để không cộng dư.
update public.lesson_submissions s set sticker_thuong = case
    when m.diem is null and s.muc is null then 3
    when coalesce(s.muc, case when m.diem >= 8 then 'T' when m.diem >= 5 then 'H' else 'C' end) = 'T' then 3
    when coalesce(s.muc, case when m.diem >= 8 then 'T' when m.diem >= 5 then 'H' else 'C' end) = 'H' then 1
    else 0 end
  from (
    select x.id, coalesce(x.score, (select h.score from public.submission_history h
      where h.submission_id = x.id and h.score is not null order by h.submitted_at desc limit 1)) as diem
    from public.lesson_submissions x where x.sticker_awarded
  ) m
  where m.id = s.id;

-- Học sinh không được tự sửa sticker_thuong (nếu không sẽ tự xin thưởng lại được)
create or replace function public.protect_submission_grading() returns trigger
language plpgsql as $$   -- SECURITY INVOKER: current_user là người gọi thật
begin
  if current_user in ('authenticated', 'anon')
     and coalesce((select public.current_user_role()), '') not in ('teacher', 'assistant') then
    if (new.muc is not null and new.muc is distinct from old.muc)
       or (new.score is not null and new.score is distinct from old.score)
       or (new.ai_score is distinct from old.ai_score)
       or (new.reviewed_at is not null and new.reviewed_at is distinct from old.reviewed_at)
       or (new.teacher_comment is not null and new.teacher_comment is distinct from old.teacher_comment)
       or (new.graded_by is not null and new.graded_by is distinct from old.graded_by)
       or (new.ai_graded_at is not null and new.ai_graded_at is distinct from old.ai_graded_at)
       or (new.ai_breakdown is not null and new.ai_breakdown::text is distinct from old.ai_breakdown::text)
       or (new.sticker_awarded is distinct from old.sticker_awarded)
       or (new.sticker_thuong is distinct from old.sticker_thuong)
       or (new.allow_resubmit and not coalesce(old.allow_resubmit, false))
       or new.user_id is distinct from old.user_id
       or new.lesson_id is distinct from old.lesson_id then
      raise exception 'forbidden_grading_update' using errcode = '42501';
    end if;
  end if;
  return new;
end $$;
