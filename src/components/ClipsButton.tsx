// src/components/VideosButton.tsx
'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function VideosButton() {
  const router = useRouter()

  const handleClips = () => {
    router.push('/clips') // ✅ navegación cliente de Next.js (sin recargar la página)
  }

  return (
    <Button className="rounded-full bg-orange-50 p-2 text-orange-600"  onClick={handleClips}>
      Mis Videos
    </Button>
  )
}
