'use client'

import { Scissors } from 'lucide-react'

type CutClipButtonProps = {
  onClick: () => void
  disabled?: boolean
}

export default function CutClipButton({
  onClick,
  disabled,
}: CutClipButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label="Recortar tramo del clip"
      className={`inline-flex items-center justify-center rounded-full h-9 w-9 border
        ${disabled
          ? 'opacity-50 cursor-not-allowed border-gray-300 bg-white'
          : 'hover:bg-orange-50 active:bg-orange-100 border-orange-300 bg-white'}
      `}
      title="Recortar tramo del clip"
    >
      <Scissors className="h-[18px] w-[18px]" aria-hidden="true" />
    </button>
  )
}
