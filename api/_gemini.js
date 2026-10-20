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
const isOverloaded = res => res && (res.status === 503 || res.status === 500 || res.status === 504)

// thinkingConfig.thinkingBudget là tham số của dòng 2.5 — bỏ đi khi chuyển sang model khác cho chắc.
// Model 2.5 dùng làm DỰ PHÒNG mà payload không nói gì về "suy nghĩ" → tắt suy nghĩ: mặc định 2.5-flash
// suy nghĩ rất lâu (chấm 1 bài 30–50 giây, học sinh tưởng không có điểm rồi đóng trang).
function payloadFor(model, payload, duPhong = false) {
  try {
    const p = JSON.parse(payload)
    if (model.startsWith('gemini-2.5')) {
      if (!duPhong || p.generationConfig?.thinkingConfig) return payload
      p.generationConfig = { ...(p.generationConfig || {}), thinkingConfig: { thinkingBudget: 0 } }
    } else if (p.generationConfig?.thinkingConfig) delete p.generationConfig.thinkingConfig
    return JSON.stringify(p)
  } catch { return payload }
}

// Gọi Gemini generateContent: tự xoay vòng key khi gặp 429; model chính quá tải thì thử lại 1 lần
// rồi lần lượt chuyển sang model dự phòng. Trả về đối tượng Response (chưa đọc body) để caller tự xử lý;
// res.aiModel / res.aiTries cho biết model nào đã trả lời và sau mấy lần gọi (để chẩn đoán chậm).
// primaryTimeoutMs (tuỳ chọn, cho việc cần trả lời nhanh như chấm bài / trợ giảng): model chính quá thời gian
// này chưa trả lời thì bỏ, chuyển ngay sang model dự phòng (20/10/2026 3.1-flash-lite có lúc mất ~20 giây/lần).
export async function callGeminiRotate({ model, keys, payload, primaryTimeoutMs }) {
  let tries = 1
  const xong = (r, m) => { if (r) { r.aiModel = m; r.aiTries = tries } return r }
  let res = await callModel({ model, keys, payload: payloadFor(model, payload), timeoutMs: primaryTimeoutMs })
  if (!res?.timedOut) {
    if (!isOverloaded(res)) return xong(res, model)
    await new Promise(r => setTimeout(r, 1200))
    tries++
    res = await callModel({ model, keys, payload: payloadFor(model, payload), timeoutMs: primaryTimeoutMs })
  }
  const chinhQuaGio = !!res?.timedOut
  let dung = model
  for (const fb of FALLBACKS.filter(m => m !== model)) {
    if (!isOverloaded(res) && !res?.timedOut) return xong(res, dung)
    tries++; dung = fb
    res = await callModel({ model: fb, keys, payload: payloadFor(fb, payload, true) })
  }
  // Đã bỏ model chính vì chậm mà dự phòng cũng không dùng được (hết lượt ngày / quá tải) → quay lại
  // chờ model chính, lần này không giới hạn thời gian (chậm còn hơn báo lỗi)
  if (chinhQuaGio && (res.status === 429 || isOverloaded(res))) {
    tries++; dung = model
    res = await callModel({ model, keys, payload: payloadFor(model, payload) })
  }
  return xong(res, dung)
}

// Kết quả giả khi quá thời gian chờ (để vòng lặp dự phòng xử lý như lỗi quá tải)
const hetGio = () => ({ status: 504, ok: false, timedOut: true, json: async () => ({ error: 'timeout' }), clone() { return this } })

async function callModel({ model, keys, payload, timeoutMs }) {
  const attempt = async key => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`
    const init = { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload }
    if (!timeoutMs) return fetch(url, init)
    try {
      // Có giới hạn thời gian: đọc trọn nội dung ngay trong thời hạn (tránh bị cắt ngang lúc caller đọc sau)
      const r = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) })
      return new Response(await r.arrayBuffer(), { status: r.status, headers: r.headers })
    } catch (e) {
      if (e?.name === 'TimeoutError' || e?.name === 'AbortError') return hetGio()
      throw e
    }
  }

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
