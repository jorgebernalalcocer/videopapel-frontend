// src/components/VideosButton.tsx
'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CircleUserRound } from 'lucide-react'


export default function ProfileButton() {
  const router = useRouter()

  const handleProfile = () => {
    router.push('/profile') // ✅ navegación cliente de Next.js (sin recargar la página)
  }

  return (
    <Button variant="default" onClick={handleProfile}>
      <CircleUserRound className="w-4 h-4" />

      Mi perfil
    </Button>
  )
}
