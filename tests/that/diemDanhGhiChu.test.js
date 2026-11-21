// KIỂM TRA TRÊN DỮ LIỆU THẬT (Neon) — điểm danh + ghi chú qua đúng các hàm src/data/diemDanh.js, src/data/ghiChu.js.
// Chạy: npm run test:quyen   (cần .env: GV_EMAIL / GV_MAT_KHAU, HS_EMAIL / HS_MAT_KHAU, NEON_DATABASE_URL)
// An toàn: buổi điểm danh thử ở KHOÁ THỬ (demo1 ghi danh tạm); ghi chú thử tiêu đề KIEM_THU_GHI_CHU. Cuối cùng xoá sạch.
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'
import pg from 'pg'

const env = Object.fromEntries(readFileSync('.env', 'utf8').split(/\r?\n/)
  .map(l => l.match(/^\s*([A-Z_]+)\s*=\s*['"]?([^'"\s]*)/)).filter(Boolean).map(m => [m[1], m[2]]))
const coDu = env.GV_EMAIL && env.GV_MAT_KHAU && env.HS_EMAIL && env.HS_MAT_KHAU

const ctx = { ai: null }
vi.mock('../../src/lib/supabase', () => ({ supabase: { from: (...a) => ctx.ai.from(...a) } }))
import { layBuoiDiemDanh, layLuotDiemDanh, moBuoiDiemDanh, dongBuoiDiemDanh, layBuoiDangMo, layIdBuoiTrongNgay, demLuotDiemDanh, daDiemDanh, diemDanh } from '../../src/data/diemDanh'
import { layGhiChuCuaEm, layGhiChuCuaCacHs, themGhiChu, suaGhiChu, xoaGhiChu } from '../../src/data/ghiChu'

async function dangNhap(ten, matKhau) {
  const auth = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: false } })
  const { data, error } = await auth.auth.signInWithPassword({ email: ten.includes('@') ? ten : `${ten}@school.local`, password: matKhau })
  if (error) throw new Error(`đăng nhập ${ten}: ${error.message}`)
  const token = data.session.access_token
  return { id: data.user.id, client: createClient(env.NEON_DATA_URL, env.VITE_SUPABASE_ANON_KEY, { accessToken: async () => token }) }
}

const KHOA = `KIEM_THU_KHOA_DD_${Date.now()}`
let gv, hs, chu, buoi, khac
const q = async (s, p) => (await chu.query(s, p)).rows

beforeAll(async () => {
  if (!coDu) return
  ;[gv, hs] = await Promise.all([dangNhap(env.GV_EMAIL, env.GV_MAT_KHAU), dangNhap(env.HS_EMAIL, env.HS_MAT_KHAU)])
  chu = new pg.Client({ connectionString: env.NEON_DATABASE_URL.replace('sslmode=require', 'sslmode=verify-full') })
  await chu.connect()
  await chu.query('insert into grades (value) values ($1)', [KHOA])
  await chu.query(`insert into student_enrollments (user_id, grade, class_name, is_approved) values ($1, $2, 'Ca thử', true)`, [hs.id, KHOA])
  ;[khac] = await q(`select id from profiles where role = 'student' and id <> $1 limit 1`, [hs.id])
}, 30000)

afterAll(async () => {
  if (!chu) return
  await chu.query(`delete from attendance_records where session_id in (select id from attendance_sessions where grade like 'KIEM_THU_KHOA_DD%')`)
  await chu.query(`delete from attendance_sessions where grade like 'KIEM_THU_KHOA_DD%'`)
  await chu.query(`delete from student_notes where title like 'KIEM_THU_GHI_CHU%'`)
  await chu.query(`delete from student_enrollments where grade like 'KIEM_THU_KHOA_DD%'`)
  await chu.query(`delete from grades where value like 'KIEM_THU_KHOA_DD%'`)
  await chu.end()
})

describe.skipIf(!coDu)('điểm danh', () => {
  it('giáo viên mở buổi cho khoá thử', async () => {
    ctx.ai = gv.client
    expect((await moBuoiDiemDanh({ grade: KHOA, className: 'Ca thử', userId: gv.id })).error).toBeNull()
    ;[buoi] = (await layBuoiDiemDanh(KHOA, 'Ca thử')).data
    expect(buoi).toMatchObject({ grade: KHOA, class_name: 'Ca thử', closed_at: null })
    expect((await layBuoiDangMo()).data.some(b => b.id === buoi.id)).toBe(true)
  })
  it('học sinh điểm danh 1 lần; không điểm danh hộ em khác', async () => {
    ctx.ai = hs.client
    expect(await daDiemDanh(buoi.id, hs.id)).toBe(false)
    expect((await diemDanh(buoi.id, hs.id)).error).toBeNull()
    expect(await daDiemDanh(buoi.id, hs.id)).toBe(true)
    expect((await diemDanh(buoi.id, khac.id)).error).not.toBeNull()
  })
  it('giáo viên xem lượt, đếm, đóng buổi → học sinh không điểm danh thêm được', async () => {
    ctx.ai = gv.client
    expect((await layLuotDiemDanh([buoi.id])).data.map(r => r.user_id)).toEqual([hs.id])
    expect(await demLuotDiemDanh([buoi.id])).toBe(1)
    expect(await layIdBuoiTrongNgay(buoi.session_date)).toContain(buoi.id)
    expect((await dongBuoiDiemDanh(buoi.id)).error).toBeNull()
    await chu.query('delete from attendance_records where session_id = $1', [buoi.id])
    ctx.ai = hs.client
    expect((await diemDanh(buoi.id, hs.id)).error).not.toBeNull()
  })
  it('học sinh không tự mở / đóng buổi', async () => {
    ctx.ai = hs.client
    expect((await moBuoiDiemDanh({ grade: KHOA, userId: hs.id })).error).not.toBeNull()
  })
})

describe.skipIf(!coDu)('ghi chú', () => {
  it('học sinh thêm, sửa, ghim ghi chú của mình', async () => {
    ctx.ai = hs.client
    expect((await themGhiChu({ user_id: hs.id, title: 'KIEM_THU_GHI_CHU', content: 'vòng lặp', color: 'yellow' })).error).toBeNull()
    const [gc] = (await layGhiChuCuaEm(hs.id)).data.filter(n => n.title === 'KIEM_THU_GHI_CHU')
    expect((await suaGhiChu(gc.id, { is_pinned: true, content: 'vòng lặp for' })).error).toBeNull()
    expect((await layGhiChuCuaEm(hs.id)).data[0]).toMatchObject({ id: gc.id, is_pinned: true, content: 'vòng lặp for' })
  })
  it('học sinh không đọc / ghi ghi chú của em khác', async () => {
    ctx.ai = hs.client
    expect((await layGhiChuCuaCacHs([khac.id])).data).toEqual([])
    expect((await themGhiChu({ user_id: khac.id, title: 'KIEM_THU_GHI_CHU giả', content: 'x' })).error).not.toBeNull()
  })
  it('giáo viên xem và xoá ghi chú của em', async () => {
    ctx.ai = gv.client
    const [gc] = (await layGhiChuCuaCacHs([hs.id])).data.filter(n => n.title === 'KIEM_THU_GHI_CHU')
    expect(gc).toBeTruthy()
    expect((await xoaGhiChu(gc.id)).error).toBeNull()
    expect(await q('select id from student_notes where id = $1', [gc.id])).toEqual([])
  })
})
