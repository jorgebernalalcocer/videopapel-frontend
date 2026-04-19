'use client'

import { Save } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ColorActionButton } from '@/components/ui/color-action-button'

type SaveChangesButtonProps = {
  disabled?: boolean
  isSaving?: boolean
  onClick?: () => void
  className?: string
}

export default function SaveChangesButton({
  disabled = false,
  isSaving = false,
  onClick,
  className,
}: SaveChangesButtonProps) {
  return (
<ColorActionButton
  onClick={onClick}
  disabled={disabled || isSaving}
  color="blue"
  size="compact"
  filled
  icon={Save}
  aria-label="Guardar cambios"
>
  {isSaving ? 'Guardando…' : 'Guardar cambios'}
</ColorActionButton>
  )
}
