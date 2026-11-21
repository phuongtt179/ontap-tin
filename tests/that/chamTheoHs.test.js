// KIỂM TRA TRÊN DỮ LIỆU THẬT (Neon) — trang Chấm bài, chế độ "Theo học sinh": chỉ lấy bài của KHOÁ ĐANG CHỌN.
// Lỗi cũ (15/11/2026): em học nhiều khoá → chọn 1 khoá vẫn hiện bài của mọi khoá.
// Chỉ ĐỌC (không ghi gì). Đăng nhập giáo viên, gọi đúng hàm src/data/ app dùng; đối chiếu bằng tài khoản chủ.
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'
import pg from 'pg'

const env = Object.fromEntries(readFileSync('.env', 'utf8').split(/\r?\n/)
  .map(l => l.match(/^\s*([A-Z_]+)\s*=\s*['"]?([^'"\s]*)/)).filter(Boolean).map(m => [m[1], m[2]]))
const coDu = env.GV_EMAIL && env.GV_MAT_KHAU

const ctx = { ai: null }
vi.mock('../../src/lib/supabase', () => ({ supabase: { from: (...a) => ctx.ai.from(...a), rpc: (...a) => ctx.ai.rpc(...a) } }))
import { layBaiNopDeChamTheoHs } from '../../src/data/baiNop'
import { layBaiThucHanhTheoKhoa } from '../../src/data/baiHoc'
import { nhomBaiTheoChuDe } from '../../src/domain/thuTuBaiHoc'
import { nhomBaiNopTheoMuc } from '../../src/domain/chamBai'

let chu, em   // em = học sinh có bài nộp ở ≥ 2 khoá: { user_id, khoa: [{ grade, so }] }

beforeAll(async () => {
  if (!coDu) return
  const auth = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: false } })
  const { data, error } = await auth.auth.signInWithPassword({ email: env.GV_EMAIL, password: env.GV_MAT_KHAU })
  if (error) throw error
  const token = data.session.access_token
  ctx.ai = createClient(env.NEON_DATA_URL, env.VITE_SUPABASE_ANON_KEY, { accessToken: async () => token })
  chu = new pg.Client({ connectionString: env.NEON_DATABASE_URL.replace('sslmode=require', 'sslmode=verify-full') })
  await chu.connect()
  const { rows } = await chu.query(`
    select s.user_id, json_agg(json_build_object('grade', x.grade, 'so', x.so)) khoa from (
      select s.user_id, l.grade, count(*)::int so from lesson_submissions s join lessons l on l.id = s.lesson_id group by 1, 2
    ) x join (select distinct user_id from lesson_submissions) s using (user_id)
    group by s.user_id having count(*) >= 2 order by count(*) desc limit 1`)
  em = rows[0]
}, 30000)

afterAll(async () => { await chu?.end() })

describe.skipIf(!coDu)('Chấm bài — theo học sinh', () => {
  it('có học sinh nộp bài ở ≥ 2 khoá để thử', () => expect(em?.khoa.length).toBeGreaterThanOrEqual(2))

  it('mỗi khoá chỉ ra bài của khoá đó, đủ số bài', async () => {
    for (const { grade, so } of em.khoa) {
      const { data, error } = await layBaiNopDeChamTheoHs(em.user_id, grade)
      expect(error).toBeNull()
      expect(data.length).toBe(Math.min(so, 500))
      const ids = [...new Set(data.map(s => s.lesson_id))]
      const { rows } = await chu.query('select distinct grade from lessons where id = any($1)', [ids])
      expect(rows.map(r => r.grade)).toEqual([grade])
      expect(data[0]).not.toHaveProperty('lessons')   // cột phụ để lọc đã bỏ
    }
  }, 60000)

  it('xếp theo mục: mọi bài nộp đều vào đúng 1 nhóm, không sót', async () => {
    const { grade } = em.khoa[0]
    const [{ data }, { baiHoc, donVi }] = await Promise.all([layBaiNopDeChamTheoHs(em.user_id, grade), layBaiThucHanhTheoKhoa(grade)])
    const nhom = nhomBaiNopTheoMuc(data, nhomBaiTheoChuDe(baiHoc, donVi))
    const tatCa = nhom.flatMap(g => g.bai.flatMap(b => b.subs.map(s => s.id)))
    expect(tatCa.sort()).toEqual(data.map(s => s.id).sort())
  }, 60000)
})
