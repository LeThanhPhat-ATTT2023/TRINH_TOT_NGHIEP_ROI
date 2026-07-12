// src/lib/cloudinary.ts
const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

export async function uploadImage(file: File): Promise<string> {
  if (!cloudName || !uploadPreset) {
    throw new Error('Missing VITE_CLOUDINARY_CLOUD_NAME or VITE_CLOUDINARY_UPLOAD_PRESET environment variables')
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', uploadPreset)

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error('Cloudinary upload failed')
  }

  const data = await response.json()
  const url = data.secure_url as string
  // Ảnh nguồn có thể là định dạng trình duyệt không hiển thị được (HEIC từ iPhone...).
  // Chèn f_auto,q_auto để Cloudinary luôn trả về định dạng web hiển thị được.
  return url.replace('/upload/', '/upload/f_auto,q_auto/')
}
