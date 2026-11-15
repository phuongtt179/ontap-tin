// Sinh docs/DANH_MUC_HAM.md — danh mục mọi hàm dùng chung (quy tắc, đọc ghi dữ liệu, hook, tiện ích, máy chủ) kèm mô tả.
// Mô tả lấy từ chú thích ngay trên mỗi hàm (/** … */ hoặc //) — danh mục luôn khớp mã thật, không ghi tay.
//   node scripts/danh-muc-ham.mjs      (= npm run danh-muc) ghi lại tệp
// src/danhMucHam.test.js báo đỏ nếu tệp đã cũ (thêm / sửa hàm mà quên chạy lệnh này).
// MỤC ĐÍCH: trước khi viết hàm mới, tìm trong danh mục xem đã có hàm làm việc đó chưa → dùng lại, không viết trùng.
import { readFileSync, readdirSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..')
export const TEP_DANH_MUC = join(GOC, 'docs', 'DANH_MUC_HAM.md')

const NHOM = [
  ['src/domain', 'Quy tắc nghiệp vụ (hàm thuần, có kiểm tra tự động)'],
  ['src/data', 'Đọc / ghi cơ sở dữ liệu — mọi truy vấn bảng đi qua đây'],
  ['src/hooks', 'Hook giao diện (tải dữ liệu + trạng thái cho trang)'],
  ['src/utils', 'Tiện ích cũ (chưa chuyển về domain / data)'],
  ['src/lib', 'Kết nối dịch vụ ngoài (Supabase, Cloudinary, API)'],
  ['api', 'Máy chủ Vercel — chỉ tệp dùng chung `_*.js`', f => f.startsWith('_')],
]

const laTest = f => /\.test\.|\.render\./.test(f)

/** chú thích ngay trên dòng i (khối /** *\/ hoặc các dòng //) → 1 dòng mô tả */
function moTaTren(L, i) {
  let j = i - 1
  while (j >= 0 && L[j].trim() === '') j--
  if (j < 0) return ''
  const d = L[j].trim()
  if (d.endsWith('*/')) {
    const cuoi = j
    while (j >= 0 && !L[j].includes('/**') && !L[j].includes('/*')) j--
    return L.slice(j, cuoi + 1).join(' ')
      .replace(/\/\*\*?|\*\//g, '').replace(/^\s*\*\s?/gm, '').replace(/\s+\*\s/g, ' ').replace(/\s+/g, ' ').trim()
  }
  if (d.startsWith('//')) {
    const ds = []
    while (j >= 0 && L[j].trim().startsWith('//')) ds.unshift(L[j].trim().replace(/^\/\/\s?/, '')), j--
    return ds.join(' ').trim()
  }
  return ''
}

/** chú thích đầu tệp (các dòng // đầu tiên) */
function moTaTep(L) {
  const ds = []
  for (const l of L) { if (l.trim().startsWith('//')) ds.push(l.trim().replace(/^\/\/\s?/, '')); else break }
  return ds.join(' ').replace(/\s+/g, ' ').trim()
}

/** các hàm / hằng xuất ra của 1 tệp: [{ ten, thamSo, moTa, hang }] */
export function hamCuaTep(ma) {
  const L = ma.replace(/\r\n/g, '\n').split('\n')
  const ra = []
  L.forEach((l, i) => {
    let m = l.match(/^export (?:default )?(?:async )?function\s*\*?\s*(\w+)\s*\(([^)]*)\)?/)
    if (m) return ra.push({ ten: m[1], thamSo: m[2].trim(), moTa: moTaTren(L, i) })
    m = l.match(/^export const (\w+)\s*=\s*(?:async\s*)?(\([^)]*\)|\w+)\s*=>/)
    if (m) return ra.push({ ten: m[1], thamSo: m[2].replace(/^\(|\)$/g, '').trim(), moTa: moTaTren(L, i) })
    m = l.match(/^export (?:const|let) (\w+)\s*=/)
    if (m) return ra.push({ ten: m[1], hang: true, moTa: moTaTren(L, i) })
  })
  return ra
}

export function taoDanhMuc() {
  const out = [
    '# Danh mục hàm dùng chung',
    '',
    '> **Tệp tự sinh — đừng sửa tay.** Chạy `npm run danh-muc` sau khi thêm / sửa hàm (kiểm tra tự động báo đỏ nếu quên).',
    '> **Trước khi viết hàm mới:** tìm ở đây (Ctrl+F theo việc cần làm) — có rồi thì dùng lại, gần giống thì mở rộng hàm cũ.',
    '> Mô tả lấy từ chú thích ngay trên mỗi hàm trong mã. Hàm thiếu mô tả ghi ⚠.',
    '',
  ]
  let tong = 0, thieu = 0
  for (const [thuMuc, ten, loc = () => true] of NHOM) {
    const tep = readdirSync(join(GOC, thuMuc)).filter(f => /\.(m?js|jsx)$/.test(f) && !laTest(f) && loc(f)).sort()
    out.push(`## ${thuMuc}/ — ${ten}`, '')
    for (const f of tep) {
      const ma = readFileSync(join(GOC, thuMuc, f), 'utf8')
      const ham = hamCuaTep(ma)
      if (!ham.length) continue
      const moTa = moTaTep(ma.replace(/\r\n/g, '\n').split('\n'))
      out.push(`### ${f}${moTa ? ' — ' + moTa : ''}`, '')
      for (const h of ham) {
        tong++
        if (!h.moTa) thieu++
        const ky = h.hang ? `\`${h.ten}\` *(hằng)*` : `\`${h.ten}(${h.thamSo})\``
        out.push(`- ${ky} — ${h.moTa || '⚠ chưa có mô tả'}`)
      }
      out.push('')
    }
  }
  out.splice(6, 0, `Tổng: **${tong}** hàm / hằng · thiếu mô tả: **${thieu}**`, '')
  return out.join('\n')
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  writeFileSync(TEP_DANH_MUC, taoDanhMuc())
  console.log('Đã ghi', TEP_DANH_MUC)
}
