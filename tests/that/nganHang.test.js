// KIỂM TRA TRÊN DỮ LIỆU THẬT (Neon) — ngân hàng bài qua đúng các hàm src/data/nganHang.js (phòng thi giai đoạn 1).
// Chạy: npm run test:quyen (cần .env: GV_EMAIL / GV_MAT_KHAU, HS_EMAIL / HS_MAT_KHAU, NEON_DATABASE_URL).
// An toàn: bài thử tên KIEM_THU_BAI_<giờ>, mở cho KHOÁ THỬ riêng; demo1 ghi danh tạm vào khoá thử. Cuối cùng xoá hết.
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'
import pg from 'pg'

const env = Object.fromEntries(readFileSync('.env', 'utf8').split(/\r?\n/)
  .map(l => l.match(/^\s*([A-Z_]+)\s*=\s*['"]?([^'"\s]*)/)).filter(Boolean).map(m => [m[1], m[2]]))
const coDu = env.GV_EMAIL && env.GV_MAT_KHAU && env.HS_EMAIL && env.HS_MAT_KHAU

const ctx = { ai: null }
vi.mock('../../src/lib/supabase', () => ({ supabase: { from: (...a) => ctx.ai.from(...a) } }))
import { luuBaiDayDu, layBaiDayDu, layNganHang, layBaiChoKhoa, layDeBai, datMoChoKhoa, xoaBaiLuyen, layKetQuaCuaEm } from '../../src/data/nganHang'

async function dangNhap(ten, matKhau) {
  const auth = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: false } })
  const { data, error } = await auth.auth.signInWithPassword({ email: ten.includes('@') ? ten : `${ten}@school.local`, password: matKhau })
  if (error) throw new Error(`đăng nhập ${ten}: ${error.message}`)
  const token = data.session.access_token
  return { id: data.user.id, client: createClient(env.NEON_DATA_URL, env.VITE_SUPABASE_ANON_KEY, { accessToken: async () => token }) }
}

const GIO = Date.now()
const KHOA = `KIEM_THU_KHOA_NH_${GIO}`
const TEN = `KIEM_THU_BAI_${GIO}`
let gv, hs, chu, baiId
const BAI = { ung_dung: 'python', cach_cham: 'test', ten: TEN, de_bai: 'Nhập a, b. In a + b.', dang: 'Nhập xuất – tính toán', do_kho: 'de', nguon: 'kiểm thử', tu_khoa_hoc: false }

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
  await chu.query(`delete from bai_luyen where ten like 'KIEM_THU_BAI_%'`)
  await chu.query(`delete from student_enrollments where grade like 'KIEM_THU_KHOA_NH_%'`)
  await chu.query(`delete from grades where value like 'KIEM_THU_KHOA_NH_%'`)
  await chu.end()
})

describe.skipIf(!coDu)('ngân hàng bài (qua src/data/nganHang.js)', () => {
  it('giáo viên thêm bài kèm lời giải, test; CHƯA mở cho khoá nào', async () => {
    ctx.ai = gv.client
    const { data, error } = await luuBaiDayDu(null, { bai: { ...BAI, created_by: gv.id }, loi_giai: 'a, b = map(int, input().split())\nprint(a + b)',
      tests: [{ input: '1 2\n', expected: '3', diem: 1 }, { input: '5 5\n', expected: '10', diem: 1 }], khoa: [] })
    expect(error).toBeNull()
    baiId = data.id
    const day = await layBaiDayDu(baiId)
    expect(day.data.tests).toHaveLength(2)
    expect(day.data.loi_giai).toMatch(/print/)
    expect((await layNganHang('python')).data.some(b => b.id === baiId)).toBe(true)
  }, 30000)

  it('học sinh: bài chưa mở → không thấy, không đọc được đề', async () => {
    ctx.ai = hs.client
    expect((await layDeBai(baiId)).data).toBeNull()
    expect((await layBaiChoKhoa(KHOA)).data).toEqual([])
  })

  it('giáo viên mở cho khoá thử → học sinh thấy ĐỀ nhưng KHÔNG đọc được test, lời giải', async () => {
    ctx.ai = gv.client
    expect((await datMoChoKhoa(baiId, [KHOA])).error).toBeNull()
    ctx.ai = hs.client
    const de = await layDeBai(baiId)
    expect(de.data.ten).toBe(TEN)
    expect(de.data.de_bai).toMatch(/a \+ b/)
    expect((await layBaiChoKhoa(KHOA)).data.map(r => r.bai_luyen?.id)).toContain(baiId)
    const test = await hs.client.from('bai_luyen_test').select('input, expected').eq('bai_id', baiId)
    expect(test.data ?? []).toEqual([])
    const bm = await hs.client.from('bai_luyen_bi_mat').select('loi_giai').eq('bai_id', baiId)
    expect(bm.data ?? []).toEqual([])
  }, 30000)

  it('học sinh KHÔNG sửa / xoá bài, KHÔNG tự mở bài cho khoá, KHÔNG tự ghi điểm', async () => {
    ctx.ai = hs.client
    await hs.client.from('bai_luyen').update({ ten: 'HACK' }).eq('id', baiId)
    await hs.client.from('bai_luyen_mo').insert({ bai_id: baiId, grade: 'PYTHON A CƠ BẢN' })
    const ghiDiem = await hs.client.from('bai_luyen_ket_qua').insert({ bai_id: baiId, user_id: hs.id, diem: 10, so_lan: 1 })
    expect(ghiDiem.error).not.toBeNull()
    const ghiNop = await hs.client.from('bai_luyen_nop').insert({ bai_id: baiId, user_id: hs.id, code: 'x', ket_qua: [], diem: 10 })
    expect(ghiNop.error).not.toBeNull()
    await xoaBaiLuyen(baiId)
    const [r] = (await chu.query('select ten from bai_luyen where id = $1', [baiId])).rows
    expect(r?.ten).toBe(TEN)
    const mo = (await chu.query('select grade from bai_luyen_mo where bai_id = $1', [baiId])).rows.map(x => x.grade)
    expect(mo).toEqual([KHOA])
    expect((await layKetQuaCuaEm(hs.id)).data.some(k => k.bai_id === baiId)).toBe(false)
  }, 30000)

  it('giáo viên xoá bài', async () => {
    ctx.ai = gv.client
    expect((await xoaBaiLuyen(baiId)).error).toBeNull()
    expect((await chu.query('select 1 from bai_luyen where id = $1', [baiId])).rows).toHaveLength(0)
  }, 30000)
})
