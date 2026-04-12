'use client'

import { SquarePen } from 'lucide-react'

type EditActionButtonProps = {
  onClick: () => void
  label?: string
  compact?: boolean
  disabled?: boolean
  fullWidthOnMobile?: boolean
}

export default function EditActionButton({
  onClick,
  label = 'Modificar',
  compact = false,
  disabled = false,
  fullWidthOnMobile = false,
}: EditActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={
        compact
          ? `${fullWidthOnMobile ? 'flex w-full justify-center sm:inline-flex sm:w-auto' : 'shrink-0'} rounded-md border px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-60`
          : `${fullWidthOnMobile ? 'flex w-full justify-center md:inline-flex md:w-auto' : 'inline-flex'} items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60`
      }
    >
      {!compact && <SquarePen className="h-4 w-4" />}
      {label}
    </button>
  )
}
