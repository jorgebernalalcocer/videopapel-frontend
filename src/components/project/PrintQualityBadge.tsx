'use client'

import { Sparkles } from 'lucide-react'
import MainBadge from '@/components/project/MainBadge'

type Props = {
  /** Nombre comercial: Draft / Standard / Photo ... */
  name?: string | null
  /** Dots per inch (calidad de impresión) */
  dpi?: number | null
  /** Alias legacy para compatibilidad */
  ppi?: number | null
  /** Modo compacto (menos padding/tamaño) */
  compact?: boolean
  /** Mostrar tooltip con texto largo */
  titleHint?: boolean
  className?: string
}

export default function PrintQualityBadge({
  name,
  dpi,
  ppi,
  compact = false,
  titleHint = true,
  className = '',
}: Props) {
  const quality = dpi ?? ppi ?? null
  const hasValue = Boolean(name) || Boolean(quality)
  const label = hasValue ? `${name ?? ''}${quality ? ` — ${quality} DPI` : ''}`.trim() : 'Elige la calidad'
  const title = titleHint
    ? (hasValue ? `Calidad de impresión: ${label}` : 'Calidad de impresión no seleccionada')
    : undefined

  // Color por “categoría” simple
  const tone =
    (quality ?? 0) >= 300 ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
    : (quality ?? 0) >= 150 ? 'bg-blue-50 text-blue-700 ring-blue-200'
    : hasValue ? 'bg-amber-50 text-amber-700 ring-amber-200'
    : 'bg-gray-100 text-gray-500 ring-gray-200'

  return (
    <MainBadge
      label={label}
      title={title}
      ariaLabel={title}
      toneClassName={tone}
      size={compact ? 'compact' : 'large'}
      icon={<Sparkles className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />}
      className={className}
    />
  )
}
