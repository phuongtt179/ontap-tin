// Tải tệp trên mạng về máy với đúng tên gốc (học liệu bài học). Thẻ <a download> không đổi được tên
// khi tệp nằm ở trang khác (Cloudinary), nên tải về dạng blob rồi lưu; lỗi thì mở tệp ở tab mới.

/** tải tệp ở url về máy, đặt tên `ten`; không tải được thì mở tab mới để em tự lưu */
export async function luuTepVeMay(url, ten) {
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error('tai_loi')
    const blobUrl = URL.createObjectURL(await res.blob())
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = ten || ''
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(blobUrl), 10000)
  } catch {
    window.open(url, '_blank', 'noopener')
  }
}
