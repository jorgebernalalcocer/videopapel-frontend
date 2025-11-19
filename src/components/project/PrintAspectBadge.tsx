'use client'

import { Maximize2, Minimize2 } from 'lucide-react'
import MainBadge from '@/components/project/MainBadge'

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
  const title = isFill
    ? 'La imagen rellena todo el área de impresión recortando los sobrantes.'
    : 'La imagen se adapta completa, añadiendo márgenes si es necesario.'

  const icon = isFill ? (
    <Maximize2 className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
  ) : (
    <Minimize2 className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
  )

  return (
    <MainBadge
      label={label}
      title={title}
      ariaLabel={title}
      toneClassName={tone}
      size={compact ? 'compact' : 'large'}
      icon={icon}
      className={className}
    />
  )
}
