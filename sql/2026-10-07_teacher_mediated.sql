-- Mô hình "giáo viên làm trung gian": học sinh không tương tác trực tiếp với AI.
-- CHỈ THÊM MỚI: 2 bảng + cập nhật hàm hàng đợi duyệt. Không sửa/xoá dữ liệu hiện có.

-- 1) Câu hỏi học sinh gửi trong bài học → giáo viên trả lời (AI chỉ soạn nháp cho giáo viên)
CREATE TABLE IF NOT EXISTS public.student_questions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lesson_id     uuid REFERENCES public.lessons(id) ON DELETE SET NULL,
  mode          text NOT NULL DEFAULT 'theory',           -- quiz | practice | theory
  question      text NOT NULL CHECK (length(question) BETWEEN 1 AND 1000),
  context       jsonb,                                      -- câu hỏi trắc nghiệm / đề thực hành (KHÔNG có đáp án)
  status        text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'answered', 'dismissed')),
  answer        text,                                       -- câu trả lời ĐÃ được giáo viên duyệt
  answered_by   uuid REFERENCES public.profiles(id),
  answered_at   timestamptz,
  seen_at       timestamptz,                                -- học sinh đã xem câu trả lời
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS student_questions_status_idx ON public.student_questions (status, created_at);
CREATE INDEX IF NOT EXISTS student_questions_student_idx ON public.student_questions (student_id, lesson_id);

ALTER TABLE public.student_questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS sq_student_select ON public.student_questions;
CREATE POLICY sq_student_select ON public.student_questions FOR SELECT
  USING (student_id = auth.uid());
DROP POLICY IF EXISTS sq_student_insert ON public.student_questions;
CREATE POLICY sq_student_insert ON public.student_questions FOR INSERT
  WITH CHECK (student_id = auth.uid() AND status = 'pending' AND answer IS NULL);
DROP POLICY IF EXISTS sq_student_seen ON public.student_questions;   -- học sinh chỉ được đánh dấu đã xem
CREATE POLICY sq_student_seen ON public.student_questions FOR UPDATE
  USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());
DROP POLICY IF EXISTS sq_staff_all ON public.student_questions;
CREATE POLICY sq_staff_all ON public.student_questions FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('teacher', 'assistant')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('teacher', 'assistant')));

-- Học sinh chỉ được sửa cột seen_at của câu hỏi của mình (không tự điền answer/status)
CREATE OR REPLACE FUNCTION public.sq_guard_student_update() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('teacher', 'assistant')) THEN
    RETURN NEW;
  END IF;
  IF NEW.answer IS DISTINCT FROM OLD.answer OR NEW.status IS DISTINCT FROM OLD.status
     OR NEW.question IS DISTINCT FROM OLD.question OR NEW.answered_by IS DISTINCT FROM OLD.answered_by
     OR NEW.answered_at IS DISTINCT FROM OLD.answered_at OR NEW.student_id IS DISTINCT FROM OLD.student_id THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS sq_guard_student_update ON public.student_questions;
CREATE TRIGGER sq_guard_student_update BEFORE UPDATE ON public.student_questions
  FOR EACH ROW EXECUTE FUNCTION public.sq_guard_student_update();

-- 2) Bản nháp AI soạn cho giáo viên — học sinh KHÔNG đọc được (không có policy cho học sinh)
CREATE TABLE IF NOT EXISTS public.student_question_drafts (
  question_id   uuid PRIMARY KEY REFERENCES public.student_questions(id) ON DELETE CASCADE,
  draft         text,
  skip_reason   text,                                       -- AI đề xuất không cần trả lời (chào hỏi, spam, nói tục...)
  created_at    timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.student_question_drafts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS sqd_staff_all ON public.student_question_drafts;
CREATE POLICY sqd_staff_all ON public.student_question_drafts FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('teacher', 'assistant')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('teacher', 'assistant')));

-- 3) Hàng đợi duyệt: thêm nhóm 'normal' (bài bình thường) để giáo viên duyệt theo lô
CREATE OR REPLACE FUNCTION public.ai_review_queue(p_reason text DEFAULT NULL, p_limit int DEFAULT 30)
RETURNS TABLE (
  id uuid, user_id uuid, lesson_id uuid, student_name text, lesson_title text, grade text,
  score numeric, ai_breakdown jsonb, teacher_comment text, ai_suspect_reason text,
  file_url text, file_name text, text_content text, content_json jsonb,
  submitted_at timestamptz, sticker_awarded boolean, reason text, reason_total bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('teacher', 'assistant')
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  WITH ai AS (
    SELECT s.*,
           row_number() OVER (PARTITION BY s.lesson_id ORDER BY s.ai_graded_at) AS rn_in_lesson
    FROM public.lesson_submissions s
    WHERE s.graded_by = 'ai'
  ),
  ranked AS (
    SELECT a.*,
      CASE
        WHEN a.score >= 5 AND a.file_url IS NULL AND length(trim(coalesce(a.text_content, ''))) < 15 THEN 'empty'
        WHEN a.ai_suspect THEN 'suspect'
        WHEN a.score < 5 THEN 'low'
        WHEN a.rn_in_lesson <= 3 THEN 'first'
        WHEN abs(hashtext(a.id::text)) % 20 = 0 THEN 'sample'
        ELSE 'normal'
      END AS why
    FROM ai a
    WHERE a.reviewed_at IS NULL AND a.score IS NOT NULL
  ),
  counted AS (
    SELECT r.*, count(*) OVER (PARTITION BY r.why) AS why_total FROM ranked r
  )
  SELECT c.id, c.user_id, c.lesson_id, p.full_name, l.title, l.grade,
         c.score, c.ai_breakdown, c.teacher_comment, c.ai_suspect_reason,
         c.file_url, c.file_name, left(c.text_content, 3000), c.content_json,
         c.submitted_at, c.sticker_awarded, c.why, c.why_total
  FROM counted c
  JOIN public.profiles p ON p.id = c.user_id
  JOIN public.lessons  l ON l.id = c.lesson_id
  WHERE (p_reason IS NULL AND c.why <> 'normal') OR c.why = p_reason
  ORDER BY CASE c.why WHEN 'empty' THEN 95 WHEN 'suspect' THEN 90 WHEN 'low' THEN 70 WHEN 'first' THEN 50 WHEN 'sample' THEN 20 ELSE 10 END DESC,
           c.submitted_at DESC
  LIMIT greatest(1, least(p_limit, 100));
END;
$$;

CREATE OR REPLACE FUNCTION public.ai_tools_summary()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE result jsonb;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('teacher', 'assistant')
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT jsonb_build_object(
    'review', (SELECT jsonb_object_agg(r, coalesce((SELECT q.reason_total FROM public.ai_review_queue(r, 1) q LIMIT 1), 0))
               FROM unnest(ARRAY['empty', 'suspect', 'low', 'first', 'sample', 'normal']) AS r),
    'ai_unreviewed', (SELECT count(*) FROM public.lesson_submissions
                      WHERE graded_by = 'ai' AND reviewed_at IS NULL),
    'ungraded', (SELECT count(*) FROM public.lesson_submissions
                 WHERE score IS NULL AND graded_by IS NULL AND reviewed_at IS NULL),
    'questions_pending', (SELECT count(*) FROM public.student_questions WHERE status = 'pending')
  ) INTO result;
  RETURN result;
END;
$$;
