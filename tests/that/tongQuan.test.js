// KIỂM TRA TRÊN DỮ LIỆU THẬT (Neon) — các hàm đọc của trang tổng quan, thành tích, bài giảng web, trợ lý (đợt dọn 7).
// Mục đích: bắt lỗi tên cột / tên hàm máy chủ sai (build không bắt được) + học sinh chỉ thấy số liệu của mình.
// Chạy: npm run test:quyen   (cần .env: GV_EMAIL / GV_MAT_KHAU, HS_EMAIL / HS_MAT_KHAU, NEON_DATABASE_URL)
// An toàn: chỉ ĐỌC, trừ bài giảng web ghi vào 1 bài NHÁP thử KIEM_THU_BAI_GIANG (tự xoá).
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'
import pg from 'pg'

const env = Object.fromEntries(readFileSync('.env', 'utf8').split(/\r?\n/)
  .map(l => l.match(/^\s*([A-Z_]+)\s*=\s*['"]?([^'"\s]*)/)).filter(Boolean).map(m => [m[1], m[2]]))
const coDu = env.GV_EMAIL && env.GV_MAT_KHAU && env.HS_EMAIL && env.HS_MAT_KHAU

const ctx = { ai: null }
vi.mock('../../src/lib/supabase', () => ({ supabase: { from: (...a) => ctx.ai.from(...a), rpc: (...a) => ctx.ai.rpc(...a) } }))
import { demBaiTongQuan, demCauHoiDangCho, layBaoCaoTacDong } from '../../src/data/hoiThayCo'
import { demDeThi } from '../../src/data/deThi'
import { layBuoiDangMo, layIdBuoiTrongNgay, demLuotDiemDanh } from '../../src/data/diemDanh'
import { layDiemThiDeXepHang, layDiemLuyenTapDeXepHang, demLuotLamBaiTuLuc } from '../../src/data/baiLam'
import { layBangXepHangLop, layNoiDungTroGiangSoan } from '../../src/data/hoSo'
import { layYeuCauCuaEm } from '../../src/data/phanThuong'
import { layTienDoCuaCacHs, demBaiHoanThanh } from '../../src/data/tienDo'
import { layBaiGiangDeSua, luuBaiGiang, layBaiGiangWeb } from '../../src/data/baiHoc'
import { demLuotRaSoat } from '../../src/data/baiNop'
import { gomDiemTheoEm } from '../../src/domain/xepHang'

async function dangNhap(ten, matKhau) {
  const auth = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: false } })
  const { data, error } = await auth.auth.signInWithPassword({ email: ten.includes('@') ? ten : `${ten}@school.local`, password: matKhau })
  if (error) throw new Error(`đăng nhập ${ten}: ${error.message}`)
  const token = data.session.access_token
  return { id: data.user.id, client: createClient(env.NEON_DATA_URL, env.VITE_SUPABASE_ANON_KEY, { accessToken: async () => token }) }
}

let gv, hs, chu, bai
beforeAll(async () => {
  if (!coDu) return
  ;[gv, hs] = await Promise.all([dangNhap(env.GV_EMAIL, env.GV_MAT_KHAU), dangNhap(env.HS_EMAIL, env.HS_MAT_KHAU)])
  chu = new pg.Client({ connectionString: env.NEON_DATABASE_URL.replace('sslmode=require', 'sslmode=verify-full') })
  await chu.connect()
  ;[bai] = (await chu.query(`insert into lessons (title, grade, is_published) values ('KIEM_THU_BAI_GIANG', 'KIEM_THU', false) returning id`)).rows
}, 30000)

afterAll(async () => {
  if (!chu) return
  await chu.query(`delete from lessons where title = 'KIEM_THU_BAI_GIANG'`)   // lesson_slides xoá theo (cascade)
  await chu.end()
})

describe.skipIf(!coDu)('trang tổng quan giáo viên (chỉ đọc)', () => {
  it('đếm + hàm máy chủ chạy được, không lỗi tên cột', async () => {
    ctx.ai = gv.client
    const kq = await Promise.all([demBaiTongQuan(), demCauHoiDangCho(), demDeThi(), layBuoiDangMo(), layBaoCaoTacDong()])
    kq.forEach(r => expect(r.error).toBeNull())
    expect(kq[0].data).toHaveProperty('chua_cham')
    expect(typeof await demLuotDiemDanh(await layIdBuoiTrongNgay(new Date().toISOString().slice(0, 10)))).toBe('number')
    expect(typeof await demLuotLamBaiTuLuc(new Date(Date.now() - 864e5).toISOString())).toBe('number')
  })
  it('xếp hạng: chỉ lấy lượt có điểm, gom được', async () => {
    ctx.ai = gv.client
    const [{ data: thi, error: e1 }, { data: luyen, error: e2 }] = await Promise.all([layDiemThiDeXepHang(), layDiemLuyenTapDeXepHang()])
    expect(e1).toBeNull(); expect(e2).toBeNull()
    expect(thi.every(l => l.score != null)).toBe(true)
    expect(gomDiemTheoEm(thi).every(u => Number.isFinite(u.avg))).toBe(true)
    expect(luyen.length).toBeGreaterThanOrEqual(0)
  })
  it('trợ lý AI + trang trợ giảng đọc được', async () => {
    ctx.ai = gv.client
    expect((await layTienDoCuaCacHs([hs.id], [bai.id])).error).toBeNull()
    for (const bang of ['topics', 'questions', 'lessons']) {
      const { data, error } = await layNoiDungTroGiangSoan(bang, gv.id)
      expect(error, bang).toBeNull()
      if (data.length) expect(typeof data[0].ten, bang).toBe('string')
    }
    expect(() => layNoiDungTroGiangSoan('profiles', gv.id)).toThrow()
  })
})

describe.skipIf(!coDu)('học sinh: thành tích chỉ của mình', () => {
  it('bảng xếp hạng lớp, yêu cầu đổi quà, số bài hoàn thành, số lần rà soát', async () => {
    ctx.ai = hs.client
    expect((await layBangXepHangLop()).error).toBeNull()
    const { data: yc, error } = await layYeuCauCuaEm(hs.id)
    expect(error).toBeNull()
    expect(Array.isArray(yc)).toBe(true)
    expect((await demBaiHoanThanh(hs.id)).error).toBeNull()
    expect(typeof await demLuotRaSoat(bai.id, 0)).toBe('number')
  })
  it('điểm xếp hạng: học sinh chỉ thấy lượt của mình', async () => {
    ctx.ai = hs.client
    const { data } = await layDiemThiDeXepHang()
    expect((data || []).every(l => l.user_id === hs.id)).toBe(true)
  })
})

describe.skipIf(!coDu)('bài giảng web', () => {
  it('giáo viên lưu → đọc lại để sửa / để dạy; học sinh không lưu được', async () => {
    ctx.ai = gv.client
    const trang = [{ loai: 'bia', tieu: 'KIEM THU' }]
    expect((await luuBaiGiang({ lessonId: bai.id, slides: trang, kichBan: 'kb', userId: gv.id })).error).toBeNull()
    expect(await layBaiGiangDeSua(bai.id)).toEqual({ slides: trang, kich_ban: 'kb' })
    expect(await layBaiGiangWeb(bai.id)).toEqual(trang)
    ctx.ai = hs.client
    await luuBaiGiang({ lessonId: bai.id, slides: [], userId: hs.id })
    ctx.ai = gv.client
    expect(await layBaiGiangWeb(bai.id)).toEqual(trang)
  })
})
