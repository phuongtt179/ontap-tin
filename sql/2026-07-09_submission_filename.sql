-- Lưu tên file gốc học sinh đặt (Cloudinary đổi URL thành public_id ngẫu nhiên)
-- Dùng để hiển thị đúng tên + cho AI chấm quy tắc đặt tên file
ALTER TABLE public.lesson_submissions ADD COLUMN IF NOT EXISTS file_name text;
