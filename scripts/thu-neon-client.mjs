// Thử cách nối của src/lib/supabase.js ở chế độ Neon: đăng nhập Supabase, dữ liệu qua Data API của Neon.
//   node scripts/thu-neon-client.mjs
// Dùng tài khoản thử: email và mật khẩu lấy từ .env (THU_EMAIL, THU_MAT_KHAU) — không ghi trong code.
// Cần VITE_NEON_DATA_URL trong .env. Chỉ ĐỌC, trừ 1 lần upsert lesson_progress trên Neon (bản thử).
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const env = readFileSync(new URL('../.env', import.meta.url), 'utf8')
const lay = k => env.match(new RegExp(`^\\s*${k}\\s*=\\s*(\\S+)`, 'm'))?.[1]
const NEON = lay('VITE_NEON_DATA_URL')
if (!NEON || !lay('THU_EMAIL') || !lay('THU_MAT_KHAU')) { console.log('Thiếu VITE_NEON_DATA_URL / THU_EMAIL / THU_MAT_KHAU trong .env'); process.exit(1) }

const sb = createClient(lay('VITE_SUPABASE_URL'), lay('VITE_SUPABASE_ANON_KEY'), { auth: { persistSession: false } })
const du = createClient(NEON, lay('VITE_SUPABASE_ANON_KEY'), {
  accessToken: async () => (await sb.auth.getSession()).data.session?.access_token ?? null,
})

const kq = (ten, { data, error, count, status }) =>
  console.log(ten.padEnd(40), error ? `LỖI ${error.code || ''} ${error.message}` : `ok ${status}`, count != null ? `count=${count}` : '', Array.isArray(data) ? `${data.length} dòng` : JSON.stringify(data)?.slice(0, 80))

kq('Chưa đăng nhập: đọc grades', await du.from('grades').select('value'))
const { data: dn, error } = await sb.auth.signInWithPassword({ email: lay('THU_EMAIL'), password: lay('THU_MAT_KHAU') })
if (error) { console.log('Đăng nhập lỗi', error.message); process.exit(1) }
const uid = dn.user.id
kq('Đếm bài nộp (count exact, head)', await du.from('lesson_submissions').select('id', { count: 'exact', head: true }))
kq('Hồ sơ của mình (maybeSingle)', await du.from('profiles').select('role, full_name').eq('id', uid).maybeSingle())
kq('Bài học + join units (order)', await du.from('lessons').select('id, title, units(name)').eq('is_published', true).order('order').limit(3))
kq('rpc current_user_role', await du.rpc('current_user_role'))
kq('rpc get_class_leaderboard', await du.rpc('get_class_leaderboard'))
kq('Lọc or + in + is null', await du.from('lesson_submissions').select('id').eq('user_id', uid).or('score.is.null,score.gte.0').in('lesson_id', ['00000000-0000-0000-0000-000000000000']).is('reviewed_at', null))
const { data: ls } = await du.from('lessons').select('id').eq('is_published', true).limit(1)
kq('upsert lesson_progress (ghi Neon)', await du.from('lesson_progress').upsert({ user_id: uid, lesson_id: ls[0].id, pptx_viewed: true }, { onConflict: 'user_id,lesson_id' }).select('id'))
kq('Sửa điểm bài mình (phải bị chặn)', await du.from('lesson_submissions').update({ score: 10 }).eq('user_id', uid).select('id'))
await sb.auth.signOut()
