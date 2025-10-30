// src/components/NewProjectButton.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/store/auth'
import { Modal } from '@/components/ui/Modal'
// 1. ⭐️ Importar el componente de subida
import UploadVideo from './UploadVideo' 

type Video = {
  id: number
  title: string | null
  thumbnail: string | null
  duration_ms: number
  format: string | null
  url?: string | null
  file?: string | null
}

// **Función auxiliar (sin cambios)**
function formatMs(ms: number) {
  const s = Math.floor(ms / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return [h, m, sec].map((n, i) => (i === 0 && n === 0 ? null : String(n).padStart(2, '0'))).filter(Boolean).join(':') || '00:00'
}

export default function NewProjectButton() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<1 | 2>(1)
  const [name, setName] = useState('')
  const [videos, setVideos] = useState<Video[]>([])
  const [loadingVideos, setLoadingVideos] = useState(false)
  const [selectedVideoId, setSelectedVideoId] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // 2. ⭐️ Nuevo estado para el modal de subida de video
  const [showUploadModal, setShowUploadModal] = useState(false) 

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE!
  const accessToken = useAuth((s) => s.accessToken)
  const hasHydrated = useAuth((s) => s.hasHydrated)
  const router = useRouter()

  // abrir modal
  const openWizard = () => {
    setError(null)
    setStep(1)
    setName('')
    setSelectedVideoId(null)
    setOpen(true)
  }

  // Carga de videos (inalterada)
  const fetchVideos = useCallback(async () => {
    if (!accessToken) return
    setLoadingVideos(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/videos/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        credentials: 'include',
      })
      if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`)
      const data = await res.json()
      const newVideos = Array.isArray(data) ? data : data.results ?? []
      setVideos(newVideos)
      
      // Mantener la selección si el video aún existe, o resetear
      if (selectedVideoId && !newVideos.some(v => v.id === selectedVideoId)) {
         setSelectedVideoId(null)
      }
    } catch (e: any) {
      setError(e.message || 'No se pudieron cargar los videos')
    } finally {
      setLoadingVideos(false)
    }
  }, [API_BASE, accessToken, selectedVideoId]) // Incluir selectedVideoId en dependencias

  useEffect(() => {
    if (open && step === 2) fetchVideos()
  }, [open, step, fetchVideos])

  // 3. ⭐️ Escuchador del evento de subida
  useEffect(() => {
    if (!open) return // Solo escuchar cuando el modal principal está abierto

    const handleVideoUploaded = () => {
      // 🚀 Video subido con éxito, refrescamos la lista
      console.log("Evento 'videopapel:uploaded' recibido. Refrescando videos.")
      setShowUploadModal(false) // Cerrar modal de subida
      setError(null) // Limpiar cualquier error anterior
      fetchVideos() 
    }

    window.addEventListener('videopapel:uploaded', handleVideoUploaded)

    return () => {
      window.removeEventListener('videopapel:uploaded', handleVideoUploaded)
    }
  }, [open, fetchVideos])


  const handleNext = () => {
    setError(null)
    if (step === 1) {
      // validación simple
      if (name.trim().length === 0) {
        setError('Ponle un nombre al proyecto')
        return
      }
      setStep(2)
    }
  }

  const handleBack = () => {
    setError(null)
    if (step === 2) setStep(1)
  }

  const handleCreate = async () => {
    if (!accessToken || !selectedVideoId) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/projects/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          name: name.trim(),
          video_id: selectedVideoId,
          // opcionalmente puedes enviar time_start_ms y time_end_ms
        }),
      })
      if (!res.ok) {
        const t = await res.text()
        throw new Error(t || `Error ${res.status}`)
      }
      const project = await res.json()
      setOpen(false)
      // notificar y navegar
      window.dispatchEvent(new CustomEvent('videopapel:project:changed'))
      router.push(`/projects/${project.id}`)
    } catch (e: any) {
      setError(e.message || 'No se pudo crear el proyecto')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <button
        onClick={openWizard}
        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        Nuevo proyecto
      </button>

      {/* Modal Principal (New Project Wizard) */}
      <Modal
        open={open}
        onClose={() => !submitting && setOpen(false)}
        title={step === 1 ? 'Nombre del proyecto' : 'Elige un video'}
        labelledById="new-project-title"
        describedById={error ? 'new-project-error' : undefined}
        size={step === 2 ? 'lg' : 'md'}
        footer={
          <div className="flex justify-between w-full">
            <div>
              {error && (
                <span id="new-project-error" className="text-sm text-red-600">
                  {error}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              {step === 2 && (
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={submitting || showUploadModal} // Deshabilitar si se está subiendo (para evitar inconsistencias)
                  className="px-4 py-2 rounded-xl border text-gray-700 hover:bg-gray-50"
                >
                  Atrás
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={submitting || showUploadModal}
                className="px-4 py-2 rounded-xl border text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              {step === 1 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
                >
                  Siguiente
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={!selectedVideoId || submitting || loadingVideos || showUploadModal}
                  className="px-4 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {submitting ? 'Creando…' : 'Crear proyecto'}
                </button>
              )}
            </div>
          </div>
        }
      >
        {step === 1 ? (
          <div className="space-y-2">
            <label htmlFor="project-name" className="text-sm font-medium">
              Nombre
            </label>
            <input
              id="project-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Mi primer proyecto"
              className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500">
              Podrás cambiarlo más tarde.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* 4. ⭐️ Botón que abre el modal de subida */}
            <button
              onClick={() => setShowUploadModal(true)}
              disabled={loadingVideos || submitting || showUploadModal}
              className="inline-flex items-center gap-1 rounded-xl bg-indigo-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-600 disabled:opacity-50"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 20 20" 
                fill="currentColor" 
                className="w-5 h-5"
              >
                <path d="M9.25 13.064l-2.09-2.09a.75.75 0 00-1.06 1.06l3.352 3.353a.75.75 0 001.06 0l4.582-4.581a.75.75 0 10-1.06-1.06l-3.29 3.29V5.75a.75.75 0 00-1.5 0v7.314zM4.75 16.25a.75.75 0 000 1.5h10.5a.75.75 0 000-1.5H4.75z" />
              </svg>
              Subir un nuevo video
            </button>
            
            {loadingVideos ? (
              <p className="text-gray-500 text-sm">Cargando videos…</p>
            ) : videos.length === 0 ? (
              <p className="text-gray-500 text-sm">No tienes videos todavía. ¡Sube uno!</p>
            ) : (
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[50vh] overflow-auto pr-1">
                {videos.map((v) => {
                  const selected = selectedVideoId === v.id
                  return (
                    <li
                      key={v.id}
                      className={`rounded-lg border overflow-hidden cursor-pointer ${
                        selected ? 'ring-2 ring-blue-500' : 'hover:border-gray-400'
                      }`}
                      onClick={() => setSelectedVideoId(v.id)}
                    >
                      <div className="aspect-video bg-black">
                        {v.thumbnail ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={v.thumbnail}
                            alt={v.title || `Video ${v.id}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full grid place-items-center text-white text-xs">
                            {v.title || `Video #${v.id}`}
                          </div>
                        )}
                      </div>
                      <div className="p-2">
                        <p className="text-sm font-medium truncate">{v.title || `Video #${v.id}`}</p>
                        <p className="text-xs text-gray-500">{formatMs(v.duration_ms)} • {v.format?.toUpperCase() || '—'}</p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )}
      </Modal>

      {/* 5. ⭐️ Modal para la subida de video */}
      <Modal
        open={showUploadModal}
        onClose={() => setShowUploadModal(false)} // Cierra el modal de subida
        title="Subir nuevo video"
        size="lg"
        contentClassName="max-w-xl" // Ajusta el ancho del contenido sin afectar al overlay
      >
        {/* 6. Renderizar el componente de subida */}
        <UploadVideo />
      </Modal>
    </>
  )
}
