// src/components/project/viewer/BigFrameViewer.tsx
'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import clsx from 'clsx'
import { Maximize2, Minimize2, Crop } from 'lucide-react'
import BusyOverlay from '@/components/ui/BusyOverlay'
import TextOverlayLayer from '@/components/project/overlays/TextOverlayLayer'
import { cloudinaryPreviewVideoUrl } from '@/utils/cloudinary'
import { paintFrameToCanvas, seekVideo, setVideoSrcAndWait } from '@/utils/video'

type ActiveTextItem = {
  id: number
  text_id?: number
  content: string
  typography: string | null
  position_x: number
  position_y: number
}

export default function BigFrameViewer(props: {
  current?: { videoSrc: string; tLocal: number } | null
  generating: boolean
  isCacheLoaded: boolean
  activeTextFrames: ActiveTextItem[]
  apiBase: string
  accessToken: string | null
  onEditText: (overlayId: number) => void
  onPositionChange: (id: number, x: number, y: number) => void
  getLinkedOverlayIds: (overlayId: number) => number[]
  onDeleteText: (textId: number) => void
  leftHud?: React.ReactNode
  rightHud?: React.ReactNode
  printAspect?: string | null
}) {
  const {
    current,
    generating,
    isCacheLoaded,
    activeTextFrames,
    apiBase,
    accessToken,
    onEditText,
    onPositionChange,
    getLinkedOverlayIds,
    onDeleteText,
    leftHud,
    rightHud,
    printAspect = 'fill',
  } = props

  // 👇 te faltaban estos
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const [isFull, setIsFull] = useState(false)
  const [paintError, setPaintError] = useState(false)
  const [flash, setFlash] = useState(false)
  const [showPrintArea, setShowPrintArea] = useState(false)
  const [printFrame, setPrintFrame] = useState<{ width: number; height: number } | null>(null)

  useEffect(() => {
    ;(async () => {
      if (!current) {
        setPrintFrame(null)
        return
      }
      const video = videoRef.current
      const canvas = canvasRef.current
      const wrapper = wrapperRef.current
      if (!video || !canvas) return
      setPaintError(false)
      setFlash(true)

      const targetHeight = Math.max(240, Math.min(wrapper?.clientHeight ?? 720, 1080))
      const previewSrc = cloudinaryPreviewVideoUrl(current.videoSrc, targetHeight)

      // dataset.previewSrc para evitar recargas inútiles
      if ((video as any).dataset?.previewSrc !== previewSrc || video.src !== previewSrc) {
        try {
          ;(video as any).dataset.previewSrc = previewSrc
          await setVideoSrcAndWait(video, previewSrc)
        } catch {
          setPaintError(true)
          return
        }
      }

      try {
        await seekVideo(video, current.tLocal / 1000)
        await paintFrameToCanvas(video, canvas, wrapper, isFull)
        const width = canvas.clientWidth
        const height = canvas.clientHeight
        setPrintFrame({
          width,
          height,
        })
      } catch {
        setPaintError(true)
        setPrintFrame(null)
      }
    })()
  }, [current?.videoSrc, current?.tLocal, isFull])

  useEffect(() => {
    if (!flash) return
    const timer = setTimeout(() => setFlash(false), 160)
    return () => clearTimeout(timer)
  }, [flash])

  const printOverlay = useMemo(() => {
    if (!printFrame || !printFrame.width || !printFrame.height) return null
    const baseWidth = printFrame.width
    const baseHeight = printFrame.height
    const minDim = Math.min(baseWidth, baseHeight)
    const baseBorderWidth = 8
    const aspect = (printAspect || 'fill').toLowerCase()
    if (aspect === 'fit') {
      const margin = Math.min(Math.max(12, Math.round(minDim * 0.08)), Math.round(minDim * 0.4))
      return {
        mode: 'fit' as const,
        width: baseWidth + margin * 2,
        height: baseHeight + margin * 2,
        borderWidth: baseBorderWidth,
        boxShadow: `inset 0 0 0 ${margin}px rgba(255,255,255,0.85)`,
      }
    }
    const inset = Math.min(Math.max(12, Math.round(minDim * 0.06)), Math.round(minDim / 3))
    return {
      mode: 'fill' as const,
      width: Math.max(1, baseWidth - inset * 2),
      height: Math.max(1, baseHeight - inset * 2),
      borderWidth: baseBorderWidth,
      boxShadow: '0 0 0 9999px rgba(0,0,0,0.25)',
    }
  }, [printFrame, printAspect])

  const canvasClassName = isFull
    ? 'block bg-black'
    : 'block h-auto w-auto max-h-full max-w-full bg-black'

  return (
    <div className="rounded-lg overflow-hidden bg-black relative flex-1 min-h-0 flex items-center justify-center">
      {/* Estado de carga/generación */}
      {(generating || !isCacheLoaded) && (
        <BusyOverlay
          show
          labelBusy={isCacheLoaded ? 'Generando miniaturas…' : 'Cargando…'}
        />
      )}

      {/* Video oculto para decodificar frames */}
      <video
        ref={videoRef}
        preload="metadata"
        muted
        playsInline
        crossOrigin="anonymous"
        className="hidden"
      />

      {/* Mensaje de error al pintar */}
      {paintError && (
        <div className="absolute inset-0 z-20 flex items-center justify-center text-center">
          <p className="text-white text-base bg-black/70 p-4 rounded-lg">
            Fallo al abrir el fotograma. Recomendamos borrar este proyecto y el
            video problemático y volver a subirlo de nuevo.
          </p>
        </div>
      )}

      {/* Canvas centrado */}
      <div
        ref={wrapperRef}
        className="flex h-full w-full items-center justify-center max-h-full max-w-full overflow-hidden relative"
      >
        <canvas
          ref={canvasRef}
          className={canvasClassName}
          style={{ display: paintError ? 'none' : 'block' }}
        />
        {showPrintArea && !paintError && printOverlay && (
          <div
            className="absolute pointer-events-none flex items-center justify-center"
            style={{
              left: '50%',
              top: '50%',
              width: `${printOverlay.width}px`,
              height: `${printOverlay.height}px`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div
              className="rounded-sm border-yellow-300 opacity-90"
              style={{
                width: '100%',
                height: '100%',
                borderWidth: printOverlay.borderWidth,
                borderStyle: 'solid',
                boxShadow: printOverlay.boxShadow || undefined,
              }}
            />
            {printOverlay.mode === 'fit' && printFrame && (
              <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <div
                  className="border border-dashed border-white/80"
                  style={{
                    width: `${printFrame.width}px`,
                    height: `${printFrame.height}px`,
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Capa de textos arrastrables (solo si no hay error) */}
      {!paintError && (
        <TextOverlayLayer
          wrapperRef={wrapperRef}
          canvasRef={canvasRef}
          items={activeTextFrames.map((tf) => ({
            id: tf.id,
            textId: tf.text_id,
            content: tf.content,
            typography: tf.typography ?? null,
            x: Number(tf.position_x ?? 0.5),
            y: Number(tf.position_y ?? 0.5),
          }))}
          // la actualización se gestiona desde el padre con su callback propio; aquí no hacemos nada
          onLocalPositionChange={onPositionChange}
          getLinkedOverlayIds={getLinkedOverlayIds}
          onDeleteText={onDeleteText}
          apiBase={apiBase}
          accessToken={accessToken}
          disabled={generating || !isCacheLoaded}
          onEdit={onEditText}
        />
      )}

      {/* flash parpadeante ejecto pasar pagina */}

      {flash && !paintError && (
        <div className="pointer-events-none absolute inset-0 z-20">
          <div
            className={clsx(
              'absolute inset-0 rounded-lg bg-gradient-to-br from-transparent via-transparent to-white/65',
              'opacity-0 animate-[flashFade_180ms_ease-out]',
            )}
          />
          <style jsx global>{`
            @keyframes flashFade {
              0% {
                opacity: 0;
              }
              40% {
                opacity: 0.25;
              }
              100% {
                opacity: 0;
              }
            }
          `}</style>
        </div>
      )}

      {/* Botón de visualización arriba-izquierda */}
      <div className="absolute top-2 left-2 z-30 pointer-events-auto flex gap-2">
        <button
          type="button"
          onClick={() => setIsFull((p) => !p)}
          className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 text-xs font-medium text-white shadow-sm ring-1 ring-white/20 backdrop-blur transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          aria-pressed={isFull}
        >
          {isFull ? (
            <Minimize2 className="h-3.5 w-3.5" />
          ) : (
            <Maximize2 className="h-3.5 w-3.5" />
          )}
          Visualización
        </button>
        <button
          type="button"
          onClick={() => { setShowPrintArea((prev) => !prev); setIsFull(false) }}
          className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-white shadow-sm ring-1 backdrop-blur transition ${
            showPrintArea
              ? 'bg-yellow-500/20 ring-yellow-300 hover:bg-yellow-500/30 focus-visible:ring-yellow-400'
              : 'bg-white/10 ring-white/20 hover:bg-white/20 focus-visible:ring-blue-400'
          }`}
          aria-pressed={showPrintArea}
        >
          <Crop className="h-3.5 w-3.5" />
          {showPrintArea ? 'Ocultar zona impresión' : 'Zona de impresión'}
        </button>
      </div>

      {/* HUD inyectables (abajo-izq / abajo-der) */}
      {leftHud && (
        <div className="absolute bottom-2 left-2 z-30 pointer-events-auto">
          {leftHud}
        </div>
      )}
      {rightHud && (
        <div className="absolute bottom-2 right-2 z-30 pointer-events-auto">
          {rightHud}
        </div>
      )}
    </div>
  )
}
