// Quy tắc cây nội dung (chủ đề → đơn vị → tiêu đề nhỏ) của giáo viên. Hàm thuần.

/**
 * Đọc danh sách tên dán vào (mỗi dòng 1 tên) → [{ name, isDup (đã có), isRepeat (lặp trong chính danh sách) }].
 * So trùng không phân biệt hoa thường.
 */
export function docDanhSachTen(text, tenDaCo = []) {
  const daCo = new Set(tenDaCo.map(t => t.toLowerCase()))
  const daGap = new Set()
  return text.split('\n').map(l => l.trim()).filter(Boolean).map(name => {
    const thuong = name.toLowerCase()
    const dong = { name, isDup: daCo.has(thuong), isRepeat: daGap.has(thuong) }
    daGap.add(thuong)
    return dong
  })
}

/** các dòng sẽ thêm (không trùng) */
export const dongSeThem = ds => (ds || []).filter(r => !r.isDup && !r.isRepeat)

/** đổi chỗ phần tử idx với phần tử kế bên (dir = -1 lên, 1 xuống) → mảng mới; ra ngoài mép → null */
export function doiCho(ds, idx, dir) {
  const j = idx + dir
  if (j < 0 || j >= ds.length) return null
  const moi = [...ds]
  ;[moi[idx], moi[j]] = [moi[j], moi[idx]]
  return moi
}
