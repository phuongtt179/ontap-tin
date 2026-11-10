-- ============================================================
-- Migration: Thêm role 'assistant' vào RLS SELECT policies
-- Trợ giảng cần đọc profiles, lesson_submissions, lesson_progress
-- để vào trang chấm bài hoạt động đúng như giáo viên.
-- ============================================================

-- ── profiles: read ──
-- Policy gốc chỉ cho role = 'teacher', thiếu 'assistant'
-- Trợ giảng cần đọc profiles để lấy danh sách học sinh theo khối
DROP POLICY IF EXISTS "profiles: read" ON public.profiles;
CREATE POLICY "profiles: read" ON public.profiles
  FOR SELECT TO authenticated USING (
    auth.uid() = id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('teacher', 'assistant'))
  );

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
