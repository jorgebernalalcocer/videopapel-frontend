'use client'

import { Save } from 'lucide-react'

import { ColorActionButton } from '@/components/ui/color-action-button'
import { cn } from '@/lib/utils'

type SaveInsertedImageButtonProps = {
  disabled?: boolean
  isSaving?: boolean
  onClick?: () => void
  className?: string
}

export default function SaveInsertedImageButton({
  disabled = false,
  isSaving = false,
  onClick,
  className,
}: SaveInsertedImageButtonProps) {
  return (
    <ColorActionButton
      type="button"
      onClick={onClick}
      disabled={disabled}
      color="blue"
      icon={Save}
      filled
      size="compact"
      className={cn(className)}
    >
      {isSaving ? 'Guardando…' : 'Guardar'}
    </ColorActionButton>
  )
}
