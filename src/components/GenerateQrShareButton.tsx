'use client'

import { QrCode } from 'lucide-react'

type GenerateQrShareButtonProps = {
  onClick: () => void
  disabled?: boolean
  loading?: boolean
}

export default function GenerateQrShareButton({ onClick, disabled = false, loading = false }: GenerateQrShareButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 transition hover:border-gray-400 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <QrCode className="h-4 w-4" />
      <span>{loading ? 'Generando QR...' : 'Generar QR'}</span>
    </button>
  )
}
