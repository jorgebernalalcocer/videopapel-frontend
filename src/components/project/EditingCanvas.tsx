'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import EditingTools from '@/components/project/EditingTools'

type EditingCanvasProps = {
  videoSrc: string
  durationMs: number
  /** fotograma inicial seleccionado en ms (default 0) */
  initialTimeMs?: number
  /** nº de miniaturas a muestrear de manera uniforme (default 40) */
  thumbnailsCount?: number
  /** alto de cada miniatura en px (default 68) */
  thumbnailHeight?: number
  /** callback al cambiar la selección */
  onChange?: (timeMs: number) => void
  /** desactivar generación automática de thumbs (si prefieres traerlas del backend) */
  disableAutoThumbnails?: boolean
  /** fps de la “reproducción” (default 12) */
  playbackFps?: number
  /** si true, al final vuelve al inicio y sigue (default false) */
  loop?: boolean
}

/**
 * Genera miniaturas por seek + canvas, muestra preview grande y tira de thumbs.
 * Accesible (teclas ← → para navegar, Space para play/pausa), y muy reutilizable.
 */
export default function EditingCanvas({
  videoSrc,
  durationMs,
  initialTimeMs = 0,
  thumbnailsCount = 40,
  thumbnailHeight = 68,
  onChange,
  disableAutoThumbnails = false,
  playbackFps = 12,
  loop = true, // al llegar al final del video vuelve al inicio
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
    // Muestras uniformes 0..duration
    if (thumbnailsCount <= 1) return [0]
    const step = durationMs / (thumbnailsCount - 1)
    const arr = Array.from({ length: thumbnailsCount }, (_, i) => Math.round(i * step))
    arr[arr.length - 1] = durationMs // asegurar el último = duration
    return arr
  }, [durationMs, thumbnailsCount])

  // disparar onChange hacia fuera
  useEffect(() => {
    onChange?.(selectedMs)
  }, [selectedMs, onChange])

  // pintar el fotograma grande cuando cambie la selección
  useEffect(() => {
    paintBigFrame(selectedMs)
  }, [selectedMs, videoSrc])

  // generar miniaturas automáticamente (si está activado)
  useEffect(() => {
    // Forzar CORS anónimo antes de cargar el video (necesario para canvas)
    if (videoRef.current) {
      videoRef.current.crossOrigin = 'anonymous'
    }

    if (disableAutoThumbnails) return
    let canceled = false
    async function run() {
      setError(null)
      setGenerating(true)
      try {
        const urls = await generateThumbnails(videoRef, timesMs, thumbnailHeight)
        if (!canceled) setThumbs(urls)
      } catch (e: any) {
        if (!canceled) setError(resolveThumbnailError(e))
      } finally {
        if (!canceled) setGenerating(false)
      }
    }
    run()
    return () => {
      canceled = true
      // liberar blobs
      setThumbs((prev) => {
        prev.forEach((p) => {
          if (p.url.startsWith('blob:')) URL.revokeObjectURL(p.url)
        })
        return []
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoSrc, durationMs, thumbnailHeight, disableAutoThumbnails, thumbnailsCount])

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
      // Ajustar canvas al tamaño del video (mantener nitidez)
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
      const next =
        e.key === 'ArrowLeft'
          ? Math.max(0, idx - 1)
          : Math.min(timesMs.length - 1, idx + 1)
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

  const togglePlay = () => {
    setIsPlaying((p) => !p)
  }

  // avanza al siguiente frame “discreto” del timeline
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
      setIsPlaying(false) // fin
    }
  }

  // gestionar el temporizador
  useEffect(() => {
    if (!isPlaying) {
      // parar
      if (playTimerRef.current) {
        window.clearInterval(playTimerRef.current)
        playTimerRef.current = null
      }
      return
    }
    // iniciar
    const intervalMs = Math.max(16, Math.round(1000 / playbackFps)) // clamp a ~60fps máx.
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
        {/* video oculto para capturas */}
        <video
          ref={videoRef}
          src={videoSrc}
          preload="metadata"
          muted
          playsInline
          crossOrigin="anonymous"
          className="hidden"
        />
        <canvas
          ref={bigCanvasRef}
          className="w-full h-auto block"
          aria-label="Preview frame"
        />
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
        {error && (
          <p className="text-red-600 text-sm px-2 py-1">{error}</p>
        )}
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

/* ---------- helpers ---------- */

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
    // Evitar loops si el tiempo es igual
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

/** genera miniaturas para una lista de tiempos (ms) y devuelve blob URLs */
async function generateThumbnails(
  videoRef: React.RefObject<HTMLVideoElement>,
  timesMs: number[],
  thumbnailHeight: number
) {
  const video = videoRef.current
  if (!video) throw new Error('Video element not ready')

  // Asegurar metadata cargada
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
    const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.8))
    if (blob) {
      const url = URL.createObjectURL(blob)
      out.push({ t, url })
    } else {
      out.push({ t, url: '' })
    }
  }
  return out
}
