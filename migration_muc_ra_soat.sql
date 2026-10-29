-- Đánh giá theo mức T/H/C + "Rà soát lỗi" cho học sinh (29/10/2026)
-- • muc: mức giáo viên đánh giá — T = Hoàn thành tốt, H = Hoàn thành, C = Chưa hoàn thành (Thông tư 27).
--   Học sinh chỉ thấy mức (không thấy điểm). Cột score vẫn giữ điểm AI chấm nháp để gợi ý mức cho giáo viên.
-- • ra_soat: kết quả học sinh bấm "Rà soát lỗi" — AI chỉ PHÂN LOẠI đạt / chưa đạt từng tiêu chí giáo viên viết,
--   không viết chữ gửi học sinh. Dạng {"phien": <submitted_at của bản nộp>, "lan": 1..3, "ket_qua": [{"tieu_chi","dat"}], "at"}.
-- • Chặn học sinh tự sửa phần đánh giá trong bài nộp của mình (trước đây policy "own update" cho sửa mọi cột).
-- Cách chạy: Supabase → SQL Editor → dán toàn bộ → Run.

alter table public.lesson_submissions add column if not exists muc text;
alter table public.lesson_submissions drop constraint if exists lesson_submissions_muc_check;
alter table public.lesson_submissions add constraint lesson_submissions_muc_check check (muc in ('T', 'H', 'C'));
alter table public.lesson_submissions add column if not exists ra_soat jsonb;

-- Học sinh (không phải giáo viên/trợ giảng) chỉ được XOÁ phần đánh giá khi nộp lại, không được tự đặt
create or replace function public.protect_submission_grading() returns trigger
language plpgsql as $$   -- SECURITY INVOKER: current_user là người gọi thật
begin
  if current_user in ('authenticated', 'anon')
     and coalesce((select public.current_user_role()), '') not in ('teacher', 'assistant') then
    if (new.muc is not null and new.muc is distinct from old.muc)
       or (new.score is not null and new.score is distinct from old.score)
       or (new.ai_score is distinct from old.ai_score)
       or (new.reviewed_at is not null and new.reviewed_at is distinct from old.reviewed_at)
       or (new.teacher_comment is not null and new.teacher_comment is distinct from old.teacher_comment)
       or (new.graded_by is not null and new.graded_by is distinct from old.graded_by)
       or (new.ai_graded_at is not null and new.ai_graded_at is distinct from old.ai_graded_at)
       or (new.ai_breakdown is not null and new.ai_breakdown::text is distinct from old.ai_breakdown::text)
       or (new.sticker_awarded is distinct from old.sticker_awarded)
       or (new.allow_resubmit and not coalesce(old.allow_resubmit, false))
       or new.user_id is distinct from old.user_id
       or new.lesson_id is distinct from old.lesson_id then
      raise exception 'forbidden_grading_update' using errcode = '42501';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists lesson_submissions_protect_grading on public.lesson_submissions;
create trigger lesson_submissions_protect_grading before update on public.lesson_submissions
  for each row execute function public.protect_submission_grading();
