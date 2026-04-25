'use client'

import { SquarePen } from 'lucide-react'
import { ColorActionButton } from '@/components/ui/color-action-button'

type EditActionButtonProps = {
  onClick: () => void
  label?: string
  compact?: boolean // Mantenemos la prop por compatibilidad, pero forzaremos 'mini'
  disabled?: boolean
  fullWidthOnMobile?: boolean
}

export default function EditActionButton({
  onClick,
  label = 'Modificar',
  compact = false,
  disabled = false,
  fullWidthOnMobile = false,
}: EditActionButtonProps) {
  return (
    <ColorActionButton
      type="button"
      onClick={onClick}
      disabled={disabled}
      color="red"
      size="mini"
      // Si compact es true, no mostramos el icono según tu lógica original
      icon={!compact ? SquarePen : undefined}
      className={
        fullWidthOnMobile 
          ? 'flex w-full justify-center sm:inline-flex sm:w-auto' 
          : ''
      }
    >
      {label}
    </ColorActionButton>
  )
}