// src/app/clips/page.tsx
'use client'

// src/app/projects/page.tsx
import MyProjects from '@/components/MyProjects'
import NewProjectButton from '@/components/NewProjectButton'
import { BookOpen } from 'lucide-react'


export default function ProjectsPage() {
  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-pink-600" />
            <div>
              <h1 className="text-3xl font-semibold text-gray-900">Proyectos de papel</h1>
              <p className="text-sm text-gray-500">Crea videos de papel a partir de uno digital.</p>
            </div>
          </div>
          <div className="sm:shrink-0">
            <NewProjectButton />
          </div>
        </div>
        <MyProjects />
      </div>
    </main>
  )
}
