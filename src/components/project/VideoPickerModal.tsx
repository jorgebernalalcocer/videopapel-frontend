'use client'

import { useCallback, useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import UploadVideoTriggerButton from '@/components/UploadVideoTriggerButton'
import GlobalSpinner from '@/components/GlobalSpinner' 

export type VideoItem = {
  id: number
  title: string | null
  thumbnail: string | null
  duration_ms: number
  format: string | null
  url?: string | null
  file?: string | null
  frame_status?: 'pending' | 'processing' | 'ready' | 'error' | null 
}

type VideoPickerModalProps = {
  open: boolean
  onClose: () => void
  apiBase: string
  accessToken: string | null
  onSelect: (video: VideoItem) => void | Promise<void>
}

const FRAME_STATUS = {
    PENDING: "pending",
    PROCESSING: "processing",
    READY: "ready",
    ERROR: "error",
}

export default function VideoPickerModal({ open, onClose, apiBase, accessToken, onSelect }: VideoPickerModalProps) {
  const [videos, setVideos] = useState<VideoItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null)
  const [isCheckingFrames, setIsCheckingFrames] = useState(false) 

  const fetchVideos = useCallback(async () => {
    if (!accessToken) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${apiBase}/videos/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        credentials: 'include',
      })
      if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`)
      const data = await res.json()
      const list: VideoItem[] = Array.isArray(data) ? data : data.results ?? []
      setVideos(list)

      // ⭐️ Corrección 1: Asegurar que si el video seleccionado existe, el objeto esté actualizado
      setSelectedVideo(prev => {
        if (!prev) return null
        const updatedVideo = list.find(v => v.id === prev.id)
        // Devolver el objeto completo actualizado, si existe. Si no, deseleccionar.
        return updatedVideo || null 
      })

    } catch (e: any) {
      setError(e.message || 'No se pudieron cargar los videos')
    } finally {
      setLoading(false)
    }
  }, [apiBase, accessToken])

  useEffect(() => {
    if (open) {
      fetchVideos()
      setIsCheckingFrames(false) 
    }
  }, [open, fetchVideos])
  
  // Función para hacer polling del estado del video
  const checkFrameStatus = useCallback((video: VideoItem) => {
    if (!accessToken) return Promise.reject(new Error("No hay token de acceso."))

    return new Promise<VideoItem>((resolve, reject) => {
      const maxRetries = 40 // ~2 minutos de espera (40 * 3s)
      let retries = 0
      
      const intervalId = setInterval(async () => {
        if (retries >= maxRetries) {
            clearInterval(intervalId)
            reject(new Error("Tiempo de espera agotado para la generación de imágenes."))
            return
        }
        retries++

        try {
          const res = await fetch(`${apiBase}/videos/${video.id}/`, {
            headers: { Authorization: `Bearer ${accessToken}` },
            credentials: 'include',
          })
          if (!res.ok) {
            clearInterval(intervalId)
            throw new Error(`Error ${res.status} al verificar el estado de frames.`)
          }
          const updatedVideo: VideoItem = await res.json()
          
          // ⭐️ Log para depuración
          console.log(`frame_status actual: ${updatedVideo.frame_status}`) 

          if (updatedVideo.frame_status === FRAME_STATUS.READY) {
            clearInterval(intervalId)
            resolve(updatedVideo) 
          } else if (updatedVideo.frame_status === FRAME_STATUS.ERROR) {
            clearInterval(intervalId)
            reject(new Error('Error al generar las imágenes del video.')) 
          }
        } catch (e) {
          clearInterval(intervalId)
          reject(e)
        }
      }, 3000) 
    })
  }, [apiBase, accessToken])


  const handleConfirm = async () => {
    if (!selectedVideo || !accessToken) return
    
    // ⭐️ Corrección 2: Asegurar que estamos leyendo el frame_status del objeto seleccionado
    const currentStatus = selectedVideo.frame_status;

    if (currentStatus !== FRAME_STATUS.READY) {
      setIsCheckingFrames(true) 
      try {
        const readyVideo = await checkFrameStatus(selectedVideo)
        
        // ⭐️ Corrección 3: Usamos el objeto actualizado readyVideo para el flujo final
        onSelect(readyVideo)
        
        // La limpieza del estado se hace en el finally
      } catch (e: any) {
        console.error(e)
        setError(e.message || 'Error desconocido al verificar la preparación del video.')
        // Al ocurrir un error, reseteamos el error pero mantenemos el modal abierto
        setIsCheckingFrames(false) 
        return // Detenemos el flujo
      } finally {
        setIsCheckingFrames(false) // Ocultar el spinner (esto debería ocurrir)
        setSelectedVideo(null)
        onClose()
      }

    } else {
      // Si ya está READY, continuar con el flujo normal
      onSelect(selectedVideo)
      setSelectedVideo(null)
      onClose()
    }
  }

  // Si estamos comprobando frames, mostramos el GlobalSpinner y bloqueamos la interfaz
  if (isCheckingFrames) {
    return <GlobalSpinner force message="Generando imágenes de tu video" />
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        setIsCheckingFrames(false)
        setSelectedVideo(null)
        onClose()
      }}
      title="Elige un video"
      size="lg"
      footer={
        <div className="flex justify-between w-full">
          {error && <span className="text-sm text-red-600">{error}</span>}
          <div className="flex gap-2 ml-auto">
            <button
              type="button"
              className="px-4 py-2 rounded-xl border text-gray-700 hover:bg-gray-50"
              onClick={() => {
                setSelectedVideo(null)
                onClose()
              }}
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={!selectedVideo || loading}
              className="px-4 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
              onClick={handleConfirm}
            >
              Insertar
            </button>
          </div>
        </div>
      }
    >
      <div className="mb-3 flex justify-start">
        <UploadVideoTriggerButton
          disabled={!accessToken || loading}
          onUploaded={fetchVideos}
        />
      </div>
      {loading ? (
        <p className="text-gray-500 text-sm">Cargando videos…</p>
      ) : videos.length === 0 ? (
        <p className="text-gray-500 text-sm">No tienes videos todavía.</p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[50vh] overflow-auto pr-1">
          {videos.map((v) => {
            const selected = selectedVideo?.id === v.id
            const isPending = v.frame_status === FRAME_STATUS.PENDING || v.frame_status === FRAME_STATUS.PROCESSING
            const isError = v.frame_status === FRAME_STATUS.ERROR
            
            return (
              <li
                key={v.id}
                className={`rounded-lg border overflow-hidden cursor-pointer relative ${
                  selected ? 'ring-2 ring-blue-500' : 'hover:border-gray-400'
                } ${isPending ? 'opacity-70' : ''}`}
                onClick={() => setSelectedVideo(v)}
              >
                {isPending && (
                    <div className="absolute top-1 right-1 bg-yellow-500 text-white text-xs font-bold px-2 py-0.5 rounded z-10">
                        Procesando
                    </div>
                )}
                {isError && (
                    <div className="absolute top-1 right-1 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded z-10">
                        Error
                    </div>
                )}
                <div className="aspect-video bg-black">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {v.thumbnail ? (
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
                  <p className="text-xs text-gray-500">
                    {(v.duration_ms / 1000).toFixed(1)}s • {v.format?.toUpperCase() || '—'}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Modal>
  )
}