'use client'
import { Sparkles } from 'lucide-react'
import MainBadge from '@/components/project/MainBadge'


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

  return (
    <MainBadge
      label={text}
      title={title}
      ariaLabel={title}
      toneClassName={tone}
      size={compact ? 'compact' : 'large'}
      icon={<Sparkles className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />}
      className={className}
    />
  )
}
