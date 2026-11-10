import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-du-lieu',
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

// Bản dùng Neon (trang gửi x-du-lieu: neon): hồ sơ / vai trò đọc ghi ở Neon bằng chính thẻ người gọi.
// Địa chỉ Neon lấy từ secret NEON_DATA_URL, không nhận từ trang gửi lên.
const NEON = Deno.env.get('NEON_DATA_URL') ?? ''
async function neonGoi(duong: string, token: string, init: RequestInit = {}) {
  const r = await fetch(`${NEON}/rest/v1/${duong}`, {
    ...init, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  })
  const t = await r.text()
  if (!r.ok) throw new Error(`Neon ${r.status}: ${t.slice(0, 200)}`)
  return t ? JSON.parse(t) : null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    // Dữ liệu (kể cả vai trò) đã ở Neon từ 07/11/2026 → luôn đọc vai trò ở Neon khi có NEON_DATA_URL, KHÔNG theo header
    // (08/11: kẻ tự đăng ký có thể khai vai trò teacher trong hồ sơ Supabase rồi bỏ header để qua kiểm tra).
    const dungNeon = !!NEON

    // Chỉ giáo viên được xoá tài khoản (giống quyền canDelete trong app; trước 07/11/2026 khoá công khai cũng gọi được)
    const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
    const { data: { user: caller } } = await supabaseAdmin.auth.getUser(token)
    if (!caller) return json({ error: 'Cần đăng nhập bằng tài khoản giáo viên' }, 401)
    const callerProfile = dungNeon
      ? (await neonGoi(`profiles?id=eq.${caller.id}&select=role,is_active`, token))?.[0]
      : (await supabaseAdmin.from('profiles').select('role, is_active').eq('id', caller.id).single()).data
    if (!callerProfile || callerProfile.is_active === false || callerProfile.role !== 'teacher') {
      return json({ error: 'Chỉ giáo viên mới xoá được tài khoản' }, 403)
    }

    const { userId } = await req.json()
    if (userId === caller.id) return json({ error: 'Không thể tự xoá tài khoản đang đăng nhập' }, 400)
    // Neon không có xoá dây chuyền từ auth.users → xoá dữ liệu ở Neon trước (hàm tự kiểm tra quyền người gọi)
    if (dungNeon) await neonGoi('rpc/xoa_nguoi_dung', token, { method: 'POST', body: JSON.stringify({ p_id: userId }) })
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (error) return json({ error: error.message }, 400)
    return json({ success: true })
  } catch (err) {
    return json({ error: err.message }, 500)
  }
})
