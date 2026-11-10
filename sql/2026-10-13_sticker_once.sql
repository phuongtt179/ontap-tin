-- Chặn "mở nhiều tab nộp cùng 1 bài để ăn sticker" (13/10/2026)
-- 1) Mỗi học sinh – mỗi bài học – mỗi ô bài thực hành chỉ có 1 bài nộp (nộp lại = sửa bài cũ, không tạo bài mới).
--    Dùng trigger + khoá tư vấn thay cho UNIQUE INDEX vì dữ liệu cũ đã có bản trùng (giữ nguyên, không xoá).
-- 2) Sổ thưởng sticker_awards + hàm award_sticker_once: thưởng "nộp bài" và "đạt bài kiểm tra" đúng 1 lần,
--    máy chủ tự kiểm tra điều kiện và tự tính số sticker (client không tự cộng được nữa).

-- ── 1. Chặn nộp trùng ────────────────────────────────────────────────────────
create or replace function public.prevent_duplicate_submission() returns trigger
language plpgsql security definer set search_path = public as $$
declare t text := coalesce(new.content_json->>'task_index', '0');
begin
  -- Khoá theo (học sinh, bài, ô) để 2 tab nộp cùng lúc cũng phải xếp hàng
  perform pg_advisory_xact_lock(hashtext(new.user_id::text || ':' || new.lesson_id::text || ':' || t));
  if exists (select 1 from lesson_submissions s
             where s.user_id = new.user_id and s.lesson_id = new.lesson_id
               and coalesce(s.content_json->>'task_index', '0') = t) then
    raise exception 'duplicate_submission' using errcode = '23505',
      hint = 'Bài này đã được nộp — hãy dùng Nộp lại';
  end if;
  return new;
end $$;

drop trigger if exists lesson_submissions_no_dup on public.lesson_submissions;
create trigger lesson_submissions_no_dup before insert on public.lesson_submissions
  for each row execute function public.prevent_duplicate_submission();

-- ── 2. Sổ thưởng sticker một lần ─────────────────────────────────────────────
create table if not exists public.sticker_awards (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  award_key  text not null,
  amount     int  not null,
  created_at timestamptz not null default now(),
  primary key (user_id, award_key)
);
alter table public.sticker_awards enable row level security;
drop policy if exists "sticker_awards: own read" on public.sticker_awards;
create policy "sticker_awards: own read" on public.sticker_awards for select to authenticated
  using (user_id = auth.uid() or current_user_role() = any (array['teacher', 'assistant']));
-- Không có policy insert/update: chỉ hàm bên dưới (security definer) được ghi.

-- p_kind: 'submit' (nộp bài thực hành, +1) | 'quiz' (đạt bài kiểm tra, 1–5 theo tỉ lệ đúng)
create or replace function public.award_sticker_once(p_kind text, p_lesson uuid, p_task int default 0)
returns json language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  k text;
  amt int;
  pr record;
  pct numeric;
  prof record;
begin
  if uid is null then raise exception 'not_authenticated'; end if;

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
end $$;

revoke all on function public.award_sticker_once(text, uuid, int) from public, anon;
grant execute on function public.award_sticker_once(text, uuid, int) to authenticated;

-- ── 3. Ghi sổ cho những gì ĐÃ thưởng trước đây (để không thưởng lại lần nữa) ──
insert into public.sticker_awards (user_id, award_key, amount)
select distinct s.user_id, 'submit:' || s.lesson_id || ':' || coalesce(s.content_json->>'task_index', '0'), 1
from public.lesson_submissions s
join public.profiles p on p.id = s.user_id
on conflict do nothing;

insert into public.sticker_awards (user_id, award_key, amount)
select lp.user_id, 'quiz:' || lp.lesson_id, 0
from public.lesson_progress lp
join public.profiles p on p.id = lp.user_id
where lp.quiz_passed
on conflict do nothing;
