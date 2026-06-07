-- Fix: Cho phép giáo viên INSERT vào student_enrollments
-- (policy cũ chỉ có UPDATE cho teacher, INSERT chỉ cho student tự đăng ký)

CREATE POLICY "enrollments: teacher insert" ON public.student_enrollments
  FOR INSERT WITH CHECK (public.current_user_role() IN ('teacher', 'assistant'));
