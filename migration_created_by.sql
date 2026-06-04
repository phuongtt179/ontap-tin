-- ============================================================
-- Migration: Thêm cột created_by để theo dõi nội dung trợ giảng tạo
-- ============================================================

ALTER TABLE public.topics    ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);
ALTER TABLE public.lessons   ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);
ALTER TABLE public.exams     ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);

-- RLS: teacher đọc được tất cả (đã có), chỉ cần đảm bảo insert tự ghi auth.uid()
-- Không cần policy riêng vì created_by được set từ frontend với auth.uid()
