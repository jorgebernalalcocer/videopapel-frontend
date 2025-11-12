'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
  type MutableRefObject,
} from 'react'
import { toast } from 'sonner'
import TextFrame from '@/components/project/TextFrame'

export type DraggableTextItem = {
  id: number
  content: string
  typography?: string | null
  textId?: number
  /** 0..1 normalizado respecto al VIDEO (no el wrapper) */
  x: number
  y: number
  fontSize?: number | null
}

/** Acepta tanto RefObject como MutableRefObject y siempre como nullable */
type AnyRef<T> = RefObject<T | null> | MutableRefObject<T | null>

type Props = {
  /** Ref del wrapper que ya tienes (absolute/relative contenedor del canvas y overlays) */
  wrapperRef: AnyRef<HTMLDivElement>
  /** Ref del canvas donde pintas el frame (para medir zona útil del vídeo) */
  canvasRef: AnyRef<HTMLCanvasElement>
  /** Lista de textos a mostrar (ya filtrados como “activos”) */
  items: DraggableTextItem[]
  /** Se invoca en cada movimiento para actualización local optimista */
  onLocalPositionChange?: (id: number, x: number, y: number) => void
  /** API */
  apiBase: string
  accessToken: string | null
  /** Si quieres desactivar drag temporalmente */
  disabled?: boolean
  /** Abrir editor para el item */
  onEdit?: (id: number) => void
  /** Devuelve otros overlays vinculados (mismo texto) para replicar guardado */
  getLinkedOverlayIds?: (id: number) => number[]
  /** Callback tras borrar un texto completo */
  onDeleteText?: (textId: number) => void
}

/**
 * Overlay que pinta las cajas de texto y permite arrastrarlas.
 * Calcula posiciones en coordenadas del VIDEO (rect del canvas), y persiste con PATCH.
 */
export default function DraggableTextOverlay({
  wrapperRef,
  canvasRef,
  items,
  onLocalPositionChange,
  apiBase,
  accessToken,
  disabled = false,
  onEdit, // 👈 ahora sí viene de props
  getLinkedOverlayIds,
  onDeleteText,
}: Props) {
  const [draggingId, setDraggingId] = useState<number | null>(null)
  const startRef = useRef<{ id: number; startX: number; startY: number; origX: number; origY: number } | null>(null)
  const rafRef = useRef<number | null>(null)
  const pendingSaveRef = useRef<{ id: number; x: number; y: number } | null>(null)
  const saveTimerRef = useRef<number | null>(null)
  const inFlightRef = useRef<Record<number, AbortController | null>>({})

  const [videoRect, setVideoRect] = useState<DOMRect | null>(null)
  const [baseRect, setBaseRect] = useState<{ left: number; top: number; width: number; height: number } | null>(null)

  useEffect(() => {
    const updateRects = () => {
      const canvasEl = canvasRef.current
      const wrapperEl = wrapperRef.current
      if (!canvasEl || !wrapperEl) return
      const canvasBox = canvasEl.getBoundingClientRect()
      const wrapperBox = wrapperEl.getBoundingClientRect()
      setVideoRect(canvasBox)
      setBaseRect({
        left: canvasBox.left - wrapperBox.left,
        top: canvasBox.top - wrapperBox.top,
        width: canvasBox.width,
        height: canvasBox.height,
      })
    }

    updateRects()

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateRects) : null
    const canvasEl = canvasRef.current
    const wrapperEl = wrapperRef.current
    if (ro && canvasEl) ro.observe(canvasEl)
    if (ro && wrapperEl) ro.observe(wrapperEl)

    window.addEventListener('resize', updateRects)
    window.addEventListener('scroll', updateRects, true)

    return () => {
      ro?.disconnect()
      window.removeEventListener('resize', updateRects)
      window.removeEventListener('scroll', updateRects, true)
    }
  }, [canvasRef, wrapperRef])

  // Traduce (clientX, clientY) ⇒ coordenadas normalizadas (0..1) del VIDEO
  const pointToNormalized = useCallback(
    (clientX: number, clientY: number) => {
      const rect = videoRect ?? canvasRef.current?.getBoundingClientRect()
      if (!rect) return { x: 0.5, y: 0.5 }
      const relX = (clientX - rect.left) / rect.width
      const relY = (clientY - rect.top) / rect.height
      return { x: clamp(relX, 0, 1), y: clamp(relY, 0, 1) }
    },
    [videoRect, canvasRef]
  )

  const scheduleSave = useCallback((id: number, x: number, y: number) => {
    if (disabled) return
    pendingSaveRef.current = { id, x, y }
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current)
    saveTimerRef.current = window.setTimeout(async () => {
      const payload = pendingSaveRef.current
      if (!payload) return
      pendingSaveRef.current = null
      if (!accessToken) {
        toast.error('Debes iniciar sesión para guardar la posición del texto.')
        return
      }
      try {
        const targetsRaw = getLinkedOverlayIds?.(payload.id) ?? [payload.id]
        const targets = Array.from(new Set([...targetsRaw, payload.id]))

        await Promise.all(targets.map(async (overlayId) => {
          inFlightRef.current[overlayId]?.abort()
          const ctl = new AbortController()
          inFlightRef.current[overlayId] = ctl
          try {
            const res = await fetch(`${apiBase}/text-frames/${overlayId}/`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify({
                position_x: Number(payload.x.toFixed(6)),
                position_y: Number(payload.y.toFixed(6)),
              }),
              signal: ctl.signal,
              credentials: 'include',
            })
            if (!res.ok) {
              const msg = await safeText(res)
              throw new Error(msg || `Error ${res.status} guardando posición.`)
            }
          } finally {
            if (inFlightRef.current[overlayId] === ctl) {
              inFlightRef.current[overlayId] = null
            }
          }
        }))
      } catch (err: any) {
        if (err?.name === 'AbortError') return
        toast.error(err?.message || 'No se pudo guardar la nueva posición.')
      }
    }, 300)
  }, [apiBase, accessToken, disabled, getLinkedOverlayIds])

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, item: DraggableTextItem) => {
      if (disabled) return
      e.currentTarget.setPointerCapture?.(e.pointerId)
      const { x, y } = pointToNormalized(e.clientX, e.clientY)
      startRef.current = { id: item.id, startX: x, startY: y, origX: item.x, origY: item.y }
      setDraggingId(item.id)
    },
    [disabled, pointToNormalized]
  )

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      if (!startRef.current) return
      const s = startRef.current
      const pos = pointToNormalized(e.clientX, e.clientY)
      const nx = clamp(s.origX + (pos.x - s.startX), 0, 1)
      const ny = clamp(s.origY + (pos.y - s.startY), 0, 1)

      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        onLocalPositionChange?.(s.id, nx, ny)
        scheduleSave(s.id, nx, ny)
      })
    },
    [onLocalPositionChange, pointToNormalized, scheduleSave]
  )

  const onPointerUpOrCancel = useCallback(() => {
    startRef.current = null
    setDraggingId(null)
  }, [])

  // Listeners globales mientras arrastras
  useEffect(() => {
    const handleMove = (e: PointerEvent) => onPointerMove(e)
    const handleUp = () => onPointerUpOrCancel()
    if (draggingId != null) {
      window.addEventListener('pointermove', handleMove)
      window.addEventListener('pointerup', handleUp, { once: true })
      window.addEventListener('pointercancel', handleUp, { once: true })
      return () => {
        window.removeEventListener('pointermove', handleMove)
        window.removeEventListener('pointerup', handleUp)
        window.removeEventListener('pointercancel', handleUp)
      }
    }
  }, [draggingId, onPointerMove, onPointerUpOrCancel])

  // Render
  // Posicionamos respecto al rect del CANVAS, pero con CSS absoluto dentro del WRAPPER.
  return (
  <>
    {items.map((it) => {
      const rect = baseRect
      const left = rect ? rect.left + it.x * rect.width : it.x * 100
      const top  = rect ? rect.top  + it.y * rect.height : it.y * 100

      return (
        <div
          key={it.id}
          onPointerDown={(e) => onPointerDown(e as any, it)}
          // único elemento posicionado
          className="absolute max-w-[70%]"
          style={{ left, top, transform: 'translate(-50%, -50%)' }}
        >
          <TextFrame
            typography={it.typography}
            fontSize={it.fontSize ?? undefined}
            editable={Boolean(onEdit || onDeleteText)}
            onEdit={onEdit ? () => onEdit(it.id) : undefined}
            dragging={draggingId === it.id}
            deleteConfig={
              it.textId != null
                ? {
                    textId: it.textId,
                    apiBase,
                    accessToken,
                    onDeleted: () => onDeleteText?.(it.textId!),
                    disabled,
                  }
                : undefined
            }
          >
            {it.content}
          </TextFrame>
        </div>
      )
    })}
  </>
)

}

/* Utils */
function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v))
}
async function safeText(res: Response) {
  try { return await res.text() } catch { return '' }
}
