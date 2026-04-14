'use client'

import { Share } from 'lucide-react'
import { ColorActionButton } from '@/components/ui/color-action-button'

type ShareProjectButtonProps = {
  onClick: () => void
  size?: 'large' | 'compact' | 'mini'
}

export default function ShareProjectButton({
  onClick,
  size = 'compact',
}: ShareProjectButtonProps) {
  return (
    <ColorActionButton
      onClick={onClick}
      color="purple"
      filled
      size={size}
      icon={Share}
      title="Compartir proyecto"
    >
      Compartir
    </ColorActionButton>
  )
}
