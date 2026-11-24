// Chấm phần thực hành PYTHON của đề thi bằng test (giống hệ thống chấm thi Tin học: nộp là biết điểm).
// • Test (input + output mong đợi) nằm ở bảng exam_tests — học sinh không đọc được. Máy chủ đọc bằng tài khoản
//   riêng cham_thi (CHAM_THI_DATABASE_URL), chỉ có quyền đọc đề / test và ghi lần nộp + điểm thực hành.
// • Chỉ gửi CODE + INPUT sang Wandbox để chạy; OUTPUT MONG ĐỢI giữ ở đây để so → chương trình không đọc được đáp án.
// • Kỳ thi nhiều bài (exam_bai): gửi kèm bai_id; test riêng từng bài (bài liên kết ngân hàng: bai_luyen_test), 10 lần nộp riêng.
// • Luyện bài lẻ (ngân hàng bai_luyen): gửi luyen_bai_id thay session_id; không giới hạn lần, cách nhau ≥ 10 giây.
// • Mỗi test tối đa 2 giây. Mỗi bài thi tối đa 10 lần nộp, tính lần cao nhất. Học sinh chỉ thấy đúng / sai / lỗi /
//   quá giờ của từng test, không thấy input, output.
import pg from 'pg'
import { requireUser } from './_auth.js'
import { chayWandbox } from '../src/utils/wandbox.js'
import { TOI_DA_LAN, GIAY_MOI_TEST, DO_DAI_TOI_DA, chamLanNop, loiKhongDuocNop, diemKyThi, loiKhongDuocLuyen } from '../src/domain/chamPython.js'

export const config = { maxDuration: 60 }


let pool
const db = () => (pool ||= new pg.Pool({ connectionString: process.env.CHAM_THI_DATABASE_URL, max: 1 }))

// Chạy tất cả test trong 1 lần gọi Wandbox: mỗi test là 1 tiến trình con, tối đa 2 giây, chạy song song 4 test
export function chuongTrinhChay(code, inputs) {
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

// Chạy code với các test trên Wandbox rồi chấm → { ket_qua, diem }. Đề chưa có test / máy chấm lỗi → ném lỗi có maLoi
async function chayVaCham(ma, tests) {
  if (!tests.length) throw Object.assign(new Error('de_chua_co_test'), { maLoi: 'de_chua_co_test' })
  let ketQuaChay
  try {
    const j = await chayWandbox({ code: chuongTrinhChay(ma, tests.map(t => t.input)) }, { timeout: 45000 })
    const dong = String(j.program_output || '').split('\n').find(l => l.startsWith('@@KQ@@'))
    ketQuaChay = dong ? JSON.parse(dong.slice(6)) : null
  } catch { ketQuaChay = null }
  if (!Array.isArray(ketQuaChay) || ketQuaChay.length !== tests.length) throw Object.assign(new Error('may_cham_loi'), { maLoi: 'may_cham_loi' })
  return chamLanNop(tests, ketQuaChay)
}

// Luyện bài lẻ từ ngân hàng (bai_luyen): không giới hạn lần, cách nhau ≥ 10 giây; chỉ bài mở cho khoá em đã được duyệt
async function chamLuyen(res, user, baiId, ma) {
  const c = await db().connect()
  try {
    const laGiaoVien = ['teacher', 'assistant'].includes(user.role)
    const { rows: [bai] } = await c.query('select id, ung_dung, cach_cham from public.bai_luyen where id = $1', [baiId])
    const { rows: [mo] } = await c.query(
      `select 1 from public.bai_luyen_mo m join public.student_enrollments e on e.grade = m.grade
       where m.bai_id = $1 and e.user_id = $2 and e.is_approved = true limit 1`, [baiId, user.id])
    const { rows: [cuoi] } = await c.query('select created_at from public.bai_luyen_nop where user_id = $1 order by created_at desc limit 1', [user.id])
    const loi = loiKhongDuocLuyen({ bai, duocMo: !!mo, laGiaoVien, lanCuoi: cuoi?.created_at })
    if (loi) return res.status(loi === 'forbidden' ? 403 : loi === 'cho_chut' ? 429 : 400).json({ error: loi })
    const { rows: tests } = await c.query('select input, expected, diem from public.bai_luyen_test where bai_id = $1 order by thu_tu, id', [baiId])
    const { ket_qua, diem } = await chayVaCham(ma, tests)
    await c.query('begin')
    await c.query('insert into public.bai_luyen_nop (bai_id, user_id, code, ket_qua, diem) values ($1, $2, $3, $4, $5)',
      [baiId, user.id, ma, JSON.stringify(ket_qua), diem])
    const { rows: [kq] } = await c.query(
      `insert into public.bai_luyen_ket_qua (bai_id, user_id, diem, so_lan) values ($1, $2, $3, 1)
       on conflict (bai_id, user_id) do update set diem = greatest(bai_luyen_ket_qua.diem, excluded.diem),
         so_lan = bai_luyen_ket_qua.so_lan + 1, cap_nhat = now()
       returning diem, so_lan`, [baiId, user.id, diem])
    await c.query('commit')
    return res.status(200).json({ ket_qua, diem, diem_cao_nhat: Number(kq.diem), so_lan: kq.so_lan })
  } catch (e) {
    await c.query('rollback').catch(() => {})
    if (!e.maLoi) console.error('thi-python luyen', e)
    const maLoi = e.maLoi || 'loi_may_chu'
    return res.status(maLoi === 'may_cham_loi' ? 503 : maLoi === 'de_chua_co_test' ? 400 : 500).json({ error: maLoi })
  } finally {
    c.release()
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const user = await requireUser(req, res)
  if (!user) return
  if (!process.env.CHAM_THI_DATABASE_URL) return res.status(500).json({ error: 'chua_cau_hinh' })

  // luyen_bai_id: luyện bài lẻ trong ngân hàng (không gắn với lượt thi)
  if (req.body?.luyen_bai_id) {
    const ma = String(req.body.code ?? '')
    if (!ma.trim()) return res.status(400).json({ error: 'thieu_bai' })
    if (ma.length > DO_DAI_TOI_DA) return res.status(400).json({ error: 'bai_qua_dai' })
    return chamLuyen(res, user, req.body.luyen_bai_id, ma)
  }

  // bai_id: kỳ thi nhiều bài (bảng exam_bai) — mỗi bài 10 lần nộp riêng, test riêng; không có = đề 1 bài kiểu cũ
  const { session_id, code, bai_id = null } = req.body || {}
  const ma = String(code ?? '')
  if (!session_id || !ma.trim()) return res.status(400).json({ error: 'thieu_bai' })
  if (ma.length > DO_DAI_TOI_DA) return res.status(400).json({ error: 'bai_qua_dai' })

  const c = await db().connect()
  let lan = null, examId = null, baiLuyenId = null
  const traLuot = bai_id
    ? () => c.query('update public.exam_bai_diem set lan = greatest(lan - 1, 0) where session_id = $1 and bai_id = $2', [session_id, bai_id])
    : () => c.query('update public.exam_sessions set practical_lan = greatest(practical_lan - 1, 0) where id = $1', [session_id])
  try {
    // Giữ chỗ 1 lượt (khoá dòng để 2 lần bấm cùng lúc không vượt 10 lần)
    await c.query('begin')
    const { rows: [bt] } = await c.query(
      `select s.id, s.user_id, s.submitted_at, s.started_at, s.practical_lan, e.practical_type, e.time_limit, e.id exam_id,
              exists (select 1 from public.exam_bai b where b.exam_id = e.id) nhieu_bai
       from public.exam_sessions s join public.exams e on e.id = s.exam_id where s.id = $1 for update of s`, [session_id])
    // kỳ thi nhiều bài bắt buộc gửi bài nào, và bài phải thuộc đúng kỳ thi của lượt này; đề 1 bài thì không được gửi bai_id
    if (bt && bt.nhieu_bai !== !!bai_id) { await c.query('rollback'); return res.status(400).json({ error: 'sai_bai' }) }
    if (bt && bai_id) {
      const { rows: [b] } = await c.query('select bai_luyen_id from public.exam_bai where id = $1 and exam_id = $2', [bai_id, bt.exam_id])
      if (!b) { await c.query('rollback'); return res.status(400).json({ error: 'sai_bai' }) }
      baiLuyenId = b.bai_luyen_id   // bài liên kết ngân hàng → test lấy từ ngân hàng
      await c.query(`insert into public.exam_bai_diem (session_id, bai_id, user_id) values ($1, $2, $3) on conflict do nothing`,
        [session_id, bai_id, bt.user_id])
      const { rows: [d] } = await c.query('select lan from public.exam_bai_diem where session_id = $1 and bai_id = $2 for update', [session_id, bai_id])
      bt.practical_lan = d.lan
    }
    const loi = loiKhongDuocNop(bt, user.id)
    if (loi) {
      await c.query('rollback')
      return res.status(loi === 'forbidden' ? 403 : loi === 'het_luot' ? 429 : 400).json({ error: loi })
    }
    lan = bt.practical_lan + 1
    examId = bt.exam_id
    if (bai_id) await c.query('update public.exam_bai_diem set lan = $3 where session_id = $1 and bai_id = $2', [session_id, bai_id, lan])
    else await c.query('update public.exam_sessions set practical_lan = $2 where id = $1', [session_id, lan])
    await c.query('commit')

    const { rows: tests } = baiLuyenId
      ? await c.query('select input, expected, diem from public.bai_luyen_test where bai_id = $1 order by thu_tu, id', [baiLuyenId])
      : bai_id
        ? await c.query('select input, expected, diem from public.exam_tests where bai_id = $1 order by thu_tu, id', [bai_id])
        : await c.query('select input, expected, diem from public.exam_tests where exam_id = $1 order by thu_tu, id', [bt.exam_id])
    const { ket_qua, diem } = await chayVaCham(ma, tests)   // thang 10

    await c.query('begin')
    await c.query('insert into public.exam_nop_python (session_id, user_id, lan, code, ket_qua, diem, bai_id) values ($1, $2, $3, $4, $5, $6, $7)',
      [session_id, user.id, lan, ma, JSON.stringify(ket_qua), diem, bai_id])
    let caoNhat, tong
    if (bai_id) {
      // điểm bài = lần cao nhất; điểm thực hành của lượt = trung bình có trọng số các bài (domain/chamPython.diemKyThi)
      const { rows: [d] } = await c.query(
        'update public.exam_bai_diem set diem = greatest(diem, $3) where session_id = $1 and bai_id = $2 returning diem', [session_id, bai_id, diem])
      caoNhat = Number(d.diem)
      const { rows: cacBai } = await c.query('select id, diem from public.exam_bai where exam_id = $1', [examId])
      const { rows: cacDiem } = await c.query('select bai_id, diem from public.exam_bai_diem where session_id = $1', [session_id])
      tong = diemKyThi(cacBai, Object.fromEntries(cacDiem.map(x => [x.bai_id, Number(x.diem)])))
      await c.query('update public.exam_sessions set practical_score = $2 where id = $1', [session_id, tong])
    } else {
      const { rows: [moi] } = await c.query(
        'update public.exam_sessions set practical_score = greatest(coalesce(practical_score, 0), $2) where id = $1 returning practical_score',
        [session_id, diem])
      caoNhat = tong = Number(moi.practical_score)
    }
    await c.query('commit')
    return res.status(200).json({ lan, con_lai: TOI_DA_LAN - lan, ket_qua, diem, diem_cao_nhat: caoNhat, diem_thuc_hanh: tong })
  } catch (e) {
    await c.query('rollback').catch(() => {})
    // Máy chấm lỗi → trả lại lượt cho học sinh
    if (lan != null) await traLuot().catch(() => {})
    if (!e.maLoi) console.error('thi-python', e)   // hiện trong log của Vercel
    const maLoi = e.maLoi || 'loi_may_chu'
    return res.status(maLoi === 'may_cham_loi' ? 503 : 500).json({ error: maLoi })
  } finally {
    c.release()
  }
}
