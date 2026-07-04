-- Fix reward_requests: đổi FK student_id từ auth.users → profiles
-- để PostgREST có thể join profiles(full_name, id) tự động

-- Bước 1: Xóa FK cũ trỏ vào auth.users
ALTER TABLE public.reward_requests
  DROP CONSTRAINT IF EXISTS reward_requests_student_id_fkey;

-- Bước 2: Thêm FK mới trỏ vào public.profiles (cùng giá trị id, nhưng PostgREST thấy được)
ALTER TABLE public.reward_requests
  ADD CONSTRAINT reward_requests_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Bước 3: Thêm cột created_at để code không bị lỗi ORDER BY
-- (bảng hiện tại có requested_at, thêm created_at làm generated column)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'reward_requests'
      AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.reward_requests
      ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    -- Cập nhật created_at = requested_at cho các row cũ
    UPDATE public.reward_requests SET created_at = COALESCE(requested_at, NOW());
  END IF;
END $$;

-- Bước 4: Thêm cột fulfilled_at nếu chưa có (code dùng fulfilled_at, schema có given_at)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'reward_requests'
      AND column_name = 'fulfilled_at'
  ) THEN
    ALTER TABLE public.reward_requests ADD COLUMN fulfilled_at TIMESTAMPTZ;
    UPDATE public.reward_requests SET fulfilled_at = given_at WHERE given_at IS NOT NULL;
  END IF;
END $$;
