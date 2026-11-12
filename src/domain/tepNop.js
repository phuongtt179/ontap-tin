// Nhận biết loại tệp (bài nộp, tệp đề) từ đường dẫn — để chọn cách hiển thị. Hàm thuần.

/** đuôi tệp viết thường, bỏ phần ?... sau đuôi ('' nếu không có url) */
export function duoiTep(url) {
  return url ? url.split('.').pop().toLowerCase().split('?')[0] : ''
}

/** tên tệp để hiện: tên học sinh đặt (nếu có), không thì lấy cuối đường dẫn */
export function tenTep(url, tenGoc) {
  return tenGoc || (url ? decodeURIComponent(url.split('/').pop().split('?')[0]) : '')
}

/** nhóm loại tệp */
export function loaiTep(url) {
  const duoi = duoiTep(url)
  const word = ['doc', 'docx'].includes(duoi)
  const ppt = ['ppt', 'pptx'].includes(duoi)
  return {
    duoi, word, ppt, office: word || ppt,
    anh: ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(duoi),
    sb3: duoi === 'sb3',
    pdf: duoi === 'pdf',
    code: duoi === 'py' || duoi === 'txt',
  }
}

/** link xem tệp Word / PowerPoint trực tuyến (Office Online) */
export const linkXemOffice = url => `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`
