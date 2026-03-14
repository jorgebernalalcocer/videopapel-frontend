'use client'

import { Share } from 'lucide-react'

type ShareProjectButtonProps = {
  onClick: () => void
}

export default function ShareProjectButton({ onClick }: ShareProjectButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="Compartir proyecto"
      className="px-3 py-1.5 text-xs rounded-lg bg-purple-100 text-black hover:bg-gray-50 flex items-center justify-center gap-1"
    >
      <Share className="w-3 h-3" />
      Compartir
    </button>
  )
}
