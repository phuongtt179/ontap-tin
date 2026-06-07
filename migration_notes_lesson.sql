-- Thêm cột lesson_id vào student_notes (gắn ghi chú với bài học cụ thể)
ALTER TABLE public.student_notes ADD COLUMN IF NOT EXISTS lesson_id UUID REFERENCES public.lessons(id) ON DELETE SET NULL;
