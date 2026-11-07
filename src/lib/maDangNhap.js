import { supabase } from './supabase'

// Thẻ đăng nhập của người đang dùng — các chức năng quản lý tài khoản (create/update/delete-user)
// kiểm tra thẻ này là giáo viên / trợ giảng. Trước 07/11/2026 gửi khoá công khai nên ai cũng gọi được.
export async function maDangNhap() {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('Phiên đăng nhập đã hết, thầy cô đăng nhập lại nhé')
  return token
}
