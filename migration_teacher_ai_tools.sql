-- Trung tâm AI cho giáo viên (/teacher/ai-tools)
-- CHỈ THÊM MỚI: 1 cột nullable + 1 hàm đọc. Không sửa/xoá dữ liệu hiện có.

-- 1) Nội dung bài học CHỈ dành cho gia sư AI (học sinh không thấy).
--    KHÔNG dùng lessons.ai_context vì cột đó là phần "Lý thuyết" hiện cho học sinh và là điều kiện
--    hoàn thành bài — tự điền vào sẽ làm xuất hiện bước học mới và chặn tiến độ học sinh.
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS ai_tutor_notes text;

-- 2) Hàng đợi duyệt bài AI đã chấm: xếp các bài CẦN giáo viên xem trước.
--    Lý do (reason) — ưu tiên giảm dần:
--      empty  (95): có điểm ≥5 nhưng bài gần như trống (không file, ghi chú rất ngắn)
--      suspect(90): AI nghi học sinh dùng AI viết hộ
--      low    (70): điểm < 5
--      first  (50): 1 trong 3 bài đầu tiên AI chấm ở bài học đó (kiểm tra tiêu chí chấm có ổn không)
--      sample (20): mẫu ngẫu nhiên ~5% — để đo độ chính xác của AI một cách khách quan
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
      END AS why
    FROM ai a
    WHERE a.reviewed_at IS NULL AND a.score IS NOT NULL
  ),
  counted AS (
    SELECT r.*, count(*) OVER (PARTITION BY r.why) AS why_total
    FROM ranked r WHERE r.why IS NOT NULL
  )
  SELECT c.id, c.user_id, c.lesson_id, p.full_name, l.title, l.grade,
         c.score, c.ai_breakdown, c.teacher_comment, c.ai_suspect_reason,
         c.file_url, c.file_name, left(c.text_content, 3000), c.content_json,
         c.submitted_at, c.sticker_awarded, c.why, c.why_total
  FROM counted c
  JOIN public.profiles p ON p.id = c.user_id
  JOIN public.lessons  l ON l.id = c.lesson_id
  WHERE p_reason IS NULL OR c.why = p_reason
  ORDER BY CASE c.why WHEN 'empty' THEN 95 WHEN 'suspect' THEN 90 WHEN 'low' THEN 70 WHEN 'first' THEN 50 ELSE 20 END DESC,
           c.submitted_at DESC
  LIMIT greatest(1, least(p_limit, 100));
END;
$$;

REVOKE ALL ON FUNCTION public.ai_review_queue(text, int) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.ai_review_queue(text, int) TO authenticated;

-- 3) Số liệu tóm tắt cho Trung tâm AI: số bài theo từng lý do cần duyệt + số bài chưa có điểm
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
    -- Đếm riêng từng lý do (gọi hàng đợi lọc theo lý do, lấy tổng của nhóm đó)
    'review', (SELECT jsonb_object_agg(r, coalesce((SELECT q.reason_total FROM public.ai_review_queue(r, 1) q LIMIT 1), 0))
               FROM unnest(ARRAY['empty', 'suspect', 'low', 'first', 'sample']) AS r),
    'ai_unreviewed', (SELECT count(*) FROM public.lesson_submissions
                      WHERE graded_by = 'ai' AND reviewed_at IS NULL),
    'ungraded', (SELECT count(*) FROM public.lesson_submissions
                 WHERE score IS NULL AND graded_by IS NULL AND reviewed_at IS NULL)
  ) INTO result;
  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.ai_tools_summary() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.ai_tools_summary() TO authenticated;
