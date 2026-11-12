// Tầng dữ liệu — tài khoản đăng nhập (Supabase Auth) qua Edge Function create-user / update-user / delete-user.
// Máy chủ tự kiểm tra người gọi là giáo viên (khoá quản trị chỉ nằm ở máy chủ, không ở trang web).
// Mỗi hàm NÉM lỗi (Error có câu dễ hiểu) khi máy chủ từ chối.
import { NOI_DU_LIEU } from '../lib/supabase'
import { maDangNhap } from '../lib/maDangNhap'

async function goi(ten, body, loiMacDinh) {
  const url = import.meta.env.VITE_SUPABASE_URL
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (!url || !anonKey) throw new Error('Chưa cấu hình VITE_SUPABASE_URL hoặc VITE_SUPABASE_ANON_KEY')
  const res = await fetch(`${url}/functions/v1/${ten}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await maDangNhap()}`, 'x-du-lieu': NOI_DU_LIEU, apikey: anonKey },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || data.message || loiMacDinh)
  return data
}

/** tạo tài khoản (metadata: full_name, role, …) → user vừa tạo */
export async function taoTaiKhoan(email, password, metadata) {
  return (await goi('create-user', { email, password, metadata }, 'Lỗi tạo tài khoản')).user
}

/** đổi thông tin đăng nhập (vd { password }) */
export async function suaTaiKhoan(userId, thayDoi) {
  await goi('update-user', { userId, ...thayDoi }, 'Lỗi cập nhật tài khoản')
}

/** xoá hẳn tài khoản */
export async function xoaTaiKhoan(userId) {
  await goi('delete-user', { userId }, 'Lỗi xóa tài khoản')
}
