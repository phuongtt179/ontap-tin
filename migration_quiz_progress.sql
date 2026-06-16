-- Lưu vị trí câu hỏi hiện tại trong bài quiz bài học để học sinh có thể tiếp tục sau khi tải lại trang
ALTER TABLE public.lesson_progress
  ADD COLUMN IF NOT EXISTS quiz_current_idx integer NOT NULL DEFAULT 0;
