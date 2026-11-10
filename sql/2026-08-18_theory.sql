-- ============================================================
-- Migration: Thêm bước "Lý thuyết" (markdown) cho bài học
-- ============================================================

-- lesson_progress: theo dõi học sinh đã đọc phần lý thuyết chưa
ALTER TABLE public.lesson_progress
  ADD COLUMN IF NOT EXISTS theory_read BOOLEAN NOT NULL DEFAULT FALSE;
