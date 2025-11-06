'use client'

import { Maximize2, Minimize2 } from 'lucide-react'

type Props = {
  slug?: string | null
  name?: string | null
  compact?: boolean
  className?: string
}

const SLUG_FILL = 'fill'
const SLUG_FIT = 'fit'

export default function PrintAspectBadge({
  slug,
  name,
  compact = false,
  className = '',
}: Props) {
  const normalizedSlug = (slug || '').toLowerCase()
  const isFill = !normalizedSlug || normalizedSlug === SLUG_FILL
  const label = name || (isFill ? 'Relleno completo' : 'Imagen completa')

  const tone = isFill
    ? 'bg-blue-50 text-blue-700 ring-blue-200'
    : 'bg-amber-50 text-amber-700 ring-amber-200'
  const size = compact ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1'
  const title = isFill
    ? 'La imagen rellena todo el área de impresión recortando los sobrantes.'
    : 'La imagen se adapta completa, añadiendo márgenes si es necesario.'

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full ring-1 ${tone} ${size} ${className}`}
      title={title}
      aria-label={title}
    >
      {isFill ? (
        <Maximize2 className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
      ) : (
        <Minimize2 className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
      )}
      <span className="font-medium">{label}</span>
    </span>
  )
}
