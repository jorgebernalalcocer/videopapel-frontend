// src/components/project/timeline/GlobalTimeline.tsx
'use client'
import { useEffect } from 'react'
import { formatTime } from '@/utils/time'
import { Type } from 'lucide-react'

export type TimelineItem = {
  id: string
  url?: string
  imageUrl?: string
  image_url?: string
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
}) {
  const { items, selectedId, onSelect, isReady, thumbnailHeight, error, onKeyDown, textPresence } = props
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
              const previewUrl = it.url ?? it.imageUrl ?? it.image_url
              const hasText = textPresence?.get(it.id)
              return (
                <li key={it.id} id={`thumb-${it.id}`}>
                  <button
                    type="button"
                    onClick={() => onSelect(it)}
                    className={`relative block rounded-md overflow-hidden border ${
                      selected ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    {previewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={previewUrl}
                        alt={`Frame ${formatTime(it.tGlobal)}`}
                        height={thumbnailHeight}
                        className="block"
                        style={{ height: thumbnailHeight, width: 'auto' }}
                      />
                    ) : (
                      <div
                        className="bg-gray-100 grid place-items-center text-xs text-gray-500"
                        style={{ height: thumbnailHeight, width: thumbnailHeight * (16 / 9) }}
                      >
                        ···
                      </div>
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
