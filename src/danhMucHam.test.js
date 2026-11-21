// DANH MỤC HÀM (15/11/2026) — docs/DANH_MUC_HAM.md liệt kê mọi hàm dùng chung + mô tả, để trước khi viết hàm mới
// tra xem đã có hàm làm việc đó chưa (tránh 2 hàm khác tên cùng làm 1 việc).
// Đỏ khi: (1) danh mục đã cũ — thêm / sửa hàm mà quên `npm run danh-muc`;
//         (2) hàm MỚI không có chú thích mô tả ngay trên nó (danh mục sẽ không tra được);
//         (3) 2 tệp xuất hàm cùng tên (dấu hiệu viết trùng).
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { taoDanhMuc, TEP_DANH_MUC } from '../scripts/danh-muc-ham.mjs'

// hàm có từ trước 15/11/2026 chưa có mô tả (tên đã tự rõ nghĩa) — bổ sung dần, xong cái nào xoá khỏi đây
const THIEU_MO_TA_CU = new Set(['GIAY_MOI_TEST', 'GIA_HAN_PHUT', 'DO_DAI_TOI_DA', 'MAT_KHAU_TOI_THIEU', 'LOAI_CAU_HOI', 'datQuiz',
  'demBaiDaXuatBan', 'xoaBaiHoc', 'layBaiNopTheoIds', 'demBaiChuaCham', 'demCauHoi', 'demCauThieuGoiY', 'layCauThieuGoiY', 'capNhatCauHoi',
  'xoaCauHoi', 'doiChuDeCuaCauHoi', 'suaChuDe', 'xoaChuDe', 'suaDonVi', 'xoaDonVi', 'themTieuDe', 'suaTieuDe', 'xoaTieuDe', 'xoaDeThi',
  'datMoDeThi', 'moBuoiDiemDanh', 'dongBuoiDiemDanh', 'diemDanh', 'themGhiChu', 'xoaGhiChu', 'xoaGhiDanh', 'demHocSinh', 'layTroGiang',
  'xoaHoiDap', 'themKhoa', 'themLop', 'suaLop', 'xoaLop', 'themQua', 'suaQua', 'xoaQua', 'luuNguong', 'xoaTin', 'useChamBaiThucHanh',
  'useGrades', 'useHocSinh', 'useHopThu', 'useLessonTitles', 'usePhanThuong', 'useTienDoLop', 'useTopics', 'useUnits', 'getLessonSource',
  'topicKeyOf', 'CAC_MUC', 'parsePracticeTasks', 'parseQuestions', 'generateSb3Text', 'extractSlideText', 'tachTieuChi', 'uploadImage',
  'NOI_DU_LIEU', 'supabase', 'STAFF', 'slideScriptPrompt', 'slideBuildPrompt'])

const moi = taoDanhMuc()
const dong = moi.split('\n')

describe('danh mục hàm', () => {
  it('docs/DANH_MUC_HAM.md khớp mã hiện tại', () => {
    const cu = readFileSync(TEP_DANH_MUC, 'utf8').replace(/\r\n/g, '\n')
    expect(cu === moi, 'Danh mục hàm đã cũ — chạy: npm run danh-muc').toBe(true)
  })
  it('hàm mới phải có chú thích mô tả ngay trên nó', () => {
    const thieu = dong.filter(l => l.includes('⚠ chưa có mô tả')).map(l => l.match(/`(\w+)/)[1]).filter(t => !THIEU_MO_TA_CU.has(t))
    expect(thieu, 'Thêm chú thích /** … */ mô tả hàm làm gì ngay trên các hàm này').toEqual([])
  })
  it('không có 2 tệp xuất hàm cùng tên', () => {
    const noi = {}
    let tep = ''
    for (const l of dong) {
      if (l.startsWith('### ')) tep = l.split(' ')[1]
      const m = l.match(/^- `(\w+)/)
      if (m) (noi[m[1]] ||= []).push(tep)
    }
    const trung = Object.entries(noi).filter(([, ds]) => ds.length > 1).map(([t, ds]) => `${t}: ${ds.join(', ')}`)
    expect(trung, 'Cùng tên ở nhiều tệp — có thể đang viết trùng, gộp lại 1 nơi').toEqual([])
  })
})
