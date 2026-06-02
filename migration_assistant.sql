-- ============================================================
-- Migration: Thêm role 'assistant' (Trợ giảng)
-- Trợ giảng có quyền như teacher nhưng KHÔNG được xóa dữ liệu
-- ============================================================

-- 1. Xóa CHECK constraint cũ trên profiles.role
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- 2. Thêm CHECK constraint mới cho phép 3 role
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('teacher', 'student', 'assistant'));

-- ============================================================
-- 3. Cập nhật RLS policies — tách DELETE ra riêng
--    (assistant được INSERT/UPDATE, không được DELETE)
-- ============================================================

-- ── topics ──
DROP POLICY IF EXISTS "topics: teacher write" ON public.topics;
DROP POLICY IF EXISTS "topics: teacher update" ON public.topics;
DROP POLICY IF EXISTS "topics: teacher delete" ON public.topics;
CREATE POLICY "topics: teacher write" ON public.topics
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher', 'assistant')));
CREATE POLICY "topics: teacher update" ON public.topics
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher', 'assistant')));
CREATE POLICY "topics: teacher delete" ON public.topics
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher'));

-- ── lessons ──
DROP POLICY IF EXISTS "lessons: teacher write" ON public.lessons;
DROP POLICY IF EXISTS "lessons: teacher update" ON public.lessons;
DROP POLICY IF EXISTS "lessons: teacher delete" ON public.lessons;
CREATE POLICY "lessons: teacher write" ON public.lessons
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher', 'assistant')));
CREATE POLICY "lessons: teacher update" ON public.lessons
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher', 'assistant')));
CREATE POLICY "lessons: teacher delete" ON public.lessons
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher'));

-- ── questions ──
DROP POLICY IF EXISTS "questions: teacher write" ON public.questions;
DROP POLICY IF EXISTS "questions: teacher update" ON public.questions;
DROP POLICY IF EXISTS "questions: teacher delete" ON public.questions;
CREATE POLICY "questions: teacher write" ON public.questions
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher', 'assistant')));
CREATE POLICY "questions: teacher update" ON public.questions
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher', 'assistant')));
CREATE POLICY "questions: teacher delete" ON public.questions
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher'));

-- ── exams ──
DROP POLICY IF EXISTS "exams: teacher write" ON public.exams;
DROP POLICY IF EXISTS "exams: teacher update" ON public.exams;
DROP POLICY IF EXISTS "exams: teacher delete" ON public.exams;
CREATE POLICY "exams: teacher write" ON public.exams
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher', 'assistant')));
CREATE POLICY "exams: teacher update" ON public.exams
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher', 'assistant')));
CREATE POLICY "exams: teacher delete" ON public.exams
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher'));

-- ── grades ──
DROP POLICY IF EXISTS "grades: teacher write" ON public.grades;
DROP POLICY IF EXISTS "grades: teacher update" ON public.grades;
DROP POLICY IF EXISTS "grades: teacher delete" ON public.grades;
CREATE POLICY "grades: teacher write" ON public.grades
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher', 'assistant')));
CREATE POLICY "grades: teacher update" ON public.grades
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher', 'assistant')));
CREATE POLICY "grades: teacher delete" ON public.grades
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher'));

-- ── classes ──
DROP POLICY IF EXISTS "classes: teacher write" ON public.classes;
DROP POLICY IF EXISTS "classes: teacher update" ON public.classes;
DROP POLICY IF EXISTS "classes: teacher delete" ON public.classes;
CREATE POLICY "classes: teacher write" ON public.classes
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher', 'assistant')));
CREATE POLICY "classes: teacher update" ON public.classes
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher', 'assistant')));
CREATE POLICY "classes: teacher delete" ON public.classes
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher'));

-- ── profiles — teacher có thể quản lý assistant/student, assistant không xóa ──
DROP POLICY IF EXISTS "profiles: teacher update" ON public.profiles;
DROP POLICY IF EXISTS "profiles: teacher delete" ON public.profiles;
CREATE POLICY "profiles: teacher update" ON public.profiles
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher', 'assistant')));
CREATE POLICY "profiles: teacher delete" ON public.profiles
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher'));

-- ── lesson_submissions — giáo viên/trợ giảng đều chấm được ──
DROP POLICY IF EXISTS "lesson_submissions: teacher update" ON public.lesson_submissions;
CREATE POLICY "lesson_submissions: teacher update" ON public.lesson_submissions
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher', 'assistant')));
