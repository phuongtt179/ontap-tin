-- CHẠY TRÊN NEON (SQL Editor) — "phòng thi" giai đoạn 1: ngân hàng bài + kỳ thi chọn bài (liên kết) + học sinh luyện bài lẻ. 25/11/2026
-- Chạy lại nhiều lần được. Chạy TRƯỚC khi đưa mã mới lên. Sau khi chạy: Neon → Data API → "Refresh schema cache".
-- Thiết kế: bài xếp theo ỨNG DỤNG (python / scratch / word / ppt / go_phim / thu_muc), mở cho KHOÁ (grades.value);
-- mỗi bài có CÁCH CHẤM (test / tieu_chi / do_tu_dong / cau_truc). Giai đoạn 1 chỉ chấm python bằng test.

-- 1. Ngân hàng bài — phần học sinh được đọc (đề bài). Lời giải, tiêu chí, test để ở bảng riêng chỉ giáo viên đọc.
create table if not exists public.bai_luyen (
  id uuid primary key default gen_random_uuid(),
  ung_dung text not null default 'python' check (ung_dung in ('python', 'scratch', 'word', 'ppt', 'go_phim', 'thu_muc')),
  cach_cham text not null default 'test' check (cach_cham in ('test', 'tieu_chi', 'do_tu_dong', 'cau_truc')),
  ten text not null,
  de_bai text not null default '',
  dang text,                                   -- dạng bài (chuyên đề), danh sách cố định ở src/domain/nganHang.js
  do_kho text check (do_kho in ('de', 'trung_binh', 'kho')),
  nguon text,
  tu_khoa_hoc boolean not null default false,  -- bài chép từ khoá học: học sinh có thể đã thấy test trong khoá
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists bai_luyen_loc_idx on public.bai_luyen (ung_dung, dang, do_kho);

-- 2. Phần bí mật của bài: lời giải mẫu, tiêu chí chấm — CHỈ giáo viên / trợ giảng
create table if not exists public.bai_luyen_bi_mat (
  bai_id uuid primary key references public.bai_luyen(id) on delete cascade,
  loi_giai text not null default '',
  tieu_chi text not null default ''
);

-- 3. Test của bài — CHỈ giáo viên / trợ giảng (máy chấm đọc bằng tài khoản cham_thi)
create table if not exists public.bai_luyen_test (
  id uuid primary key default gen_random_uuid(),
  bai_id uuid not null references public.bai_luyen(id) on delete cascade,
  thu_tu int not null default 0,
  input text not null default '',
  expected text not null default '',
  diem numeric not null default 1 check (diem > 0)
);
create index if not exists bai_luyen_test_bai_idx on public.bai_luyen_test (bai_id, thu_tu);

-- 4. Bài mở cho khoá nào (học sinh khoá đó được luyện)
create table if not exists public.bai_luyen_mo (
  bai_id uuid not null references public.bai_luyen(id) on delete cascade,
  grade text not null,
  primary key (bai_id, grade)
);
create index if not exists bai_luyen_mo_grade_idx on public.bai_luyen_mo (grade);

-- 5. Kết quả luyện: lần nộp (chỉ máy chấm ghi) + tổng hợp điểm cao nhất từng bài của từng em
create table if not exists public.bai_luyen_nop (
  id uuid primary key default gen_random_uuid(),
  bai_id uuid not null references public.bai_luyen(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  code text not null,
  ket_qua jsonb not null,
  diem numeric not null,
  created_at timestamptz not null default now()
);
create index if not exists bai_luyen_nop_user_idx on public.bai_luyen_nop (user_id, created_at desc);
create index if not exists bai_luyen_nop_bai_idx on public.bai_luyen_nop (bai_id, user_id);
create table if not exists public.bai_luyen_ket_qua (
  bai_id uuid not null references public.bai_luyen(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  diem numeric not null default 0,
  so_lan int not null default 0,
  cap_nhat timestamptz not null default now(),
  primary key (bai_id, user_id)
);
create index if not exists bai_luyen_ket_qua_user_idx on public.bai_luyen_ket_qua (user_id);

-- 6. Kỳ thi dùng bài ngân hàng theo LIÊN KẾT: có bai_luyen_id thì đề + test lấy từ ngân hàng
alter table public.exam_bai add column if not exists bai_luyen_id uuid references public.bai_luyen(id) on delete restrict;
create index if not exists exam_bai_bai_luyen_idx on public.exam_bai (bai_luyen_id) where bai_luyen_id is not null;

-- 7. Quyền (RLS)
alter table public.bai_luyen enable row level security;
alter table public.bai_luyen_bi_mat enable row level security;
alter table public.bai_luyen_test enable row level security;
alter table public.bai_luyen_mo enable row level security;
alter table public.bai_luyen_nop enable row level security;
alter table public.bai_luyen_ket_qua enable row level security;

-- giáo viên / trợ giảng: toàn quyền ngân hàng
drop policy if exists "bai_luyen: staff" on public.bai_luyen;
create policy "bai_luyen: staff" on public.bai_luyen for all to authenticated
  using ((select public.current_user_role()) in ('teacher', 'assistant'))
  with check ((select public.current_user_role()) in ('teacher', 'assistant'));
-- học sinh: chỉ đọc bài mở cho khoá em đã được duyệt, hoặc bài nằm trong một kỳ thi (đề thi học sinh đọc được)
drop policy if exists "bai_luyen: hoc sinh doc" on public.bai_luyen;
create policy "bai_luyen: hoc sinh doc" on public.bai_luyen for select to authenticated
  using (
    exists (select 1 from public.bai_luyen_mo m join public.student_enrollments e on e.grade = m.grade
            where m.bai_id = bai_luyen.id and e.user_id = (select auth.uid()) and e.is_approved = true)
    or exists (select 1 from public.exam_bai eb where eb.bai_luyen_id = bai_luyen.id)
  );

drop policy if exists "bai_luyen_bi_mat: staff" on public.bai_luyen_bi_mat;
create policy "bai_luyen_bi_mat: staff" on public.bai_luyen_bi_mat for all to authenticated
  using ((select public.current_user_role()) in ('teacher', 'assistant'))
  with check ((select public.current_user_role()) in ('teacher', 'assistant'));
drop policy if exists "bai_luyen_test: staff" on public.bai_luyen_test;
create policy "bai_luyen_test: staff" on public.bai_luyen_test for all to authenticated
  using ((select public.current_user_role()) in ('teacher', 'assistant'))
  with check ((select public.current_user_role()) in ('teacher', 'assistant'));

drop policy if exists "bai_luyen_mo: doc" on public.bai_luyen_mo;
create policy "bai_luyen_mo: doc" on public.bai_luyen_mo for select to authenticated using (true);
drop policy if exists "bai_luyen_mo: staff ghi" on public.bai_luyen_mo;
create policy "bai_luyen_mo: staff ghi" on public.bai_luyen_mo for all to authenticated
  using ((select public.current_user_role()) in ('teacher', 'assistant'))
  with check ((select public.current_user_role()) in ('teacher', 'assistant'));

-- lần nộp / kết quả: học sinh đọc của mình, giáo viên đọc hết; KHÔNG ai ghi trực tiếp (chỉ máy chấm cham_thi)
drop policy if exists "bai_luyen_nop: doc" on public.bai_luyen_nop;
create policy "bai_luyen_nop: doc" on public.bai_luyen_nop for select to authenticated
  using ((select auth.uid()) = user_id or (select public.current_user_role()) in ('teacher', 'assistant'));
drop policy if exists "bai_luyen_ket_qua: doc" on public.bai_luyen_ket_qua;
create policy "bai_luyen_ket_qua: doc" on public.bai_luyen_ket_qua for select to authenticated
  using ((select auth.uid()) = user_id or (select public.current_user_role()) in ('teacher', 'assistant'));

grant select, insert, update, delete on public.bai_luyen, public.bai_luyen_bi_mat, public.bai_luyen_test, public.bai_luyen_mo to authenticated;
grant select on public.bai_luyen_nop, public.bai_luyen_ket_qua to authenticated;
revoke insert, update, delete on public.bai_luyen_nop, public.bai_luyen_ket_qua from authenticated;

-- 8. Máy chấm cham_thi: đọc bài, test, khoá được mở, ghi danh; ghi lần nộp + kết quả luyện
grant select on public.bai_luyen, public.bai_luyen_test, public.bai_luyen_mo, public.student_enrollments to cham_thi;
grant select, insert on public.bai_luyen_nop to cham_thi;
grant select, insert, update on public.bai_luyen_ket_qua to cham_thi;
drop policy if exists "cham_thi: doc bai luyen" on public.bai_luyen;
create policy "cham_thi: doc bai luyen" on public.bai_luyen for select to cham_thi using (true);
drop policy if exists "cham_thi: doc test luyen" on public.bai_luyen_test;
create policy "cham_thi: doc test luyen" on public.bai_luyen_test for select to cham_thi using (true);
drop policy if exists "cham_thi: doc bai mo" on public.bai_luyen_mo;
create policy "cham_thi: doc bai mo" on public.bai_luyen_mo for select to cham_thi using (true);
drop policy if exists "cham_thi: doc ghi danh" on public.student_enrollments;
create policy "cham_thi: doc ghi danh" on public.student_enrollments for select to cham_thi using (true);
drop policy if exists "cham_thi: doc nop luyen" on public.bai_luyen_nop;
create policy "cham_thi: doc nop luyen" on public.bai_luyen_nop for select to cham_thi using (true);
drop policy if exists "cham_thi: ghi nop luyen" on public.bai_luyen_nop;
create policy "cham_thi: ghi nop luyen" on public.bai_luyen_nop for insert to cham_thi with check (true);
drop policy if exists "cham_thi: doc ket qua luyen" on public.bai_luyen_ket_qua;
create policy "cham_thi: doc ket qua luyen" on public.bai_luyen_ket_qua for select to cham_thi using (true);
drop policy if exists "cham_thi: them ket qua luyen" on public.bai_luyen_ket_qua;
create policy "cham_thi: them ket qua luyen" on public.bai_luyen_ket_qua for insert to cham_thi with check (true);
drop policy if exists "cham_thi: sua ket qua luyen" on public.bai_luyen_ket_qua;
create policy "cham_thi: sua ket qua luyen" on public.bai_luyen_ket_qua for update to cham_thi using (true) with check (true);

-- Kiểm tra (phải ra: 6 | true | 9)
select
  (select count(*) from information_schema.tables where table_name like 'bai_luyen%') as so_bang,
  exists (select 1 from information_schema.columns where table_name = 'exam_bai' and column_name = 'bai_luyen_id') as kythi_lien_ket,
  (select count(*) from pg_policies where 'cham_thi' = any(roles) and (tablename like 'bai_luyen%' or tablename = 'student_enrollments')) as quy_tac_cham_thi;
