'use client'

import { Pencil } from 'lucide-react'
import { CSSProperties, PropsWithChildren } from 'react'

type Props = {
  left: number  // px absolutos ya calculados contra el wrapper
  top: number   // px absolutos ya calculados contra el wrapper
  typography?: string | null
  editable?: boolean
  onEdit?: () => void
  dragging?: boolean
}

export default function TextFrame({
  left,
  top,
  typography,
  editable = true,
  onEdit,
  dragging = false,
  children,
}: PropsWithChildren<Props>) {
  const style: CSSProperties = {
    left,
    top,
    transform: 'translate(-50%, -50%)',
    fontFamily: typography || undefined,
    touchAction: 'none',
    userSelect: 'none',
  }

  return (
    <div
      className={`absolute max-w-[70%] rounded-xl px-4 py-2 text-center text-white shadow-lg bg-black/60
                  ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={style}
    >
      {children}
      {editable && onEdit && (
        <button
          type="button"
          aria-label="Editar texto"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onEdit() }}
          className="absolute -top-3 -right-3 grid place-items-center h-7 w-7 rounded-full bg-white text-gray-800 shadow ring-1 ring-black/10 hover:bg-gray-100"
          title="Editar"
        >
          <Pencil className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
