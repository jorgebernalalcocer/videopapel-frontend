'use client'

import type { CSSProperties } from 'react'
import type { PageEnumerationPosition } from '@/types/pageEnumeration'

const POSITION_LABELS: Record<PageEnumerationPosition, string> = {
  top_left: 'Superior izquierda',
  top_right: 'Superior derecha',
  bottom_left: 'Inferior izquierda',
  bottom_right: 'Inferior derecha',
}

const POSITION_CLASSES: Record<PageEnumerationPosition, CSSProperties> = {
  top_left: { top: 0, left: 0 },
  top_right: { top: 0, right: 0 },
  bottom_left: { bottom: 0, left: 0 },
  bottom_right: { bottom: 0, right: 0 },
}

const POSITIONS: PageEnumerationPosition[] = ['top_left', 'top_right', 'bottom_left', 'bottom_right']

type Props = {
  value: PageEnumerationPosition
  onChange: (value: PageEnumerationPosition) => void
  title?: string
}

export default function CornerPositionSelector({
  value,
  onChange,
  title = 'Posición',
}: Props) {
  return (
    <div>
      <p className="block text-sm font-medium text-gray-700 mb-2">{title}</p>
      <div className="relative h-40 rounded-xl border bg-slate-50">
        {POSITIONS.map((position) => {
          const active = value === position
          return (
            <button
              key={position}
              type="button"
              className={`absolute px-2 py-1 text-xs rounded-md border shadow-sm transition-colors ${
                active ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
              style={POSITION_CLASSES[position]}
              onClick={() => onChange(position)}
            >
              {POSITION_LABELS[position]}
            </button>
          )
        })}
        <div className="absolute inset-6 pointer-events-none rounded-lg border border-dashed border-gray-300" />
      </div>
    </div>
  )
}
