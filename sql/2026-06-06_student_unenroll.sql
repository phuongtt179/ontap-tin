-- Cho phép học sinh tự xoá enrollment của chính mình (để huỷ đăng ký khoá học)
-- Trước đây chỉ có teacher mới được DELETE

CREATE POLICY "enrollments: student delete own" ON public.student_enrollments
  FOR DELETE USING (auth.uid() = user_id);
