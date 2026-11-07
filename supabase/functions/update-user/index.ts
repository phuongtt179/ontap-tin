import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Chỉ giáo viên / trợ giảng đang hoạt động mới được đổi mật khẩu người khác
  // (trước 07/11/2026 khoá công khai cũng gọi được → ai cũng đổi được mật khẩu bất kỳ tài khoản nào)
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
  const { data: { user: caller } } = await supabase.auth.getUser(token)
  if (!caller) return json({ error: 'Cần đăng nhập bằng tài khoản giáo viên' }, 401)
  const { data: callerProfile } = await supabase.from('profiles').select('role, is_active').eq('id', caller.id).single()
  if (!callerProfile || callerProfile.is_active === false || !['teacher', 'assistant'].includes(callerProfile.role)) {
    return json({ error: 'Không có quyền đổi mật khẩu' }, 403)
  }

  const { userId, password } = await req.json()
  if (!userId || !password) return json({ error: 'Thiếu userId hoặc password' }, 400)

  // Trợ giảng chỉ đổi được mật khẩu học sinh; mật khẩu giáo viên / trợ giảng do giáo viên đổi
  if (callerProfile.role !== 'teacher') {
    const { data: target } = await supabase.from('profiles').select('role').eq('id', userId).single()
    if (!target || target.role !== 'student') return json({ error: 'Chỉ giáo viên mới đổi được mật khẩu tài khoản này' }, 403)
  }

  const { error } = await supabase.auth.admin.updateUserById(userId, { password })
  if (error) return json({ error: error.message }, 400)
  return json({ success: true })
})
