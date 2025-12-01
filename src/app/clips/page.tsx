// src/app/clips/page.tsx
'use client'

import UploadVideo from '@/components/UploadVideo'
import UploadVideoTriggerButton from '@/components/UploadVideoTriggerButton'

import MyClips from '@/components/MyClips'
// import MyProjects from '@/components/MyProjects'

export default function ClipsPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center px-4 py-6 sm:py-12">
      {/* Oculta en smartphone (por defecto) y muestra en pantallas sm o superiores.
      */}
      <div className="hidden sm:block max-w-2xl w-full text-center mb-8">
        <h1 className="text-3xl font-semibold mb-2">Sube tu video 🎥</h1>
      </div>
      
      {/* Oculta en smartphone (por defecto) y muestra en pantallas sm o superiores.
      */}
      <div className="hidden sm:block">
        <UploadVideo />
      </div>
      
      <MyClips />
    </main>
  )
}
