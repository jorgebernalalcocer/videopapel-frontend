'use client'

import { Pencil } from 'lucide-react'
import { PropsWithChildren } from 'react'
import { pacifico, pacificoFontStack } from '@/fonts/pacifico'
import { borel, borelFontStack } from '@/fonts/borel'
import DeleteTextButton from '@/components/project/DeleteTextButton'

const FONT_CLASS_MAP: Record<string, { className: string; stack: string }> = {
  pacifico: { className: pacifico.className, stack: pacificoFontStack },
  'pacifico-regular': { className: pacifico.className, stack: pacificoFontStack },
  borel: { className: borel.className, stack: borelFontStack },
  'borel-regular': { className: borel.className, stack: borelFontStack },
}

const clampFontSize = (value?: number | null) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return 18
  return Math.min(60, Math.max(5, parsed))
}

type Props = {
  typography?: string | null
  fontSize?: number | null
  editable?: boolean
  onEdit?: () => void
  dragging?: boolean
  deleteConfig?: {
    textId: number
    apiBase: string
    accessToken: string | null
    onDeleted?: () => void
    disabled?: boolean
  }
}

export default function TextFrame({
  typography,
  fontSize,
  editable = true,
  onEdit,
  dragging = false,
  deleteConfig,
  children,
}: PropsWithChildren<Props>) {
  const fontKey = (typography || '').trim().toLowerCase()
  const fontInfo = FONT_CLASS_MAP[fontKey]
  const fontFamily = fontInfo?.stack || (typography || undefined)
  const extraClass = fontInfo?.className ?? ''
  const resolvedFontSize = clampFontSize(fontSize)

  

  return (
    <div
      className={`relative px-4 py-2 rounded-xl bg-black/60 text-white text-center shadow-lg
                  ${dragging ? 'cursor-grabbing' : 'cursor-grab'} ${extraClass}`}
      style={{
        fontFamily,
        fontSize: `${resolvedFontSize}px`,
        lineHeight: 1.25,
        userSelect: 'none',
        touchAction: 'none',
        // width auto por defecto; el max-width lo controla el contenedor exterior
      }}
    >
      {children}
      {editable && deleteConfig && (
        <div className="absolute -top-3 -left-3">
          <DeleteTextButton {...deleteConfig} />
        </div>
      )}
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
