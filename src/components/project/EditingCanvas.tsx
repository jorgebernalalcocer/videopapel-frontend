'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import PlayButton from '@/components/project/PlayButton'
import EditingTools from '@/components/project/EditingTools'
import DeleteFrameButton from '@/components/project/DeleteFrameButton'

/* =========================
   Tipos
========================= */

type ClipState = {
  clipId: number
  videoSrc: string
  durationMs: number
  frames: number[]
  timeStartMs?: number
  timeEndMs?: number
}

type EditingCanvasProps = {
    onInsertVideo?: () => void  // ⬅️ nuevo
  projectId: string
  apiBase: string
  accessToken: string | null

  // Modo multi-clip:
  clips?: ClipState[]

  // Modo single-clip (compat):
  clipId?: number
  videoSrc?: string
  durationMs?: number
  initialFrames?: number[]
  initialTimeMs?: number

  thumbnailsCount?: number
  thumbnailHeight?: number
  onChange?: (timeMs: number) => void
  disableAutoThumbnails?: boolean
  playbackFps?: number
  loop?: boolean
}

type CombinedThumb = {
  id: string
  clipId: number
  tLocal: number
  tGlobal: number
  videoSrc: string
  url?: string
}

type Thumbnail = { t: number; url: string }

/* =========================
   Componente
========================= */

export default function EditingCanvas(props: EditingCanvasProps) {
  const {
    projectId,
    apiBase,
    accessToken,
    clips,
    clipId,
    videoSrc,
    durationMs,
    initialFrames,
    initialTimeMs = 0,
    thumbnailsCount = 40,
    thumbnailHeight = 68,
    onChange,
    disableAutoThumbnails = false,
    playbackFps = 12,
    loop = true,
    onInsertVideo,             // ✅ AÑADE ESTO
  } = props

  const isMulti = Array.isArray(clips) && clips.length > 0

  // Refs/UI
  const videoRef = useRef<HTMLVideoElement>(null)
  const bigCanvasRef = useRef<HTMLCanvasElement>(null)

  // Estado
  const [selectedGlobalMs, setSelectedGlobalMs] = useState<number>(initialTimeMs)
  const [error, setError] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [isCacheLoaded, setIsCacheLoaded] = useState(false)
  const [hasPendingChanges, setHasPendingChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const playTimerRef = useRef<number | null>(null)

  // Single-clip de compatibilidad
  const baseClip: ClipState | null = useMemo(() => {
    if (isMulti) return null
    if (!clipId || !videoSrc || !durationMs) return null
    return { clipId, videoSrc, durationMs, frames: initialFrames ?? [] }
  }, [isMulti, clipId, videoSrc, durationMs, initialFrames])

  // Clips ordenados
  const clipsOrdered = useMemo<ClipState[]>(() => {
    if (isMulti) return clips!.slice()
    return baseClip ? [baseClip] : []
  }, [isMulti, clips, baseClip])

  // Offsets acumulados globales
  const clipOffsets = useMemo(() => {
    const out: Record<number, { offset: number; start: number; end: number }> = {}
    let acc = 0
    for (const c of clipsOrdered) {
      const start = c.timeStartMs ?? 0
      const end = c.timeEndMs ?? c.durationMs
      const len = Math.max(0, end - start)
      out[c.clipId] = { offset: acc, start, end }
      acc += len
    }
    return out
  }, [clipsOrdered])

  const [combinedThumbs, setCombinedThumbs] = useState<CombinedThumb[]>([])
  const totalDurationMs = useMemo(
    () => Object.values(clipOffsets).reduce((sum, v) => sum + Math.max(0, v.end - v.start), 0),
    [clipOffsets]
  )

  // Cargar/generar thumbs por clip y fusionar
  useEffect(() => {
    let canceled = false
    ;(async () => {
      try {
        setGenerating(true)
        setError(null)

        const perClipThumbs: CombinedThumb[][] = []

        for (const c of clipsOrdered) {
          const { offset, start, end } = clipOffsets[c.clipId]

          // firma & caché por clip
          const sig = buildSig({
            clipId: c.clipId,
            videoSrc: c.videoSrc,
            durationMs: c.durationMs,
            thumbnailsCount,
            thumbnailHeight,
            framesVersion: c.frames?.join(',') ?? null,
          })

          let items = loadThumbsFromCache(projectId, c.clipId, sig)

          if (!items || items.length === 0) {
            // Si no hay caché, usa frames del backend o tiempos generados
            const seeds: Thumbnail[] =
              (c.frames?.length
                ? c.frames
                : generateTimesFromDuration(c.durationMs, thumbnailsCount)
              ).map((t) => ({ t, url: '' }))
            items = seeds
          }

          // Recorta a la ventana [start, end]
          items = items.filter((it) => it.t >= start && it.t <= end)

          // Generar dataURLs si faltan
          if (items.some((it) => !it.url) && !disableAutoThumbnails) {
// ✅ Ahora: construye URLs directas a fotogramas Cloudinary
items = items.map((it) => ({
  t: it.t,
  url: cloudinaryFrameUrlFromVideoUrl(c.videoSrc, it.t, thumbnailHeight),
}))

            saveThumbsToCache(projectId, c.clipId, sig, items)

            // Persistir frames en backend (silencioso)
            if (accessToken) {
              try {
                await fetch(`${apiBase}/projects/${projectId}/clips/${c.clipId}/frames/`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                  },
                  body: JSON.stringify({ frames: items.map((i) => i.t) }),
                })
              } catch {
                /* noop */
              }
            }
          }

          const merged: CombinedThumb[] = items.map(({ t, url }) => ({
            id: `${c.clipId}:${t}`,
            clipId: c.clipId,
            tLocal: t,
            tGlobal: (t - start) + offset,
            videoSrc: c.videoSrc,
            url,
          }))
          perClipThumbs.push(merged)
        }

        if (!canceled) {
          const all = perClipThumbs.flat().sort((a, b) => a.tGlobal - b.tGlobal)
          setCombinedThumbs(all)
          setIsCacheLoaded(true)
          setGenerating(false)
        }
      } catch (e: any) {
        if (!canceled) {
          setError(e.message || 'Error preparando miniaturas')
          setGenerating(false)
          setIsCacheLoaded(true)
        }
      }
    })()

    return () => {
      canceled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, clipsOrdered, clipOffsets, thumbnailsCount, thumbnailHeight, disableAutoThumbnails])

  // onChange externo
  useEffect(() => {
    onChange?.(selectedGlobalMs)
  }, [selectedGlobalMs, onChange])

  // Pintar frame grande al cambiar selección
  useEffect(() => {
    ;(async () => {
      const current = nearestByGlobal(selectedGlobalMs, combinedThumbs)
      if (!current) return
      await paintBigFrameForSrc(current.videoSrc, current.tLocal)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGlobalMs, combinedThumbs])

  async function paintBigFrameForSrc(src: string, tLocalMs: number) {
    const video = videoRef.current
    const canvas = bigCanvasRef.current
    if (!video || !canvas) return

    if (video.src !== src) {
      await setVideoSrcAndWait(video, src)
    }
    try {
      await seekVideo(video, tLocalMs / 1000)
      const w = video.videoWidth || 1280
      const h = video.videoHeight || 720
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.drawImage(video, 0, 0, w, h)
    } catch {
      /* noop */
    }
  }

  // Reproducción
  const togglePlay = () => setIsPlaying((p) => !p)

  function stepForward() {
    if (!combinedThumbs.length) return
    const idx = nearestIndex(
      combinedThumbs.map((t) => t.tGlobal),
      selectedGlobalMs
    )
    const nextIdx = idx + 1
    if (nextIdx < combinedThumbs.length) {
      setSelectedGlobalMs(combinedThumbs[nextIdx].tGlobal)
      scrollThumbIntoView(combinedThumbs[nextIdx].id)
    } else if (loop) {
      setSelectedGlobalMs(combinedThumbs[0].tGlobal)
      scrollThumbIntoView(combinedThumbs[0].id)
    } else {
      setIsPlaying(false)
    }
  }

  useEffect(() => {
    if (!isPlaying) {
      if (playTimerRef.current) {
        clearInterval(playTimerRef.current)
        playTimerRef.current = null
      }
      return
    }
    const intervalMs = Math.max(16, Math.round(1000 / playbackFps))
    playTimerRef.current = window.setInterval(stepForward, intervalMs)
    return () => {
      if (playTimerRef.current) {
        clearInterval(playTimerRef.current)
        playTimerRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, playbackFps, selectedGlobalMs, loop, combinedThumbs.length])

  // Borrar/guardar
  function deleteSelectedFrame() {
    if (!combinedThumbs.length) return
    const idx = nearestIndex(
      combinedThumbs.map((t) => t.tGlobal),
      selectedGlobalMs
    )
    const next = combinedThumbs.slice(0, idx).concat(combinedThumbs.slice(idx + 1))
    setCombinedThumbs(next)
    setSelectedGlobalMs(next[idx] ? next[idx].tGlobal : next.at(-1)?.tGlobal ?? 0)
    setHasPendingChanges(true)
  }

  // Construye una URL de miniatura (JPG) para un frame de un vídeo de Cloudinary
function cloudinaryFrameUrlFromVideoUrl(videoUrl: string, tMs: number, h: number): string {
  // Ejemplos de entrada:
  // https://res.cloudinary.com/<cloud>/video/upload/v1/videopapel/videos/abc123.mp4
  // https://res.cloudinary.com/<cloud>/video/upload/q_auto,f_auto/v169/.../my/video/id.mp4
  // Salida: .../video/upload/so_{segundos},c_scale,h_{h}/(v.../)?<public_id>.jpg

  const url = new URL(videoUrl)
  const parts = url.pathname.split('/').filter(Boolean) // ["<cloud>", "video", "upload", "..."]
  // Buscamos "video", "upload"
  const uploadIdx = parts.findIndex((p, i, arr) => p === 'upload' && arr[i - 1] === 'video')
  if (uploadIdx === -1) return videoUrl // fallback

  // Detecta versión (v123...) si existe
  let version = ''
  let afterUpload = parts.slice(uploadIdx + 1) // puede empezar con transformaciones o con v123
  if (afterUpload[0] && /^v\d+$/i.test(afterUpload[0])) {
    version = afterUpload.shift()! // "v123"
  } else {
    // podría haber transformaciones: las ignoramos para el frame
    // si hay un "v123" más adelante, lo extraemos
    const vIdx = afterUpload.findIndex(p => /^v\d+$/i.test(p))
    if (vIdx >= 0) {
      version = afterUpload[vIdx]
      afterUpload = afterUpload.slice(vIdx + 1)
    }
  }

  const publicIdWithExt = afterUpload.join('/') // e.g. "videopapel/videos/abc123.mp4"
  const publicId = publicIdWithExt.replace(/\.[^.]+$/, '') // sin extensión

  const secs = Math.max(0, tMs / 1000)
  const trans = `so_${secs.toFixed(3)},c_scale,h_${Math.max(1, Math.round(h))}`
  // Rearma path:
  const base = `/` + parts.slice(0, uploadIdx + 1).join('/') // "/<cloud>/video/upload"
  const ver = version ? `/${version}` : ''
  const outPath = `${base}/${trans}${ver}/${publicId}.jpg`
  return `${url.origin}${outPath}`
}

  async function handleSaveChanges() {
    if (!hasPendingChanges || !accessToken) return
    setIsSaving(true)
    setError(null)

    const byClip = new Map<number, number[]>()
    for (const item of combinedThumbs) {
      const arr = byClip.get(item.clipId) ?? []
      arr.push(item.tLocal)
      byClip.set(item.clipId, arr)
    }

    try {
      await Promise.all(
        Array.from(byClip.entries()).map(([cid, frames]) =>
          fetch(`${apiBase}/projects/${projectId}/clips/${cid}/frames/`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ frames }),
          })
        )
      )
      setHasPendingChanges(false)
    } catch (e: any) {
      setError(e.message || 'No se pudieron guardar los cambios.')
    } finally {
      setIsSaving(false)
    }
  }

  // Render
  return (
    <div className="w-full">
      <div className="rounded-lg overflow-hidden bg-black relative">
        {(generating || !isCacheLoaded) && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="inline-flex flex-col items-center gap-3 text-white text-sm">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/30 border-t-white" />
              <span>{isCacheLoaded ? 'Generando miniaturas…' : 'Cargando…'}</span>
            </div>
          </div>
        )}

        <video ref={videoRef} preload="metadata" muted playsInline className="hidden" />
        <canvas ref={bigCanvasRef} className="w-full h-auto block" />

        <div className="absolute bottom-2 left-2 flex items-center gap-2">
          <DeleteFrameButton onClick={deleteSelectedFrame} disabled={!combinedThumbs.length || generating} />
        </div>

        <div className="absolute bottom-2 right-2 flex items-center gap-2">
          <div className="text-xs bg-black/60 text-white px-2 py-1 rounded">
            {formatTime(selectedGlobalMs)} / {formatTime(totalDurationMs)}
          </div>
          <PlayButton onClick={stepForward} />
        </div>
      </div>

      {/* Timeline global */}
      <div
        className="mt-4 overflow-x-auto border rounded-lg p-2 bg-white focus:outline-none"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            e.preventDefault()
            const times = combinedThumbs.map((t) => t.tGlobal)
            const idx = nearestIndex(times, selectedGlobalMs)
            const nextIdx = e.key === 'ArrowLeft' ? Math.max(0, idx - 1) : Math.min(times.length - 1, idx + 1)
            if (times.length > 0) setSelectedGlobalMs(times[nextIdx])
          } else if (e.key === ' ') {
            e.preventDefault()
            togglePlay()
          }
        }}
      >
        {error && <p className="text-red-600 text-sm px-2 py-1">{error}</p>}
        {isCacheLoaded && (
          <ul className="flex gap-2 min-w-max">
            {combinedThumbs.length === 0 && !generating ? (
              <li className="text-gray-500 text-sm px-2 py-3">Sin miniaturas</li>
            ) : (
              combinedThumbs.map((it) => {
                const selected = Math.abs(it.tGlobal - selectedGlobalMs) < 1
                return (
                  <li key={it.id} id={`thumb-${it.id}`}>
                    <button
                      type="button"
                      onClick={() => setSelectedGlobalMs(it.tGlobal)}
                      className={`relative block rounded-md overflow-hidden border ${
                        selected ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      {it.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={it.url}
                          alt={`Frame ${formatTime(it.tGlobal)}`}
                          height={thumbnailHeight}
                          className="block"
                          style={{ height: thumbnailHeight, width: 'auto' }}
                        />
                      ) : (
                        <div
                          className="bg-gray-100 grid place-items-center text-xs text-gray-500"
                          style={{ height: thumbnailHeight, width: thumbnailHeight * (16 / 9) }}
                        >
                          ···
                        </div>
                      )}
                      <span className="absolute bottom-1 right-1 text-[10px] bg-black/60 text-white px-1 rounded">
                        {formatTime(it.tGlobal)}
                      </span>
                    </button>
                  </li>
                )
              })
            )}
          </ul>
        )}
      </div>

<EditingTools
  heightPx={thumbnailHeight}
  isPlaying={isPlaying}
  onTogglePlay={togglePlay}
  onSave={handleSaveChanges}
  canSave={Boolean(accessToken) && hasPendingChanges && !generating}
  isSaving={isSaving}
  onInsertVideo={onInsertVideo}   // ⬅️ aquí
/>
    </div>
  )
}

/* =========================
   Helpers
========================= */

const LS_PREFIX = 'vp:thumbs'
const LS_KEY = (projectId: string, clipId: number | string) => `${LS_PREFIX}:${projectId}:${clipId}`

function buildSig(args: {
  clipId: number
  videoSrc: string
  durationMs: number
  thumbnailsCount: number
  thumbnailHeight: number
  framesVersion?: string | null
}) {
  const { clipId, videoSrc, durationMs, thumbnailsCount, thumbnailHeight, framesVersion } = args
  // v3 por cambios multi-clip
  return JSON.stringify({ v: 3, clipId, videoSrc, durationMs, thumbnailsCount, thumbnailHeight, framesVersion })
}

function loadThumbsFromCache(projectId: string, clipId: number | string, sig: string): Thumbnail[] | null {
  try {
    const raw = localStorage.getItem(LS_KEY(projectId, clipId))
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

function saveThumbsToCache(projectId: string, clipId: number | string, sig: string, items: Thumbnail[]) {
  try {
    const payload = {
      sig,
      createdAt: Date.now(),
      items: items.map((i) => ({ t: i.t, dataUrl: i.url })),
    }
    localStorage.setItem(LS_KEY(projectId, clipId), JSON.stringify(payload))
  } catch {
    // ignore
  }
}

async function setVideoSrcAndWait(video: HTMLVideoElement, src: string) {
  return new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      video.removeEventListener('loadedmetadata', onLoaded)
      video.removeEventListener('error', onError)
    }
    const onLoaded = () => {
      cleanup()
      resolve()
    }
    const onError = () => {
      cleanup()
      reject(new Error('Error cargando video'))
    }
    video.addEventListener('loadedmetadata', onLoaded, { once: true })
    video.addEventListener('error', onError, { once: true })
    video.src = src
  })
}

function nearestByGlobal(tGlobal: number, arr: CombinedThumb[]) {
  if (!arr.length) return null
  const idx = nearestIndex(arr.map((a) => a.tGlobal), tGlobal)
  return arr[idx] ?? null
}

async function generateThumbnailsAsDataUrlsForSrc(
  src: string,
  videoRef: React.RefObject<HTMLVideoElement>,
  timesMs: number[],
  thumbnailHeight: number
) {
  const video = videoRef.current
  if (!video) throw new Error('Video element not ready')
  await setVideoSrcAndWait(video, src)
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
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
    out.push({ t, url: dataUrl })
  }
  return out
}

function generateTimesFromDuration(durationMs: number, framesCount: number) {
  if (framesCount <= 1) return [0]
  const safeDuration = durationMs && durationMs > 0 ? durationMs : framesCount * 1000
  const step = safeDuration / (framesCount - 1)
  const arr = Array.from({ length: framesCount }, (_, i) => Math.round(i * step))
  arr[arr.length - 1] = safeDuration
  return arr
}

function formatTime(ms: number) {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  const parts = []
  if (h > 0) parts.push(String(h).padStart(2, '0'))
  parts.push(String(m).padStart(2, '0'))
  parts.push(String(s).padStart(2, '0'))
  return parts.join(':')
}

function scrollThumbIntoView(combinedId: string) {
  const el = document.getElementById(`thumb-${combinedId}`)
  el?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })
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
      reject(e as Error)
    }
  })

  

}
