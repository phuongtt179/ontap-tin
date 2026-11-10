-- CHẠY TRÊN NEON — vá bảo mật đợt 2 (10/11/2026). Không cần bấm Refresh schema cache (chỉ thêm trigger, sửa hàm, thu quyền).
-- Chỉ áp cho học sinh (vai trò authenticated / anonymous, không phải teacher / assistant).
-- Giáo viên, trợ giảng và các lệnh sao lưu / chép dữ liệu (chạy bằng tài khoản chủ) không bị ảnh hưởng.

-- 1) Nộp bài mới: bỏ mọi cột đánh giá học sinh tự gửi kèm (trước đây tự nộp được bài kèm mức T + nhận xét giả).
--    Trigger cũ protect_submission_grading chỉ chặn lúc SỬA, không chặn lúc NỘP MỚI.
create or replace function public.lam_sach_bai_nop_moi() returns trigger
language plpgsql set search_path = public as $$
begin
  if current_user in ('authenticated', 'anonymous')
     and coalesce((select public.current_user_role()), '') not in ('teacher', 'assistant') then
    new.score := null; new.ai_score := null; new.muc := null; new.teacher_comment := null; new.graded_by := null;
    new.reviewed_at := null; new.ai_graded_at := null; new.ai_breakdown := null;
    new.ai_suspect := false; new.ai_suspect_reason := null;
    new.sticker_awarded := false; new.sticker_thuong := 0; new.allow_resubmit := false;
  end if;
  return new;
end $$;
drop trigger if exists lesson_submissions_lam_sach_moi on public.lesson_submissions;
create trigger lesson_submissions_lam_sach_moi before insert on public.lesson_submissions
  for each row execute function public.lam_sach_bai_nop_moi();

-- 2) Ghi danh: học sinh tự ghi danh thì luôn ở trạng thái CHỜ DUYỆT (trước đây tự duyệt được vào lớp khác).
create or replace function public.ghi_danh_cho_duyet() returns trigger
language plpgsql set search_path = public as $$
begin
  if current_user in ('authenticated', 'anonymous')
     and coalesce((select public.current_user_role()), '') not in ('teacher', 'assistant') then
    new.is_approved := false;
  end if;
  return new;
end $$;
drop trigger if exists student_enrollments_cho_duyet on public.student_enrollments;
create trigger student_enrollments_cho_duyet before insert on public.student_enrollments
  for each row execute function public.ghi_danh_cho_duyet();

-- 3) Tin nhắn: học sinh chỉ được GỬI tin của chính mình (sender_role 'student', hoặc 'ai' trong kênh 'ai'),
--    không giả tin của giáo viên, không sửa / xoá tin (app không có chức năng này cho học sinh).
create or replace function public.bao_ve_tin_nhan() returns trigger
language plpgsql set search_path = public as $$
begin
  if current_user in ('authenticated', 'anonymous')
     and coalesce((select public.current_user_role()), '') not in ('teacher', 'assistant') then
    if tg_op = 'INSERT' and (new.sender_role = 'student' or (new.sender_role = 'ai' and new.channel = 'ai')) then
      return new;
    end if;
    raise exception 'forbidden_message' using errcode = '42501';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end $$;
drop trigger if exists messages_bao_ve on public.messages;
create trigger messages_bao_ve before insert or update or delete on public.messages
  for each row execute function public.bao_ve_tin_nhan();

-- 4) Đề thi: lúc BẮT ĐẦU làm bài, học sinh không được gửi sẵn điểm / thời điểm nộp (trước đây tự tạo bài thi điểm 10).
--    Chấm điểm lúc nộp vẫn do trình duyệt tính → sẽ chuyển sang máy chủ ở đợt 3.
create or replace function public.bat_dau_thi_sach() returns trigger
language plpgsql set search_path = public as $$
begin
  if current_user in ('authenticated', 'anonymous')
     and coalesce((select public.current_user_role()), '') not in ('teacher', 'assistant') then
    new.score := null; new.submitted_at := null;
  end if;
  return new;
end $$;
drop trigger if exists exam_sessions_bat_dau_sach on public.exam_sessions;
create trigger exam_sessions_bat_dau_sach before insert on public.exam_sessions
  for each row execute function public.bat_dau_thi_sach();

-- 5) Thưởng quiz: chỉ cho bài đã đăng, có câu hỏi, và số câu khớp với bài (giảm lạm dụng tự đánh dấu "đã qua quiz").
--    Chặn hẳn cần chấm quiz ở máy chủ — đợt 3.
create or replace function public.award_sticker_once(p_kind text, p_lesson uuid, p_task integer default 0)
returns json language plpgsql security definer set search_path to 'public' as $function$
declare
  uid uuid := auth.uid();
  k text;
  amt int;
  pr record;
  pct numeric;
  prof record;
  so_cau int;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  -- 07/11/2026: bỏ thưởng khi NỘP bài (học sinh nộp file bừa để lấy sticker). Sticker bài thực hành chỉ cộng khi giáo viên duyệt.
  if p_kind = 'submit' then
    return json_build_object('awarded', false, 'reason', 'khong_thuong_nop');
  elsif p_kind = 'quiz' then
    select coalesce(cardinality(question_ids), 0) into so_cau from lessons where id = p_lesson and is_published;
    if coalesce(so_cau, 0) = 0 then
      return json_build_object('awarded', false, 'reason', 'not_available');
    end if;
    select quiz_passed, quiz_correct, quiz_total into pr from lesson_progress where user_id = uid and lesson_id = p_lesson;
    -- Số câu ghi lại có thể ít hơn số câu của bài (câu hỏi bị xoá sau khi gắn vào bài) nhưng không được nhiều hơn
    if not coalesce(pr.quiz_passed, false) or coalesce(pr.quiz_total, 0) < 1 or pr.quiz_total > so_cau
       or coalesce(pr.quiz_correct, 0) > pr.quiz_total or coalesce(pr.quiz_correct, 0) * 3 < pr.quiz_total * 2 then
      return json_build_object('awarded', false, 'reason', 'not_passed');
    end if;
    pct := pr.quiz_correct::numeric / pr.quiz_total;
    amt := case when pct >= 1 then 5 when pct >= 0.9 then 4 when pct >= 0.85 then 3 when pct >= 0.75 then 2 else 1 end;
    k := 'quiz:' || p_lesson;
  else
    raise exception 'bad_kind';
  end if;
  insert into sticker_awards (user_id, award_key, amount) values (uid, k, amt) on conflict do nothing;
  if not found then
    return json_build_object('awarded', false, 'reason', 'already');
  end if;
  update profiles set sticker_count = coalesce(sticker_count, 0) + amt, sticker_total = coalesce(sticker_total, 0) + amt
    where id = uid returning sticker_count, sticker_total into prof;
  return json_build_object('awarded', true, 'count', amt, 'sticker_count', prof.sticker_count, 'sticker_total', prof.sticker_total);
end $function$;

-- 6) Thu các quyền không dùng tới (TRUNCATE bỏ qua phân quyền theo dòng; TRIGGER / REFERENCES không cần cho app).
revoke truncate, trigger, references on all tables in schema public from authenticated, anonymous;

-- Kiểm tra (phải ra: 4 | true | 0)
select
  (select count(*) from pg_trigger where tgname in ('lesson_submissions_lam_sach_moi', 'student_enrollments_cho_duyet', 'messages_bao_ve', 'exam_sessions_bat_dau_sach')) as so_trigger_moi,
  (select prosrc like '%so_cau%' from pg_proc where proname = 'award_sticker_once') as thuong_quiz_moi,
  (select count(*) from information_schema.role_table_grants where table_schema = 'public' and grantee in ('authenticated', 'anonymous') and privilege_type = 'TRUNCATE') as con_quyen_truncate;
