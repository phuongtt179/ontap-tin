-- Cho phép giáo viên mở lại quyền nộp bài cho học sinh
ALTER TABLE lesson_submissions ADD COLUMN IF NOT EXISTS allow_resubmit BOOLEAN DEFAULT FALSE;
