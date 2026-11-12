// KIỂM TRA TRÊN DỮ LIỆU THẬT — tạo / sửa / xoá tài khoản qua src/data/taiKhoan.js (Edge Function create-user,
// update-user, delete-user) + danh sách học sinh của trang Học sinh. Người lạ và học sinh phải bị từ chối.
// Chạy: npm run test:quyen   (cần .env: GV_EMAIL / GV_MAT_KHAU, HS_EMAIL / HS_MAT_KHAU, NEON_DATABASE_URL)
// An toàn: giáo viên tạo 1 tài khoản thử kiemthu_tk_<giờ>@school.local rồi xoá ngay; học sinh / người lạ chỉ thử
// trên mã người dùng không tồn tại. Cuối cùng còn sót tài khoản thử thì giáo viên xoá lại.
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { readFileSync } from 'fs'
import { randomUUID } from 'crypto'
import { createClient } from '@supabase/supabase-js'
import pg from 'pg'

const env = Object.fromEntries(readFileSync('.env', 'utf8').split(/\r?\n/)
  .map(l => l.match(/^\s*([A-Z_]+)\s*=\s*['"]?([^'"\s]*)/)).filter(Boolean).map(m => [m[1], m[2]]))
const coDu = env.GV_EMAIL && env.GV_MAT_KHAU && env.HS_EMAIL && env.HS_MAT_KHAU

const ctx = { ai: null, token: null }
vi.mock('../../src/lib/supabase', () => ({ NOI_DU_LIEU: 'neon', supabase: { from: (...a) => ctx.ai.from(...a) } }))
vi.mock('../../src/lib/maDangNhap', () => ({ maDangNhap: async () => ctx.token }))
import { taoTaiKhoan, suaTaiKhoan, xoaTaiKhoan } from '../../src/data/taiKhoan'
import { layTatCaHocSinh } from '../../src/data/hoSo'
import { layCacLop } from '../../src/data/khoaHoc'

const auth = () => createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: false } })
async function dangNhap(ten, matKhau) {
  const { data, error } = await auth().auth.signInWithPassword({ email: ten.includes('@') ? ten : `${ten}@school.local`, password: matKhau })
  if (error) throw new Error(`đăng nhập ${ten}: ${error.message}`)
  const token = data.session.access_token
  return { id: data.user.id, token, client: createClient(env.NEON_DATA_URL, env.VITE_SUPABASE_ANON_KEY, { accessToken: async () => token }) }
}
const la = vai => { ctx.ai = vai.client; ctx.token = vai.token }

const TEN_THU = `kiemthu_tk_${Date.now()}`
const EMAIL_THU = `${TEN_THU}@school.local`
let gv, hs, chu, idThu

beforeAll(async () => {
  if (!coDu) return
  vi.stubEnv('VITE_SUPABASE_URL', env.VITE_SUPABASE_URL)
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', env.VITE_SUPABASE_ANON_KEY)
  ;[gv, hs] = await Promise.all([dangNhap(env.GV_EMAIL, env.GV_MAT_KHAU), dangNhap(env.HS_EMAIL, env.HS_MAT_KHAU)])
  chu = new pg.Client({ connectionString: env.NEON_DATABASE_URL.replace('sslmode=require', 'sslmode=verify-full') })
  await chu.connect()
}, 30000)

afterAll(async () => {
  if (!chu) return
  // còn sót tài khoản thử (kiểm tra hỏng giữa chừng) → giáo viên xoá
  const sot = (await chu.query(`select id from profiles where username like 'kiemthu_tk_%'`)).rows
  la(gv)
  for (const { id } of sot) await xoaTaiKhoan(id).catch(() => {})
  await chu.end()
  vi.unstubAllEnvs()
}, 30000)

describe.skipIf(!coDu)('tài khoản: người lạ và học sinh bị từ chối', () => {
  it.each([
    ['xoá', () => xoaTaiKhoan(randomUUID())],
    ['đổi mật khẩu', () => suaTaiKhoan(randomUUID(), { password: 'matkhau_thu_1' })],
  ])('người lạ (chỉ có khoá công khai) %s tài khoản', async (_, lam) => {
    ctx.token = env.VITE_SUPABASE_ANON_KEY
    await expect(lam()).rejects.toThrow()
  })
  it.each([
    ['xoá', () => xoaTaiKhoan(randomUUID())],
    ['đổi mật khẩu', () => suaTaiKhoan(randomUUID(), { password: 'matkhau_thu_1' })],
    ['tạo', () => taoTaiKhoan(`${TEN_THU}_hs@school.local`, 'matkhau_thu_1', { full_name: 'thu', role: 'teacher' })],
  ])('học sinh %s tài khoản', async (_, lam) => {
    la(hs)
    await expect(lam()).rejects.toThrow()
  })
  it('học sinh không xem được danh sách học sinh khác', async () => {
    la(hs)
    const { data } = await layTatCaHocSinh()
    expect((data || []).every(s => s.id === hs.id)).toBe(true)
  })
})

describe.skipIf(!coDu)('tài khoản: giáo viên (trang Học sinh)', () => {
  it('thấy danh sách học sinh (chỉ các cột cần) + danh sách lớp', async () => {
    la(gv)
    const [{ data: ds, error }, { data: lop, error: e2 }] = await Promise.all([layTatCaHocSinh(), layCacLop()])
    expect(error).toBeNull(); expect(e2).toBeNull()
    const em = ds.find(s => s.id === hs.id)
    expect(Object.keys(em).sort()).toEqual(['full_name', 'id', 'is_approved', 'username'])
    expect(lop.length).toBeGreaterThan(0)
  })
  it('tạo tài khoản học sinh → có hồ sơ', async () => {
    la(gv)
    const user = await taoTaiKhoan(EMAIL_THU, 'matkhau_thu_1', { full_name: 'Kiểm thử tài khoản', role: 'student', username: TEN_THU })
    idThu = user.id
    const [hoSo] = (await chu.query('select role, full_name from profiles where id = $1', [idThu])).rows
    expect(hoSo).toMatchObject({ role: 'student', full_name: 'Kiểm thử tài khoản' })
  }, 20000)
  it('đổi mật khẩu → đăng nhập bằng mật khẩu mới được, mật khẩu cũ không', async () => {
    la(gv)
    await suaTaiKhoan(idThu, { password: 'matkhau_moi_2' })
    expect((await auth().auth.signInWithPassword({ email: EMAIL_THU, password: 'matkhau_moi_2' })).error).toBeNull()
    expect((await auth().auth.signInWithPassword({ email: EMAIL_THU, password: 'matkhau_thu_1' })).error).not.toBeNull()
  }, 20000)
  it('xoá tài khoản → không đăng nhập được, hồ sơ mất', async () => {
    la(gv)
    await xoaTaiKhoan(idThu)
    expect((await auth().auth.signInWithPassword({ email: EMAIL_THU, password: 'matkhau_moi_2' })).error).not.toBeNull()
    expect((await chu.query('select 1 from profiles where id = $1', [idThu])).rowCount).toBe(0)
  }, 20000)
})
