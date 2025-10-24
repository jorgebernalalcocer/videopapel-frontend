// src/app/projects/[id]/page.tsx  (Server Component por defecto)
import ProjectEditorGate from '@/components/project/ProjectEditorGate'

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <main className="min-h-screen w-full p-0 sm:p-4">
      <ProjectEditorGate projectId={id} />
    </main>
  )
}
