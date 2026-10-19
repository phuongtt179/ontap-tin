/* eslint-disable no-undef */
// Web Worker chạy Python ngay trong trình duyệt bằng Pyodide (CPython biên dịch sang WebAssembly).
// Chạy trong worker riêng → code lặp vô hạn không làm treo trang; bên gọi tự huỷ worker khi quá giờ.
// Tin nhắn: nhận { id, code, stdin } → trả { id, stdout, stderr }. Lúc tải xong báo { ready: true|false }.
importScripts('https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js')

let py = null
loadPyodide()
  .then(p => { py = p; postMessage({ ready: true }) })
  .catch(() => postMessage({ ready: false }))

// Chạy code như 1 file .py độc lập: stdin lấy từ dữ liệu test, stdout gom lại; input("...") vẫn in lời nhắc
// ra stdout giống chạy trên máy (Wandbox/Piston cũng vậy) để so kết quả nhất quán.
const RUNNER = `
import sys, io, traceback
_out = io.StringIO()
_old = (sys.stdout, sys.stdin)
sys.stdout, sys.stdin = _out, io.StringIO(__stdin)
_err = ''
try:
    exec(compile(__code, 'bai_lam.py', 'exec'), {'__name__': '__main__'})
except SystemExit:
    pass
except BaseException:
    _err = traceback.format_exc(limit=-1)
finally:
    sys.stdout, sys.stdin = _old
(_out.getvalue(), _err)
`

self.onmessage = e => {
  const { id, code, stdin } = e.data
  try {
    py.globals.set('__code', code)
    py.globals.set('__stdin', stdin || '')
    const res = py.runPython(RUNNER)
    const [stdout, stderr] = res.toJs()
    res.destroy()
    postMessage({ id, stdout, stderr })
  } catch (err) {
    postMessage({ id, stdout: '', stderr: String(err?.message || err) })
  }
}
