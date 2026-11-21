// Đọc định dạng nội dung câu hỏi (cột questions.question / options) — dùng chung cho mọi nơi hiển thị câu hỏi.
// Hàm thuần: không gọi mạng, không giao diện.

const KHOI_CODE = /```(\w*)\n?([\s\S]*?)```/g
const O_TRONG = '___'

/**
 * Câu điền chỗ trống / kéo thả từ: tách đề thành các mảnh để vẽ.
 * "___" là 1 ô trống; ô trống nằm trong khối ```code``` thì giữ nguyên khối code (code-with-blanks).
 * @returns { tokens: [{type:'text',content} | {type:'blank',index} | {type:'code',lang,content}
 *                     | {type:'code-with-blanks',lang,segs,startIdx}], soCho: số ô trống }
 */
export function tachChoTrong(deBai = '') {
  const tokens = []
  let soCho = 0
  const chu = txt => txt.split(O_TRONG).forEach((doan, i, arr) => {
    if (doan) tokens.push({ type: 'text', content: doan })
    if (i < arr.length - 1) tokens.push({ type: 'blank', index: soCho++ })
  })
  const re = new RegExp(KHOI_CODE.source, 'g')
  let cuoi = 0, m
  while ((m = re.exec(deBai)) !== null) {
    if (m.index > cuoi) chu(deBai.slice(cuoi, m.index))
    const code = m[2].replace(/\n$/, '')
    if (code.includes(O_TRONG)) {
      const segs = code.split(O_TRONG)
      tokens.push({ type: 'code-with-blanks', lang: m[1] || '', segs, startIdx: soCho })
      soCho += segs.length - 1
    } else {
      tokens.push({ type: 'code', lang: m[1] || '', content: code })
    }
    cuoi = m.index + m[0].length
  }
  if (cuoi < deBai.length) chu(deBai.slice(cuoi))
  return { tokens, soCho }
}

/**
 * Lựa chọn trắc nghiệm lưu nhiều kiểu (chuỗi, { key, text }, { A: '...' }, { text|value|label }) → [{ key, text, image_url }].
 * Thiếu khoá thì đặt A, B, C… theo thứ tự.
 */
export function chuanHoaLuaChon(options) {
  if (!Array.isArray(options)) return []
  return options.map((opt, i) => {
    const khoa = String.fromCharCode(65 + i)
    if (typeof opt === 'string') return { key: khoa, text: opt, image_url: '' }
    if (!opt || typeof opt !== 'object') return { key: khoa, text: String(opt ?? ''), image_url: '' }
    if (opt.key !== undefined && opt.text !== undefined) return opt
    const keys = Object.keys(opt)
    if (keys.length >= 1 && keys[0].length === 1) return { key: keys[0], text: opt[keys[0]], image_url: opt.image_url || '' }
    return { key: khoa, text: opt.text || opt.value || opt.label || '', image_url: opt.image_url || '' }
  })
}
