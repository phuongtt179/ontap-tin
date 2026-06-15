-- Cấp 3: Tiêu đề bài học nhỏ bên trong mỗi bài (unit)
CREATE TABLE IF NOT EXISTS public.lesson_titles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id     UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  sort_order  INT  NOT NULL DEFAULT 0,
  created_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE(unit_id, name)
);

-- Gắn câu hỏi vào tiêu đề bài học
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS lesson_title_id UUID REFERENCES public.lesson_titles(id) ON DELETE SET NULL;

-- Gắn bài học (nội dung) vào tiêu đề bài học
ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS lesson_title_id UUID REFERENCES public.lesson_titles(id) ON DELETE SET NULL;

-- Index
CREATE INDEX IF NOT EXISTS idx_lesson_titles_unit_id      ON public.lesson_titles(unit_id);
CREATE INDEX IF NOT EXISTS idx_questions_lesson_title_id  ON public.questions(lesson_title_id);
CREATE INDEX IF NOT EXISTS idx_lessons_lesson_title_id    ON public.lessons(lesson_title_id);

-- RLS
ALTER TABLE public.lesson_titles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teacher_all_lesson_titles" ON public.lesson_titles
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher','assistant'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher','assistant'))
  );

CREATE POLICY "student_read_lesson_titles" ON public.lesson_titles
  FOR SELECT TO authenticated
  USING (true);
