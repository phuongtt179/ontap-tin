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

    // Chỉ giáo viên / trợ giảng đang hoạt động mới được tạo tài khoản (trước 07/11/2026 khoá công khai cũng gọi được)
    const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
    const { data: { user: caller } } = await supabaseAdmin.auth.getUser(token)
    if (!caller) return json({ error: 'Cần đăng nhập bằng tài khoản giáo viên' }, 401)
    const { data: callerProfile } = await supabaseAdmin.from('profiles').select('role, is_active').eq('id', caller.id).single()
    if (!callerProfile || callerProfile.is_active === false || !['teacher', 'assistant'].includes(callerProfile.role)) {
      return json({ error: 'Không có quyền tạo tài khoản' }, 403)
    }

    const { email, password, metadata } = await req.json()
    // Trợ giảng chỉ tạo được tài khoản học sinh; tạo trợ giảng / giáo viên phải là giáo viên
    const role = metadata?.role || 'student'
    if (role !== 'student' && callerProfile.role !== 'teacher') {
      return json({ error: 'Chỉ giáo viên mới tạo được tài khoản trợ giảng' }, 403)
    }

    let userId: string | null = null

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: metadata,
    })

    if (error) {
      console.log('createUser error:', error.message)
      const { data: listData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
      const existing = listData?.users?.find((u: any) => u.email === email)
      if (existing) {
        userId = existing.id
      } else {
        return json({ error: error.message }, 400)
      }
    } else {
      userId = data.user?.id ?? null
    }

    if (userId) {
      // grade và class_name đã bị xoá khỏi profiles → dùng student_enrollments
      const profileData = {
        id: userId,
        full_name: metadata.full_name,
        role,
        username: metadata.username,
      }
      console.log('upserting profile:', JSON.stringify(profileData))
      const { error: upsertError } = await supabaseAdmin
        .from('profiles')
        .upsert(profileData, { onConflict: 'id' })
      if (upsertError) {
        console.log('upsert error:', upsertError.message, upsertError.details, upsertError.hint)
        return json({ error: 'Profile upsert failed: ' + upsertError.message }, 500)
      }
    }

    return json({ user: { id: userId } })
  } catch (err) {
    return json({ error: err.message }, 500)
  }
})
