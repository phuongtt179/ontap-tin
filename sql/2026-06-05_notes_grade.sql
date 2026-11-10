-- Thêm cột grade vào student_notes (gắn ghi chú với khoá học)
ALTER TABLE public.student_notes ADD COLUMN IF NOT EXISTS grade TEXT;
