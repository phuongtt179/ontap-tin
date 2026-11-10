-- Bịt lỗ hổng: học sinh tự sửa hồ sơ của mình qua công cụ lập trình của trình duyệt (13/10/2026)
-- Trước đây policy "profiles: own update" cho học sinh sửa MỌI cột của chính mình → tự cộng sticker,
-- tự đổi role thành teacher, tự duyệt/mở khoá tài khoản. Học sinh cũng tự tạo yêu cầu đổi quà với giá tuỳ ý.
-- Từ nay mọi thay đổi sticker / chuỗi ngày học / đổi quà của học sinh đi qua hàm trên máy chủ.

-- ── 1. Học sinh chỉ được sửa họ tên của mình; các cột khác chỉ giáo viên/trợ giảng hoặc hàm máy chủ được đổi ──
create or replace function public.protect_profile_columns() returns trigger
language plpgsql as $$   -- SECURITY INVOKER: current_user là người gọi thật (trong hàm security definer sẽ là chủ hàm)
begin
  if current_user in ('authenticated', 'anon')
     and coalesce(public.current_user_role(), '') not in ('teacher', 'assistant') then
    if new.role is distinct from old.role
       or new.is_approved is distinct from old.is_approved
       or new.is_active is distinct from old.is_active
       or new.username is distinct from old.username
       or new.notes_warning is distinct from old.notes_warning
       or new.sticker_count is distinct from old.sticker_count
       or new.sticker_total is distinct from old.sticker_total
       or new.streak_days is distinct from old.streak_days
       or new.streak_max is distinct from old.streak_max
       or new.last_active_date is distinct from old.last_active_date
       or new.id is distinct from old.id then
      raise exception 'forbidden_profile_update' using errcode = '42501';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists profiles_protect_columns on public.profiles;
create trigger profiles_protect_columns before update on public.profiles
  for each row execute function public.protect_profile_columns();

-- ── 2. Ghi nhận hoạt động học + chuỗi ngày học + thưởng mốc chuỗi (khoá dòng → 2 tab cùng lúc chỉ tính 1 lần) ──
create or replace function public.record_activity() returns json
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  today date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
  p record;
  new_streak int;
  bonus int;
  res record;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  select streak_days, streak_max, last_active_date into p from profiles where id = uid for update;
  if not found then return json_build_object('isNew', false); end if;
  if p.last_active_date = today then
    return json_build_object('isNew', false, 'streakDays', coalesce(p.streak_days, 0));
  end if;
  new_streak := case when p.last_active_date = today - 1 then coalesce(p.streak_days, 0) + 1 else 1 end;
  bonus := case new_streak when 3 then 3 when 7 then 7 when 14 then 14 when 30 then 30 else 0 end;
  update profiles set streak_days = new_streak, last_active_date = today,
         streak_max = greatest(coalesce(streak_max, 0), new_streak),
         sticker_count = coalesce(sticker_count, 0) + bonus, sticker_total = coalesce(sticker_total, 0) + bonus
   where id = uid returning sticker_count, sticker_total into res;
  return json_build_object('isNew', true, 'streakDays', new_streak, 'bonus', bonus,
                           'sticker_count', res.sticker_count, 'sticker_total', res.sticker_total);
end $$;

-- ── 3. Đổi quà: máy chủ lấy giá quà thật, kiểm tra đủ sticker, trừ và tạo yêu cầu trong cùng 1 giao dịch ──
create or replace function public.redeem_reward(p_item uuid) returns json
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  it record;
  cnt int;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  select id, sticker_cost, grade, is_active into it from reward_items where id = p_item;
  if not found or not it.is_active then return json_build_object('ok', false, 'reason', 'not_available'); end if;
  if it.grade is not null and not exists (
       select 1 from student_enrollments e where e.user_id = uid and e.grade = it.grade and e.is_approved) then
    return json_build_object('ok', false, 'reason', 'not_available');
  end if;
  select sticker_count into cnt from profiles where id = uid for update;
  if coalesce(cnt, 0) < coalesce(it.sticker_cost, 0) then
    return json_build_object('ok', false, 'reason', 'insufficient', 'sticker_count', coalesce(cnt, 0));
  end if;
  update profiles set sticker_count = sticker_count - it.sticker_cost where id = uid returning sticker_count into cnt;
  insert into reward_requests (student_id, reward_item_id, sticker_cost, status)
    values (uid, it.id, it.sticker_cost, 'pending');
  return json_build_object('ok', true, 'sticker_count', cnt);
end $$;

revoke all on function public.record_activity() from public, anon;
revoke all on function public.redeem_reward(uuid) from public, anon;
grant execute on function public.record_activity() to authenticated;
grant execute on function public.redeem_reward(uuid) to authenticated;

-- Học sinh không còn tự tạo yêu cầu đổi quà trực tiếp (phải qua redeem_reward)
drop policy if exists student_insert_reward_requests on public.reward_requests;
