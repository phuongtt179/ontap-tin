-- SỬA LỖI "infinite recursion detected in policy for relation profiles" (29/10/2026)
-- Triệu chứng: giáo viên KHÔNG cập nhật được hồ sơ học sinh — duyệt bài không cộng được sticker,
-- duyệt học sinh mới / khoá tài khoản / sửa tên có thể lỗi.
-- Nguyên nhân: 3 policy của bảng profiles tự truy vấn chính bảng profiles (EXISTS (SELECT … FROM profiles …)).
-- Sửa: dùng hàm current_user_role() (SECURITY DEFINER, không bị RLS → không lặp vòng). Logic GIỮ NGUYÊN:
--   chỉ giáo viên / trợ giảng sửa được hồ sơ học sinh; chỉ giáo viên xoá được; học sinh chỉ sửa hồ sơ mình
--   (trigger protect_profile_columns vẫn chặn học sinh tự đổi sticker / vai trò).
-- Cách chạy: Supabase → SQL Editor → dán toàn bộ → Run.

begin;
alter policy "profiles: teacher update" on public.profiles
  using (((select current_user_role()) = any (array['teacher'::text, 'assistant'::text])));
alter policy "profiles: teacher delete" on public.profiles
  using (((select current_user_role()) = 'teacher'::text));
alter policy "teacher_update_profiles" on public.profiles
  using ((((select auth.uid()) = id) or ((select current_user_role()) = any (array['teacher'::text, 'assistant'::text]))))
  with check (true);
commit;
