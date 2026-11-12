// KIỂM TRA TRÊN DỮ LIỆU THẬT (Neon) — phần thưởng qua đúng các hàm src/data/phanThuong.js mà trang dùng.
// Trọng tâm: từ chối yêu cầu đổi quà hoàn sticker ĐÚNG 1 LẦN dù bấm 2 lần; học sinh không tự sửa quà / ngưỡng.
// Chạy: npm run test:quyen   (cần .env: GV_EMAIL / GV_MAT_KHAU, HS_EMAIL / HS_MAT_KHAU, NEON_DATABASE_URL)
// An toàn: quà thử trong KHOÁ THỬ (demo1 ghi danh tạm) → học sinh thật không thấy. Sticker của demo1 được lưu lại
// trước khi thử và trả về đúng như cũ ở cuối (tài khoản chủ).
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'
import pg from 'pg'

const env = Object.fromEntries(readFileSync('.env', 'utf8').split(/\r?\n/)
  .map(l => l.match(/^\s*([A-Z_]+)\s*=\s*['"]?([^'"\s]*)/)).filter(Boolean).map(m => [m[1], m[2]]))
const coDu = env.GV_EMAIL && env.GV_MAT_KHAU && env.HS_EMAIL && env.HS_MAT_KHAU

const ctx = { ai: null }
vi.mock('../../src/lib/supabase', () => ({ supabase: { from: (...a) => ctx.ai.from(...a), rpc: (...a) => ctx.ai.rpc(...a) } }))
import { layQua, layQuaChoEm, themQua, suaQua, xoaQua, layYeuCauDoiQua, xuLyYeuCau, doiQua, layNguongCacKhoa, luuNguong, layLanNhanQuaGanNhat } from '../../src/data/phanThuong'
import { adjustStickerCount } from '../../src/utils/stickerAward'

async function dangNhap(ten, matKhau) {
  const auth = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: false } })
  const { data, error } = await auth.auth.signInWithPassword({ email: ten.includes('@') ? ten : `${ten}@school.local`, password: matKhau })
  if (error) throw new Error(`đăng nhập ${ten}: ${error.message}`)
  const token = data.session.access_token
  return { id: data.user.id, client: createClient(env.NEON_DATA_URL, env.VITE_SUPABASE_ANON_KEY, { accessToken: async () => token }) }
}

const KHOA = `KIEM_THU_KHOA_QUA_${Date.now()}`
let gv, hs, chu, stickerGoc, quaId
const q = async (s, p) => (await chu.query(s, p)).rows
const soSticker = async () => (await q('select sticker_count from profiles where id = $1', [hs.id]))[0].sticker_count

beforeAll(async () => {
  if (!coDu) return
  ;[gv, hs] = await Promise.all([dangNhap(env.GV_EMAIL, env.GV_MAT_KHAU), dangNhap(env.HS_EMAIL, env.HS_MAT_KHAU)])
  chu = new pg.Client({ connectionString: env.NEON_DATABASE_URL.replace('sslmode=require', 'sslmode=verify-full') })
  await chu.connect()
  ;[stickerGoc] = await q('select sticker_count, sticker_total from profiles where id = $1', [hs.id])
  await chu.query('insert into grades (value) values ($1)', [KHOA])
  await chu.query(`insert into student_enrollments (user_id, grade, is_approved) values ($1, $2, true)`, [hs.id, KHOA])
  await chu.query('update profiles set sticker_count = sticker_count + 2 where id = $1', [hs.id])   // đủ đổi 2 món giá 1
}, 30000)

afterAll(async () => {
  if (!chu) return
  await chu.query(`delete from reward_requests where reward_item_id in (select id from reward_items where grade like 'KIEM_THU_KHOA_QUA%')`)
  await chu.query(`delete from reward_items where grade like 'KIEM_THU_KHOA_QUA%'`)
  await chu.query(`delete from reward_configs where grade like 'KIEM_THU_KHOA_QUA%'`)
  await chu.query(`delete from student_enrollments where grade like 'KIEM_THU_KHOA_QUA%'`)
  await chu.query(`delete from grades where value like 'KIEM_THU_KHOA_QUA%'`)
  if (stickerGoc) await chu.query('update profiles set sticker_count = $2, sticker_total = $3 where id = $1', [hs.id, stickerGoc.sticker_count, stickerGoc.sticker_total])
  await chu.end()
})

describe.skipIf(!coDu)('phần thưởng (qua src/data/phanThuong.js)', () => {
  it('giáo viên thêm quà của khoá thử + đặt ngưỡng', async () => {
    ctx.ai = gv.client
    expect((await themQua({ name: 'KIEM_THU_QUA', emoji: '🎁', is_active: true, grade: KHOA, sticker_cost: 1 })).error).toBeNull()
    quaId = (await layQua()).data.find(i => i.grade === KHOA).id
    expect((await luuNguong(KHOA, 7)).error).toBeNull()
    expect((await layNguongCacKhoa()).data[KHOA]).toBe(7)
  })
  it('học sinh thấy quà của khoá mình; không sửa được quà / ngưỡng', async () => {
    ctx.ai = hs.client
    expect((await layQuaChoEm(KHOA)).data.some(i => i.id === quaId)).toBe(true)
    await suaQua(quaId, { sticker_cost: 0 })
    await luuNguong(KHOA, 1)
    expect((await q('select sticker_cost from reward_items where id = $1', [quaId]))[0].sticker_cost).toBe(1)
    expect((await q('select sticker_threshold from reward_configs where grade = $1', [KHOA]))[0].sticker_threshold).toBe(7)
  })
  it('đổi quà (hàm máy chủ) trừ đúng giá; từ chối hoàn đúng 1 lần dù bấm 2 lần', async () => {
    ctx.ai = hs.client
    const truoc = await soSticker()
    const { data, error } = await doiQua(quaId)
    expect(error).toBeNull()
    expect(data.ok).toBe(true)
    expect(await soSticker()).toBe(truoc - 1)
    ctx.ai = gv.client
    const yc = (await layYeuCauDoiQua()).data.find(r => r.reward_item_id === quaId && r.status === 'pending')
    expect(yc.reward_items.name).toBe('KIEM_THU_QUA')
    // y như usePhanThuong.cancelRequest: đổi trạng thái trước, chỉ hoàn khi đổi được
    for (let lan = 0; lan < 2; lan++) {
      const { doi } = await xuLyYeuCau(yc.id, 'cancelled')
      expect(doi).toBe(lan === 0)
      if (doi) expect((await adjustStickerCount(hs.id, yc.sticker_cost)).error).toBeNull()
    }
    expect(await soSticker()).toBe(truoc)
  })
  it('trao quà: chỉ trao yêu cầu còn chờ; em thấy lần nhận quà mới', async () => {
    ctx.ai = hs.client
    expect((await doiQua(quaId)).data.ok).toBe(true)
    ctx.ai = gv.client
    const yc = (await layYeuCauDoiQua()).data.find(r => r.reward_item_id === quaId && r.status === 'pending')
    expect((await xuLyYeuCau(yc.id, 'fulfilled')).doi).toBe(true)
    expect((await xuLyYeuCau(yc.id, 'cancelled')).doi).toBe(false)   // đã trao rồi → không từ chối được nữa
    ctx.ai = hs.client
    expect(await layLanNhanQuaGanNhat(hs.id)).not.toBeNull()
    expect((await xuLyYeuCau(yc.id, 'cancelled')).doi).toBe(false)   // học sinh không tự đổi trạng thái
  })
  it('giáo viên tắt rồi xoá quà', async () => {
    ctx.ai = gv.client
    expect((await suaQua(quaId, { is_active: false })).error).toBeNull()
    ctx.ai = hs.client
    expect((await layQuaChoEm(KHOA)).data.some(i => i.id === quaId)).toBe(false)   // quà chung vẫn hiện, quà đã tắt thì không
    ctx.ai = gv.client
    await chu.query('delete from reward_requests where reward_item_id = $1', [quaId])
    expect((await xoaQua(quaId)).error).toBeNull()
  })
})
