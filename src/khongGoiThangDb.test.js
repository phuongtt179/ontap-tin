// Giữ quy tắc tầng (CLAUDE.md "Cấu trúc mã"): CHỈ src/data/ được đọc ghi cơ sở dữ liệu (supabase.from / supabase.rpc).
// Trang, thành phần, hook, utils phải gọi hàm có tên trong src/data/. Đăng nhập (supabase.auth) không tính — đó là tầng xác thực.
// Viết thêm chỗ gọi thẳng → kiểm tra này đỏ, kèm tên tệp + dòng.
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'fs'
import { join, relative } from 'path'

function moiTep(thuMuc) {
  return readdirSync(thuMuc).flatMap(ten => {
    const p = join(thuMuc, ten)
    return statSync(p).isDirectory() ? moiTep(p) : [p]
  })
}

describe('chỉ src/data/ gọi cơ sở dữ liệu', () => {
  it('không trang / thành phần / hook nào gọi thẳng supabase.from / supabase.rpc', () => {
    const vi_pham = []
    for (const p of moiTep('src')) {
      const r = relative('src', p).replace(/\\/g, '/')
      if (!/\.(js|jsx)$/.test(r) || /\.test\.jsx?$/.test(r) || r.startsWith('data/') || r.startsWith('lib/')) continue
      const dong = readFileSync(p, 'utf8').split('\n')
      dong.forEach((l, i) => {
        // gọi trên 1 dòng (supabase.from(...)) hoặc xuống dòng (supabase\n  .from(...))
        if (/\bsupabase\s*\.\s*(from|rpc)\s*\(/.test(l) || (/\bsupabase\s*$/.test(l) && /^\s*\.(from|rpc)\s*\(/.test(dong[i + 1] || ''))) {
          vi_pham.push(`${r}:${i + 1}`)
        }
      })
    }
    expect(vi_pham).toEqual([])
  })
})
