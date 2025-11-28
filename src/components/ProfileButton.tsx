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
// Un diseño más sobrio y profesional para el escritorio
<Button
  className="
    inline-flex items-center
    px-3 py-1.5                  
    rounded-lg                   
    bg-purple-100                  
    text-purple-700
    font-medium
    transition-colors
    hover:bg-purple-700            
    hover:text-white
  "
  onClick={handleProfile}
>
  <CircleUserRound className="w-4 h-4 mr-1.5" /> 
  Mi perfil
</Button>
  )
}
