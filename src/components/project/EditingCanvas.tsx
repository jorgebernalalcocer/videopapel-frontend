'use client'

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import PlayButton from '@/components/project/PlayButton'
import EditingTools from '@/components/project/EditingTools'
import DeleteFrameButton from '@/components/project/DeleteFrameButton'
import { Maximize2, Minimize2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { toast } from 'sonner'
import DraggableTextOverlay from '@/components/project/DraggableTextOverlay'

function clamp01(n: number) { return Math.min(1, Math.max(0, n)) }

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

  // Abrir modal en el padre
  onInsertVideo?: () => void
}

type CombinedThumb = {
  id: string              // `${clipId}:${tLocal}`
  clipId: number
  tLocal: number
  tGlobal: number
  videoSrc: string
  url?: string
}

type Thumbnail = { t: number; url: string }

type TextFormMode = 'range' | 'specific'

type TextFormState = {
  content: string
  typography: string
  mode: TextFormMode
  frameStart: string
  frameEnd: string
  specificFrames: string
  positionX: string
  positionY: string
}

type TextFrame = {
  id: number
  clip: number
  content: string
  typography: string | null
  frame_start: number | null
  frame_end: number | null
  specific_frames: number[]
  position_x: number
  position_y: number
}

const FRAME_TOLERANCE_MS = 66
const FRAME_INDEX_THRESHOLD = 500

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
    onInsertVideo,
  } = props

  const isMulti = Array.isArray(clips) && clips.length > 0

  const videoRef = useRef<HTMLVideoElement>(null)
  const bigCanvasRef = useRef<HTMLCanvasElement>(null)
  const bigCanvasWrapperRef = useRef<HTMLDivElement>(null)

  const [selectedGlobalMs, setSelectedGlobalMs] = useState<number>(initialTimeMs)
  const [selectedId, setSelectedId] = useState<string | null>(null) // 👈 selección por id
  const [error, setError] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [isCacheLoaded, setIsCacheLoaded] = useState(false)
  const [hasPendingChanges, setHasPendingChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isFrameFullScreen, setIsFrameFullScreen] = useState(false)
  const [paintError, setPaintError] = useState<boolean>(false) // 👈 NUEVO ESTADO
  const [isTextModalOpen, setIsTextModalOpen] = useState(false)
  const [isSubmittingTextFrame, setIsSubmittingTextFrame] = useState(false)
  const [textFormError, setTextFormError] = useState<string | null>(null)
  const [textForm, setTextForm] = useState<TextFormState>({
    content: '',
    typography: '',
    mode: 'range',
    frameStart: '0',
    frameEnd: '0',
    specificFrames: '',
    positionX: '0.5',
    positionY: '0.5',
  })
  const [textFramesByClip, setTextFramesByClip] = useState<Record<number, TextFrame[]>>({})

  const playTimerRef = useRef<number | null>(null)

  // Dentro de EditingCanvas (antes del return)
const updateTextFrameLocal = (id: number, x: number, y: number) => {
  setTextFramesByClip((prev) => {
    const next: typeof prev = {}
    for (const [clipIdStr, list] of Object.entries(prev)) {
      const clipId = Number(clipIdStr)
      const idx = list.findIndex((t) => t.id === id)
      if (idx === -1) {
        next[clipId] = list
        continue
      }
      const clone = list.slice()
      clone[idx] = {
        ...clone[idx],
        position_x: Number(x),
        position_y: Number(y),
      }
      next[clipId] = clone
    }
    return next
  })
}


  // Compat single-clip
  const baseClip: ClipState | null = useMemo(() => {
    if (isMulti) return null
    if (!clipId || !videoSrc || !durationMs) return null
    return { clipId, videoSrc, durationMs, frames: initialFrames ?? [] }
  }, [isMulti, clipId, videoSrc, durationMs, initialFrames])

  const clipsOrdered = useMemo<ClipState[]>(() => {
    if (isMulti) return clips!.slice()
    return baseClip ? [baseClip] : []
  }, [isMulti, clips, baseClip])

  const clipIdsKey = useMemo(() => clipsOrdered.map(c => c.clipId).join(','), [clipsOrdered])

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
  const clipThumbsById = useMemo(() => {
    const map: Record<number, CombinedThumb[]> = {}
    for (const thumb of combinedThumbs) {
      if (!map[thumb.clipId]) {
        map[thumb.clipId] = []
      }
      map[thumb.clipId].push(thumb)
    }
    for (const list of Object.values(map)) {
      list.sort((a, b) => a.tLocal - b.tLocal)
    }
    return map
  }, [combinedThumbs])
  const currentThumb = useMemo(() => {
    if (!combinedThumbs.length) return null
    if (selectedId) {
      const hit = combinedThumbs.find(t => t.id === selectedId)
      if (hit) return hit
    }
    return nearestByGlobal(selectedGlobalMs, combinedThumbs)
  }, [combinedThumbs, selectedId, selectedGlobalMs])

  useEffect(() => {
    if (!accessToken || !clipIdsKey || clipIdsKey.length === 0) {
      setTextFramesByClip({})
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const entries = await Promise.all(
          clipsOrdered.map(async (clip) => {
            const res = await fetch(`${apiBase}/text-frames/?clip=${clip.clipId}`, {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
              credentials: 'include',
            })
            if (!res.ok) {
              throw new Error(`TextFrames ${res.status}`)
            }
            const data = (await res.json()) as TextFrame[] | { results: TextFrame[] }
            const listRaw = Array.isArray(data) ? data : data.results ?? []
            const list = listRaw.map((item) => ({
              ...item,
              specific_frames: Array.isArray(item.specific_frames)
                ? item.specific_frames.map(Number)
                : [],
              position_x: typeof item.position_x === 'number' ? item.position_x : Number(item.position_x ?? 0.5),
              position_y: typeof item.position_y === 'number' ? item.position_y : Number(item.position_y ?? 0.5),
            }))
            return [clip.clipId, list] as const
          })
        )
        if (!cancelled) {
          setTextFramesByClip(Object.fromEntries(entries))
        }
      } catch (err) {
        console.error('Error cargando text frames', err)
        if (!cancelled) {
          toast.error('No se pudieron cargar los textos del proyecto.')
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [apiBase, accessToken, clipIdsKey, clipsOrdered])

  const activeTextFrames = useMemo(() => {
    if (!currentThumb) return []
    const framesForClip = textFramesByClip[currentThumb.clipId] ?? []
    const clipThumbs = clipThumbsById[currentThumb.clipId] ?? []
    const clipTimes = clipThumbs.map((thumb) => thumb.tLocal)
    const tLocal = currentThumb.tLocal

    const resolveValue = (value: number | null) => {
      if (value == null) return null
      if (!clipTimes.length) return value
      if (
        Number.isInteger(value) &&
        value >= 1 &&
        value <= clipTimes.length &&
        (value <= FRAME_INDEX_THRESHOLD || clipTimes.length <= FRAME_INDEX_THRESHOLD)
      ) {
        return clipTimes[value - 1]
      }
      return value
    }

    return framesForClip.filter((tf) => {
      const startMs = resolveValue(tf.frame_start)
      const endMs = resolveValue(tf.frame_end)
      const inRange =
        startMs != null &&
        endMs != null &&
        startMs <= tLocal &&
        tLocal <= endMs
      const inSpecific =
        Array.isArray(tf.specific_frames) &&
        tf.specific_frames.some((value) => {
          const target = resolveValue(value)
          if (target == null) return false
          return Math.abs(target - tLocal) <= FRAME_TOLERANCE_MS
        })
      return inRange || inSpecific
    })
  }, [textFramesByClip, currentThumb, clipThumbsById])

  // Cargar/generar thumbs por clip, aplicar ventana [start, end) y fusionar
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
            const seeds: Thumbnail[] =
              (c.frames?.length
                ? c.frames
                : generateTimesFromDuration(c.durationMs, thumbnailsCount)
              ).map((t) => ({ t, url: '' }))
            items = seeds
          }

          // 👇 Ventana semiabierta: [start, end)
          items = items.filter((it) => it.t >= start && it.t < end)

          // Construir URLs Cloudinary si falta url
          if (items.some((it) => !it.url) && !disableAutoThumbnails) {
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
              } catch { /* noop */ }
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

          // Inicializa selección si no existe
          if (!selectedId && all.length) {
            setSelectedId(all[0].id)
            setSelectedGlobalMs(all[0].tGlobal)
          }
        }
      } catch (e: any) {
        if (!canceled) {
          setError(e.message || 'Error preparando miniaturas')
          setGenerating(false)
          setIsCacheLoaded(true)
        }
      }
    })()

    return () => { canceled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, clipsOrdered, clipOffsets, thumbnailsCount, thumbnailHeight, disableAutoThumbnails])

  // Notifica externamente por tiempo (si alguien lo usa)
  useEffect(() => {
    onChange?.(selectedGlobalMs)
  }, [selectedGlobalMs, onChange])

  // Pintar frame grande al cambiar la selección
  useEffect(() => {
    ;(async () => {
      const current =
        (selectedId ? combinedThumbs.find(t => t.id === selectedId) : null) ??
        nearestByGlobal(selectedGlobalMs, combinedThumbs)
      if (!current) return
      await paintBigFrameForSrc(current.videoSrc, current.tLocal, isFrameFullScreen)
    })()
  }, [selectedId, selectedGlobalMs, combinedThumbs, isFrameFullScreen])

async function paintBigFrameForSrc(src: string, tLocalMs: number, fillViewer: boolean) {
  const video = videoRef.current
  const canvas = bigCanvasRef.current
  const wrapper = bigCanvasWrapperRef.current

  setPaintError(false) // 👈 Resetear el error al intentar pintar

  if (!video || !canvas) {
    setPaintError(true)
    return
  }

  const targetHeight = Math.max(240, Math.min(wrapper?.clientHeight ?? 720, 1080))
  const previewSrc = cloudinaryPreviewVideoUrl(src, targetHeight)

  if (video.dataset.previewSrc !== previewSrc || video.src !== previewSrc) {
    try {
      video.dataset.previewSrc = previewSrc
      await setVideoSrcAndWait(video, previewSrc)
    } catch {
      setPaintError(true) // Error al cargar la fuente
      return
    }
  }

  try {
    await seekVideo(video, tLocalMs / 1000)
    const w = video.videoWidth || 1280
    const h = video.videoHeight || 720
    if (w <= 0 || h <= 0) {
      setPaintError(true) // No hay dimensiones válidas
      return
    }
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
    if (!ctx) {
      setPaintError(true) // No se puede obtener el contexto
      return
    }
    ctx.clearRect(0, 0, w, h)
    ctx.drawImage(video, 0, 0, w, h)
    // Éxito: setPaintError(false) ya se hizo al principio
  } catch {
    setPaintError(true) // 👈 Activar el error si falla el seek o drawImage
  }
}

  /* --------- reproducción --------- */

  const togglePlay = () => setIsPlaying((p) => !p)

  function stepForward() {
    if (!combinedThumbs.length) return
    const idx = selectedId
      ? combinedThumbs.findIndex(t => t.id === selectedId)
      : nearestIndex(combinedThumbs.map(t => t.tGlobal), selectedGlobalMs)

    const nextIdx = idx + 1
    if (nextIdx < combinedThumbs.length) {
      const n = combinedThumbs[nextIdx]
      setSelectedId(n.id)
      setSelectedGlobalMs(n.tGlobal)
      scrollThumbIntoView(n.id)
    } else if (loop) {
      const n = combinedThumbs[0]
      setSelectedId(n.id)
      setSelectedGlobalMs(n.tGlobal)
      scrollThumbIntoView(n.id)
    } else {
      setIsPlaying(false)
    }
  }

  useEffect(() => {
    if (!isPlaying) {
      if (playTimerRef.current) { clearInterval(playTimerRef.current); playTimerRef.current = null }
      return
    }
    const intervalMs = Math.max(16, Math.round(1000 / playbackFps))
    playTimerRef.current = window.setInterval(stepForward, intervalMs)
    return () => {
      if (playTimerRef.current) { clearInterval(playTimerRef.current); playTimerRef.current = null }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, playbackFps, selectedGlobalMs, loop, combinedThumbs.length, selectedId])

  function handleOpenTextModal() {
    if (!combinedThumbs.length || !currentThumb) {
      toast.warning('Necesitas tener un clip seleccionado para insertar texto.')
      return
    }
    const clipInfo = clipOffsets[currentThumb.clipId]
    const clipEnd = clipInfo ? clipInfo.end : currentThumb.tLocal
    const defaultStart = currentThumb.tLocal
    const defaultEnd = clipEnd !== undefined
      ? Math.max(defaultStart, Math.min(defaultStart + 1000, clipEnd))
      : defaultStart
    setTextForm({
      content: '',
      typography: '',
      mode: 'range',
      frameStart: String(defaultStart),
      frameEnd: String(defaultEnd),
      specificFrames: '',
      positionX: '0.5',
      positionY: '0.5',
    })
    setTextFormError(null)
    setIsTextModalOpen(true)
  }

  const handleSubmitTextFrame = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!currentThumb) {
      setTextFormError('Selecciona un clip válido antes de insertar texto.')
      return
    }
    setIsSubmittingTextFrame(true)
    setTextFormError(null)
    try {
      const content = textForm.content.trim()
      if (!content) {
        throw new Error('El contenido del texto no puede estar vacío.')
      }
      const typography = textForm.typography.trim()

      const clipInfo = clipOffsets[currentThumb.clipId]
      const clipMin = clipInfo ? clipInfo.start : 0
      const clipMax = clipInfo ? clipInfo.end : undefined

      let frameStart: number | null = null
      let frameEnd: number | null = null
      let specificFrames: number[] = []

      if (textForm.mode === 'range') {
        const start = Number(textForm.frameStart)
        const end = Number(textForm.frameEnd)
        if (!Number.isFinite(start) || !Number.isFinite(end)) {
          throw new Error('Introduce un rango de frames válido.')
        }
        if (start < 0 || end < 0) {
          throw new Error('Los frames deben ser valores iguales o mayores que 0.')
        }
        if (end < start) {
          throw new Error('frame_end debe ser mayor o igual que frame_start.')
        }
        if (start < clipMin) {
          throw new Error(`frame_start debe ser igual o superior a ${clipMin}.`)
        }
        if (clipMax !== undefined && end > clipMax) {
          throw new Error(`frame_end no puede superar ${clipMax}.`)
        }
        frameStart = Math.round(start)
        frameEnd = Math.round(end)
      } else {
        if (!textForm.specificFrames.trim()) {
          throw new Error('Introduce al menos un frame específico.')
        }
        const parsed = textForm.specificFrames
          .split(/[,;\s]+/)
          .map(token => token.trim())
          .filter(Boolean)
          .map(token => Number(token))
        if (!parsed.length || parsed.some(n => !Number.isFinite(n) || n < 0)) {
          throw new Error('Los frames específicos deben ser enteros mayores o iguales que 0.')
        }
        if (parsed.some(n => n < clipMin)) {
          throw new Error(`Los frames específicos deben ser mayores o iguales que ${clipMin}.`)
        }
        if (clipMax !== undefined && parsed.some(n => n > clipMax)) {
          throw new Error(`Los frames específicos no pueden superar ${clipMax}.`)
        }
        specificFrames = parsed.map(n => Math.round(n))
      }

      const positionX = Number(textForm.positionX)
      const positionY = Number(textForm.positionY)
      if (!Number.isFinite(positionX) || positionX < 0 || positionX > 1) {
        throw new Error('La posición horizontal debe estar entre 0 y 1.')
      }
      if (!Number.isFinite(positionY) || positionY < 0 || positionY > 1) {
        throw new Error('La posición vertical debe estar entre 0 y 1.')
      }

      if (!accessToken) {
        throw new Error('Inicia sesión para insertar textos en el proyecto.')
      }

      const res = await fetch(`${apiBase}/text-frames/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          clip: currentThumb.clipId,
          content,
          typography: typography || null,
          frame_start: frameStart,
          frame_end: frameEnd,
          specific_frames: specificFrames,
          position_x: Number(positionX.toFixed(4)),
          position_y: Number(positionY.toFixed(4)),
        }),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Error ${res.status} creando el texto.`)
      }
      const createdRaw = (await res.json()) as TextFrame
      const created: TextFrame = {
        ...createdRaw,
        specific_frames: Array.isArray(createdRaw.specific_frames)
          ? createdRaw.specific_frames.map(Number)
          : [],
        position_x: typeof createdRaw.position_x === 'number' ? createdRaw.position_x : Number(createdRaw.position_x ?? 0.5),
        position_y: typeof createdRaw.position_y === 'number' ? createdRaw.position_y : Number(createdRaw.position_y ?? 0.5),
      }
      setTextFramesByClip((prev) => {
        const list = prev[created.clip] ?? []
        const nextList = [...list, created].sort((a, b) => {
          const aStart = a.frame_start ?? (a.specific_frames[0] ?? Number.MAX_SAFE_INTEGER)
          const bStart = b.frame_start ?? (b.specific_frames[0] ?? Number.MAX_SAFE_INTEGER)
          return aStart - bStart
        })
        return {
          ...prev,
          [created.clip]: nextList,
        }
      })

      toast.success('Texto guardado en el proyecto.')
      setIsTextModalOpen(false)
      setTextForm({
        content: '',
        typography: '',
        mode: 'range',
        frameStart: '0',
        frameEnd: '0',
        specificFrames: '',
        positionX: '0.5',
        positionY: '0.5',
      })
    } catch (err: any) {
      setTextFormError(err.message || 'No se pudo preparar el texto.')
    } finally {
      setIsSubmittingTextFrame(false)
    }
  }

  /* --------- borrar / guardar --------- */

  function deleteSelectedFrame() {
    if (!combinedThumbs.length) return

    const idx = selectedId
      ? combinedThumbs.findIndex(t => t.id === selectedId)
      : nearestIndex(combinedThumbs.map(t => t.tGlobal), selectedGlobalMs)

    const next = combinedThumbs.slice(0, idx).concat(combinedThumbs.slice(idx + 1))
    setCombinedThumbs(next)

    if (next[idx]) {
      const n = next[idx]
      setSelectedId(n.id)
      setSelectedGlobalMs(n.tGlobal)
    } else if (next.length) {
      const last = next[next.length - 1]
      setSelectedId(last.id)
      setSelectedGlobalMs(last.tGlobal)
    } else {
      setSelectedId(null)
      setSelectedGlobalMs(0)
    }

    setHasPendingChanges(true)
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

  /* --------- Render --------- */

  const canvasClassName = isFrameFullScreen
    ? 'block bg-black'
    : 'block h-auto w-auto max-h-full max-w-full bg-black'

  return (
    <div className="w-full flex flex-col gap-4 h-[90vh] min-h-0">
      <div className="rounded-lg overflow-hidden bg-black relative flex-1 min-h-0 flex items-center justify-center">
        {(generating || !isCacheLoaded) && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="inline-flex flex-col items-center gap-3 text-white text-sm">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/30 border-t-white" />
              <span>{isCacheLoaded ? 'Generando miniaturas…' : 'Cargando…'}</span>
            </div>
          </div>
        )}

        <video ref={videoRef} preload="metadata" muted playsInline crossOrigin="anonymous" className="hidden" />
        {paintError && (
          <div className="absolute inset-0 z-20 flex items-center justify-center text-center">
            <p className="text-white text-base bg-black/70 p-4 rounded-lg">
              Fallo al abrir el fotograma. Recomendamos borrar este proyecto y el video problemático y volver a subirlo de nuevo.
            </p>
          </div>
        )}

        <div ref={bigCanvasWrapperRef} className="flex h-full w-full items-center justify-center max-h-full max-w-full overflow-hidden">
          {/* El canvas solo se pinta si NO hay un error de pintura para evitar superposición visual */}
          <canvas ref={bigCanvasRef} className={canvasClassName} style={{ display: paintError ? 'none' : 'block' }} />
        </div>

{/* Overlay de textos arrastrables */}
{!paintError && (
  <DraggableTextOverlay
    wrapperRef={bigCanvasWrapperRef}
    canvasRef={bigCanvasRef}
    items={(activeTextFrames ?? []).map((tf) => ({
      id: tf.id,
      content: tf.content,
      typography: tf.typography,
      x: clamp01(Number(tf.position_x ?? 0.5)),
      y: clamp01(Number(tf.position_y ?? 0.5)),
    }))}
    onLocalPositionChange={updateTextFrameLocal}
    apiBase={apiBase}
    accessToken={accessToken}
    disabled={generating || !isCacheLoaded}
  />
)}


        <div className="absolute bottom-2 left-2 flex items-center gap-2">
          <DeleteFrameButton onClick={deleteSelectedFrame} disabled={!combinedThumbs.length || generating} />
          <button
            type="button"
            onClick={() => setIsFrameFullScreen((prev) => !prev)}
            className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 text-xs font-medium text-white shadow-sm ring-1 ring-white/20 backdrop-blur transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:opacity-50"
            aria-pressed={isFrameFullScreen}
          >
            {isFrameFullScreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            Visualización
          </button>
          <p className="text-white font-bold" style={{ fontSize: '0.8rem' }}>
            {combinedThumbs.length} fotogramas
          </p>
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
        className="overflow-x-auto border rounded-lg p-2 bg-white focus:outline-none flex-none"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            e.preventDefault()
            const idx = selectedId
              ? combinedThumbs.findIndex(t => t.id === selectedId)
              : nearestIndex(combinedThumbs.map(t => t.tGlobal), selectedGlobalMs)
            const nextIdx = e.key === 'ArrowLeft' ? Math.max(0, idx - 1) : Math.min(combinedThumbs.length - 1, idx + 1)
            if (combinedThumbs.length > 0) {
              const n = combinedThumbs[nextIdx]
              setSelectedId(n.id)
              setSelectedGlobalMs(n.tGlobal)
              scrollThumbIntoView(n.id)
            }
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
                const selected = it.id === selectedId // 👈 selección por id
                return (
                  <li key={it.id} id={`thumb-${it.id}`}>
                    <button
                      type="button"
                      onClick={() => { setSelectedId(it.id); setSelectedGlobalMs(it.tGlobal) }}
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

      <div className="flex-none">
        <EditingTools
          heightPx={thumbnailHeight}
          isPlaying={isPlaying}
          onTogglePlay={togglePlay}
          onSave={handleSaveChanges}
          canSave={Boolean(accessToken) && hasPendingChanges && !generating}
          isSaving={isSaving}
          onInsertVideo={onInsertVideo}
          onInsertText={handleOpenTextModal}
        />
      </div>
      <Modal
        open={isTextModalOpen}
        onClose={() => {
          if (!isSubmittingTextFrame) setIsTextModalOpen(false)
        }}
        title="Insertar texto"
        size="lg"
      >
        <form onSubmit={handleSubmitTextFrame} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contenido del texto
            </label>
            <textarea
              required
              rows={4}
              value={textForm.content}
              onChange={(e) => setTextForm((prev) => ({ ...prev, content: e.target.value }))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Escribe aquí el texto que aparecerá en el clip…"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipografía (opcional)
            </label>
            <input
              type="text"
              value={textForm.typography}
              onChange={(e) => setTextForm((prev) => ({ ...prev, typography: e.target.value }))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Ej. Open Sans Bold"
            />
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold text-gray-800">Aparición</legend>
            <div className="flex flex-wrap gap-4 text-sm text-gray-700">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="text-frame-mode"
                  value="range"
                  checked={textForm.mode === 'range'}
                  onChange={() => {
                    setTextForm((prev) => ({ ...prev, mode: 'range' }))
                    setTextFormError(null)
                  }}
                />
                Rango continuo
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="text-frame-mode"
                  value="specific"
                  checked={textForm.mode === 'specific'}
                  onChange={() => {
                    setTextForm((prev) => ({ ...prev, mode: 'specific' }))
                    setTextFormError(null)
                  }}
                />
                Frames específicos
              </label>
            </div>
          </fieldset>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-medium text-gray-700">
              Frame inicial (ms)
              <input
                type="number"
                min={0}
                value={textForm.frameStart}
                onChange={(e) => setTextForm((prev) => ({ ...prev, frameStart: e.target.value }))}
                disabled={textForm.mode !== 'range'}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
              />
            </label>
            <label className="text-sm font-medium text-gray-700">
              Frame final (ms)
              <input
                type="number"
                min={0}
                value={textForm.frameEnd}
                onChange={(e) => setTextForm((prev) => ({ ...prev, frameEnd: e.target.value }))}
                disabled={textForm.mode !== 'range'}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
              />
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Frames específicos (ms)
            </label>
            <input
              type="text"
              value={textForm.specificFrames}
              onChange={(e) => setTextForm((prev) => ({ ...prev, specificFrames: e.target.value }))}
              disabled={textForm.mode !== 'specific'}
              placeholder="Ej. 500, 1500, 2200"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
            />
            <p className="mt-1 text-xs text-gray-500">
              Separa los valores con comas, espacios o punto y coma. Usa milisegundos respecto al clip.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-medium text-gray-700">
              Posición horizontal (0 - 1)
              <input
                type="number"
                min={0}
                max={1}
                step={0.01}
                value={textForm.positionX}
                onChange={(e) => setTextForm((prev) => ({ ...prev, positionX: e.target.value }))}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </label>
            <label className="text-sm font-medium text-gray-700">
              Posición vertical (0 - 1)
              <input
                type="number"
                min={0}
                max={1}
                step={0.01}
                value={textForm.positionY}
                onChange={(e) => setTextForm((prev) => ({ ...prev, positionY: e.target.value }))}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </label>
          </div>

          {textFormError && (
            <p className="text-sm text-red-600">{textFormError}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                if (!isSubmittingTextFrame) setIsTextModalOpen(false)
              }}
              className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmittingTextFrame}
              className="rounded-md bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60"
            >
              {isSubmittingTextFrame ? 'Preparando…' : 'Guardar texto'}
            </button>
          </div>
        </form>
      </Modal>
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
  } catch { /* ignore */ }
}

function cloudinaryPreviewVideoUrl(videoUrl: string, maxHeight: number): string {
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
      if (vIdx >= 0) {
        version = afterUpload[vIdx]
        afterUpload = afterUpload.slice(vIdx + 1)
      }
    }

    const publicIdWithExt = afterUpload.join('/')
    const safeH = Math.max(240, Math.min(Math.round(maxHeight), 1080))
    const trans = `q_auto:eco,c_scale,h_${safeH},f_mp4`
    const base = '/' + parts.slice(0, uploadIdx + 1).join('/')
    const ver = version ? `/${version}` : ''
    const outPath = `${base}/${trans}${ver}/${publicIdWithExt}`
    return `${url.origin}${outPath}`
  } catch {
    return videoUrl
  }
}

// URL Cloudinary de frame para previsualización/tienda de thumbs
function cloudinaryFrameUrlFromVideoUrl(videoUrl: string, tMs: number, h: number): string {
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
    if (vIdx >= 0) {
      version = afterUpload[vIdx]
      afterUpload = afterUpload.slice(vIdx + 1)
    }
  }

  const publicIdWithExt = afterUpload.join('/')
  const publicId = publicIdWithExt.replace(/\.[^.]+$/, '')
  const secs = Math.max(0, tMs / 1000)

  // Calidad de los thumnails
  //maxima
  // const trans = `so_${secs.toFixed(3)},c_scale,h_${Math.round(h)},q_90,f_jpg`
  // alta
  // const trans = `so_${secs.toFixed(3)},c_scale,h_${Math.round(h)},q_auto:eco,f_webp`
  // baja
    const trans = `so_${secs.toFixed(3)},c_scale,h_${Math.round(h)},q_auto:low,f_webp`

  const base = `/` + parts.slice(0, uploadIdx + 1).join('/')
  const ver = version ? `/${version}` : ''
  const outPath = `${base}/${trans}${ver}/${publicId}.jpg`
  return `${url.origin}${outPath}`
}

// En el Helper 'setVideoSrcAndWait'
async function setVideoSrcAndWait(video: HTMLVideoElement, src: string) {
  return new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      video.removeEventListener('loadedmetadata', onLoaded)
      video.removeEventListener('error', onError)
    }
    const onLoaded = () => { cleanup(); resolve() }
    const onError = () => { cleanup(); reject(new Error('Error cargando video')) }
    
    video.addEventListener('loadedmetadata', onLoaded, { once: true })
    video.addEventListener('error', onError, { once: true })
    
    // 💡 NUEVAS LÍNEAS: Asegurar el estado ideal para Chrome
    video.preload = 'auto' // Forzar precarga para que Chrome trabaje más
    video.muted = true     // Silenciar por si Chrome lo necesita
    
    video.src = src
  })
}

function nearestByGlobal(tGlobal: number, arr: CombinedThumb[]) {
  if (!arr.length) return null
  const idx = nearestIndex(arr.map((a) => a.tGlobal), tGlobal)
  return arr[idx] ?? null
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
    let hasResolved = false

    const cleanup = () => {
      video.removeEventListener('seeked', onStateChange)
      video.removeEventListener('loadeddata', onStateChange)
      video.removeEventListener('error', onError)
    }

    const checkAndResolve = () => {
      // Garantiza que tenemos datos para el frame actual.
      if (video.readyState >= video.HAVE_CURRENT_DATA) {
        if (!hasResolved) {
          hasResolved = true
          cleanup()
          resolve()
        }
        return true
      }
      return false
    }

    const onStateChange = () => checkAndResolve()
    const onError = () => {
      if (!hasResolved) {
        hasResolved = true
        cleanup()
        reject(new Error('Seek or loading error'))
      }
    }

    if (Math.abs(video.currentTime - timeSec) < 0.05 && checkAndResolve()) {
      return
    }

    video.addEventListener('seeked', onStateChange, { once: true })
    video.addEventListener('loadeddata', onStateChange, { once: true })
    video.addEventListener('error', onError, { once: true })

    try {
      // 💡 CLAVE PARA IOS:
      // Forzamos al pipeline de media a estar activo.
      // En iOS, a veces se requiere un ciclo play/pause para asegurar
      // que el frame se decodifique y esté disponible para el canvas.
      video.currentTime = timeSec
      video.play().catch(() => {}) // El catch es para ignorar errores de 'play' no permitidos
      video.pause()
      
    } catch (e) {
      onError()
      return
    }

    checkAndResolve()

    if (!hasResolved) {
      // El timeout es la última defensa contra las condiciones de carrera de Chrome/Safari.
      setTimeout(() => {
        if (!hasResolved) {
          checkAndResolve()
        }
      }, 50) 
    }
  })
}
