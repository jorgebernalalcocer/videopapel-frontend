// src/app/clips/page.tsx
'use client'

import UploadVideo from '@/components/UploadVideo'

export default function ClipsPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4">
      <div className="max-w-2xl w-full text-center mb-8">
        <h1 className="text-3xl font-semibold mb-2">Sube tu video 🎥</h1>
        <p className="text-gray-600">
          Arrastra y suelta un archivo de video o haz clic para seleccionarlo.
        </p>
      </div>
      <UploadVideo />
    </main>
  )
}
