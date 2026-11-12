# Ôn Tập Tin Học — Tiểu Học

Ứng dụng dạy học lập trình sáng tạo / Tin học tiểu học. Giáo viên soạn nội dung, học sinh học và làm bài tập.
Repo `ontap-tin`. Thương hiệu học sinh: **"Lập Trình Sáng Tạo BNP"** (Scratch/Python) — deploy tại `laptrinhsangtao.vercel.app`. Phía giáo viên vẫn hiển thị "Ôn Tập Tin".

## Stack
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Neon (PostgreSQL + Data API + RLS, dữ liệu) · Supabase (chỉ Auth + Edge Functions tài khoản) · Vercel Functions `api/` (AI, chấm thi)
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
- **CHECK constraint cũ** — schema gốc có `check (grade in ('3','4','5'))` trên nhiều bảng (`questions`, `lessons`, `exams`, `classes`, `profiles`). Đã xoá trên Neon (kiểm tra 10/11/2026).
- **Học sinh tự đăng ký** → `is_approved=false` → giáo viên duyệt tại trang Học sinh → mới đăng nhập được.
- **is_active=false** → tài khoản bị khóa, không đăng nhập được.
- **Quiz pass** = đúng ≥ 2/3 số câu.
- **Lesson quiz** — từng câu một: đúng → câu tiếp, sai → làm lại câu đó + hiện gợi ý.
- **Practice mode** (QuizSession) — phải xác nhận từng câu, sai hiện gợi ý, không nhảy câu tương lai.
- **Exam mode** (QuizSession) — không xác nhận từng câu, làm tự do, nộp 1 lần.

## Cơ sở dữ liệu & thay đổi cấu trúc
- **Từ 07/11/2026: dữ liệu ở Neon, đăng nhập ở Supabase** (xem `docs/ARCHITECTURE.md`, cách quay lại: `docs/CHUYEN_NHA_NEON.md`).
- Mọi tệp SQL nằm trong `sql/`, tên `NGÀY_ten.sql` theo thứ tự đã chạy. Tệp mới chạy trên **Neon** (trừ tệp ghi "CHẠY TRÊN SUPABASE"). Quy tắc: `sql/README.md`.
- Tệp `*.local.sql` có mật khẩu — không đưa lên Git.
- Sao lưu: `node scripts/sao-luu-neon.mjs` → `SaoLuu/neon_<ngày>/` (không lên Git, có dữ liệu học sinh).

## Cấu trúc mã — hiện trạng & kế hoạch dọn (rà soát 10/11/2026)
Theo quy tắc "Cấu trúc mã" trong CLAUDE.md toàn cục. App viết trước khi có quy tắc nên chưa đạt (đánh giá ~5,5/10):
trang tự gọi DB ở ~279 chỗ, quy tắc chép nhiều nơi, 0 kiểm tra tự động, vài trang rất dài.
- **Mã MỚI** bắt buộc theo chuẩn: quy tắc vào `src/domain/`, đọc ghi DB qua `src/data/`, tệp ≤ ~400 dòng.
- **Mã CŨ** chỉ dọn khi người dùng rảnh và đồng ý, làm trên nhánh `neon` + link thử, mỗi lần 1 phần. Thứ tự:
  1. [x] (11/11) Gom quy tắc về `src/domain/`: `baiThucHanh.js` (parseTasks — 7 bản → 1, dùng chung cả `api/`), `tienDoBaiHoc.js` (đạt quiz 2/3, bước / hoàn thành bài), `sticker.js` (sticker theo mức, mốc chuỗi, ngưỡng quà), `thuTuBaiHoc.js`. Đã so trên dữ liệu thật: giống hệt bản cũ.
  2. [x] (11/11) Tạo `src/data/`: `baiNop.js` · `baiHoc.js` · `ghiDanh.js` · `cauHoi.js` · `hoSo.js` — 141 chỗ gọi thẳng 5 bảng này → 0. Bảng khác (lesson_progress, exams, exam_sessions, messages, units, topics…) vẫn gọi thẳng: chuyển dần khi sửa tới.
  3. [x] (11/11) Kiểm tra tự động: `src/domain/*.test.js` (gồm `dapAn.js` — so đáp án 3 bản → 1, `chamPython.js` — chạy thật chương trình chấm bằng Python máy), `api/_auth.test.js` (cổng quyền), `api/_quyen_api.test.js` (gọi từng API bằng người lạ / học sinh; API mới chưa khai báo quyền → đỏ), `tests/that/quyenDuLieu.test.js` (đăng nhập HS thử, cố đọc / sửa trên Neon thật, tự khôi phục nếu lọt; lỗ hổng bước 5 ghi `it.todo`).
  4. [ ] Tách trang lớn: [x] (11/11) student/LessonPage 1.847 → 370, không còn gọi thẳng DB (`components/student/baiHoc/*` + `hooks/useBaiThucHanh.js`; (12/11) thêm `data/khoaHoc.js` · `tienDo.js` · `hoiThayCo.js`, `domain/moKhoaBai.js` — quy tắc mở khoá bài theo lớp + lộ trình AI, dùng chung với `useLearnData`) → [x] (12/11) teacher/LessonsPage 1.626 → 255 (`components/teacher/baiHoc/*`: form 3 bước `LessonFormModal` + `Buoc*`, `TaskEditor`, `CayChuDe`, `DongBaiHoc`, người xem `ChonHocSinhXem` dùng chung; ghi người xem `data/baiHoc.ghiNguoiXemBai` 2 → 1) → [x] (12/11) QuizSession 1.196 → 299 (`components/student/quiz/*`: ô trả lời 8 loại, bảng câu, kết quả; `data/baiLam.js` nộp thi / luyện tập; `domain/dinhDangCauHoi.js` tách ô trống 4 → 1 + chuẩn hoá lựa chọn — so 1.568 câu thật: giống hệt) → [ ] LessonSubmissionsPage (1.072) → [ ] StudentsPage (1.121). Mỗi lần tách: `src/kiemTraMa.test.js` (thành phần dùng mà quên import) + test dựng thử `*.render.test.jsx` (renderToString nhiều trạng thái).
  5. [ ] Vá bảo mật đợt 3 (đi cùng bước 1–2): điểm quiz/thi lý thuyết do máy chủ tính; ẩn đáp án, bài chưa xuất bản, tiêu chí chấm khỏi học sinh.
- Đã có (12/11): `src/domain/` (9 tệp, có test), `src/data/` (9 tệp), vitest. **Trước khi đưa lên: `npm test` (nhanh, không mạng) + `npm run test:quyen` (dữ liệu thật) + eslint.** Đọc ghi 5 bảng trên PHẢI qua `src/data/`, không gọi `supabase.from()` thẳng trong trang.
- Đã xong 10/11: SQL vào `sql/`, tài liệu vào `docs/` (ARCHITECTURE cập nhật theo Neon), eslint hết báo nhầm ở `api/`.

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
src/components/student/QuizSession.jsx — engine làm bài (practice + exam mode); phần con ở components/student/quiz/
src/components/teacher/QuestionFormModal.jsx  — tạo/sửa câu hỏi đơn
src/components/teacher/QuestionImportModal.jsx — import hàng loạt từ text
src/utils/questionParser.js          — parse text Word → structured questions
src/domain/dapAn.js                  — so đáp án + điểm phần tự chấm (dungDapAn, diemTuDong)
src/hooks/useGrades.js               — fetch grades từ bảng grades
src/pages/student/LessonPage.jsx     — trang học bài HS: tải dữ liệu + ghép các phần trong components/student/baiHoc/ (thực hành: hooks/useBaiThucHanh.js)
src/pages/teacher/LessonSubmissionsPage.jsx — chấm bài thực hành
src/components/student/AskTutorModal.jsx — modal AI trợ giảng (quiz/thực hành/lý thuyết)
api/tutor.js · api/grade.js          — serverless Gemini: trợ giảng · chấm bài
src/hooks/useEnrollments.js          — ghi danh HS ↔ lớp, grade đang chọn
src/components/ui/Layout.jsx         — sidebar/nav (teacher) + topbar (student)
```
