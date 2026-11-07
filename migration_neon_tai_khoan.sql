-- CHỈ CHẠY TRÊN NEON (07/11/2026). Không chạy trên Supabase.
-- Ở Neon không có bảng tài khoản auth.users (đăng nhập vẫn ở Supabase), nên không có trigger tự tạo hồ sơ
-- và không có xoá dây chuyền từ auth.users. Hai hàm này thay cho phần đó, được Edge Function gọi bằng thẻ của giáo viên.

-- Tạo / cập nhật hồ sơ cho tài khoản vừa tạo ở Supabase (giống trigger handle_new_user + upsert của create-user)
create or replace function public.tao_ho_so(p_id uuid, p_full_name text, p_role text default 'student', p_username text default null)
returns void language plpgsql security definer set search_path = public as $$
declare vai text := (select public.current_user_role());
begin
  if coalesce(vai, '') not in ('teacher', 'assistant') then raise exception 'forbidden'; end if;
  if coalesce(p_role, 'student') <> 'student' and vai <> 'teacher' then raise exception 'forbidden'; end if;
  insert into public.profiles (id, full_name, role, username, is_approved)
  values (p_id, coalesce(p_full_name, 'Người dùng'), coalesce(p_role, 'student'), p_username, true)
  on conflict (id) do update set full_name = excluded.full_name, role = excluded.role, username = excluded.username;
end $$;

-- Xoá dữ liệu của tài khoản sắp bị xoá ở Supabase. Các bảng trỏ tới profiles tự xoá theo (on delete cascade);
-- 3 bảng trước đây trỏ thẳng tới auth.users thì xoá tay.
create or replace function public.xoa_nguoi_dung(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if coalesce((select public.current_user_role()), '') <> 'teacher' then raise exception 'forbidden'; end if;
  if p_id = auth.uid() then raise exception 'khong_tu_xoa'; end if;
  delete from public.attendance_records where user_id = p_id;
  delete from public.reward_requests where student_id = p_id;
  delete from public.messages where student_id = p_id;
  delete from public.profiles where id = p_id;
end $$;

revoke all on function public.tao_ho_so(uuid, text, text, text) from public, anonymous;
revoke all on function public.xoa_nguoi_dung(uuid) from public, anonymous;
grant execute on function public.tao_ho_so(uuid, text, text, text) to authenticated;
grant execute on function public.xoa_nguoi_dung(uuid) to authenticated;
