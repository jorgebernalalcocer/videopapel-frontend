// src/components/project/EditingCanvas.tsx
'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import PlayButton from '@/components/project/PlayButton'
import EditingTools from '@/components/project/EditingTools'
import DeleteFrameButton from '@/components/project/DeleteFrameButton'
import { toast } from 'sonner'
import BigFrameViewer from '@/components/project/viewer/BigFrameViewer'
import GlobalTimeline from '@/components/project/timeline/GlobalTimeline'
import TextFrameEditorModal, { TextFrameModel } from '@/components/project/TextFrameEditorModal'

import { useCombinedThumbs } from '@/hooks/useCombinedThumbs'
import { usePlaybackStepper } from '@/hooks/usePlaybackStepper'
import { useProjectTexts } from '@/hooks/useProjectTexts'
import { makeTimelineKeydownHandler } from '@/hooks/useKeyboardTimelineNav'
import { formatTime, nearestIndex } from '@/utils/time'

/* ===== Tipos (abrev.) ===== */
type ClipState = { clipId: number; videoSrc: string; durationMs: number; frames: number[]; timeStartMs?: number; timeEndMs?: number }
type EditingCanvasProps = {
  projectId: string; apiBase: string; accessToken: string | null;
  clips?: ClipState[]; clipId?: number; videoSrc?: string; durationMs?: number;
  initialFrames?: number[]; initialTimeMs?: number; thumbsPerSecond?: number;
  thumbnailsCount?: number; thumbnailHeight?: number; onChange?: (timeMs: number) => void;
  disableAutoThumbnails?: boolean; playbackFps?: number; loop?: boolean; onInsertVideo?: () => void;
}

/* ===== Componente ===== */

export default function EditingCanvas(props: EditingCanvasProps) {
  const {
    projectId, apiBase, accessToken, clips, clipId, videoSrc, durationMs, initialFrames,
    initialTimeMs = 0, thumbnailsCount, thumbsPerSecond, thumbnailHeight = 68,
    onChange, disableAutoThumbnails = false, playbackFps = 12, loop = true, onInsertVideo,
  } = props

  const isMulti = Array.isArray(clips) && clips.length > 0

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
    thumbnailsCount, thumbsPerSecond, thumbnailHeight, disableAutoThumbnails,
  })

  const currentFrameIndex = useMemo(() => {
    if (!frameIndexMs.length) return null
    const idx = nearestIndex(frameIndexMs, selectedGlobalMs)
    return idx >= 0 ? idx + 1 : null
  }, [frameIndexMs, selectedGlobalMs])

  const currentThumb = useMemo(() => {
    if (!combinedThumbs.length) return null
    if (selectedId) {
      const hit = combinedThumbs.find(t => t.id === selectedId)
      if (hit) return hit
    }
    const idx = nearestIndex(combinedThumbs.map(t => t.tGlobal), selectedGlobalMs)
    return combinedThumbs[idx] ?? null
  }, [combinedThumbs, selectedId, selectedGlobalMs])

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

  // Play/Step
  const [isPlaying, setIsPlaying] = useState(false)
  const togglePlay = () => setIsPlaying((p) => !p)

  const stepForward = useCallback(() => {
    if (!combinedThumbs.length) return
    const idx = selectedId ? combinedThumbs.findIndex(t => t.id === selectedId)
      : nearestIndex(combinedThumbs.map(t => t.tGlobal), selectedGlobalMs)

    const nextIdx = idx + 1
    if (nextIdx < combinedThumbs.length) {
      const n = combinedThumbs[nextIdx]; setSelectedId(n.id); setSelectedGlobalMs(n.tGlobal); scrollThumbIntoView(n.id)
    } else if (loop) {
      const n = combinedThumbs[0]; setSelectedId(n.id); setSelectedGlobalMs(n.tGlobal); scrollThumbIntoView(n.id)
    } else { setIsPlaying(false) }
  }, [combinedThumbs, loop, selectedId, selectedGlobalMs])

  usePlaybackStepper(isPlaying, playbackFps, [selectedGlobalMs, loop, combinedThumbs.length, selectedId], stepForward)

  // Cambios externos por tiempo
  if (onChange) { /* notificar cambios sin bucles */ onChange(selectedGlobalMs) }

  // Borrar frame seleccionado
  const [hasPendingChanges, setHasPendingChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isGeneratingSubtitles, setIsGeneratingSubtitles] = useState(false)

  function deleteSelectedFrame() {
    if (!combinedThumbs.length) return
    const idx = selectedId ? combinedThumbs.findIndex(t => t.id === selectedId)
      : nearestIndex(combinedThumbs.map(t => t.tGlobal), selectedGlobalMs)

    const next = combinedThumbs.slice(0, idx).concat(combinedThumbs.slice(idx + 1))
    setCombinedThumbs(next)

    if (next[idx]) { const n = next[idx]; setSelectedId(n.id); setSelectedGlobalMs(n.tGlobal) }
    else if (next.length) { const last = next[next.length - 1]; setSelectedId(last.id); setSelectedGlobalMs(last.tGlobal) }
    else { setSelectedId(null); setSelectedGlobalMs(0) }

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
          fetch(`${apiBase}/projects/${projectId}/clips/${cid}/frames/`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
            body: JSON.stringify({ frames }),
          })
        )
      )
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
    setEditorInitial({ frame_start: defaultStartMs, frame_end: defaultEndMs, specific_frames: [], content: '', typography: '' })
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
      text_id: aggregate.id, content: aggregate.content, typography: aggregate.typography ?? '',
      frame_start: fallbackStart, frame_end: fallbackEnd, specific_frames: fallbackSpecific,
    })
    setEditorOpen(true)
  }
  function handleEditorSaved() { setTextsVersion(v => v + 1) }

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
    }
  }, [accessToken, apiBase, projectId, clipsOrdered.length])

  // Keyboard handler
  const onTimelineKeyDown = makeTimelineKeydownHandler(
    combinedThumbs,
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
  leftHud={
    <div className="flex items-center gap-2">
      <DeleteFrameButton onClick={deleteSelectedFrame} disabled={!combinedThumbs.length || generating} />
      <p className="text-white font-bold text-sm">{combinedThumbs.length} Páginas</p>
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



      {/* Timeline */}
      <GlobalTimeline
        items={combinedThumbs}
        selectedId={selectedId}
        onSelect={(it) => { setSelectedId(it.id); setSelectedGlobalMs(it.tGlobal) }}
        isReady={isCacheLoaded && !generating}
        thumbnailHeight={thumbnailHeight}
        error={error}
        onKeyDown={onTimelineKeyDown}
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
          onGenerateSubtitles={handleGenerateSubtitles}
          isGeneratingSubtitles={isGeneratingSubtitles}
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
    </div>
  )
}

/* ===== Helpers locales mínimos ===== */
function scrollThumbIntoView(combinedId: string) {
  const el = document.getElementById(`thumb-${combinedId}`)
  el?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })
}
