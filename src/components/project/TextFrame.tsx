'use client'

import { Pencil } from 'lucide-react'
import { PropsWithChildren } from 'react'
import { pacifico, pacificoFontStack } from '@/fonts/pacifico'
import { borel, borelFontStack } from '@/fonts/borel'

const FONT_CLASS_MAP: Record<string, { className: string; stack: string }> = {
  pacifico: { className: pacifico.className, stack: pacificoFontStack },
  'pacifico-regular': { className: pacifico.className, stack: pacificoFontStack },
  borel: { className: borel.className, stack: borelFontStack },
  'borel-regular': { className: borel.className, stack: borelFontStack },
}

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
  const fontKey = (typography || '').trim().toLowerCase()
  const fontInfo = FONT_CLASS_MAP[fontKey]
  const fontFamily = fontInfo?.stack || (typography || undefined)
  const extraClass = fontInfo?.className ?? ''

  

  return (
    <div
      className={`px-4 py-2 rounded-xl bg-black/60 text-white text-center shadow-lg
                  ${dragging ? 'cursor-grabbing' : 'cursor-grab'} ${extraClass}`}
      style={{
        fontFamily,
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
