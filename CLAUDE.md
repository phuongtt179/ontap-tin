# Ôn Tập Tin Học — Tiểu Học

Ứng dụng dạy học môn Tin học tiểu học. Giáo viên soạn nội dung, học sinh học và làm bài tập.

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
| `student` | `username@school.local` / password | Tự đăng ký, chờ giáo viên duyệt |

Email confirmation tắt trong Supabase Auth Settings (dùng domain @school.local).

## Cấu trúc nội dung
```
grades (khối) → classes (lớp) → profiles.grade (học sinh)
topics (chủ đề) → lessons (bài học) → lesson_progress (tiến độ)
questions → exams (đề thi) → exam_sessions (bài làm)
```
Bài học lọc theo `grade`, không theo `class_name` — nhiều lớp cùng khối dùng chung nội dung. Thiết kế cố ý.

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
| File | Nội dung |
|------|----------|
| `migration_approval.sql` | Thêm `is_approved`, `is_active` vào profiles; cập nhật trigger `handle_new_user`; policy teacher update profiles; classes public read |
| `migration_hint.sql` | Thêm cột `hint TEXT` vào bảng `questions` |

## Routes
```
/login · /register
/teacher · /teacher/questions · /teacher/topics · /teacher/grades
/teacher/classes · /teacher/students · /teacher/lessons
/teacher/lessons/:id/submissions · /teacher/exams · /teacher/exams/:id/results · /teacher/exam-stats
/student · /student/learn · /student/learn/:id
/student/practice · /student/exams · /student/history
```

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
src/pages/student/LessonPage.jsx     — trang học bài của học sinh
src/pages/teacher/LessonSubmissionsPage.jsx — chấm bài thực hành
```
