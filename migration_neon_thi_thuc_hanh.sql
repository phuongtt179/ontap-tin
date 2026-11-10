-- CHẠY TRÊN NEON — đề thi thực hành Python (chấm tự động bằng test) và Scratch (giáo viên chấm, có AI chấm nháp). 10/11/2026
-- Sau khi chạy: bấm "Refresh schema cache" ở Neon → Data API (có bảng mới).

-- Đề thi: tiêu chí chấm phần thực hành (cho AI chấm nháp bài Scratch)
alter table public.exams add column if not exists practical_rubric text;

-- Bài thi: file thực hành đã nộp, bản AI chấm nháp, số lần nộp chấm Python
alter table public.exam_sessions
  add column if not exists practical_file_url text,
  add column if not exists practical_file_name text,
  add column if not exists practical_ai jsonb,
  add column if not exists practical_lan int not null default 0;

-- Test của đề Python: CHỈ giáo viên / trợ giảng đọc được (học sinh không đọc được kể cả gọi thẳng API)
create table if not exists public.exam_tests (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  thu_tu int not null default 0,
  input text not null default '',
  expected text not null default '',
  diem numeric not null default 1 check (diem > 0)
);
create index if not exists exam_tests_exam_idx on public.exam_tests (exam_id, thu_tu);
alter table public.exam_tests enable row level security;
drop policy if exists "exam_tests: staff" on public.exam_tests;
create policy "exam_tests: staff" on public.exam_tests for all to authenticated
  using ((select public.current_user_role()) in ('teacher', 'assistant'))
  with check ((select public.current_user_role()) in ('teacher', 'assistant'));
grant select, insert, update, delete on public.exam_tests to authenticated;

-- Các lần nộp chấm Python: chỉ máy chủ chấm (vai trò cham_thi) ghi; học sinh đọc lần của mình, giáo viên đọc hết
create table if not exists public.exam_nop_python (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.exam_sessions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  lan int not null,
  code text not null,
  ket_qua jsonb not null,
  diem numeric not null,
  created_at timestamptz not null default now()
);
create index if not exists exam_nop_python_session_idx on public.exam_nop_python (session_id, lan);
alter table public.exam_nop_python enable row level security;
drop policy if exists "exam_nop_python: doc" on public.exam_nop_python;
create policy "exam_nop_python: doc" on public.exam_nop_python for select to authenticated
  using ((select auth.uid()) = user_id or (select public.current_user_role()) in ('teacher', 'assistant'));
grant select on public.exam_nop_python to authenticated;

-- Học sinh không tự ghi điểm / nhận xét / số lần chấm / bản AI chấm phần thực hành (trước đây sửa được khi đang làm bài)
create or replace function public.bao_ve_bai_thi() returns trigger
language plpgsql set search_path = public as $$
begin
  if current_user in ('authenticated', 'anonymous')
     and coalesce((select public.current_user_role()), '') not in ('teacher', 'assistant') then
    if new.practical_score is distinct from old.practical_score
       or new.practical_comment is distinct from old.practical_comment
       or new.practical_reviewed_at is distinct from old.practical_reviewed_at
       or new.practical_lan is distinct from old.practical_lan
       or new.practical_ai::text is distinct from old.practical_ai::text
       or new.user_id is distinct from old.user_id
       or new.exam_id is distinct from old.exam_id then
      raise exception 'forbidden_exam_update' using errcode = '42501';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists exam_sessions_bao_ve on public.exam_sessions;
create trigger exam_sessions_bao_ve before update on public.exam_sessions
  for each row execute function public.bao_ve_bai_thi();

-- Kiểm tra (phải ra: true | true | true)
select
  exists (select 1 from information_schema.tables where table_name = 'exam_tests') as co_bang_test,
  exists (select 1 from information_schema.tables where table_name = 'exam_nop_python') as co_bang_nop,
  exists (select 1 from pg_trigger where tgname = 'exam_sessions_bao_ve') as co_trigger;

-- Bổ sung: ràng buộc cũ chỉ cho 'word' / 'ppt' → thêm 'python', 'scratch' (không có thì không lưu được đề Python / Scratch)
alter table public.exams drop constraint if exists exams_practical_type_check;
alter table public.exams add constraint exams_practical_type_check
  check (practical_type is null or practical_type in ('word', 'ppt', 'python', 'scratch'));

-- Bổ sung (sau khi tạo tài khoản cham_thi): các quy tắc phân quyền sẵn có của exam_sessions gọi 2 hàm kiểm tra vai trò
-- → tài khoản máy chấm cần quyền gọi (2 hàm chỉ trả lời "không phải giáo viên" cho tài khoản này).
grant execute on function public.current_user_role() to cham_thi;
grant execute on function public.is_teacher() to cham_thi;
