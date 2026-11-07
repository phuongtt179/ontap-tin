import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

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

    // Chỉ giáo viên được xoá tài khoản (giống quyền canDelete trong app; trước 07/11/2026 khoá công khai cũng gọi được)
    const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
    const { data: { user: caller } } = await supabaseAdmin.auth.getUser(token)
    if (!caller) return json({ error: 'Cần đăng nhập bằng tài khoản giáo viên' }, 401)
    const { data: callerProfile } = await supabaseAdmin.from('profiles').select('role, is_active').eq('id', caller.id).single()
    if (!callerProfile || callerProfile.is_active === false || callerProfile.role !== 'teacher') {
      return json({ error: 'Chỉ giáo viên mới xoá được tài khoản' }, 403)
    }

    const { userId } = await req.json()
    if (userId === caller.id) return json({ error: 'Không thể tự xoá tài khoản đang đăng nhập' }, 400)
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (error) return json({ error: error.message }, 400)
    return json({ success: true })
  } catch (err) {
    return json({ error: err.message }, 500)
  }
})
