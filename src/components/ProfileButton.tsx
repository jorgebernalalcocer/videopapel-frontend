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
    <Button className="rounded-full bg-pink-50 p-2 text-pink-600" onClick={handleProfile}>
      <CircleUserRound className="w-4 h-4" />

      Mi perfil
    </Button>
  )
}
