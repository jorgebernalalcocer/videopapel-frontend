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
  red: {
    text: 'text-red-700',
    ring: 'ring-red-200',
    filledBg: 'bg-red-100',
    hover: 'hover:bg-red-700',
  },
  slate: {
    text: 'text-slate-700',
    ring: 'ring-slate-200',
    filledBg: 'bg-slate-100',
    hover: 'hover:bg-slate-700',
  },
} as const

export type ColorActionButtonColor = keyof typeof colorStyles

type ColorActionButtonProps = React.ComponentProps<'button'> & {
  color: ColorActionButtonColor
  filled?: boolean
  bordered?: boolean
  shadowed?: boolean
  forceDisabled?: boolean
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
  bordered = true,
  shadowed = true,
  forceDisabled = false,
  size = 'large',
}: {
  className?: string
  color: ColorActionButtonColor
  filled?: boolean
  bordered?: boolean
  shadowed?: boolean
  forceDisabled?: boolean
  size?: 'large' | 'compact' | 'mini'
}) {
  const styles = colorStyles[color]

  return cn(
    'inline-flex items-center justify-center whitespace-nowrap rounded-lg font-semibold leading-none transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none',
    sizeStyles[size],
    styles.text,
    bordered && ['ring-1', styles.ring],
    shadowed && 'shadow-md',
    filled ? styles.filledBg : 'bg-white',
    styles.hover,
    forceDisabled && 'pointer-events-none shadow-none',
    className
  )
}

export function ColorActionButton({
  className,
  color,
  filled = false,
  bordered = true,
  shadowed = true,
  forceDisabled = false,
  icon: Icon,
  size = 'large',
  type = 'button',
  children,
  asChild = false,
  disabled,
  onClick,
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
          bordered,
          shadowed,
          forceDisabled,
          size,
        })}
        {...props}
        aria-disabled={forceDisabled || undefined}
        onClick={forceDisabled ? (event) => event.preventDefault() : onClick}
      >
        {React.cloneElement(child, {
          className: child.props.className,
          tabIndex: forceDisabled ? -1 : child.props.tabIndex,
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
      className={colorActionButtonClassName({
        className,
        color,
        filled,
        bordered,
        shadowed,
        forceDisabled,
        size,
      })}
      {...props}
      disabled={forceDisabled || disabled}
      onClick={onClick}
    >
      {Icon ? (
        <Icon className={cn(iconSizeStyles[size], children ? 'mr-1' : '')} />
      ) : null}
      {children}
    </button>
  )
}
