-- Thêm cột hint vào bảng questions
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS hint TEXT;
