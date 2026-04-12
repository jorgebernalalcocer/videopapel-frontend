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
  extracted_frames?: number | null
  total_frames?: number | null
  extraction_progress_pct?: number | null
}

type ExtractionProgress = {
  extracted: number
  total: number
  percent: number
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
  const [extractionProgress, setExtractionProgress] = useState<ExtractionProgress | null>(null)

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
      setExtractionProgress(null)
    }
  }, [open, fetchVideos])

  const checkFrameStatus = useCallback(
    async (video: VideoItem) => {
      if (!accessToken) return Promise.reject(new Error('No hay token de acceso.'))

      for (;;) {
        const res = await fetch(`${apiBase}/videos/${video.id}/`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          credentials: 'include',
        })
        if (!res.ok) {
          throw new Error(`Error ${res.status} al verificar el estado de frames.`)
        }

        const updatedVideo: VideoItem = await res.json()
        const extracted = Math.max(0, Number(updatedVideo.extracted_frames ?? 0))
        const total = Math.max(0, Number(updatedVideo.total_frames ?? 0))
        const percent = total > 0
          ? Math.min(100, Math.max(0, Number(updatedVideo.extraction_progress_pct ?? Math.round((extracted * 100) / total))))
          : 0

        setExtractionProgress({ extracted, total, percent })
        setVideos((prev) => prev.map((item) => (item.id === updatedVideo.id ? { ...item, ...updatedVideo } : item)))
        setSelectedVideo((prev) => (prev?.id === updatedVideo.id ? { ...prev, ...updatedVideo } : prev))

        if (updatedVideo.frame_status === FRAME_STATUS.READYFULL) {
          return updatedVideo
        }
        if (updatedVideo.frame_status === FRAME_STATUS.ERROR) {
          throw new Error('Error al generar las imágenes del video.')
        }

        await new Promise((resolve) => setTimeout(resolve, 3000))
      }
    },
    [apiBase, accessToken],
  )

  const handleConfirm = async () => {
    if (!selectedVideo || !accessToken || busy) return

    const currentStatus = selectedVideo.frame_status

    if (currentStatus !== FRAME_STATUS.READYFULL) {
      setIsCheckingFrames(true)
      setExtractionProgress({
        extracted: Math.max(0, Number(selectedVideo.extracted_frames ?? 0)),
        total: Math.max(0, Number(selectedVideo.total_frames ?? 0)),
        percent: Math.max(0, Number(selectedVideo.extraction_progress_pct ?? 0)),
      })
      try {
        const readyVideo = await checkFrameStatus(selectedVideo)
        await onSelect(readyVideo)
        setSelectedVideo(null)
        setExtractionProgress(null)
        onClose()
      } catch (e: any) {
        setError(e.message || 'Error desconocido al verificar la preparación del video.')
        setIsCheckingFrames(false)
        setExtractionProgress(null)
        return
      } finally {
        setIsCheckingFrames(false)
      }
    } else {
      await onSelect(selectedVideo)
      setSelectedVideo(null)
      onClose()
    }
  }

  if (isCheckingFrames) {
    const progressText = extractionProgress && extractionProgress.total > 0
      ? `Generando imágenes de tu video (${extractionProgress.extracted}/${extractionProgress.total}, ${extractionProgress.percent}%)`
      : 'Generando imágenes de tu video'
    return <GlobalSpinner force message={progressText} />
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
        const extracted = Math.max(0, Number(v.extracted_frames ?? 0))
        const total = Math.max(0, Number(v.total_frames ?? 0))
        const percent = total > 0
          ? Math.min(100, Math.max(0, Number(v.extraction_progress_pct ?? Math.round((extracted * 100) / total))))
          : 0
        return (
          <>
            <div className="relative">
              {isPending && (
                <div className="absolute top-1 right-1 bg-yellow-500 text-white text-xs font-bold px-2 py-0.5 rounded z-10">
                  {total > 0 ? `Extrayendo imágenes ${percent}%` : 'Extrayendo imágenes'}
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
              {isPending && total > 0 && (
                <p className="text-xs text-gray-500 mt-1">{extracted} de {total} imágenes extraídas</p>
              )}
            </div>
          </>
        )
      }}
    />
  )
}
