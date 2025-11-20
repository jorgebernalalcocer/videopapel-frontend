// src/components/VideosButton.tsx
'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { BookOpen } from 'lucide-react'

export default function ProjectsButton() {
  const router = useRouter()

  const handleProjects = () => {
    router.push('/projects') // ✅ navegación cliente de Next.js (sin recargar la página)
  }

  return (
    <Button className="
    inline-flex items-center
    px-3 py-1.5                  
    rounded-lg                   
    bg-purple-100                  
    text-purple-700
    font-medium
    transition-colors
    hover:bg-purple-700            
    hover:text-white
  "  onClick={handleProjects}>
      <BookOpen className="w-4 h-4 mr-1.5" /> 
      Biblioteca de proyectos
    </Button>
  )
}
