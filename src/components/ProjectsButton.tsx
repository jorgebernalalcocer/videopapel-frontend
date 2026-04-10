// src/components/VideosButton.tsx
'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { BookOpen } from 'lucide-react'
import { ColorActionButton } from '@/components/ui/color-action-button'

export default function ProjectsButton() {
  const router = useRouter()

  const handleProjects = () => {
    router.push('/projects') // ✅ navegación cliente de Next.js (sin recargar la página)
  }

  return (

    <ColorActionButton
  type="button"
  onClick={handleProjects}
  color="amber"
  
  
  size="compact"
  icon={BookOpen}
>
  Biblioteca de proyectos de papel
</ColorActionButton>
  )
}
