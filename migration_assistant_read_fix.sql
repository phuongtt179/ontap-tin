-- ============================================================
-- FIX: Infinite recursion trong profiles: read policy
-- Dùng SECURITY DEFINER function để lấy role mà không trigger RLS
-- ============================================================

-- Bước 1: Tạo function lấy role của user hiện tại (bypass RLS)
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

-- Bước 2: Xóa policy bị lỗi, tạo lại dùng function
DROP POLICY IF EXISTS "profiles: read" ON public.profiles;
CREATE POLICY "profiles: read" ON public.profiles
  FOR SELECT TO authenticated USING (
    auth.uid() = id
    OR public.current_user_role() IN ('teacher', 'assistant')
  );

-- Bước 3: Cập nhật các policy khác cũng bị vấn đề tương tự
DROP POLICY IF EXISTS "lesson_submissions: read" ON public.lesson_submissions;
CREATE POLICY "lesson_submissions: read" ON public.lesson_submissions
  FOR SELECT USING (
    auth.uid() = user_id
    OR public.current_user_role() IN ('teacher', 'assistant')
  );

DROP POLICY IF EXISTS "lesson_progress: own read" ON public.lesson_progress;
CREATE POLICY "lesson_progress: own read" ON public.lesson_progress
  FOR SELECT USING (
    auth.uid() = user_id
    OR public.current_user_role() IN ('teacher', 'assistant')
  );
