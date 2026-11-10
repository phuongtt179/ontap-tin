-- Hệ thống quà thưởng sticker
-- Giáo viên cài sẵn danh sách quà, học sinh đổi sticker lấy quà

CREATE TABLE IF NOT EXISTS public.reward_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  emoji       TEXT NOT NULL DEFAULT '🎁',
  description TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.reward_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_item_id  UUID NOT NULL REFERENCES public.reward_items(id),
  sticker_cost    INTEGER NOT NULL DEFAULT 10,
  status          TEXT NOT NULL DEFAULT 'pending', -- pending | given
  requested_at    TIMESTAMPTZ DEFAULT NOW(),
  given_at        TIMESTAMPTZ,
  note            TEXT
);

-- RLS
ALTER TABLE public.reward_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teacher_all_reward_items" ON public.reward_items
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher','assistant')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher','assistant')));

CREATE POLICY "student_read_reward_items" ON public.reward_items
  FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY "student_insert_reward_requests" ON public.reward_requests
  FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid());

CREATE POLICY "student_read_own_requests" ON public.reward_requests
  FOR SELECT TO authenticated USING (student_id = auth.uid());

CREATE POLICY "teacher_all_reward_requests" ON public.reward_requests
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher','assistant')));
