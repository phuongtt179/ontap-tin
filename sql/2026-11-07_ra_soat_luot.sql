-- CHẠY TRÊN NEON (08/11/2026 trở đi dữ liệu ở Neon).
-- "Rà soát lỗi" trước khi nộp: học sinh tải file lên, tự rà soát, thấy ổn mới nộp.
-- Lượt rà soát đếm theo (học sinh, bài, ô bài, NGÀY giờ VN) — dùng chung trước và sau khi nộp, tối đa 7 lần/ngày.
-- Học sinh chỉ đọc được lượt của mình; tăng lượt chỉ qua hàm ra_soat_ghi (không tự giảm / xoá được).

create table if not exists public.ra_soat_luot (
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  task_index int not null,
  ngay date not null,
  lan int not null default 0,
  ket_qua jsonb,
  cap_nhat timestamptz not null default now(),
  primary key (user_id, lesson_id, task_index, ngay)
);
alter table public.ra_soat_luot enable row level security;
drop policy if exists "ra_soat_luot: doc cua minh" on public.ra_soat_luot;
create policy "ra_soat_luot: doc cua minh" on public.ra_soat_luot for select to authenticated
  using ((select auth.uid()) = user_id or (select public.current_user_role()) in ('teacher', 'assistant'));
grant select on public.ra_soat_luot to authenticated;

-- Số lượt đã dùng hôm nay của ô bài này
create or replace function public.ra_soat_dem(p_lesson uuid, p_task int)
returns int language sql stable security definer set search_path = public as $$
  select coalesce((select lan from public.ra_soat_luot
    where user_id = auth.uid() and lesson_id = p_lesson and task_index = p_task
      and ngay = (now() at time zone 'Asia/Ho_Chi_Minh')::date), 0)
$$;

-- Ghi 1 lượt rà soát (máy chủ api/ra-soat gọi sau khi AI phân loại xong). Quá 7 lượt/ngày → lỗi het_luot.
create or replace function public.ra_soat_ghi(p_lesson uuid, p_task int, p_ket_qua jsonb)
returns int language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); n int;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  insert into public.ra_soat_luot (user_id, lesson_id, task_index, ngay, lan, ket_qua)
  values (uid, p_lesson, p_task, (now() at time zone 'Asia/Ho_Chi_Minh')::date, 1, p_ket_qua)
  on conflict (user_id, lesson_id, task_index, ngay)
    do update set lan = ra_soat_luot.lan + 1, ket_qua = excluded.ket_qua, cap_nhat = now()
    where ra_soat_luot.lan < 7
  returning lan into n;
  if n is null then raise exception 'het_luot'; end if;
  return n;
end $$;

revoke all on function public.ra_soat_dem(uuid, int) from public, anonymous;
revoke all on function public.ra_soat_ghi(uuid, int, jsonb) from public, anonymous;
grant execute on function public.ra_soat_dem(uuid, int) to authenticated;
grant execute on function public.ra_soat_ghi(uuid, int, jsonb) to authenticated;
