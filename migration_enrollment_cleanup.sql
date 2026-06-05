-- ============================================================
-- Cleanup: Xoá cột grade và class_name khỏi bảng profiles
-- Chạy SAU KHI đã deploy code mới (tất cả query đã dùng student_enrollments)
-- ============================================================

ALTER TABLE public.profiles DROP COLUMN IF EXISTS grade;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS class_name;
