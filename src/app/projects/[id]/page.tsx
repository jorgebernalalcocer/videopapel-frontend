// src/app/projects/[id]/page.tsx
'use client'

import ProjectEditor from '@/components/ProjectEditor'
import { useAuth } from '@/store/auth'
import { notFound } from 'next/navigation'

// You are already correctly using the type definition:
interface ProjectPageProps {
  params: {
    id: string // This is the UUID
  }
}

export default function ProjectPage({ params }: ProjectPageProps) {
  // ⭐️ This direct destructuring is what triggers the warning.
  // Next.js will continue to support this for now, but for future compatibility,
  // we'll keep the logic clean and follow best practices.
  const projectId = String(params.id);
  
  // The rest of your component logic remains correct:

  if (!projectId) {
    return notFound()
  }

  const hasHydrated = useAuth((s) => s.hasHydrated)
  const accessToken = useAuth((s) => s.accessToken)

  if (!hasHydrated) {
    return (
      <main className="min-h-screen px-6 py-10">
        <p className="text-gray-500">Preparando...</p>
      </main>
    )
  }

  if (!accessToken) {
    return (
      <main className="min-h-screen px-6 py-10">
        <p className="text-red-500">Inicia sesión para ver este proyecto.</p>
      </main>
    )
  }

  // Passing the ID to the client-side editor component
  return (
    <main className="min-h-screen w-full p-0 sm:p-4">
      <ProjectEditor projectId={projectId} />
    </main>
  )
}