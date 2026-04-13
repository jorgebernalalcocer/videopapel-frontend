'use client'

import { Globe, Lock } from 'lucide-react'
import { ColorActionButton } from '@/components/ui/color-action-button'

type Props = {
  isPublic?: boolean | null
  compact?: boolean
  className?: string
  clickable?: boolean
}

export default function ProjectPrivacyBadge({
  isPublic = false,
  compact = false,
  className = '',
  clickable = false,
  filled = false,
}: Props) {
  const label = isPublic ? 'Público' : 'Privado'
  const title = isPublic
    ? 'Este proyecto es público'
    : 'Este proyecto es privado'

  const color = isPublic ? 'emerald' : 'rose'
  const Icon = isPublic ? Globe : Lock

  return (
    <ColorActionButton
      color={color}
      filled={filled}
      bordered
      shadowed={false}
      forceDisabled={!clickable}
      size={compact ? 'compact' : 'large'}
      icon={Icon}
      title={title}
      aria-label={title}
      className={className}
    >
      {label}
    </ColorActionButton>
  )
}