-- ============================================================
-- MIGRATION: Thêm tính năng tự đăng ký + phê duyệt tài khoản
-- Chạy trong Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Thêm cột is_approved và is_active vào profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_approved boolean NOT NULL DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active  boolean NOT NULL DEFAULT true;

-- 2. Cập nhật trigger để đọc is_approved từ metadata đăng ký
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
begin
  INSERT INTO public.profiles (id, full_name, role, grade, class_name, username, is_approved)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Người dùng'),
    COALESCE(new.raw_user_meta_data->>'role', 'student'),
    new.raw_user_meta_data->>'grade',
    new.raw_user_meta_data->>'class_name',
    new.raw_user_meta_data->>'username',
    COALESCE((new.raw_user_meta_data->>'is_approved')::boolean, true)
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Cho phép giáo viên cập nhật profile của học sinh (để duyệt tài khoản)
DROP POLICY IF EXISTS "profiles: teacher update" ON public.profiles;
CREATE POLICY "profiles: teacher update" ON public.profiles
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher'));

-- 4. Cho phép anonymous đọc danh sách lớp (để hiển thị trong form đăng ký)
DROP POLICY IF EXISTS "classes: authenticated read" ON public.classes;
CREATE POLICY "classes: public read" ON public.classes
  FOR SELECT USING (true);

-- LƯU Ý: Đảm bảo tắt "Email confirmations" trong Supabase Auth Settings
-- để học sinh tự đăng ký không cần xác nhận email (dùng @school.local)
