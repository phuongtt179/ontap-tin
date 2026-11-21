// KIỂM TRA TRÊN DỮ LIỆU THẬT (Neon) — khoá / lớp / chủ đề / đơn vị / tiêu đề nhỏ / mở bài cho lớp,
// qua đúng các hàm src/data/khoaHoc.js + src/data/chuDe.js mà trang giáo viên dùng. Học sinh phải bị chặn sửa.
// Chạy: npm run test:quyen   (cần .env: GV_EMAIL / GV_MAT_KHAU, HS_EMAIL / HS_MAT_KHAU, NEON_DATABASE_URL)
// An toàn: mọi thứ nằm trong khoá thử KIEM_THU_KHOA_<giờ> (học sinh không ghi danh) — cuối cùng tài khoản chủ xoá sạch
// mọi dòng có grade bắt đầu bằng KIEM_THU_KHOA ở cả 13 bảng.
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'
import pg from 'pg'

const env = Object.fromEntries(readFileSync('.env', 'utf8').split(/\r?\n/)
  .map(l => l.match(/^\s*([A-Z_]+)\s*=\s*['"]?([^'"\s]*)/)).filter(Boolean).map(m => [m[1], m[2]]))
const coDu = env.GV_EMAIL && env.GV_MAT_KHAU && env.HS_EMAIL && env.HS_MAT_KHAU

const ctx = { ai: null }
vi.mock('../../src/lib/supabase', () => ({ supabase: { from: (...a) => ctx.ai.from(...a) } }))
import { themKhoa, doiTenKhoa, xoaKhoa, layCacKhoa, luuMoTaKhoaChoAi, layMoTaKhoaChoAi, themLop, suaLop, xoaLop, layLopDayDu, layTenLopCuaKhoa, datMoChuDe, datMoBai, layMoKhoaCuaLop } from '../../src/data/khoaHoc'
import { layChuDe, themChuDe, suaChuDeVaLienQuan, xoaChuDe, layDonVi, layDonViCuaKhoa, themDonVi, xoaDonVi, demDonViTheoChuDe, layTieuDe, themTieuDe, suaTieuDe, demTieuDeTheoDonVi, ghiThuTu } from '../../src/data/chuDe'
import { doiCho } from '../../src/domain/cayNoiDung'

async function dangNhap(ten, matKhau) {
  const auth = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: false } })
  const { data, error } = await auth.auth.signInWithPassword({ email: ten.includes('@') ? ten : `${ten}@school.local`, password: matKhau })
  if (error) throw new Error(`đăng nhập ${ten}: ${error.message}`)
  const token = data.session.access_token
  return { id: data.user.id, client: createClient(env.NEON_DATA_URL, env.VITE_SUPABASE_ANON_KEY, { accessToken: async () => token }) }
}

const KHOA = `KIEM_THU_KHOA_${Date.now()}`
const KHOA_MOI = KHOA + '_MOI'
const BANG = ['classes', 'student_enrollments', 'questions', 'exams', 'lessons', 'topics', 'units',
  'class_topic_unlock', 'class_lesson_unlock', 'attendance_sessions', 'reward_configs', 'reward_items', 'student_notes']
let gv, hs, chu, baiThu, chuDeId
const q = async (s, p) => (await chu.query(s, p)).rows

beforeAll(async () => {
  if (!coDu) return
  ;[gv, hs] = await Promise.all([dangNhap(env.GV_EMAIL, env.GV_MAT_KHAU), dangNhap(env.HS_EMAIL, env.HS_MAT_KHAU)])
  chu = new pg.Client({ connectionString: env.NEON_DATABASE_URL.replace('sslmode=require', 'sslmode=verify-full') })
  await chu.connect()
}, 30000)

afterAll(async () => {
  if (!chu) return
  await chu.query(`delete from lesson_titles where unit_id in (select id from units where grade like 'KIEM_THU_KHOA%')`)
  for (const b of BANG) await chu.query(`delete from ${b} where grade like 'KIEM_THU_KHOA%'`)
  await chu.query(`delete from grades where value like 'KIEM_THU_KHOA%'`)
  await chu.end()
})

describe.skipIf(!coDu)('GIÁO VIÊN: khoá → lớp → chủ đề → đơn vị → tiêu đề, mở bài cho lớp', () => {
  it('tạo khoá + mô tả cho AI', async () => {
    ctx.ai = gv.client
    expect((await themKhoa(KHOA)).error).toBeNull()
    expect((await luuMoTaKhoaChoAi(KHOA, 'Khoá thử')).error).toBeNull()
    expect(await layMoTaKhoaChoAi(KHOA)).toBe('Khoá thử')
    expect((await layCacKhoa()).data.map(g => g.value)).toContain(KHOA)
  })
  it('lớp: thêm, đổi tên, đọc theo khoá', async () => {
    ctx.ai = gv.client
    expect((await themLop({ name: 'Ca B', grade: KHOA })).error).toBeNull()
    expect((await themLop({ name: 'Ca A', grade: KHOA })).error).toBeNull()
    const { data } = await layLopDayDu(KHOA)
    expect(data.map(c => c.name)).toEqual(['Ca A', 'Ca B'])
    expect((await suaLop(data[1].id, { name: 'Ca C', grade: KHOA })).error).toBeNull()
    expect(await layTenLopCuaKhoa(KHOA)).toEqual(['Ca A', 'Ca C'])
  })
  it('chủ đề → đơn vị → tiêu đề nhỏ, đếm, xếp lại thứ tự', async () => {
    ctx.ai = gv.client
    expect((await themChuDe([{ name: 'Chủ đề 10', grade: KHOA }, { name: 'Chủ đề 2', grade: KHOA }])).error).toBeNull()
    const cd = (await layChuDe([KHOA])).data
    expect(cd.map(t => t.name)).toEqual(['Chủ đề 2', 'Chủ đề 10'])   // xếp kiểu người đọc
    chuDeId = cd[0].id
    expect((await themDonVi([0, 1, 2].map(i => ({ name: `Đơn vị ${i}`, grade: KHOA, topic: 'Chủ đề 2', sort_order: i })))).error).toBeNull()
    let dv = (await layDonVi(KHOA, 'Chủ đề 2')).data
    await ghiThuTu('units', doiCho(dv, 2, -1))
    dv = (await layDonVi(KHOA, 'Chủ đề 2')).data
    expect(dv.map(u => u.name)).toEqual(['Đơn vị 0', 'Đơn vị 2', 'Đơn vị 1'])
    expect((await layDonViCuaKhoa(KHOA)).data).toHaveLength(3)
    expect((await demDonViTheoChuDe()).data[`${KHOA}||Chủ đề 2`]).toBe(3)
    expect((await themTieuDe({ name: 'Tiêu đề 1', unit_id: dv[0].id, sort_order: 0 })).error).toBeNull()
    const [td] = (await layTieuDe(dv[0].id)).data
    expect((await suaTieuDe(td.id, { name: 'Tiêu đề A' })).error).toBeNull()
    expect((await demTieuDeTheoDonVi(dv.map(u => u.id))).data).toEqual({ [dv[0].id]: 1 })
    expect((await xoaDonVi(dv[2].id)).error).toBeNull()
  })
  it('mở / khoá chủ đề + bài cho lớp; mở trùng không báo lỗi', async () => {
    ctx.ai = gv.client
    ;[baiThu] = await q(`insert into lessons (title, grade, topic, is_published) values ('KIEM_THU_BAI', $1, 'Chủ đề 2', false) returning id`, [KHOA])
    expect((await datMoChuDe(KHOA, 'Ca A', 'Chủ đề 2', true)).error).toBeNull()
    expect((await datMoChuDe(KHOA, 'Ca A', 'Chủ đề 2', true)).error).toBeNull()
    expect((await datMoBai(KHOA, 'Ca A', baiThu.id, true)).error).toBeNull()
    let mk = await layMoKhoaCuaLop(KHOA, 'Ca A')
    expect([...mk.chuDe]).toEqual(['Chủ đề 2'])
    expect(mk.bai.has(baiThu.id)).toBe(true)
    expect((await datMoBai(KHOA, 'Ca A', baiThu.id, false)).error).toBeNull()
    mk = await layMoKhoaCuaLop(KHOA, 'Ca A')
    expect(mk.bai.size).toBe(0)
  })
  it('sửa chủ đề vừa đổi tên vừa đổi khoá → bài học + đơn vị đổi theo (không sót)', async () => {
    ctx.ai = gv.client
    expect((await themKhoa(KHOA_MOI)).error).toBeNull()
    expect((await suaChuDeVaLienQuan(chuDeId, { tenCu: 'Chủ đề 2', khoaCu: KHOA, tenMoi: 'Chủ đề Hai', khoaMoi: KHOA_MOI })).error).toBeNull()
    expect(await q('select topic, grade from units where grade like $1 order by name', [KHOA + '%'])).toEqual([
      { topic: 'Chủ đề Hai', grade: KHOA_MOI }, { topic: 'Chủ đề Hai', grade: KHOA_MOI }])
    expect((await q('select topic from lessons where id = $1', [baiThu.id]))[0].topic).toBe('Chủ đề Hai')
    // trả lại khoá cũ cho bước sau
    expect((await suaChuDeVaLienQuan(chuDeId, { tenCu: 'Chủ đề Hai', khoaCu: KHOA_MOI, tenMoi: 'Chủ đề Hai', khoaMoi: KHOA })).error).toBeNull()
    await chu.query('delete from grades where value = $1', [KHOA_MOI])
  })
  it('đổi tên khoá → đủ 13 bảng đổi theo (lớp vẫn giữ bài đã mở)', async () => {
    ctx.ai = gv.client
    await datMoChuDe(KHOA, 'Ca A', 'Chủ đề Hai', true)
    await datMoBai(KHOA, 'Ca A', baiThu.id, true)
    const { error, loiBang } = await doiTenKhoa(KHOA, KHOA_MOI)
    expect(error).toBeNull()
    expect(loiBang).toEqual([])
    for (const b of BANG) expect((await q(`select count(*)::int n from ${b} where grade = $1`, [KHOA]))[0].n, b).toBe(0)
    const mk = await layMoKhoaCuaLop(KHOA_MOI, 'Ca A')
    expect(mk.chuDe.has('Chủ đề Hai')).toBe(true)
    expect(mk.bai.has(baiThu.id)).toBe(true)
  })
  it('HỌC SINH không sửa được khoá / lớp / chủ đề / đơn vị / tiêu đề / mở bài', async () => {
    ctx.ai = hs.client
    const truoc = await q(`select (select count(*) from classes where grade = $1) lop, (select count(*) from topics where grade = $1) cd,
      (select count(*) from units where grade = $1) dv, (select count(*) from class_lesson_unlock where grade = $1) mo`, [KHOA_MOI])
    expect((await themKhoa(KHOA + '_HS')).error).not.toBeNull()
    expect((await themLop({ name: 'HS', grade: KHOA_MOI })).error).not.toBeNull()
    expect((await themChuDe({ name: 'HS', grade: KHOA_MOI })).error).not.toBeNull()
    expect((await themDonVi({ name: 'HS', grade: KHOA_MOI, topic: 'x' })).error).not.toBeNull()
    expect((await datMoBai(KHOA_MOI, 'Ca A', baiThu.id, false)).error === null).toBe(true)   // bị RLS lọc: không xoá được dòng nào
    const { loiBang } = await doiTenKhoa(KHOA_MOI, KHOA + '_HS')
    expect(loiBang ?? []).toEqual([])   // không lỗi nhưng không đổi được gì
    expect(await q(`select (select count(*) from classes where grade = $1) lop, (select count(*) from topics where grade = $1) cd,
      (select count(*) from units where grade = $1) dv, (select count(*) from class_lesson_unlock where grade = $1) mo`, [KHOA_MOI])).toEqual(truoc)
    expect((await q('select count(*)::int n from grades where value = $1', [KHOA_MOI]))[0].n).toBe(1)
  })
  it('xoá: chủ đề, lớp, khoá (kèm lớp + ghi danh)', async () => {
    ctx.ai = gv.client
    expect((await xoaChuDe(chuDeId)).error).toBeNull()
    const [lop] = (await layLopDayDu(KHOA_MOI)).data
    expect((await xoaLop(lop.id)).error).toBeNull()
    expect((await xoaKhoa(KHOA_MOI)).error).toBeNull()
    expect((await q(`select (select count(*) from grades where value = $1)::int g, (select count(*) from classes where grade = $1)::int c`, [KHOA_MOI]))[0]).toEqual({ g: 0, c: 0 })
  })
})
