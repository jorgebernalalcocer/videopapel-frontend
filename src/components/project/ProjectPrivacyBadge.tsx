'use client'

import { Globe, Lock } from 'lucide-react'
import MainBadge from '@/components/project/MainBadge'

type Props = {
  isPublic?: boolean | null
  compact?: boolean
  className?: string
}

export default function ProjectPrivacyBadge({
  isPublic = false,
  compact = false,
  className = '',
}: Props) {
  const tone = isPublic
    ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
    : 'bg-rose-50 text-rose-700 ring-rose-200'
  const label = isPublic ? 'Público' : 'Privado'
  const title = isPublic
    ? 'Este proyecto es público'
    : 'Este proyecto es privado'

  const icon = isPublic ? (
    <Globe className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
  ) : (
    <Lock className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
  )

  return (
    <MainBadge
      label={label}
      title={title}
      ariaLabel={title}
      toneClassName={tone}
      size={compact ? 'compact' : 'large'}
      icon={icon}
      className={className}
    />
  )
}
