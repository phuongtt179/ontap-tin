// Xác minh người gọi API AI (file bắt đầu bằng "_" nên Vercel KHÔNG tạo route cho nó).
// Client gửi kèm access token của phiên Supabase ở header Authorization: Bearer <token>.

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

// Chế độ học sinh tương tác TRỰC TIẾP với AI (gia sư trả lời ngay, AI chấm ngay khi nộp).
// Mặc định TẮT — điều khoản Gemini API không cho dùng trong ứng dụng hướng tới người dưới 18 tuổi,
// nên học sinh chỉ nhận nội dung AI sau khi giáo viên duyệt. Bật lại bằng biến môi trường trên Vercel.
export function studentAiDirect() {
  return ['1', 'true', 'on'].includes(String(process.env.VITE_STUDENT_AI_DIRECT || '').toLowerCase())
}

export const STAFF = ['teacher', 'assistant']

// Trả về { id, role } nếu hợp lệ; nếu không thì tự trả lỗi 401/403 và trả về null.
// roles: danh sách vai trò được phép (bỏ trống = mọi tài khoản đã đăng nhập, đang hoạt động).
export async function requireUser(req, res, roles = null) {
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim()
  // Thiếu cấu hình trên máy chủ → báo lỗi riêng để dễ phát hiện (khác với token sai)
  if (!SUPABASE_URL || !ANON_KEY) {
    res.status(500).json({ error: 'auth_not_configured' })
    return null
  }
  if (!token) {
    res.status(401).json({ error: 'unauthorized' })
    return null
  }
  try {
    const u = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: ANON_KEY, Authorization: `Bearer ${token}` } })
    if (!u.ok) { res.status(401).json({ error: 'unauthorized' }); return null }
    const user = await u.json()
    const p = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}&select=role,is_active`,
      { headers: { apikey: ANON_KEY, Authorization: `Bearer ${token}` } })
    const [profile] = p.ok ? await p.json() : []
    if (!profile || profile.is_active === false) { res.status(403).json({ error: 'forbidden' }); return null }
    if (roles && !roles.includes(profile.role)) { res.status(403).json({ error: 'forbidden' }); return null }
    return { id: user.id, role: profile.role }
  } catch {
    res.status(503).json({ error: 'auth_unavailable' })
    return null
  }
}
