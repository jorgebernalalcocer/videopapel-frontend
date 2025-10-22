// src/components/UploadVideo.tsx
'use client'

import { useState, useCallback, useRef } from 'react'
import { UploadCloud } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/store/auth'

type SignResponse = {
  cloud_name: string
  api_key: string
  timestamp: number
  signature: string
  folder: string
}

export default function UploadVideo() {
  const [isDragging, setIsDragging] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [progress, setProgress] = useState<number>(0)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const accessToken = useAuth((s) => s.accessToken)

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const onDragLeave = useCallback(() => setIsDragging(false), [])

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleVideo(file)
  }, [])

  const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) handleVideo(f)
  }, [])

  const handleVideo = async (file: File) => {
    // Validación tipo simple (Cloudinary también valida del lado servidor)
    if (!file.type.startsWith('video/')) {
      alert('Por favor, selecciona un archivo de vídeo.')
      return
    }
    setFileName(file.name)
    setProgress(0)
    setUploading(true)
    try {
      // 1) Pide firma al backend (requiere sesión)
const API_BASE = process.env.NEXT_PUBLIC_API_BASE

const signRes = await fetch(`${API_BASE}/cloudinary/sign/`, {
  credentials: 'include',
  headers: accessToken
    ? { Authorization: `Bearer ${accessToken}` }
    : undefined,
})

      if (!signRes.ok) throw new Error('No se pudo obtener la firma de Cloudinary')
      const { cloud_name, api_key, timestamp, signature, folder } = (await signRes.json()) as SignResponse

      // 2) Envía a Cloudinary con XHR para captar progreso
      const form = new FormData()
      form.append('file', file)
      form.append('api_key', api_key)
      form.append('timestamp', String(timestamp))
      form.append('signature', signature)
      form.append('folder', folder)
      // Nota: resource_type=video se infiere por la URL de endpoint

      const cloudUrl = `https://api.cloudinary.com/v1_1/${cloud_name}/video/upload`

      const responseJson = await new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', cloudUrl, true)

        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable) {
            const pct = Math.round((evt.loaded / evt.total) * 100)
            setProgress(pct)
          }
        }
        xhr.onerror = () => reject(new Error('Error de red subiendo a Cloudinary'))
        xhr.onload = () => {
          try {
            const json = JSON.parse(xhr.responseText)
            if (xhr.status >= 200 && xhr.status < 300) resolve(json)
            else reject(new Error(json?.error?.message || 'Error al subir a Cloudinary'))
          } catch (e) {
            reject(new Error('Respuesta inválida de Cloudinary'))
          }
        }
        xhr.send(form)
      })

      // 3) Cloudinary devuelve info útil
      const {
        secure_url,
        public_id,
        format,
        duration, // en segundos (float)
        original_filename,
      } = responseJson

      // 4) Registrar en tu backend (crea fila Video)
const createRes = await fetch(`${API_BASE}/videos/`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  },
  credentials: 'include',
  body: JSON.stringify({
    title: original_filename,
    format,
    file: secure_url,
    public_id,
    duration,
  }),
})
      if (!createRes.ok) {
        const err = await createRes.text()
        throw new Error(`Error creando Video en backend: ${err}`)
      }

      setProgress(100)
      alert('¡Vídeo subido y registrado con éxito!')
      window.dispatchEvent(new CustomEvent('videopapel:uploaded'))
      // opcional: limpiar estado o navegar a /clips/<id>
    } catch (err: any) {
      console.error(err)
      alert(err.message || 'Error subiendo el vídeo')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div
      className={[
        'flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-10 w-full max-w-xl transition-colors',
        isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white',
      ].join(' ')}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <UploadCloud className="h-12 w-12 text-gray-500 mb-3" />
      <p className="text-gray-700 font-medium">Arrastra tu video aquí</p>
      <p className="text-gray-500 text-sm mb-4">o haz clic para seleccionar un archivo</p>

      <label htmlFor="video-upload" className="cursor-pointer">
        <Button variant="secondary" asChild>
          <span>Seleccionar archivo</span>
        </Button>
        <input
          ref={inputRef}
          id="video-upload"
          type="file"
          accept="video/*"
          className="hidden"
          onChange={onChange}
          disabled={uploading}
        />
      </label>

      {fileName && (
        <p className="mt-4 text-sm text-gray-700">
          Archivo: <span className="font-medium">{fileName}</span>
        </p>
      )}

      {uploading && (
        <div className="w-full max-w-md mt-5">
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="h-2 bg-blue-600 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-600 mt-2 text-center">{progress}%</p>
        </div>
      )}
    </div>
  )
}
