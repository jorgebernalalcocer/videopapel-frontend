'use client'

import { Sparkles } from 'lucide-react'
import { ColorActionButton } from '@/components/ui/color-action-button'

type Props = {
  name?: string | null
  dpi?: number | null
  ppi?: number | null
  compact?: boolean
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

  const label = hasValue
    ? `${name ?? ''}${quality ? ` — ${quality} DPI` : ''}`.trim()
    : 'Elige la calidad'

  const title = titleHint
    ? hasValue
      ? `Calidad de impresión: ${label}`
      : 'Calidad de impresión no seleccionada'
    : undefined

  // 👇 Mapeo de tonos a tu sistema de colores
  let color: any = 'slate'

  if ((quality ?? 0) >= 300) color = 'blue'
  else if ((quality ?? 0) > 150) color = 'emerald'
  else if (hasValue) color = 'amber'
  else color = 'slate'

  return (
    <ColorActionButton
      asChild
      color={color}
      filled={false}
      bordered
      shadowed={false}
      size={compact ? 'compact' : 'large'}
      icon={Sparkles}
      title={title}
      aria-label={title}
      className={className}
    >
      <span>{label}</span>
    </ColorActionButton>
  )
}