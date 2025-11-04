// src/utils/video.ts
export async function setVideoSrcAndWait(video: HTMLVideoElement, src: string) {
  return new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      video.removeEventListener('loadedmetadata', onLoaded)
      video.removeEventListener('error', onError)
    }
    const onLoaded = () => { cleanup(); resolve() }
    const onError = () => { cleanup(); reject(new Error('Error cargando video')) }

    video.addEventListener('loadedmetadata', onLoaded, { once: true })
    video.addEventListener('error', onError, { once: true })
    video.preload = 'auto'
    video.muted = true
    video.src = src
  })
}

export function seekVideo(video: HTMLVideoElement, timeSec: number) {
  return new Promise<void>((resolve, reject) => {
    let hasResolved = false
    const cleanup = () => {
      video.removeEventListener('seeked', onStateChange)
      video.removeEventListener('loadeddata', onStateChange)
      video.removeEventListener('error', onError)
    }
    const checkAndResolve = () => {
      if (video.readyState >= video.HAVE_CURRENT_DATA) {
        if (!hasResolved) { hasResolved = true; cleanup(); resolve() }
        return true
      }
      return false
    }
    const onStateChange = () => checkAndResolve()
    const onError = () => { if (!hasResolved) { hasResolved = true; cleanup(); reject(new Error('Seek or loading error')) } }

    if (Math.abs(video.currentTime - timeSec) < 0.05 && checkAndResolve()) return

    video.addEventListener('seeked', onStateChange, { once: true })
    video.addEventListener('loadeddata', onStateChange, { once: true })
    video.addEventListener('error', onError, { once: true })

    try {
      video.currentTime = timeSec
      video.play().catch(() => {})
      video.pause()
    } catch { onError(); return }

    checkAndResolve()
    if (!hasResolved) setTimeout(() => { if (!hasResolved) checkAndResolve() }, 50)
  })
}

export async function paintFrameToCanvas(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  wrapper: HTMLDivElement | null,
  fillViewer: boolean
) {
  const w = video.videoWidth || 1280
  const h = video.videoHeight || 720
  if (w <= 0 || h <= 0) throw new Error('invalid video dims')

  const maxW = wrapper?.clientWidth ?? w
  const maxH = wrapper?.clientHeight ?? h
  const ratioBase = fillViewer ? Math.max(maxW / w, maxH / h) : Math.min(maxW / w, maxH / h)
  const ratio = Number.isFinite(ratioBase) && ratioBase > 0 ? ratioBase : 1
  const displayW = Math.max(1, Math.round(w * ratio))
  const displayH = Math.max(1, Math.round(h * ratio))

  canvas.width = w
  canvas.height = h
  canvas.style.width = `${displayW}px`
  canvas.style.height = `${displayH}px`

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('no ctx')
  ctx.clearRect(0, 0, w, h)
  ctx.drawImage(video, 0, 0, w, h)
}
