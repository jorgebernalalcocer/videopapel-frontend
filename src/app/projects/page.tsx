// src/app/clips/page.tsx
'use client'

// src/app/projects/page.tsx
import MyProjects from '@/components/MyProjects'
import NewProjectButton from '@/components/NewProjectButton'

export default function ProjectsPage() {
  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-semibold">Mis proyectos</h1>
          <NewProjectButton />
        </div>
        <MyProjects />
      </div>
    </main>
  )
}
