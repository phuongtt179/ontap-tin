-- Danh mục bài học (units) per topic per grade
CREATE TABLE IF NOT EXISTS public.units (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  grade       TEXT NOT NULL,
  topic       TEXT NOT NULL,
  sort_order  INT  NOT NULL DEFAULT 0,
  created_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE(name, grade, topic)
);

-- Gắn câu hỏi vào bài
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL;

-- Gắn bài học (nội dung) vào bài
ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL;

-- Index để filter nhanh
CREATE INDEX IF NOT EXISTS idx_units_grade_topic   ON public.units(grade, topic);
CREATE INDEX IF NOT EXISTS idx_questions_unit_id   ON public.questions(unit_id);
CREATE INDEX IF NOT EXISTS idx_lessons_unit_id     ON public.lessons(unit_id);

-- RLS
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;

-- Teacher/assistant: toàn quyền
CREATE POLICY "teacher_all_units" ON public.units
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher','assistant'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher','assistant'))
  );

-- Student: chỉ đọc
CREATE POLICY "student_read_units" ON public.units
  FOR SELECT TO authenticated
  USING (true);
