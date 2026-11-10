-- Lịch sử nộp lại bài thực hành (19/10/2026)
-- Nộp lại = ghi đè lên dòng cũ trong lesson_submissions → trước đây mất dấu lần nộp trước.
-- Trigger lưu bản cũ (điểm, nhận xét, lúc nộp) mỗi khi học sinh nộp lại, để đo vòng lặp
-- "nộp → nhận phản hồi → sửa → nộp lại" và mức tiến bộ điểm.

create table if not exists public.submission_history (
  id              bigserial primary key,
  submission_id   uuid not null references public.lesson_submissions(id) on delete cascade,
  user_id         uuid not null,
  lesson_id       uuid not null,
  task_index      int  not null default 0,
  attempt_no      int  not null,              -- lần nộp thứ mấy (1 = lần đầu)
  submitted_at    timestamptz,
  score           numeric,
  graded_by       text,
  teacher_comment text,
  file_name       text,
  replaced_at     timestamptz not null default now()   -- lúc bị thay bằng lần nộp mới
);
create index if not exists submission_history_sub_idx on public.submission_history (submission_id);
create index if not exists submission_history_time_idx on public.submission_history (replaced_at);

alter table public.submission_history enable row level security;
drop policy if exists "submission_history: own or staff read" on public.submission_history;
create policy "submission_history: own or staff read" on public.submission_history for select to authenticated
  using (user_id = auth.uid() or current_user_role() = any (array['teacher', 'assistant']));
-- Không có policy ghi: chỉ trigger bên dưới (security definer) được ghi.

create or replace function public.log_resubmission() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- Nộp lại = đổi thời điểm nộp (giáo viên chấm / AI chấm không đổi submitted_at)
  if new.submitted_at is distinct from old.submitted_at then
    insert into submission_history (submission_id, user_id, lesson_id, task_index, attempt_no,
                                    submitted_at, score, graded_by, teacher_comment, file_name)
    values (old.id, old.user_id, old.lesson_id,
            case when old.content_json->>'task_index' ~ '^\d+$' then (old.content_json->>'task_index')::int else 0 end,
            (select count(*) + 1 from submission_history h where h.submission_id = old.id),
            old.submitted_at, old.score, old.graded_by, old.teacher_comment, old.file_name);
    new.ai_attempts := 0;   -- bài mới → máy chủ được thử chấm lại từ đầu (api/grade-pending)
  end if;
  return new;
end $$;

drop trigger if exists lesson_submissions_history on public.lesson_submissions;
create trigger lesson_submissions_history before update on public.lesson_submissions
  for each row execute function public.log_resubmission();
