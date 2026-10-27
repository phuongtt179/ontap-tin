-- ⚠ ĐÃ BỎ 27/10/2026: người dùng chạy `select cron.unschedule('grade-pending');` (lịch 2 phút/lần góp phần cạn
--   Disk IO của gói nano). Từ đó giáo viên tự bấm chấm: Trung tâm AI → Chấm bài mới, hoặc trang Bài nộp của từng bài.
--   api/grade-pending.js vẫn còn nhưng không còn gì gọi tới. Đừng chạy lại phần cron.schedule bên dưới.
--
-- Máy chủ tự chấm bài AI bỏ sót (19/10/2026)
-- Trước đây AI chỉ chấm trên trình duyệt học sinh ngay sau khi nộp → em đóng trang sớm là bài không được chấm
-- (Scratch: chỉ ~15% bài được chấm). Nay Supabase gọi /api/grade-pending 2 phút/lần để chấm các bài còn sót.

-- Đếm số lần máy chủ đã thử chấm (bài lỗi mãi thì bỏ qua sau 3 lần)
alter table public.lesson_submissions add column if not exists ai_attempts int not null default 0;

-- Index cho truy vấn "bài chưa chấm" (nhẹ: chỉ chứa bài chưa có điểm)
create index if not exists lesson_submissions_pending_idx on public.lesson_submissions (submitted_at desc)
  where score is null and graded_by is null and ai_graded_at is null;

create extension if not exists pg_net;
create extension if not exists pg_cron;

-- Khoá service lưu trong Vault (mã hoá), KHÔNG ghi thẳng vào file này:
--   select vault.create_secret('<SERVICE_KEY>', 'grade_cron_key');

-- 6:00–22:58 giờ Việt Nam (= 23:00–15:58 UTC), 2 phút/lần
select cron.schedule('grade-pending', '*/2 23,0-15 * * *', $$
  select net.http_post(
    url := 'https://laptrinhsangtao.vercel.app/api/grade-pending',
    headers := jsonb_build_object('Content-Type', 'application/json',
      'apikey', (select decrypted_secret from vault.decrypted_secrets where name = 'grade_cron_key')),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000)
$$);

-- Dọn nhật ký chạy cron mỗi ngày (tránh bảng phình to, tốn Disk IO)
select cron.schedule('cleanup-cron-log', '30 17 * * *', $$
  delete from cron.job_run_details where end_time < now() - interval '2 days'
$$);
