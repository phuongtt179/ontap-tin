-- ============================================================
-- Migration: Chuyển sang hệ thống enrollment đa khoá học
-- Học sinh có thể tham gia nhiều khoá học (khối) với 1 tài khoản
-- ============================================================

-- 1. Tạo bảng student_enrollments
CREATE TABLE IF NOT EXISTS public.student_enrollments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  grade        TEXT NOT NULL,   -- khoá học (tên khối)
  class_name   TEXT,            -- ca học (tên lớp trong khoá)
  is_approved  BOOLEAN NOT NULL DEFAULT FALSE,
  enrolled_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, grade)        -- mỗi học sinh chỉ 1 enrollment / khoá học
);

-- 2. RLS
ALTER TABLE public.student_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "enrollments: read" ON public.student_enrollments
  FOR SELECT USING (
    auth.uid() = user_id
    OR public.current_user_role() IN ('teacher', 'assistant')
  );

CREATE POLICY "enrollments: student insert" ON public.student_enrollments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "enrollments: teacher update" ON public.student_enrollments
  FOR UPDATE USING (public.current_user_role() IN ('teacher', 'assistant'));

CREATE POLICY "enrollments: teacher delete" ON public.student_enrollments
  FOR DELETE USING (public.current_user_role() = 'teacher');

-- 3. Migrate dữ liệu cũ từ profiles → student_enrollments
INSERT INTO public.student_enrollments (user_id, grade, class_name, is_approved)
SELECT id, grade, class_name, COALESCE(is_approved, false)
FROM public.profiles
WHERE role = 'student'
  AND grade IS NOT NULL
  AND grade != ''
ON CONFLICT (user_id, grade) DO NOTHING;

-- 4. XOÁ CỘT (chạy trong migration_enrollment_cleanup.sql sau khi frontend đã deploy xong)
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS grade;
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS class_name;

-- NOTE: is_approved trong profiles vẫn giữ để block/unblock account.
-- is_approved trong student_enrollments dùng để duyệt từng khoá học.
