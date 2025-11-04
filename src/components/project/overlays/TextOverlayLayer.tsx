// src/components/project/overlays/TextOverlayLayer.tsx
'use client'
import DraggableTextOverlay from '@/components/project/DraggableTextOverlay'
import { clamp01 } from '@/utils/time'

type Item = { id: number; content: string; typography: string | null; x: number; y: number }

export default function TextOverlayLayer(props: {
  disabled: boolean
  wrapperRef: React.RefObject<HTMLDivElement>
  canvasRef: React.RefObject<HTMLCanvasElement>
  items: Item[]
  apiBase: string
  accessToken: string | null
  onLocalPositionChange: (id: number, x: number, y: number) => void
  onEdit: (overlayId: number) => void
}) {
  const { items, ...rest } = props
  return (
    <DraggableTextOverlay
      {...rest}
      items={items.map((tf) => ({
        id: tf.id,
        content: tf.content,
        typography: tf.typography,
        x: clamp01(tf.x),
        y: clamp01(tf.y),
      }))}
    />
  )
}
