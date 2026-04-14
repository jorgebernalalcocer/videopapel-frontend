'use client'

import { useState } from 'react'
import { BookDashed, Book, PackageCheck } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { ColorActionButton, type ColorActionButtonColor } from '@/components/ui/color-action-button'


type ProjectStatus = 'draft' | 'ready' | 'exported'

type StatusBadgeProps = {
  status: ProjectStatus
  compact?: boolean
  size?: 'large' | 'compact' | 'mini'
  bordered?: boolean
  className?: string
  onAddToCart?: () => void
  addToCartDisabled?: boolean
  addingToCart?: boolean
}

const STATUS_CONFIG: Record<
  ProjectStatus,
  {
    label: string
    color: ColorActionButtonColor
    Icon: typeof Book
  }
> = {
  draft: {
    label: 'Elaborando',
    color: 'amber',
    Icon: BookDashed,
  },
  ready: {
    label: 'Listo para comprar',
    color: 'emerald',
    Icon: Book,
  },
  exported: {
    label: 'Comprado',
    color: 'blue',
    Icon: PackageCheck,
  },
}

export default function StatusBadge({
  status,
  compact = false,
  size,
  bordered = true,
  className = '',
  onAddToCart,
  addToCartDisabled = false,
  addingToCart = false,
}: StatusBadgeProps) {
  const [open, setOpen] = useState(false)
  const config = STATUS_CONFIG[status]
  const { label, color, Icon } = config

  const resolvedSize = size ?? (compact ? 'compact' : 'large')
  const isClickable = status === 'ready' && Boolean(onAddToCart)

  // 👉 Caso NO clicable
  if (!isClickable) {
    return (
      <ColorActionButton
        color={color}
        filled={false}
        bordered={bordered}
        shadowed={true}
        forceDisabled
        size={resolvedSize}
        icon={Icon}
        className={className}
        aria-label={`Estado del proyecto: ${label}`}
        title={`Estado del proyecto: ${label}`}
      >
        {label}
      </ColorActionButton>
    )
  }

  // 👉 Caso clicable (abre modal)
  return (
    <>
      <ColorActionButton
        color={color}
        filled
        bordered={bordered}
        shadowed={false}
        size={resolvedSize}
        icon={Icon}
        className={className}
        onClick={() => setOpen(true)}
        aria-label={`Estado del proyecto: ${label}`}
        title={`Estado del proyecto: ${label}`}
      >
        {label}
      </ColorActionButton>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Estado del proyecto"
        size="sm"
      >
        <p className="text-sm text-gray-700">
          El proyecto está listo para ser comprado
        </p>

        <div className="mt-4 flex flex-wrap gap-2 justify-end">
          <button
            type="button"
            onClick={() => {
              onAddToCart?.()
              setOpen(false)
            }}
            disabled={addToCartDisabled}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
          >
            {addingToCart ? 'Añadiendo…' : 'Añadir a la cesta'}
          </button>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="inline-flex items-center rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Seguir editando
          </button>
        </div>
      </Modal>
    </>
  )
}
