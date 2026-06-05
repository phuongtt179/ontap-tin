-- ============================================================
-- Migration: Sổ ghi chú học sinh (student_notes)
-- Chạy trong Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Bảng ghi chú
CREATE TABLE IF NOT EXISTS public.student_notes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title      TEXT NOT NULL DEFAULT '',
  content    TEXT NOT NULL DEFAULT '',
  color      TEXT NOT NULL DEFAULT 'yellow',  -- yellow | green | blue | pink | purple | white
  topic      TEXT,
  is_pinned  BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. RLS
ALTER TABLE public.student_notes ENABLE ROW LEVEL SECURITY;

-- Học sinh: đọc/tạo/sửa/xóa note của chính mình
CREATE POLICY "notes: student read own" ON public.student_notes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notes: student insert" ON public.student_notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notes: student update" ON public.student_notes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "notes: student delete" ON public.student_notes
  FOR DELETE USING (auth.uid() = user_id);

-- Giáo viên/trợ giảng: đọc tất cả, xóa bất kỳ
CREATE POLICY "notes: teacher read all" ON public.student_notes
  FOR SELECT USING (public.current_user_role() IN ('teacher', 'assistant'));

CREATE POLICY "notes: teacher delete" ON public.student_notes
  FOR DELETE USING (public.current_user_role() IN ('teacher', 'assistant'));

-- 3. Cột cảnh báo trên profiles (teacher ghi, student đọc)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notes_warning TEXT;
