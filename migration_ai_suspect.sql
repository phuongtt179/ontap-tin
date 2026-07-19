-- Cờ nghi ngờ học sinh dùng AI viết hộ bài (AI chấm bài tự đánh giá dấu hiệu)
ALTER TABLE public.lesson_submissions ADD COLUMN IF NOT EXISTS ai_suspect boolean DEFAULT false;
ALTER TABLE public.lesson_submissions ADD COLUMN IF NOT EXISTS ai_suspect_reason text;
