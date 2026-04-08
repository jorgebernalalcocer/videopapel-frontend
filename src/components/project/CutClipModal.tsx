'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useConfirm } from '@/components/ui/ConfirmProvider'
import { Modal } from '@/components/ui/Modal'
import GlobalTimeline, { type TimelineItem } from '@/components/project/timeline/GlobalTimeline'
import { formatTime } from '@/utils/time'

type CutClipModalProps = {
  open: boolean
  onClose: () => void
  items: TimelineItem[]
  selectedId: string | null
  thumbnailHeight: number
  isReady: boolean
  error?: string | null
  onConfirm: (selection: { startIndex: number; endIndex: number }) => void
}

export default function CutClipModal({
  open,
  onClose,
  items,
  selectedId,
  thumbnailHeight,
  isReady,
  error,
  onConfirm,
}: CutClipModalProps) {
  const confirm = useConfirm()
  const initialIndex = useMemo(() => {
    if (!items.length) return 0
    const selectedIndex = selectedId ? items.findIndex((item) => item.id === selectedId) : -1
    return selectedIndex >= 0 ? selectedIndex : 0
  }, [items, selectedId])
  const initialRange = useMemo(() => {
    if (items.length <= 1) {
      return { startIndex: initialIndex, endIndex: initialIndex }
    }

    if (initialIndex >= items.length - 1) {
      return { startIndex: initialIndex - 1, endIndex: initialIndex }
    }

    return { startIndex: initialIndex, endIndex: initialIndex + 9 }
  }, [initialIndex, items.length])
  const [startIndex, setStartIndex] = useState(initialRange.startIndex)
  const [endIndex, setEndIndex] = useState(initialRange.endIndex)
  const [activeHandle, setActiveHandle] = useState<'start' | 'end'>('start')

  useEffect(() => {
    if (!open) return
    setStartIndex(initialRange.startIndex)
    setEndIndex(initialRange.endIndex)
    setActiveHandle('start')
  }, [initialRange, open])

  const maxIndex = Math.max(0, items.length - 1)
  const safeStartIndex = Math.min(startIndex, endIndex)
  const safeEndIndex = Math.max(startIndex, endIndex)
  const startItem = items[safeStartIndex] ?? null
  const endItem = items[safeEndIndex] ?? null
  const selectedItem = activeHandle === 'start' ? startItem : endItem
  const selectionCount = safeEndIndex - safeStartIndex + 1
  const rangeLabel = startItem && endItem
    ? `${formatTime(startItem.tGlobal)} - ${formatTime(endItem.tGlobal)}`
    : 'Sin tramo seleccionado'
  const markedForCutIds = useMemo(
    () => new Set(items.slice(safeStartIndex, safeEndIndex + 1).map((item) => item.id)),
    [items, safeEndIndex, safeStartIndex]
  )

  const handleTimelineSelect = useCallback((item: TimelineItem) => {
    const nextIndex = items.findIndex((entry) => entry.id === item.id)
    if (nextIndex < 0) return
    if (activeHandle === 'start') {
      setStartIndex(nextIndex)
      if (nextIndex > endIndex) setEndIndex(nextIndex)
      return
    }
    setEndIndex(nextIndex)
    if (nextIndex < startIndex) setStartIndex(nextIndex)
  }, [activeHandle, endIndex, items, startIndex])

  const handleStartSliderChange = useCallback((value: number) => {
    setStartIndex(value)
    if (value > endIndex) setEndIndex(value)
    setActiveHandle('start')
  }, [endIndex])

  const handleEndSliderChange = useCallback((value: number) => {
    setEndIndex(value)
    if (value < startIndex) setStartIndex(value)
    setActiveHandle('end')
  }, [startIndex])

  const handleConfirm = useCallback(async () => {
    const ok = await confirm({
      title: '¿Estas seguro de eliminar la parte seleccionada?',
      confirmText: 'Eliminar tramo',
      cancelText: 'Cancelar',
      variant: 'danger',
    })
    if (!ok) return
    onConfirm({ startIndex: safeStartIndex, endIndex: safeEndIndex })
    onClose()
  }, [confirm, onClose, onConfirm, safeEndIndex, safeStartIndex])

  const startPct = maxIndex > 0 ? (safeStartIndex / maxIndex) * 100 : 0
  const endPct = maxIndex > 0 ? (safeEndIndex / maxIndex) * 100 : 0

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="full"
      title="Recorte de clip"
      description="seleccione la parte que quieras eliminar del clip"
      footer={
        <>
          <button
            type="button"
            className="px-4 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded-md bg-orange-500 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={handleConfirm}
            disabled={!items.length}
          >
            Cortar clip
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
          <GlobalTimeline
            items={items}
            selectedId={selectedItem?.id ?? null}
            onSelect={handleTimelineSelect}
            isReady={isReady}
            thumbnailHeight={thumbnailHeight}
            error={error}
            markedForCutIds={markedForCutIds}
          />
        </div>

        <div className="rounded-xl border border-orange-200 bg-orange-50/40 p-4">
          <div className="flex items-center justify-between gap-3 text-sm">
            <div>
              <p className="font-medium text-gray-900">Tramo seleccionado</p>
              <p className="text-gray-600">{rangeLabel}</p>
            </div>
            <p className="text-xs font-medium text-orange-700">
              Se borrará {selectionCount} fotograma{selectionCount === 1 ? '' : 's'}
            </p>
          </div>

          <div className="mt-4">
            <div className="relative h-10">
              <div className="absolute left-0 right-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-gray-200" />
              <div
                className="absolute top-1/2 h-2 -translate-y-1/2 rounded-full bg-orange-500"
                style={{
                  left: `${startPct}%`,
                  width: `${Math.max(endPct - startPct, 0)}%`,
                }}
              />
              <input
                type="range"
                min={0}
                max={maxIndex}
                step={1}
                value={safeStartIndex}
                onMouseDown={() => setActiveHandle('start')}
                onTouchStart={() => setActiveHandle('start')}
                onChange={(e) => handleStartSliderChange(Number(e.target.value))}
                className={`absolute inset-0 w-full appearance-none bg-transparent ${
                  activeHandle === 'start' ? 'z-20' : 'z-10'
                } pointer-events-none
                  [&::-webkit-slider-runnable-track]:h-10
                  [&::-webkit-slider-runnable-track]:bg-transparent
                  [&::-webkit-slider-thumb]:pointer-events-auto
                  [&::-webkit-slider-thumb]:mt-0
                  [&::-webkit-slider-thumb]:h-5
                  [&::-webkit-slider-thumb]:w-5
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:border-2
                  [&::-webkit-slider-thumb]:border-orange-500
                  [&::-webkit-slider-thumb]:bg-white
                  [&::-webkit-slider-thumb]:shadow
                  [&::-moz-range-track]:h-10
                  [&::-moz-range-track]:bg-transparent
                  [&::-moz-range-thumb]:pointer-events-auto
                  [&::-moz-range-thumb]:h-5
                  [&::-moz-range-thumb]:w-5
                  [&::-moz-range-thumb]:appearance-none
                  [&::-moz-range-thumb]:rounded-full
                  [&::-moz-range-thumb]:border-2
                  [&::-moz-range-thumb]:border-orange-500
                  [&::-moz-range-thumb]:bg-white
                  [&::-moz-range-thumb]:shadow`}
              />
              <input
                type="range"
                min={0}
                max={maxIndex}
                step={1}
                value={safeEndIndex}
                onMouseDown={() => setActiveHandle('end')}
                onTouchStart={() => setActiveHandle('end')}
                onChange={(e) => handleEndSliderChange(Number(e.target.value))}
                className={`absolute inset-0 w-full appearance-none bg-transparent ${
                  activeHandle === 'end' ? 'z-20' : 'z-10'
                } pointer-events-none
                  [&::-webkit-slider-runnable-track]:h-10
                  [&::-webkit-slider-runnable-track]:bg-transparent
                  [&::-webkit-slider-thumb]:pointer-events-auto
                  [&::-webkit-slider-thumb]:mt-0
                  [&::-webkit-slider-thumb]:h-5
                  [&::-webkit-slider-thumb]:w-5
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:border-2
                  [&::-webkit-slider-thumb]:border-orange-500
                  [&::-webkit-slider-thumb]:bg-white
                  [&::-webkit-slider-thumb]:shadow
                  [&::-moz-range-track]:h-10
                  [&::-moz-range-track]:bg-transparent
                  [&::-moz-range-thumb]:pointer-events-auto
                  [&::-moz-range-thumb]:h-5
                  [&::-moz-range-thumb]:w-5
                  [&::-moz-range-thumb]:appearance-none
                  [&::-moz-range-thumb]:rounded-full
                  [&::-moz-range-thumb]:border-2
                  [&::-moz-range-thumb]:border-orange-500
                  [&::-moz-range-thumb]:bg-white
                  [&::-moz-range-thumb]:shadow`}
              />
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-medium text-gray-700">
                Inicio
                <input
                  type="number"
                  min={1}
                  max={items.length || 1}
                  value={safeStartIndex + 1}
                  onFocus={() => setActiveHandle('start')}
                  onChange={(e) => handleStartSliderChange(Math.max(0, Math.min(maxIndex, Number(e.target.value) - 1)))}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </label>
              <label className="text-sm font-medium text-gray-700">
                Final
                <input
                  type="number"
                  min={1}
                  max={items.length || 1}
                  value={safeEndIndex + 1}
                  onFocus={() => setActiveHandle('end')}
                  onChange={(e) => handleEndSliderChange(Math.max(0, Math.min(maxIndex, Number(e.target.value) - 1)))}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}
