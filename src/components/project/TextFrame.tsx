'use client'

import { Pencil } from 'lucide-react'
import { PropsWithChildren } from 'react'

type Props = {
  typography?: string | null
  editable?: boolean
  onEdit?: () => void
  dragging?: boolean
}

export default function TextFrame({
  typography,
  editable = true,
  onEdit,
  dragging = false,
  children,
}: PropsWithChildren<Props>) {
  return (
    <div
      className={`px-4 py-2 rounded-xl bg-black/60 text-white text-center shadow-lg
                  ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{
        fontFamily: typography || undefined,
        userSelect: 'none',
        touchAction: 'none',
        // width auto por defecto; el max-width lo controla el contenedor exterior
      }}
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
