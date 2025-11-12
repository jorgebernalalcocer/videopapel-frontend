// src/components/VideosButton.tsx
'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function ProfileButton() {
  const router = useRouter()

  const handleProfile = () => {
    router.push('/profile') // ✅ navegación cliente de Next.js (sin recargar la página)
  }

  return (
    <Button variant="secondary" onClick={handleProfile}>
      Mi perfil
    </Button>
  )
}
