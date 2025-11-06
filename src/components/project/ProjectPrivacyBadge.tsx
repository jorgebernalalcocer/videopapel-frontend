'use client'

import { Globe, Lock } from 'lucide-react'

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
  const size = compact ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1'
  const label = isPublic ? 'Público' : 'Privado'
  const title = isPublic
    ? 'Este proyecto es público'
    : 'Este proyecto es privado'

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full ring-1 ${tone} ${size} ${className}`}
      title={title}
      aria-label={title}
    >
      {isPublic ? (
        <Globe className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
      ) : (
        <Lock className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
      )}
      <span className="font-medium">{label}</span>
    </span>
  )
}
