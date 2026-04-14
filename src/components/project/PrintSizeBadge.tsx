'use client'

import { Scan } from 'lucide-react'
import {
  ColorActionButton,
  type ColorActionButtonColor,
} from '@/components/ui/color-action-button'

type Props = {
  /** Nombre comercial: A4 / 8x10 ... */
  name?: string | null
  /** Ancho en mm */
  widthMm?: number | null
  /** Alto en mm */
  heightMm?: number | null
  /** Modo compacto (menos padding/tamaño) */
  compact?: boolean
  /** Mostrar tooltip con texto largo */
  titleHint?: boolean
  className?: string
}

export default function PrintSizeBadge({
  name,
  widthMm,
  heightMm,
  compact = false,
  titleHint = true,
  className = '',
}: Props) {
  const hasValue = Boolean(name) || (Boolean(widthMm) && Boolean(heightMm))

  const label = hasValue
    ? `${name ?? ''}${widthMm && heightMm ? ` — ${widthMm}×${heightMm} mm` : ''}`.trim()
    : 'Sin tamaño'

  const title = titleHint
    ? hasValue
      ? `Tamaño de impresión: ${label}`
      : 'Tamaño de impresión no seleccionado'
    : undefined

  const color: ColorActionButtonColor =
    widthMm && heightMm && widthMm >= 300 && heightMm >= 400
      ? 'slate'
      : widthMm && heightMm && widthMm >= 200 && heightMm >= 250
        ? 'slate'
        : hasValue
          ? 'slate'
          : 'slate'

  return (
    <ColorActionButton
      asChild
      color={color}
      filled={false}
      bordered
      shadowed={false}
      size={compact ? 'compact' : 'large'}
      icon={Scan}
      title={title}
      aria-label={title}
      className={className}
    >
      <span>{label}</span>
    </ColorActionButton>
  )
}