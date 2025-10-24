// src/components/ProjectEditorGate.tsx
'use client'

import ProjectEditor from '@/components/project/ProjectEditor'
import { useAuth } from '@/store/auth'
import { notFound } from 'next/navigation'

export default function ProjectEditorGate({ projectId }: { projectId: string }) {
  if (!projectId) return notFound()

  const hasHydrated = useAuth((s) => s.hasHydrated)
  const accessToken = useAuth((s) => s.accessToken)

  if (!hasHydrated) {
    return <main className="min-h-screen px-6 py-10"><p className="text-gray-500">Preparando...</p></main>
  }

  if (!accessToken) {
    return <main className="min-h-screen px-6 py-10"><p className="text-red-500">Inicia sesión para ver este proyecto.</p></main>
  }

  return <ProjectEditor projectId={projectId} />
}
