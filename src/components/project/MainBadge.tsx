'use client'

import type { ReactNode } from 'react'

type BadgeSize = 'compact' | 'large'

type MainBadgeProps = {
  label: string
  toneClassName?: string
  title?: string
  ariaLabel?: string
  size?: BadgeSize
  icon?: ReactNode
  className?: string
}

const sizeClasses: Record<BadgeSize, string> = {
  compact: 'text-xs px-2 py-0.5',
  large: 'text-sm px-3 py-1',
}

const gapClasses: Record<BadgeSize, string> = {
  compact: 'gap-1',
  large: 'gap-1.5',
}

export default function MainBadge({
  label,
  toneClassName = 'bg-gray-100 text-gray-600 ring-gray-200',
  title,
  ariaLabel,
  size = 'large',
  icon,
  className = '',
}: MainBadgeProps) {
  const sizeClass = sizeClasses[size] ?? sizeClasses.large
  const gapClass = icon ? gapClasses[size] : 'gap-0'

  return (
    <span
      className={`inline-flex items-center rounded-full ring-1 font-medium ${sizeClass} ${gapClass} ${toneClassName} ${className}`}
      title={title}
      aria-label={ariaLabel ?? title ?? label}
    >
      {icon ? <span className="inline-flex items-center justify-center">{icon}</span> : null}
      <span className="truncate">{label}</span>
    </span>
  )
}
