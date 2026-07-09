import crypto from 'crypto'

export const config = { maxDuration: 15 }

// Tách resource_type + public_id từ secure_url của Cloudinary
function parseTarget(url) {
  url = String(url || '')
  const rt = url.match(/\/(image|raw|video)\/upload\//)
  if (!rt) return null
  const resource_type = rt[1]
  let after = url.slice(url.indexOf('/upload/') + '/upload/'.length).split('?')[0]
  // Bỏ segment version (vd: v1700000000/) nếu có
  const parts = after.split('/').filter(p => !/^v\d+$/.test(p))
  let public_id = parts.join('/')
  // Ảnh: public_id KHÔNG kèm đuôi; raw/video: GIỮ nguyên đuôi
  if (resource_type === 'image') public_id = public_id.replace(/\.[^/.]+$/, '')
  return { resource_type, public_id }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { url } = req.body || {}
  const target = parseTarget(url)
  if (!target || !target.public_id) return res.status(400).json({ error: 'bad_url' })

  const cloud = process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET
  if (!cloud || !apiKey || !apiSecret) return res.status(500).json({ error: 'no_config' })

  // Ký chữ ký cho lệnh destroy
  const timestamp = Math.floor(Date.now() / 1000)
  const toSign = `public_id=${target.public_id}&timestamp=${timestamp}`
  const signature = crypto.createHash('sha1').update(toSign + apiSecret).digest('hex')

  const form = new URLSearchParams({
    public_id: target.public_id,
    api_key: apiKey,
    timestamp: String(timestamp),
    signature,
  })

  let r
  try {
    r = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/${target.resource_type}/destroy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    })
  } catch {
    return res.status(500).json({ error: 'network' })
  }

  const data = await r.json().catch(() => ({}))
  // data.result: 'ok' (đã xóa) | 'not found' (đã không còn)
  return res.status(200).json({ result: data.result || 'unknown' })
}
