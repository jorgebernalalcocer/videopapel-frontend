// src/components/VideosButton.tsx
'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CircleUserRound } from 'lucide-react'
import { ColorActionButton } from '@/components/ui/color-action-button'


export default function ProfileButton() {
  const router = useRouter()

  const handleProfile = () => {
    router.push('/profile') // ✅ navegación cliente de Next.js (sin recargar la página)
  }

  return (
// Un diseño más sobrio y profesional para el escritorio

            <ColorActionButton
  type="button"
  onClick={handleProfile}
  color="purple"
  size="compact"
  icon={CircleUserRound}
  filled
>
  Mi perfil
</ColorActionButton>
  )
}
