'use client'

import { Trash } from 'lucide-react'

import { ColorActionButton } from '@/components/ui/color-action-button'
import { cn } from '@/lib/utils'

type DeleteInsertedImageButtonProps = {
  disabled?: boolean
  onClick?: () => void
  className?: string
}

export default function DeleteInsertedImageButton({
  disabled = false,
  onClick,
  className,
}: DeleteInsertedImageButtonProps) {
  return (
    <ColorActionButton
      type="button"
      onClick={onClick}
      disabled={disabled}
      filled
      color="red"
      icon={Trash}
      size="compact"
      className={cn(className)}
    >
      Borrar imagen
    </ColorActionButton>
  )
}
