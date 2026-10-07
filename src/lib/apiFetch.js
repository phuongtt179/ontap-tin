import { supabase } from './supabase'

// Gọi API serverless (/api/...) kèm access token của phiên đăng nhập — máy chủ dùng nó để xác minh
// người gọi là ai, vai trò gì (xem api/_auth.js). Trả về Response như fetch.
export async function apiFetch(path, body) {
  const { data: { session } } = await supabase.auth.getSession()
  return fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token && { Authorization: `Bearer ${session.access_token}` }),
    },
    body: JSON.stringify(body),
  })
}
