// src/components/VideosButton.tsx
'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Film } from 'lucide-react'
import { ColorActionButton } from '@/components/ui/color-action-button'


export default function VideosButton() {
  const router = useRouter()

  const handleClips = () => {
    router.push('/clips') // ✅ navegación cliente de Next.js (sin recargar la página)
  }

  return (
    <ColorActionButton
  type="button"
  onClick={handleClips}
  color="purple"
  size="compact"
  icon={Film}
>
  Videos digitales
</ColorActionButton>

  )
}
