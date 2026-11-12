// KIỂM TRA TRÊN DỮ LIỆU THẬT (Neon) — tin nhắn, nhật ký hỏi AI, câu hỏi gửi thầy cô, hỏi đáp mẫu, công cụ AI,
// qua đúng các hàm src/data/tinNhan.js, hoiThayCo.js, hoiDapMau.js. Học sinh chỉ đọc / ghi phần của mình.
// Chạy: npm run test:quyen   (cần .env: GV_EMAIL / GV_MAT_KHAU, HS_EMAIL / HS_MAT_KHAU, NEON_DATABASE_URL)
// An toàn: mọi dòng thử có chữ KIEM_THU_TIN; bài thử là bài NHÁP (học sinh không thấy). Cuối cùng tài khoản chủ xoá sạch.
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'
import pg from 'pg'

const env = Object.fromEntries(readFileSync('.env', 'utf8').split(/\r?\n/)
  .map(l => l.match(/^\s*([A-Z_]+)\s*=\s*['"]?([^'"\s]*)/)).filter(Boolean).map(m => [m[1], m[2]]))
const coDu = env.GV_EMAIL && env.GV_MAT_KHAU && env.HS_EMAIL && env.HS_MAT_KHAU
const DAU = 'KIEM_THU_TIN'

const ctx = { ai: null }
vi.mock('../../src/lib/supabase', () => ({ supabase: { from: (...a) => ctx.ai.from(...a), rpc: (...a) => ctx.ai.rpc(...a) } }))
import { layHopThu, layTinMoi, layNhatKyAi, danhDauDaDoc, guiTinGiaoVien, guiTinNhieuEm, xoaTin, ghiNhatKyAi, layCauHoiAiTheoBai } from '../../src/data/tinNhan'
import { guiCauHoi, layCauHoiCuaEm, danhDauDaXem, demTraLoiChuaXem, layCauHoiChoTraLoi, layNhapTraLoi, luuNhapTraLoi, traLoiCauHoi, layTongQuanCongCuAi, layHangDoiDuyet } from '../../src/data/hoiThayCo'
import { themHoiDap, layHoiDapCuaBai, layHoiDapMauChoEm, demHoiDapDaDuyet, suaHoiDap, duyetHoiDap, xoaHoiDap } from '../../src/data/hoiDapMau'

async function dangNhap(ten, matKhau) {
  const auth = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: false } })
  const { data, error } = await auth.auth.signInWithPassword({ email: ten.includes('@') ? ten : `${ten}@school.local`, password: matKhau })
  if (error) throw new Error(`đăng nhập ${ten}: ${error.message}`)
  const token = data.session.access_token
  return { id: data.user.id, client: createClient(env.NEON_DATA_URL, env.VITE_SUPABASE_ANON_KEY, { accessToken: async () => token }) }
}

let gv, hs, chu, bai, khac, cauId
const q = async (s, p) => (await chu.query(s, p)).rows
const truoc = new Date(Date.now() - 60000).toISOString()

beforeAll(async () => {
  if (!coDu) return
  ;[gv, hs] = await Promise.all([dangNhap(env.GV_EMAIL, env.GV_MAT_KHAU), dangNhap(env.HS_EMAIL, env.HS_MAT_KHAU)])
  chu = new pg.Client({ connectionString: env.NEON_DATABASE_URL.replace('sslmode=require', 'sslmode=verify-full') })
  await chu.connect()
  ;[bai] = await q(`insert into lessons (title, grade, is_published) values ($1, 'KIEM_THU', false) returning id`, [DAU])
  ;[khac] = await q(`select id from profiles where role = 'student' and id <> $1 limit 1`, [hs.id])
}, 30000)

afterAll(async () => {
  if (!chu) return
  await chu.query(`delete from messages where content like '%${DAU}%'`)
  await chu.query(`delete from student_question_drafts where question_id in (select id from student_questions where question like '${DAU}%')`)
  await chu.query(`delete from student_questions where question like '${DAU}%'`)
  await chu.query(`delete from lesson_faq where question like '${DAU}%'`)
  await chu.query(`delete from lessons where title = $1`, [DAU])
  await chu.end()
})

describe.skipIf(!coDu)('tin nhắn thầy – trò + nhật ký hỏi AI', () => {
  it('giáo viên nhắn em → thấy trong hộp thư, hỏi tin mới thấy tin vừa gửi', async () => {
    ctx.ai = gv.client
    const { data, error } = await guiTinGiaoVien(hs.id, `${DAU} chào em`)
    expect(error).toBeNull()
    expect(data).toMatchObject({ sender_role: 'teacher', student_id: hs.id })
    expect((await layHopThu()).tinGiaoVien.some(m => m.id === data.id)).toBe(true)
    expect((await layTinMoi(hs.id, truoc)).data.some(m => m.id === data.id)).toBe(true)
  })
  it('học sinh ghi nhật ký hỏi AI của mình; KHÔNG ghi được dưới tên em khác', async () => {
    ctx.ai = hs.client
    expect((await ghiNhatKyAi(hs.id, `${DAU} hỏi`, `${DAU} đáp`, { from: 'test', lessonId: bai.id })).error).toBeNull()
    expect((await ghiNhatKyAi(khac.id, `${DAU} giả`, 'x', {})).error).not.toBeNull()
  })
  it('học sinh chỉ thấy tin của mình; không gửi được tin "của giáo viên"', async () => {
    ctx.ai = hs.client
    const { tinGiaoVien, mocAi } = await layHopThu()
    expect([...tinGiaoVien, ...mocAi].every(m => m.student_id === hs.id)).toBe(true)
    expect((await guiTinGiaoVien(hs.id, `${DAU} giả thầy`)).error).not.toBeNull()
  })
  it('giáo viên xem log AI của em, câu hỏi AI theo bài, đánh dấu đã đọc, nhắn nhiều em, xoá tin', async () => {
    ctx.ai = gv.client
    expect((await layNhatKyAi(hs.id)).data.some(m => m.content === `${DAU} đáp`)).toBe(true)
    expect((await layCauHoiAiTheoBai([bai.id], 1)).data.map(m => m.content)).toEqual([`${DAU} hỏi`])
    expect((await danhDauDaDoc(hs.id)).error).toBeNull()
    expect((await guiTinNhieuEm([hs.id], `${DAU} cả lớp`)).error).toBeNull()
    const [tin] = await q(`select id from messages where content = $1`, [`${DAU} cả lớp`])
    expect((await xoaTin(tin.id)).error).toBeNull()
    expect(await q(`select id from messages where id = $1`, [tin.id])).toEqual([])
  })
})

describe.skipIf(!coDu)('câu hỏi gửi thầy cô (giáo viên trung gian)', () => {
  it('học sinh gửi câu hỏi → giáo viên thấy trong hàng chờ', async () => {
    ctx.ai = hs.client
    const { data, error } = await guiCauHoi({ studentId: hs.id, lessonId: bai.id, mode: 'theory', cauHoi: `${DAU} vòng lặp là gì?`, context: { lessonTitle: DAU } })
    expect(error).toBeNull()
    cauId = data.id
    ctx.ai = gv.client
    // lọc theo khoá của bài thử (hàng chờ thật chỉ hiện 100 câu cũ nhất — hiện có hơn 100 câu chờ)
    const { data: cho } = await layCauHoiChoTraLoi({ grade: 'KIEM_THU' })
    expect(cho.map(c => c.id)).toEqual([cauId])
    expect(cho[0].lessons.title).toBe(DAU)
  })
  it('giáo viên lưu nháp AI; học sinh KHÔNG đọc được nháp', async () => {
    ctx.ai = gv.client
    expect((await luuNhapTraLoi([{ question_id: cauId, draft: `${DAU} nháp`, skip_reason: null }])).error).toBeNull()
    expect(await layNhapTraLoi([cauId])).toEqual({ [cauId]: { text: `${DAU} nháp`, skip: null } })
    ctx.ai = hs.client
    expect(await layNhapTraLoi([cauId])).toEqual({})
  })
  it('học sinh không tự trả lời câu của mình', async () => {
    ctx.ai = hs.client
    await traLoiCauHoi(cauId, { status: 'answered', traLoi: 'tự trả lời', nguoiTraLoi: hs.id })
    expect((await q('select status, answer from student_questions where id = $1', [cauId]))[0]).toEqual({ status: 'pending', answer: null })
  })
  it('giáo viên trả lời → em thấy, đếm chưa xem, đánh dấu đã xem', async () => {
    ctx.ai = gv.client
    expect((await traLoiCauHoi(cauId, { status: 'answered', traLoi: `${DAU} là lặp lại`, nguoiTraLoi: gv.id })).error).toBeNull()
    ctx.ai = hs.client
    expect((await layCauHoiCuaEm(hs.id, bai.id)).data.find(c => c.id === cauId)).toMatchObject({ status: 'answered', answer: `${DAU} là lặp lại` })
    expect((await demTraLoiChuaXem(hs.id, bai.id)).count).toBe(1)
    expect((await danhDauDaXem([cauId])).error).toBeNull()
    expect((await demTraLoiChuaXem(hs.id, bai.id)).count).toBe(0)
  })
})

describe.skipIf(!coDu)('hỏi đáp mẫu + công cụ AI', () => {
  it('giáo viên soạn, sửa, duyệt; học sinh chỉ thấy câu đã duyệt; không tự thêm được', async () => {
    ctx.ai = gv.client
    const { data, error } = await themHoiDap([0, 1].map(i => ({ lesson_id: bai.id, question: `${DAU} câu ${i}`, answer: 'đáp', source: 'teacher', sort_order: i })))
    expect(error).toBeNull()
    expect((await suaHoiDap(data[0].id, { answer: 'đáp mới' })).data.answer).toBe('đáp mới')
    expect((await duyetHoiDap([data[0].id])).error).toBeNull()
    expect((await layHoiDapCuaBai(bai.id)).data.map(f => f.approved)).toEqual([false, true])
    expect((await demHoiDapDaDuyet([bai.id])).data).toEqual({ [bai.id]: 1 })
    ctx.ai = hs.client
    expect((await layHoiDapMauChoEm(bai.id)).data.map(f => f.question)).toEqual([`${DAU} câu 0`])
    expect((await themHoiDap({ lesson_id: bai.id, question: `${DAU} hs`, answer: 'x' })).error).not.toBeNull()
    ctx.ai = gv.client
    expect((await xoaHoiDap(data[1].id)).error).toBeNull()
  })
  it('giáo viên xem tổng quan + hàng đợi duyệt; học sinh không lấy được', async () => {
    ctx.ai = gv.client
    expect((await layTongQuanCongCuAi()).error).toBeNull()
    expect((await layHangDoiDuyet({ lyDo: null, soDong: 5 })).error).toBeNull()
    ctx.ai = hs.client
    const { data, error } = await layHangDoiDuyet({ lyDo: null, soDong: 5 })
    expect(error !== null || (data || []).length === 0).toBe(true)
  })
})
