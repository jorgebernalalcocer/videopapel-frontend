'use client'

import { Save } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

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
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      disabled={disabled}
      aria-label="Guardar cambios"
      className={cn('inline-flex items-center gap-2 bg-white hover:bg-white', className)}
    >
      <Save className="h-4 w-4 text-green-600" />
      <span>{isSaving ? 'Guardando…' : 'Guardar cambios'}</span>
    </Button>
  )
}
