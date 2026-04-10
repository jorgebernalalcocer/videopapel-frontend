// src/app/clips/page.tsx
'use client'

import UploadVideo from '@/components/UploadVideo'
import UploadVideoTriggerButton from '@/components/UploadVideoTriggerButton'
import { Film } from 'lucide-react'

import MyClips from '@/components/MyClips'
// import MyProjects from '@/components/MyProjects'

export default function ClipsPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <div className="flex items-center gap-3">
              <Film className="h-8 w-8 text-red-700" />
              <div>
                <h1 className="mb-2 text-left text-3xl font-semibold text-grey-600">Sube tu video</h1>
                <p className="text-left text-sm text-gray-500">Añade aqui tus videos para crear proyectos de papel</p>
              </div>
            </div>
            <UploadVideoTriggerButton />
          </div>
        </div>

        {/* Oculta en smartphone (por defecto) y muestra en pantallas sm o superiores.
        */}
        <div className="hidden sm:block">
          <UploadVideo />
        </div>
        
        <MyClips />
      </div>
    </main>
  )
}
