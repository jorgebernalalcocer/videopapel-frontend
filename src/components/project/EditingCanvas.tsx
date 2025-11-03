'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import PlayButton from '@/components/project/PlayButton'
import EditingTools from '@/components/project/EditingTools'
import DeleteFrameButton from '@/components/project/DeleteFrameButton'
import { Maximize2, Minimize2 } from 'lucide-react'
import { toast } from 'sonner'
import DraggableTextOverlay from '@/components/project/DraggableTextOverlay'
import TextFrameEditorModal, { TextFrameModel } from '@/components/project/TextFrameEditorModal'

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
  thumbsPerSecond?: number  // 👈 NUEVO (ej. 2 = ~cada 0.5s)
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

type TextFrame = {
  id: number
  clip: number
  text_id?: number
  project_id?: string
  content: string
  typography: string | null
  frame_start: number | null
  frame_end: number | null
  specific_frames: number[]
  position_x: number
  position_y: number
}

type ProjectTextOverlayApi = {
  id: number
  clip: number
  frame_start: number | null
  frame_end: number | null
  specific_frames: number[]
  position_x: number
  position_y: number
}

type ProjectTextApiModel = {
  id: number
  project: string
  content: string
  typography: string | null
  frame_start: number | null
  frame_end: number | null
  specific_frames: number[]
  overlays: ProjectTextOverlayApi[]
}

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
    thumbnailsCount,
    thumbsPerSecond,           
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
  const [textFramesByClip, setTextFramesByClip] = useState<Record<number, TextFrame[]>>({})
  const [projectTexts, setProjectTexts] = useState<ProjectTextApiModel[]>([])
  const [textsVersion, setTextsVersion] = useState(0)
  const [overlayToTextId, setOverlayToTextId] = useState<Record<number, number>>({})

  const playTimerRef = useRef<number | null>(null)

  const [editorOpen, setEditorOpen] = useState(false)
const [editorMode, setEditorMode] = useState<'create'|'edit'>('create')
const [editorInitial, setEditorInitial] = useState<Partial<TextFrameModel> | undefined>(undefined)


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

  const clipSignature = useMemo(
    () => clipsOrdered.map(c => `${c.clipId}-${c.timeStartMs ?? 0}-${c.timeEndMs ?? c.durationMs}`).join(','),
    [clipsOrdered]
  )

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
  const projectTotalMs = useMemo(
    () => Object.values(clipOffsets).reduce((sum, v) => sum + Math.max(0, v.end - v.start), 0),
    [clipOffsets]
  )

  const globalFrames = useMemo(() => {
    const frames: { index: number; clipId: number; localMs: number; globalMs: number }[] = []
    let runningIndex = 1
    for (const clip of clipsOrdered) {
      const meta = clipOffsets[clip.clipId]
      if (!meta) continue
      const offset = meta.offset
      const baseFrames = Array.isArray(clip.frames) && clip.frames.length > 0
        ? clip.frames
        : [0]
      const localFrames = Array.from(new Set([0, ...baseFrames])).sort((a, b) => a - b)
      for (const value of localFrames) {
        const localMs = Math.max(0, value)
        const globalMs = offset + localMs
        frames.push({
          index: runningIndex,
          clipId: clip.clipId,
          localMs,
          globalMs,
        })
        runningIndex += 1
      }
    }
    return frames
  }, [clipsOrdered, clipOffsets])

  const frameIndexMs = useMemo(() => globalFrames.map((frame) => frame.globalMs), [globalFrames])
  const totalFrameCount = useMemo(() => Math.max(0, globalFrames.length), [globalFrames])

  const indexToStartMs = useCallback((index: number) => {
    if (!globalFrames.length) return 0
    const clamped = Math.min(Math.max(Math.round(index), 1), globalFrames.length)
    return globalFrames[clamped - 1]?.globalMs ?? 0
  }, [globalFrames])

  const indexToEndMs = useCallback((index: number) => {
    if (!globalFrames.length) return projectTotalMs
    const clamped = Math.min(Math.max(Math.round(index), 1), globalFrames.length)
    if (clamped >= globalFrames.length) {
      return projectTotalMs
    }
    return globalFrames[clamped]?.globalMs ?? projectTotalMs
  }, [globalFrames, projectTotalMs])

  const globalFrameLookupByClip = useMemo(() => {
    const map = new Map<number, Map<number, number>>()
    for (const frame of globalFrames) {
      if (!map.has(frame.clipId)) {
        map.set(frame.clipId, new Map())
      }
      map.get(frame.clipId)!.set(Math.round(frame.globalMs), frame.localMs)
    }
    return map
  }, [globalFrames])

  const currentFrameIndex = useMemo(() => {
    if (!frameIndexMs.length) return null
    const idx = nearestIndex(frameIndexMs, selectedGlobalMs)
    return idx >= 0 ? idx + 1 : null
  }, [frameIndexMs, selectedGlobalMs])
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

  const rebuildTextFrames = useCallback((items: ProjectTextApiModel[]) => {
    const allowedClipIds = new Set(clipsOrdered.map((clip) => clip.clipId))
    const byClip: Record<number, TextFrame[]> = {}
    const overlayMap: Record<number, number> = {}

    for (const item of items) {
      for (const overlay of item.overlays ?? []) {
        if (!allowedClipIds.has(overlay.clip)) continue
        overlayMap[overlay.id] = item.id
        const clipMeta = clipOffsets[overlay.clip]
        const offset = clipMeta?.offset ?? 0
        const clipDuration = clipMeta ? Math.max(0, clipMeta.end - clipMeta.start) : Number.POSITIVE_INFINITY

        const toLocal = (value: number | null | undefined) => {
          if (value == null) return null
          return Math.max(0, value - offset)
        }

        const normalizeSpecific = (values: number[] | null | undefined) => {
          if (!Array.isArray(values)) return []
          const lookup = globalFrameLookupByClip.get(overlay.clip)
          return values
            .map((v) => {
              if (lookup && lookup.size) {
                const rounded = Math.round(v)
                if (lookup.has(rounded)) {
                  return lookup.get(rounded)!
                }
                let bestLocal = v - offset
                let bestDiff = Number.POSITIVE_INFINITY
                lookup.forEach((localMs, globalMs) => {
                  const diff = Math.abs(globalMs - v)
                  if (diff < bestDiff) {
                    bestDiff = diff
                    bestLocal = localMs
                  }
                })
                return bestLocal
              }
              return v - offset
            })
            .filter((v) => v >= 0 && v <= clipDuration)
            .map((v) => Math.round(v))
        }

        const localStart = toLocal(overlay.frame_start)
        const localEnd = toLocal(overlay.frame_end)
        const normalized: TextFrame = {
          id: overlay.id,
          clip: overlay.clip,
          text_id: item.id,
          project_id: item.project,
          content: item.content,
          typography: item.typography,
          frame_start: localStart == null ? null : Math.max(0, Math.min(localStart, clipDuration)),
          frame_end: localEnd == null ? null : Math.max(0, Math.min(localEnd, clipDuration)),
          specific_frames: normalizeSpecific(overlay.specific_frames),
          position_x: overlay.position_x,
          position_y: overlay.position_y,
        }
        if (!byClip[normalized.clip]) {
          byClip[normalized.clip] = []
        }
        byClip[normalized.clip].push(normalized)
      }
    }

    for (const list of Object.values(byClip)) {
      list.sort((a, b) => {
        const aStart = a.frame_start ?? (a.specific_frames[0] ?? Number.MAX_SAFE_INTEGER)
        const bStart = b.frame_start ?? (b.specific_frames[0] ?? Number.MAX_SAFE_INTEGER)
        return aStart - bStart
      })
    }

    setOverlayToTextId(overlayMap)
    setTextFramesByClip(byClip)
  }, [clipsOrdered, clipOffsets, globalFrameLookupByClip])

  useEffect(() => {
    if (!accessToken || !projectId || !clipsOrdered.length) {
      setProjectTexts([])
      setTextFramesByClip({})
      setOverlayToTextId({})
      return
    }

    let cancelled = false

    const loadTexts = async () => {
      try {
        const res = await fetch(`${apiBase}/project-texts/?project=${projectId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          credentials: 'include',
        })
        if (!res.ok) {
          throw new Error(`ProjectTexts ${res.status}`)
        }
        const payload = await res.json()
        if (cancelled) return
        const list: ProjectTextApiModel[] = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.results)
            ? payload.results
            : []
        setProjectTexts(list)
      } catch (err) {
        if (cancelled) return
        console.error('Error cargando textos del proyecto', err)
        toast.error('No se pudieron cargar los textos del proyecto.')
      }
    }

    loadTexts()

    return () => {
      cancelled = true
    }
  }, [apiBase, accessToken, projectId, clipSignature, textsVersion, clipsOrdered.length])

  useEffect(() => {
    if (!projectTexts.length) {
      setTextFramesByClip({})
      setOverlayToTextId({})
      return
    }
    rebuildTextFrames(projectTexts)
  }, [projectTexts, clipSignature, rebuildTextFrames])

  const activeTextFrames = useMemo(() => {
    if (!currentThumb) return []
    const framesForClip = textFramesByClip[currentThumb.clipId] ?? []
    const tLocal = currentThumb.tLocal

    return framesForClip.filter((tf) => {
      const startMs = tf.frame_start
      const endMs = tf.frame_end
const inRange =
  startMs != null && endMs != null &&
  startMs <= tLocal && tLocal < endMs 
const inSpecific =
  Array.isArray(tf.specific_frames) &&
  tf.specific_frames.includes(Math.round(tLocal))   // sin tolerancia

      return inRange || inSpecific
    })
  }, [textFramesByClip, currentThumb])

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

  // calcula una vez por iteración
const targetCount = framesCountFor(c.durationMs, thumbnailsCount, thumbsPerSecond)
  const sig = buildSig({
    clipId: c.clipId,
    videoSrc: c.videoSrc,
    durationMs: c.durationMs,
    targetCount, // 👈 ya calculado
    thumbnailHeight,
    framesVersion: c.frames?.join(',') ?? null,
  })

  let items = loadThumbsFromCache(projectId, c.clipId, sig)

  // Detecta frames “legacy” (39) o vacíos y REGENERA si procede
  const legacy39 = Array.isArray(c.frames) && c.frames.length === 39 && (thumbnailsCount == null)
  const tooFew  = !Array.isArray(c.frames) || c.frames.length < 2

  if (!items || items.length === 0 || legacy39 || tooFew) {
    // ❌ NO declares otro "const targetCount" aquí
    const seedsTimes = generateTimesFromDuration(c.durationMs, targetCount)
    items = seedsTimes.map((t) => ({ t, url: '' }))
  }

  // Ventana semiabierta: [start, end)
  items = items.filter((it) => it.t >= start && it.t < end)

  // Construir URLs si falta url y cachear
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

function framesCountFor(
  durationMs: number,
  suggestedCount?: number,
  pps?: number,                 // 👈 nuevo parámetro
) {
  // 1) Si te pasan un número absoluto de miniaturas, lo respetas:
  if (suggestedCount && suggestedCount > 1) return suggestedCount

  // 2) Si te pasan densidad por segundo, úsala:
  if (pps && pps > 0) {
    const count = Math.round((durationMs / 1000) * pps) + 1 // +1 para incluir final
    return Math.max(2, count)
  }

  // 3) Por defecto: ~1 por segundo
  const perSec = 1
  return Math.max(2, Math.round(durationMs / 1000 * perSec) + 1)
}


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

function openCreateTextEditor() {
  if (!clipsOrdered.length) {
    toast.warning('Necesitas añadir al menos un clip al proyecto para insertar texto.')
    return
  }
  if (!totalFrameCount) {
    toast.error('No hay frames disponibles en el proyecto.')
    return
  }
  const defaultStartMs = indexToStartMs(1)
  const defaultEndMs = indexToEndMs(totalFrameCount || 1)
  setEditorMode('create')
  setEditorInitial({
    frame_start: defaultStartMs,
    frame_end: defaultEndMs,
    specific_frames: [],
    content: '',
    typography: '',
  })
  setEditorOpen(true)
}

function openEditTextEditor(overlayId: number) {
  const textId = overlayToTextId[overlayId]
  const aggregate = projectTexts.find((item) => item.id === textId)
  if (!aggregate) {
    toast.error('No se encontró el texto a editar.')
    return
  }
  setEditorMode('edit')
  const fallbackSpecific = aggregate.specific_frames ?? []
  const fallbackStart = aggregate.frame_start ?? indexToStartMs(1)
  const fallbackEnd = aggregate.frame_end ?? indexToEndMs(totalFrameCount || 1)
  setEditorInitial({
    text_id: aggregate.id,
    content: aggregate.content,
    typography: aggregate.typography ?? '',
    frame_start: fallbackStart,
    frame_end: fallbackEnd,
    specific_frames: fallbackSpecific,
  })
  setEditorOpen(true)
}

// Nuevo onSaved (create/edit):
function handleEditorSaved() {
  setTextsVersion((prev) => prev + 1)
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
  onEdit={openEditTextEditor}
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
          <div className="text-xs bg-black/60 text-white px-2 py-1 rounded flex items-center gap-2">
            <span>{formatTime(selectedGlobalMs)} / {formatTime(projectTotalMs)}</span>
            {currentFrameIndex != null && totalFrameCount > 0 && (
              <span>Frame {currentFrameIndex} / {totalFrameCount}</span>
            )}
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
  onInsertText={openCreateTextEditor}
/>
      </div>
<TextFrameEditorModal
  open={editorOpen}
  mode={editorMode}
  apiBase={apiBase}
  accessToken={accessToken}
  projectId={projectId}
  frameCount={Math.max(totalFrameCount, 1)}
  frameIndexMs={frameIndexMs}
  projectTotalMs={projectTotalMs}
  initial={editorInitial}
  onClose={()=>setEditorOpen(false)}
  onSaved={handleEditorSaved}
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
  targetCount: number   // 👈 en vez de thumbnailsCount
  thumbnailHeight: number
  framesVersion?: string | null
}) {
  const { clipId, videoSrc, durationMs, targetCount, thumbnailHeight, framesVersion } = args
  return JSON.stringify({ v: 4, clipId, videoSrc, durationMs, targetCount, thumbnailHeight, framesVersion })
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
