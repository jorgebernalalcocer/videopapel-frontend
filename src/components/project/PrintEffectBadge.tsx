'use client'


type Props = {
  /** Nombre del efecto */
  name?: string | null
  /** Modo compacto (menos padding/tamaño) */
  compact?: boolean
  /** Mostrar tooltip con texto largo */
  titleHint?: boolean
  className?: string
}

export default function PrintEffectBadge({
  name,
  compact = false,
  titleHint = true,
  className = '',
}: Props) {
  const label = name?.trim()
  const hasValue = Boolean(label)
  const text = hasValue ? label! : 'Sin efecto'
  const title = titleHint
    ? hasValue
      ? `Efecto de impresión: ${text}`
      : 'Efecto de impresión no seleccionado'
    : undefined

  const tone = hasValue
    ? 'bg-purple-50 text-purple-700 ring-purple-200'
    : 'bg-gray-100 text-gray-500 ring-gray-200'

  const size = compact ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1'

  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1 rounded-full ring-1 ${tone} ${size} ${className}`}
      aria-label={title}
    >
      <span className="font-medium">{text}</span>
    </span>
  )
}
