import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const { email, password, metadata } = await req.json()

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
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    } else {
      userId = data.user?.id ?? null
    }

    if (userId) {
      // grade và class_name đã bị xoá khỏi profiles → dùng student_enrollments
      const profileData = {
        id: userId,
        full_name: metadata.full_name,
        role: metadata.role || 'student',
        username: metadata.username,
      }
      console.log('upserting profile:', JSON.stringify(profileData))
      const { error: upsertError } = await supabaseAdmin
        .from('profiles')
        .upsert(profileData, { onConflict: 'id' })
      if (upsertError) {
        console.log('upsert error:', upsertError.message, upsertError.details, upsertError.hint)
        return new Response(JSON.stringify({ error: 'Profile upsert failed: ' + upsertError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    return new Response(JSON.stringify({ user: { id: userId } }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
