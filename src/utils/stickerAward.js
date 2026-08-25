import { supabase } from '../lib/supabase'

// Cộng/trừ sticker theo kiểu "đọc rồi ghi có khoá" (compare-and-swap): đọc
// sticker_count hiện tại, ghi lại CHỈ KHI nó vẫn đúng bằng giá trị vừa đọc —
// nếu có nơi khác (2 tab, 2 lượt cộng gần nhau, học sinh vừa đổi quà...) vừa
// ghi đè xen giữa, update sẽ không khớp dòng nào và tự thử lại. Tránh kiểu
// ghi đè tuyệt đối "sticker_count = số cũ + delta" từng gây mất sticker khi
// 2 lượt ghi chồng lên nhau.
//
// `affectsTotal`: true khi đây là 1 lượt TRAO sticker mới (tăng luôn
// sticker_total, chỉ tiêu tích luỹ) — false khi chỉ điều chỉnh sticker_count
// hiện có (vd hoàn sticker vì từ chối yêu cầu đổi quà — sticker đó đã được
// tính vào sticker_total từ lúc trao ban đầu rồi, hoàn lại không tính thêm
// lần nữa).
// `minResultCount`: chặn không cho sticker_count sau khi cộng/trừ thấp hơn
// mức này (mặc định 0 — không cho âm). Trả về `insufficient: true` nếu chặn.
export async function adjustStickerCount(userId, delta, { affectsTotal = false, minResultCount = 0 } = {}) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: prof, error: readErr } = await supabase
      .from('profiles').select('sticker_count, sticker_total').eq('id', userId).single()
    if (readErr) return { data: null, error: readErr, insufficient: false }
    const baseCount = prof?.sticker_count ?? 0
    const baseTotal = prof?.sticker_total ?? 0
    const newCount = baseCount + delta
    if (newCount < minResultCount) {
      return { data: null, error: new Error('Số sticker không đủ'), insufficient: true }
    }
    const newTotal = affectsTotal ? baseTotal + delta : baseTotal
    const { data: updated, error: writeErr } = await supabase.from('profiles')
      .update({ sticker_count: newCount, sticker_total: newTotal })
      .eq('id', userId).eq('sticker_count', baseCount)
      .select('sticker_count, sticker_total')
    if (writeErr) return { data: null, error: writeErr, insufficient: false }
    if (updated && updated.length > 0) return { data: updated[0], error: null, insufficient: false }
    // 0 dòng khớp -> giá trị vừa bị đổi xen giữa, đọc lại và thử ghi lại
  }
  return { data: null, error: new Error('Không cập nhật được sticker sau nhiều lần thử, thử lại nhé'), insufficient: false }
}
