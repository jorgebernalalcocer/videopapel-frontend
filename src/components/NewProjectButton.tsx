// src/components/NewProjectButton.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/store/auth'
import { Modal } from '@/components/ui/Modal'
// 1. ⭐️ Importar el nuevo componente modal
import VideoPickerModal, { type VideoItem } from '@/components/project/VideoPickerModal'

import { FilePlus } from 'lucide-react'


// Eliminamos la definición local de Video, ahora usamos VideoItem de VideoPickerModal
// type Video = { ... } 


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
  const [step, setStep] = useState<1 | 2>(1) // Ahora Step 2 solo abrirá el otro modal
  const [name, setName] = useState('')
  // ❌ Eliminado: [videos, setVideos]
  // ❌ Eliminado: [loadingVideos, setLoadingVideos]
  // ❌ Eliminado: [selectedVideoId, setSelectedVideoId]

  // ⭐️ Nuevo estado para el modal de selección de video
  const [openVideoPicker, setOpenVideoPicker] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE!
  const accessToken = useAuth((s) => s.accessToken)
  const hasHydrated = useAuth((s) => s.hasHydrated)
  const router = useRouter()

  // abrir modal principal (Step 1: Nombre)
  const openWizard = () => {
    setError(null)
    setStep(1)
    setName('')
    setOpen(true)
  }

  // ❌ Eliminado: fetchVideos (ya no es necesario, lo hace VideoPickerModal)
  // ❌ Eliminado: useEffect para fetchVideos

  const handleNext = () => {
    setError(null)
    if (step === 1) {
      // validación simple
      if (name.trim().length === 0) {
        setError('Ponle un nombre al proyecto')
        return
      }
      
      // En lugar de ir al step 2, abrimos el VideoPickerModal
      setOpen(false) // Cerrar modal principal
      setOpenVideoPicker(true) // Abrir modal de selección
    }
  }

  // ❌ Eliminado: handleBack (ya no hay Step 2 en este modal)


  // ⭐️ Nueva función para crear el proyecto una vez que se selecciona el video
  const handleVideoSelected = async (video: VideoItem) => {
    if (!accessToken) return
    setSubmitting(true)
    setError(null)

    // Nota: El modal de selección se encarga de cerrarse a sí mismo (onSelect lo hace)
    
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
          video_id: video.id, // Usamos el ID del video seleccionado
          // opcionalmente puedes enviar time_start_ms y time_end_ms
        }),
      })
      if (!res.ok) {
        const t = await res.text()
        throw new Error(t || `Error ${res.status}`)
      }
      const project = await res.json()
      // Éxito: notificar y navegar
      window.dispatchEvent(new CustomEvent('videopapel:project:changed'))
      router.push(`/projects/${project.id}`)

    } catch (e: any) {
      // Si falla la creación, mostramos el error
      console.error(e)
      // Como el modal principal ya está cerrado, reabrimos el principal para mostrar el error
      setName(name.trim()) // Restaurar el nombre
      setStep(1) // Volver al step 1
      setOpen(true) // Abrir el modal principal
      setError(`Error al crear el proyecto: ${e.message || 'Desconocido'}`)
    } finally {
      setSubmitting(false)
      // Asegurarse de que el estado de los modales es limpio
      setOpenVideoPicker(false)
    }
  }


  return (
    <>
      {/* Botón de Lanzamiento (sin cambios) */}
      <button
        className="
          inline-flex             
          items-center            
          justify-center          
          px-4 py-2               
          bg-pink-100                  
          text-pink-700
          hover:bg-pink-700            
          hover:text-white
          font-semibold
          rounded-lg
          shadow-md
          transition-colors       
        "
        onClick={openWizard}
        disabled={submitting}
      >
        <FilePlus className="w-5 h-5 mr-2" /> 
        <span>Nuevo proyecto</span> 
      </button>
      

      {/* Modal Principal (Solo Step 1: Nombre) */}
      <Modal
        open={open}
        onClose={() => !submitting && setOpen(false)}
        title={'Nombre del proyecto'}
        labelledById="new-project-title"
        describedById={error ? 'new-project-error' : undefined}
        size={'md'}
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
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={submitting}
                className="px-4 py-2 rounded-xl border text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              {/* El botón Siguiente ahora pasa directamente al VideoPicker */}
              <button
                type="button"
                onClick={handleNext}
                disabled={submitting || name.trim().length === 0}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        }
      >
        {/* Solo mostramos el Step 1: Nombre */}
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
      </Modal>

      {/* ⭐️ Modal de Selección de Video (componente externo) */}
      <VideoPickerModal
        open={openVideoPicker}
        onClose={() => setOpenVideoPicker(false)}
        apiBase={API_BASE}
        accessToken={accessToken}
        onSelect={handleVideoSelected} // Usamos la nueva función para crear el proyecto
      />
    </>
  )
}