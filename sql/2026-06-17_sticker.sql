-- Hệ thống sticker: học sinh tích lũy sticker khi hoàn thành bài học
-- Khi đủ threshold (mặc định 10), giáo viên trao quà thật
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS sticker_count integer NOT NULL DEFAULT 0,  -- sticker hiện tại (reset sau khi nhận quà)
  ADD COLUMN IF NOT EXISTS sticker_total integer NOT NULL DEFAULT 0;  -- tổng sticker all-time
