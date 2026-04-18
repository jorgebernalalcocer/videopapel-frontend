'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import PickerSelector from '@/components/project/PickerSelector'
import type { FramePickerItem } from '@/components/project/FramePickerModal'

type InsertImageModalProps = {
  open: boolean
  onClose: () => void
  items: FramePickerItem[]
  busy?: boolean
  error?: string
  onConfirm: (args: { file: File; item: FramePickerItem }) => void | Promise<void>
}

function FramePreview({ item }: { item: FramePickerItem }) {
  const src = item.baseImageUrl ?? item.imageUrl ?? item.videoUrl ?? null

  if (!src) {
    return (
      <div className="aspect-video w-full grid place-items-center bg-gray-100 text-xs text-gray-500">
        Sin vista previa
      </div>
    )
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden bg-black">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={`Frame ${(item.frameTimeMs / 1000).toFixed(2)}s`}
        className="h-full w-full object-contain"
      />
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

export default function InsertImageModal({
  open,
  onClose,
  items,
  busy = false,
  error,
  onConfirm,
}: InsertImageModalProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [selectedItem, setSelectedItem] = useState<FramePickerItem | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null)
      return
    }
    const objectUrl = URL.createObjectURL(selectedFile)
    setPreviewUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [selectedFile])

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

  const handleClose = () => {
    setSelectedItem(null)
    setSelectedFile(null)
    if (inputRef.current) inputRef.current.value = ''
    onClose()
  }

  return (
    <PickerSelector
      open={open}
      onClose={handleClose}
      title="Insertar imagen"
      items={sortedItems}
      selectedItem={selectedItem}
      onSelectItem={setSelectedItem}
      onConfirm={async () => {
        if (!selectedItem || !selectedFile || busy) return
        await onConfirm({ file: selectedFile, item: selectedItem })
        handleClose()
      }}
      confirmLabel="Establecer imagen"
      confirmBusyLabel="Estableciendo…"
      confirmDisabled={!selectedFile}
      busy={busy}
      loading={false}
      error={error}
      emptyLabel="No hay fotogramas disponibles en el proyecto."
      preListSlot={
        <div className="space-y-4 pb-4">
          <div className="rounded-xl border border-gray-200 p-4">
            <p className="text-sm font-medium text-gray-900">Selecciona la imagen</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                Seleccionar imagen
              </button>
              <span className="text-sm text-gray-500">
                {selectedFile?.name ?? 'Aún no has elegido ninguna imagen.'}
              </span>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null
                setSelectedFile(file)
              }}
            />
            {previewUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="Vista previa de la imagen seleccionada"
                className="mt-4 max-h-52 rounded-lg border border-gray-200 object-contain"
              />
            )}
          </div>

          <div>
            <p className="text-sm font-medium text-gray-900">
              Indica sobre que fotograma quieres establecer la nueva imagen.
            </p>
            <p className="mt-1 text-xs text-gray-500">
              La imagen sustituirá visualmente a ese fotograma en el visor y la línea temporal.
            </p>
          </div>
        </div>
      }
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
