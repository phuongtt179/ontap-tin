-- HỎI ĐÁP MẪU cho từng bài học (29/10/2026)
-- Giáo viên nhờ AI soạn các cặp "câu học sinh hay hỏi – câu trả lời", sửa rồi DUYỆT. Khi học sinh hỏi, AI chỉ PHÂN LOẠI
-- câu hỏi của em khớp với câu mẫu nào (không viết chữ mới) → em nhận đúng câu trả lời giáo viên đã duyệt.
-- Không khớp → câu hỏi gửi giáo viên như trước. Cách chạy: Supabase → SQL Editor → dán toàn bộ → Run.

create table if not exists public.lesson_faq (
  id          uuid primary key default gen_random_uuid(),
  lesson_id   uuid not null references public.lessons(id) on delete cascade,
  question    text not null check (length(question) between 3 and 500),
  answer      text not null check (length(answer) between 3 and 3000),
  approved    boolean not null default false,
  source      text not null default 'ai',          -- 'ai' (AI soạn) | 'teacher' (giáo viên gõ) | 'student' (từ câu học sinh đã hỏi)
  use_count   int not null default 0,               -- số lần đã trả lời học sinh
  sort_order  int not null default 0,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  approved_at timestamptz
);
create index if not exists lesson_faq_lesson_idx on public.lesson_faq (lesson_id);

alter table public.lesson_faq enable row level security;
drop policy if exists "lesson_faq: read" on public.lesson_faq;
create policy "lesson_faq: read" on public.lesson_faq for select to authenticated
  using (approved or (select public.current_user_role()) = any (array['teacher', 'assistant']));
drop policy if exists "lesson_faq: staff write" on public.lesson_faq;
create policy "lesson_faq: staff write" on public.lesson_faq for all to authenticated
  using ((select public.current_user_role()) = any (array['teacher', 'assistant']))
  with check ((select public.current_user_role()) = any (array['teacher', 'assistant']));

-- Ghi lại việc học sinh được trả lời bằng câu mẫu đã duyệt (câu trả lời lấy từ bảng, học sinh không chèn chữ được)
create or replace function public.hoi_dap_ghi(p_faq uuid, p_cau text, p_mode text default 'theory') returns json
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  f record;
  qid uuid;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  select id, lesson_id, answer into f from lesson_faq where id = p_faq and approved;
  if not found then raise exception 'faq_not_found'; end if;
  update lesson_faq set use_count = use_count + 1 where id = f.id;
  insert into student_questions (student_id, lesson_id, mode, question, context, status, answer, answered_at, seen_at)
  values (uid, f.lesson_id, case when p_mode in ('quiz', 'practice', 'theory') then p_mode else 'theory' end,
          left(coalesce(nullif(trim(p_cau), ''), '(câu hỏi mẫu)'), 1000),
          jsonb_build_object('faq_id', f.id, 'tu_dong', true), 'answered', f.answer, now(), now())
  returning id into qid;
  return json_build_object('id', qid);
end $$;
revoke all on function public.hoi_dap_ghi(uuid, text, text) from public, anon;
grant execute on function public.hoi_dap_ghi(uuid, text, text) to authenticated;
