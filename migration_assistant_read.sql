-- ============================================================
-- Migration: Thêm role 'assistant' vào RLS SELECT policies
-- Trợ giảng cần đọc được lesson_submissions và lesson_progress
-- để vào trang chấm bài hoạt động đúng như giáo viên.
-- ============================================================

-- ── lesson_submissions: read ──
-- Policy gốc chỉ cho role = 'teacher', thiếu 'assistant'
DROP POLICY IF EXISTS "lesson_submissions: read" ON public.lesson_submissions;
CREATE POLICY "lesson_submissions: read" ON public.lesson_submissions
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher', 'assistant'))
  );

-- ── lesson_progress: own read ──
-- Policy gốc chỉ cho role = 'teacher', thiếu 'assistant'
DROP POLICY IF EXISTS "lesson_progress: own read" ON public.lesson_progress;
CREATE POLICY "lesson_progress: own read" ON public.lesson_progress
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher', 'assistant'))
  );
