// KIỂM TRA TRÊN DỮ LIỆU THẬT (Neon) — lưu bài làm quiz / đề thi qua đúng các hàm src/data/baiLam.js mà QuizSession gọi khi nộp.
// Chạy: npm run test:quyen   (cần .env: HS_EMAIL / HS_MAT_KHAU = học sinh thử, NEON_DATABASE_URL)
// An toàn: lượt luyện tập thử có answers.kiem_thu = KIEM_THU_BAI_LAM; bài thi thử có attempt_number 9999 — đều xoá ở cuối bằng tài khoản chủ.
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'
import pg from 'pg'

const env = Object.fromEntries(readFileSync('.env', 'utf8').split(/\r?\n/)
  .map(l => l.match(/^\s*([A-Z_]+)\s*=\s*['"]?([^'"\s]*)/)).filter(Boolean).map(m => [m[1], m[2]]))
const DAU = 'KIEM_THU_BAI_LAM'
const LUOT_THU = 9999
const coDu = !!(env.HS_EMAIL && env.HS_MAT_KHAU)

const ctx = { ai: null }
vi.mock('../../src/lib/supabase', () => ({ supabase: { from: (...a) => ctx.ai.from(...a), rpc: (...a) => ctx.ai.rpc(...a) } }))
import { nopBaiThi, luuLuotLuyenTap } from '../../src/data/baiLam'

let me, chu, phienCuaEm, phienNguoiKhac
const q = async (s, p) => (await chu.query(s, p)).rows

beforeAll(async () => {
  if (!coDu) return
  const auth = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: false } })
  const ten = env.HS_EMAIL
  const { data, error } = await auth.auth.signInWithPassword({ email: ten.includes('@') ? ten : `${ten}@school.local`, password: env.HS_MAT_KHAU })
  if (error) throw error
  me = data.user.id
  const token = data.session.access_token
  ctx.ai = createClient(env.NEON_DATA_URL, env.VITE_SUPABASE_ANON_KEY, { accessToken: async () => token })
  chu = new pg.Client({ connectionString: env.NEON_DATABASE_URL.replace('sslmode=require', 'sslmode=verify-full') })
  await chu.connect()
  const [de] = await q('select id from exams limit 1')
  // phiên thi "vừa bắt đầu" của em (như ExamsPage tạo lúc bấm Làm bài) + 1 phiên thử của học sinh khác
  ;[phienCuaEm] = await q(`insert into exam_sessions (exam_id, user_id, total, attempt_number) values ($1, $2, 3, $3) returning id`, [de.id, me, LUOT_THU])
  const [khac] = await q(`select id from profiles where role = 'student' and id <> $1 limit 1`, [me])
  ;[phienNguoiKhac] = await q(`insert into exam_sessions (exam_id, user_id, total, attempt_number) values ($1, $2, 3, $3) returning id`, [de.id, khac.id, LUOT_THU])
}, 30000)

afterAll(async () => {
  if (!chu) return
  await chu.query('delete from exam_sessions where attempt_number = $1', [LUOT_THU])
  await chu.query(`delete from quiz_sessions where answers->>'kiem_thu' = $1`, [DAU])
  await chu.end()
})

describe.skipIf(!coDu)('HỌC SINH nộp bài (qua src/data/baiLam.js)', () => {
  it('lưu lượt luyện tập', async () => {
    const cau = [{ id: null }, { id: null }]
    const { error } = await luuLuotLuyenTap({ userId: me, mode: 'practice', questions: cau, correct: 1, score: 5, answers: { 0: 'A', kiem_thu: DAU } })
    expect(error).toBeNull()
    const [dong] = await q(`select total, correct, score, answers from quiz_sessions where user_id = $1 and answers->>'kiem_thu' = $2`, [me, DAU])
    expect(dong).toMatchObject({ total: 2, correct: 1, answers: { 0: 'A', kiem_thu: DAU } })
    expect(Number(dong.score)).toBe(5)
  })
  it('không lưu được lượt luyện tập đứng tên người khác', async () => {
    const [khac] = await q(`select id from profiles where role = 'student' and id <> $1 limit 1`, [me])
    const { error } = await luuLuotLuyenTap({ userId: khac.id, mode: 'practice', questions: [], correct: 0, score: 0, answers: { kiem_thu: DAU } })
    expect(error?.code).toBe('42501')
  })
  it('nộp đề thi: ghi đáp án + giờ nộp vào đúng phiên đã bắt đầu', async () => {
    const { error } = await nopBaiThi(phienCuaEm.id, { correct: 2, score: 6.7, answers: { 0: 'A', 1: 'Đúng' } })
    expect(error).toBeNull()
    const [p] = await q('select correct, score, answers, submitted_at from exam_sessions where id = $1', [phienCuaEm.id])
    expect(p.correct).toBe(2)
    expect(p.answers).toEqual({ 0: 'A', 1: 'Đúng' })
    expect(p.submitted_at).not.toBeNull()
  })
  it('không nộp được vào phiên thi của học sinh khác', async () => {
    await nopBaiThi(phienNguoiKhac.id, { correct: 3, score: 10, answers: { 0: 'X' } })
    const [p] = await q('select correct, answers, submitted_at from exam_sessions where id = $1', [phienNguoiKhac.id])
    expect(p).toEqual({ correct: null, answers: null, submitted_at: null })
  })
})
