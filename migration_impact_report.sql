-- Báo cáo tác động (trang /teacher/impact)
-- CHỈ THÊM MỚI: 1 cột nullable + 1 hàm đọc. Không sửa/xoá dữ liệu hiện có.

-- 1) Lưu điểm AI chấm GỐC. Khi giáo viên sửa điểm, `score` bị ghi đè nên không còn so sánh được
--    AI vs giáo viên; cột này giữ lại điểm AI để đo độ khớp từ nay về sau.
ALTER TABLE public.lesson_submissions ADD COLUMN IF NOT EXISTS ai_score numeric(4,1);

-- 2) Tổng hợp số liệu ở phía DB (tránh kéo hàng chục nghìn dòng về trình duyệt).
--    SECURITY DEFINER nhưng chỉ trả dữ liệu khi người gọi là teacher/assistant.
--    Chỉ trả SỐ TỔNG HỢP — không có tên hay thông tin cá nhân học sinh.
CREATE OR REPLACE FUNCTION public.impact_stats()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher', 'assistant')
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  WITH activity AS (
    SELECT user_id AS uid, updated_at AS at FROM public.lesson_progress
    UNION ALL SELECT user_id, submitted_at FROM public.lesson_submissions
    UNION ALL SELECT student_id, created_at FROM public.messages
      WHERE channel = 'ai' AND sender_role = 'student'
  ),
  months AS (
    SELECT to_char(date_trunc('month', at), 'YYYY-MM') AS month,
           count(DISTINCT uid) AS active_students
    FROM activity GROUP BY 1
  ),
  subs AS (
    SELECT to_char(date_trunc('month', submitted_at), 'YYYY-MM') AS month,
           count(*) AS submissions,
           count(*) FILTER (WHERE graded_by = 'ai') AS ai_graded,
           round(avg(score), 2) AS avg_score
    FROM public.lesson_submissions GROUP BY 1
  ),
  tutor AS (
    SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS month,
           count(*) AS ai_questions
    FROM public.messages WHERE channel = 'ai' AND sender_role = 'student' GROUP BY 1
  ),
  done AS (
    SELECT to_char(date_trunc('month', updated_at), 'YYYY-MM') AS month,
           count(*) AS lessons_completed
    FROM public.lesson_progress WHERE completed GROUP BY 1
  ),
  weekly AS (
    SELECT to_char(date_trunc('week', at), 'YYYY-MM-DD') AS week,
           count(DISTINCT uid) AS active_students
    FROM activity WHERE at >= now() - interval '12 weeks' GROUP BY 1
  )
  SELECT jsonb_build_object(
    'generated_at', now(),
    'totals', jsonb_build_object(
      'students',          (SELECT count(*) FROM public.profiles WHERE role = 'student' AND is_approved),
      'classes',           (SELECT count(*) FROM public.classes),
      'lessons_published', (SELECT count(*) FROM public.lessons WHERE is_published),
      'lessons_completed', (SELECT count(*) FROM public.lesson_progress WHERE completed),
      'submissions',       (SELECT count(*) FROM public.lesson_submissions),
      'ai_graded',         (SELECT count(*) FROM public.lesson_submissions WHERE graded_by = 'ai'),
      'ai_reviewed_ok',    (SELECT count(*) FROM public.lesson_submissions WHERE graded_by = 'ai' AND reviewed_at IS NOT NULL),
      'teacher_graded',    (SELECT count(*) FROM public.lesson_submissions WHERE graded_by = 'teacher'),
      'ai_suspect',        (SELECT count(*) FROM public.lesson_submissions WHERE ai_suspect),
      'ai_questions',      (SELECT count(*) FROM public.messages WHERE channel = 'ai' AND sender_role = 'student'),
      'ai_questions_students', (SELECT count(DISTINCT student_id) FROM public.messages WHERE channel = 'ai' AND sender_role = 'student'),
      'exam_sessions',     (SELECT count(*) FROM public.exam_sessions),
      'quiz_sessions',     (SELECT count(*) FROM public.quiz_sessions),
      'first_activity',    (SELECT min(at) FROM activity)
    ),
    'monthly', COALESCE((
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.month) FROM (
        SELECT m.month, m.active_students,
               COALESCE(s.submissions, 0) AS submissions,
               COALESCE(s.ai_graded, 0) AS ai_graded,
               s.avg_score,
               COALESCE(tu.ai_questions, 0) AS ai_questions,
               COALESCE(d.lessons_completed, 0) AS lessons_completed
        FROM months m
        LEFT JOIN subs s USING (month)
        LEFT JOIN tutor tu USING (month)
        LEFT JOIN done d USING (month)
      ) t
    ), '[]'::jsonb),
    'weekly_active', COALESCE((
      SELECT jsonb_agg(row_to_json(w) ORDER BY w.week) FROM weekly w
    ), '[]'::jsonb),
    -- Độ khớp AI vs giáo viên: chỉ tính các bài đã có điểm AI gốc (ai_score) và giáo viên đã chấm lại
    'ai_agreement', (
      SELECT jsonb_build_object(
        'compared', count(*),
        'avg_abs_diff', round(avg(abs(score - ai_score)), 2),
        'within_1', count(*) FILTER (WHERE abs(score - ai_score) <= 1),
        'identical', count(*) FILTER (WHERE score = ai_score)
      )
      FROM public.lesson_submissions
      WHERE graded_by = 'teacher' AND ai_score IS NOT NULL AND score IS NOT NULL
    )
  ) INTO result;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.impact_stats() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.impact_stats() TO authenticated;
