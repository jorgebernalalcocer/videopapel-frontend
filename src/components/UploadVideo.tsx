// src/components/UploadVideo.tsx
'use client'

import { useState, useCallback } from 'react'
import { UploadCloud } from 'lucide-react'
import { cn } from '@/lib/utils' // si tienes utilidades tailwind, si no, omítelo
import { Button } from '@/components/ui/button'

export default function UploadVideo() {
  const [isDragging, setIsDragging] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      setFileName(file.name)
      console.log('Archivo recibido:', file)
      // Aquí puedes subirlo a tu API o S3, etc.
    }
  }, [])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFileName(file.name)
      console.log('Archivo seleccionado:', file)
    }
  }, [])

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-10 w-full max-w-xl transition-colors',
        isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <UploadCloud className="h-12 w-12 text-gray-500 mb-3" />
      <p className="text-gray-700 font-medium">
        Arrastra tu video aquí
      </p>
      <p className="text-gray-500 text-sm mb-4">
        o haz clic para seleccionar un archivo
      </p>

      <label
        htmlFor="video-upload"
        className="cursor-pointer"
      >
        <Button variant="secondary" asChild>
          <span>Seleccionar archivo</span>
        </Button>
        <input
          id="video-upload"
          type="file"
          accept="video/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </label>

      {fileName && (
        <p className="mt-4 text-sm text-green-600 font-medium">
          Archivo seleccionado: {fileName}
        </p>
      )}
    </div>
  )
}
