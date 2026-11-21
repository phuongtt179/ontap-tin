// Kiểm tra cổng quyền requireUser mà mọi API đi qua — giả lập máy chủ đăng nhập, không gọi mạng thật.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

let requireUser, STAFF

beforeEach(async () => {
  vi.resetModules()
  vi.stubEnv('SUPABASE_URL', 'https://auth.test')
  vi.stubEnv('SUPABASE_ANON_KEY', 'khoa-cong-khai')
  vi.stubEnv('VITE_NEON_DATA_URL', 'https://data.test')
  ;({ requireUser, STAFF } = await import('./_auth.js'))
})
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals() })

function resGia() {
  const r = { code: null, body: null }
  r.status = c => { r.code = c; return r }
  r.json = b => { r.body = b; return r }
  return r
}
const req = token => ({ headers: token ? { authorization: `Bearer ${token}` } : {} })

/** máy chủ giả: token 'hs' = học sinh, 'gv' = giáo viên, 'tg' = trợ giảng, 'khoa' = bị khoá, 'mat' = không có hồ sơ */
function mayChuGia() {
  const nguoi = { hs: 'student', gv: 'teacher', tg: 'assistant', khoa: 'student', mat: null }
  return vi.fn(async (url, { headers }) => {
    const token = headers.Authorization.replace('Bearer ', '')
    if (url.startsWith('https://auth.test/auth/v1/user')) {
      return token in nguoi ? { ok: true, json: async () => ({ id: `id-${token}` }) } : { ok: false, json: async () => ({}) }
    }
    if (url.startsWith('https://data.test/rest/v1/profiles')) {
      expect(url).toContain(`id=eq.id-${token}`)   // chỉ đọc hồ sơ của CHÍNH người gửi thẻ
      const role = nguoi[token]
      return { ok: true, json: async () => (role ? [{ role, is_active: token !== 'khoa' }] : []) }
    }
    throw new Error('gọi địa chỉ lạ: ' + url)
  })
}

describe('requireUser', () => {
  it('không gửi thẻ đăng nhập → 401, không gọi máy chủ', async () => {
    const f = mayChuGia(); vi.stubGlobal('fetch', f)
    const res = resGia()
    expect(await requireUser(req(null), res)).toBeNull()
    expect(res.code).toBe(401)
    expect(f).not.toHaveBeenCalled()
  })

  it('thẻ giả / hết hạn → 401', async () => {
    vi.stubGlobal('fetch', mayChuGia())
    const res = resGia()
    expect(await requireUser(req('gia-mao'), res)).toBeNull()
    expect(res.code).toBe(401)
  })

  it('chỉ có khoá công khai (anon key) làm thẻ → 401', async () => {
    vi.stubGlobal('fetch', mayChuGia())
    const res = resGia()
    expect(await requireUser(req('khoa-cong-khai'), res)).toBeNull()
    expect(res.code).toBe(401)
  })

  it('tài khoản bị khoá → 403', async () => {
    vi.stubGlobal('fetch', mayChuGia())
    const res = resGia()
    expect(await requireUser(req('khoa'), res)).toBeNull()
    expect(res.code).toBe(403)
  })

  it('đăng nhập được nhưng không có hồ sơ → 403', async () => {
    vi.stubGlobal('fetch', mayChuGia())
    const res = resGia()
    expect(await requireUser(req('mat'), res)).toBeNull()
    expect(res.code).toBe(403)
  })

  it('HỌC SINH gọi API của giáo viên → 403', async () => {
    vi.stubGlobal('fetch', mayChuGia())
    const res = resGia()
    expect(await requireUser(req('hs'), res, STAFF)).toBeNull()
    expect(res.code).toBe(403)
  })

  it('giáo viên / trợ giảng gọi API của giáo viên → được', async () => {
    vi.stubGlobal('fetch', mayChuGia())
    expect(await requireUser(req('gv'), resGia(), STAFF)).toEqual({ id: 'id-gv', role: 'teacher' })
    expect(await requireUser(req('tg'), resGia(), STAFF)).toEqual({ id: 'id-tg', role: 'assistant' })
  })

  it('học sinh gọi API mở cho mọi người đã đăng nhập → được, kèm đúng id', async () => {
    vi.stubGlobal('fetch', mayChuGia())
    expect(await requireUser(req('hs'), resGia())).toEqual({ id: 'id-hs', role: 'student' })
  })

  it('máy chủ đăng nhập không trả lời → 503, không cho qua', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('mất mạng') }))
    const res = resGia()
    expect(await requireUser(req('gv'), res, STAFF)).toBeNull()
    expect(res.code).toBe(503)
  })

  it('máy chủ thiếu cấu hình → 500, không cho qua', async () => {
    vi.resetModules()
    vi.stubEnv('SUPABASE_URL', '')
    vi.stubEnv('VITE_SUPABASE_URL', '')
    const { requireUser: ru } = await import('./_auth.js')
    const res = resGia()
    expect(await ru(req('gv'), res)).toBeNull()
    expect(res.code).toBe(500)
  })
})

describe('học sinh dưới lớp 8 không tương tác trực tiếp với AI tạo sinh', () => {
  it('studentAiDirect luôn tắt, kể cả khi đặt biến môi trường', async () => {
    vi.resetModules()
    vi.stubEnv('VITE_STUDENT_AI_DIRECT', 'true')
    const { studentAiDirect } = await import('./_auth.js')
    expect(studentAiDirect()).toBe(false)
  })
})
