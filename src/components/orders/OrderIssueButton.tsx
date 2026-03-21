'use client'

import { TriangleAlert } from 'lucide-react'

type OrderIssueButtonProps = {
  onClick: () => void
  disabled?: boolean
}

export function OrderIssueButton({ onClick, disabled = false }: OrderIssueButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 shadow-sm hover:bg-amber-100 disabled:opacity-60"
    >
      <TriangleAlert className="h-5 w-5" />
      Informar incidencia
    </button>
  )
}
