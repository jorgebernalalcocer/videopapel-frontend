// src/components/ui/ConfirmProvider.tsx
'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

// --- Modal base súper reusable ---
function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  labelledById,
}: {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  footer?: React.ReactNode
  labelledById?: string
}) {
  const [mounted, setMounted] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const lastActiveEl = useRef<HTMLElement | null>(null)

  // montar portal solo en cliente
  useEffect(() => setMounted(true), [])

  // bloquear scroll del body cuando está abierto
  useEffect(() => {
    if (!open) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = original }
  }, [open])

  // gestión del foco: guardar y devolver
  useEffect(() => {
    if (open) {
      lastActiveEl.current = (document.activeElement as HTMLElement) || null
      // focus al dialog
      setTimeout(() => {
        dialogRef.current?.focus()
      }, 0)
    } else {
      lastActiveEl.current?.focus?.()
    }
  }, [open])

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
    // Focus trap simple: si Tab sale del modal, vuelve
    if (e.key === 'Tab') {
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      )
      if (!focusable || focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        last.focus()
        e.preventDefault()
      } else if (!e.shiftKey && document.activeElement === last) {
        first.focus()
        e.preventDefault()
      }
    }
  }, [onClose])

  if (!mounted) return null
  if (!open) return null

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(e) => {
        // cerrar si clic en overlay
        if (e.target === overlayRef.current) onClose()
      }}
      aria-hidden={!open}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledById}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className="w-full max-w-md rounded-2xl bg-white shadow-xl outline-none ring-1 ring-black/5"
      >
        {title && (
          <div className="px-5 pt-5">
            <h2 id={labelledById} className="text-lg font-semibold">{title}</h2>
          </div>
        )}
        <div className="px-5 py-4">
          {children}
        </div>
        {footer && (
          <div className="px-5 pb-5 pt-2 flex gap-2 justify-end">{footer}</div>
        )}
      </div>
    </div>,
    document.body
  )
}

// -------- Confirm Context / Hook --------
type ConfirmOptions = {
  title?: string
  description?: React.ReactNode
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'danger' // para estilos de botón
}

type ConfirmContextType = {
  confirm: (opts?: ConfirmOptions) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextType | null>(null)

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used inside <ConfirmProvider>')
  return ctx.confirm
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const resolverRef = useRef<(v: boolean) => void>()
  const optionsRef = useRef<ConfirmOptions>({
    title: '¿Confirmar acción?',
    description: 'Esta acción podría ser irreversible.',
    confirmText: 'Aceptar',
    cancelText: 'Cancelar',
    variant: 'default',
  })

  const confirm = useCallback((opts?: ConfirmOptions) => {
    optionsRef.current = { ...optionsRef.current, ...(opts || {}) }
    setOpen(true)
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve
    })
  }, [])

  const close = useCallback((result: boolean) => {
    setOpen(false)
    resolverRef.current?.(result)
  }, [])

  const ctxValue = useMemo(() => ({ confirm }), [confirm])

  const labelledBy = 'confirm-dialog-title'

  return (
    <ConfirmContext.Provider value={ctxValue}>
      {children}
      <Modal
        open={open}
        onClose={() => close(false)}
        title={optionsRef.current.title}
        labelledById={labelledBy}
        footer={
          <>
            <button
              type="button"
              onClick={() => close(false)}
              className="px-4 py-2 rounded-xl border text-gray-700 hover:bg-gray-50"
            >
              {optionsRef.current.cancelText || 'Cancelar'}
            </button>
            <button
              type="button"
              onClick={() => close(true)}
              className={
                optionsRef.current.variant === 'danger'
                  ? 'px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700'
                  : 'px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700'
              }
            >
              {optionsRef.current.confirmText || 'Aceptar'}
            </button>
          </>
        }
      >
        <div className="text-sm text-gray-600">
          {optionsRef.current.description}
        </div>
      </Modal>
    </ConfirmContext.Provider>
  )
}
