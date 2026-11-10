# Architecture — Chi tiết kỹ thuật

Đọc file này khi cần hiểu luồng xử lý cụ thể. Cập nhật lần cuối: 10/11/2026.

## Sơ đồ tổng thể (từ 07/11/2026)

```
Trình duyệt (React, Vercel)
  ├─ Đăng nhập ───────────► Supabase Auth (project waalvhrutfugmwhmbhqd) — chỉ tài khoản, không còn dữ liệu
  ├─ Đọc/ghi dữ liệu ─────► Neon Data API (PostgREST) — thẻ đăng nhập Supabase (JWT) được Neon chấp nhận,
  │                          RLS dùng auth.uid() như cũ. Công tắc: VITE_NEON_DATA_URL trong src/lib/supabase.js
  ├─ Tạo/sửa/xoá tài khoản ► Supabase Edge Functions (supabase/functions/*) — kiểm tra người gọi là giáo viên
  ├─ AI, chấm thi ────────► Vercel Functions (api/*.js) — kiểm tra người gọi bằng api/_auth.js
  └─ Ảnh, file ───────────► Cloudinary (upload preset; xoá file qua api/deleteFile.js, chỉ giáo viên)
```
Quay lại dùng Supabase cho dữ liệu: xem `docs/CHUYEN_NHA_NEON.md`.
Thay đổi cấu trúc cơ sở dữ liệu: xem `sql/README.md`.

## Tài khoản

- **Học sinh không tự đăng ký được nữa** (Supabase Auth: tắt đăng ký). Giáo viên tạo tài khoản ở trang Học sinh
  → Edge Function `create-user` → tạo tài khoản `username@school.local` + hồ sơ ở Neon (hàm trong
  `sql/2026-11-07_neon_tai_khoan.sql`). Vai trò luôn do máy chủ đặt, không nhận từ trình duyệt.
- Đăng nhập → `AuthContext.fetchProfile()` (dùng `.maybeSingle()`) → `is_active=false` thì khoá, `is_approved=false` thì chặn.
- Ghi danh lớp: `student_enrollments` (cần giáo viên duyệt; học sinh không tự duyệt được — có trigger chặn).

## Máy chủ (api/) — tệp bắt đầu bằng "_" là thư viện dùng chung, không thành đường dẫn

| Tệp | Ai gọi | Việc |
|---|---|---|
| `_auth.js` | — | xác minh người gọi (requireUser), danh sách vai trò STAFF |
| `_gemini.js` | — | gọi Gemini, xoay vòng nhiều khoá |
| `_gradeCore.js` | — | lõi AI chấm bài thực hành |
| `grade.js` | giáo viên | AI chấm bài thực hành |
| `grade-pending.js` | pg_cron | máy chủ tự chấm bài sót |
| `ra-soat.js` | học sinh | AI phân loại ĐẠT/CHƯA ĐẠT theo tiêu chí (tối đa 7 lần/ngày, đếm ở máy chủ) |
| `hoi-dap.js` | học sinh | AI phân loại câu hỏi vào câu hỏi đáp mẫu giáo viên đã duyệt |
| `thi-python.js` | học sinh | chấm phần thực hành Python của đề thi bằng test (Wandbox, tài khoản DB riêng `cham_thi`) |
| `teacher-ai.js`, `teacher-assistant.js`, `generate-lesson.js`, `report-note.js` | giáo viên | AI soạn bài, slide, hỏi đáp, nhận xét |
| `tutor.js` | (tắt với học sinh) | AI trợ giảng — học sinh dưới lớp 8 không dùng AI tạo sinh trực tiếp |
| `deleteFile.js` | giáo viên | xoá file Cloudinary |

## Bảo mật ở cơ sở dữ liệu (Neon)
- RLS bật trên mọi bảng. Các trigger chặn học sinh tự sửa cột nhạy cảm: `protect_profile_columns` (vai trò, sticker),
  `protect_submission_grading` (điểm, nhận xét), `bao_ve_bai_thi` (điểm thực hành, số lần nộp), `bao_ve_tin_nhan`, `ghi_danh_cho_duyet`…
- Sticker / chuỗi ngày chỉ cộng qua hàm máy chủ (`award_sticker_once`, `record_activity`, `redeem_reward`).
- **Chưa xong (đợt vá 3):** điểm lý thuyết đề thi và quiz còn tính ở trình duyệt; học sinh còn đọc được đáp án câu hỏi qua API.

## Bài giảng web (src/components/slides/)
`slideModel.js` (mô tả dữ liệu slide) · `SlidePlayer.jsx` (trình chiếu) · trang soạn `SlideEditorPage.jsx` · trang dạy `TeachPage.jsx`.
Lưu ở bảng `lesson_slides`. Có thể nhập PPTX làm nguồn cho AI soạn, hoặc nhập PDF thành slide ảnh (loại `anh`).

## Đề thi thực hành
`exams.practical_type`: word · ppt · python · scratch. Python: test ở `exam_tests` (học sinh không đọc được), mỗi lần nộp ghi
`exam_nop_python`, tối đa 10 lần, lấy điểm cao nhất. Scratch: giáo viên chấm, AI chấm nháp (`exam_sessions.practical_ai`).

## Luồng câu hỏi

### Tạo đơn lẻ (QuestionFormModal)
Form state → validate → INSERT questions. Tab key trong textarea = 4 spaces (Python IDE).

### Import hàng loạt (QuestionImportModal + questionParser.js)
```
Paste text → parseQuestions() → mảng objects → preview/edit → INSERT nhiều rows
```
Parser nhận dạng theo keyword:
- `Câu N:` → bắt đầu câu mới
- `A. B. C. D.` → multiple_choice
- `Từ:` → drag_word
- `Câu đúng:` → word_order (tự build chips từ câu)
- `[Tự luận]` prefix → essay
- `1. 2. 3.` (không có A/B/C/D) → ordering
- `text | text` hoặc `text = text` → matching
- `Đáp án:` → correct_answer
- `Gợi ý:` → hint (mọi loại câu)
- `Đáp án mẫu:` → correct_answer cho essay

### Cấu trúc options theo loại
| Loại | options | match_options | correct_answer |
|------|---------|---------------|----------------|
| multiple_choice | [{key,text,image_url}] | — | "B" (letter) |
| true_false | [] | — | "Đúng"/"Sai" |
| fill_blank | [] | — | "text" hoặc "a,b,c" (nhiều chỗ trống) |
| drag_word | [{key,text}] word bank | — | "từ1,từ2,từ3" |
| ordering | [{key,text}] thứ tự đúng | — | "A,B,C,D" |
| matching | [{key,text}] cột trái | [{key,text}] cột phải | "A-1,B-2,C-3" |
| word_order | [{key,text}] chips từ | — | "câu hoàn chỉnh" |
| essay | [{allow_file,max_score}] | — | null (hoặc đáp án mẫu) |

## Luồng bài học (LessonPage)

```
loadData():
  fetch lesson, questions, lesson_progress, task_submissions

Sections (chỉ hiện nếu lesson có):
  1. Video (YouTube embed) → đánh dấu video_watched khi xem xong
  2. Bài tập (LessonQuiz) → từng câu: xác nhận → đúng/sai → hint
     Pass = đúng ≥ 2/3 → cập nhật quiz_passed
  3. Thực hành (upload file / gõ text) → lesson_submissions

completed = videoOk AND quizOk AND practiceOk
```

## QuizSession — 2 chế độ

```
practiceMode = !examMode && showAnswer

Practice mode:
  - confirmedSet: Set<index> — câu đã xác nhận
  - Phải xác nhận trước khi nhảy câu tiếp
  - Panel nav: locked (xám) / confirmed-correct (xanh) / confirmed-wrong (đỏ)
  - Hiện hint nếu sai và q.hint tồn tại

Exam mode:
  - Không có xác nhận, làm tự do
  - Nộp 1 lần → lưu exam_sessions
  - show_answer, show_score control bởi exam config
```

## Lesson quiz vs QuizSession
| | LessonPage > LessonQuiz | QuizSession |
|---|---|---|
| Dùng ở đâu | Bài học | Luyện tập, Đề thi |
| Sai thì | Làm lại câu đó | Xem gợi ý, qua câu tiếp |
| Pass | ≥ 2/3 đúng | N/A (chỉ ghi điểm) |
| Lưu DB | lesson_progress | quiz_sessions / exam_sessions |

## Đề thi (ExamsPage)
- `is_active=true` → học sinh thấy
- `class_names[]` → null = tất cả lớp, có giá trị = chỉ lớp đó
- `max_attempts` → 0 = không giới hạn
- `show_answer`, `show_score` → ẩn/hiện sau khi nộp
- `has_practical` → có phần thực hành (upload file), chấm riêng

## Chấm bài (LessonSubmissionsPage)
```
fetch lesson → fetch students in lesson.grade
fetch lesson_submissions per student
→ teacher nhập score (0-10) + teacher_comment → UPDATE lesson_submissions
→ cập nhật reviewed_at
```

## Ghi chú lịch sử

### CHECK constraint cứng trên nhiều bảng (đã xử lý)
Schema gốc có `check (grade in ('3','4','5'))` trên:
`profiles.grade`, `questions.grade`, `lessons.grade`, `exams.grade`, `classes.grade`

Khi thêm khối mới (A, B, Kĩ Năng-A...) qua GradesPage → tạo questions/lessons cho khối đó sẽ lỗi 23514.
Cần chạy:
```sql
ALTER TABLE public.questions DROP CONSTRAINT IF EXISTS questions_grade_check;
ALTER TABLE public.lessons   DROP CONSTRAINT IF EXISTS lessons_grade_check;
ALTER TABLE public.exams     DROP CONSTRAINT IF EXISTS exams_grade_check;
ALTER TABLE public.classes   DROP CONSTRAINT IF EXISTS classes_grade_check;
ALTER TABLE public.profiles  DROP CONSTRAINT IF EXISTS profiles_grade_check;
```
ClassesPage đã có friendly error message nhắc việc này (error code 23514).

## Cloudinary
- Cloud name: `VITE_CLOUDINARY_CLOUD_NAME`
- Upload preset: `VITE_CLOUDINARY_UPLOAD_PRESET`
- Image → `/image/upload`, file khác (pdf, docx, sb3...) → `/raw/upload`
- File tối đa 20MB

## useGrades hook
Đọc từ bảng `grades` (source of truth). GradesPage quản lý thêm/sửa/xóa khối — khi sửa tên khối sẽ cascade update `classes`, `profiles`, `questions`, `exams`, `lessons`.
