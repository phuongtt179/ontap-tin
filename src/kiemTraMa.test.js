// Kiểm tra mã tĩnh mà eslint của dự án KHÔNG bắt và `vite build` cũng không bắt:
// dùng thành phần <Ten /> mà quên import → chỉ lộ ra khi học sinh mở đúng màn hình đó (trắng trang).
// Hay gặp khi tách trang lớn thành nhiều tệp (bước 4).
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

function cacTep(thuMuc) {
  return readdirSync(thuMuc).flatMap(t => {
    const p = join(thuMuc, t)
    return statSync(p).isDirectory() ? cacTep(p) : /\.jsx$/.test(t) ? [p] : []
  })
}

/** tên viết hoa đã có trong tệp: import, khai báo, tham số / phá cấu trúc */
function tenDaCo(ma) {
  const co = new Set()
  for (const m of ma.matchAll(/^import\s+([\s\S]*?)\s+from\s/gm)) {
    for (const w of m[1].split(/[{},\s]+/)) if (w && w !== 'as' && w !== '*') co.add(w)
  }
  for (const m of ma.matchAll(/(?:function|const|let|var|class)\s+([A-Za-z_$][\w$]*)/g)) co.add(m[1])
  for (const m of ma.matchAll(/[[{(,]\s*([A-Z][\w$]*)\s*(?=[,}\])=:])/g)) co.add(m[1])
  for (const m of ma.matchAll(/:\s*([A-Z][\w$]*)\s*[,}]/g)) co.add(m[1])   // { icon: Icon }
  return co
}

describe('mọi thành phần <Ten /> dùng trong giao diện đều đã import / khai báo', () => {
  it.each(cacTep('src'))('%s', p => {
    const ma = readFileSync(p, 'utf8').replace(/(^|[\s{])\/\*[\s\S]*?\*\//g, '$1').replace(/(^|\s)\/\/.*$/gm, '$1')   // ghi chú (không đụng 'audio/*', 'https://')
    const co = tenDaCo(ma)
    const thieu = [...new Set([...ma.matchAll(/<([A-Z][\w$]*)[\s/>]/g)].map(m => m[1]))].filter(t => !co.has(t))
    expect(thieu).toEqual([])
  })
})
