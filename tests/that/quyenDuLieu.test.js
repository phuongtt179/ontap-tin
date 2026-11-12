// KIỂM TRA QUYỀN TRÊN DỮ LIỆU THẬT (Neon) — "một học sinh cố tình phá thì làm được gì?"
// Chạy: npm run test:quyen   (cần .env: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, NEON_DATA_URL, NEON_DATABASE_URL,
//                              THU_EMAIL / THU_MAT_KHAU = tài khoản HỌC SINH thử)
// An toàn dữ liệu:
//  • Mọi thao tác "phá" chỉ nhắm vào tài khoản thử, hoặc ghi lại ĐÚNG giá trị đang có (lọt cũng không đổi gì).
//  • Trước khi chạy chụp lại hồ sơ + bài nộp của tài khoản thử; cuối cùng nếu có gì lọt thì tự khôi phục
//    bằng tài khoản chủ (NEON_DATABASE_URL) và xoá dòng thử có dấu KIEM_THU_QUYEN.
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'
import pg from 'pg'

const env = Object.fromEntries(readFileSync('.env', 'utf8').split(/\r?\n/)
  .map(l => l.match(/^\s*([A-Z_]+)\s*=\s*['"]?([^'"\s]*)/)).filter(Boolean).map(m => [m[1], m[2]]))
const DAU = 'KIEM_THU_QUYEN'

let hs, me, chu, anh = {}, nguoiKhac = {}
const rows = r => { if (r.error) throw r.error; return r.data }

beforeAll(async () => {
  const auth = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: false } })
  const { data, error } = await auth.auth.signInWithPassword({ email: env.THU_EMAIL, password: env.THU_MAT_KHAU })
  if (error) throw error
  me = data.user.id
  const token = data.session.access_token
  hs = createClient(env.NEON_DATA_URL, env.VITE_SUPABASE_ANON_KEY, { accessToken: async () => token })

  chu = new pg.Client({ connectionString: env.NEON_DATABASE_URL.replace('sslmode=require', 'sslmode=verify-full') })
  await chu.connect()
  const q = async (s, p) => (await chu.query(s, p)).rows
  const [p] = await q('select role, sticker_count, sticker_total, streak_days, streak_max, last_active_date, is_active, is_approved, notes_warning from profiles where id = $1', [me])
  expect(p.role, 'THU_EMAIL phải là tài khoản HỌC SINH').toBe('student')
  anh.hoSo = p
  anh.baiNop = await q('select id, score, teacher_comment from lesson_submissions where user_id = $1', [me])
  anh.baiThi = await q('select id, score, practical_score from exam_sessions where user_id = $1', [me])
  ;[nguoiKhac.hoSo] = await q(`select id, full_name from profiles where id <> $1 and role = 'student' limit 1`, [me])
  ;[nguoiKhac.baiNop] = await q('select id, teacher_comment from lesson_submissions where user_id <> $1 limit 1', [me])
  ;[nguoiKhac.bai] = await q('select id, is_published from lessons limit 1')
  ;[nguoiKhac.cau] = await q('select id, hint from questions limit 1')
  ;[nguoiKhac.xem] = await q('select lesson_id, user_id from lesson_visibility where user_id <> $1 limit 1', [me])
  anh.xem = await q('select lesson_id from lesson_visibility where user_id = $1', [me])
  ;[nguoiKhac.baiGioiHan] = await q(`select id from lessons where restricted_audience
    and id not in (select lesson_id from lesson_visibility where user_id = $1) limit 1`, [me])
}, 30000)

afterAll(async () => {
  if (!chu) return
  // khôi phục nếu có gì lọt (bình thường các lệnh dưới không đổi dòng nào)
  const p = anh.hoSo
  if (p) await chu.query(`update profiles set role=$2, sticker_count=$3, sticker_total=$4, streak_days=$5, streak_max=$6,
    last_active_date=$7, is_active=$8, is_approved=$9, notes_warning=$10 where id=$1 and (role, sticker_count, sticker_total, is_active, is_approved, notes_warning)
    is distinct from ($2, $3, $4, $8, $9, $10)`, [me, p.role, p.sticker_count, p.sticker_total, p.streak_days, p.streak_max, p.last_active_date, p.is_active, p.is_approved, p.notes_warning])
  for (const b of anh.baiNop || []) await chu.query('update lesson_submissions set score=$2 where id=$1 and score is distinct from $2', [b.id, b.score])
  for (const b of anh.baiThi || []) await chu.query('update exam_sessions set practical_score=$2 where id=$1 and practical_score is distinct from $2', [b.id, b.practical_score])
  await chu.query(`delete from lessons where title = $1`, [DAU])
  // lọt: em tự thêm mình vào danh sách xem → xoá dòng mới (giữ dòng em vốn có); dòng của người khác bị xoá → ghi lại
  await chu.query('delete from lesson_visibility where user_id = $1 and not (lesson_id = any($2::uuid[]))', [me, (anh.xem || []).map(r => r.lesson_id)])
  if (nguoiKhac.xem) await chu.query(`insert into lesson_visibility (lesson_id, user_id) select $1, $2
    where not exists (select 1 from lesson_visibility where lesson_id = $1 and user_id = $2)`, [nguoiKhac.xem.lesson_id, nguoiKhac.xem.user_id])
  await chu.query(`delete from messages where content = $1`, [DAU])
  await chu.query(`delete from exam_tests where input = $1`, [DAU])
  await chu.query(`delete from sticker_awards where award_key = $1`, [DAU])
  await chu.end()
})

/** lỗi quyền: Postgres 42501 (trigger / RLS chặn ghi) */
const biChan = r => expect(r.error?.code, JSON.stringify(r.error || r.data)).toBe('42501')
/** RLS lọc: lệnh sửa chạy nhưng không chạm dòng nào */
const khongDong = r => { expect(r.error?.code ?? null).toBeNull(); expect(r.data).toEqual([]) }

describe('HỌC SINH chỉ đọc được dữ liệu của chính mình', () => {
  it.each([
    ['profiles', 'id'], ['lesson_submissions', 'user_id'], ['student_enrollments', 'user_id'], ['lesson_progress', 'user_id'],
    ['quiz_sessions', 'user_id'], ['exam_sessions', 'user_id'], ['exam_nop_python', 'user_id'], ['sticker_awards', 'user_id'],
    ['reward_requests', 'student_id'], ['submission_history', 'user_id'], ['attendance_records', 'user_id'],
    ['student_notes', 'user_id'], ['messages', 'student_id'], ['ra_soat_luot', 'user_id'], ['student_questions', 'student_id'],
  ])('%s', async (bang, cot) => {
    const data = rows(await hs.from(bang).select(cot).limit(5000))
    expect(data.filter(r => r[cot] !== me)).toEqual([])
    // bảng phải thật sự có dữ liệu người khác thì phép thử mới có nghĩa
    const { rows: [{ n }] } = await chu.query(`select count(*)::int n from ${bang} where ${cot} <> $1`, [me])
    if (n === 0) console.warn(`(${bang}: chưa có dữ liệu người khác — phép thử chưa có ý nghĩa)`)
  })

  it('không đọc được test chấm thi Python (input / output mong đợi)', async () => {
    expect(rows(await hs.from('exam_tests').select('input, expected').limit(5))).toEqual([])
  })
  it('không đọc được nháp câu hỏi AI của giáo viên', async () => {
    expect(rows(await hs.from('student_question_drafts').select('*').limit(5))).toEqual([])
  })
  it('hỏi đáp mẫu: chỉ thấy câu đã duyệt', async () => {
    expect(rows(await hs.from('lesson_faq').select('approved').limit(5000)).filter(r => !r.approved)).toEqual([])
  })
  it('phần quà: chỉ thấy quà đang mở', async () => {
    expect(rows(await hs.from('reward_items').select('is_active').limit(5000)).filter(r => !r.is_active)).toEqual([])
  })
})

describe('NGƯỜI CHƯA ĐĂNG NHẬP (chỉ có khoá công khai) không đọc được dữ liệu học sinh', () => {
  it.each(['profiles', 'lesson_submissions', 'messages', 'exam_sessions', 'student_enrollments'])('%s', async bang => {
    const lạ = createClient(env.NEON_DATA_URL, env.VITE_SUPABASE_ANON_KEY, { accessToken: async () => null })
    const r = await lạ.from(bang).select('*').limit(5)
    expect(r.error || r.data.length === 0, JSON.stringify(r.data?.slice(0, 1))).toBeTruthy()
  })
})

describe('HỌC SINH không tự sửa được vai trò, sticker, khoá tài khoản', () => {
  it.each([
    ['tự lên giáo viên', { role: 'teacher' }],
    ['tự cộng sticker', () => ({ sticker_count: (anh.hoSo.sticker_count || 0) + 1000 })],
    ['tự cộng sticker tích luỹ', () => ({ sticker_total: (anh.hoSo.sticker_total || 0) + 1000 })],
    ['tự sửa chuỗi ngày học', { streak_days: 999 }],
    ['tự sửa / xoá cảnh báo ghi chép của thầy', () => ({ notes_warning: anh.hoSo.notes_warning ? null : DAU })],
    ['tự khoá / bỏ duyệt tài khoản', () => ({ is_active: !anh.hoSo.is_active, is_approved: !anh.hoSo.is_approved })],
  ])('%s → bị chặn', async (_, thayDoi) => {
    const doi = typeof thayDoi === 'function' ? thayDoi() : thayDoi
    // chỉ thử cột thật sự khác giá trị hiện có (cùng giá trị thì trigger không cần chặn)
    const khac = Object.fromEntries(Object.entries(doi).filter(([k, v]) => anh.hoSo[k] !== v))
    expect(Object.keys(khac).length, 'phải thử đổi ít nhất 1 cột').toBeGreaterThan(0)
    biChan(await hs.from('profiles').update(khac).eq('id', me).select('id'))
  })
  it('không sửa được hồ sơ học sinh khác', async () => {
    khongDong(await hs.from('profiles').update({ full_name: nguoiKhac.hoSo.full_name }).eq('id', nguoiKhac.hoSo.id).select('id'))
  })
})

describe('HỌC SINH không tự chấm điểm', () => {
  it('không tự sửa điểm bài nộp thực hành của mình', async () => {
    const b = anh.baiNop[0]
    if (!b) return console.warn('(tài khoản thử chưa có bài nộp — bỏ qua)')
    biChan(await hs.from('lesson_submissions').update({ score: b.score === 10 ? 9 : 10 }).eq('id', b.id).select('id'))
  })
  it('không sửa được bài nộp của bạn khác', async () => {
    khongDong(await hs.from('lesson_submissions').update({ teacher_comment: nguoiKhac.baiNop.teacher_comment })
      .eq('id', nguoiKhac.baiNop.id).select('id'))
  })
  it('không tự sửa điểm thi thực hành / số lần nộp Python', async () => {
    const b = anh.baiThi[0]
    if (!b) return console.warn('(tài khoản thử chưa có bài thi — bỏ qua)')
    const r = await hs.from('exam_sessions').update({ practical_score: 10 }).eq('id', b.id).select('id')
    // bài đã nộp: RLS lọc (0 dòng); bài đang làm: trigger chặn (42501)
    expect(r.error?.code === '42501' || (r.data || []).length === 0).toBe(true)
  })
  it('không tự ghi sticker đã thưởng', async () => {
    biChan(await hs.from('sticker_awards').insert({ user_id: me, award_key: DAU, amount: 100 }))
  })
  it('không tự tạo yêu cầu đổi quà (phải qua hàm máy chủ redeem_reward)', async () => {
    const r = await hs.from('reward_requests').insert({ student_id: me, status: 'approved' }).select('id')
    expect(r.error).toBeTruthy()
  })
})

describe('HỌC SINH không sửa được nội dung của giáo viên', () => {
  it('không tạo bài học', async () => biChan(await hs.from('lessons').insert({ title: DAU, grade: '3' })))
  it('không sửa bài học', async () =>
    khongDong(await hs.from('lessons').update({ is_published: nguoiKhac.bai.is_published }).eq('id', nguoiKhac.bai.id).select('id')))
  it('không sửa câu hỏi', async () =>
    khongDong(await hs.from('questions').update({ hint: nguoiKhac.cau.hint }).eq('id', nguoiKhac.cau.id).select('id')))
  it('không xoá câu hỏi', async () =>
    khongDong(await hs.from('questions').delete().eq('id', nguoiKhac.cau.id).select('id')))
  it('không thêm test chấm thi', async () => biChan(await hs.from('exam_tests').insert({ input: DAU, expected: '1' })))
  it('không tự duyệt ghi danh của mình', async () =>
    khongDong(await hs.from('student_enrollments').update({ is_approved: true }).eq('user_id', me).eq('is_approved', false).select('user_id')))
  it('không tự thêm mình vào danh sách được xem bài giới hạn', async () => {
    if (!nguoiKhac.baiGioiHan) return
    biChan(await hs.from('lesson_visibility').insert({ lesson_id: nguoiKhac.baiGioiHan.id, user_id: me }))
  })
  it('không xoá danh sách người xem của bài', async () => {
    if (!nguoiKhac.xem) return
    khongDong(await hs.from('lesson_visibility').delete().eq('lesson_id', nguoiKhac.xem.lesson_id).select('lesson_id'))
  })
  it('không giả tin nhắn của giáo viên', async () =>
    biChan(await hs.from('messages').insert({ student_id: me, sender_role: 'teacher', content: DAU })))
})

// ── Lỗ hổng ĐÃ BIẾT, để vá ở bước 5 (vá bảo mật đợt 3) — hiện CHƯA chặn, ghi ra để không quên ──
describe('đã biết, chưa vá (bước 5)', () => {
  it.todo('học sinh đọc được đáp án đúng (questions.correct_answer) → máy chủ phải tự chấm quiz / thi lý thuyết')
  it.todo('học sinh đọc được bài chưa xuất bản, tài liệu AI, tiêu chí chấm (lessons đọc mở cho mọi tài khoản)')
  it.todo('học sinh tự ghi điểm thi lý thuyết (exam_sessions.score) và tiến độ quiz (lesson_progress) khi chưa nộp')
})
