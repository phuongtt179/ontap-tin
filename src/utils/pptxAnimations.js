// Đọc HIỆU ỨNG (animation) và CHUYỂN TRANG (transition) từ XML 1 slide PowerPoint để AI chấm bài
// "biết" học sinh đã làm gì — trước đây AI chỉ thấy chữ/định dạng/ảnh nên không chấm được bài Animation.
// Hàm thuần xử lý chuỗi (không phụ thuộc trình duyệt) để test được bằng Node.

// Tên hiệu ứng theo presetID của PowerPoint — chỉ ghi những mã chắc chắn, mã lạ thì báo "mã N"
const ENTRANCE = { 1: 'Appear', 2: 'Fly In', 3: 'Blinds', 4: 'Box', 5: 'Checkerboard', 6: 'Circle', 8: 'Diamond', 9: 'Dissolve In',
  10: 'Fade', 14: 'Random Bars', 16: 'Split', 17: 'Stretch', 18: 'Strips', 21: 'Wheel', 22: 'Wipe', 23: 'Zoom', 26: 'Bounce' }
const EXIT = { 1: 'Disappear', 2: 'Fly Out', 3: 'Blinds', 4: 'Box', 5: 'Checkerboard', 6: 'Circle', 8: 'Diamond', 9: 'Dissolve Out',
  10: 'Fade', 14: 'Random Bars', 16: 'Split', 17: 'Stretch', 18: 'Strips', 21: 'Wheel', 22: 'Wipe', 23: 'Zoom', 26: 'Bounce' }
const EMPHASIS = { 6: 'Grow/Shrink', 8: 'Spin' }
const CLASS = {
  entr: ['Xuất hiện (Entrance)', ENTRANCE],
  exit: ['Biến mất (Exit)', EXIT],
  emph: ['Nhấn mạnh (Emphasis)', EMPHASIS],
  path: ['Đường chuyển động (Motion Path)', {}],
}
const TRIGGER = { clickEffect: 'khi bấm chuột', withEffect: 'cùng lúc với hiệu ứng trước', afterEffect: 'tự chạy sau hiệu ứng trước' }

const attr = (tag, name) => (tag.match(new RegExp(`\\b${name}="([^"]*)"`)) || [])[1]

// Bảng id → mô tả ngắn của từng đối tượng trên slide (để nói hiệu ứng gắn vào đối tượng nào)
export function shapeLabels(slideXml) {
  const map = {}
  const blocks = slideXml.match(/<p:(sp|pic|grpSp|graphicFrame|cxnSp)>[\s\S]*?<\/p:\1>/g) || []
  for (const b of blocks) {
    const nv = b.match(/<p:cNvPr\b[^>]*>/)?.[0]
    if (!nv) continue
    const id = attr(nv, 'id')
    if (!id || map[id]) continue
    // Ảnh: kèm tên/mô tả để phân biệt khi slide có nhiều ảnh (vd "Picture 3", hoặc alt text học sinh đặt)
    if (b.startsWith('<p:pic>')) { map[id] = `hình ảnh "${attr(nv, 'descr') || attr(nv, 'name') || id}"`; continue }
    const isTitle = /<p:ph[^>]*\btype="(title|ctrTitle)"/.test(b)
    const text = (b.match(/<a:t(?:\s[^>]*)?>([^<]*)<\/a:t>/g) || []).map(t => t.replace(/<[^>]+>/g, '')).join(' ').trim()
    const shown = text ? `"${text.length > 40 ? text.slice(0, 40) + '…' : text}"` : `"${attr(nv, 'name') || 'đối tượng'}"`
    map[id] = (isTitle ? 'tiêu đề ' : 'khung ') + shown
  }
  return map
}

// Chuyển trang của slide, ví dụ "Fade". Trả về '' nếu không có.
export function describeTransition(slideXml) {
  // Hiệu ứng mới (p14, p159...) nằm trong mc:Choice, bản thay thế cũ nằm trong mc:Fallback → ưu tiên mc:Choice
  const block = slideXml.match(/<p:transition\b[^>]*\/>|<p:transition\b[^>]*>[\s\S]*?<\/p:transition>/)?.[0]
  if (!block) return ''
  const inner = block.replace(/^<p:transition\b[^>]*>/, '')
  const effect = inner.match(/<(?:p|p14|p15|p159):([a-zA-Z]+)\b/)?.[1]
  if (!effect || effect === 'sndAc' || effect === 'extLst') return 'có chuyển trang (không rõ kiểu)'
  const name = effect.charAt(0).toUpperCase() + effect.slice(1)
  const dur = attr(block, 'p14:dur') || attr(block, 'dur')
  return dur ? `${name}, ${(Number(dur) / 1000).toLocaleString('vi-VN')} giây` : name
}

// Danh sách hiệu ứng theo đúng thứ tự chạy trên slide
export function describeAnimations(slideXml) {
  const timing = slideXml.match(/<p:timing>[\s\S]*<\/p:timing>/)?.[0]
  if (!timing) return []
  const labels = shapeLabels(slideXml)
  // Mỗi hiệu ứng bắt đầu bằng 1 thẻ <p:cTn ... presetClass="..."> — cắt timing thành các đoạn theo thẻ đó
  const starts = [...timing.matchAll(/<p:cTn\b[^>]*\bpresetClass="[a-z]+"[^>]*>/g)]
  return starts.map((m, i) => {
    const tag = m[0]
    const seg = timing.slice(m.index, i + 1 < starts.length ? starts[i + 1].index : timing.length)
    const [cls, names] = CLASS[attr(tag, 'presetClass')] || ['Hiệu ứng', {}]
    const id = Number(attr(tag, 'presetID'))
    const effect = names[id] || (id ? `mã ${id}` : '')
    const spid = seg.match(/<p:spTgt\b[^>]*\bspid="(\d+)"/)?.[1]
    // Hiệu ứng chạy theo từng dòng (bullet): PowerPoint tách mỗi dòng thành 1 hiệu ứng, ghi số dòng (bắt đầu từ 0)
    const para = seg.match(/<p:txEl>\s*<p:pRg\b[^>]*\bst="(\d+)"/)?.[1]
    const byPara = para != null ? ` (dòng ${Number(para) + 1})` : ''
    const target = (spid && labels[spid]) || (spid ? `đối tượng #${spid}` : 'đối tượng')
    // Lấy thời lượng DÀI NHẤT — bước "đặt hiển thị" tức thời của PowerPoint có dur="1" không phải thời lượng hiệu ứng
    const durMs = Math.max(0, ...[...seg.matchAll(/\bdur="(\d+)"/g)].map(x => Number(x[1])))
    const parts = [cls + (effect ? `: ${effect}` : ''), TRIGGER[attr(tag, 'nodeType')] || '']
    if (durMs) parts.push(`${(durMs / 1000).toLocaleString('vi-VN')} giây`)
    return `${target}${byPara} — ${parts.filter(Boolean).join(', ')}`
  })
}

// Các dòng chú thích gắn vào cuối nội dung của slide khi gửi cho AI chấm
export function animationLines(slideXml) {
  const lines = []
  const tr = describeTransition(slideXml)
  if (tr) lines.push(`[CHUYỂN TRANG] ${tr}`)
  describeAnimations(slideXml).forEach((a, i) => lines.push(`[HIỆU ỨNG ${i + 1}] ${a}`))
  return lines
}
