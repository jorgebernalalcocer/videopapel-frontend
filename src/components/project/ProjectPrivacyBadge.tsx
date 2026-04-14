'use client'

import { Globe, Lock } from 'lucide-react'
import { ColorActionButton } from '@/components/ui/color-action-button'

type Props = {
  isPublic?: boolean | null
  compact?: boolean
  size?: 'large' | 'compact' | 'mini'
  className?: string
  clickable?: boolean
  forceDisabled?: boolean
  bordered?: boolean
}

export default function ProjectPrivacyBadge({
  isPublic = false,
  compact = false,
  size,
  className = '',
  clickable = false,
  forceDisabled = false,
  bordered = true,
}: Props) {
  const label = isPublic ? 'Público' : 'Privado'
  const title = isPublic
    ? 'Este proyecto es público'
    : 'Este proyecto es privado'

  const color = isPublic ? 'emerald' : 'rose'
  const Icon = isPublic ? Globe : Lock
  const resolvedSize = size ?? (compact ? 'compact' : 'large')

  return (
    <ColorActionButton
      asChild
      color={color}
      filled={clickable}
      bordered={bordered}
      shadowed={false}
      forceDisabled={forceDisabled}
      size={resolvedSize}
      icon={Icon}
      title={title}
      aria-label={title}
      className={className}
    >
      <span>{label}</span>
    </ColorActionButton>
  )
}
