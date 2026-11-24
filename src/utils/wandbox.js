// Chạy Python trên Wandbox (dịch vụ ngoài) — dùng chung cho máy chấm đề thi (api/thi-python.js) và chấm bài thực hành
// khi không có Pyodide (utils/gradePrep.js, cả máy chủ api/grade-pending).
// Wandbox thỉnh thoảng XOÁ phiên bản cũ (11/2026 xoá cpython-3.12.7 → mọi lần chạy báo "Unknown compiler", máy chấm hỏng):
// không ghi cứng 1 phiên bản; báo "Unknown compiler" thì tự chọn bản Python 3 mới nhất trong danh sách rồi chạy lại.
// Bị chặn vì gọi dồn (429) thì chờ 3 – 6 – 6 giây, thử lại tối đa 3 lần (máy chủ có 60 giây cho 1 lần chấm).
const GOC = 'https://wandbox.org/api'
let trinhBienDich = 'cpython-3.12.16'

/** chọn trình biên dịch Python 3 từ danh sách của Wandbox: ưu tiên bản 3.12 mới nhất, không có thì bản 3.x mới nhất (bỏ bản "head") */
export function chonPython(ds) {
  const ban = (ds || [])
    .map(c => /^cpython-3\.(\d+)\.(\d+)$/.exec(c?.name || ''))
    .filter(Boolean)
    .map(m => ({ ten: m[0], phu: +m[1], va: +m[2] }))
  const lon = (a, b) => (b.phu - a.phu) || (b.va - a.va)
  const ban312 = ban.filter(b => b.phu === 12).sort(lon)
  return (ban312[0] || ban.sort(lon)[0])?.ten || null
}

/** chạy 1 lần trên Wandbox, body = { code, stdin? } → kết quả JSON của Wandbox; lỗi mạng / dịch vụ → ném lỗi */
export async function chayWandbox(body, { timeout = 20000 } = {}) {
  let doiTen = false
  for (let lan = 0; lan < 4; lan++) {
    const res = await fetch(`${GOC}/compile.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, compiler: trinhBienDich }),
      signal: AbortSignal.timeout(timeout),
    })
    const chu = await res.text()
    if (res.ok) return JSON.parse(chu)
    if (!doiTen && /unknown compiler/i.test(chu)) {
      doiTen = true
      const ds = await (await fetch(`${GOC}/list.json`, { signal: AbortSignal.timeout(10000) })).json()
      const moi = chonPython(ds)
      if (!moi || moi === trinhBienDich) break
      trinhBienDich = moi
      continue
    }
    // Wandbox chặn khi gọi dồn (~10 lần / 30 giây): chờ 3 rồi 6 giây, thử lại (cả lớp nộp cùng lúc trong giờ thi)
    if (res.status === 429 && lan < 3) {
      await new Promise(r => setTimeout(r, 3000 * 2 ** Math.min(lan, 1)))
      continue
    }
    break
  }
  throw new Error('wandbox_loi')
}
