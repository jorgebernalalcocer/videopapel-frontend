'use client'
import { useEffect, useMemo, useState } from 'react'

type PrintOrientation = 'vertical' | 'horizontal' | 'cuadrado'

type Props = {
  /** Orientación: retrato / paisaje / cuadrado */
  orientation?: PrintOrientation | null
  /** Modo compacto (menos padding/tamaño) */
  compact?: boolean
  /** Mostrar tooltip con texto largo */
  titleHint?: boolean
  className?: string
}

export default function PrintOrientationBadge({
  orientation,
  compact = false,
  titleHint = true,
  className = '',
}: Props) {
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  const label = useMemo(() => {
    if (!orientation) return 'Sin orientación'
    switch (orientation) {
      case 'vertical':
        return 'Vertical'
      case 'horizontal':
        return 'Horizontal'
      case 'cuadrado':
        return 'Cuadrado'
    }
  }, [orientation])

  const title = titleHint
    ? (orientation ? `Orientación de impresión: ${label}` : 'Orientación de impresión no seleccionada')
    : undefined

  // Color por “categoría” simple
  const tone = orientation
    ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
    : 'bg-gray-100 text-gray-500 ring-gray-200'

  const size = compact ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1'

  if (!hasMounted) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full ring-1 ${tone} ${size} ${className}`}
      >
        <span className="h-4 w-4 animate-pulse rounded-full bg-gray-300" />
        <span className="h-4 w-16 animate-pulse rounded-full bg-gray-300" />
      </span>
    )
  }

  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1 rounded-full ring-1 ${tone} ${size} ${className}`}
      aria-label={title}
    >
      <span
        className={
          orientation === 'vertical' ? 'h-5 w-3.5 rounded-sm border-2 border-current bg-white'
          : orientation === 'horizontal' ? 'h-3.5 w-5 rounded-sm border-2 border-current bg-white'
          : orientation === 'cuadrado' ? 'h-4.5 w-4.5 rounded-sm border-2 border-current bg-white'
          : 'h-4 w-4 rounded-full bg-gray-300'
        }
      />
      <span className="font-medium">{label}</span>
    </span>
  )
}