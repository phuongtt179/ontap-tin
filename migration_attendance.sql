-- Buổi điểm danh do giáo viên mở/đóng
CREATE TABLE IF NOT EXISTS public.attendance_sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grade        TEXT NOT NULL,
  class_name   TEXT,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  opened_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at    TIMESTAMPTZ,
  created_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Bản ghi điểm danh của học sinh
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(session_id, user_id)
);

-- RLS
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records  ENABLE ROW LEVEL SECURITY;

-- Giáo viên / trợ giảng: toàn quyền
CREATE POLICY "teacher_all_sessions" ON public.attendance_sessions
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher','assistant'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher','assistant'))
  );

-- Học sinh: chỉ xem buổi đang mở phù hợp với khoá/lớp của mình
CREATE POLICY "student_read_open_sessions" ON public.attendance_sessions
  FOR SELECT TO authenticated
  USING (
    closed_at IS NULL AND
    EXISTS (
      SELECT 1 FROM public.student_enrollments se
      WHERE se.user_id = auth.uid()
        AND se.grade = attendance_sessions.grade
        AND se.is_approved = true
        AND (
          attendance_sessions.class_name IS NULL
          OR se.class_name = attendance_sessions.class_name
          OR se.class_name IS NULL
        )
    )
  );

-- Giáo viên / trợ giảng: toàn quyền trên records
CREATE POLICY "teacher_all_records" ON public.attendance_records
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher','assistant'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher','assistant'))
  );

-- Học sinh: chỉ xem records của mình
CREATE POLICY "student_read_own_records" ON public.attendance_records
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Học sinh: chỉ insert record của mình, vào buổi đang mở và phù hợp enrollment
CREATE POLICY "student_insert_record" ON public.attendance_records
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1
      FROM public.attendance_sessions s
      JOIN public.student_enrollments se
        ON se.grade = s.grade
       AND se.user_id = auth.uid()
       AND se.is_approved = true
       AND (s.class_name IS NULL OR se.class_name = s.class_name OR se.class_name IS NULL)
      WHERE s.id = attendance_records.session_id
        AND s.closed_at IS NULL
    )
  );
