-- CHẠY TRÊN NEON (SQL Editor) — kỳ thi nhiều bài Python, giống thi Tin học trẻ Bảng A: mỗi kỳ 4–5 bài,
-- mỗi bài có đề + bộ test riêng, nộp là máy chủ chấm, tính lần cao nhất của từng bài. 24/11/2026
-- Chạy lại nhiều lần được. PHẢI chạy TRƯỚC khi đưa mã mới lên (api/thi-python.js đọc các bảng / cột này).
-- Sau khi chạy: Neon → Data API → "Refresh schema cache".

-- 1. Bài của kỳ thi. Học sinh đọc được đề bài khi đọc được kỳ thi (theo quyền của bảng exams); chỉ giáo viên / trợ giảng ghi.
create table if not exists public.exam_bai (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  thu_tu int not null default 0,
  ten text not null,
  de_bai text not null default '',
  diem numeric not null default 100 check (diem > 0)   -- trọng số của bài trong kỳ thi (đề thật: mỗi bài 100)
);
create index if not exists exam_bai_exam_idx on public.exam_bai (exam_id, thu_tu);
alter table public.exam_bai enable row level security;
drop policy if exists "exam_bai: doc" on public.exam_bai;
create policy "exam_bai: doc" on public.exam_bai for select to authenticated
  using (exists (select 1 from public.exams e where e.id = exam_bai.exam_id));
drop policy if exists "exam_bai: staff ghi" on public.exam_bai;
create policy "exam_bai: staff ghi" on public.exam_bai for all to authenticated
  using ((select public.current_user_role()) in ('teacher', 'assistant'))
  with check ((select public.current_user_role()) in ('teacher', 'assistant'));
grant select, insert, update, delete on public.exam_bai to authenticated;

-- 2. Test và lần nộp gắn với bài (null = đề 1 bài kiểu cũ)
alter table public.exam_tests add column if not exists bai_id uuid references public.exam_bai(id) on delete cascade;
create index if not exists exam_tests_bai_idx on public.exam_tests (bai_id, thu_tu) where bai_id is not null;
alter table public.exam_nop_python add column if not exists bai_id uuid references public.exam_bai(id) on delete cascade;

-- 3. Điểm + số lần nộp từng bài trong 1 lượt thi. CHỈ máy chấm (cham_thi) ghi; học sinh đọc của mình, giáo viên đọc hết.
create table if not exists public.exam_bai_diem (
  session_id uuid not null references public.exam_sessions(id) on delete cascade,
  bai_id uuid not null references public.exam_bai(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  lan int not null default 0,
  diem numeric not null default 0,
  primary key (session_id, bai_id)
);
create index if not exists exam_bai_diem_user_idx on public.exam_bai_diem (user_id);
alter table public.exam_bai_diem enable row level security;
drop policy if exists "exam_bai_diem: doc" on public.exam_bai_diem;
create policy "exam_bai_diem: doc" on public.exam_bai_diem for select to authenticated
  using ((select auth.uid()) = user_id or (select public.current_user_role()) in ('teacher', 'assistant'));
grant select on public.exam_bai_diem to authenticated;
revoke insert, update, delete on public.exam_bai_diem from authenticated;

-- 4. Quyền của tài khoản máy chấm cham_thi
grant select on public.exam_bai to cham_thi;
grant select, insert, update on public.exam_bai_diem to cham_thi;
drop policy if exists "cham_thi: doc bai" on public.exam_bai;
create policy "cham_thi: doc bai" on public.exam_bai for select to cham_thi using (true);
drop policy if exists "cham_thi: doc diem bai" on public.exam_bai_diem;
create policy "cham_thi: doc diem bai" on public.exam_bai_diem for select to cham_thi using (true);
drop policy if exists "cham_thi: them diem bai" on public.exam_bai_diem;
create policy "cham_thi: them diem bai" on public.exam_bai_diem for insert to cham_thi with check (true);
drop policy if exists "cham_thi: sua diem bai" on public.exam_bai_diem;
create policy "cham_thi: sua diem bai" on public.exam_bai_diem for update to cham_thi using (true) with check (true);

-- Kiểm tra (phải ra: true | true | true | 4)
select
  exists (select 1 from information_schema.tables where table_name = 'exam_bai') as co_bang_bai,
  exists (select 1 from information_schema.columns where table_name = 'exam_tests' and column_name = 'bai_id') as test_co_bai,
  exists (select 1 from information_schema.tables where table_name = 'exam_bai_diem') as co_bang_diem,
  (select count(*) from pg_policies where tablename in ('exam_bai', 'exam_bai_diem') and 'cham_thi' = any(roles)) as quy_tac_cham_thi;
