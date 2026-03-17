'use client'

import { useCallback, useEffect, useState } from 'react'
import UploadVideoTriggerButton from '@/components/UploadVideoTriggerButton'
import GlobalSpinner from '@/components/GlobalSpinner'
import PickerSelector from '@/components/project/PickerSelector'

export type VideoItem = {
  id: number
  title: string | null
  thumbnail: string | null
  duration_ms: number
  format: string | null
  url?: string | null
  file?: string | null
  frame_status?: 'pending' | 'processing' | 'processing' | 'ready_partial' | 'ready_full' | 'error' | 'error_transient' | null
}

type VideoPickerModalProps = {
  open: boolean
  onClose: () => void
  apiBase: string
  accessToken: string | null
  onSelect: (video: VideoItem) => void | Promise<void>
  busy?: boolean
  error?: string
}

const FRAME_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  READYFULL: 'ready_full',
  ERROR: 'error',
}

function VideoPreview({ video }: { video: VideoItem }) {
  const [aspectRatio, setAspectRatio] = useState<number>(16 / 9)

  return (
    <div
      className="bg-black w-full"
      style={{ aspectRatio: `${aspectRatio}` }}
    >
      {video.url || video.file ? (
        <video
          src={video.url || video.file || undefined}
          poster={video.thumbnail ?? undefined}
          className="w-full h-full object-contain bg-black"
          muted
          playsInline
          preload="metadata"
          onLoadedMetadata={(event) => {
            const { videoWidth, videoHeight } = event.currentTarget
            if (videoWidth > 0 && videoHeight > 0) {
              setAspectRatio(videoWidth / videoHeight)
            }
          }}
        />
      ) : (
        <div className="w-full h-full grid place-items-center text-white text-xs">
          {video.title || `Video #${video.id}`}
        </div>
      )}
    </div>
  )
}

export default function VideoPickerModal({
  open,
  onClose,
  apiBase,
  accessToken,
  onSelect,
  busy = false,
  error: externalError,
}: VideoPickerModalProps) {
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
      setSelectedVideo((prev) => {
        if (!prev) return null
        return list.find((v) => v.id === prev.id) || null
      })
    } catch (e: any) {
      setError(e.message || 'No se pudieron cargar los videos')
    } finally {
      setLoading(false)
    }
  }, [apiBase, accessToken])

  useEffect(() => {
    if (open) {
      void fetchVideos()
      setIsCheckingFrames(false)
    }
  }, [open, fetchVideos])

  const checkFrameStatus = useCallback(
    (video: VideoItem) => {
      if (!accessToken) return Promise.reject(new Error('No hay token de acceso.'))

      return new Promise<VideoItem>((resolve, reject) => {
        const maxRetries = 40
        let retries = 0

        const intervalId = setInterval(async () => {
          if (retries >= maxRetries) {
            clearInterval(intervalId)
            reject(new Error('Tiempo de espera agotado para la generación de imágenes.'))
            return
          }
          retries += 1

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

            if (updatedVideo.frame_status === FRAME_STATUS.READYFULL) {
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
    },
    [apiBase, accessToken],
  )

  const handleConfirm = async () => {
    if (!selectedVideo || !accessToken || busy) return

    const currentStatus = selectedVideo.frame_status

    if (currentStatus !== FRAME_STATUS.READYFULL) {
      setIsCheckingFrames(true)
      try {
        const readyVideo = await checkFrameStatus(selectedVideo)
        await onSelect(readyVideo)
      } catch (e: any) {
        setError(e.message || 'Error desconocido al verificar la preparación del video.')
        setIsCheckingFrames(false)
        return
      } finally {
        setIsCheckingFrames(false)
        setSelectedVideo(null)
        onClose()
      }
    } else {
      await onSelect(selectedVideo)
      setSelectedVideo(null)
      onClose()
    }
  }

  if (isCheckingFrames) {
    return <GlobalSpinner force message="Generando imágenes de tu video" />
  }

  return (
    <PickerSelector
      open={open}
      onClose={() => {
        setIsCheckingFrames(false)
        setSelectedVideo(null)
        onClose()
      }}
      title="Elige un video"
      items={videos}
      selectedItem={selectedVideo}
      onSelectItem={setSelectedVideo}
      onConfirm={handleConfirm}
      confirmLabel="Insertar"
      confirmBusyLabel="Insertando…"
      busy={busy}
      loading={loading}
      error={externalError || error}
      emptyLabel="No tienes videos todavía."
      preListSlot={
        <div className="mb-3 flex justify-start">
          <UploadVideoTriggerButton disabled={!accessToken || loading} onUploaded={fetchVideos} />
        </div>
      }
      renderItem={({ item: v }) => {
        const isPending = v.frame_status === FRAME_STATUS.PENDING || v.frame_status === FRAME_STATUS.PROCESSING
        const isError = v.frame_status === FRAME_STATUS.ERROR
        return (
          <>
            <div className="relative">
              {isPending && (
                <div className="absolute top-1 right-1 bg-yellow-500 text-white text-xs font-bold px-2 py-0.5 rounded z-10">
                  Extrayendo imagenes
                </div>
              )}
              {isError && (
                <div className="absolute top-1 right-1 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded z-10">
                  Error
                </div>
              )}
              <VideoPreview video={v} />
            </div>
            <div className="p-2">
              <p className="text-sm font-medium truncate">{v.title || `Video #${v.id}`}</p>
              <p className="text-xs text-gray-500">{(v.duration_ms / 1000).toFixed(1)}s • {v.format?.toUpperCase() || '—'}</p>
            </div>
          </>
        )
      }}
    />
  )
}
