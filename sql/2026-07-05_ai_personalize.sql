-- Cá nhân hóa AI trợ giảng theo khóa học
-- Mỗi khóa (grades) có mô tả cho AI biết đang dạy môn gì, cho đối tượng nào
ALTER TABLE public.grades ADD COLUMN IF NOT EXISTS ai_scope text;
