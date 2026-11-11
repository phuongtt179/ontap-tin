// Tầng dữ liệu — bảng lessons / units. Trang không gọi thẳng supabase.from('lessons'), mà gọi các hàm ở đây
// (chọn sẵn đúng cột, có giới hạn dòng). Đổi cơ sở dữ liệu chỉ sửa tệp này.
import { supabase } from '../lib/supabase'

/** bài có phần thực hành của một khoá + đơn vị của khoá đó (để xếp thứ tự) — dùng ở trang Chấm bài */
export async function layBaiThucHanhTheoKhoa(grade) {
  const [bai, donVi] = await Promise.all([
    supabase.from('lessons').select('id, title, topic, unit_id, "order", created_at, practice_instructions')
      .eq('grade', grade).eq('has_practice', true).limit(1000),
    supabase.from('units').select('id, name, sort_order').eq('grade', grade).limit(500),
  ])
  if (bai.error) throw bai.error
  return { baiHoc: bai.data || [], donVi: donVi.data || [] }
}
