// Gọi THẬT hàm xử lý của từng API (máy chủ đăng nhập / AI được giả lập, không gọi mạng thật):
// người không đăng nhập và học sinh phải bị chặn đúng chỗ, TRƯỚC khi chạm tới AI hay cơ sở dữ liệu.
// Thêm API mới mà chưa khai báo ở QUYEN dưới đây → kiểm tra báo đỏ (buộc phải nghĩ "ai được gọi?").
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { readdirSync } from 'fs'

// nạp được mọi tệp API (trừ tệp bắt đầu bằng "_": không phải API)
const NAP = import.meta.glob(['./*.js', '!./_*.js'])

const QUYEN = {
  // chỉ giáo viên / trợ giảng
  'deleteFile.js': 'staff',
  'generate-lesson.js': 'staff',
  'grade.js': 'staff',
  'report-note.js': 'staff',
  'teacher-ai.js': 'staff',
  'teacher-assistant.js': 'staff',
  // mọi tài khoản đang hoạt động (bên trong tự kiểm tra tiếp: RLS theo thẻ của người gọi / bài thi của chính mình)
  'hoi-dap.js': 'dang_nhap',
  'ra-soat.js': 'dang_nhap',
  'thi-python.js': 'dang_nhap',
  // tắt cố định: học sinh không chat trực tiếp với AI tạo sinh
  'tutor.js': 'tat',
  // chỉ khoá bí mật của máy chủ (lịch tự chấm — hiện đã gỡ lịch)
  'grade-pending.js': 'khoa_may_chu',
}

beforeEach(() => {
  vi.resetModules()
  vi.stubEnv('SUPABASE_URL', 'https://auth.test')
  vi.stubEnv('SUPABASE_ANON_KEY', 'khoa-cong-khai')
  vi.stubEnv('VITE_NEON_DATA_URL', 'https://data.test')
  vi.stubEnv('GEMINI_API_KEY', 'gia')
  vi.stubEnv('CHAM_THI_DATABASE_URL', 'postgres://khong-duoc-goi.test/db')
})
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals() })

/** máy chủ giả: chỉ trả lời đăng nhập + hồ sơ; gọi bất cứ chỗ nào khác (AI, dữ liệu) bị ghi lại là "lọt" */
function mayChuGia() {
  const lot = []
  const f = vi.fn(async (url, init = {}) => {
    const token = String(init.headers?.Authorization || '').replace('Bearer ', '')
    if (url.startsWith('https://auth.test/auth/v1/user')) {
      return token === 'the-hoc-sinh' ? { ok: true, json: async () => ({ id: 'id-hs' }) } : { ok: false, json: async () => ({}) }
    }
    if (url.startsWith('https://data.test/rest/v1/profiles')) {
      return { ok: true, json: async () => [{ role: 'student', is_active: true }] }
    }
    if (url.startsWith('https://auth.test/auth/v1/admin/')) return { ok: false, json: async () => ({}) }
    lot.push(url)
    return { ok: false, status: 500, json: async () => ({}), text: async () => '' }
  })
  return { f, lot }
}

function goi(handler, { token, apikey } = {}) {
  const res = { code: 200, body: null }
  res.status = c => { res.code = c; return res }
  res.json = b => { res.body = b; return res }
  res.end = () => res
  res.setHeader = () => res
  const headers = {}
  if (token) headers.authorization = `Bearer ${token}`
  if (apikey) headers.apikey = apikey
  return Promise.resolve(handler({ method: 'POST', headers, body: { session_id: 'x', code: 'print(1)', lesson_id: 'x', cau_hoi: 'xin chào' }, query: {} }, res))
    .then(() => res)
}

describe('mọi API đều đã khai báo ai được gọi', () => {
  it('không có API nào chưa khai báo', () => {
    const cacApi = readdirSync(new URL('.', import.meta.url)).filter(f => f.endsWith('.js') && !f.startsWith('_'))
    expect(cacApi.filter(f => !(f in QUYEN))).toEqual([])
  })
})

describe.each(Object.entries(QUYEN))('%s (%s)', (tep, quyen) => {
  const nap = async () => (await NAP[`./${tep}`]()).default

  it('không đăng nhập → bị chặn, không chạm AI / dữ liệu', async () => {
    const { f, lot } = mayChuGia(); vi.stubGlobal('fetch', f)
    const res = await goi(await nap())
    expect([401, 403]).toContain(res.code)
    expect(lot).toEqual([])
  })

  if (quyen === 'staff' || quyen === 'tat') {
    it('học sinh đã đăng nhập → 403, không chạm AI / dữ liệu', async () => {
      const { f, lot } = mayChuGia(); vi.stubGlobal('fetch', f)
      const res = await goi(await nap(), { token: 'the-hoc-sinh' })
      expect(res.code).toBe(403)
      expect(lot).toEqual([])
    })
  }

  if (quyen === 'khoa_may_chu') {
    it('thẻ học sinh hoặc khoá công khai → 401', async () => {
      const { f, lot } = mayChuGia(); vi.stubGlobal('fetch', f)
      expect((await goi(await nap(), { token: 'the-hoc-sinh' })).code).toBe(401)
      expect((await goi(await nap(), { apikey: 'khoa-cong-khai' })).code).toBe(401)
      expect(lot).toEqual([])
    })
  }
})
