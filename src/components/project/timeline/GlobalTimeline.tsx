// src/components/project/timeline/GlobalTimeline.tsx
'use client'
import { useEffect } from 'react'
import { formatTime } from '@/utils/time'
import { Scissors, Type } from 'lucide-react'

export type TimelineItem = {
  id: string
  url?: string
  baseUrl?: string
  imageUrl?: string
  image_url?: string
  insertedImage?: {
    id: number
    image_url: string
    offset_x_pct: number
    offset_y_pct: number
    width_pct: number
    height_pct: number
  } | null
  tGlobal: number
}
export default function GlobalTimeline(props: {
  items: TimelineItem[]
  selectedId: string | null
  onSelect: (item: TimelineItem) => void
  isReady: boolean
  thumbnailHeight: number
  error?: string | null
  onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>
  textPresence?: Map<string, boolean>
  markedForCutIds?: Set<string>
}) {
  const { items, selectedId, onSelect, isReady, thumbnailHeight, error, onKeyDown, textPresence, markedForCutIds } = props
  useEffect(() => {
    console.log('[GlobalTimeline] items received', items)
  }, [items])
  useEffect(() => {
    console.log('[GlobalTimeline] selectedId', selectedId)
  }, [selectedId])
  return (
    <div
      className="overflow-x-auto border rounded-lg p-2 bg-white focus:outline-none flex-none"
      tabIndex={0}
      onKeyDown={onKeyDown}
    >
      {error && <p className="text-red-600 text-sm px-2 py-1">{error}</p>}
      {isReady && (
        <ul className="flex gap-2 min-w-max">
          {items.length === 0 ? (
            <li className="text-gray-500 text-sm px-2 py-3">Sin miniaturas</li>
          ) : (
            items.map((it) => {
              const selected = it.id === selectedId
              const previewUrl = it.baseUrl ?? it.url ?? it.imageUrl ?? it.image_url
              const hasText = textPresence?.get(it.id)
              const isMarkedForCut = markedForCutIds?.has(it.id) ?? false
              return (
                <li key={it.id} id={`thumb-${it.id}`}>
                  <button
                    type="button"
                    onClick={() => onSelect(it)}
                    className={`relative block rounded-md overflow-hidden border ${
                      selected ? 'ring-2 ring-yellow-500 border-yellow-500' : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    {previewUrl ? (
                      <div className="relative overflow-hidden bg-black" style={{ height: thumbnailHeight }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={previewUrl}
                          alt={`Frame ${formatTime(it.tGlobal)}`}
                          height={thumbnailHeight}
                          className="block"
                          style={{ height: thumbnailHeight, width: 'auto' }}
                        />
                        {it.insertedImage && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={it.insertedImage.image_url}
                            alt=""
                            className="absolute object-contain pointer-events-none"
                            style={{
                              left: `${it.insertedImage.offset_x_pct * 100}%`,
                              top: `${it.insertedImage.offset_y_pct * 100}%`,
                              width: `${it.insertedImage.width_pct * 100}%`,
                              height: `${it.insertedImage.height_pct * 100}%`,
                              transform: 'translate(-50%, -50%)',
                            }}
                          />
                        )}
                      </div>
                    ) : (
                      <div
                        className="bg-gray-100 grid place-items-center text-xs text-gray-500"
                        style={{ height: thumbnailHeight, width: thumbnailHeight * (16 / 9) }}
                      >
                        ···
                      </div>
                    )}
                    {isMarkedForCut && (
                      <span className="absolute left-1/2 top-1 -translate-x-1/2 h-5 min-w-5 rounded-full bg-white/95 px-1 flex items-center justify-center shadow ring-1 ring-orange-200">
                        <Scissors className="h-3 w-3 text-orange-500" />
                      </span>
                    )}
                    {hasText && (
                      <span className="absolute bottom-1 left-1 h-5 w-5 rounded-full bg-white flex items-center justify-center shadow">
                        <Type className="h-3 w-3 text-black" />
                      </span>
                    )}
                    <span className="absolute bottom-1 right-1 text-[10px] bg-black/60 text-white px-1 rounded">
                      {formatTime(it.tGlobal)}
                    </span>
                  </button>
                </li>
              )
            })
          )}
        </ul>
      )}
    </div>
  )
}
