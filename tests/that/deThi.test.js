// KIỂM TRA TRÊN DỮ LIỆU THẬT (Neon) — đề thi + lượt thi qua đúng các hàm src/data/deThi.js + src/data/baiLam.js.
// Chạy: npm run test:quyen   (cần .env: GV_EMAIL / GV_MAT_KHAU, HS_EMAIL / HS_MAT_KHAU, NEON_DATABASE_URL)
// An toàn: đề thử nằm trong KHOÁ THỬ KIEM_THU_KHOA_DE_<giờ>; demo1 được ghi danh tạm vào khoá đó → không học sinh thật nào
// thấy đề thử. Cuối cùng tài khoản chủ xoá đề, lượt thi, test, ghi danh tạm, khoá thử.
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'
import pg from 'pg'

const env = Object.fromEntries(readFileSync('.env', 'utf8').split(/\r?\n/)
  .map(l => l.match(/^\s*([A-Z_]+)\s*=\s*['"]?([^'"\s]*)/)).filter(Boolean).map(m => [m[1], m[2]]))
const coDu = env.GV_EMAIL && env.GV_MAT_KHAU && env.HS_EMAIL && env.HS_MAT_KHAU

const ctx = { ai: null }
vi.mock('../../src/lib/supabase', () => ({ supabase: { from: (...a) => ctx.ai.from(...a) } }))
import { luuDeThi, layDeThi, layTatCaDeThi, layDeThiChoEm, layDeThiCuaKhoa, datMoDeThi, layTestPython, ghiTestPython, xoaDeThi, layTenDeThi } from '../../src/data/deThi'
import { batDauLuotThi, nopBaiThi, demLuotThiCuaEm, layLuotThiCuaDe, layLuotThiCuaCacDe, suaLuotThi, xoaLuotThi, layLuotThiCuaEm, layDiemThiCuaEm, nopTepThucHanh, layTepThucHanh } from '../../src/data/baiLam'
import { duLieuDeThi, diemTongLuot } from '../../src/domain/deThi'

async function dangNhap(ten, matKhau) {
  const auth = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: false } })
  const { data, error } = await auth.auth.signInWithPassword({ email: ten.includes('@') ? ten : `${ten}@school.local`, password: matKhau })
  if (error) throw new Error(`đăng nhập ${ten}: ${error.message}`)
  const token = data.session.access_token
  return { id: data.user.id, client: createClient(env.NEON_DATA_URL, env.VITE_SUPABASE_ANON_KEY, { accessToken: async () => token }) }
}

const KHOA = `KIEM_THU_KHOA_DE_${Date.now()}`
let gv, hs, chu, deId, luotId
const q = async (s, p) => (await chu.query(s, p)).rows

beforeAll(async () => {
  if (!coDu) return
  ;[gv, hs] = await Promise.all([dangNhap(env.GV_EMAIL, env.GV_MAT_KHAU), dangNhap(env.HS_EMAIL, env.HS_MAT_KHAU)])
  chu = new pg.Client({ connectionString: env.NEON_DATABASE_URL.replace('sslmode=require', 'sslmode=verify-full') })
  await chu.connect()
  await chu.query('insert into grades (value) values ($1)', [KHOA])
  await chu.query(`insert into student_enrollments (user_id, grade, class_name, is_approved) values ($1, $2, 'Ca thử', true)`, [hs.id, KHOA])
}, 30000)

afterAll(async () => {
  if (!chu) return
  await chu.query(`delete from exam_sessions where exam_id in (select id from exams where grade like 'KIEM_THU_KHOA_DE%')`)
  await chu.query(`delete from exam_tests where exam_id in (select id from exams where grade like 'KIEM_THU_KHOA_DE%')`)
  await chu.query(`delete from exams where grade like 'KIEM_THU_KHOA_DE%'`)
  await chu.query(`delete from student_enrollments where grade like 'KIEM_THU_KHOA_DE%'`)
  await chu.query(`delete from grades where value like 'KIEM_THU_KHOA_DE%'`)
  await chu.end()
})

const FORM = {
  title: 'KIEM_THU_DE', grade: KHOA, class_names: [], time_limit: 15, max_attempts: 2, is_active: false, show_answer: true, show_score: true,
  question_ids: [], has_practical: true, practical_type: 'python', practical_instructions: 'In tổng', theory_weight: 60, practical_weight: 40, practical_rubric: 'BÍ MẬT',
}

describe.skipIf(!coDu)('đề thi + lượt thi (qua src/data/)', () => {
  it('giáo viên tạo đề Python (đang tắt) + test chấm', async () => {
    ctx.ai = gv.client
    const { data, error } = await luuDeThi(null, { ...duLieuDeThi(FORM), created_by: gv.id })
    expect(error).toBeNull()
    deId = data.id
    expect((await ghiTestPython(deId, [{ input: '1\n2', expected: '3', diem: 2 }, { input: '', expected: 'x', diem: '' }])).error).toBeNull()
    expect((await layTestPython(deId)).data).toEqual([{ input: '1\n2', expected: '3', diem: 2 }, { input: '', expected: 'x', diem: 1 }])
    expect((await layTatCaDeThi()).data.map(d => d.id)).toContain(deId)
    expect((await layDeThiCuaKhoa(KHOA)).data).toHaveLength(1)
    expect(await layTenDeThi([deId])).toEqual({ [deId]: 'KIEM_THU_DE' })
  })
  it('học sinh: đề đang tắt không thấy; không đọc được test chấm', async () => {
    ctx.ai = hs.client
    expect((await layDeThiChoEm(KHOA, 'Ca thử')).data).toEqual([])
    expect((await layTestPython(deId)).data).toEqual([])
  })
  it('giáo viên mở đề cho lớp khác → em không thấy; mở cho cả khoá → em thấy, không kèm tiêu chí chấm', async () => {
    ctx.ai = gv.client
    expect((await luuDeThi(deId, { class_names: ['Ca khác'], is_active: true })).error).toBeNull()
    ctx.ai = hs.client
    expect((await layDeThiChoEm(KHOA, 'Ca thử')).data).toEqual([])
    ctx.ai = gv.client
    expect((await luuDeThi(deId, { class_names: null })).error).toBeNull()
    ctx.ai = hs.client
    const [de] = (await layDeThiChoEm(KHOA, 'Ca thử')).data
    expect(de.id).toBe(deId)
    expect(de).not.toHaveProperty('practical_rubric')
  })
  it('học sinh bắt đầu → nộp tệp thực hành → nộp bài; đếm lượt; xem lịch sử', async () => {
    ctx.ai = hs.client
    const { data: luot, error } = await batDauLuotThi({ examId: deId, userId: hs.id, total: 0, attemptNumber: 1 })
    expect(error).toBeNull()
    luotId = luot.id
    expect((await nopTepThucHanh(luotId, 'https://x.test/bai.py', 'bai.py')).error).toBeNull()
    expect(await layTepThucHanh(luotId)).toBe('bai.py')
    expect((await nopBaiThi(luotId, { correct: 0, score: 0, answers: {}, practical_content: null })).error).toBeNull()
    expect(await demLuotThiCuaEm(hs.id, [deId])).toEqual({ [deId]: 1 })
    expect((await layLuotThiCuaEm(hs.id)).data.map(l => l.id)).toContain(luotId)
  })
  it('học sinh KHÔNG tự chấm điểm thực hành, không bắt đầu lượt đứng tên người khác', async () => {
    ctx.ai = hs.client
    await suaLuotThi(luotId, { practical_score: 10, practical_comment: 'tự khen' })   // bị chặn (lỗi) hoặc bị lọc (0 dòng) — kiểm tra DB
    expect((await q('select practical_score, practical_comment from exam_sessions where id = $1', [luotId]))[0]).toEqual({ practical_score: null, practical_comment: null })
    expect((await batDauLuotThi({ examId: deId, userId: gv.id, total: 0, attemptNumber: 1 })).error).not.toBeNull()
  })
  it('giáo viên xem lượt, chấm thực hành → điểm tổng theo hệ số; báo cáo thành tích thấy điểm', async () => {
    ctx.ai = gv.client
    const [luot] = (await layLuotThiCuaDe(deId)).data
    expect(luot.id).toBe(luotId)
    expect((await layLuotThiCuaCacDe([deId])).data).toHaveLength(1)
    expect((await suaLuotThi(luotId, { practical_score: 8, practical_comment: 'Tốt', practical_reviewed_at: new Date().toISOString() })).error).toBeNull()
    const [de] = [(await layDeThi(deId)).data]
    const [sau] = (await layLuotThiCuaDe(deId)).data
    expect(diemTongLuot(de, sau)).toBe(8)   // đề chỉ có thực hành → 100% thực hành
    expect((await layDiemThiCuaEm(hs.id)).data.some(d => d.exams?.title === 'KIEM_THU_DE')).toBe(true)
  })
  it('giáo viên tắt đề, xoá lượt, xoá đề', async () => {
    ctx.ai = gv.client
    expect((await datMoDeThi(deId, false)).error).toBeNull()
    expect((await xoaLuotThi(luotId)).error).toBeNull()
    expect((await xoaDeThi(deId)).error).toBeNull()
    expect((await q('select count(*)::int n from exams where id = $1', [deId]))[0].n).toBe(0)
  })
})
