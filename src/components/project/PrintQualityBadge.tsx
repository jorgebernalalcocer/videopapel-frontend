'use client'

import { Sparkles } from 'lucide-react'

type Props = {
  /** Nombre comercial: Draft / Standard / Photo ... */
  name?: string | null
  /** Puntos por pulgada (PPI/DPI) */
  ppi?: number | null
  /** Modo compacto (menos padding/tamaño) */
  compact?: boolean
  /** Mostrar tooltip con texto largo */
  titleHint?: boolean
  className?: string
}

export default function PrintQualityBadge({
  name,
  ppi,
  compact = false,
  titleHint = true,
  className = '',
}: Props) {
  const hasValue = Boolean(name) || Boolean(ppi)
  const label = hasValue ? `${name ?? ''}${ppi ? ` — ${ppi} PPI` : ''}`.trim() : 'Sin calidad'
  const title = titleHint
    ? (hasValue ? `Calidad de impresión: ${label}` : 'Calidad de impresión no seleccionada')
    : undefined

  // Color por “categoría” simple
  const tone =
    (ppi ?? 0) >= 300 ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
    : (ppi ?? 0) >= 150 ? 'bg-blue-50 text-blue-700 ring-blue-200'
    : hasValue ? 'bg-amber-50 text-amber-700 ring-amber-200'
    : 'bg-gray-100 text-gray-500 ring-gray-200'

  const size = compact ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1'

  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1 rounded-full ring-1 ${tone} ${size} ${className}`}
      aria-label={title}
    >
      <Sparkles className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
      <span className="font-medium">{label}</span>
    </span>
  )
}
