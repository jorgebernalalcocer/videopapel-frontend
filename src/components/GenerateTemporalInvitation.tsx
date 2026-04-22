'use client'

import { KeyRound } from 'lucide-react' // O la librería de iconos que estés usando
import { ColorActionButton } from '@/components/ui/color-action-button'

type Props = {
  onClick: () => void
}

export default function GenerateTemporalInvitation({ onClick }: Props) {
  return (
    <ColorActionButton
      type="button"
      onClick={onClick}
      color="amber"
      size="large"
      icon={KeyRound}
    >
      Generar invitación
    </ColorActionButton>
  )
}