-- ============================================================
-- Fix: handle_new_user trigger sau khi migration_enrollment_cleanup.sql
-- đã xoá cột grade và class_name khỏi bảng profiles.
-- Chạy trong Supabase Dashboard > SQL Editor
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
begin
  INSERT INTO public.profiles (id, full_name, role, username, is_approved)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Người dùng'),
    COALESCE(new.raw_user_meta_data->>'role', 'student'),
    new.raw_user_meta_data->>'username',
    COALESCE((new.raw_user_meta_data->>'is_approved')::boolean, true)
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name  = EXCLUDED.full_name,
    role       = EXCLUDED.role,
    username   = EXCLUDED.username;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
