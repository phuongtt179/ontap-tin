# Ôn Tập Tin Học — Tiểu Học

Ứng dụng dạy học lập trình sáng tạo / Tin học tiểu học. Giáo viên soạn nội dung, học sinh học và làm bài tập.
Repo `ontap-tin`. Thương hiệu học sinh: **"Lập Trình Sáng Tạo BNP"** (Scratch/Python) — deploy tại `laptrinhsangtao.vercel.app`. Phía giáo viên vẫn hiển thị "Ôn Tập Tin".

## Stack
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **Media**: Cloudinary (ảnh, audio, file bài tập)
- **Deploy**: Vercel — auto-deploy khi push lên nhánh `main`
- **Markdown/Code**: react-markdown + react-syntax-highlighter (Prism, theme oneLight)

## Người dùng
| Role | Đăng nhập | Ghi chú |
|------|-----------|---------|
| `teacher` | email/password do admin tạo | Quản lý toàn bộ nội dung |
| `assistant` | như teacher | Trợ giảng — hầu hết quyền như teacher (trừ trang Trợ giảng). RLS nhiều bảng check `role IN ('teacher','assistant')` |
| `student` | `username@school.local` / password | Tự đăng ký, chờ giáo viên duyệt |

Email confirmation tắt trong Supabase Auth Settings (dùng domain @school.local).

## Cấu trúc nội dung
```
grades (khoá) → classes (lớp) · student_enrollments (ghi danh HS ↔ lớp, cần duyệt)
topics (chủ đề) / units (đơn vị) / lesson_titles (tiêu đề nhỏ) → lessons (bài học) → lesson_progress
lessons → practice tasks (JSON) → lesson_submissions (bài nộp, chấm AI/thủ công)
questions → exams (đề thi) → exam_sessions (bài làm)
```
Bài học lọc theo `grade`, không theo `class_name` — nhiều lớp cùng khoá dùng chung nội dung. Thiết kế cố ý.
Học sinh ↔ lớp qua bảng `student_enrollments` (không dùng `profiles.grade/class_name` cũ). Xem hook `useEnrollments`.

## Hệ thống gamification & tương tác (ngoài schema gốc)
- **Sticker/Streak**: `profiles.sticker_count` (đổi quà), `sticker_total` (tích luỹ), `streak_days`/`streak_max`. Xem `src/utils/updateStreak.js`.
- **Phần thưởng**: `reward_items` (có `sticker_cost` riêng từng quà) + `reward_requests` + `reward_configs` (ngưỡng theo khoá). Trang `/teacher/rewards`, modal `RewardModal`/`StickerModal`.
- **Tin nhắn**: bảng `messages` — chat HS ↔ giáo viên, có `channel` ('teacher'|'ai') + `context` jsonb + role 'ai'.
- **AI trợ giảng**: `api/tutor.js` + `AskTutorModal`. 3 cửa vào (quiz/thực hành/lý thuyết), AI đáp trước → escalate lên thầy. Grounding lý thuyết từ `lessons.ai_context` (giáo viên dán). Không đặt ở đề thi.
- **AI chấm bài thực hành**: `api/grade.js` (Gemini) + `src/utils/aiGrader.js`. `lesson_submissions.ai_breakdown` = bảng điểm chi tiết.
- **Điểm danh**: `attendance_sessions` + `attendance_records`. Trang `/teacher/attendance`.

## 8 loại câu hỏi
`multiple_choice` · `true_false` · `fill_blank` · `drag_word` · `ordering` · `matching` · `word_order` · `essay`

Câu hỏi có thể chứa code block markdown (` ```python ``` `) — render bằng `QuestionText` component (`src/components/ui/QuestionText.jsx`). Dùng `<div>` không dùng `<p>` để bọc QuestionText (div-in-p invalid HTML).

## Quyết định thiết kế quan trọng
- **Grade là text tự do** — quản lý qua bảng `grades` + trang `/teacher/grades`. Không dùng enum cứng.
- **CHECK constraint cũ** — schema gốc có `check (grade in ('3','4','5'))` trên nhiều bảng (`questions`, `lessons`, `exams`, `classes`, `profiles`). Cần xóa constraint này để dùng khối tùy chỉnh (A, B, Kĩ Năng-A...). ClassesPage đã có error message nhắc việc này.
- **Học sinh tự đăng ký** → `is_approved=false` → giáo viên duyệt tại trang Học sinh → mới đăng nhập được.
- **is_active=false** → tài khoản bị khóa, không đăng nhập được.
- **Quiz pass** = đúng ≥ 2/3 số câu.
- **Lesson quiz** — từng câu một: đúng → câu tiếp, sai → làm lại câu đó + hiện gợi ý.
- **Practice mode** (QuizSession) — phải xác nhận từng câu, sai hiện gợi ý, không nhảy câu tương lai.
- **Exam mode** (QuizSession) — không xác nhận từng câu, làm tự do, nộp 1 lần.

## Migrations bổ sung (chưa có trong supabase_schema.sql gốc)
Có ~24 file `migration_*.sql` ở root. Chạy trực tiếp qua Supabase Management API (xem memory `supabase-access`). Nhóm chính:
- **approval/enrollment**: `migration_approval`, `migration_enrollment*`, `migration_student_unenroll` — duyệt HS, ghi danh lớp
- **nội dung**: `migration_hint`, `migration_units`, `migration_lesson_titles`, `migration_pptx`, `migration_quiz_progress`, `migration_resubmit`, `migration_notes*`
- **gamification/tương tác**: `migration_sticker`, `migration_streak`, `migration_rewards*`, `migration_reward_cost`, `migration_messages`, `migration_ai_tutor`
- **điểm danh/trợ giảng**: `migration_attendance`, `migration_assistant*`, `migration_created_by`

⚠️ Nhớ xoá CHECK constraint `grade in ('3','4','5')` (schema gốc) trên các bảng để dùng khoá tuỳ chỉnh.

## Routes
```
/login · /register
/teacher · /teacher/questions · /teacher/topics · /teacher/grades · /teacher/classes
/teacher/students · /teacher/lessons · /teacher/lessons/:id/submissions
/teacher/exams · /teacher/exams/:id/results · /teacher/exam-stats
/teacher/notes · /teacher/attendance · /teacher/rewards · /teacher/messages
/teacher/assistants · /teacher/sb3-preview
/student · /student/learn · /student/learn/:id · /student/courses
/student/practice · /student/exams · /student/history · /student/notes · /student/messages
```
⚠️ **Nav học sinh (Layout.jsx) chỉ có 2 mục**: Bài học + Hỏi giáo viên. Các trang `/student` (dashboard), `/student/exams`, `/student/practice`, `/student/history`, `/student/notes`, `/student/courses` **không có lối vào từ menu** (chỉ link nội bộ trong StudentDashboard, mà dashboard cũng không trong nav). Đây là điểm cần lưu ý — ExamsPage/PracticePage vẫn là nguồn tạo `exam_sessions`/`quiz_sessions` nuôi thống kê giáo viên, KHÔNG được xoá.

## Thư mục quan trọng
```
src/components/ui/QuestionText.jsx   — render markdown + code
src/components/ui/QuestionCard.jsx   — hiển thị câu hỏi phía giáo viên
src/components/student/QuizSession.jsx — engine làm bài (practice + exam mode)
src/components/teacher/QuestionFormModal.jsx  — tạo/sửa câu hỏi đơn
src/components/teacher/QuestionImportModal.jsx — import hàng loạt từ text
src/utils/questionParser.js          — parse text Word → structured questions
src/utils/normalizeAnswer.js         — so sánh đáp án (normalize)
src/hooks/useGrades.js               — fetch grades từ bảng grades
src/pages/student/LessonPage.jsx     — trang học bài HS (video/pptx-pdf/quiz/thực hành + nút AI trợ giảng)
src/pages/teacher/LessonSubmissionsPage.jsx — chấm bài thực hành
src/components/student/AskTutorModal.jsx — modal AI trợ giảng (quiz/thực hành/lý thuyết)
api/tutor.js · api/grade.js          — serverless Gemini: trợ giảng · chấm bài
src/hooks/useEnrollments.js          — ghi danh HS ↔ lớp, grade đang chọn
src/components/ui/Layout.jsx         — sidebar/nav (teacher) + topbar (student)
```
