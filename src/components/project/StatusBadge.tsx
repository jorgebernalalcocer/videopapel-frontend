'use client'

import { useState } from 'react'
import MainBadge from '@/components/project/MainBadge'
import { BookDashed, Book, PackageCheck } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'

type ProjectStatus = 'draft' | 'ready' | 'exported'

type StatusBadgeProps = {
  status: ProjectStatus
  compact?: boolean
  className?: string
  onAddToCart?: () => void
  addToCartDisabled?: boolean
  addingToCart?: boolean
}

const STATUS_CONFIG: Record<ProjectStatus, { label: string; tone: string; staticTone: string; Icon: typeof Book }> = {
  draft: {
    label: 'Elaborando',
    tone: 'bg-amber-100 text-amber-700 ring-amber-200',
    staticTone: 'bg-white text-amber-700 ring-amber-200',
    Icon: BookDashed,
  },
  ready: {
    label: 'Listo para comprar',
    tone: 'bg-green-100 text-green-700 ring-green-200',
    staticTone: 'bg-white text-green-700 ring-green-200',
    Icon: Book,
  },
  exported: {
    label: 'Comprado',
    tone: 'bg-blue-100 text-blue-700 ring-blue-200',
    staticTone: 'bg-white text-blue-700 ring-blue-200',
    Icon: PackageCheck,
  },
}

export default function StatusBadge({
  status,
  compact = false,
  className = '',
  onAddToCart,
  addToCartDisabled = false,
  addingToCart = false,
}: StatusBadgeProps) {
  const [open, setOpen] = useState(false)
  const config = STATUS_CONFIG[status]
  const { label, tone, staticTone, Icon } = config

  if (!onAddToCart) {
    return (
      <MainBadge
        label={label}
        toneClassName={staticTone}
        size={compact ? 'compact' : 'large'}
        icon={<Icon className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />}
        className={className}
        ariaLabel={`Estado del proyecto: ${label}`}
      />
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
        aria-label={`Estado del proyecto: ${label}`}
      >
        <MainBadge
          label={label}
          toneClassName={tone}
          size={compact ? 'compact' : 'large'}
          icon={<Icon className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />}
          className={className}
          ariaLabel={`Estado del proyecto: ${label}`}
        />
      </button>

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
              onAddToCart()
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
