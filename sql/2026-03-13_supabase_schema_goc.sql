-- ============================================================
-- SCHEMA ĐẦY ĐỦ — Ôn Tập Tin Học Tiểu Học
-- Grades: 3, 4, 5  |  Roles: teacher / student
-- Chạy toàn bộ trong: Supabase Dashboard > SQL Editor > New query
-- ============================================================

-- Extension tạo UUID
create extension if not exists "pgcrypto";


-- ============================================================
-- 1. PROFILES
-- ============================================================
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null default '',
  role        text not null default 'student'
                check (role in ('teacher', 'student')),
  grade       text check (grade in ('3', '4', '5')),
  class_name  text,
  username    text,
  created_at  timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role, username, is_approved)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Người dùng'),
    coalesce(new.raw_user_meta_data->>'role', 'student'),
    new.raw_user_meta_data->>'username',
    coalesce((new.raw_user_meta_data->>'is_approved')::boolean, true)
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ============================================================
-- 2. GRADES  (danh sách khối giáo viên tự quản lý)
-- ============================================================
create table if not exists public.grades (
  id    serial primary key,
  value text not null unique
);

insert into public.grades (value) values ('3'), ('4'), ('5')
  on conflict (value) do nothing;


-- ============================================================
-- 3. TOPICS  (chủ đề câu hỏi / bài học)
-- ============================================================
create table if not exists public.topics (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  grade      text not null,   -- '3','4','5' hoặc 'all'
  created_at timestamptz not null default now()
);


-- ============================================================
-- 4. CLASSES  (lớp học)
-- ============================================================
create table if not exists public.classes (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  grade      text not null check (grade in ('3', '4', '5')),
  created_at timestamptz not null default now()
);


-- ============================================================
-- 5. QUESTIONS
-- ============================================================
create table if not exists public.questions (
  id             uuid primary key default gen_random_uuid(),
  question       text not null,
  type           text not null check (type in (
                   'multiple_choice',
                   'true_false',
                   'fill_blank',
                   'matching',
                   'ordering',
                   'drag_word',
                   'word_order',
                   'essay'
                 )),
  options        jsonb default '[]',   -- [{key, text, image_url?}]
  match_options  jsonb,                -- cột phải cho dạng nối đôi
  correct_answer text,                 -- null được phép (câu tự luận)
  image_url      text,
  audio_url      text,
  grade          text not null check (grade in ('3', '4', '5')),
  topic          text,                 -- null được phép
  difficulty     text not null default 'easy'
                   check (difficulty in ('easy', 'medium', 'hard')),
  created_by     uuid references public.profiles(id),
  created_at     timestamptz not null default now()
);

create index if not exists questions_grade_topic_idx on public.questions (grade, topic, difficulty);


-- ============================================================
-- 6. QUIZ SESSIONS  (lịch sử luyện tập)
-- ============================================================
create table if not exists public.quiz_sessions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references public.profiles(id) on delete cascade,
  mode         text not null check (mode in ('practice', 'exam')),
  total        integer not null,
  correct      integer not null,
  score        numeric(4,1) not null,
  answers      jsonb default '{}',
  question_ids uuid[] default '{}',
  created_at   timestamptz not null default now()
);

create index if not exists quiz_sessions_user_idx on public.quiz_sessions (user_id, created_at desc);


-- ============================================================
-- 7. LESSONS  (bài học)
-- ============================================================
create table if not exists public.lessons (
  id                    uuid primary key default gen_random_uuid(),
  title                 text not null,
  grade                 text not null check (grade in ('3', '4', '5')),
  topic                 text,
  description           text,
  video_url             text,
  "order"               integer not null default 0,
  has_practice          boolean not null default false,
  practice_type         text check (practice_type in ('word', 'ppt')),
  practice_instructions text,           -- JSON array các bài task
  is_published          boolean not null default false,
  question_ids          uuid[] default '{}',
  created_at            timestamptz not null default now()
);

create index if not exists lessons_grade_idx on public.lessons (grade, "order");


-- ============================================================
-- 8. LESSON PROGRESS  (tiến độ học sinh theo bài)
-- ============================================================
create table if not exists public.lesson_progress (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.profiles(id) on delete cascade,
  lesson_id          uuid not null references public.lessons(id) on delete cascade,
  video_watched      boolean not null default false,
  quiz_correct       integer,
  quiz_total         integer,
  quiz_passed        boolean,
  practice_submitted boolean not null default false,
  completed          boolean not null default false,
  updated_at         timestamptz not null default now(),
  created_at         timestamptz not null default now(),
  unique (user_id, lesson_id)
);

create index if not exists lesson_progress_lesson_idx on public.lesson_progress (lesson_id);


-- ============================================================
-- 9. LESSON SUBMISSIONS  (bài nộp thực hành)
-- ============================================================
create table if not exists public.lesson_submissions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  lesson_id    uuid not null references public.lessons(id) on delete cascade,
  file_url     text,
  text_content text,
  content_json jsonb,         -- {task_index: N}
  score        numeric(4,1),  -- giáo viên chấm sau
  submitted_at timestamptz not null default now()
);

create index if not exists lesson_submissions_lesson_idx on public.lesson_submissions (lesson_id);


-- ============================================================
-- 10. EXAMS  (đề thi)
-- ============================================================
create table if not exists public.exams (
  id                     uuid primary key default gen_random_uuid(),
  title                  text not null,
  grade                  text not null check (grade in ('3', '4', '5')),
  class_names            text[],          -- null = tất cả lớp
  time_limit             integer,         -- phút, null = không giới hạn
  max_attempts           integer not null default 1,  -- 0 = không giới hạn
  is_active              boolean not null default false,
  show_answer            boolean not null default true,
  show_score             boolean not null default true,
  question_ids           uuid[] not null default '{}',
  has_practical          boolean not null default false,
  practical_type         text check (practical_type in ('word', 'ppt')),
  practical_instructions text,
  theory_weight          integer not null default 100,
  practical_weight       integer not null default 0,
  created_at             timestamptz not null default now()
);

create index if not exists exams_grade_idx on public.exams (grade, is_active);


-- ============================================================
-- 11. EXAM SESSIONS  (bài làm đề thi)
-- ============================================================
create table if not exists public.exam_sessions (
  id                     uuid primary key default gen_random_uuid(),
  exam_id                uuid not null references public.exams(id) on delete cascade,
  user_id                uuid not null references public.profiles(id) on delete cascade,
  total                  integer not null,
  correct                integer not null,
  score                  numeric(4,1) not null,
  answers                jsonb default '{}',
  attempt_number         integer not null default 1,
  submitted_at           timestamptz not null default now(),
  practical_content      jsonb,
  practical_score        numeric(4,1),
  practical_comment      text,
  practical_reviewed_at  timestamptz
);

create index if not exists exam_sessions_exam_idx  on public.exam_sessions (exam_id);
create index if not exists exam_sessions_user_idx  on public.exam_sessions (user_id);


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles          enable row level security;
alter table public.grades            enable row level security;
alter table public.topics            enable row level security;
alter table public.classes           enable row level security;
alter table public.questions         enable row level security;
alter table public.quiz_sessions     enable row level security;
alter table public.lessons           enable row level security;
alter table public.lesson_progress   enable row level security;
alter table public.lesson_submissions enable row level security;
alter table public.exams             enable row level security;
alter table public.exam_sessions     enable row level security;


-- ── profiles ──
create policy "profiles: read" on public.profiles
  for select to authenticated
  using (
    auth.uid() = id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'teacher')
  );

create policy "profiles: own update" on public.profiles
  for update to authenticated using (auth.uid() = id);

-- ── grades ──
create policy "grades: authenticated read" on public.grades
  for select to authenticated using (true);

create policy "grades: teacher write" on public.grades
  for all to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'teacher'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'teacher'));

-- ── topics ──
create policy "topics: authenticated read" on public.topics
  for select to authenticated using (true);

create policy "topics: teacher write" on public.topics
  for all to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'teacher'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'teacher'));

-- ── classes ──
create policy "classes: authenticated read" on public.classes
  for select to authenticated using (true);

create policy "classes: teacher write" on public.classes
  for all to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'teacher'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'teacher'));

-- ── questions ──
create policy "questions: authenticated read" on public.questions
  for select to authenticated using (true);

create policy "questions: teacher write" on public.questions
  for all to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'teacher'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'teacher'));

-- ── quiz_sessions ──
create policy "quiz_sessions: own read" on public.quiz_sessions
  for select using (auth.uid() = user_id);

create policy "quiz_sessions: own insert" on public.quiz_sessions
  for insert with check (auth.uid() = user_id);

-- ── lessons ──
create policy "lessons: authenticated read" on public.lessons
  for select to authenticated using (true);

create policy "lessons: teacher write" on public.lessons
  for all to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'teacher'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'teacher'));

-- ── lesson_progress ──
create policy "lesson_progress: own read" on public.lesson_progress
  for select using (
    auth.uid() = user_id
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'teacher')
  );

create policy "lesson_progress: own upsert" on public.lesson_progress
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── lesson_submissions ──
create policy "lesson_submissions: read" on public.lesson_submissions
  for select using (
    auth.uid() = user_id
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'teacher')
  );

create policy "lesson_submissions: own insert" on public.lesson_submissions
  for insert with check (auth.uid() = user_id);

create policy "lesson_submissions: teacher update" on public.lesson_submissions
  for update to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'teacher'));

-- ── exams ──
create policy "exams: authenticated read" on public.exams
  for select to authenticated using (true);

create policy "exams: teacher write" on public.exams
  for all to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'teacher'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'teacher'));

-- ── exam_sessions ──
create policy "exam_sessions: read" on public.exam_sessions
  for select using (
    auth.uid() = user_id
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'teacher')
  );

create policy "exam_sessions: own insert" on public.exam_sessions
  for insert with check (auth.uid() = user_id);

create policy "exam_sessions: teacher update" on public.exam_sessions
  for update to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'teacher'));
