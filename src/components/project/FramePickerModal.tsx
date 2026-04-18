'use client'

import { useMemo, useState } from 'react'
import PickerSelector from '@/components/project/PickerSelector'

export type FramePickerItem = {
  id: string
  clipId: number
  frameTimeMs: number
  imageUrl: string | null
  baseImageUrl?: string | null
  videoUrl: string | null
  clipPosition?: number | null
  insertedImage?: {
    id: number
    image_url: string
    offset_x_pct: number
    offset_y_pct: number
    width_pct: number
    height_pct: number
  } | null
}

type FramePickerModalProps = {
  open: boolean
  onClose: () => void
  items: FramePickerItem[]
  busy?: boolean
  error?: string
  onSelect: (item: FramePickerItem) => void | Promise<void>
}

function FramePreview({ item }: { item: FramePickerItem }) {
  const [aspectRatio, setAspectRatio] = useState<number>(16 / 9)
  const baseSrc = item.baseImageUrl ?? item.imageUrl

  return (
    <div
      className="bg-black w-full relative overflow-hidden"
      style={{ aspectRatio: `${aspectRatio}` }}
    >
      {baseSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={baseSrc}
          alt={`Frame ${item.frameTimeMs}ms`}
          className="w-full h-full object-contain"
          onLoad={(event) => {
            const { naturalWidth, naturalHeight } = event.currentTarget
            if (naturalWidth > 0 && naturalHeight > 0) {
              setAspectRatio(naturalWidth / naturalHeight)
            }
          }}
        />
      ) : (
        <div className="w-full h-full grid place-items-center text-white text-xs">
          Clip {item.clipPosition ?? item.clipId} · {item.frameTimeMs}ms
        </div>
      )}
      {item.insertedImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.insertedImage.image_url}
          alt=""
          className="absolute object-contain pointer-events-none"
          style={{
            left: `${item.insertedImage.offset_x_pct * 100}%`,
            top: `${item.insertedImage.offset_y_pct * 100}%`,
            width: `${item.insertedImage.width_pct * 100}%`,
            height: `${item.insertedImage.height_pct * 100}%`,
            transform: 'translate(-50%, -50%)',
          }}
        />
      )}
    </div>
  )
}

export default function FramePickerModal({
  open,
  onClose,
  items,
  busy = false,
  error,
  onSelect,
}: FramePickerModalProps) {
  const [selectedItem, setSelectedItem] = useState<FramePickerItem | null>(null)

  const sortedItems = useMemo(
    () =>
      items.slice().sort((a, b) => {
        const posA = a.clipPosition ?? Number.MAX_SAFE_INTEGER
        const posB = b.clipPosition ?? Number.MAX_SAFE_INTEGER
        if (posA !== posB) return posA - posB
        return a.frameTimeMs - b.frameTimeMs
      }),
    [items],
  )

  return (
    <PickerSelector
      open={open}
      onClose={() => {
        setSelectedItem(null)
        onClose()
      }}
      title="Selecciona la portada"
      items={sortedItems}
      selectedItem={selectedItem}
      onSelectItem={setSelectedItem}
      onConfirm={async () => {
        if (!selectedItem || busy) return
        await onSelect(selectedItem)
        setSelectedItem(null)
        onClose()
      }}
      confirmLabel="Guardar portada"
      confirmBusyLabel="Guardando…"
      busy={busy}
      loading={false}
      error={error}
      emptyLabel="No hay fotogramas disponibles en el proyecto."
      renderItem={({ item }) => (
        <>
          <FramePreview item={item} />
          <div className="p-2">
            <p className="text-sm font-medium truncate">Clip {item.clipPosition ?? item.clipId}</p>
            <p className="text-xs text-gray-500">{(item.frameTimeMs / 1000).toFixed(2)}s</p>
          </div>
        </>
      )}
    />
  )
}
