// src/components/VideosButton.tsx
'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Film } from 'lucide-react'


export default function VideosButton() {
  const router = useRouter()

  const handleClips = () => {
    router.push('/clips') // ✅ navegación cliente de Next.js (sin recargar la página)
  }

  return (
    <Button className="
    inline-flex items-center
    px-3 py-1.5                  
    rounded-lg                   
    bg-orange-100                  
    text-orange-700
    font-medium
    transition-colors
    hover:bg-orange-700            
    hover:text-white
  "  onClick={handleClips}>
       <Film className="w-4 h-4 mr-1.5" /> 
      Mis Videos
    </Button>
  )
}
