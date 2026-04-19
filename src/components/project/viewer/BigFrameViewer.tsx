// src/components/project/viewer/BigFrameViewer.tsx
'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import clsx from 'clsx'
import { Maximize2, Minimize2, Crop, Edit, Image as ImageIcon } from 'lucide-react'
import BusyOverlay from '@/components/ui/BusyOverlay'
import TextOverlayLayer from '@/components/project/overlays/TextOverlayLayer'
import FrameStyleOverlay from '@/components/project/viewer/FrameStyleOverlay'
import ApplyEffect from '@/components/project/viewer/ApplyEffect'
import { paintFrameToCanvas, seekVideo, setVideoSrcAndWait } from '@/utils/video'
import type { FrameSettingClient } from '@/types/frame'
import { ColorActionButton } from '@/components/ui/color-action-button'

type ActiveTextItem = {
  id: number
  text_id?: number
  content: string
  typography: string | null
  font_size?: number | null
  color_hex?: string | null
  text_background_enabled?: boolean | null
  text_background_style?: 'fill' | 'outline' | 'transparent' | null
  text_background_color_hex?: string | null
  position_x: number
  position_y: number
}

type PrintOverlay =
  | {
      mode: 'fit'
      width: number
      height: number
      borderWidth: number
      shadow: undefined
      innerWidth: number
      innerHeight: number
      marginX: number
      marginY: number
    }
  | {
      mode: 'fill'
      width: number
      height: number
      borderWidth: number
      shadow: string
      innerWidth?: undefined
      innerHeight?: undefined
      marginX?: undefined
      marginY?: undefined
    }

export default function BigFrameViewer(props: {
  current?: {
    videoSrc: string
    tLocal: number
    previewUrl?: string
    basePreviewUrl?: string
    insertedImage?: {
      id: number
      image_url: string
      offset_x_pct: number
      offset_y_pct: number
      width_pct: number
      height_pct: number
    } | null
  } | null
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
  printSizeLabel?: string | null
  frameSetting?: FrameSettingClient | null
  printWidthMm?: number | null
  printHeightMm?: number | null
  printQualityDpi?: number | null
  printQualityPpi?: number | null
  printEffectName?: string | null
  isCoverPhoto?: boolean
  onOpenCover?: () => void
  showViewerControls?: boolean
  forceFull?: boolean
  isPresentation?: boolean
  onSaveInsertedImageLayout?: (payload: { id: number; offset_x_pct: number; offset_y_pct: number; width_pct: number; height_pct: number }) => void | Promise<void>
  onDeleteInsertedImage?: (imageId: number) => void | Promise<void>
  onInsertedImageEditStateChange?: (state: {
    active: boolean
    canForceExpand: boolean
    onForceExpand?: () => void
    onSave?: () => void | Promise<void>
    onDelete?: () => void | Promise<void>
  }) => void
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
    printSizeLabel,
    frameSetting,
    printWidthMm,
    printHeightMm,
    printQualityDpi,
    printQualityPpi,
    printEffectName,
    isCoverPhoto = false,
    onOpenCover,
    showViewerControls = true,
    forceFull = false,
    isPresentation = false,
    onSaveInsertedImageLayout,
    onDeleteInsertedImage,
    onInsertedImageEditStateChange,
  } = props

  // 👇 te faltaban estos
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const [isFull, setIsFull] = useState(forceFull)
  const [paintError, setPaintError] = useState(false)
  const [flash, setFlash] = useState(false)
  const [showPrintArea, setShowPrintArea] = useState(true)
  const [printFrame, setPrintFrame] = useState<{ width: number; height: number } | null>(null)
  const [imageEditMode, setImageEditMode] = useState(false)
  const [imageLayout, setImageLayout] = useState(() => ({
    offset_x_pct: 0.5,
    offset_y_pct: 0.5,
    width_pct: 0.5,
    height_pct: 0.5,
  }))
  const [insertedImageNaturalSize, setInsertedImageNaturalSize] = useState<{ width: number; height: number } | null>(null)
  const activeFrameSetting =
    frameSetting && Array.isArray(frameSetting.positions) && frameSetting.positions.length
      ? frameSetting
      : null
  const qualityDpi = printQualityDpi ?? printQualityPpi ?? null

  useEffect(() => {
    const inserted = current?.insertedImage
    if (!inserted) {
      setImageEditMode(false)
      return
    }
    setImageLayout({
      offset_x_pct: inserted.offset_x_pct,
      offset_y_pct: inserted.offset_y_pct,
      width_pct: inserted.width_pct,
      height_pct: inserted.height_pct,
    })
    setImageEditMode(false)
  }, [
    current?.insertedImage?.id,
    current?.insertedImage?.offset_x_pct,
    current?.insertedImage?.offset_y_pct,
    current?.insertedImage?.width_pct,
    current?.insertedImage?.height_pct,
  ])

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

      const previewSrc = current.basePreviewUrl ?? current.previewUrl

      const tryPaintPreview = async () => {
        if (!previewSrc) return false
        try {
          const img = new Image()
          img.crossOrigin = 'anonymous'
          img.decoding = 'async'
          img.src = previewSrc
          await img.decode()
          const w = img.naturalWidth || img.width
          const h = img.naturalHeight || img.height
          if (!w || !h) return false
          const maxW = wrapper?.clientWidth ?? w
          const maxH = wrapper?.clientHeight ?? h
          const ratioBase = isFull ? Math.max(maxW / w, maxH / h) : Math.min(maxW / w, maxH / h)
          const ratio = Number.isFinite(ratioBase) && ratioBase > 0 ? ratioBase : 1
          const displayW = Math.max(1, Math.round(w * ratio))
          const displayH = Math.max(1, Math.round(h * ratio))

          canvas.width = w
          canvas.height = h
          canvas.style.width = `${displayW}px`
          canvas.style.height = `${displayH}px`

          const ctx = canvas.getContext('2d')
          if (!ctx) return false
          ctx.clearRect(0, 0, w, h)
          ctx.drawImage(img, 0, 0, w, h)
          setPrintFrame({ width: displayW, height: displayH })
          console.log('[BigFrameViewer] preview pintada desde IndexedDB/local cache', {
            w, h, displayW, displayH,
          })
          return true
        } catch (error) {
          console.warn('[BigFrameViewer] no se pudo usar preview cacheada', error)
          return false
        }
      }
      if (await tryPaintPreview()) return

      const fallbackVideoSrc = current.videoSrc

      // dataset.previewSrc para evitar recargas inútiles
      if ((video as any).dataset?.previewSrc !== fallbackVideoSrc || video.src !== fallbackVideoSrc) {
        try {
          ;(video as any).dataset.previewSrc = fallbackVideoSrc
          await setVideoSrcAndWait(video, fallbackVideoSrc)
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

  const printOverlay = useMemo<PrintOverlay | null>(() => {
    if (!printFrame || !printFrame.width || !printFrame.height) return null
    const imgW = printFrame.width
    const imgH = printFrame.height
    const targetRatio = Math.SQRT2 // Serie A
    const landscape = imgW >= imgH
    const borderWidth = 2 //espesor grosor marco amarillo
    const mode = (printAspect || 'fill').toLowerCase()

    if (mode === 'fit') {
      let rectW: number
      let rectH: number
      if (landscape) {
        rectH = Math.max(imgH, imgW / targetRatio)
        rectW = rectH * targetRatio
        if (rectW < imgW) {
          rectW = imgW
          rectH = rectW / targetRatio
        }
      } else {
        rectW = Math.max(imgW, imgH / targetRatio)
        rectH = rectW * targetRatio
        if (rectH < imgH) {
          rectH = imgH
          rectW = rectH / targetRatio
        }
      }
      const marginX = (rectW - imgW) / 2
      const marginY = (rectH - imgH) / 2
      return {
        mode: 'fit' as const,
        width: rectW,
        height: rectH,
        borderWidth,
        innerWidth: imgW,
        innerHeight: imgH,
        marginX,
        marginY,
        shadow: undefined,
      }
    }

    let rectW: number
    let rectH: number
    if (landscape) {
      rectH = Math.min(imgH, imgW / targetRatio)
      rectW = rectH * targetRatio
    } else {
      rectW = Math.min(imgW, imgH / targetRatio)
      rectH = rectW * targetRatio
    }
    return {
      mode: 'fill' as const,
      width: rectW,
      height: rectH,
      borderWidth,
      shadow: '0 0 0 9999px rgba(0,0,0,0.25)',
      innerWidth: undefined,
      innerHeight: undefined,
      marginX: undefined,
      marginY: undefined,
    }
  }, [printFrame, printAspect])

  const canvasClassName = isFull
    ? 'block bg-black'
    : 'block h-auto w-full sm:w-auto max-h-full max-w-full bg-black'

  useEffect(() => {
    if (forceFull) setIsFull(true)
  }, [forceFull])

  const insertedImage = current?.insertedImage ?? null

  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

  const updateLayout = (partial: Partial<typeof imageLayout>) => {
    setImageLayout((prev) => {
      const next = { ...prev, ...partial }
      return {
        offset_x_pct: clamp(next.offset_x_pct, 0, 1),
        offset_y_pct: clamp(next.offset_y_pct, 0, 1),
        width_pct: clamp(next.width_pct, 0.02, 1),
        height_pct: clamp(next.height_pct, 0.02, 1),
      }
    })
  }

  const handleOverlayPointerDown = (
    event: React.PointerEvent<HTMLElement>,
    mode: 'move' | 'resize-nw' | 'resize-ne' | 'resize-sw' | 'resize-se',
  ) => {
    if (!imageEditMode || !wrapperRef.current || !printFrame) return
    event.preventDefault()
    event.stopPropagation()
    const target = event.currentTarget
    target.setPointerCapture(event.pointerId)
    const startX = event.clientX
    const startY = event.clientY
    const start = { ...imageLayout }
    const frameWidth = printFrame.width
    const frameHeight = printFrame.height

    const onMove = (moveEvent: PointerEvent) => {
      const dxPct = (moveEvent.clientX - startX) / frameWidth
      const dyPct = (moveEvent.clientY - startY) / frameHeight

      if (mode === 'move') {
        updateLayout({
          offset_x_pct: start.offset_x_pct + dxPct,
          offset_y_pct: start.offset_y_pct + dyPct,
        })
        return
      }

      const xSign = mode.includes('e') ? 1 : -1
      const ySign = mode.includes('s') ? 1 : -1
      updateLayout({
        width_pct: start.width_pct + dxPct * xSign,
        height_pct: start.height_pct + dyPct * ySign,
      })
    }

    const onUp = () => {
      target.releasePointerCapture(event.pointerId)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const handleForceExpand = useCallback(() => {
    if (!printFrame || !insertedImageNaturalSize) return

    const frameRatio = printFrame.width / printFrame.height
    const imageRatio = insertedImageNaturalSize.width / insertedImageNaturalSize.height
    if (!Number.isFinite(frameRatio) || !Number.isFinite(imageRatio) || frameRatio <= 0 || imageRatio <= 0) {
      return
    }

    let widthPct = 1
    let heightPct = 1

    if (imageRatio >= frameRatio) {
      heightPct = 1
      widthPct = imageRatio / frameRatio
    } else {
      widthPct = 1
      heightPct = frameRatio / imageRatio
    }

    setImageLayout({
      offset_x_pct: 0.5,
      offset_y_pct: 0.5,
      width_pct: widthPct,
      height_pct: heightPct,
    })
  }, [printFrame, insertedImageNaturalSize])

  const handleSaveImageEdit = useCallback(async () => {
    if (!insertedImage || !onSaveInsertedImageLayout) return
    await onSaveInsertedImageLayout({ id: insertedImage.id, ...imageLayout })
    setImageEditMode(false)
  }, [imageLayout, insertedImage, onSaveInsertedImageLayout])

  const handleDeleteImageEdit = useCallback(async () => {
    if (!insertedImage || !onDeleteInsertedImage) return
    await onDeleteInsertedImage(insertedImage.id)
    setImageEditMode(false)
  }, [insertedImage, onDeleteInsertedImage])

  useEffect(() => {
    onInsertedImageEditStateChange?.({
      active: Boolean(imageEditMode && insertedImage && !isPresentation),
      canForceExpand: Boolean(printFrame && insertedImageNaturalSize),
      onForceExpand: handleForceExpand,
      onSave: handleSaveImageEdit,
      onDelete: handleDeleteImageEdit,
    })
  }, [
    handleDeleteImageEdit,
    handleForceExpand,
    handleSaveImageEdit,
    imageEditMode,
    insertedImage,
    insertedImageNaturalSize,
    isPresentation,
    onInsertedImageEditStateChange,
    printFrame,
  ])

  return (
    <div className={clsx(
      'overflow-hidden bg-black relative flex-1 min-h-0 flex items-center justify-center w-full h-full',
      isPresentation ? '' : 'rounded-lg',
    )}>
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
            Fallo al abrir el fotograma. Refresca la página y si no se soluciona recomendamos borrar este proyecto y comenzar de nuevo.
          </p>
        </div>
      )}

      {/* Canvas centrado */}
      <div
        ref={wrapperRef}
        className="flex h-full w-full items-center justify-center max-h-full max-w-full overflow-hidden relative"
      >
        <ApplyEffect effectName={printEffectName}>
          <canvas
            ref={canvasRef}
            className={canvasClassName}
            style={{ display: paintError ? 'none' : 'block' }}
          />
        </ApplyEffect>
        {printFrame && insertedImage && (
          <div
            className="absolute z-10"
            style={{
              left: '50%',
              top: '50%',
              width: `${printFrame.width}px`,
              height: `${printFrame.height}px`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div
              className={clsx(
                'absolute pointer-events-auto',
                imageEditMode ? 'cursor-move' : '',
              )}
              style={{
                left: `${imageLayout.offset_x_pct * 100}%`,
                top: `${imageLayout.offset_y_pct * 100}%`,
                width: `${imageLayout.width_pct * 100}%`,
                height: `${imageLayout.height_pct * 100}%`,
                transform: 'translate(-50%, -50%)',
              }}
              onPointerDown={(event) => {
                if (!imageEditMode) return
                handleOverlayPointerDown(event, 'move')
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={insertedImage.image_url}
                alt=""
                className="h-full w-full object-contain select-none"
                draggable={false}
                onLoad={(event) => {
                  const { naturalWidth, naturalHeight } = event.currentTarget
                  if (naturalWidth > 0 && naturalHeight > 0) {
                    setInsertedImageNaturalSize({ width: naturalWidth, height: naturalHeight })
                  }
                }}
              />

              {!imageEditMode && !isPresentation && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
             <ColorActionButton
  onClick={() => setImageEditMode(true)}
  color="slate"
  size="compact"
  icon={Edit}
>
  Editar imagen
</ColorActionButton>
                </div>
              )}

              {imageEditMode && !isPresentation && (
                <>
                  <div className="absolute inset-0 border-2 border-white/80" />
                  {([
                    ['resize-nw', 'left-0 top-0 -translate-x-1/2 -translate-y-1/2'],
                    ['resize-ne', 'right-0 top-0 translate-x-1/2 -translate-y-1/2'],
                    ['resize-sw', 'left-0 bottom-0 -translate-x-1/2 translate-y-1/2'],
                    ['resize-se', 'right-0 bottom-0 translate-x-1/2 translate-y-1/2'],
                  ] as const).map(([mode, className]) => (
                    <button
                      key={mode}
                      type="button"
                      onPointerDown={(event) => handleOverlayPointerDown(event, mode)}
                      className={clsx('absolute h-4 w-4 rounded-full border-2 border-black bg-white', className)}
                    />
                  ))}
                </>
              )}
            </div>

          </div>
        )}
        {activeFrameSetting && !showPrintArea && !paintError && printFrame && (
          <div className="absolute inset-0 z-30 pointer-events-none">
            <FrameStyleOverlay
              setting={activeFrameSetting}
              dimensions={printFrame}
              printWidthMm={printWidthMm}
              printHeightMm={printHeightMm}
              printQualityDpi={qualityDpi ?? undefined}
            />
          </div>
        )}
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
              className="relative rounded-sm overflow-hidden"
              style={{
                width: '100%',
                height: '100%',
                borderWidth: printOverlay.borderWidth,
                borderStyle: 'solid',
                borderColor: '#facc15',
                boxShadow: printOverlay.shadow,
                opacity: 1, //opacidad borde amarillo
              }}
            >
              {activeFrameSetting && (
                printOverlay.mode === 'fit' && printOverlay.innerWidth && printOverlay.innerHeight ? (
                  <div
                    className="absolute pointer-events-none"
                    style={{
                      width: `${printOverlay.innerWidth}px`,
                      height: `${printOverlay.innerHeight}px`,
                      left: '50%',
                      top: '50%',
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    <div className="absolute inset-0 z-30 pointer-events-none">
                      <FrameStyleOverlay
                        setting={activeFrameSetting}
                        dimensions={{ width: printOverlay.innerWidth, height: printOverlay.innerHeight }}
                        printWidthMm={printWidthMm}
                        printHeightMm={printHeightMm}
                        printQualityDpi={qualityDpi ?? undefined}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 z-30 pointer-events-none">
                    <FrameStyleOverlay
                      setting={activeFrameSetting}
                      dimensions={{ width: printOverlay.width, height: printOverlay.height }}
                      printWidthMm={printWidthMm}
                      printHeightMm={printHeightMm}
                      printQualityDpi={qualityDpi ?? undefined}
                    />
                  </div>
                )
              )}
              {printOverlay.mode === 'fit' && printOverlay.innerWidth && printOverlay.innerHeight && (
                <div
                  className="absolute border border-dashed border-yellow-300 pointer-events-none"
                  style={{
                    width: `${printOverlay.innerWidth}px`,
                    height: `${printOverlay.innerHeight}px`,
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    boxShadow: '0 0 0 1px rgba(249,224,138,0.9)',
                  }}
                />
              )}
            </div>
          </div>
        )}
        {showPrintArea && !paintError && printFrame && isCoverPhoto && onOpenCover && (
          <div
            className="absolute z-40 pointer-events-none"
            style={{
              left: '50%',
              top: '50%',
              width: `${printFrame.width}px`,
              height: `${printFrame.height}px`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div className="absolute top-2 left-2 pointer-events-auto">
              <button
                type="button"
                onClick={onOpenCover}
                className={clsx(
                  'inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-white shadow-sm ring-1 backdrop-blur transition focus-visible:outline-none',
                  isCoverPhoto
                    ? 'bg-yellow-500/20 ring-yellow-300 hover:bg-yellow-500/30 focus-visible:ring-yellow-400'
                    : 'bg-white/10 ring-white/20 hover:bg-white/20 focus-visible:ring-blue-400'
                )}
                aria-label="Abrir modal de portada"
                aria-pressed={isCoverPhoto}
              >
                <ImageIcon className="h-3.5 w-3.5" />
                Foto de portada
              </button>
            </div>
          </div>
        )}
        {showPrintArea && !paintError && printSizeLabel && (
          <div className="absolute top-2 right-2 z-40 pointer-events-none">
            <span className="text-m font-semibold text-yellow-300 bg-black/60 px-2 py-0.5 rounded">
              {printSizeLabel}
            </span>
          </div>
        )}
      </div>

      {/* Capa de textos arrastrables (solo si no hay error) */}
      {!paintError && (
        <div className="pointer-events-none absolute inset-0 z-40">
          <TextOverlayLayer
            wrapperRef={wrapperRef as React.RefObject<HTMLDivElement>}
            canvasRef={canvasRef as React.RefObject<HTMLCanvasElement>}
            items={activeTextFrames.map((tf) => ({
              id: tf.id,
              textId: tf.text_id,
              content: tf.content,
              typography: tf.typography ?? null,
              font_size: tf.font_size ?? null,
              color_hex: tf.color_hex ?? null,
              text_background_enabled: tf.text_background_enabled ?? null,
              text_background_style: tf.text_background_style ?? null,
              text_background_color_hex: tf.text_background_color_hex ?? null,
              x: Number(tf.position_x ?? 0.5),
              y: Number(tf.position_y ?? 0.5),
            }))}
            onLocalPositionChange={onPositionChange}
            getLinkedOverlayIds={getLinkedOverlayIds}
            onDeleteText={onDeleteText}
            apiBase={apiBase}
            accessToken={accessToken}
            disabled={generating || !isCacheLoaded}
            onEdit={onEditText}
          />
        </div>
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
      {showViewerControls && (
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
          Zoom
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
          {showPrintArea ? 'Ocultar zona imp.' : 'Ver zona impresión'}
        </button>
      </div>
      )}

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
