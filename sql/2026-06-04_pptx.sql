-- ============================================================
-- Migration: Thêm hỗ trợ file bài giảng PPTX cho bài học
-- ============================================================

-- lessons: lưu URL file PPTX do giáo viên tải lên
ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS pptx_url TEXT;

-- lesson_progress: theo dõi học sinh đã xem PPTX chưa
ALTER TABLE public.lesson_progress
  ADD COLUMN IF NOT EXISTS pptx_viewed BOOLEAN NOT NULL DEFAULT FALSE;
