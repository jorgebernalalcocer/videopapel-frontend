'use client'

import { createPortal } from 'react-dom'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

type ModalSize = 'sm' | 'md' | 'lg'

export type ModalProps = {
  open: boolean
  onClose: () => void
  children: ReactNode
  title?: ReactNode
  description?: ReactNode
  footer?: ReactNode
  labelledById?: string
  describedById?: string
  size?: ModalSize
  closeOnOverlay?: boolean
  className?: string
  contentClassName?: string
}

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
}

/**
 * Modal base reutilizable.
 * Maneja focus trap, bloqueo de scroll y portalización en document.body.
 */
export function Modal({
  open,
  onClose,
  children,
  title,
  description,
  footer,
  labelledById,
  describedById,
  size = 'md',
  closeOnOverlay = true,
  className,
  contentClassName,
}: ModalProps) {
  const [mounted, setMounted] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const lastActiveEl = useRef<HTMLElement | null>(null)

  useEffect(() => setMounted(true), [])

  // bloquea el scroll del body cuando está abierto
  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  // guarda y restaura el foco
  useEffect(() => {
    if (open) {
      lastActiveEl.current = (document.activeElement as HTMLElement) || null
      setTimeout(() => dialogRef.current?.focus(), 0)
    } else {
      lastActiveEl.current?.focus?.()
    }
  }, [open])

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose()
        return
      }

      if (event.key !== 'Tab') return
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
      )
      if (!focusable || focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const isShift = event.shiftKey
      const active = document.activeElement

      if (!isShift && active === last) {
        first.focus()
        event.preventDefault()
      } else if (isShift && active === first) {
        last.focus()
        event.preventDefault()
      }
    },
    [onClose],
  )

  const dialogClasses = useMemo(() => {
    const classes = [
      'w-full',
      sizeClasses[size],
      'rounded-2xl',
      'bg-white',
      'shadow-xl',
      'outline-none',
      'ring-1',
      'ring-black/5',
      contentClassName,
    ]
    return classes.filter(Boolean).join(' ')
  }, [contentClassName, size])

  if (!mounted || !open) return null

  return createPortal(
    <div
      ref={overlayRef}
      className={['fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4', className]
        .filter(Boolean)
        .join(' ')}
      onMouseDown={(event) => {
        if (!closeOnOverlay) return
        if (event.target === overlayRef.current) onClose()
      }}
      aria-hidden={!open}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledById}
        aria-describedby={describedById}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className={dialogClasses}
      >
        {(title || description) && (
          <div className="px-5 pt-5">
            {title && (
              <h2 id={labelledById} className="text-lg font-semibold">
                {title}
              </h2>
            )}
            {description && (
              <p id={describedById} className="mt-1 text-sm text-gray-600">
                {description}
              </p>
            )}
          </div>
        )}
        <div className="px-5 py-4">{children}</div>
        {footer && <div className="px-5 pb-5 pt-2 flex gap-2 justify-end">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}
