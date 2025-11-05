'use client'
import { Scan } from 'lucide-react'
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
    ? (hasValue ? `Tamaño de impresión: ${label}` : 'Tamaño de impresión no seleccionado')
    : undefined

  // Color por “categoría” simple
  const tone =
    (widthMm && heightMm && widthMm >= 300 && heightMm >= 400) ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
    : (widthMm && heightMm && widthMm >= 200 && heightMm >= 250) ? 'bg-blue-50 text-blue-700 ring-blue-200'
    : hasValue ? 'bg-amber-50 text-amber-700 ring-amber-200'
    : 'bg-gray-100 text-gray-500 ring-gray-200'

  const size = compact ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1'

  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1 rounded-full ring-1 ${tone} ${size} ${className}`}
      aria-label={title}
    >
      <Scan className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
      <span className="font-medium">{label}</span>
    </span>
  )
}