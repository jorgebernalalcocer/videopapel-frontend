// src/components/ui/ConfirmProvider.tsx
'use client'

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Modal } from '@/components/ui/Modal'

// -------- Confirm Context / Hook --------
type ConfirmOptions = {
  title?: string
  description?: ReactNode
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'danger'
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
