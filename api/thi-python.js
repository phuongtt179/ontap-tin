// Chấm phần thực hành PYTHON của đề thi bằng test (giống hệ thống chấm thi Tin học: nộp là biết điểm).
// • Test (input + output mong đợi) nằm ở bảng exam_tests — học sinh không đọc được. Máy chủ đọc bằng tài khoản
//   riêng cham_thi (CHAM_THI_DATABASE_URL), chỉ có quyền đọc đề / test và ghi lần nộp + điểm thực hành.
// • Chỉ gửi CODE + INPUT sang Wandbox để chạy; OUTPUT MONG ĐỢI giữ ở đây để so → chương trình không đọc được đáp án.
// • Mỗi test tối đa 2 giây. Mỗi bài thi tối đa 10 lần nộp, tính lần cao nhất. Học sinh chỉ thấy đúng / sai / lỗi /
//   quá giờ của từng test, không thấy input, output.
import pg from 'pg'
import { requireUser } from './_auth.js'

export const config = { maxDuration: 60 }

const TOI_DA_LAN = 10
const GIAY_MOI_TEST = 2
const COMPILER = 'cpython-3.12.7'
const GIA_HAN_PHUT = 2   // nộp trễ tối đa 2 phút sau khi hết giờ (mạng chậm)

let pool
const db = () => (pool ||= new pg.Pool({ connectionString: process.env.CHAM_THI_DATABASE_URL, max: 1 }))

// Chạy tất cả test trong 1 lần gọi Wandbox: mỗi test là 1 tiến trình con, tối đa 2 giây, chạy song song 4 test
function chuongTrinhChay(code, inputs) {
  const b64 = s => Buffer.from(s, 'utf8').toString('base64')
  return `import subprocess, sys, json, base64
from concurrent.futures import ThreadPoolExecutor
CODE = base64.b64decode("${b64(code)}").decode("utf-8")
INPUTS = [base64.b64decode(x).decode("utf-8") for x in ${JSON.stringify(inputs.map(b64))}]
def chay(inp):
    try:
        r = subprocess.run([sys.executable, "-c", CODE], input=inp, capture_output=True, text=True, timeout=${GIAY_MOI_TEST})
        return {"rc": r.returncode, "out": r.stdout[:20000]}
    except subprocess.TimeoutExpired:
        return {"tle": True}
    except Exception:
        return {"rc": -1, "out": ""}
with ThreadPoolExecutor(max_workers=4) as ex:
    kq = list(ex.map(chay, INPUTS))
print("@@KQ@@" + json.dumps(kq))
`
}

// So kết quả: bỏ khoảng trắng cuối mỗi dòng và dòng trống cuối bài (giống cách chấm thông thường)
const chuan = s => String(s ?? '').replace(/\r\n/g, '\n').split('\n').map(l => l.replace(/\s+$/, '')).join('\n').replace(/\n+$/, '')

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const user = await requireUser(req, res)
  if (!user) return
  if (!process.env.CHAM_THI_DATABASE_URL) return res.status(500).json({ error: 'chua_cau_hinh' })

  const { session_id, code } = req.body || {}
  const ma = String(code ?? '')
  if (!session_id || !ma.trim()) return res.status(400).json({ error: 'thieu_bai' })
  if (ma.length > 20000) return res.status(400).json({ error: 'bai_qua_dai' })

  const c = await db().connect()
  let lan = null
  try {
    // Giữ chỗ 1 lượt (khoá dòng để 2 lần bấm cùng lúc không vượt 10 lần)
    await c.query('begin')
    const { rows: [bt] } = await c.query(
      `select s.id, s.user_id, s.submitted_at, s.started_at, s.practical_lan, e.practical_type, e.time_limit, e.id exam_id
       from public.exam_sessions s join public.exams e on e.id = s.exam_id where s.id = $1 for update of s`, [session_id])
    if (!bt || bt.user_id !== user.id) { await c.query('rollback'); return res.status(403).json({ error: 'forbidden' }) }
    if (bt.practical_type !== 'python') { await c.query('rollback'); return res.status(400).json({ error: 'khong_phai_de_python' }) }
    if (bt.submitted_at) { await c.query('rollback'); return res.status(400).json({ error: 'da_nop_bai' }) }
    if (bt.time_limit && bt.started_at && Date.now() > new Date(bt.started_at).getTime() + (bt.time_limit + GIA_HAN_PHUT) * 60000) {
      await c.query('rollback'); return res.status(400).json({ error: 'het_gio' })
    }
    if (bt.practical_lan >= TOI_DA_LAN) { await c.query('rollback'); return res.status(429).json({ error: 'het_luot' }) }
    lan = bt.practical_lan + 1
    await c.query('update public.exam_sessions set practical_lan = $2 where id = $1', [session_id, lan])
    await c.query('commit')

    const { rows: tests } = await c.query(
      'select input, expected, diem from public.exam_tests where exam_id = $1 order by thu_tu, id', [bt.exam_id])
    if (!tests.length) throw Object.assign(new Error('de_chua_co_test'), { maLoi: 'de_chua_co_test' })

    let ketQuaChay
    try {
      const r = await fetch('https://wandbox.org/api/compile.json', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ compiler: COMPILER, code: chuongTrinhChay(ma, tests.map(t => t.input)) }),
        signal: AbortSignal.timeout(45000),
      })
      const j = await r.json()
      const dong = String(j.program_output || '').split('\n').find(l => l.startsWith('@@KQ@@'))
      ketQuaChay = dong ? JSON.parse(dong.slice(6)) : null
    } catch { ketQuaChay = null }
    if (!Array.isArray(ketQuaChay) || ketQuaChay.length !== tests.length) throw Object.assign(new Error('may_cham_loi'), { maLoi: 'may_cham_loi' })

    const tong = tests.reduce((x, t) => x + Number(t.diem), 0)
    let duoc = 0
    const ket_qua = tests.map((t, i) => {
      const k = ketQuaChay[i]
      const trang_thai = k.tle ? 'qua_gio' : k.rc !== 0 ? 'loi' : chuan(k.out) === chuan(t.expected) ? 'dung' : 'sai'
      if (trang_thai === 'dung') duoc += Number(t.diem)
      return { stt: i + 1, trang_thai }
    })
    const diem = Math.round((duoc / tong) * 10 * 100) / 100   // thang 10

    await c.query('begin')
    await c.query('insert into public.exam_nop_python (session_id, user_id, lan, code, ket_qua, diem) values ($1, $2, $3, $4, $5, $6)',
      [session_id, user.id, lan, ma, JSON.stringify(ket_qua), diem])
    const { rows: [moi] } = await c.query(
      'update public.exam_sessions set practical_score = greatest(coalesce(practical_score, 0), $2) where id = $1 returning practical_score',
      [session_id, diem])
    await c.query('commit')
    return res.status(200).json({ lan, con_lai: TOI_DA_LAN - lan, ket_qua, diem, diem_cao_nhat: Number(moi.practical_score) })
  } catch (e) {
    await c.query('rollback').catch(() => {})
    // Máy chấm lỗi → trả lại lượt cho học sinh
    if (lan != null) await c.query('update public.exam_sessions set practical_lan = greatest(practical_lan - 1, 0) where id = $1', [session_id]).catch(() => {})
    const maLoi = e.maLoi || 'loi_may_chu'
    return res.status(maLoi === 'may_cham_loi' ? 503 : 500).json({ error: maLoi })
  } finally {
    c.release()
  }
}
