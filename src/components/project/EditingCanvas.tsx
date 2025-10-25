'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import EditingTools from '@/components/project/EditingTools'

type EditingCanvasProps = {
  projectId: string            // 👈 NUEVO: UUID del proyecto para cache
  videoSrc: string
  durationMs: number
  initialTimeMs?: number
  thumbnailsCount?: number
  thumbnailHeight?: number
  onChange?: (timeMs: number) => void
  disableAutoThumbnails?: boolean
  playbackFps?: number
  loop?: boolean
}

/**
 * Genera miniaturas (o las lee del localStorage), muestra preview grande y tira de thumbs.
 * Accesible (← → para navegar, Space para play/pausa). Cache por proyecto (UUID).
 */
export default function EditingCanvas({
  projectId,                     // 👈 requerido para cache
  videoSrc,
  durationMs,
  initialTimeMs = 0,
  thumbnailsCount = 40,
  thumbnailHeight = 68,
  onChange,
  disableAutoThumbnails = false,
  playbackFps = 12,
  loop = true,
}: EditingCanvasProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const bigCanvasRef = useRef<HTMLCanvasElement>(null)

  const [selectedMs, setSelectedMs] = useState<number>(clamp(initialTimeMs, 0, durationMs))
  const [thumbs, setThumbs] = useState<Array<{ t: number; url: string }>>([])
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // reproducción
  const [isPlaying, setIsPlaying] = useState(false)
  const playTimerRef = useRef<number | null>(null)

  const timesMs = useMemo(() => {
    if (thumbnailsCount <= 1) return [0]
    const step = durationMs / (thumbnailsCount - 1)
    const arr = Array.from({ length: thumbnailsCount }, (_, i) => Math.round(i * step))
    arr[arr.length - 1] = durationMs
    return arr
  }, [durationMs, thumbnailsCount])

  // firma de cache (si cambia, invalidamos)
const sig = useMemo(
  () => buildSig({ videoSrc, durationMs, thumbnailsCount, thumbnailHeight }),
  [videoSrc, durationMs, thumbnailsCount, thumbnailHeight]
)


  // onChange externo
  useEffect(() => {
    onChange?.(selectedMs)
  }, [selectedMs, onChange])

  // preview grande
  useEffect(() => {
    paintBigFrame(selectedMs)
  }, [selectedMs, videoSrc])

  // miniaturas: lee cache o genera y guarda
useEffect(() => {
  // sin projectId no hay cache
  if (!projectId) return

  // CORS para canvas
  if (videoRef.current) videoRef.current.crossOrigin = 'anonymous'
  if (disableAutoThumbnails) return

  let canceled = false

  async function run() {
    try {
      setError(null)
      setGenerating(true)

      // 1) Intentar cargar del cache por UUID
      const cached = loadThumbsFromCache(projectId, sig)
      if (!canceled && cached) {
        setThumbs(cached)
        return
      }

      // 2) Generar y guardar bajo la clave del UUID
      const urls = await generateThumbnailsAsDataUrls(videoRef, timesMs, thumbnailHeight)
      if (!canceled) {
        setThumbs(urls)
        saveThumbsToCache(projectId, sig, urls)
      }
    } catch (e: any) {
      if (!canceled) setError(resolveThumbnailError(e))
    } finally {
      if (!canceled) setGenerating(false)
    }
  }

  run()
  return () => { canceled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [projectId, sig, videoSrc, durationMs, thumbnailHeight, disableAutoThumbnails, thumbnailsCount])


  function formatTime(ms: number) {
    const s = Math.floor(ms / 1000)
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    return [h, m, sec]
      .map((n, i) => (i === 0 && n === 0 ? null : String(n).padStart(2, '0')))
      .filter(Boolean)
      .join(':') || '00:00'
  }

  async function paintBigFrame(tMs: number) {
    const video = videoRef.current
    const canvas = bigCanvasRef.current
    if (!video || !canvas) return
    try {
      await seekVideo(video, tMs / 1000)
      const w = video.videoWidth || 1280
      const h = video.videoHeight || 720
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.drawImage(video, 0, 0, w, h)
    } catch {
      // noop
    }
  }

  function onKeyDownThumbs(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault()
      const idx = nearestIndex(timesMs, selectedMs)
      const next = e.key === 'ArrowLeft' ? Math.max(0, idx - 1) : Math.min(timesMs.length - 1, idx + 1)
      setSelectedMs(timesMs[next])
      scrollThumbIntoView(timesMs[next])
    } else if (e.key === ' ') {
      e.preventDefault()
      togglePlay()
    }
  }

  function scrollThumbIntoView(t: number) {
    const el = document.getElementById(thumbId(t))
    el?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })
  }

  /* --------- reproducción --------- */

  const togglePlay = () => setIsPlaying((p) => !p)

  const stepForward = () => {
    const idx = nearestIndex(timesMs, selectedMs)
    const nextIdx = idx + 1
    if (nextIdx < timesMs.length) {
      const t = timesMs[nextIdx]
      setSelectedMs(t)
      scrollThumbIntoView(t)
    } else if (loop) {
      const t = timesMs[0]
      setSelectedMs(t)
      scrollThumbIntoView(t)
    } else {
      setIsPlaying(false)
    }
  }

  useEffect(() => {
    if (!isPlaying) {
      if (playTimerRef.current) {
        window.clearInterval(playTimerRef.current)
        playTimerRef.current = null
      }
      return
    }
    const intervalMs = Math.max(16, Math.round(1000 / playbackFps))
    playTimerRef.current = window.setInterval(stepForward, intervalMs)
    return () => {
      if (playTimerRef.current) {
        window.clearInterval(playTimerRef.current)
        playTimerRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, playbackFps, selectedMs, timesMs, loop])

  return (
    <div className="w-full">
      {/* Preview grande */}
      <div className="rounded-lg overflow-hidden bg-black relative">
        {generating && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="inline-flex flex-col items-center gap-3 text-white text-sm">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/30 border-t-white" aria-label="Generando miniaturas" />
              <span>Generando miniaturas…</span>
            </div>
          </div>
        )}
        <video
          ref={videoRef}
          src={videoSrc}
          preload="metadata"
          muted
          playsInline
          crossOrigin="anonymous"
          className="hidden"
        />
        <canvas ref={bigCanvasRef} className="w-full h-auto block" aria-label="Preview frame" />
        <div className="absolute bottom-2 right-2 text-xs bg-black/60 text-white px-2 py-1 rounded">
          {formatTime(selectedMs)}
        </div>
      </div>

      {/* Tira de miniaturas */}
      <div
        className="mt-4 overflow-x-auto border rounded-lg p-2 bg-white focus:outline-none"
        tabIndex={0}
        onKeyDown={onKeyDownThumbs}
        aria-label="Video frames timeline"
      >
        {error && <p className="text-red-600 text-sm px-2 py-1">{error}</p>}
        {!disableAutoThumbnails && (
          <ul className="flex gap-2 min-w-max">
            {thumbs.length === 0 && !generating ? (
              <li className="text-gray-500 text-sm px-2 py-3">Sin miniaturas</li>
            ) : (
              (thumbs.length ? thumbs : timesMs.map((t) => ({ t, url: '' }))).map(({ t, url }) => {
                const selected = t === selectedMs
                return (
                  <li key={t} id={thumbId(t)}>
                    <button
                      type="button"
                      onClick={() => setSelectedMs(t)}
                      className={`relative block rounded-md overflow-hidden border ${
                        selected ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {url ? (
                        <img
                          src={url}
                          alt={`Frame ${formatTime(t)}`}
                          height={thumbnailHeight}
                          className="block"
                          style={{ height: thumbnailHeight, width: 'auto' }}
                        />
                      ) : (
                        <div
                          className="bg-gray-100 grid place-items-center text-xs text-gray-500"
                          style={{ height: thumbnailHeight, width: thumbnailHeight * (16 / 9) }}
                        >
                          {generating ? '···' : formatTime(t)}
                        </div>
                      )}
                      <span className="absolute bottom-1 right-1 text-[10px] bg-black/60 text-white px-1 rounded">
                        {formatTime(t)}
                      </span>
                    </button>
                  </li>
                )
              })
            )}
          </ul>
        )}
      </div>

      {/* Barra de herramientas (misma altura que la tira de frames) */}
      <EditingTools
        heightPx={thumbnailHeight}
        isPlaying={isPlaying}
        onTogglePlay={togglePlay}
      />
    </div>
  )
}

const LS_PREFIX = 'vp:thumbs'
const LS_KEY = (projectId: string) => `${LS_PREFIX}:${projectId}`

function buildSig(args: { videoSrc: string; durationMs: number; thumbnailsCount: number; thumbnailHeight: number }) {
  const { videoSrc, durationMs, thumbnailsCount, thumbnailHeight } = args
  return JSON.stringify({ v: 1, videoSrc, durationMs, thumbnailsCount, thumbnailHeight })
}

function loadThumbsFromCache(projectId: string, sig: string): Array<{ t: number; url: string }> | null {
  try {
    const raw = localStorage.getItem(LS_KEY(projectId))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed?.sig !== sig) return null
    const items = parsed?.items
    if (!Array.isArray(items)) return null
    return items.map((it: any) => ({ t: Number(it.t) || 0, url: String(it.dataUrl || '') }))
  } catch {
    return null
  }
}

function saveThumbsToCache(projectId: string, sig: string, items: Array<{ t: number; url: string }>) {
  try {
    const payload = {
      sig,
      createdAt: Date.now(),
      items: items.map((i) => ({ t: i.t, dataUrl: i.url })),
    }
    localStorage.setItem(LS_KEY(projectId), JSON.stringify(payload))
  } catch {
    // cuota llena o modo privado: ignorar
  }
}


function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function nearestIndex(arr: number[], target: number) {
  let bestIdx = 0
  let best = Infinity
  for (let i = 0; i < arr.length; i++) {
    const d = Math.abs(arr[i] - target)
    if (d < best) {
      best = d
      bestIdx = i
    }
  }
  return bestIdx
}

function thumbId(t: number) {
  return `thumb-${t}`
}

function resolveThumbnailError(err: unknown) {
  const message = typeof err === 'string' ? err : (err as any)?.message
  if (typeof message === 'string') {
    if (/tainted/i.test(message) || /insecure/i.test(message)) {
      return 'El navegador impide extraer fotogramas de este origen. Habilita CORS en el vídeo o desactiva las miniaturas automáticas.'
    }
    return message
  }
  return 'Error generando miniaturas'
}

/** hace seek y espera a 'seeked' */
function seekVideo(video: HTMLVideoElement, timeSec: number) {
  return new Promise<void>((resolve, reject) => {
    const onSeeked = () => {
      cleanup()
      resolve()
    }
    const onError = () => {
      cleanup()
      reject(new Error('Seek error'))
    }
    const cleanup = () => {
      video.removeEventListener('seeked', onSeeked)
      video.removeEventListener('error', onError)
    }
    if (Math.abs(video.currentTime - timeSec) < 0.01) {
      resolve()
      return
    }
    video.addEventListener('seeked', onSeeked, { once: true })
    video.addEventListener('error', onError, { once: true })
    try {
      video.currentTime = timeSec
    } catch (e) {
      cleanup()
      reject(e)
    }
  })
}

/** genera miniaturas (data URLs) para una lista de tiempos (ms) */
async function generateThumbnailsAsDataUrls(
  videoRef: React.RefObject<HTMLVideoElement>,
  timesMs: number[],
  thumbnailHeight: number
) {
  const video = videoRef.current
  if (!video) throw new Error('Video element not ready')

  if (Number.isNaN(video.duration) || video.duration === 0) {
    await new Promise<void>((resolve) => {
      const onLoaded = () => {
        video.removeEventListener('loadedmetadata', onLoaded)
        resolve()
      }
      video.addEventListener('loadedmetadata', onLoaded)
    })
  }

  const ratio = (video.videoWidth || 1280) / (video.videoHeight || 720)
  const width = Math.round(thumbnailHeight * ratio)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = thumbnailHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No canvas context')

  const out: Array<{ t: number; url: string }> = []
  for (const t of timesMs) {
    await seekVideo(video, t / 1000)
    ctx.drawImage(video, 0, 0, width, thumbnailHeight)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8) // 👈 data URL (guardable en LS)
    out.push({ t, url: dataUrl })
  }
  return out
}
