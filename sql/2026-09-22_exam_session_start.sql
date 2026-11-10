-- Cho phép nộp đề thi kiểu "ghi nhận lúc BẮT ĐẦU, cập nhật lúc NỘP" — trước đây exam_sessions
-- chỉ được ghi 1 dòng khi học sinh nộp bài xong, nên nếu học sinh đóng hẳn tab/trình duyệt
-- giữa chừng (không qua được ExamGuardContext vì đó chỉ chặn được điều hướng TRONG app), lượt
-- đó không hề bị tính vào "số lần làm", học sinh mở lại làm y như mới — vô hiệu hoá giới hạn
-- max_attempts giáo viên đặt cho đề.

-- correct/score/submitted_at giờ CHƯA BIẾT lúc mới bắt đầu làm bài, chỉ biết khi nộp xong.
alter table exam_sessions alter column correct drop not null;
alter table exam_sessions alter column score drop not null;
alter table exam_sessions alter column submitted_at drop not null;
alter table exam_sessions alter column submitted_at drop default;

-- started_at ghi lại đúng lúc bắt đầu làm (khác submitted_at giờ chỉ có giá trị khi nộp xong).
alter table exam_sessions add column if not exists started_at timestamptz not null default now();

-- Học sinh được tự HOÀN TẤT (update) đúng lượt làm bài CỦA MÌNH, nhưng CHỈ khi lượt đó CHƯA
-- nộp (submitted_at is null trong mệnh đề USING — lọc dòng được phép nhắm tới update). Nộp
-- xong rồi (submitted_at đã có giá trị) thì policy này không còn áp dụng nữa — học sinh không
-- tự sửa điểm của mình qua API trực tiếp sau khi đã nộp được.
create policy "exam_sessions: student update own in-progress" on exam_sessions
  for update to public
  using (auth.uid() = user_id and submitted_at is null)
  with check (auth.uid() = user_id);

-- Giáo viên xoá được 1 lượt làm bài (vd học sinh bị đóng tab do sự cố máy/mạng, không phải
-- cố tình né — giáo viên cần cách trả lại lượt làm cho các em mà không phải sửa DB tay).
create policy "exam_sessions: teacher delete" on exam_sessions
  for delete to authenticated
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'teacher'));
