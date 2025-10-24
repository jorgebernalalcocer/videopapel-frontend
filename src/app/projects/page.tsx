// src/app/projects/page.tsx
import MyProjects from '@/components/MyProjects'

export default function ProjectsPage() {
  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto w-full max-w-6xl">
        <h1 className="text-3xl font-semibold mb-6">Mis proyectos</h1>
        <MyProjects />
      </div>
    </main>
  )
}
