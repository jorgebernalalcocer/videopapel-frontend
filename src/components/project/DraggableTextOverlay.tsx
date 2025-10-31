'use client'

import { RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

export type DraggableTextItem = {
  id: number
  content: string
  typography?: string | null
  /** 0..1 normalizado respecto al VIDEO (no el wrapper) */
  x: number
  y: number
}

type Props = {
  /** Ref del wrapper que ya tienes (absolute/relative contenedor del canvas y overlays) */
  wrapperRef: RefObject<HTMLDivElement>
  /** Ref del canvas donde pintas el frame (para medir zona útil del vídeo) */
  canvasRef: RefObject<HTMLCanvasElement>
  /** Lista de textos a mostrar (ya filtrados como “activos”) */
  items: DraggableTextItem[]
  /** Se invoca en cada movimiento para actualización local optimista */
  onLocalPositionChange?: (id: number, x: number, y: number) => void
  /** API */
  apiBase: string
  accessToken: string | null
  /** Si quieres desactivar drag temporalmente */
  disabled?: boolean
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
}: Props) {
  const [draggingId, setDraggingId] = useState<number | null>(null)
  const startRef = useRef<{ id: number; startX: number; startY: number; origX: number; origY: number } | null>(null)
  const rafRef = useRef<number | null>(null)
  const pendingSaveRef = useRef<{ id: number; x: number; y: number } | null>(null)
  const saveTimerRef = useRef<number | null>(null)
  const inFlightRef = useRef<Record<number, AbortController | null>>({})

  // Rectángulo "útil" del vídeo (canvas) dentro del wrapper
  const videoRect = useMemo(() => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const r = canvas.getBoundingClientRect()
    if (r.width <= 0 || r.height <= 0) return null
    return r
  }, [canvasRef.current?.width, canvasRef.current?.height]) // rehacer cuando cambia tamaño del canvas

  // Traduce (clientX, clientY) ⇒ coordenadas normalizadas (0..1) del VIDEO
  const pointToNormalized = useCallback(
    (clientX: number, clientY: number) => {
      const rect = videoRect ?? canvasRef.current?.getBoundingClientRect()
      if (!rect) return { x: 0.5, y: 0.5 }
      const relX = (clientX - rect.left) / rect.width
      const relY = (clientY - rect.top) / rect.height
      return {
        x: clamp(relX, 0, 1),
        y: clamp(relY, 0, 1),
      }
    },
    [videoRect, canvasRef]
  )

  const scheduleSave = useCallback((id: number, x: number, y: number) => {
    pendingSaveRef.current = { id, x, y }
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current)
    // debounce corto para no saturar el backend
    saveTimerRef.current = window.setTimeout(async () => {
      const payload = pendingSaveRef.current
      if (!payload) return
      pendingSaveRef.current = null
      if (!accessToken) {
        toast.error('Debes iniciar sesión para guardar la posición del texto.')
        return
      }
      try {
        // Cancela petición anterior en vuelo para este id, si existe
        inFlightRef.current[payload.id]?.abort()
        const ctl = new AbortController()
        inFlightRef.current[payload.id] = ctl

        const res = await fetch(`${apiBase}/text-frames/${payload.id}/`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            position_x: Number(payload.x.toFixed(4)),
            position_y: Number(payload.y.toFixed(4)),
          }),
          signal: ctl.signal,
          credentials: 'include',
        })
        if (!res.ok) {
          const msg = await safeText(res)
          throw new Error(msg || `Error ${res.status} guardando posición.`)
        }
        // ok silencioso
      } catch (err: any) {
        if (err?.name === 'AbortError') return
        // No revertimos la posición local; mostramos aviso
        toast.error(err?.message || 'No se pudo guardar la nueva posición.')
      } finally {
        inFlightRef.current[payload.id] = null
      }
    }, 300)
  }, [apiBase, accessToken])

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, item: DraggableTextItem) => {
      if (disabled) return
      const target = e.currentTarget
      target.setPointerCapture?.(e.pointerId)
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
      const nx = clamp(s.origX + (pos.startX ?? pos.x) - s.startX, 0, 1) // robustez si pos.startX no existe
      const ny = clamp(s.origY + (pos.startY ?? pos.y) - s.startY, 0, 1)

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
  const baseRect = useMemo(() => {
    const canvas = canvasRef.current
    if (!canvas || !wrapperRef.current) return null
    const vb = canvas.getBoundingClientRect()
    const wb = wrapperRef.current.getBoundingClientRect()
    return {
      left: vb.left - wb.left,
      top: vb.top - wb.top,
      width: vb.width,
      height: vb.height,
    }
  }, [wrapperRef.current, canvasRef.current, items.length])

  return (
    <>
      {items.map((it) => {
        const rect = baseRect
        const left = rect ? rect.left + it.x * rect.width : it.x * 100
        const top  = rect ? rect.top  + it.y * rect.height : it.y * 100

        return (
          <div
            key={it.id}
            role="button"
            aria-label={`Mover texto ${it.id}`}
            onPointerDown={(e) => onPointerDown(e as any, it)}
            className={`absolute max-w-[70%] rounded-xl px-4 py-2 text-center text-white shadow-lg
                        ${disabled ? 'pointer-events-none bg-black/60' : 'cursor-grab active:cursor-grabbing bg-black/60'}
                        select-none`}
            style={{
              left,
              top,
              transform: 'translate(-50%, -50%)',
              fontFamily: it.typography || undefined,
              touchAction: 'none',
              userSelect: 'none',
            }}
          >
            {it.content}
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
