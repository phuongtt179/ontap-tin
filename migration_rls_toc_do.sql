-- TĂNG TỐC PHÂN QUYỀN (RLS) — 27/10/2026
-- Lỗi: các policy gọi auth.uid()/current_user_role() lặp lại cho TỪNG DÒNG → đếm bài chờ duyệt mất 8–12 giây, Supabase trả 500.
-- Sửa: bọc trong (select …) để Postgres tính 1 lần cho cả câu truy vấn. GIỮ NGUYÊN logic phân quyền.
-- Cách chạy: Supabase → SQL Editor → New query → dán toàn bộ file này → Run.
-- Bản sao lưu policy cũ: SaoLuu_RLS_truoc_sua_2026-10-27.json (cùng thư mục).

begin;
alter policy "profiles: own update" on public."profiles" using (((select auth.uid()) = id));
alter policy "questions: teacher insert" on public."questions" with check ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = 'teacher'::text)))));
alter policy "sessions: own read" on public."quiz_sessions" using (((select auth.uid()) = user_id));
alter policy "sessions: own insert" on public."quiz_sessions" with check (((select auth.uid()) = user_id));
alter policy "notes: student insert" on public."student_notes" with check (((select auth.uid()) = user_id));
alter policy "notes: student update" on public."student_notes" using (((select auth.uid()) = user_id));
alter policy "notes: student delete" on public."student_notes" using (((select auth.uid()) = user_id));
alter policy "notes: teacher read all" on public."student_notes" using (((select current_user_role()) = ANY (ARRAY['teacher'::text, 'assistant'::text])));
alter policy "notes: teacher delete" on public."student_notes" using (((select current_user_role()) = ANY (ARRAY['teacher'::text, 'assistant'::text])));
alter policy "sq_student_seen" on public."student_questions" using ((student_id = (select auth.uid()))) with check ((student_id = (select auth.uid())));
alter policy "topics: teacher insert" on public."topics" with check ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = 'teacher'::text)))));
alter policy "classes: teacher insert" on public."classes" with check ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = 'teacher'::text)))));
alter policy "exam_sessions: student read own" on public."exam_sessions" using (((select auth.uid()) = user_id));
alter policy "exam_sessions: student insert own" on public."exam_sessions" with check (((select auth.uid()) = user_id));
alter policy "enrollments: teacher insert" on public."student_enrollments" with check (((select current_user_role()) = ANY (ARRAY['teacher'::text, 'assistant'::text])));
alter policy "lesson_submissions: teacher read" on public."lesson_submissions" using ((((select auth.uid()) = user_id) OR (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = 'teacher'::text))))));
alter policy "exam_sessions: teacher update" on public."exam_sessions" using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = 'teacher'::text)))));
alter policy "topics: teacher write" on public."topics" with check ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = ANY (ARRAY['teacher'::text, 'assistant'::text]))))));
alter policy "topics: teacher update" on public."topics" using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = ANY (ARRAY['teacher'::text, 'assistant'::text]))))));
alter policy "topics: teacher delete" on public."topics" using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = 'teacher'::text)))));
alter policy "lessons: teacher write" on public."lessons" with check ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = ANY (ARRAY['teacher'::text, 'assistant'::text]))))));
alter policy "lessons: teacher update" on public."lessons" using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = ANY (ARRAY['teacher'::text, 'assistant'::text]))))));
alter policy "lessons: teacher delete" on public."lessons" using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = 'teacher'::text)))));
alter policy "questions: teacher write" on public."questions" with check ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = ANY (ARRAY['teacher'::text, 'assistant'::text]))))));
alter policy "questions: teacher update" on public."questions" using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = ANY (ARRAY['teacher'::text, 'assistant'::text]))))));
alter policy "questions: teacher delete" on public."questions" using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = 'teacher'::text)))));
alter policy "exams: teacher write" on public."exams" with check ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = ANY (ARRAY['teacher'::text, 'assistant'::text]))))));
alter policy "exams: teacher update" on public."exams" using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = ANY (ARRAY['teacher'::text, 'assistant'::text]))))));
alter policy "exams: teacher delete" on public."exams" using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = 'teacher'::text)))));
alter policy "grades: teacher write" on public."grades" with check ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = ANY (ARRAY['teacher'::text, 'assistant'::text]))))));
alter policy "grades: teacher update" on public."grades" using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = ANY (ARRAY['teacher'::text, 'assistant'::text]))))));
alter policy "grades: teacher delete" on public."grades" using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = 'teacher'::text)))));
alter policy "classes: teacher write" on public."classes" with check ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = ANY (ARRAY['teacher'::text, 'assistant'::text]))))));
alter policy "classes: teacher update" on public."classes" using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = ANY (ARRAY['teacher'::text, 'assistant'::text]))))));
alter policy "classes: teacher delete" on public."classes" using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = 'teacher'::text)))));
alter policy "profiles: teacher update" on public."profiles" using ((EXISTS ( SELECT 1
   FROM profiles profiles_1
  WHERE ((profiles_1.id = (select auth.uid())) AND (profiles_1.role = ANY (ARRAY['teacher'::text, 'assistant'::text]))))));
alter policy "profiles: teacher delete" on public."profiles" using ((EXISTS ( SELECT 1
   FROM profiles profiles_1
  WHERE ((profiles_1.id = (select auth.uid())) AND (profiles_1.role = 'teacher'::text)))));
alter policy "lesson_submissions: teacher update" on public."lesson_submissions" using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = ANY (ARRAY['teacher'::text, 'assistant'::text]))))));
alter policy "exams: student read active" on public."exams" using (((is_active = true) AND (EXISTS ( SELECT 1
   FROM student_enrollments
  WHERE ((student_enrollments.user_id = (select auth.uid())) AND (student_enrollments.grade = exams.grade) AND (student_enrollments.is_approved = true))))));
alter policy "exam_sessions: teacher delete" on public."exam_sessions" using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = 'teacher'::text)))));
alter policy "profiles: read" on public."profiles" using ((((select auth.uid()) = id) OR ((select current_user_role()) = ANY (ARRAY['teacher'::text, 'assistant'::text]))));
alter policy "lesson_submissions: read" on public."lesson_submissions" using ((((select auth.uid()) = user_id) OR ((select current_user_role()) = ANY (ARRAY['teacher'::text, 'assistant'::text]))));
alter policy "lesson_progress: own read" on public."lesson_progress" using ((((select auth.uid()) = user_id) OR ((select current_user_role()) = ANY (ARRAY['teacher'::text, 'assistant'::text]))));
alter policy "enrollments: read" on public."student_enrollments" using ((((select auth.uid()) = user_id) OR ((select current_user_role()) = ANY (ARRAY['teacher'::text, 'assistant'::text]))));
alter policy "enrollments: student insert" on public."student_enrollments" with check (((select auth.uid()) = user_id));
alter policy "enrollments: teacher update" on public."student_enrollments" using (((select current_user_role()) = ANY (ARRAY['teacher'::text, 'assistant'::text])));
alter policy "enrollments: teacher delete" on public."student_enrollments" using (((select current_user_role()) = 'teacher'::text));
alter policy "notes: student read own" on public."student_notes" using (((select auth.uid()) = user_id));
alter policy "teacher_all_sessions" on public."attendance_sessions" using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = ANY (ARRAY['teacher'::text, 'assistant'::text])))))) with check ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = ANY (ARRAY['teacher'::text, 'assistant'::text]))))));
alter policy "student_read_open_sessions" on public."attendance_sessions" using (((closed_at IS NULL) AND (EXISTS ( SELECT 1
   FROM student_enrollments se
  WHERE ((se.user_id = (select auth.uid())) AND (se.grade = attendance_sessions.grade) AND (se.is_approved = true) AND ((attendance_sessions.class_name IS NULL) OR (se.class_name = attendance_sessions.class_name) OR (se.class_name IS NULL)))))));
alter policy "teacher_all_records" on public."attendance_records" using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = ANY (ARRAY['teacher'::text, 'assistant'::text])))))) with check ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = ANY (ARRAY['teacher'::text, 'assistant'::text]))))));
alter policy "student_read_own_records" on public."attendance_records" using ((user_id = (select auth.uid())));
alter policy "student_insert_record" on public."attendance_records" with check (((user_id = (select auth.uid())) AND (EXISTS ( SELECT 1
   FROM (attendance_sessions s
     JOIN student_enrollments se ON (((se.grade = s.grade) AND (se.user_id = (select auth.uid())) AND (se.is_approved = true) AND ((s.class_name IS NULL) OR (se.class_name = s.class_name) OR (se.class_name IS NULL)))))
  WHERE ((s.id = attendance_records.session_id) AND (s.closed_at IS NULL))))));
alter policy "teacher_all_units" on public."units" using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = ANY (ARRAY['teacher'::text, 'assistant'::text])))))) with check ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = ANY (ARRAY['teacher'::text, 'assistant'::text]))))));
alter policy "enrollments: student delete own" on public."student_enrollments" using (((select auth.uid()) = user_id));
alter policy "teacher_all_lesson_titles" on public."lesson_titles" using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = ANY (ARRAY['teacher'::text, 'assistant'::text])))))) with check ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = ANY (ARRAY['teacher'::text, 'assistant'::text]))))));
alter policy "teacher_all_reward_items" on public."reward_items" using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = ANY (ARRAY['teacher'::text, 'assistant'::text])))))) with check ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = ANY (ARRAY['teacher'::text, 'assistant'::text]))))));
alter policy "student_read_own_requests" on public."reward_requests" using ((student_id = (select auth.uid())));
alter policy "teacher_all_reward_requests" on public."reward_requests" using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = ANY (ARRAY['teacher'::text, 'assistant'::text]))))));
alter policy "sq_student_insert" on public."student_questions" with check (((student_id = (select auth.uid())) AND (status = 'pending'::text) AND (answer IS NULL)));
alter policy "teacher_update_profiles" on public."profiles" using ((((select auth.uid()) = id) OR (EXISTS ( SELECT 1
   FROM profiles me
  WHERE ((me.id = (select auth.uid())) AND (me.role = ANY (ARRAY['teacher'::text, 'assistant'::text]))))))) with check (true);
alter policy "messages_access" on public."messages" using (((student_id = (select auth.uid())) OR (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = ANY (ARRAY['teacher'::text, 'assistant'::text]))))))) with check (((student_id = (select auth.uid())) OR (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = ANY (ARRAY['teacher'::text, 'assistant'::text])))))));
alter policy "teacher_all_reward_configs" on public."reward_configs" using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = ANY (ARRAY['teacher'::text, 'assistant'::text])))))) with check ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = ANY (ARRAY['teacher'::text, 'assistant'::text]))))));
alter policy "lesson_visibility_select" on public."lesson_visibility" using (((user_id = (select auth.uid())) OR (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = ANY (ARRAY['teacher'::text, 'assistant'::text])))))));
alter policy "lesson_visibility_insert" on public."lesson_visibility" with check ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = ANY (ARRAY['teacher'::text, 'assistant'::text]))))));
alter policy "lesson_visibility_delete" on public."lesson_visibility" using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = ANY (ARRAY['teacher'::text, 'assistant'::text]))))));
alter policy "teacher_assistant_all" on public."class_topic_unlock" using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = ANY (ARRAY['teacher'::text, 'assistant'::text])))))) with check ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = ANY (ARRAY['teacher'::text, 'assistant'::text]))))));
alter policy "teacher_assistant_all" on public."class_lesson_unlock" using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = ANY (ARRAY['teacher'::text, 'assistant'::text])))))) with check ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = ANY (ARRAY['teacher'::text, 'assistant'::text]))))));
alter policy "lesson_progress: own insert" on public."lesson_progress" with check (((select auth.uid()) = user_id));
alter policy "lesson_progress: own update" on public."lesson_progress" using (((select auth.uid()) = user_id)) with check (((select auth.uid()) = user_id));
alter policy "lesson_submissions: own insert" on public."lesson_submissions" with check (((select auth.uid()) = user_id));
alter policy "lesson_submissions: own update" on public."lesson_submissions" using (((select auth.uid()) = user_id)) with check (((select auth.uid()) = user_id));
alter policy "exam_sessions: student update own in-progress" on public."exam_sessions" using ((((select auth.uid()) = user_id) AND (submitted_at IS NULL))) with check (((select auth.uid()) = user_id));
alter policy "sq_student_select" on public."student_questions" using ((student_id = (select auth.uid())));
alter policy "sq_staff_all" on public."student_questions" using ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = (select auth.uid())) AND (p.role = ANY (ARRAY['teacher'::text, 'assistant'::text])))))) with check ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = (select auth.uid())) AND (p.role = ANY (ARRAY['teacher'::text, 'assistant'::text]))))));
alter policy "sqd_staff_all" on public."student_question_drafts" using ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = (select auth.uid())) AND (p.role = ANY (ARRAY['teacher'::text, 'assistant'::text])))))) with check ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = (select auth.uid())) AND (p.role = ANY (ARRAY['teacher'::text, 'assistant'::text]))))));
alter policy "sticker_awards: own read" on public."sticker_awards" using (((user_id = (select auth.uid())) OR ((select current_user_role()) = ANY (ARRAY['teacher'::text, 'assistant'::text]))));
alter policy "submission_history: own or staff read" on public."submission_history" using (((user_id = (select auth.uid())) OR ((select current_user_role()) = ANY (ARRAY['teacher'::text, 'assistant'::text]))));
alter policy "lesson_slides: staff write" on public."lesson_slides" using (((select current_user_role()) = ANY (ARRAY['teacher'::text, 'assistant'::text]))) with check (((select current_user_role()) = ANY (ARRAY['teacher'::text, 'assistant'::text])));
commit;
