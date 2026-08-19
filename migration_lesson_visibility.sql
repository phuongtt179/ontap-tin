-- ============================================================
-- Migration: Publish bài học chỉ cho 1 số học sinh (thay vì cả khoá)
-- ============================================================

-- lessons: cờ đánh dấu bài học bị giới hạn người xem
ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS restricted_audience BOOLEAN NOT NULL DEFAULT FALSE;

-- Danh sách học sinh được xem 1 bài học bị giới hạn (chỉ có ý nghĩa khi restricted_audience = true)
CREATE TABLE IF NOT EXISTS public.lesson_visibility (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id  UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (lesson_id, user_id)
);

CREATE INDEX IF NOT EXISTS lesson_visibility_lesson_idx ON public.lesson_visibility (lesson_id);
CREATE INDEX IF NOT EXISTS lesson_visibility_user_idx ON public.lesson_visibility (user_id);

ALTER TABLE public.lesson_visibility ENABLE ROW LEVEL SECURITY;

-- Học sinh chỉ đọc được dòng của chính mình (để biết mình có được xem bài đó không);
-- giáo viên/trợ giảng đọc được toàn bộ (để soạn danh sách).
CREATE POLICY "lesson_visibility_select" ON public.lesson_visibility
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher','assistant'))
  );

CREATE POLICY "lesson_visibility_insert" ON public.lesson_visibility
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher','assistant'))
  );

CREATE POLICY "lesson_visibility_delete" ON public.lesson_visibility
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher','assistant'))
  );
