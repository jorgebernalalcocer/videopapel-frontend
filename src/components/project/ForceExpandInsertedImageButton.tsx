'use client'

import { ImageUpscale } from 'lucide-react'

import { ColorActionButton } from '@/components/ui/color-action-button'
import { cn } from '@/lib/utils'

type ForceExpandInsertedImageButtonProps = {
  disabled?: boolean
  onClick?: () => void
  className?: string
}

export default function ForceExpandInsertedImageButton({
  disabled = false,
  onClick,
  className,
}: ForceExpandInsertedImageButtonProps) {
  return (
    <ColorActionButton
      type="button"
      onClick={onClick}
      disabled={disabled}
      color="emerald"
      icon={ImageUpscale}
      size="compact"
      filled
      className={cn(className)}
    >
      Forzar expansion
    </ColorActionButton>
  )
}
