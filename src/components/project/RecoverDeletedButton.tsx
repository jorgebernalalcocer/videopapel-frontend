'use client'

import { RotateCcw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type RecoverDeletedButtonProps = {
  disabled?: boolean
  onClick?: () => void
  className?: string
}

export default function RecoverDeletedButton({
  disabled = false,
  onClick,
  className,
}: RecoverDeletedButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      disabled={disabled}
      aria-label="Descartar cambios"
      className={cn('inline-flex items-center gap-2 bg-white hover:bg-white', className)}
    >
      <RotateCcw className="h-4 w-4 text-blue-600" />
      <span>Recuperar eliminados</span>
    </Button>
  )
}
