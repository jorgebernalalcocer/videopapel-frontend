'use client'

import { Pencil } from 'lucide-react'
import { PropsWithChildren } from 'react'
import { pacifico, pacificoFontStack } from '@/fonts/pacifico'
import { borel, borelFontStack } from '@/fonts/borel'
import { cookie, cookieFontStack } from '@/fonts/cookie'
import DeleteTextButton from '@/components/project/DeleteTextButton'

const FONT_CLASS_MAP: Record<string, { className: string; stack: string }> = {
  pacifico: { className: pacifico.className, stack: pacificoFontStack },
  'pacifico-regular': { className: pacifico.className, stack: pacificoFontStack },
  borel: { className: borel.className, stack: borelFontStack },
  'borel-regular': { className: borel.className, stack: borelFontStack },
  cookie: { className: cookie.className, stack: cookieFontStack },
  'cookie-regular': { className: cookie.className, stack: cookieFontStack },
}

const clampFontSize = (value?: number | null) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return 18
  return Math.min(60, Math.max(5, parsed))
}

const normalizeColor = (value?: string | null, fallback = '#FFFFFF') => {
  const raw = (value || fallback).trim()
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(raw)) {
    return raw.toUpperCase()
  }
  return fallback
}

type Props = {
  typography?: string | null
  fontSize?: number | null
  colorHex?: string | null
  backgroundEnabled?: boolean | null
  backgroundStyle?: 'fill' | 'outline' | 'transparent' | null
  backgroundColorHex?: string | null
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
  colorHex,
  backgroundEnabled,
  backgroundStyle,
  backgroundColorHex,
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
  const resolvedColor = normalizeColor(colorHex)
  const resolvedBackgroundColor = normalizeColor(backgroundColorHex, '#000000')
  const resolvedBackgroundStyle = backgroundStyle ?? (backgroundEnabled ? 'fill' : 'transparent')

  

  return (
    <div
      className={`relative px-4 py-2 rounded-xl text-white text-center shadow-lg
                  ${dragging ? 'cursor-grabbing' : 'cursor-grab'} ${extraClass}`}
      style={{
        fontFamily,
        fontSize: `${resolvedFontSize}px`,
        lineHeight: 1.25,
        color: resolvedColor,
        backgroundColor: resolvedBackgroundStyle === 'fill' ? resolvedBackgroundColor : 'transparent',
        border: resolvedBackgroundStyle === 'outline' ? `1.5px solid ${resolvedBackgroundColor}` : 'none',
        userSelect: 'none',
        touchAction: 'none',
        // width auto por defecto; el max-width lo controla el contenedor exterior
      }}
    >
      <span
        className="block whitespace-pre-wrap"
        style={{
          transform: 'translateY(0.08em)',
        }}
      >
        {children}
      </span>
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
