-- AI trợ giảng + ngữ cảnh cho tin nhắn
-- messages: thêm context (payload ngữ cảnh) + channel ('teacher' | 'ai') + role 'ai'
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS context jsonb,
  ADD COLUMN IF NOT EXISTS channel text NOT NULL DEFAULT 'teacher';

ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_sender_role_check;
ALTER TABLE public.messages ADD CONSTRAINT messages_sender_role_check
  CHECK (sender_role IN ('student','teacher','ai'));

ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_channel_check;
ALTER TABLE public.messages ADD CONSTRAINT messages_channel_check
  CHECK (channel IN ('teacher','ai'));

-- lessons: nội dung do giáo viên dán cho AI trợ giảng bám theo
ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS ai_context text;
