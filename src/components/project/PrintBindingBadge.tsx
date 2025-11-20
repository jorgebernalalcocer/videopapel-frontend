'use client'

import { BookCopy } from 'lucide-react'
import MainBadge from '@/components/project/MainBadge'

type Props = {
  name?: string | null
  description?: string | null
  compact?: boolean
  titleHint?: boolean
  className?: string
}

export default function PrintBindingBadge({
  name,
  description,
  compact = false,
  titleHint = true,
  className = '',
}: Props) {
  const label = name?.trim()
  const hasValue = Boolean(label)
  const text = hasValue ? label! : 'Sin encuadernación'
  const hint = hasValue && description ? `${text} — ${description}` : text
  const title = titleHint
    ? hasValue
      ? `Encuadernación: ${hint}`
      : 'Encuadernación no seleccionada'
    : undefined

  const tone = hasValue
    ? 'bg-amber-50 text-amber-700 ring-amber-200'
    : 'bg-gray-100 text-gray-500 ring-gray-200'

  return (
    <MainBadge
      label={text}
      title={title}
      ariaLabel={title}
      toneClassName={tone}
      size={compact ? 'compact' : 'large'}
      icon={<BookCopy className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />}
      className={className}
    />
  )
}
