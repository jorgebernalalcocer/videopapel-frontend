import * as React from 'react'
import type { LucideIcon } from 'lucide-react'
import { Slot } from '@radix-ui/react-slot'

import { cn } from '@/lib/utils'

const colorStyles = {
  emerald: {
    text: 'text-emerald-700',
    ring: 'ring-emerald-200',
    filledBg: 'bg-emerald-100',
    hover: 'hover:bg-emerald-700',
  },
  olive: {
    text: 'text-olive-400',
    ring: 'ring-olive-200',
    filledBg: 'bg-olive-100',
    hover: 'hover:bg-olive-700',
  },
  stone: {
    text: 'text-stone-500',
    ring: 'ring-stone-200',
    filledBg: 'bg-stone-200',
    hover: 'hover:bg-stone-400',
  },
  pink: {
    text: 'text-pink-700',
    ring: 'ring-pink-200',
    filledBg: 'bg-pink-100',
    hover: 'hover:bg-pink-700',
  },
  purple: {
    text: 'text-purple-700',
    ring: 'ring-purple-200',
    filledBg: 'bg-purple-100',
    hover: 'hover:bg-purple-700',
  },
  violet: {
    text: 'text-violet-700',
    ring: 'ring-violet-200',
    filledBg: 'bg-violet-100',
    hover: 'hover:bg-violet-700',
  },
  blue: {
    text: 'text-blue-700',
    ring: 'ring-blue-200',
    filledBg: 'bg-blue-100',
    hover: 'hover:bg-blue-700',
  },
  amber: {
    text: 'text-amber-700',
    ring: 'ring-amber-200',
    filledBg: 'bg-amber-100',
    hover: 'hover:bg-amber-700',
  },
  rose: {
    text: 'text-rose-700',
    ring: 'ring-rose-200',
    filledBg: 'bg-rose-100',
    hover: 'hover:bg-rose-700',
  },
  paper: {
    text: 'text-stone-700',
    ring: 'ring-stone-200',
    filledBg: 'bg-stone-200',
    hover: 'hover:bg-stone-500',
  },
  green: {
    text: 'text-green-700',
    ring: 'ring-green-200',
    filledBg: 'bg-green-100',
    hover: 'hover:bg-green-700',
  },
  red: {
    text: 'text-red-700',
    ring: 'ring-red-200',
    filledBg: 'bg-red-100',
    hover: 'hover:bg-red-700',
  },
} as const

export type ColorActionButtonColor = keyof typeof colorStyles

type ColorActionButtonProps = React.ComponentProps<'button'> & {
  color: ColorActionButtonColor
  filled?: boolean
  size?: 'large' | 'compact' | 'mini'
  icon?: LucideIcon
  asChild?: boolean
}

const sizeStyles = {
  large: 'h-10 gap-2 px-4 text-base',
  compact: 'h-8 gap-1.5 px-3 text-xs',
  mini: 'h-7 gap-1 px-2.5 text-[11px]',
} as const

const iconSizeStyles = {
  large: 'h-5 w-5',
  compact: 'h-4 w-4',
  mini: 'h-3 w-3',
} as const

export function colorActionButtonClassName({
  className,
  color,
  filled = false,
  size = 'large',
}: {
  className?: string
  color: ColorActionButtonColor
  filled?: boolean
  size?: 'large' | 'compact' | 'mini'
}) {
  const styles = colorStyles[color]

  return cn(
    'inline-flex items-center justify-center whitespace-nowrap rounded-lg font-semibold leading-none ring-1 shadow-md transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none',
    sizeStyles[size],
    styles.text,
    styles.ring,
    filled ? styles.filledBg : 'bg-white',
    styles.hover,
    className
  )
}

export function ColorActionButton({
  className,
  color,
  filled = false,
  icon: Icon,
  size = 'large',
  type = 'button',
  children,
  asChild = false,
  ...props
}: ColorActionButtonProps) {
  if (asChild) {
    const child = React.Children.only(children) as React.ReactElement<{
      children?: React.ReactNode
      className?: string
    }>

    return (
      <Slot
        className={colorActionButtonClassName({
          className,
          color,
          filled,
          size,
        })}
        {...props}
      >
        {React.cloneElement(child, {
          className: child.props.className,
          children: (
            <>
              {Icon ? (
                <Icon
                  className={cn(
                    iconSizeStyles[size],
                    child.props.children ? 'mr-1' : ''
                  )}
                />
              ) : null}
              {child.props.children}
            </>
          ),
        })}
      </Slot>
    )
  }

  return (
    <button
      type={type}
      className={colorActionButtonClassName({ className, color, filled, size })}
      {...props}
    >
      {Icon ? (
        <Icon className={cn(iconSizeStyles[size], children ? 'mr-1' : '')} />
      ) : null}
      {children}
    </button>
  )
}
