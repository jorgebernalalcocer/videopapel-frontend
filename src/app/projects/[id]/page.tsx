// src/app/projects/[id]/page.tsx
'use client'

import { use as usePromise } from 'react'
import ProjectEditor from '@/components/ProjectEditor'
import { useAuth } from '@/store/auth'
import { notFound } from 'next/navigation'

interface ProjectPageProps {
  params: Promise<{ id: string }>
}

export default function ProjectPage({ params }: ProjectPageProps) {
  const { id } = usePromise(params) // 👈 desenvuelve el Promise
  const projectId = String(id || '')

  if (!projectId) return notFound()

  const hasHydrated = useAuth((s) => s.hasHydrated)
  const accessToken = useAuth((s) => s.accessToken)

  if (!hasHydrated) {
    return <main className="min-h-screen px-6 py-10"><p className="text-gray-500">Preparando...</p></main>
  }

  if (!accessToken) {
    return <main className="min-h-screen px-6 py-10"><p className="text-red-500">Inicia sesión para ver este proyecto.</p></main>
  }

  return (
    <main className="min-h-screen w-full p-0 sm:p-4">
      <ProjectEditor projectId={projectId} />
    </main>
  )
}
