import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
// Công tắc chuyển dữ liệu sang Neon: có VITE_NEON_DATA_URL (vd https://ep-…apirest….neon.tech/neondb) thì
// from() / rpc() đọc ghi ở Neon, còn đăng nhập (auth) vẫn ở Supabase — Neon nhận thẻ đăng nhập của Supabase.
// Không có biến này → chạy y như trước, toàn bộ ở Supabase. Quay lại Supabase = xoá biến rồi build lại.
const neonDataUrl = import.meta.env.VITE_NEON_DATA_URL

const sb = createClient(supabaseUrl, supabaseAnonKey)

const neon = neonDataUrl
  ? createClient(neonDataUrl, supabaseAnonKey, {
      accessToken: async () => (await sb.auth.getSession()).data.session?.access_token ?? null,
    })
  : null

export const NOI_DU_LIEU = neon ? 'neon' : 'supabase'

export const supabase = neon
  ? { auth: sb.auth, from: (...a) => neon.from(...a), rpc: (...a) => neon.rpc(...a) }
  : sb
