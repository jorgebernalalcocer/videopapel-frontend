'use client'

import { Layers } from 'lucide-react'
import MainBadge from '@/components/project/MainBadge'

type Props = {
  label?: string | null
  weight?: number | null
  finishing?: string | null
  compact?: boolean
  titleHint?: boolean
  className?: string
}

export default function PrintSheetPaperBadge({
  label,
  weight,
  finishing,
  compact = false,
  titleHint = true,
  className = '',
}: Props) {
  const parts = [
    label?.trim() || null,
    weight ? `${weight} g/m2` : null,
    finishing?.trim() || null,
  ].filter(Boolean) as string[]

  const hasValue = parts.length > 0
  const text = hasValue ? parts.join(' — ') : 'Sin papel'
  const title = titleHint
    ? hasValue
      ? `Papel de impresión: ${text}`
      : 'Papel de impresión no seleccionado'
    : undefined

  const tone = hasValue
    ? 'bg-cyan-50 text-cyan-700 ring-cyan-200'
    : 'bg-gray-100 text-gray-500 ring-gray-200'

  return (
    <MainBadge
      label={text}
      title={title}
      ariaLabel={title}
      toneClassName={tone}
      size={compact ? 'compact' : 'large'}
      icon={<Layers className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />}
      className={className}
    />
  )
}
