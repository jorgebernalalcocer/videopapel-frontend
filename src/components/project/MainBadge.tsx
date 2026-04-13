'use client'

import type { ReactNode } from 'react'
import {
  colorActionButtonClassName,
  type ColorActionButtonColor,
} from '@/components/ui/color-action-button'

type BadgeSize = 'compact' | 'large'

type MainBadgeProps = {
  label: string
  toneClassName?: string
  title?: string
  ariaLabel?: string
  size?: BadgeSize
  icon?: ReactNode
  className?: string
  color?: ColorActionButtonColor
  filled?: boolean
  bordered?: boolean
  shadowed?: boolean
  forceDisabled?: boolean
}

const sizeMap: Record<BadgeSize, 'mini' | 'compact'> = {
  compact: 'mini',
  large: 'compact',
}

export default function MainBadge({
  label,
  toneClassName: _toneClassName,
  title,
  ariaLabel,
  size = 'large',
  icon,
  className = '',
  color = 'slate',
  filled = false,
  bordered = true,
  shadowed = true,
  forceDisabled = false,
}: MainBadgeProps) {
  return (
    <span
      className={colorActionButtonClassName({
        color,
        filled,
        bordered,
        shadowed,
        forceDisabled,
        size: sizeMap[size] ?? 'mini',
        className,
      })}
      title={title}
      aria-label={ariaLabel ?? title ?? label}
    >
      {icon ? <span className="inline-flex items-center justify-center">{icon}</span> : null}
      <span className="truncate">{label}</span>
    </span>
  )
}
