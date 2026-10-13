// Tiện ích dùng chung: xoay vòng nhiều API key Gemini để né giới hạn ngày (RPD).
// File bắt đầu bằng "_" nên Vercel KHÔNG tạo route cho nó.

// Lấy tất cả key đã cấu hình: GEMINI_API_KEY, GEMINI_API_KEY_2 ... GEMINI_API_KEY_6
export function getGeminiKeys() {
  const keys = []
  const push = v => { if (v && v.trim()) keys.push(v.trim()) }
  push(process.env.GEMINI_API_KEY)
  for (let i = 2; i <= 6; i++) push(process.env[`GEMINI_API_KEY_${i}`])
  return keys
}

// Nhận diện lỗi 429 do hết hạn mức NGÀY (RPD) — để phân biệt với giới hạn/phút (RPM)
export const isDailyLimit = obj => /daily|per[_ ]?day|perday|rpd|quota.*day/i.test(JSON.stringify(obj || {}))

// Model dự phòng khi model chính bị Google báo quá tải (503 "high demand") hoặc lỗi máy chủ 500
const FALLBACKS = ['gemini-2.5-flash', 'gemini-3.1-flash-lite']   // (2.5-flash-lite đã bị Google ngừng — 404)
const isOverloaded = res => res && (res.status === 503 || res.status === 500)

// thinkingConfig.thinkingBudget là tham số của dòng 2.5 — bỏ đi khi chuyển sang model khác cho chắc
function payloadFor(model, payload) {
  if (model.startsWith('gemini-2.5')) return payload
  try {
    const p = JSON.parse(payload)
    if (p.generationConfig?.thinkingConfig) delete p.generationConfig.thinkingConfig
    return JSON.stringify(p)
  } catch { return payload }
}

// Gọi Gemini generateContent: tự xoay vòng key khi gặp 429; model chính quá tải thì thử lại 1 lần
// rồi lần lượt chuyển sang model dự phòng. Trả về đối tượng Response (chưa đọc body) để caller tự xử lý.
export async function callGeminiRotate({ model, keys, payload }) {
  let res = await callModel({ model, keys, payload: payloadFor(model, payload) })
  if (!isOverloaded(res)) return res
  await new Promise(r => setTimeout(r, 1200))
  res = await callModel({ model, keys, payload: payloadFor(model, payload) })
  for (const fb of FALLBACKS.filter(m => m !== model)) {
    if (!isOverloaded(res)) return res
    res = await callModel({ model: fb, keys, payload: payloadFor(fb, payload) })
  }
  return res
}

async function callModel({ model, keys, payload }) {
  const attempt = key => fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload }
  )

  // Xáo trộn thứ tự key → mỗi lần gọi random chọn 1 key; key nào hết lượt mới nhảy sang key khác
  const order = [...keys].sort(() => Math.random() - 0.5)

  let last = null
  for (const key of order) {
    const res = await attempt(key)
    if (res.status !== 429) return res     // thành công, hoặc lỗi khác 429 → trả luôn
    last = res                              // key này hết lượt → thử key kế tiếp
  }

  // Tất cả key đều 429: nếu là giới hạn theo PHÚT (không phải theo ngày) thì chờ rồi thử lại 1 lần
  if (last && order.length) {
    const eb = await last.clone().json().catch(() => ({}))
    if (!isDailyLimit(eb)) {
      await new Promise(r => setTimeout(r, 5000))
      return attempt(order[0])
    }
  }
  return last
}
