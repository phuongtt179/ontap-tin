-- ============================================================
-- Cleanup: Xoá cột grade và class_name khỏi bảng profiles
-- Chạy SAU KHI đã deploy code mới (tất cả query đã dùng student_enrollments)
-- ============================================================

-- 1. Cập nhật policy "exams: student read active" dùng student_enrollments
--    (policy cũ đọc profiles.grade nên block việc DROP COLUMN)
DROP POLICY IF EXISTS "exams: student read active" ON public.exams;
CREATE POLICY "exams: student read active" ON public.exams
  FOR SELECT TO authenticated
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM public.student_enrollments
      WHERE user_id = auth.uid()
        AND grade = exams.grade
        AND is_approved = true
    )
  );

-- 2. Xoá cột cũ (giờ không còn dependency)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS grade;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS class_name;
