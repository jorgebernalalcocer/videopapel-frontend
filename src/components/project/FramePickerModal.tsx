'use client'

import { useMemo, useState } from 'react'
import PickerSelector from '@/components/project/PickerSelector'

export type FramePickerItem = {
  id: string
  clipId: number
  frameTimeMs: number
  imageUrl: string | null
  videoUrl: string | null
  clipPosition?: number | null
}

type FramePickerModalProps = {
  open: boolean
  onClose: () => void
  items: FramePickerItem[]
  busy?: boolean
  error?: string
  onSelect: (item: FramePickerItem) => void | Promise<void>
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
          <div className="aspect-video bg-black">
            {item.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.imageUrl} alt={`Frame ${item.frameTimeMs}ms`} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full grid place-items-center text-white text-xs">
                Clip {item.clipPosition ?? item.clipId} · {item.frameTimeMs}ms
              </div>
            )}
          </div>
          <div className="p-2">
            <p className="text-sm font-medium truncate">Clip {item.clipPosition ?? item.clipId}</p>
            <p className="text-xs text-gray-500">{(item.frameTimeMs / 1000).toFixed(2)}s</p>
          </div>
        </>
      )}
    />
  )
}
