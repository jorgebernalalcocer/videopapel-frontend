// src/utils/cloudinary.ts
export function cloudinaryPreviewVideoUrl(videoUrl: string, maxHeight: number): string {
  try {
    const url = new URL(videoUrl)
    const parts = url.pathname.split('/').filter(Boolean)
    const uploadIdx = parts.findIndex((p, i, arr) => p === 'upload' && arr[i - 1] === 'video')
    if (uploadIdx === -1) return videoUrl

    let version = ''
    let afterUpload = parts.slice(uploadIdx + 1)
    if (afterUpload[0] && /^v\d+$/i.test(afterUpload[0])) {
      version = afterUpload.shift()!
    } else {
      const vIdx = afterUpload.findIndex(p => /^v\d+$/i.test(p))
      if (vIdx >= 0) { version = afterUpload[vIdx]; afterUpload = afterUpload.slice(vIdx + 1) }
    }

    const publicIdWithExt = afterUpload.join('/')
    const safeH = Math.max(240, Math.min(Math.round(maxHeight), 1080))
    const trans = `q_auto:eco,c_scale,h_${safeH},f_mp4`
    const base = '/' + parts.slice(0, uploadIdx + 1).join('/')
    const ver = version ? `/${version}` : ''
    return `${url.origin}${base}/${trans}${ver}/${publicIdWithExt}`
  } catch { return videoUrl }
}

export function cloudinaryFrameUrlFromVideoUrl(videoUrl: string, tMs: number, h: number): string {
  const url = new URL(videoUrl)
  const parts = url.pathname.split('/').filter(Boolean)
  const uploadIdx = parts.findIndex((p, i, arr) => p === 'upload' && arr[i - 1] === 'video')
  if (uploadIdx === -1) return videoUrl

  let version = ''
  let afterUpload = parts.slice(uploadIdx + 1)
  if (afterUpload[0] && /^v\d+$/i.test(afterUpload[0])) {
    version = afterUpload.shift()!
  } else {
    const vIdx = afterUpload.findIndex(p => /^v\d+$/i.test(p))
    if (vIdx >= 0) { version = afterUpload[vIdx]; afterUpload = afterUpload.slice(vIdx + 1) }
  }

  const publicIdWithExt = afterUpload.join('/')
  const publicId = publicIdWithExt.replace(/\.[^.]+$/, '')
  const secs = Math.max(0, tMs / 1000)
  const trans = `so_${secs.toFixed(3)},c_scale,h_${Math.round(h)},q_auto:low,f_webp`
  const base = '/' + parts.slice(0, uploadIdx + 1).join('/')
  const ver = version ? `/${version}` : ''
  return `${url.origin}${base}/${trans}${ver}/${publicId}.jpg`
}
