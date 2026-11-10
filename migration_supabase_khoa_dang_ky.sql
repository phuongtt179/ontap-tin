-- CHẠY TRÊN SUPABASE (08/11/2026). Đăng nhập vẫn ở Supabase, dữ liệu ở Neon.
-- Lỗ hổng: Supabase vẫn nhận đăng ký công khai và trigger lấy vai trò từ thông tin người đăng ký TỰ GỬI
-- → người ngoài tự tạo tài khoản role 'teacher'. Ngoài tắt đăng ký (cấu hình Auth), trigger không còn tin vai trò gửi lên:
-- tài khoản mới luôn là học sinh; vai trò trợ giảng do Edge Function create-user (đã kiểm tra người gọi) đặt.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, role, username, is_approved)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', 'Người dùng'), 'student',
          new.raw_user_meta_data->>'username', true)
  on conflict (id) do update set full_name = excluded.full_name, username = excluded.username;
  return new;
end $$;
