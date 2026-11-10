-- Bài giảng web cho từng bài học (20/10/2026) — chuyển từ app Lớp học số.
-- Giáo viên soạn slide trên web (AI hỗ trợ), trình chiếu khi dạy; học sinh xem lại ở nhà thay cho PPTX.
-- Lưu ở bảng riêng để các trang đang `select *` bảng lessons không phải tải cả khối slide nặng.

create table if not exists public.lesson_slides (
  lesson_id  uuid primary key references public.lessons(id) on delete cascade,
  slides     jsonb not null default '[]'::jsonb,   -- mảng slide, mô tả ở src/components/slides/slideModel.js
  kich_ban   text,                                 -- kịch bản chữ (AI viết, giáo viên duyệt) trước khi dựng slide
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);

alter table public.lesson_slides enable row level security;
drop policy if exists "lesson_slides: authenticated read" on public.lesson_slides;
create policy "lesson_slides: authenticated read" on public.lesson_slides for select to authenticated using (true);
drop policy if exists "lesson_slides: staff write" on public.lesson_slides;
create policy "lesson_slides: staff write" on public.lesson_slides for all to authenticated
  using (current_user_role() = any (array['teacher', 'assistant']))
  with check (current_user_role() = any (array['teacher', 'assistant']));

-- Cờ trên bảng lessons để trang danh sách bài biết bài nào có bài giảng web mà không tải slide
alter table public.lessons add column if not exists has_slides boolean not null default false;

create or replace function public.sync_lesson_has_slides() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'DELETE' then
    update lessons set has_slides = false where id = old.lesson_id;
    return old;
  end if;
  update lessons set has_slides = (jsonb_typeof(new.slides) = 'array' and jsonb_array_length(new.slides) > 0)
   where id = new.lesson_id;
  return new;
end $$;

drop trigger if exists lesson_slides_sync on public.lesson_slides;
create trigger lesson_slides_sync after insert or update or delete on public.lesson_slides
  for each row execute function public.sync_lesson_has_slides();
