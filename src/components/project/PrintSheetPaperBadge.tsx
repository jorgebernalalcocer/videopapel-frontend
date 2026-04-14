'use client'

import { Layers } from 'lucide-react'
import {
  ColorActionButton,
  type ColorActionButtonColor,
} from '@/components/ui/color-action-button'

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

  // 👇 Mapeo de color
  // const color: ColorActionButtonColor = hasValue ? 'blue' : 'slate'
    const color: ColorActionButtonColor = hasValue ? 'slate' : 'slate'


  return (
    <ColorActionButton
      asChild
      color={color}
      filled={false}
      bordered
      shadowed={false}
      size={compact ? 'compact' : 'large'}
      icon={Layers}
      title={title}
      aria-label={title}
      className={className}
    >
      <span>{text}</span>
    </ColorActionButton>
  )
}