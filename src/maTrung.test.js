// CHẶN MÃ CHÉP LẠI (15/11/2026): dò các đoạn mã giống nhau (≥ 8 dòng) trong src/ và api/ bằng jscpd.
// Có đoạn trùng MỚI → đỏ, chỉ ra 2 nơi trùng: tách phần chung thành hàm / thành phần dùng chung rồi dùng ở cả 2 nơi.
// TRUNG_CU = các cặp đã trùng từ trước (15/11/2026, 29 đoạn) — dọn dần khi sửa tới; dọn xong cặp nào thì xoá khỏi danh sách.
// Chỉ bắt mã CHÉP gần giống; 2 hàm viết khác nhau mà làm cùng việc thì tra docs/DANH_MUC_HAM.md (xem danhMucHam.test.js).
import { describe, it, expect } from 'vitest'
import { createRequire } from 'module'

const { detectClones } = createRequire(import.meta.url)('jscpd')

const TRUNG_CU = new Set([
  'api/_gradeCore.js | api/generate-lesson.js',
  'api/generate-lesson.js | api/teacher-assistant.js',
  'api/teacher-assistant.js | api/tutor.js',
  'src/components/student/GhiChuModal.jsx | src/components/teacher/hocSinh/SuaHocSinhModal.jsx',
  'src/components/student/baiHoc/LessonQuiz.jsx | src/components/student/baiHoc/LessonQuiz.jsx',
  'src/components/student/baiHoc/OTraLoi.jsx | src/components/student/quiz/CauDienTu.jsx',
  'src/components/student/baiHoc/OTraLoi.jsx | src/components/student/quiz/CauSapXep.jsx',
  'src/components/teacher/baiHoc/BuocChonCauHoi.jsx | src/components/teacher/deThi/BuocChonCauHoiDe.jsx',
  'src/components/teacher/baiHoc/BuocThongTin.jsx | src/components/teacher/cauHoi/NoiDungCauHoi.jsx',
  'src/components/teacher/baiHoc/CayChuDe.jsx | src/components/teacher/cauHoi/CayCauHoi.jsx',
  'src/components/teacher/cauHoi/DapAnTuNgu.jsx | src/components/teacher/cauHoi/DapAnTuNgu.jsx',
  'src/components/teacher/chuDe/NhapChuDeModal.jsx | src/components/teacher/chuDe/QuanLyDonViModal.jsx',
  'src/components/teacher/chuDe/QuanLyDonViModal.jsx | src/components/teacher/chuDe/QuanLyTieuDeModal.jsx',
  'src/components/ui/Layout.jsx | src/components/ui/Layout.jsx',
  'src/pages/student/ExamsPage.jsx | src/pages/teacher/ExamsPage.jsx',
  'src/pages/teacher/ClassesPage.jsx | src/pages/teacher/TopicsPage.jsx',
  'src/pages/teacher/ExamResultsPage.jsx | src/pages/teacher/ExamStatsPage.jsx',
  'src/pages/teacher/LessonsPage.jsx | src/pages/teacher/QuestionsPage.jsx',
])

const tenTep = d => d.sourceId.split('\\').join('/')
const viTri = d => `${tenTep(d)}:${d.start.line}-${d.end.line}`

describe('không có mã chép lại mới', () => {
  it('mọi đoạn trùng đều thuộc danh sách cũ', async () => {
    const ds = await detectClones({
      path: ['src', 'api'], ignore: ['**/*.test.*', '**/*.render.*', '**/node_modules/**'],
      format: ['javascript', 'jsx'], minLines: 8, minTokens: 70, silent: true, reporters: [],
    })
    const moi = ds.filter(c => !TRUNG_CU.has([tenTep(c.duplicationA), tenTep(c.duplicationB)].sort().join(' | ')))
      .map(c => `${viTri(c.duplicationA)}  ==  ${viTri(c.duplicationB)}`)
    expect(moi, 'Mã mới chép lại đoạn đã có — tách phần chung ra hàm / thành phần dùng chung:\n' + moi.join('\n')).toEqual([])
  }, 120000)
})
