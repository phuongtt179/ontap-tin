# Architecture — Chi tiết kỹ thuật

Đọc file này khi cần hiểu luồng xử lý cụ thể. Không cần đọc mỗi session.

## Auth flow

```
Đăng ký (/register)
  → supabase.auth.signUp({ email: username@school.local, metadata: { is_approved: false, ... } })
  → trigger on_auth_user_created → INSERT INTO profiles (is_approved = false)
  → AuthContext.fetchProfile() → thấy is_approved=false → signOut() + toast "chờ duyệt"

Giáo viên duyệt (StudentsPage)
  → UPDATE profiles SET is_approved = true WHERE id = student_id

Đăng nhập bình thường
  → fetchProfile() dùng .maybeSingle() (không dùng .single() → tránh 406)
  → kiểm tra is_active=false → khóa
  → kiểm tra is_approved=false → chặn
```

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

## Vấn đề đã biết cần xử lý

### CHECK constraint cứng trên nhiều bảng
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
