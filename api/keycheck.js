// TẠM THỜI — kiểm tra key Gemini đang dùng + model + tình trạng 429.
// Truy cập /api/keycheck rồi XÓA file này sau khi kiểm tra xong.
export const config = { maxDuration: 15 }

export default async function handler(req, res) {
  const key = process.env.GEMINI_API_KEY
  if (!key) return res.status(200).json({ ok: false, message: 'GEMINI_API_KEY chưa cấu hình trên Vercel' })

  // Che bớt key để nhận diện mà không lộ toàn bộ
  const preview = key.length > 12 ? `${key.slice(0, 8)}…${key.slice(-4)}` : '***'
  const out = { keyPreview: preview, keyLength: key.length, model: 'gemini-3.1-flash-lite' }

  // 1) Liệt kê model khả dụng (không tốn quota generate)
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`)
    const j = await r.json().catch(() => ({}))
    out.modelsStatus = r.status
    if (Array.isArray(j.models)) {
      const names = j.models.map(m => m.name.replace('models/', ''))
      out.hasConfiguredModel = names.includes('gemini-3.1-flash-lite')
      out.flashModels = names.filter(n => n.includes('flash')).slice(0, 25)
    } else {
      out.modelsError = j.error?.message || j
    }
  } catch (e) { out.modelsError = String(e) }

  // 2) Thử gọi 1 lần để xem có bị 429 / lỗi gì không
  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: 'hi' }] }], generationConfig: { maxOutputTokens: 8 } }),
      }
    )
    out.testStatus = r.status
    if (r.ok) out.testOk = true
    else { const j = await r.json().catch(() => ({})); out.testError = j.error?.message || j }
  } catch (e) { out.testError = String(e) }

  res.status(200).json(out)
}
