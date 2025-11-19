// src/components/project/EditingCanvas.tsx
'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import PlayButton from '@/components/project/PlayButton'
import EditingTools from '@/components/project/EditingTools'
import DeleteFrameButton from '@/components/project/DeleteFrameButton'
import { toast } from 'sonner'
import BigFrameViewer from '@/components/project/viewer/BigFrameViewer'
import GlobalTimeline from '@/components/project/timeline/GlobalTimeline'
import TextFrameEditorModal, { TextFrameModel } from '@/components/project/TextFrameEditorModal'
import FrameModal, { type FrameFormPayload } from '@/components/project/FrameModal'
import { Modal } from '@/components/ui/Modal'
import ProgressIndicator from '@/components/ui/ProgressIndicator'

import { useCombinedThumbs } from '@/hooks/useCombinedThumbs'
import { usePlaybackStepper } from '@/hooks/usePlaybackStepper'
import { useProjectTexts } from '@/hooks/useProjectTexts'
import { makeTimelineKeydownHandler } from '@/hooks/useKeyboardTimelineNav'
import { formatTime, nearestIndex } from '@/utils/time'
import type { FrameSettingClient } from '@/types/frame'

/* ===== Tipos (abrev.) ===== */
type ClipState = { clipId: number; videoSrc: string; durationMs: number; frames: number[]; timeStartMs?: number; timeEndMs?: number }
type EditingCanvasProps = {
  projectId: string; apiBase: string; accessToken: string | null;
  clips?: ClipState[]; clipId?: number; videoSrc?: string; durationMs?: number;
  initialFrames?: number[]; initialTimeMs?: number; thumbsPerSecond?: number;
  thumbnailsCount?: number; thumbnailHeight?: number; onChange?: (timeMs: number) => void;
  disableAutoThumbnails?: boolean; playbackFps?: number; loop?: boolean; onInsertVideo?: () => void;
  printAspectSlug?: string | null;
  onThumbsDensityChange?: (value: number) => void;
  printSizeLabel?: string | null;
  frameSetting?: FrameSettingClient | null;
  onFrameChange?: () => void;
  printWidthMm?: number | null;
  printHeightMm?: number | null;
  printQualityPpi?: number | null;
  printEffectName?: string | null;
}

/* ===== Componente ===== */

export default function EditingCanvas(props: EditingCanvasProps) {
  const {
    projectId, apiBase, accessToken, clips, clipId, videoSrc, durationMs, initialFrames,
    initialTimeMs = 0, thumbnailsCount, thumbsPerSecond = 1, thumbnailHeight = 68,
    onChange, disableAutoThumbnails = false, playbackFps = 12, loop = true, onInsertVideo,
    printAspectSlug = 'fill',
    onThumbsDensityChange,
    printSizeLabel,
    frameSetting = null,
    printWidthMm = null,
    printHeightMm = null,
    printQualityPpi = null,
    printEffectName = null,
  } = props
  const { onFrameChange } = props

  const isMulti = Array.isArray(clips) && clips.length > 0
  const [thumbsDensity, setThumbsDensity] = useState(thumbsPerSecond)
  const initialThumbsRef = useRef(thumbsPerSecond)
  useEffect(() => {
    setThumbsDensity(thumbsPerSecond)
    initialThumbsRef.current = thumbsPerSecond
  }, [thumbsPerSecond])
  useEffect(() => {
    if (!accessToken) return
    if (thumbsDensity === initialThumbsRef.current) return
    const controller = new AbortController()
    ;(async () => {
      try {
        const res = await fetch(`${apiBase}/projects/${projectId}/thumbs-per-second/`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          credentials: 'include',
          body: JSON.stringify({ thumbs_per_second: thumbsDensity }),
          signal: controller.signal,
        })
        if (!res.ok) {
          const text = await res.text()
          throw new Error(text || `Error ${res.status} guardando densidad.`)
        }
        initialThumbsRef.current = thumbsDensity
        onThumbsDensityChange?.(thumbsDensity)
      } catch (err: any) {
        if (err?.name === 'AbortError') return
        toast.error(err?.message || 'No se pudo actualizar la densidad de frames.')
      }
    })()
    return () => controller.abort()
  }, [thumbsDensity, accessToken, apiBase, projectId, onThumbsDensityChange])

  // single-clip compat
  const baseClip: ClipState | null = useMemo(() => {
    if (isMulti) return null
    if (!clipId || !videoSrc || !durationMs) return null
    return { clipId, videoSrc, durationMs, frames: initialFrames ?? [] }
  }, [isMulti, clipId, videoSrc, durationMs, initialFrames])

  const clipsOrdered = useMemo<ClipState[]>(() => (isMulti ? clips!.slice() : (baseClip ? [baseClip] : [])), [isMulti, clips, baseClip])

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

  const projectTotalMs = useMemo(
    () => Object.values(clipOffsets).reduce((sum, v) => sum + Math.max(0, v.end - v.start), 0),
    [clipOffsets]
  )

  // Global frames (para índices y timeline)
  const globalFrames = useMemo(() => {
    const frames: { index: number; clipId: number; localMs: number; globalMs: number }[] = []
    let runningIndex = 1
    for (const clip of clipsOrdered) {
      const meta = clipOffsets[clip.clipId]; if (!meta) continue
      const offset = meta.offset
      const baseFrames = Array.isArray(clip.frames) && clip.frames.length > 0 ? clip.frames : [0]
      const localFrames = Array.from(new Set([0, ...baseFrames])).sort((a, b) => a - b)
      for (const value of localFrames) {
        const localMs = Math.max(0, value)
        const globalMs = offset + localMs
        frames.push({ index: runningIndex, clipId: clip.clipId, localMs, globalMs })
        runningIndex += 1
      }
    }
    return frames
  }, [clipsOrdered, clipOffsets])

  const frameIndexMs = useMemo(() => globalFrames.map((f) => f.globalMs), [globalFrames])
  const totalFrameCount = useMemo(() => Math.max(0, globalFrames.length), [globalFrames])
const CUSTOM_DENSITIES = [5,6,7,8,9,10];
  const indexToStartMs = useCallback((index: number) => {
    if (!globalFrames.length) return 0
    const clamped = Math.min(Math.max(Math.round(index), 1), globalFrames.length)
    return globalFrames[clamped - 1]?.globalMs ?? 0
  }, [globalFrames])

  const indexToEndMs = useCallback((index: number) => {
    if (!globalFrames.length) return projectTotalMs
    const clamped = Math.min(Math.max(Math.round(index), 1), globalFrames.length)
    if (clamped >= globalFrames.length) return projectTotalMs
    return globalFrames[clamped]?.globalMs ?? projectTotalMs
  }, [globalFrames, projectTotalMs])

  const globalFrameLookupByClip = useMemo(() => {
    const map = new Map<number, Map<number, number>>()
    for (const f of globalFrames) {
      if (!map.has(f.clipId)) map.set(f.clipId, new Map())
      map.get(f.clipId)!.set(Math.round(f.globalMs), f.localMs)
    }
    return map
  }, [globalFrames])

  // Selección
  const [selectedGlobalMs, setSelectedGlobalMs] = useState<number>(initialTimeMs)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Thumbnails combinados
  const { combinedThumbs, generating, error, isCacheLoaded, setCombinedThumbs } = useCombinedThumbs({
    projectId, apiBase, accessToken, clipsOrdered, clipOffsets,
    thumbnailsCount, thumbsPerSecond: thumbsDensity, thumbnailHeight, disableAutoThumbnails,
  })

  const visibleThumbs = useMemo(
  () => applyDensityToThumbs(combinedThumbs, thumbsDensity),
  [combinedThumbs, thumbsDensity]
)


  const currentFrameIndex = useMemo(() => {
    if (!frameIndexMs.length) return null
    const idx = nearestIndex(frameIndexMs, selectedGlobalMs)
    return idx >= 0 ? idx + 1 : null
  }, [frameIndexMs, selectedGlobalMs])

const currentThumb = useMemo(() => {
  if (!visibleThumbs.length) return null
  if (selectedId) {
    const hit = visibleThumbs.find(t => t.id === selectedId)
    if (hit) return hit
  }
  const idx = nearestIndex(visibleThumbs.map(t => t.tGlobal), selectedGlobalMs)
  return visibleThumbs[idx] ?? null
}, [visibleThumbs, selectedId, selectedGlobalMs])


  // Textos del proyecto
  const [textsVersion, setTextsVersion] = useState(0)
  const {
    projectTexts,
    textFramesByClip,
    overlayToTextId,
    updateTextFrameLocal,
    getOverlayIdsForText,
  } = useProjectTexts(
    Boolean(accessToken && projectId && clipsOrdered.length),
    { apiBase, accessToken, projectId },
    clipSignature, clipsOrdered, clipOffsets, globalFrameLookupByClip, textsVersion
  )

  const activeTextFrames = useMemo(() => {
    if (!currentThumb) return []
    const framesForClip = textFramesByClip[currentThumb.clipId] ?? []
    const tLocal = currentThumb.tLocal, tGlobal = currentThumb.tGlobal
    return framesForClip.filter((tf) => {
      const gStart = tf.frame_start_global, gEnd = tf.frame_end_global
      const gSpec = tf.specific_frames_global ?? []
      const inGRange = gStart != null && gEnd != null && gStart <= tGlobal && tGlobal < gEnd
      const inGSpec = Array.isArray(gSpec) && gSpec.includes(Math.round(tGlobal))
      if (inGRange || inGSpec) return true

      const startMs = tf.frame_start, endMs = tf.frame_end
      const inRange = startMs != null && endMs != null && startMs <= tLocal && tLocal < endMs
      const inSpecific = Array.isArray(tf.specific_frames) && tf.specific_frames.includes(Math.round(tLocal))
      return inRange || inSpecific
    })
  }, [textFramesByClip, currentThumb])

const textPresenceLookup = useMemo(() => {
  const map = new Map<string, boolean>()
  for (const thumb of visibleThumbs) {
    const framesForClip = textFramesByClip[thumb.clipId] ?? []
    const hasText = framesForClip.some((tf) => {
      const start = tf.frame_start
      const end = tf.frame_end
      const specific = tf.specific_frames ?? []
      const inRange =
        start != null &&
        end != null &&
        start <= thumb.tLocal &&
        thumb.tLocal < end
      const inSpecific =
        Array.isArray(specific) &&
        specific.includes(Math.round(thumb.tLocal))
      return inRange || inSpecific
    })
    map.set(thumb.id, hasText)
  }
  return map
}, [visibleThumbs, textFramesByClip])


  // Play/Step
  const [isPlaying, setIsPlaying] = useState(false)
  const togglePlay = () => setIsPlaying((p) => !p)

 const stepForward = useCallback(() => {
  if (!visibleThumbs.length) return
  const idx = selectedId ? visibleThumbs.findIndex(t => t.id === selectedId)
    : nearestIndex(visibleThumbs.map(t => t.tGlobal), selectedGlobalMs)

  const nextIdx = idx + 1
  if (nextIdx < visibleThumbs.length) {
    const n = visibleThumbs[nextIdx]
    setSelectedId(n.id)
    setSelectedGlobalMs(n.tGlobal)
    scrollThumbIntoView(n.id)
  } else if (loop) {
    const n = visibleThumbs[0]
    setSelectedId(n.id)
    setSelectedGlobalMs(n.tGlobal)
    scrollThumbIntoView(n.id)
  } else {
    setIsPlaying(false)
  }
}, [visibleThumbs, loop, selectedId, selectedGlobalMs])


  usePlaybackStepper(isPlaying, playbackFps, [selectedGlobalMs, loop, combinedThumbs.length, selectedId], stepForward)

  // Cambios externos por tiempo
  if (onChange) { /* notificar cambios sin bucles */ onChange(selectedGlobalMs) }

  // Borrar frame seleccionado
  const [hasPendingChanges, setHasPendingChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isGeneratingSubtitles, setIsGeneratingSubtitles] = useState(false)
  const [subtitleProgressModal, setSubtitleProgressModal] = useState(false)
  const [frameModalOpen, setFrameModalOpen] = useState(false)
  const [frameModalMode, setFrameModalMode] = useState<'create' | 'edit'>('create')
  const selectedFrameIndex = useMemo(() => {
    if (!visibleThumbs.length) return -1
    if (selectedId) {
      const idx = visibleThumbs.findIndex((t) => t.id === selectedId)
      if (idx >= 0) return idx
    }
    const globals = visibleThumbs.map((t) => t.tGlobal)
    return nearestIndex(globals, selectedGlobalMs)
  }, [visibleThumbs, selectedGlobalMs, selectedId])
  const shouldConfirmFrameDeletion =
    selectedFrameIndex > 0 && selectedFrameIndex < visibleThumbs.length - 1

function deleteSelectedFrame() {
  if (!visibleThumbs.length) return

  // 1) localizar índice en la lista visible
  const idxVisible = selectedFrameIndex >= 0
    ? selectedFrameIndex
    : nearestIndex(visibleThumbs.map(t => t.tGlobal), selectedGlobalMs)

  const toDelete = visibleThumbs[idxVisible]
  if (!toDelete) return

  // 2) eliminar de la rejilla maestra (combinedThumbs), NO de visibleThumbs
  const nextCombined = combinedThumbs.filter(t => t.id !== toDelete.id)
  setCombinedThumbs(nextCombined)

  // 3) recalcular visibles con la densidad actual
  const nextVisible = applyDensityToThumbs(nextCombined, thumbsDensity)

  // 4) mover la selección a un frame cercano
  if (nextVisible.length) {
    const idxNext = Math.min(idxVisible, nextVisible.length - 1)
    const n = nextVisible[idxNext]
    setSelectedId(n.id)
    setSelectedGlobalMs(n.tGlobal)
  } else {
    setSelectedId(null)
    setSelectedGlobalMs(0)
  }

  setHasPendingChanges(true)
}


  async function handleSaveChanges() {
    if (!hasPendingChanges || !accessToken) return
    setIsSaving(true)
    const byClip = new Map<number, number[]>()
    for (const item of combinedThumbs) {
      const arr = byClip.get(item.clipId) ?? []; arr.push(item.tLocal); byClip.set(item.clipId, arr)
    }
    try {
      await Promise.all(
        Array.from(byClip.entries()).map(([cid, frames]) =>
          (async () => {
            const res = await fetch(`${apiBase}/projects/${projectId}/clips/${cid}/frames/`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
              },
              credentials: 'include',
              body: JSON.stringify({ frames }),
            })
            if (!res.ok) {
              const msg = await res.text()
              throw new Error(msg || `No se pudieron guardar los frames del clip ${cid}.`)
            }
          })()
        )
      )
      if (typeof window !== 'undefined') {
        for (const cid of byClip.keys()) {
          try {
            localStorage.removeItem(LS_KEY(projectId, cid))
          } catch {
            /* ignore */
          }
        }
      }
      setHasPendingChanges(false)
    } catch (e: any) {
      console.error(e); toast.error('No se pudieron guardar los cambios.')
    } finally { setIsSaving(false) }
  }

  // Editor de textos
  const [editorOpen, setEditorOpen] = useState(false)
  const [editorMode, setEditorMode] = useState<'create'|'edit'>('create')
  const [editorInitial, setEditorInitial] = useState<Partial<TextFrameModel> | undefined>(undefined)

  function openCreateTextEditor() {
    if (!clipsOrdered.length) { toast.warning('Necesitas añadir al menos un clip al proyecto para insertar texto.'); return }
    if (!totalFrameCount) { toast.error('No hay frames disponibles en el proyecto.'); return }
    const defaultStartMs = indexToStartMs(1)
    const defaultEndMs = indexToEndMs(totalFrameCount || 1)
    setEditorMode('create')
    setEditorInitial({
      frame_start: defaultStartMs,
      frame_end: defaultEndMs,
      specific_frames: [],
      content: '',
      typography: '',
      font_size: 18,
      color_hex: '#FFFFFF',
    })
    setEditorOpen(true)
  }
  function openEditTextEditor(overlayId: number) {
    const textId = overlayToTextId[overlayId]
    const aggregate = projectTexts.find((item) => item.id === textId)
    if (!aggregate) { toast.error('No se encontró el texto a editar.'); return }
    setEditorMode('edit')
    const fallbackSpecific = aggregate.specific_frames ?? []
    const fallbackStart = aggregate.frame_start ?? indexToStartMs(1)
    const fallbackEnd = aggregate.frame_end ?? indexToEndMs(totalFrameCount || 1)
    setEditorInitial({
      text_id: aggregate.id,
      content: aggregate.content,
      typography: aggregate.typography ?? '',
      font_size: aggregate.font_size ?? 18,
      color_hex: aggregate.color_hex ?? '#FFFFFF',
      frame_start: fallbackStart,
      frame_end: fallbackEnd,
      specific_frames: fallbackSpecific,
    })
    setEditorOpen(true)
  }
  function handleEditorSaved() { setTextsVersion(v => v + 1) }

  const handleTextDeleted = useCallback(() => {
    setTextsVersion((v) => v + 1)
  }, [])

  const handleGenerateSubtitles = useCallback(async () => {
    if (!accessToken) {
      toast.error('Debes iniciar sesión para generar subtítulos.')
      return
    }
    if (!clipsOrdered.length) {
      toast.warning('Añade al menos un clip antes de generar subtítulos.')
      return
    }
    setIsGeneratingSubtitles(true)
    setSubtitleProgressModal(true)
    try {
      const res = await fetch(`${apiBase}/projects/${projectId}/generate-subtitles/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: 'include',
      })
      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg || 'No se pudieron generar los subtítulos.')
      }
      let summary: any = null
      try {
        summary = await res.json()
      } catch {
        summary = null
      }
      setTextsVersion((v) => v + 1)
      if (summary?.segments) {
        toast.success(`Subtítulos generados: ${summary.segments} segmentos procesados.`)
      } else {
        toast.success('Subtítulos generados correctamente.')
      }
    } catch (err: any) {
      toast.error(err?.message || 'No se pudieron generar los subtítulos.')
    } finally {
      setIsGeneratingSubtitles(false)
      setSubtitleProgressModal(false)
    }
  }, [accessToken, apiBase, projectId, clipsOrdered.length])

  const handleFrameButtonClick = useCallback(
    (mode: 'create' | 'edit' = 'create') => {
      if (!clipsOrdered.length) {
        toast.warning('Añade al menos un clip antes de insertar un marco.')
        return
      }
      setFrameModalMode(mode)
      setFrameModalOpen(true)
    },
    [clipsOrdered.length]
  )

  const handleFrameModalConfirm = useCallback(
    async (payload: FrameFormPayload) => {
      if (!accessToken) {
        throw new Error('Debes iniciar sesión para aplicar un marco.')
      }
      const res = await fetch(`${apiBase}/projects/${projectId}/frame/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          frame_id: payload.frameId,
          thickness_pct: payload.thicknessPct,
          positions: payload.positions,
          color_hex: payload.colorHex,
          tile_id: payload.tileId ?? null,
          tile_filled: payload.tileFilled,
        }),
      })
      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg || 'No se pudo actualizar el marco del proyecto.')
      }
      const posLabel = payload.positions.join(', ')
      toast.success(`Marco configurado: ${(payload.thicknessPct * 100).toFixed(2)}% • lados ${posLabel || '—'}.`)
      onFrameChange?.()
    },
    [accessToken, apiBase, projectId, onFrameChange]
  )

  const handleFrameDelete = useCallback(async () => {
    if (!accessToken) {
      throw new Error('Debes iniciar sesión para eliminar el marco.')
    }
    const res = await fetch(`${apiBase}/projects/${projectId}/frame/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      credentials: 'include',
      body: JSON.stringify({ frame_id: null }),
    })
    if (!res.ok) {
      const msg = await res.text()
      throw new Error(msg || 'No se pudo eliminar el marco del proyecto.')
    }
    toast.success('Marco eliminado del proyecto.')
    onFrameChange?.()
  }, [accessToken, apiBase, projectId, onFrameChange])

  // Keyboard handler
const onTimelineKeyDown = makeTimelineKeydownHandler(
  visibleThumbs,
  selectedId,
  (n) => { setSelectedId(n.id); setSelectedGlobalMs(n.tGlobal) },
  scrollThumbIntoView,
  togglePlay
)


  return (
    <div className="w-full flex flex-col gap-4 h-[90vh] min-h-0">
      {/* Viewer */}
<BigFrameViewer
  current={currentThumb ? { videoSrc: currentThumb.videoSrc, tLocal: currentThumb.tLocal } : null}
  generating={generating}
  isCacheLoaded={isCacheLoaded}
  activeTextFrames={activeTextFrames}
  apiBase={apiBase}
  accessToken={accessToken}
  onEditText={openEditTextEditor}
  onPositionChange={updateTextFrameLocal}
  getLinkedOverlayIds={getOverlayIdsForText}
  onDeleteText={handleTextDeleted}
  printAspect={printAspectSlug ?? 'fill'}
  printSizeLabel={printSizeLabel ?? undefined}
  frameSetting={frameSetting ?? undefined}
  printWidthMm={printWidthMm ?? undefined}
  printHeightMm={printHeightMm ?? undefined}
  printQualityPpi={printQualityPpi ?? undefined}
  printEffectName={printEffectName ?? undefined}
  leftHud={
    <div className="flex items-center gap-3">
      <DeleteFrameButton
        onClick={deleteSelectedFrame}
        disabled={!combinedThumbs.length || generating}
        shouldConfirm={shouldConfirmFrameDeletion}
      />
      <p className="text-white font-bold text-sm">{visibleThumbs.length} Páginas</p>

      <label className="flex items-center gap-1 text-[11px] text-white/90">
        Fotos / Seg

<select
  value={thumbsDensity}
  onChange={(e) => setThumbsDensity(Number(e.target.value))}
  className="rounded border border-white/40 bg-black/40 text-white text-[11px] px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-yellow-300"
  disabled={!accessToken}
>
  {/* 2. Mapea la constante para generar las opciones */}
  {CUSTOM_DENSITIES.map((value) => (
    <option key={value} value={value}>
      {value}
    </option>
  ))}
</select>
      </label>
    </div>
  }
  rightHud={
    <div className="flex items-center gap-2">
      <div className="text-xs bg-black/60 text-white px-2 py-1 rounded flex items-center gap-2">
        <span>{formatTime(selectedGlobalMs)} / {formatTime(projectTotalMs)}</span>
        {currentFrameIndex != null && totalFrameCount > 0 && (
          <span>Frame {currentFrameIndex} / {totalFrameCount}</span>
        )}
      </div>
      <PlayButton onClick={stepForward} />
    </div>
  }
/>


      {/* HUD inferior izquierdo y derecho sobre viewer (encapsulados arriba excepto estos botones) */}
      <div className="absolute pointer-events-none inset-0 hidden" />

<p className="text-white text-xs">
  master: {combinedThumbs.length} • visibles: {visibleThumbs.length} • densidad: {thumbsDensity}
</p>

      {/* Timeline */}
<GlobalTimeline
  items={visibleThumbs}
  selectedId={selectedId}
  onSelect={(it) => { setSelectedId(it.id); setSelectedGlobalMs(it.tGlobal) }}
  isReady={isCacheLoaded && !generating}
  thumbnailHeight={thumbnailHeight}
  error={error}
  onKeyDown={onTimelineKeyDown}
  textPresence={textPresenceLookup}
/>

      {/* Tools */}
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
          onInsertFrame={() => handleFrameButtonClick('create')}
          onEditFrame={() => handleFrameButtonClick('edit')}
  onGenerateSubtitles={handleGenerateSubtitles}
  isGeneratingSubtitles={isGeneratingSubtitles}
  hasFrame={Boolean(frameSetting && frameSetting.frame)}
/>
      </div>

      {/* Modal editor de textos */}
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
        onClose={() => setEditorOpen(false)}
        onSaved={handleEditorSaved}
/>

<FrameModal
  open={frameModalOpen}
  mode={frameModalMode}
  apiBase={apiBase}
  accessToken={accessToken}
  currentSetting={frameSetting ?? null}
  onClose={() => setFrameModalOpen(false)}
  onConfirm={handleFrameModalConfirm}
  onDelete={frameSetting ? handleFrameDelete : undefined}
/>

      <Modal
        open={subtitleProgressModal}
        onClose={() => {
          if (!isGeneratingSubtitles) setSubtitleProgressModal(false)
        }}
        closeOnOverlay={false}
        size="sm"
        title="Generando subtítulos"
      >
        <ProgressIndicator label="Generando subtítulos" progress={isGeneratingSubtitles ? 25 : 100} />
      </Modal>
    </div>
  )
}

/* ===== Helpers locales mínimos ===== */
function scrollThumbIntoView(combinedId: string) {
  const el = document.getElementById(`thumb-${combinedId}`)
  el?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })
}

function applyDensityToThumbs(
  thumbs: { tGlobal: number }[],
  density: number
) {
  const d = Math.max(1, Math.round(density || 1))
  if (thumbs.length <= d) return thumbs

  // Queremos ~d "fotos" por segundo → calculamos un paso en ms
  const totalMs = thumbs[thumbs.length - 1]?.tGlobal ?? 0
  if (totalMs <= 0) return thumbs

  const totalSec = totalMs / 1000
  const targetCount = Math.max(2, Math.round(totalSec * d) + 1)

  const lastIndex = thumbs.length - 1
  const segments = Math.max(1, targetCount - 1)
  const step = lastIndex / segments

  const picked: typeof thumbs = []
  for (let i = 0; i < targetCount; i++) {
    const idx = Math.min(lastIndex, Math.round(i * step))
    picked.push(thumbs[idx])
  }

  // aseguramos último
  if (picked[picked.length - 1] !== thumbs[lastIndex]) {
    picked[picked.length - 1] = thumbs[lastIndex]
  }

  // quitamos duplicados por si acaso
  const seen = new Set<string>()
  return picked.filter((t) => {
    const key = String(t.tGlobal)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

