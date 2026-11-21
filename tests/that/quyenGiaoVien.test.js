// KIỂM TRA TRÊN DỮ LIỆU THẬT (Neon) — GIÁO VIÊN làm ĐƯỢC đúng việc của mình, qua đúng các hàm src/data/ mà app dùng.
// Chạy: npm run test:quyen   (cần .env: GV_EMAIL / GV_MAT_KHAU = tài khoản giáo viên; HS_EMAIL / HS_MAT_KHAU = học sinh thử)
// An toàn: chỉ thao tác trên 1 bài thử CHƯA XUẤT BẢN (học sinh không thấy) tên KIEM_THU_QUYEN_GV; cuối cùng tự xoá
// bằng tài khoản chủ (NEON_DATABASE_URL) dù kiểm tra giữa chừng có lỗi.
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'
import pg from 'pg'

const env = Object.fromEntries(readFileSync('.env', 'utf8').split(/\r?\n/)
  .map(l => l.match(/^\s*([A-Z_]+)\s*=\s*['"]?([^'"\s]*)/)).filter(Boolean).map(m => [m[1], m[2]]))
const DAU = 'KIEM_THU_QUYEN_GV'
const coDu = env.GV_EMAIL && env.GV_MAT_KHAU && env.HS_EMAIL && env.HS_MAT_KHAU

// các hàm src/data/ gọi qua client này; đổi người đăng nhập bằng ctx.ai
const ctx = { ai: null }
vi.mock('../../src/lib/supabase', () => ({ supabase: { from: (...a) => ctx.ai.from(...a), rpc: (...a) => ctx.ai.rpc(...a) } }))
import { taoBaiHoc, luuBaiHoc, xoaBaiHoc, layNguoiXemBai, ghiNguoiXemBai, emDuocXemBai } from '../../src/data/baiHoc'
import { layTenHocSinhCuaKhoa } from '../../src/data/ghiDanh'
import { layBaiNopCuaLop, capNhatBaiNop } from '../../src/data/baiNop'
import { layTienDoCuaLop, layDauVetTienDo } from '../../src/data/tienDo'
import { capNhatTuKetQuaAi, capNhatKhiDuyetAi, capNhatKhiGvChot, gomTheoHocSinh, baiCuaPhan } from '../../src/domain/chamBai'

async function dangNhap(ten, matKhau) {
  const auth = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: false } })
  const { data, error } = await auth.auth.signInWithPassword({ email: ten.includes('@') ? ten : `${ten}@school.local`, password: matKhau })
  if (error) throw new Error(`đăng nhập ${ten}: ${error.message}`)
  const token = data.session.access_token
  return { id: data.user.id, client: createClient(env.NEON_DATA_URL, env.VITE_SUPABASE_ANON_KEY, { accessToken: async () => token }) }
}

let gv, hs, chu, khoa, baiId

beforeAll(async () => {
  if (!coDu) return
  ;[gv, hs] = await Promise.all([dangNhap(env.GV_EMAIL, env.GV_MAT_KHAU), dangNhap(env.HS_EMAIL, env.HS_MAT_KHAU)])
  chu = new pg.Client({ connectionString: env.NEON_DATABASE_URL.replace('sslmode=require', 'sslmode=verify-full') })
  await chu.connect()
  const [vt] = (await chu.query('select role from profiles where id = $1', [gv.id])).rows
  expect(['teacher', 'assistant'], 'GV_EMAIL phải là tài khoản giáo viên / trợ giảng').toContain(vt.role)
  ;[{ grade: khoa }] = (await chu.query('select grade from student_enrollments where user_id = $1 and is_approved limit 1', [hs.id])).rows
}, 30000)

afterAll(async () => {
  if (!chu) return
  await chu.query('delete from lesson_visibility where lesson_id in (select id from lessons where title like $1)', [DAU + '%'])
  await chu.query('delete from lessons where title like $1', [DAU + '%'])
  await chu.end()
})

describe.skipIf(!coDu)('GIÁO VIÊN soạn bài + giới hạn người xem (qua src/data/)', () => {
  it('tạo bài (nháp, giới hạn người xem)', async () => {
    ctx.ai = gv.client
    const { data, error } = await taoBaiHoc({ title: DAU, grade: khoa, is_published: false, restricted_audience: true, created_by: gv.id })
    expect(error).toBeNull()
    baiId = data.id
  })
  it('sửa bài', async () => {
    ctx.ai = gv.client
    const { data, error } = await luuBaiHoc(baiId, { title: DAU + ' (đã sửa)' })
    expect(error).toBeNull()
    expect(data.title).toBe(DAU + ' (đã sửa)')
  })
  it('thấy danh sách học sinh của khoá để chọn người xem', async () => {
    ctx.ai = gv.client
    const { data, error } = await layTenHocSinhCuaKhoa(khoa)
    expect(error).toBeNull()
    expect(data.map(s => s.id)).toContain(hs.id)
  })
  it('cho 1 học sinh xem → học sinh đó thấy mình được xem', async () => {
    ctx.ai = gv.client
    expect((await ghiNguoiXemBai(baiId, [hs.id])).error).toBeNull()
    expect((await layNguoiXemBai(baiId)).data).toEqual([hs.id])
    ctx.ai = hs.client
    expect(await emDuocXemBai(baiId, hs.id)).toBe(true)
  })
  it('học sinh không tự gỡ / thêm danh sách người xem', async () => {
    ctx.ai = hs.client
    await ghiNguoiXemBai(baiId, [])   // bị RLS lọc: không xoá được dòng nào
    ctx.ai = gv.client
    expect((await layNguoiXemBai(baiId)).data).toEqual([hs.id])
  })
  it('bỏ giới hạn (ghi danh sách rỗng) → học sinh không còn trong danh sách', async () => {
    ctx.ai = gv.client
    expect((await ghiNguoiXemBai(baiId, [])).error).toBeNull()
    expect((await layNguoiXemBai(baiId)).data).toEqual([])
    ctx.ai = hs.client
    expect(await emDuocXemBai(baiId, hs.id)).toBe(false)
  })
  // ── chấm bài thực hành (trang Chấm bài: hooks/useTienDoLop + useChamBaiThucHanh) trên bài thử của demo1 ──
  // bài nộp + tiến độ thử do tài khoản chủ tạo trên bài nháp; xoá bài ở bước cuối thì 2 dòng này tự xoá theo.
  it('chấm bài: giáo viên thấy tiến độ + bài nộp của em trong lớp', async () => {
    await chu.query(`insert into lesson_submissions (user_id, lesson_id, file_url, content_json, submitted_at)
      values ($1, $2, 'https://x.test/kiem_thu.py', '{"task_index":0}', now())`, [hs.id, baiId])
    await chu.query('insert into lesson_progress (user_id, lesson_id, video_watched) values ($1, $2, true)', [hs.id, baiId])
    ctx.ai = gv.client
    const [{ data: td, error: e1 }, { data: bn, error: e2 }, { data: dv }] = await Promise.all([
      layTienDoCuaLop(baiId, [hs.id]), layBaiNopCuaLop(baiId, [hs.id]), layDauVetTienDo(baiId, [hs.id])])
    expect(e1).toBeNull(); expect(e2).toBeNull()
    expect(gomTheoHocSinh(td)[hs.id]).toMatchObject({ video_watched: true, completed: false })
    expect(baiCuaPhan(gomTheoHocSinh(bn, true)[hs.id], 0).file_url).toBe('https://x.test/kiem_thu.py')
    expect(dv).toHaveLength(1)
  })
  const baiThu = async () => (await chu.query('select * from lesson_submissions where lesson_id = $1', [baiId])).rows[0]
  it('chấm bài: AI chấm nháp → giáo viên duyệt nguyên mức AI', async () => {
    ctx.ai = gv.client
    let sub = await baiThu()
    expect((await capNhatBaiNop(sub.id, capNhatTuKetQuaAi({ score: 9, comment: 'AI: tốt' }))).error).toBeNull()
    sub = await baiThu()
    expect((await capNhatBaiNop(sub.id, capNhatKhiDuyetAi(sub))).error).toBeNull()
    expect(await baiThu()).toMatchObject({ muc: 'T', graded_by: 'ai', teacher_comment: 'AI: tốt', sticker_awarded: true })
  })
  it('chấm bài: giáo viên đổi mức + nhận xét, cho nộp lại', async () => {
    ctx.ai = gv.client
    const sub = await baiThu()
    expect((await capNhatBaiNop(sub.id, capNhatKhiGvChot(sub, 'H', 'Thầy: khá'))).error).toBeNull()
    expect((await capNhatBaiNop(sub.id, { allow_resubmit: true })).error).toBeNull()
    const sau = await baiThu()
    expect(sau).toMatchObject({ muc: 'H', graded_by: 'teacher', teacher_comment: 'Thầy: khá', allow_resubmit: true })
    expect(Number(sau.score)).toBe(6.5)
    expect(Number(sau.ai_score)).toBe(9)
  })
  it('chấm bài: học sinh không tự chấm bài mình, không xem tiến độ bạn khác', async () => {
    ctx.ai = hs.client
    const sub = await baiThu()
    const { error } = await capNhatBaiNop(sub.id, capNhatKhiGvChot(sub, 'T', 'tự khen'))
    expect(error?.code).toBe('42501')
    expect(await baiThu()).toMatchObject({ muc: 'H', teacher_comment: 'Thầy: khá' })
    const [khac] = (await chu.query(`select user_id from lesson_progress where user_id <> $1 limit 1`, [hs.id])).rows
    const { data } = await layTienDoCuaLop(baiId, [hs.id, khac.user_id])
    expect(data.map(d => d.user_id)).toEqual([hs.id])
  })
  it('xoá bài', async () => {
    ctx.ai = gv.client
    expect((await xoaBaiHoc(baiId)).error).toBeNull()
    expect((await chu.query('select 1 from lessons where id = $1', [baiId])).rowCount).toBe(0)
    expect((await chu.query('select 1 from lesson_submissions where lesson_id = $1 union all select 1 from lesson_progress where lesson_id = $1', [baiId])).rowCount).toBe(0)
  })
})
