// src/components/VideosButton.tsx
'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function ProjectsButton() {
  const router = useRouter()

  const handleProjects = () => {
    router.push('/projects') // ✅ navegación cliente de Next.js (sin recargar la página)
  }

  return (
    <Button variant="secondary" onClick={handleProjects}>
      Biblioteca de proyectos
    </Button>
  )
}
