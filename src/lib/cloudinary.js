const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

export async function uploadImage(file) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', UPLOAD_PRESET)

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  )

  if (!res.ok) throw new Error('Upload ảnh thất bại')

  const data = await res.json()
  return data.secure_url
}

// Upload any file type — dùng /raw để file luôn accessible trực tiếp (PDF, docx, sb3...)
export async function uploadFile(file) {
  const fd = new FormData()
  fd.append('file', file)
  fd.append('upload_preset', UPLOAD_PRESET)

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/raw/upload`,
    { method: 'POST', body: fd }
  )

  if (!res.ok) throw new Error('Upload thất bại')
  const data = await res.json()
  return data.secure_url
}

// Xóa file trên Cloudinary (best-effort — không chặn luồng nếu lỗi)
export async function deleteFile(url) {
  if (!url) return
  try {
    await fetch('/api/deleteFile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    })
  } catch { /* bỏ qua, không ảnh hưởng thao tác của người dùng */ }
}
