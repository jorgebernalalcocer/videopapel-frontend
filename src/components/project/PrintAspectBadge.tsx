'use client'

import { Maximize2, Minimize2 } from 'lucide-react'
import { ColorActionButton } from '@/components/ui/color-action-button'

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

  const title = isFill
    ? 'La imagen rellena todo el área de impresión recortando los sobrantes.'
    : 'La imagen se adapta completa, añadiendo márgenes si es necesario.'

  // const color = isFill ? 'blue' : 'amber'
  const color = isFill ? 'slate' : 'slate'
  const Icon = isFill ? Maximize2 : Minimize2

  return (
    <ColorActionButton
      asChild
      color={color}
      filled={false}
      bordered
      shadowed={false}
      size={compact ? 'compact' : 'large'}
      icon={Icon}
      title={title}
      aria-label={title}
      className={className}
    >
      <span>{label}</span>
    </ColorActionButton>
  )
}