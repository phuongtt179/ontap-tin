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

// Upload any file type (image → /image, others → /raw)
export async function uploadFile(file) {
  const isImage = file.type.startsWith('image/')
  const endpoint = isImage ? 'image' : 'raw'
  const fd = new FormData()
  fd.append('file', file)
  fd.append('upload_preset', UPLOAD_PRESET)

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${endpoint}/upload`,
    { method: 'POST', body: fd }
  )

  if (!res.ok) throw new Error('Upload thất bại')
  const data = await res.json()
  return data.secure_url
}
