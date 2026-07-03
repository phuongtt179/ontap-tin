-- Thêm cột sticker_cost riêng cho từng phần thưởng
-- Mặc định 50 để không ảnh hưởng quà cũ
ALTER TABLE public.reward_items
  ADD COLUMN IF NOT EXISTS sticker_cost INTEGER NOT NULL DEFAULT 50;
